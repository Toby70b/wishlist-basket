import type { Game } from '../domain/game';

/** Outbound port: where the app gets a user's priced wishlist from. */
export interface WishlistSource {
  /**
   * Every wishlist game that has a price, with current GB prices in pence.
   * Free games (price 0) are included; unpriced games (unreleased, delisted) are not.
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
