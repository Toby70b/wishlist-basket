import { WishlistError, type WishlistSource } from '../ports/WishlistSource';
import type { Game } from '../domain/game';
import { REAL_WISHLIST } from './mock/realWishlist';

/**
 * Dev-only stand-in for Steam (npm run dev:mock). The Steam ID you type picks a scenario,
 * so every state of the page can be tried. Any ID not listed gets the full real wishlist.
 * Names are prefixed [FAKE] so mock data is obvious on screen.
 */
export const MOCK_STEAM_IDS = {
  empty: '76561190000000001', // "Your wishlist is empty"
  private: '76561190000000002', // private-wishlist error
  unavailable: '76561190000000003', // "Steam is not responding"
  freeOnly: '76561190000000004', // only free games: a single £0 basket
  expensiveOnly: '76561190000000005', // £40+ games only: "Nothing affordable" at a £20 budget
  unreleasedOnly: '76561190000000006', // nothing buyable at all
  small: '76561190000000007', // 8 games covering every kind of game
} as const;

const DELAY_MS = 600; // long enough to see the loading spinner

const byId = new Map(REAL_WISHLIST.map((g) => [g.appId, g]));
const pick = (...appIds: number[]): Game[] => appIds.map((id) => byId.get(id)!);

/** Re-rank a subset 1..n in its existing order, as Steam would for a smaller wishlist. */
const reRank = (games: readonly Game[]): Game[] => games.map((g, i) => ({ ...g, rank: i + 1 }));

// One of each kind of game. The real wishlist has no 100%-off giveaway, so one is made up.
const SMALL_WISHLIST: Game[] = reRank([
  ...pick(
    482400, // System Shock: discounted 70%
    1244090, // Sea of Stars: full price
    2769570, // Fable: pre-order (coming soon, has a price)
    4199910, // Total War: WARHAMMER 40,000: unreleased, no price
    3354750, // skate.: free to play
    848350, // Katamari Damacy REROLL: cheap, 75% off
    2677660, // Indiana Jones: expensive
  ),
  { ...byId.get(1313140)!, price: 0, discountPercent: 100 }, // Cult of the Lamb as a 100%-off giveaway
]);

function scenario(steamId: string): Game[] {
  switch (steamId) {
    case MOCK_STEAM_IDS.empty:
      return [];
    case MOCK_STEAM_IDS.private:
      throw new WishlistError('private', 'Mock: this wishlist is private');
    case MOCK_STEAM_IDS.unavailable:
      throw new WishlistError('unavailable', 'Mock: Steam is not responding');
    case MOCK_STEAM_IDS.freeOnly:
      return reRank(REAL_WISHLIST.filter((g) => g.isFree));
    case MOCK_STEAM_IDS.expensiveOnly:
      return reRank(REAL_WISHLIST.filter((g) => g.price !== null && g.price >= 4000));
    case MOCK_STEAM_IDS.unreleasedOnly:
      return reRank(REAL_WISHLIST.filter((g) => g.price === null && !g.isFree));
    case MOCK_STEAM_IDS.small:
      return SMALL_WISHLIST;
    default:
      return [...REAL_WISHLIST];
  }
}

export class MockWishlistSource implements WishlistSource {
  async getWishlist(steamId: string): Promise<Game[]> {
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    return scenario(steamId).map((g) => ({ ...g, name: `[FAKE] ${g.name}` }));
  }
}
