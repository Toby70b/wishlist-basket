/**
 * Points a game adds to a basket's score.
 *
 * TODO(Toby): implement: wishlistSize + 1 - rank.
 * - Your #1 game scores wishlistSize; your last scores 1. Never 0 or negative.
 * - wishlistSize is N, the total number of games on the wishlist before any filtering.
 *   It must not change with the budget: every game in a basket adds N + 1 - rank, so N
 *   sets how much "more games" counts against "better games".
 * - Basket score = sum of its games' points.
 */
export function gamePoints(rank: number, wishlistSize: number): number {
  void rank;
  void wishlistSize;
  return 0;
}
