import type { Game } from '../../src/domain/game';
import type { ScoredGame } from '../../src/domain/scoring';

let nextAppId = 1000;

/**
 * A Game with sensible defaults; override only what the test cares about.
 * Without overrides it's a basket candidate: released, £9.99, not free.
 */
export function makeGame(overrides: Partial<Game> = {}): Game {
  const appId = overrides.appId ?? nextAppId++;
  // `in`, not `??`: an explicit `price: null` must stay null.
  const price = 'price' in overrides ? (overrides.price ?? null) : 999;
  return {
    appId,
    name: `Game ${appId}`,
    price,
    originalPrice: price,
    discountPercent: 0,
    rank: 1,
    isFree: false,
    isComingSoon: false,
    ...overrides,
  };
}

/** Free to play: Steam gives no price, only is_free. */
export const makeFreeGame = (overrides: Partial<Game> = {}) =>
  makeGame({ price: null, originalPrice: null, isFree: true, ...overrides });

/** Not released and can't be pre-ordered: Steam gives no price. */
export const makeComingSoonGame = (overrides: Partial<Game> = {}) =>
  makeGame({ price: null, originalPrice: null, isComingSoon: true, ...overrides });

/** Not released but can be pre-ordered: Steam gives a price. */
export const makePreOrderGame = (overrides: Partial<Game> = {}) =>
  makeGame({ price: 5999, originalPrice: 5999, isComingSoon: true, ...overrides });

/** A paid game at 100% off: buyable, but costs nothing. */
export const makeGiveawayGame = (overrides: Partial<Game> = {}) =>
  makeGame({ price: 0, originalPrice: 1999, discountPercent: 100, ...overrides });

/** A Game plus the points it adds to a basket; override only what the test cares about. */
export function makeScoredGame(overrides: Partial<Game> & { score?: number } = {}): ScoredGame {
  const { score = 1, ...gameOverrides } = overrides;
  return { game: makeGame(gameOverrides), score: score };
}
