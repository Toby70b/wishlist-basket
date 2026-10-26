import { useEffect, useState } from 'react';
import type { Game } from '../domain/game';
import { planBaskets, type BasketPlan } from '../application/planBaskets';

export type UseBasketsResult = BasketPlan & {
  isComputing: boolean;
};

const NO_GAMES: Game[] = [];

type Computed = { plan: BasketPlan; games: readonly Game[]; budget: number };

const NOTHING_COMPUTED: Computed = { plan: planBaskets(NO_GAMES, 0), games: NO_GAMES, budget: 0 };

/**
 * React wrapper around planBaskets. All the logic lives in application/ and domain/.
 *
 * planBaskets runs synchronously and can take seconds for big wishlists and budgets, and
 * the browser can't repaint while it runs. So the work is deferred until after the next
 * paint: isComputing turns true straight away (so a spinner can be drawn), then the plan is
 * computed. Until it's ready the previous plan is still returned, so results never flash empty.
 *
 * TODO(post-MVP): make findBaskets faster, or move it to a Web Worker so the page stays
 * responsive while it runs.
 */
export function useBaskets(games: Game[] | undefined, budget: number): UseBasketsResult {
  const list = games ?? NO_GAMES;
  const [computed, setComputed] = useState<Computed>(NOTHING_COMPUTED);

  // Derived during render, so the spinner shows in the same render the inputs change.
  const isComputing = computed.games !== list || computed.budget !== budget;

  useEffect(
    () => afterNextPaint(() => setComputed({ plan: planBaskets(list, budget), games: list, budget })),
    [list, budget],
  );

  return { ...computed.plan, isComputing };
}

const PAINT_FALLBACK_MS = 100;

/**
 * Runs `fn` once, just after the browser has painted the current frame, so a spinner is on
 * screen before blocking work starts. Returns a cancel function (for useEffect cleanup).
 *
 * requestAnimationFrame fires just before a paint; the setTimeout inside it runs just after.
 * Browsers pause requestAnimationFrame in background tabs and some embedded views, so a plain
 * timer also starts the work after PAINT_FALLBACK_MS. Whichever comes first wins.
 */
function afterNextPaint(fn: () => void): () => void {
  let done = false;
  let afterFrame: ReturnType<typeof setTimeout> | undefined;
  const run = () => {
    if (done) return;
    done = true;
    fn();
  };
  const frame = requestAnimationFrame(() => {
    afterFrame = setTimeout(run, 0);
  });
  const fallback = setTimeout(run, PAINT_FALLBACK_MS);
  return () => {
    done = true;
    cancelAnimationFrame(frame);
    clearTimeout(afterFrame);
    clearTimeout(fallback);
  };
}
