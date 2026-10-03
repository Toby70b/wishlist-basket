import type { Game } from '../domain/game';
import type { WishlistSource } from '../ports/WishlistSource';

/**
 * Fetches the wishlist and prices from Steam through the Lambda proxy at `/api/*`
 * (Steam sends no CORS headers, so the browser can't call it directly).
 *
 * TODO(Toby): implement getWishlist.
 * - Wishlist: IWishlistService/GetWishlist/v1?steamid=... gives app IDs and priority.
 *   Turn priority into `rank` (1 = top).
 * - Prices: store appdetails with cc=gb&filters=price_overview gives `final` (pence),
 *   `initial` (pence) and `discount_percent`. It's rate limited, so batch and cache.
 * - Names: price_overview doesn't include the name. Get it from another request or from
 *   the proxy.
 * - Skip games with no price_overview (unreleased or delisted). Keep free games as
 *   price 0.
 * - Map failures to WishlistError: private wishlist → 'private', unknown account →
 *   'invalid-id', network errors, 5xx or 429 → 'unavailable'.
 */
export class SteamProxyWishlistSource implements WishlistSource {
  private readonly baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async getWishlist(steamId: string): Promise<Game[]> {
    void steamId;
    throw new Error(`SteamProxyWishlistSource.getWishlist is not implemented yet (proxy: ${this.baseUrl})`);
  }
}
