import type { Game } from './game';
import type { ScoredGame } from './scoring';

/**
 * A basket of games. The invariant is that `total` and `score` always reflect
 * `scoredGames` exactly, so the only way to get a Basket is from already-scored games.
 */
export class Basket {
  readonly scoredGames: ScoredGame[];
  // The total price of all games in the basket, in pence.
  readonly total: number;
  // The sum of each game's points from the ScoringPolicy (see scoring.ts). Higher is better.
  readonly score: number;

  constructor(scoredGames: ScoredGame[]) {
    this.scoredGames = scoredGames;
    this.total = scoredGames.reduce((sum, s) => sum + (s.game.price ?? 0), 0);
    this.score = scoredGames.reduce((sum, s) => sum + s.points, 0);
  }

  get games(): Game[] {
    return this.scoredGames.map((s) => s.game);
  }
}
