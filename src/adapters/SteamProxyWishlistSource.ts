import type {Game} from '../domain/game';
import {WishlistError, type WishlistSource} from '../ports/WishlistSource';

/**
 * Fetches the wishlist with prices from Steam through their API.
 */
export class SteamProxyWishlistSource implements WishlistSource {
    private readonly baseUrl: string;
    private readonly fetchFn: typeof fetch;
    private readonly wishlistPath = '/IWishlistService/GetWishlistSortedFiltered/v1/';

    /**
     * @param baseUrl where /api is served: the Vite dev proxy locally, CloudFront in production
     * @param fetchFn defaults to the browser's fetch; tests pass a fake.
     */
    constructor(baseUrl = '/api', fetchFn: typeof fetch = (input, init) => fetch(input, init)) {
        this.baseUrl = baseUrl;
        this.fetchFn = fetchFn;
    }

    async getWishlist(steamId: string): Promise<Game[]> {
        const url = this.constructUrl(steamId);

        let res: Response;
        try {
            res = await this.fetchFn(url);
        } catch {
            throw new WishlistError('unavailable', 'Could not reach Steam');
        }

        if (!res.ok) {
            if(res.status === 400) {
                throw new WishlistError('invalid-id', `invalid Steam ID: ${steamId}`);
            }
            throw new WishlistError('unavailable', `failed to fetch wishlist from Steam API`);
        }

        let data: any;
        try {
            data = await res.json();
        } catch {
            throw new WishlistError('unavailable', 'Steam returned something that is not JSON');
        }

        if (!data?.response || typeof data.response !== 'object') {
            throw new WishlistError('unavailable', 'Unexpected response from Steam');
        }
        if (!Array.isArray(data.response.items)) {
            // Steam sends {"response":{}} for a private wishlist, and almost certainly for an empty one.
            throw new WishlistError('private', 'Steam returned no wishlist games: private or empty');
        }

        return data.response.items.map((item: any, index: number) => {
            return this.toGame(item, index);
        })
    };

    private constructUrl(steamId: string) {
        const inputJson = JSON.stringify({
            steamid: steamId,
            context: {language: 'english', country_code: 'GB'},
            page_size: 1000
        });
        return `${this.baseUrl}${this.wishlistPath}?input_json=${encodeURIComponent(inputJson)}`;
    }

    private toGame(item: any, index: number) : Game {
        // Steam sometimes returns no store details for a game, even though it is on the wishlist. This can happen if
        // the wishlist is larger than the page_size (1000) and the game is not in the first 1000 games. In this case,
        // we will return a placeholder game with no price information.
        if (!item.store_item) {
            console.warn(`Steam sent no store details for app ${item.appid} (wishlist larger than page_size?)`);
            return {
                appId: item.appid, name: `Unknown game (app ${item.appid})`,
                price: null, originalPrice: null, discountPercent: 0,
                rank: index + 1, isFree: false, isComingSoon: false,
                isBestPurchaseOptionAsPartOfBundle: false,
            };
        }

        const bestPurchaseOption = item.store_item?.best_purchase_option;
        const price = bestPurchaseOption ? Number(bestPurchaseOption.final_price_in_cents) : null;

        return {
            appId: item.appid,
            name: item.store_item.name,
            // Steam's price is in the smallest currency unit (defined by country code so GB = pence)
            price: price,
            // Steam game might not be on sale, so original price might be null. If it is on sale, then original price is the price before discount.
            originalPrice: bestPurchaseOption ? Number(bestPurchaseOption.original_price_in_cents ?? price): null,
            discountPercent: bestPurchaseOption ? bestPurchaseOption.discount_pct ?? 0 : 0,
            rank: this.calculateGameRankFromSteamResponse(index),
            isFree: item.store_item.is_free === true,
            isComingSoon: item.store_item.is_coming_soon === true,
            isBestPurchaseOptionAsPartOfBundle: this.isBestPurchaseOptionAsPartOfBundle(item.store_item)
        };
    }

    /**
     * Calculates the rank of a game from the Steam API response.
     * <br/>
     * Each item has a priority, however, if the user has not ordered the game in their wishlist manually,
     * then Steam will return a priority of 0. Steam does however return the games in the order of the user's wishlist,
     * so we can fall back to the index in this case then add 1 to it to get the rank (1-based).
     *
     * @param index the index of the game in the response
     * @returns the rank of the game
     */
    private calculateGameRankFromSteamResponse(index: number): number {
        return index + 1;
    }

    /**
     * Determines if a store item is part of a bundle. If the best purchase option is a bundle then steam will return a
     * bundleid in the best_purchase_option object.
     * @param store_item the store item from the Steam API response
     * @returns true if the store item is part of a bundle, false otherwise
     */
    private isBestPurchaseOptionAsPartOfBundle(store_item: any) {
        return store_item?.best_purchase_option?.bundleid !== undefined;
    }
}

