import type { Basket } from '../domain/basket';
import type { Game } from '../domain/game';

export type UseBasketsResult = {
  baskets: Basket[];
  isComputing: boolean;
};

/**
 * Best baskets of games affordable within maxBudget.
 *
 * TODO(Toby): implement.
 * - `games` is the full wishlist minus anything the user excluded (the UI filters
 *   exclusions). It still includes free games: drop those and anything over budget
 *   before running findBaskets.
 * - maxBudget is pence. The UI passes the budget the user submitted, and weight is a
 *   fixed 0.5 until the ranking slider returns.
 * - Recompute only when games, maxBudget or weight change. The UI passes stable
 *   references (memoised), so a useMemo/useEffect keyed on them is enough.
 * - Return baskets sorted best first; the UI shows the first 20.
 * - Fill Basket.breakdown with each game's points.
 * - While isComputing is true, keep returning the previous baskets if you can.
 *   The UI also keeps the last result itself if it gets an empty list mid-computation.
 */
export function useBaskets(games: Game[], maxBudget: number, weight: number): UseBasketsResult {
  void games;
  void maxBudget;
  void weight;
  return { baskets: [], isComputing: false };
}
