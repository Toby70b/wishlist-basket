import { describe, expect, it } from 'vitest';
import { RankScoring } from '../../src/domain/scoring';
import { makeGame } from '../fixtures/games';

describe('RankScoring', () => {
  it('scores the #1 game as N (the wishlist size)', () => {
    expect(new RankScoring(10).score(makeGame({ rank: 1 })).points).toBe(10);
  });

  it('scores the last game as 1', () => {
    expect(new RankScoring(10).score(makeGame({ rank: 10 })).points).toBe(1);
  });

  it('drops by one point per rank', () => {
    const scoring = new RankScoring(5);
    const points = [1, 2, 3, 4, 5].map((rank) => scoring.score(makeGame({ rank })).points);

    expect(points).toEqual([5, 4, 3, 2, 1]);
  });

  it('scores a game on a one-game wishlist as 1', () => {
    expect(new RankScoring(1).score(makeGame({ rank: 1 })).points).toBe(1);
  });

  it('is never 0 or negative for any rank on a real-sized wishlist', () => {
    const scoring = new RankScoring(172);

    for (let rank = 1; rank <= 172; rank++) {
      expect(scoring.score(makeGame({ rank })).points).toBeGreaterThanOrEqual(1);
    }
  });

  it('uses the wishlist size, not how many games it is asked to score', () => {
    // Only rank 2 is scored, but the wishlist has 3 games.
    expect(new RankScoring(3).score(makeGame({ rank: 2 })).points).toBe(2);
  });

  it('returns the same game object it was given', () => {
    const game = makeGame({ rank: 3 });

    expect(new RankScoring(5).score(game).game).toBe(game);
  });
});
