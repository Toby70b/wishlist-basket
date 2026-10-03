import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Basket } from '../../src/domain/basket';
import type { Game } from '../../src/domain/game';
import { findBaskets } from '../../src/domain/findBaskets';
import { planBaskets, TOP_N } from '../../src/application/planBaskets';
import { makeComingSoonGame, makeFreeGame, makeGame } from '../fixtures/games';

// planBaskets is tested on its own; the algorithm has its own tests in tests/domain.
vi.mock('../../src/domain/findBaskets', () => ({ findBaskets: vi.fn(() => []) }));
const findBasketsMock = vi.mocked(findBaskets);

function basketOf(games: Game[]): Basket {
  return {
    games,
    total: games.reduce((sum, g) => sum + g.price, 0),
    score: games.length,
    breakdown: games.map((g) => ({ appId: g.appId, points: 1 })),
  };
}

const BUDGET = 2000;

beforeEach(() => {
  findBasketsMock.mockClear();
  findBasketsMock.mockReturnValue([]);
});

describe('planBaskets', () => {
  it('lists free-to-claim games by wishlist rank: free to play and 100% off', () => {
    const freeToPlay = makeFreeGame({ rank: 5 });
    const giveaway = makeGame({ price: 0, originalPrice: 1999, discountPercent: 100, rank: 2 });
    const paid = makeGame({ price: 500, rank: 1 });

    const plan = planBaskets([freeToPlay, paid, giveaway], BUDGET);

    expect(plan.freeGames).toEqual([giveaway, freeToPlay]);
  });

  it('leaves coming-soon games out of both the free list and the baskets', () => {
    const comingSoon = makeComingSoonGame();

    const plan = planBaskets([comingSoon], BUDGET);

    expect(plan.freeGames).toEqual([]);
    expect(findBasketsMock).not.toHaveBeenCalled();
  });

  it('passes only buyable, affordable games to findBaskets', () => {
    const affordable = makeGame({ price: 1500 });
    const tooDear = makeGame({ price: 2500 });

    planBaskets([makeFreeGame(), makeComingSoonGame(), affordable, tooDear], BUDGET);

    expect(findBasketsMock).toHaveBeenCalledWith([affordable], BUDGET, expect.any(Number));
  });

  it('includes a game priced exactly at the budget', () => {
    const exact = makeGame({ price: BUDGET });

    planBaskets([exact], BUDGET);

    expect(findBasketsMock).toHaveBeenCalledWith([exact], BUDGET, 1);
  });

  it('passes the whole wishlist size as N, counting games that were filtered out', () => {
    const games = [makeFreeGame(), makeComingSoonGame(), makeGame({ price: 5000 }), makeGame({ price: 100 })];

    planBaskets(games, BUDGET);

    expect(findBasketsMock).toHaveBeenCalledWith([games[3]], BUDGET, 4);
  });

  it(`returns at most the top ${TOP_N} baskets, in the order findBaskets gives`, () => {
    const game = makeGame({ price: 100 });
    const many = Array.from({ length: TOP_N + 5 }, () => basketOf([game]));
    findBasketsMock.mockReturnValue(many);

    const plan = planBaskets([game], BUDGET);

    expect(plan.baskets).toEqual(many.slice(0, TOP_N));
  });

  it('skips findBaskets when nothing is affordable', () => {
    const plan = planBaskets([makeGame({ price: 5000 })], BUDGET);

    expect(findBasketsMock).not.toHaveBeenCalled();
    expect(plan.baskets).toEqual([]);
  });

  describe('cheapestPrice', () => {
    it('is the cheapest buyable game, even if over budget', () => {
      const plan = planBaskets(
        [makeFreeGame(), makeComingSoonGame(), makeGame({ price: 4500 }), makeGame({ price: 3000 })],
        BUDGET,
      );

      expect(plan.cheapestPrice).toBe(3000);
    });

    it('is null when nothing is buyable', () => {
      expect(planBaskets([makeFreeGame(), makeComingSoonGame()], BUDGET).cheapestPrice).toBeNull();
      expect(planBaskets([], BUDGET).cheapestPrice).toBeNull();
    });
  });
});
