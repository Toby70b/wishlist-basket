import type { Game } from './game';

export type Basket = {
  games: Game[];
  total: number; // pence
  score: number;
  // TODO(Toby): points each game contributed to `score`, for the UI's score breakdown.
  // Should sum to `score`. The UI shows "—" for any game missing from this list.
  breakdown: { appId: number; points: number }[];
};
