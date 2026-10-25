import type { Basket } from './basket';
import type {ScoredGame} from "./scoring.ts";

/**
 * The basket search. Pure: no React, no I/O.
 *
 * TODO(Toby): implement.
 * - `games` arrive already scored and cleaned: only basket candidates (isBasketCandidate:
 *   buyable and costs money), none over `budget`.
 * - Build baskets game by game. Adding a game to an existing basket makes a new basket;
 *   originals never change.
 * - Keep at most 20 baskets per total (per penny); drop the lowest scoring.
 * - Games are scored before they go into baskets, with a ScoringPolicy from scoring.ts
 *   (RankScoring); a basket's score is the sum.
 * - Return every kept basket sorted by score, best first. The caller takes the top N.
 */
export function findBaskets(games: ScoredGame[], budget: number): Basket[] {
  void games;
  void budget;
  return [];
}
