import type { Basket } from '../domain/basket';
import { isBuyable, type Game } from '../domain/game';
import { findBaskets } from '../domain/findBaskets';

export const TOP_N = 20;

export type BasketPlan = {
  baskets: Basket[]; // best first, at most TOP_N
  cheapestPrice: number | null; // cheapest buyable game; null if there are none
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

  const buyable = games.filter(isBuyable);

  const cheapestPrice = buyable.length ? Math.min(...buyable.map((g) => g.price)) : null;

  const affordable = buyable.filter((g) => g.price <= budget);
  const baskets = affordable.length ? findBaskets(affordable, budget).slice(0, TOP_N) : [];

  return { baskets, cheapestPrice };
}
