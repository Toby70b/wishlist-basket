import type { Game } from '../domain/game';
import { WishlistError, type WishlistSource } from '../ports/WishlistSource';

const STEAM_ID_64 = /^\d{17}$/;

/** Loads a priced wishlist through whichever WishlistSource is plugged in. Pure: no React. */
export async function loadWishlist(source: WishlistSource, steamId: string): Promise<Game[]> {
  if (!STEAM_ID_64.test(steamId)) {
    throw new WishlistError('invalid-id', `"${steamId}" is not a 17-digit SteamID64`);
  }
  return source.getWishlist(steamId);
}
