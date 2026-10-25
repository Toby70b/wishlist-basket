import type { Game } from '../domain/game';

/** Outbound port: where the app gets a user's priced wishlist from. */
export interface WishlistSource {
  /**
   * Every game on the wishlist, unfiltered, in Steam's rank order (rank 1 = top), with
   * current GB prices in pence. Free and coming-soon games are included and flagged
   * (isFree, isComingSoon); coming-soon games keep their price if they can be pre-ordered.
   * The domain decides what can go in a basket.
   * Rejects with a WishlistError when the cause is known.
   */
  getWishlist(steamId: string): Promise<Game[]>;
}

export type WishlistErrorKind = 'private' | 'invalid-id' | 'unavailable';

/** The UI reads `kind` to choose its error message. */
export class WishlistError extends Error {
  readonly kind: WishlistErrorKind;

  constructor(kind: WishlistErrorKind, message: string) {
    super(message);
    this.name = 'WishlistError';
    this.kind = kind;
  }
}
