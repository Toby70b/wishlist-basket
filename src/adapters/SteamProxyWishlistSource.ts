import type { Game } from '../domain/game';
import type { WishlistSource } from '../ports/WishlistSource';

/**
 * Fetches the wishlist with prices from Steam through `/api/*`: the Vite dev proxy
 * locally (WireMock or Steam, see STEAM_API_URL), CloudFront in production.
 * Steam sends no CORS headers, so the browser can't call it directly.
 *
 * TODO(Toby): implement getWishlist.
 * - One request: GET {baseUrl}/IWishlistService/GetWishlistSortedFiltered/v1/?input_json=
 *     {"steamid":"…","context":{"language":"english","country_code":"GB"},
 *      "data_request":{},"start_index":0,"page_size":500}
 *   (encodeURIComponent the JSON once).
 * - Paging: if a page comes back with page_size items, fetch the next with
 *   start_index += page_size.
 * - rank = position in the response + 1 (Steam's own "Your rank" order). Don't use
 *   `priority`: it has gaps, is 0 for games never ranked, and disagrees with Steam's order.
 * - Map each item's store_item to Game. Don't filter anything out:
 *     name            ← store_item.name
 *     price           ← Number(best_purchase_option.final_price_in_cents), or null if there's
 *                       no best_purchase_option (free to play, unreleased without pre-order)
 *     originalPrice   ← Number(best_purchase_option.original_price_in_cents), else price
 *                       (Steam omits it when not discounted), or null with no purchase option
 *     discountPercent ← best_purchase_option.discount_pct ?? 0
 *     isFree          ← store_item.is_free === true
 *     isComingSoon    ← store_item.is_coming_soon === true
 * - Errors → WishlistError: check res.ok before res.json() (a bad ID or bad input_json
 *   returns 400 HTML) → 'invalid-id'; an empty {"response":{}} → 'private' (or return []
 *   if you'd rather treat it as empty); network errors, 5xx and 429 → 'unavailable'.
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
