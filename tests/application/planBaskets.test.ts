import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Basket } from '../../src/domain/basket';
import type { Game } from '../../src/domain/game';
import { findBaskets } from '../../src/domain/findBaskets';
import { planBaskets, TOP_N } from '../../src/application/planBaskets';
import { makeComingSoonGame, makeFreeGame, makeGame } from '../fixtures/games';

// planBaskets is tested on its own: the algorithm and scoring have their own tests in tests/domain.
vi.mock('../../src/domain/findBaskets', () => ({ findBaskets: vi.fn(() => []) }));
const findBasketsMock = vi.mocked(findBaskets);

function basketOf(games: Game[], score = games.length): Basket {
  return {
    games,
    total: games.reduce((sum, g) => sum + g.price, 0),
    score,
    breakdown: games.map((g) => ({ appId: g.appId, points: score / games.length })),
  };
}

const BUDGET = 2000;

beforeEach(() => {
  findBasketsMock.mockClear();
  findBasketsMock.mockReturnValue([]);
});

describe('planBaskets', () => {
  describe('choosing which games go to findBaskets', () => {
    it('passes only buyable, affordable games', () => {
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

    it('skips findBaskets when nothing is affordable', () => {
      const plan = planBaskets([makeGame({ price: 5000 })], BUDGET);

      expect(findBasketsMock).not.toHaveBeenCalled();
      expect(plan.baskets).toEqual([]);
    });
  });

  describe('baskets', () => {
    it(`returns at most the top ${TOP_N}, in the order findBaskets gives`, () => {
      const game = makeGame({ price: 100 });
      const many = Array.from({ length: TOP_N + 5 }, () => basketOf([game]));
      findBasketsMock.mockReturnValue(many);

      const plan = planBaskets([game], BUDGET);

      expect(plan.baskets).toEqual(many.slice(0, TOP_N));
    });

    it('never includes coming-soon games', () => {
      const paid = makeGame({ price: 500 });
      findBasketsMock.mockReturnValue([basketOf([paid])]);

      const plan = planBaskets([paid, makeComingSoonGame()], BUDGET);

      expect(plan.baskets[0].games).toEqual([paid]);
    });
  });

  // TODO(Toby): fill these in as you add free games to planBaskets.
  // makeFreeGame() builds a free-to-play game; a 100%-off game is
  // makeGame({ price: 0, originalPrice: 1999, discountPercent: 100 }).
  describe('free games', () => {
    it.todo('are added to every basket: free to play and 100% off');
    it.todo('are not passed to findBaskets');
    it.todo('add their points to the score and breakdown, but nothing to the total');
    it.todo("don't change the order of the baskets");
    it.todo('make a £0 basket on their own when no paid game fits the budget');
    it.todo("don't affect anything when there are none");
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
