import { describe, expect, it } from 'vitest';
import { isBasketCandidate, isBuyable, isFreeToClaim, type Game } from '../../src/domain/game';
import { makeComingSoonGame, makeFreeGame, makeGame, makeGiveawayGame, makePreOrderGame } from '../fixtures/games';

// Every kind of game Steam can return, and how each rule should treat it.
const cases: [string, Game, { buyable: boolean; freeToClaim: boolean; candidate: boolean }][] = [
  ['a normal paid game', makeGame({ price: 1499 }), { buyable: true, freeToClaim: false, candidate: true }],
  ['a discounted game', makeGame({ price: 750, originalPrice: 1499, discountPercent: 50 }), { buyable: true, freeToClaim: false, candidate: true }],
  ['a pre-order', makePreOrderGame(), { buyable: true, freeToClaim: false, candidate: true }],
  ['a 100%-off giveaway', makeGiveawayGame(), { buyable: true, freeToClaim: true, candidate: false }],
  ['a free-to-play game', makeFreeGame(), { buyable: false, freeToClaim: true, candidate: false }],
  ['an unreleased game with no pre-order', makeComingSoonGame(), { buyable: false, freeToClaim: false, candidate: false }],
];

describe.each(cases)('%s', (_, game, expected) => {
  it(`isBuyable is ${expected.buyable}`, () => {
    expect(isBuyable(game)).toBe(expected.buyable);
  });

  it(`isFreeToClaim is ${expected.freeToClaim}`, () => {
    expect(isFreeToClaim(game)).toBe(expected.freeToClaim);
  });

  it(`isBasketCandidate is ${expected.candidate}`, () => {
    expect(isBasketCandidate(game)).toBe(expected.candidate);
  });
});

describe('makeGame', () => {
  it('keeps an explicit null price instead of falling back to the default', () => {
    expect(makeGame({ price: null }).price).toBeNull();
  });
});
