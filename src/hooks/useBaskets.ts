import { useMemo } from 'react';
import type { Game } from '../domain/game';
import { planBaskets, type BasketPlan } from '../application/planBaskets';

export type UseBasketsResult = BasketPlan & {
  isComputing: boolean;
};

const NO_GAMES: Game[] = [];

/**
 * Thin React wrapper around planBaskets. All the logic lives in application/ and domain/.
 * Recomputes only when the games or budget change.
 *
 * isComputing is always false while planBaskets runs synchronously. If findBaskets
 * gets slow enough to block typing, move it into a Web Worker and set isComputing
 * while it runs. Keep returning the previous plan until the new one arrives, so the
 * UI never flashes an empty list.
 */
export function useBaskets(games: Game[] | undefined, budget: number): UseBasketsResult {
  const list = games ?? NO_GAMES;
  const plan = useMemo(() => planBaskets(list, budget), [list, budget]);
  return { ...plan, isComputing: false };
}
