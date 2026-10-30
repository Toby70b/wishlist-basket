import {beforeEach, describe, expect, it, vi} from 'vitest';
import {SteamProxyWishlistSource} from '../../src/adapters/SteamProxyWishlistSource';
import {WishlistError} from "../../src/ports/WishlistSource.ts";

type SteamItemOptions = {
    appid?: number;
    name?: string;
    price?: number | null;      // pence; null = no best_purchase_option at all
    originalPrice?: number | null;    // pence; only sent by Steam when discounted
    discountPct?: number;
    bundle?: boolean;           // bundleid instead of packageid
    isFree?: boolean;
    isComingSoon?: boolean;
    priority?: number;
    noStoreItem?: boolean;      // item with no store_item at all
};

const STEAM_ID = '73561198045226229';
let nextAppid = 1000;

const steamResponse = (body: unknown, status = 200) =>
    async () => new Response(JSON.stringify(body), {status});

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
let source: SteamProxyWishlistSource;


beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>();
    source = new SteamProxyWishlistSource('/api', fetchMock);
});

describe('SteamProxyWishlistSource', () => {
    describe('request', () => {
        it('calls /api/IWishlistService/GetWishlistSortedFiltered/v1/ with a single input_json parameter', async () => {
            fetchMock.mockImplementation(steamResponse(steamWishlist(steamItem({name: 'First', price: 200}))));

            await source.getWishlist(STEAM_ID);

            expect(fetchMock).toHaveBeenCalledWith(
                expect.stringContaining('/api/IWishlistService/GetWishlistSortedFiltered/v1/'),
            );

            const requested = String(fetchMock.mock.calls[0][0]);           // first call, first argument
            const url = new URL(requested, 'http://localhost');
            expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/input_json=/));
            expect([...url.searchParams.keys()]).toEqual(['input_json']);
        });

        it.todo('sends the steam ID as "steamid" (lower case), with country_code GB, language english and page_size 1000');
        it.todo('encodes input_json exactly once (decoding the URL gives back valid JSON)');

        it('uses the base URL it was given, e.g. a different proxy path', async () => {
            const newSource = new SteamProxyWishlistSource('/thisIsABasePath', fetchMock);
            fetchMock.mockImplementation(steamResponse(steamWishlist(steamItem({name: 'First', price: 200}))));

            await newSource.getWishlist(STEAM_ID);

            expect(fetchMock).toHaveBeenCalledWith(
                expect.stringContaining('/thisIsABasePath/IWishlistService/GetWishlistSortedFiltered/v1/'),
            );
        });
    });

    describe('mapping each game', () => {
        it.todo('maps a discounted game: price, originalPrice and discountPercent from best_purchase_option');
        it.todo('maps a full-price game with no original_price_in_cents: originalPrice equals price, discount 0');

        it('converts Steam\'s string prices to numbers in pence', async () => {
            fetchMock.mockImplementation(steamResponse(steamWishlist(
                steamItem({name: 'First', price: 200}),
                steamItem({name: 'Second', price: 300}),
                steamItem({name: 'Third', price: 400}),
                steamItem({name: 'Fourth', price: 500}),
            )));

            const games = await source.getWishlist(STEAM_ID);
            expect(games.map((g) => [g.name, g.price])).toEqual(
                [['First', 200], ['Second', 300], ['Third', 400], ['Fourth', 500]]
            );
        });

        it('maps a pre-order as coming soon with a price', async () => {
            fetchMock.mockImplementation(steamResponse(steamWishlist(
                steamItem({name: 'First', price: 200, isComingSoon: true}),
            )));

            const games = await source.getWishlist(STEAM_ID);
            expect(games[0].isComingSoon).toEqual(true);
            expect(games[0].price).toEqual(200)
            expect(games[0].name).toEqual('First')
        });

        it('maps an unreleased game with no best_purchase_option to price null and originalPrice null', async () => {
            fetchMock.mockImplementation(steamResponse(steamWishlist(
                steamItem({name: 'First', price: null, isComingSoon: true}),
            )));

            const games = await source.getWishlist(STEAM_ID);
            expect(games[0].originalPrice).toEqual(null);
            expect(games[0].price).toEqual(null)
            expect(games[0].name).toEqual('First')
        });

        it('maps a free-to-play game to isFree true and price null', async () => {
            fetchMock.mockImplementation(steamResponse(steamWishlist(
                steamItem({name: 'First', price: null, isFree: true}),
            )));

            const games = await source.getWishlist(STEAM_ID);
            expect(games[0].isFree).toEqual(true);
            expect(games[0].price).toEqual(null)
            expect(games[0].name).toEqual('First')
        });

        it.todo('flags a bundle price (best_purchase_option has bundleid) as isBestPurchaseOptionAsPartOfBundle');
        it.todo('does not flag a single-game package price (best_purchase_option has packageid)');

        it('uses store_item.name as the game name', async () => {
            fetchMock.mockImplementation(steamResponse(steamWishlist(
                steamItem({name: 'First'}),
                steamItem({name: 'Second'}),
                steamItem({name: 'Third'}),
                steamItem({name: 'Fourth'}),
            )));

            const games = await source.getWishlist(STEAM_ID);
            expect(games.map((g) => [g.name])).toEqual(
                [['First'], ['Second'], ['Third'], ['Fourth']]
            );
        });
        it.todo('maps a game with no store_item to an "Unknown game" placeholder with no price, and warns');
    });

    describe('rank', () => {
        it('ranks games by their position in the response, starting at 1', async () => {
            fetchMock.mockImplementation(steamResponse(steamWishlist(
                steamItem({name: 'First', price: 200}),
                steamItem({name: 'Second', price: 300}),
                steamItem({name: 'Third', price: 200}),
                steamItem({name: 'Fourth', price: 300}),
            )));

            const games = await source.getWishlist(STEAM_ID);
            expect(games.map((g) => [g.name, g.rank])).toEqual(
                [['First', 1], ['Second', 2], ['Third', 3], ['Fourth', 4]]
            );
        });

        it('ignores Steam\'s priority field (it has gaps and 0s)', async () => {
            fetchMock.mockImplementation(steamResponse(steamWishlist(
                steamItem({name: 'First', price: 200, priority: undefined}),
                steamItem({name: 'Second', price: 300, priority: 4}),
                steamItem({name: 'Third', price: 200, priority: undefined}),
                steamItem({name: 'Fourth', price: 300, priority: 0}),
            )));

            const games = await source.getWishlist(STEAM_ID);
            expect(games.map((g) => [g.name, g.rank])).toEqual(
                [['First', 1], ['Second', 2], ['Third', 3], ['Fourth', 4]]
            );
        });

        it('keeps every game\'s rank when a game without store_item is in the middle', async () => {
            fetchMock.mockImplementation(steamResponse(steamWishlist(
                steamItem({appid: 123, price: 20}),
                steamItem({appid: 124, price: 300, noStoreItem: true}),
                steamItem({appid: 125, price: 200}),
                steamItem({appid: 126, price: 300}),
            )));

            const games = await source.getWishlist(STEAM_ID);
            expect(games.map((g) => [g.appId, g.rank])).toEqual(
                [[123, 1], [124, 2], [125, 3], [126, 4]]
            );
        });
    });

    describe('errors', () => {
        it('turns a 400 into WishlistError invalid-id', async () => {
            fetchMock.mockImplementation(steamResponse('error', 400));
            const error = await source.getWishlist(STEAM_ID).catch((e) => e);

            expect(error).toBeInstanceOf(WishlistError);
            expect(error.type).toBe('invalid-id');
            expect(error.message).toContain(`invalid Steam ID: ${STEAM_ID}`);
        });

        it('turns private or empty wishlist into WishlistError private', async () => {
            fetchMock.mockImplementation(steamResponse({"response": {}}));
            const error = await source.getWishlist(STEAM_ID).catch((e) => e);

            expect(error).toBeInstanceOf(WishlistError);
            expect(error.type).toBe('private');
            expect(error.message).toContain(`Steam returned no wishlist games: private or empty`);
        });

        it('turns a null response with key into WishlistError unavailable', async () => {
            fetchMock.mockImplementation(steamResponse(null));
            const error = await source.getWishlist(STEAM_ID).catch((e) => e);

            expect(error).toBeInstanceOf(WishlistError);
            expect(error.type).toBe('unavailable');
            expect(error.message).toContain("Unexpected response from Steam");
        });

        it('turns a  response with no response key into WishlistError unavailable', async () => {
            fetchMock.mockImplementation(steamResponse({"foo": "bar"}));
            const error = await source.getWishlist(STEAM_ID).catch((e) => e);

            expect(error).toBeInstanceOf(WishlistError);
            expect(error.type).toBe('unavailable');
            expect(error.message).toContain("Unexpected response from Steam");
        });

        it('turns a 200 with a non-JSON (HTML) body into WishlistError unavailable', async () => {

            fetchMock.mockImplementation(async () =>
                new Response('<html><body>Bad gateway</body></html>', {
                    status: 200,
                    headers: {'Content-Type': 'text/html'},
                }),
            );

            const error = await source.getWishlist(STEAM_ID).catch((e) => e);

            expect(error).toBeInstanceOf(WishlistError);
            expect(error.type).toBe('unavailable');
            expect(error.message).toContain("Steam returned something that is not JSON");
        });

        it.each([500, 429, 503])('turns a %i into WishlistError unavailable', async (status) => {
            fetchMock.mockImplementation(async () => new Response('', {status}));

            await expect(source.getWishlist(STEAM_ID)).rejects.toMatchObject({
                type: 'unavailable',
                message: "failed to fetch wishlist from Steam API"
            });
        })

        it('turns a network failure (fetch rejects) into WishlistError unavailable', async () => {
            fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

            const error = await source.getWishlist(STEAM_ID).catch((e) => e);

            expect(error).toBeInstanceOf(WishlistError);
            expect(error.type).toBe('unavailable');
            expect(error.message).toContain("Could not reach Steam");
        });

        it('returns an empty list for when response contains empty items array', async () => {
            fetchMock.mockImplementation(steamResponse({"response": {"items": []}}));

            const games = await source.getWishlist(STEAM_ID);
            expect(games).toEqual([])
        });
    });
});


/** One wishlist item, shaped like Steam's GetWishlistSortedFiltered response. */
export function steamItem(o: SteamItemOptions = {}) {
    const appid = o.appid ?? nextAppid++;
    const base = {appid, priority: o.priority ?? 0, date_added: 1700000000};
    if (o.noStoreItem) return base;

    const price = o.price === undefined ? 999 : o.price;
    const bestPurchaseOption = price === null ? undefined : {
        ...(o.bundle ? {bundleid: 1} : {packageid: 1}),
        final_price_in_cents: String(price),                        // Steam sends strings
        ...(o.originalPrice !== undefined && {original_price_in_cents: String(o.originalPrice)}),
        ...(o.discountPct !== undefined && {discount_pct: o.discountPct}),
    };

    return {
        ...base,
        store_item: {
            name: o.name ?? `Game ${appid}`,
            ...(o.isFree && {is_free: true}),
            ...(o.isComingSoon && {is_coming_soon: true}),
            ...(bestPurchaseOption && {best_purchase_option: bestPurchaseOption}),
        },
    };
}

export const steamWishlist = (...items: unknown[]) => ({response: {items}});
