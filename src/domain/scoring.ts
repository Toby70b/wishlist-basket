import type { Game } from './game';

/** A game with the points it adds to any basket it's in. */
export type ScoredGame = { game: Game; points: number };

/** How many points a game is worth. Games are scored before they go into baskets. */
export interface ScoringPolicy {
  score(game: Game): ScoredGame;
}

/**
 * Scores by wishlist rank: points = N + 1 - rank. The #1 game scores N, the last scores 1,
 * so every game adds something to a basket.
 * wishlistSize is N, the whole wishlist before any filtering, so a game's points don't
 * change with the budget.
 */
export class RankScoring implements ScoringPolicy {
  // Declared explicitly: tsconfig's erasableSyntaxOnly rules out constructor parameter properties.
  private readonly wishlistSize: number;

  constructor(wishlistSize: number) {
    this.wishlistSize = wishlistSize;
  }

  score(game: Game): ScoredGame {
    return { game, points: this.wishlistSize + 1 - game.rank };
  }
}
