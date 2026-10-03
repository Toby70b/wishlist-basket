import type { Game } from './game';

export type Basket = {
  games: Game[];
  // The total price of all games in the basket, in pence.
  total: number;
  // The sum of each game's points, N + 1 - rank (see scoring.ts). Higher is better.
  score: number;
  // Points each game contributed to `score`, for the UI's score breakdown.
  // Should sum to `score`. The UI shows "—" for any game missing from this list.
  breakdown: { appId: number; points: number }[];
};
