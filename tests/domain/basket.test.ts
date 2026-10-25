import { describe, expect, it } from 'vitest';
import { Basket } from '../../src/domain/basket';
import { makeFreeGame, makeGame, makeGiveawayGame } from '../fixtures/games';

describe('Basket', () => {
  it('derives games from the scored games it was built from', () => {
    const a = makeGame();
    const b = makeGame();

    const basket = new Basket([
      { game: a, points: 3 },
      { game: b, points: 1 },
    ]);

    expect(basket.games).toEqual([a, b]);
  });

  it('totals the price of every game', () => {
    const a = makeGame({ price: 500 });
    const b = makeGame({ price: 1500 });

    const basket = new Basket([
      { game: a, points: 1 },
      { game: b, points: 1 },
    ]);

    expect(basket.total).toBe(2000);
  });

  it('scores as the sum of each game\'s points', () => {
    const a = makeGame();
    const b = makeGame();

    const basket = new Basket([
      { game: a, points: 3 },
      { game: b, points: 7 },
    ]);

    expect(basket.score).toBe(10);
  });

  it('is empty when built from no games', () => {
    const basket = new Basket([]);

    expect(basket.games).toEqual([]);
    expect(basket.total).toBe(0);
    expect(basket.score).toBe(0);
  });

  it('treats free-to-claim games as contributing nothing to total, only to score', () => {
    const paid = makeGame({ price: 1000 });
    const free = makeFreeGame();
    const giveaway = makeGiveawayGame();

    const basket = new Basket([
      { game: paid, points: 5 },
      { game: free, points: 2 },
      { game: giveaway, points: 1 },
    ]);

    expect(basket.total).toBe(1000);
    expect(basket.score).toBe(8);
  });
});
