import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Basket } from '../../src/domain/basket';
import type { Game } from '../../src/domain/game';
import { findBaskets } from '../../src/domain/findBaskets';
import { planBaskets, TOP_N } from '../../src/application/planBaskets';
import { makeComingSoonGame, makeFreeGame, makeGame, makeGiveawayGame, makePreOrderGame } from '../fixtures/games';

// planBaskets is tested on its own: the algorithm and scoring have their own tests in tests/domain.
vi.mock('../../src/domain/findBaskets', () => ({ findBaskets: vi.fn(() => []) }));
const findBasketsMock = vi.mocked(findBaskets);

function basketOf(games: Game[], score = games.length): Basket {
  const points = score / games.length;
  return new Basket(games.map((game) => ({ game, score: points })));
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
      const tooExpensive = makeGame({ price: 2500 });

      planBaskets([makeFreeGame(), makeComingSoonGame(), affordable, tooExpensive], BUDGET);

      expect(findBasketsMock).toHaveBeenCalledWith([{ game: affordable, points: expect.any(Number) }], BUDGET);
    });

    it('includes a game priced exactly at the budget', () => {
      const exact = makeGame({ price: BUDGET });

      planBaskets([exact], BUDGET);

      expect(findBasketsMock).toHaveBeenCalledWith([{ game: exact, points: 1 }], BUDGET);
    });

    it('passes the whole wishlist size as N, counting games that were filtered out', () => {
      const games = [makeFreeGame(), makeComingSoonGame(), makeGame({ price: 5000 }), makeGame({ price: 100 })];

      planBaskets(games, BUDGET);

      // wishlistSize = 4 (whole list); games[3]'s rank defaults to 1, so points = 4 + 1 - 1 = 4
      expect(findBasketsMock).toHaveBeenCalledWith([{ game: games[3], points: 4 }], BUDGET);
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

    it('includes pre-orders, but not unreleased games without a price', () => {
      const preOrder = makePreOrderGame({ price: 1500 });
      const noPriceYet = makeComingSoonGame();

      planBaskets([preOrder, noPriceYet], BUDGET);

      // Works whether findBaskets is given games or scored games ({ game, points }).
      const passed = (findBasketsMock.mock.calls[0][0] as unknown[]).map((g) =>
        'game' in (g as object) ? (g as { game: Game }).game.appId : (g as Game).appId,
      );
      expect(passed).toEqual([preOrder.appId]);
    });
  });

  // makeFreeGame() builds a free-to-play game (price null); makeGiveawayGame() a 100%-off one (price 0).
  describe('free games', () => {
    it('free-to-play games are added to every basket', () => {
      const paid = makeGame({ price: 500 });
      const free = makeFreeGame();
      findBasketsMock.mockReturnValue([basketOf([paid])]);

      const plan = planBaskets([paid, free], BUDGET);

      expect(plan.baskets[0].games.map((g) => g.appId)).toEqual(expect.arrayContaining([paid.appId, free.appId]));
    });

    it('100%-off giveaway games are added to every basket', () => {
      const paid = makeGame({ price: 500 });
      const giveaway = makeGiveawayGame();
      findBasketsMock.mockReturnValue([basketOf([paid])]);

      const plan = planBaskets([paid, giveaway], BUDGET);

      expect(plan.baskets[0].games.map((g) => g.appId)).toEqual(expect.arrayContaining([paid.appId, giveaway.appId]));
    });

    it('are not passed to findBaskets', () => {
      const paid = makeGame({ price: 500 });
      const free = makeFreeGame();
      const giveaway = makeGiveawayGame();

      planBaskets([paid, free, giveaway], BUDGET);

      const passedAppIds = (findBasketsMock.mock.calls[0][0] as { game: Game }[]).map((s) => s.game.appId);
      expect(passedAppIds).toEqual([paid.appId]);
    });

    it('add their points to the score, but nothing to the total', () => {
      const paid = makeGame({ price: 500 });
      const free = makeFreeGame(); // default rank 1
      findBasketsMock.mockReturnValue([basketOf([paid], 10)]);

      const plan = planBaskets([paid, free], BUDGET);

      // wishlistSize = 2 (paid + free); free's points = wishlistSize + 1 - rank = 2 + 1 - 1 = 2
      expect(plan.baskets[0].totalCost).toBe(500);
      expect(plan.baskets[0].score).toBe(12);
    });

    it("don't change the order of the baskets", () => {
      const gameA = makeGame({ price: 100 });
      const gameB = makeGame({ price: 200 });
      findBasketsMock.mockReturnValue([basketOf([gameA], 5), basketOf([gameB], 3)]);
      const free = makeFreeGame();

      const plan = planBaskets([gameA, gameB, free], BUDGET);

      expect(plan.baskets.map((b) => b.games[0].appId)).toEqual([gameA.appId, gameB.appId]);
    });

    it('make a £0 basket on their own when no paid game fits the budget', () => {
      const freeGame = makeFreeGame();
      const expensiveGame = makeGame({ price: 5000 });
      findBasketsMock.mockReturnValue([]);

      const plan = planBaskets([freeGame, expensiveGame], BUDGET);

      expect(plan.baskets).toHaveLength(1);
      expect(plan.baskets[0].games.map((g) => g.appId)).toEqual([freeGame.appId]);
      expect(plan.baskets[0].totalCost).toBe(0);
      expect(plan.cheapestPrice).toBe(5000);
    });

    it("don't affect anything when there are none", () => {
      const paidGame = makeGame({ price: 100 });
      findBasketsMock.mockReturnValue([basketOf([paidGame], 5)]);

      const plan = planBaskets([paidGame], BUDGET);

      expect(plan.baskets).toHaveLength(1);
      expect(plan.baskets[0].games.map((g) => g.appId)).toEqual([paidGame.appId]);
      expect(plan.baskets[0].score).toBe(5);
      expect(plan.baskets[0].totalCost).toBe(100);
    });

    it('are scored against the whole wishlist size, the same as paid games', () => {
      const paid = makeGame({ price: 500 });
      const free = makeFreeGame({ rank: 2 });
      findBasketsMock.mockReturnValue([basketOf([paid], 0)]);

      const plan = planBaskets([paid, free], BUDGET);

      // wishlistSize = 2 (paid + free); free's points = 2 + 1 - 2 = 1
      expect(plan.baskets[0].score).toBe(1);
    });

    it('are added to every basket independently, with no shared state leaking between baskets', () => {
      const gameA = makeGame({ price: 100 });
      const gameB = makeGame({ price: 200 });
      findBasketsMock.mockReturnValue([basketOf([gameA]), basketOf([gameB])]);
      const free = makeFreeGame();

      const plan = planBaskets([gameA, gameB, free], BUDGET);

      expect(plan.baskets[0].games.map((g) => g.appId)).toContain(free.appId);
      expect(plan.baskets[1].games.map((g) => g.appId)).toContain(free.appId);
      expect(plan.baskets[0].scoredGames).not.toBe(plan.baskets[1].scoredGames);
    });
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

    it('excludes free-to-claim games (free-to-play and 100%-off) even when they are the cheapest', () => {
      const paid = makeGame({ price: 3000 });
      const giveaway = makeGiveawayGame();
      const free = makeFreeGame();

      const plan = planBaskets([paid, giveaway, free], BUDGET);

      expect(plan.cheapestPrice).toBe(3000);
    });
  });

  describe('purity', () => {
    it('does not mutate the baskets returned by findBaskets when adding free games', () => {
      const paid = makeGame({ price: 500 });
      const originalBasket = basketOf([paid]);
      const originalAppIds = originalBasket.games.map((g) => g.appId);
      findBasketsMock.mockReturnValue([originalBasket]);
      const free = makeFreeGame();

      const plan = planBaskets([paid, free], BUDGET);

      expect(originalBasket.games.map((g) => g.appId)).toEqual(originalAppIds);
      expect(plan.baskets[0]).not.toBe(originalBasket);
    });
  });
});
