export type Game = {
  appId: number;
  name: string;
  // Pence, after any current discount. null when Steam offers no way to buy it
  // (free to play, or unreleased and not available to pre-order).
  price: number | null;
  originalPrice: number | null; // pence, before discount; null whenever price is null
  discountPercent: number; // 0–100
  rank: number; // wishlist position, 1 = top
  isFree: boolean; // free to play (Steam's is_free). Needed because these have no price
  isComingSoon: boolean; // not released yet; has a price only if it can be pre-ordered
  isBestPurchaseOptionAsPartOfBundle: boolean; // true if the best purchase option is part of a bundle, false if not
};

/** Steam will sell it to you: paid, discounted, 100% off, or pre-order. */
export function isBuyable(game: Game): boolean {
  return game.price !== null;
}

/** Costs nothing: free to play, or a buyable game at 100% off. */
export function isFreeToClaim(game: Game): boolean {
  return game.isFree || game.price === 0;
}

/** Goes into findBaskets: you can buy it and it costs money. */
export function isBasketCandidate(game: Game): boolean {
  return isBuyable(game) && !isFreeToClaim(game);
}
