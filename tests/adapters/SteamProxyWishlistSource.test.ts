import { describe, it } from 'vitest';

// TODO(Toby): replace these placeholders with real tests.
//
// Fake Steam by passing a fetch as the adapter's second constructor argument, e.g.
//   const fakeFetch = vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
//   const source = new SteamProxyWishlistSource('/api', fakeFetch);
// fakeFetch.mock.calls[0][0] is the URL the adapter requested.
// Build `body` from items trimmed out of a real GetWishlistSortedFiltered response.

describe('SteamProxyWishlistSource', () => {
  describe('request', () => {
    it.todo('calls /api/IWishlistService/GetWishlistSortedFiltered/v1/ with a single input_json parameter');
    it.todo('sends the steam ID as "steamid" (lower case), with country_code GB, language english and page_size 1000');
    it.todo('encodes input_json exactly once (decoding the URL gives back valid JSON)');
    it.todo('uses the base URL it was given, e.g. a different proxy path');
  });

  describe('mapping each game', () => {
    it.todo('maps a discounted game: price, originalPrice and discountPercent from best_purchase_option');
    it.todo('maps a full-price game with no original_price_in_cents: originalPrice equals price, discount 0');
    it.todo('converts Steam\'s string prices to numbers in pence');
    it.todo('maps a pre-order (is_coming_soon with a best_purchase_option) as coming soon with a price');
    it.todo('maps an unreleased game with no best_purchase_option to price null and originalPrice null');
    it.todo('maps a free-to-play game (is_free, no best_purchase_option) to isFree true and price null');
    it.todo('flags a bundle price (best_purchase_option has bundleid) as isBestPurchaseOptionAsPartOfBundle');
    it.todo('does not flag a single-game package price (best_purchase_option has packageid)');
    it.todo('uses store_item.name as the game name');
    it.todo('maps a game with no store_item to an "Unknown game" placeholder with no price, and warns');
    it.todo('never produces NaN prices');
  });

  describe('rank', () => {
    it.todo('ranks games by their position in the response, starting at 1');
    it.todo('ignores Steam\'s priority field (it has gaps and 0s)');
    it.todo('keeps every game\'s rank when a game without store_item is in the middle');
  });

  describe('errors', () => {
    it.todo('turns a 400 into WishlistError invalid-id');
    it.todo('turns {"response":{}} (private or empty wishlist) into WishlistError private');
    it.todo('turns a response with no "response" key into WishlistError unavailable');
    it.todo('turns a 200 with a non-JSON (HTML) body into WishlistError unavailable');
    it.todo('turns a 500 and a 429 into WishlistError unavailable');
    it.todo('turns a network failure (fetch rejects) into WishlistError unavailable');
  });

  it.todo('returns an empty list for {"response":{"items":[]}}');
});
