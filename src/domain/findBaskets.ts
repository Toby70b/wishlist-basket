import type { Basket } from './basket';
import type { Game } from './game';

/**
 * The basket search. Pure: no React, no I/O.
 *
 * TODO(Toby): implement.
 * - `games` arrive already cleaned: only buyable games (isBuyable), none over `budget`.
 * - `wishlistSize` is N for scoring: the full wishlist length, before any filtering.
 * - Build baskets game by game. Adding a game to an existing basket makes a new basket;
 *   originals never change.
 * - Keep at most 20 baskets per total (per penny); drop the lowest scoring.
 * - Games are scored before they go into baskets, with a ScoringPolicy from scoring.ts
 *   (RankScoring); a basket's score is the sum. Fill Basket.breakdown with each game's points.
 * - Return every kept basket sorted by score, best first. The caller takes the top N.
 */
export function findBaskets(games: Game[], budget: number): Basket[] {
  void games;
  void budget;
  return [];
}
