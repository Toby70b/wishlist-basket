import {describe, expect, it} from 'vitest';
import {findBaskets} from "../../src/domain/findBaskets.ts";
import {makeScoredGame} from "../fixtures/games.ts";

// makeGame() in tests/fixtures/games.ts builds test games.

const BUDGET = 1000;

describe('findBaskets', () => {

    it('returns an empty array when given no games', () => {
        expect(findBaskets([], BUDGET)).toEqual([]);
    });

    it('returns a basket for each single affordable game', () => {
        const a = makeScoredGame();
        const b = makeScoredGame();

        const baskets = findBaskets([a, b], BUDGET);

        expect(baskets.length).toBeGreaterThanOrEqual(2)
        expect(baskets[0].scoredGames).toContainEqual(a);
        expect(baskets[1].scoredGames).toContainEqual(b);
    })

    it('combines games into multi-game baskets when they fit within budget together', () => {
        const a = makeScoredGame({price: 400, score: 1});
        const b = makeScoredGame({price: 500, score: 2});

        const baskets = findBaskets([a, b], BUDGET);

        expect(baskets).toHaveLength(3);
        expect(baskets[0].scoredGames.map(g => g).sort()).toEqual([a, b].sort());
        expect(baskets[2].scoredGames).toContain(a);
        expect(baskets[1].scoredGames).toContain(b);
    });

    it("a basket's total is the sum of its games' prices", () => {
        const a = makeScoredGame({price: 400, score: 1});
        const b = makeScoredGame({price: 500, score: 2});

        const baskets = findBaskets([a, b], BUDGET);

        expect(baskets).toHaveLength(3);

        expect(baskets[0].scoredGames.map(g => g).sort()).toEqual([a, b].sort());
        expect(baskets[0].totalCost).toBe(900);

        expect(baskets[1].scoredGames).toContain(b);
        expect(baskets[1].totalCost).toBe(500);

        expect(baskets[2].scoredGames).toContain(a);
        expect(baskets[2].totalCost).toBe(400);
    });
    it("a basket's score is the sum of its games' points", () => {
        const a = makeScoredGame({price: 400, score: 1});
        const b = makeScoredGame({price: 500, score: 2});

        const baskets = findBaskets([a, b], BUDGET);

        expect(baskets).toHaveLength(3);
        expect(baskets[0].scoredGames.map(g => g).sort()).toEqual([a, b].sort());
        expect(baskets[0].score).toBe(3);

        expect(baskets[1].scoredGames).toContain(b);
        expect(baskets[1].score).toBe(2);

        expect(baskets[2].scoredGames).toContain(a);
        expect(baskets[2].score).toBe(1);
    });

    it('never returns a basket over budget', () => {
        const a = makeScoredGame({price: 400, score: 1});
        const b = makeScoredGame({price: 500, score: 4});
        const c = makeScoredGame({price: 1000, score: 3});
        const d = makeScoredGame({price: 1100, score: 4});

        const baskets = findBaskets([a, b, c, d], BUDGET);

        expect(baskets).toHaveLength(4);
        expect(baskets[0].scoredGames.map(g => g).sort()).toEqual([a, b].sort());
        expect(baskets[1].scoredGames).toContain(b);
        expect(baskets[2].scoredGames).toContain(c);
        expect(baskets[3].scoredGames).toContain(a);
    });

    it('never returns the same set of games as two different baskets', () => {
        const a = makeScoredGame({price: 100});
        const b = makeScoredGame({price: 200});
        const c = makeScoredGame({price: 300});

        const baskets = findBaskets([a, b, c], BUDGET);

        const signatures = baskets.map((basket) =>
            basket.scoredGames
                .map((s) => s.game.appId)
                .sort((x, y) => x - y)
                .join(','),
        );

        expect(new Set(signatures).size).toBe(signatures.length);
    });

    it('returns baskets sorted by score, best first', () => {
        const a = makeScoredGame({price: 400, score: 1});
        const b = makeScoredGame({price: 500, score: 5});
        const c = makeScoredGame({price: 600, score: 3});

        const baskets = findBaskets([a, b, c], BUDGET);

        expect(baskets.map((basket) => basket.score)).toEqual([6, 5, 4, 3, 1]);
    });

    it('gives the same results whatever order the games are in', () => {
        const a = makeScoredGame({price: 400, score: 1});
        const b = makeScoredGame({price: 500, score: 4});
        const c = makeScoredGame({price: BUDGET, score: 3});
        const d = makeScoredGame({price: 1100, score: 4});

        const basketsResult1 = findBaskets([a, b, c, d], BUDGET);
        const basketsResult2 = findBaskets([d, c, a, b], BUDGET);

        expect(basketsResult1).toEqual(basketsResult2);
    });

    it('keeps at most 20 baskets per total', () => {
        const price = 10;
        const games = Array.from({length: 7}, (_, i) => makeScoredGame({price, score: i}));

        // budget allows exactly 2 games (2*price), but blocks any 3-game combination (3*price > budget)
        const baskets = findBaskets(games, price * 2);

        const pairBaskets = baskets.filter((b) => b.totalCost === price * 2);
        expect(pairBaskets).toHaveLength(20); // C(7,2) = 21 distinct pairs, each a genuine 2-game combination, capped to 20
    });

    it('when more than 20 baskets share the same total, keeps the 20 highest-scoring and drops the rest', () => {
        const price = 10;
        const games = Array.from({ length: 7 }, (_, i) => makeScoredGame({ price, score: i }));

        const baskets = findBaskets(games, price * 2);

        const pairScores = baskets
            .filter((b) => b.totalCost === price * 2)
            .map((b) => b.score)
            .sort((a, b) => a - b);

        // 21 raw pairs, sorted sums: [1,2,3,3,4,4,5,5,5,6,6,6,7,7,7,8,8,9,9,10,11]
        // capping to 20 should drop only the lowest (the 0+1 pair, sum=1)
        expect(pairScores).toEqual([2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 9, 9, 10, 11]);
    });
});