import { useQuery } from '@tanstack/react-query';
import type { Game } from '../domain/game';
import { loadWishlist } from '../application/loadWishlist';
import { WishlistError } from '../ports/WishlistSource';
import { useWishlistSource } from './WishlistSourceContext';

export type UseWishlistResult = {
  games: Game[] | undefined;
  isLoading: boolean;
  error: Error | null;
};

const MAX_RETRIES = 2;

/** Retrying can't fix a private wishlist or a bad ID; only retry when Steam may recover. */
function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof WishlistError && error.kind !== 'unavailable') return false;
  return failureCount < MAX_RETRIES;
}

/**
 * Loads the wishlist (with current GB prices) for a Steam ID.
 * Thin wrapper: the logic lives in application/loadWishlist.ts, and the adapter comes
 * from context.
 *
 * Fetches once per Steam ID: re-submitting the same ID with a new budget hits the cache.
 * steamId === '' means nothing has been entered yet, so the query stays idle.
 */
export function useWishlist(steamId: string): UseWishlistResult {
  const source = useWishlistSource();

  const query = useQuery({
    queryKey: ['wishlist', steamId],
    queryFn: () => loadWishlist(source, steamId),
    enabled: steamId !== '',
    retry: shouldRetry,
  });

  // isLoading, not isPending: a disabled query is "pending" forever, which would show
  // a spinner before any ID is entered.
  return { games: query.data, isLoading: query.isLoading, error: query.error };
}
