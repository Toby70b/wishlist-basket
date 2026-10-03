export type Game = {
  appId: number;
  name: string;
  price: number; // final price in pence, after any current discount; 0 if Steam gives no price
  originalPrice: number; // pence, before discount; 0 if Steam gives no price
  discountPercent: number; // 0–100
  rank: number; // wishlist position, 1 = top
  isFree: boolean; // free to play (Steam's is_free); has no price
  isComingSoon: boolean; // not released yet; has no price
};

/** Can go in a basket: released and costs something. */
export function isBuyable(game: Game): boolean {
  return !game.isFree && !game.isComingSoon && game.price > 0;
}

/** Can be had for nothing right now: free to play, or a paid game at 100% off. */
export function isFreeToClaim(game: Game): boolean {
  return !game.isComingSoon && (game.isFree || game.price === 0);
}
