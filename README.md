# Wishlist Budget

Enter your Steam ID and a budget, and see the best combinations ("baskets") of games from your
Steam wishlist that you can buy right now at current UK sale prices.

Baskets favour the games you've ranked highest on your wishlist. Free games (free to play, or
100% off) are added to every basket, and games you can only get cheapest as part of a bundle are
marked with an asterisk.

## How it works

1. **Fetch:** one request to Steam's `IWishlistService/GetWishlistSortedFiltered` returns the
   whole wishlist in your own rank order, with names and GB prices.
2. **Filter:** games with no price (unreleased, not on sale) are left out; free games are kept
   aside to add to every basket.
3. **Score:** each game is worth `N + 1 − rank` points, where N is the size of the wishlist. Your
   #1 game scores N, your last scores 1.
4. **Search:** `findBaskets` builds every affordable combination game by game, keeping the 20
   highest-scoring baskets for each total price, then returns the best 20 overall.

Everything runs in the browser; there's no backend. Steam doesn't send CORS headers, so requests
go to `/api/…` on the same domain, which forwards them to Steam: the Vite dev server does this
locally, CloudFront in production.

## Architecture

Hexagonal (ports and adapters), kept light:

```
src/
  domain/       Game, Basket, scoring, findBaskets: pure TypeScript, no React
  application/  planBaskets (filter → score → search → add free games), loadWishlist
  ports/        WishlistSource: the interface the app needs ("give me a priced wishlist")
  adapters/     SteamProxyWishlistSource (real Steam), MockWishlistSource (dev only)
  hooks/        useWishlist (TanStack Query), useBaskets, the WishlistSource context
  components/   React UI
  main.tsx      Composition root: the only file that chooses an adapter
```

The domain and application layers don't know about React or Steam, so they're tested as plain
functions.

## Running locally

Requires Node 20+.

```bash
npm install
npm run dev        # real Steam, via the Vite proxy → http://localhost:5173
npm run dev:mock   # no network: a mock wishlist built from real data
```

Your wishlist must be public (Steam → Profile → Privacy → **Game details: Public**). Use your
17-digit SteamID64, e.g. from `steamcommunity.com/profiles/<id>`.

### Mock scenarios

In `dev:mock`, the Steam ID you enter picks a scenario (see `src/adapters/MockWishlistSource.ts`):

| Steam ID | Scenario |
|---|---|
| any other ID | A real 180-game wishlist |
| `76561190000000001` | Empty wishlist |
| `76561190000000002` | Private wishlist |
| `76561190000000003` | Steam unavailable (retried twice, then an error) |
| `76561190000000004` | Free games only |
| `76561190000000005` | Only games over £40 |
| `76561190000000006` | Unreleased games only |
| `76561190000000007` | A small list with one of every kind of game, including a bundle price |

The mock is loaded only in dev builds. `npm run build` fails if any mock data reaches `dist/`
(`scripts/check-no-mocks.mjs`).

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server against real Steam |
| `npm run dev:mock` | Dev server with mock data |
| `npm test` / `npm run test:watch` | Vitest, once / on every save |
| `npm run lint` | oxlint |
| `npm run build` | Type-check, build to `dist/`, check no mock data was bundled |
| `npm run preview` | Serve the built `dist/` locally |

## Configuration

| Variable | Used by | Default |
|---|---|---|
| `STEAM_API_URL` | Vite dev proxy: where `/api/*` goes | `https://api.steampowered.com` |
| `VITE_MOCK_WISHLIST_API` | Dev builds: `true` uses the mock adapter (set by `.env.mock`) | unset |
| `VITE_CAPSULE_CDN_URL` | Game capsule images | `https://cdn.tobypeel.com` |

The app has no production configuration: it calls `/api` on whatever domain serves it.

## Deployment

Planned (Terraform in `terraform/`): the built `dist/` in a private S3 bucket behind a CloudFront
distribution on the free flat-rate plan, with a second CloudFront behaviour forwarding
`/api/IWishlistService/GetWishlistSortedFiltered/v1/*` to Steam, and a custom domain via Route 53.

## Known limitations

- **Large budgets block the page.** The basket search runs on the main thread: about 0.8 s at £60
  and several seconds at £100 for a ~150-game wishlist. A spinner shows first, but the page
  can't respond until it finishes.
- **SteamID64 only.** Custom profile URLs (`steamcommunity.com/id/<name>`) aren't supported.
- **Private and empty wishlists look the same** to Steam's API, so both get one combined message.
- **Up to 1,000 games.** Steam only returns store details for the first `page_size` games; any
  beyond that appear as "Unknown game" placeholders and are never priced.

## Future additions

- **Better bundle calculation.** Steam's best price is sometimes a multi-game bundle, so a basket
  can include a game you didn't choose. Two improvements:
  - If two wishlist games share the same cheapest bundle (same `bundleid`), treat the bundle as
    one basket item with one price and both games' points (a composite), instead of paying for
    it twice.
  - When a bundle saves only a little over the game on its own, prefer the standalone price.
    Needs `data_request.include_all_purchase_options`, which lists every way to buy a game.
- **Exclude early access games.** An option to leave them out of baskets. Steam already marks
  them with `store_item.is_early_access`; it needs mapping onto `Game` and a domain filter.
- **More scoring weights.** Let users tune what "best" means, e.g. favour **quantity** (more
  games per basket) or **discounted games** (reward good deals). Each would be a `ScoringPolicy`,
  chosen in the UI and passed to `planBaskets` as a `ScoringChoice`.
- **Better default scoring.** `N + 1 − rank` treats the gap between #1 and #2 the same as between
  #150 and #151, and many unranked games are ordered only by when they were added. Something that
  weights top-ranked games more heavily would better match what people want most.
- **No more page freezes:** run `findBaskets` in a Web Worker (page stays responsive) and make it
  faster (e.g. build baskets as linked parent pointers instead of copying arrays).
- **Fewer near-duplicate results:** the top 20 often differ by a single cheap game.
- **Custom profile URLs:** resolve `/id/<name>` to a SteamID64.
- **DLC awareness:** flag add-ons (`store_item.type === 4`), whose base game you may not own.
- **Exclude and must-include games:** pick games to leave out of, or force into, every basket.
- **Wishlists over 1,000 games:** request further pages.
