import { describe, it } from 'vitest';

// TODO(Toby): replace these placeholders with real tests as findBaskets and scoring are written.
// makeGame() in tests/fixtures/games.ts builds test games.
describe('findBaskets', () => {
  it.todo('returns an empty array when given no games');
  it.todo('returns a basket for each single affordable game');
  it.todo('combines games into multi-game baskets when they fit within budget together');
  it.todo("a basket's total is the sum of its games' prices");
  it.todo("a basket's score is the sum of its games' points");
  it.todo('never returns a basket over budget');
  it.todo('never returns the same set of games as two different baskets');
  it.todo('building a new basket from an existing one does not mutate the original');
  it.todo('returns baskets sorted by score, best first');
  it.todo('gives the same results whatever order the games are in');
  it.todo('keeps at most 20 baskets per total');
  it.todo('when more than 20 baskets share the same total, keeps the 20 highest-scoring and drops the rest');
});
