import type { Basket } from '../domain/basket';
import { isBuyable, isFreeToClaim, type Game } from '../domain/game';
import { findBaskets } from '../domain/findBaskets';

export const TOP_N = 20;

export type BasketPlan = {
  baskets: Basket[]; // best first, at most TOP_N
  freeGames: Game[]; // free to claim now, by wishlist rank; never part of a basket
  cheapestPrice: number | null; // cheapest buyable game; null if there are none
};

/**
 * Everything the results page needs from a wishlist. Pure: no React, no I/O.
 * `games` is the whole wishlist, unfiltered (free and coming-soon games included).
 */
export function planBaskets(games: readonly Game[], budget: number): BasketPlan {
  const freeGames = games.filter(isFreeToClaim).sort((a, b) => a.rank - b.rank);
  const buyable = games.filter(isBuyable);

  const cheapestPrice = buyable.length ? Math.min(...buyable.map((g) => g.price)) : null;

  const affordable = buyable.filter((g) => g.price <= budget);
  // N for scoring is the whole wishlist, so points don't shift with the budget.
  const baskets = affordable.length ? findBaskets(affordable, budget, games.length).slice(0, TOP_N) : [];

  return { baskets, freeGames, cheapestPrice };
}
