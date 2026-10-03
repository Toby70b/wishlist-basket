import type { Game } from '../../src/domain/game';

let nextAppId = 1000;

/** A buyable Game with sensible defaults; override only what the test cares about. */
export function makeGame(overrides: Partial<Game> = {}): Game {
  const appId = overrides.appId ?? nextAppId++;
  const price = overrides.price ?? 999;
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

/** Free to play: Steam gives no price. */
export const makeFreeGame = (overrides: Partial<Game> = {}) =>
  makeGame({ price: 0, originalPrice: 0, isFree: true, ...overrides });

/** Not released yet: Steam gives no price. */
export const makeComingSoonGame = (overrides: Partial<Game> = {}) =>
  makeGame({ price: 0, originalPrice: 0, isComingSoon: true, ...overrides });
