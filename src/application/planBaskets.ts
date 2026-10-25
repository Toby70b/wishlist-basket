import type { Basket } from '../domain/basket';
import { isBasketCandidate, type Game } from '../domain/game';
import { findBaskets } from '../domain/findBaskets';
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
 * TODO(Toby): score the buyable games and add free games (isFreeToClaim) to every basket.
 */
export function planBaskets(games: readonly Game[], budget: number): BasketPlan {
  // N for scoring is the whole wishlist, so points don't shift with the budget.
  const wishlistSize = games.length;

  const rankScoring  = new RankScoring(wishlistSize);

  // Buyable and costs money. Free-to-claim games are added to every basket instead.
  const candidates = games.filter(isBasketCandidate);

  const cheapestPrice = candidates.length ? Math.min(...candidates.map((g) => g.price)) : null;

  const affordableGames = candidates.filter((g) => g.price <= budget);

  const rankedAffordable = affordableGames.map(game => rankScoring.score(game));

  const baskets = affordableGames.length ? findBaskets(rankedAffordable, budget).slice(0, TOP_N) : [];


  return { baskets, cheapestPrice };
}
