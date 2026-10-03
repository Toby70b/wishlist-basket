import type { Game } from '../domain/game';

export type UseWishlistResult = {
  games: Game[] | undefined;
  isLoading: boolean;
  error: Error | null;
};

/**
 * Loads the wishlist (with current GB prices) for a Steam ID.
 *
 * TODO(Toby): implement.
 * - Get the WishlistSource from React context (never import an adapter here).
 * - Use TanStack Query, keyed by steamId, so it fetches once per Steam ID.
 *   Changing only the budget re-submits the same ID and must not refetch.
 * - steamId === '' means "nothing entered yet": stay idle (`enabled: !!steamId`) and
 *   return { games: undefined, isLoading: false, error: null }.
 * - Errors: the UI picks its message from an optional `kind` on the error:
 *     'private'     → wishlist isn't public
 *     'invalid-id'  → no such Steam account
 *     'unavailable' → Steam / proxy down or rate limited
 *   Anything else falls back to error.message.
 * - Free games (price 0) should still be returned; the UI lists them separately.
 * - Games with no price (unreleased, delisted) should already be dropped by the adapter.
 */
export function useWishlist(steamId: string): UseWishlistResult {
  void steamId;
  return { games: undefined, isLoading: false, error: null };
}
