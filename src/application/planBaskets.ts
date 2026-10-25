import {Basket} from '../domain/basket';
import {isBasketCandidate, type Game, isFreeToClaim} from '../domain/game';
import {findBaskets} from '../domain/findBaskets';
import {RankScoring} from "../domain/scoring.ts";

export const TOP_N = 20;

export type BasketPlan = {
    baskets: Basket[]; // best first, at most TOP_N
    cheapestPrice: number | null; // cheapest basket candidate; null if there are none
};

/**
 * Everything the results page needs from a wishlist. Pure: no React, no I/O.
 * `games` is the whole wishlist, unfiltered (free and coming-soon games included).
 *
 */
export function planBaskets(games: readonly Game[], budget: number): BasketPlan {
    // N for scoring is the whole wishlist, so points don't shift with the budget.
    const wishlistSize = games.length;

    const rankScoring = new RankScoring(wishlistSize);

    // Buyable and costs money. Free-to-claim games are added to every basket later.
    const candidates = games.filter(isBasketCandidate);

    const affordableGames = candidates.filter((g) => (g.price ?? 0) <= budget);

    const rankedAffordable = affordableGames.map(game => rankScoring.score(game));

    const freeGames = games.filter(isFreeToClaim).map(game => rankScoring.score(game));

    const foundBaskets = affordableGames.length ? findBaskets(rankedAffordable, budget).slice(0, TOP_N) : [];
    const baskets = foundBaskets.length ? foundBaskets : (freeGames.length ? [new Basket([])] : []);

    const basketsWithFreeGames = baskets.map((basket) => new Basket([...basket.scoredGames, ...freeGames]));

    // Calculate the cheapest game in the wishlist that is buyable and costs money. This is used to show the user the
    // cheapest game they could buy, even if it doesn't fit in a basket.
    const cheapestPrice = candidates.length ? Math.min(...candidates.map((g) => g.price ?? 0)) : null;

    return {baskets: basketsWithFreeGames, cheapestPrice};
}
