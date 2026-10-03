import { describe, expect, it, vi } from 'vitest';
import { loadWishlist } from '../../src/application/loadWishlist';
import { WishlistError, type WishlistSource } from '../../src/ports/WishlistSource';
import { makeGame } from '../fixtures/games';

const VALID_ID = '76561197960287930';

function sourceReturning(result: Promise<ReturnType<typeof makeGame>[]>): WishlistSource {
  return { getWishlist: vi.fn(() => result) };
}

describe('loadWishlist', () => {
  it('returns the games from the source', async () => {
    const games = [makeGame(), makeGame()];
    const source = sourceReturning(Promise.resolve(games));

    await expect(loadWishlist(source, VALID_ID)).resolves.toEqual(games);
    expect(source.getWishlist).toHaveBeenCalledWith(VALID_ID);
  });

  it.each(['', '123', 'abcdefghijklmnopq', `${VALID_ID}0`])(
    'rejects %j as an invalid ID without calling the source',
    async (badId) => {
      const source = sourceReturning(Promise.resolve([]));

      const error = await loadWishlist(source, badId).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(WishlistError);
      expect((error as WishlistError).kind).toBe('invalid-id');
      expect(source.getWishlist).not.toHaveBeenCalled();
    },
  );

  it('passes source errors through unchanged', async () => {
    const failure = new WishlistError('private', 'wishlist is private');
    const source = sourceReturning(Promise.reject(failure));

    await expect(loadWishlist(source, VALID_ID)).rejects.toBe(failure);
  });
});
