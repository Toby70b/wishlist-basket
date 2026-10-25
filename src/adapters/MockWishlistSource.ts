import type {WishlistSource} from "../ports/WishlistSource.ts";
import type {Game} from "../domain/game.ts";

export class MockWishlistSource implements WishlistSource {

    async getWishlist(steamId: string): Promise<Game[]> {
        void steamId;
        return [
            { appId: 1145360, name: '[FAKE] Hades', price: 524, originalPrice: 2099, discountPercent: 75,
                rank: 1, isFree: false, isComingSoon: false },
            { appId: 620, name: '[FAKE] Portal 2', price: 170, originalPrice: 850, discountPercent: 80,
                rank: 2, isFree: false, isComingSoon: false },
        ]
    }
}
