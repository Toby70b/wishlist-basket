import { describe, expect, it } from 'vitest';
import { isBuyable, isFreeToClaim } from '../../src/domain/game';
import { makeComingSoonGame, makeFreeGame, makeGame } from '../fixtures/games';

const giveaway = makeGame({ price: 0, originalPrice: 1999, discountPercent: 100 });

describe('isBuyable', () => {
  it('is true for a released game with a price', () => {
    expect(isBuyable(makeGame({ price: 999 }))).toBe(true);
  });

  it.each([
    ['free to play', makeFreeGame()],
    ['coming soon', makeComingSoonGame()],
    ['100% off', giveaway],
  ])('is false when %s', (_, game) => {
    expect(isBuyable(game)).toBe(false);
  });
});

describe('isFreeToClaim', () => {
  it.each([
    ['free to play', makeFreeGame()],
    ['100% off', giveaway],
  ])('is true when %s', (_, game) => {
    expect(isFreeToClaim(game)).toBe(true);
  });

  it.each([
    ['a paid game', makeGame({ price: 999 })],
    ['coming soon (no price yet, not free)', makeComingSoonGame()],
  ])('is false for %s', (_, game) => {
    expect(isFreeToClaim(game)).toBe(false);
  });
});
