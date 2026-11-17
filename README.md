# Wishlist Budget

Enter your Steam ID and a budget, and see the best combinations ("baskets") of games from your Steam wishlist that
you can buy right now at current UK prices.

**Live:** https://wishlist.tobypeel.com

Baskets favour the games you've ranked highest on your wishlist. Free games (free to play, or 100% off) are added to
every basket, and games that are only cheapest as part of a Steam bundle are marked with an asterisk.

## Use of AI

This project was built with help from Claude (Anthropic) through Claude Code.

**Written with AI:**

- **The user interface:** the React components and styles in `src/components/`, and the `useBaskets` hook that keeps
  a spinner visible while baskets are calculated.
- **Development tooling:** the mock wishlist and its scenarios (`MockWishlistSource`, generated from a real
  wishlist), the mock-data build check, the deploy script, and the Lambda's reproducible build (`build.py`,
  `build_zip.py`).

**Reviewed by AI:** pull requests were reviewed by Claude, and many of its suggestions were applied, for example
input validation and error handling in the Lambda, fixes to the Steam adapter, and corrections to the Terraform.

**Written by me:** the domain logic (`Game`, `Basket`, scoring, `findBaskets`), `planBaskets`, the Steam adapter, the
Lambda handler and models, the Terraform, and most of the tests.


## How it works

1. **Fetch:** one request to Steam's `IWishlistService/GetWishlistSortedFiltered` returns the whole wishlist in your
   own rank order, with names and GB prices.
2. **Filter:** games with no price (unreleased, not for sale) are left out; free games are kept aside to add to every
   basket.
3. **Score:** each game is worth `N + 1 − rank` points, where N is the size of the wishlist, so your #1 game scores
   N and your last scores 1.
4. **Search:** `findBaskets` builds every affordable combination game by game, keeping the 20 highest-scoring baskets
   for each total price, then returns the best 20 overall.

The basket search runs in the browser. Steam's API doesn't send CORS headers, so the app calls `/api/…` on its own
domain, which forwards to Steam: the Vite dev server does this locally, and a small Lambda proxy behind CloudFront
does it in production.

## Architecture

```
Browser ──► CloudFront (wishlist.tobypeel.com)
              ├── /*      ──► S3 bucket (the built React app)
              └── /api/*  ──► Lambda function URL ──► Steam Web API
```

The React app uses a light hexagonal (ports and adapters) structure:

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

The domain and application layers don't know about React or Steam, so they're tested as plain functions.

| Folder | What it is |
|---|---|
| `src/`, `tests/` | The React + TypeScript app (Vite, TanStack Query, Vitest) |
| `steam-wishlist-api-proxy-lambda/` | The Python Lambda that validates `/api` requests and forwards them to Steam |
| `terraform/` | Infrastructure: S3, CloudFront, Lambda, Route 53 records |
| `scripts/` | The build check for mock data, and the deploy script |

## Running locally

```bash
npm install
npm run dev        # real Steam, via the Vite proxy → http://localhost:5173
npm run dev:mock   # no network: a mock wishlist built from real data
```

Your wishlist must be public (Steam → Profile → Privacy → **Game details: Public**). Use your 17-digit SteamID64,
e.g. from `steamcommunity.com/profiles/<id>`.

### Mock scenarios

In `dev:mock`, the Steam ID you enter picks a scenario (see `src/adapters/MockWishlistSource.ts`). Game names are
prefixed `[FAKE]` so mock data is obvious on screen.

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

The mock is only loaded in dev builds. `npm run build` fails if any mock data reaches `dist/`
(`scripts/check-no-mocks.mjs`).

### The Lambda proxy

Requires Python 3.12+.

```bash
cd steam-wishlist-api-proxy-lambda
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements-dev.txt   # macOS/Linux: .venv/bin/python
.venv/Scripts/python -m pytest
```

The handler validates `input_json` with Pydantic (a 17-digit `steamid`, `page_size` 1–1000), forwards the request to
Steam, and passes Steam's status, body and `Content-Type` back. Timeouts return a JSON 504, and connection failures
a JSON 502. `build.py` packages it as a reproducible `dist/lambda.zip` for Linux and Python 3.12, so Terraform only
redeploys it when the code or the pinned dependencies change.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server against real Steam |
| `npm run dev:mock` | Dev server with mock data |
| `npm test` / `npm run test:watch` | Vitest, once / on every save |
| `npm run lint` | oxlint |
| `npm run build` | Type-check, build to `dist/`, check no mock data was bundled |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run deploy` | Test, build the Lambda and the app, then `terraform apply` |

## Configuration

| Variable | Used by | Default |
|---|---|---|
| `STEAM_API_URL` | Vite dev proxy: where `/api/*` goes | `https://api.steampowered.com` |
| `VITE_MOCK_WISHLIST_API` | Dev builds: `true` uses the mock adapter (set by `.env.mock`) | unset |
| `VITE_CAPSULE_CDN_URL` | Game capsule images | `https://cdn.tobypeel.com` |
| `STEAM_API_BASE_URL` | The Lambda: where it forwards requests (set by Terraform) | — |

The app has no production configuration: it calls `/api` on whatever domain serves it.

## Deployment

```bash
npm run deploy
```

This runs both test suites, builds the Lambda zip and the app, then runs `terraform apply`, which shows the plan and
waits for you to confirm. Terraform uploads the built site to S3 and the zip to Lambda.

Before the first deploy:

- Run `terraform init` in `terraform/` once. State is kept in S3 (`backend.tf`).
- Terraform needs AWS credentials it can read. If you sign in with `aws login`, Terraform can't use that session
  directly, so add a profile that hands it over and point Terraform at it:

  ```ini
  # ~/.aws/config
  [profile terraform]
  region = eu-west-2
  credential_process = aws configure export-credentials --profile <your-profile> --format process
  ```

  ```powershell
  $env:AWS_PROFILE = "terraform"
  ```

Website files are cached for 5 minutes in CloudFront and in browsers, so a deploy reaches everyone within about 10
minutes. The `/api/*` route is never cached.

Merges to `main` that change the Terraform notify
[the architecture map](https://github.com/Toby70b/tobysworld)
(`.github/workflows/notify-architecture-map.yml`).

## Known limitations

- **Large budgets block the page.** The basket search runs on the main thread: about 0.8 s at £60 and several
  seconds at £100 for a ~150-game wishlist. A spinner shows first, but the page can't respond until it finishes.
- **SteamID64 only.** Custom profile URLs (`steamcommunity.com/id/<name>`) aren't supported.
- **Private and empty wishlists look the same** to Steam's API, so both get one combined message.
- **Up to 1,000 games.** Steam only returns store details for the first `page_size` games; any beyond that appear
  as "Unknown game" placeholders and are never priced.
- **UK prices only.** Requests always use `country_code: GB`.

## Future features

- **Better bundle handling.** Steam's best price is sometimes a multi-game bundle, so a basket can include a game
  you didn't choose.
  - If two wishlist games share the same cheapest bundle (same `bundleid`), count the bundle once, with both
    games' points.
  - When a bundle saves only a little over buying the game on its own, prefer the standalone price (needs
    `data_request.include_all_purchase_options`).
- **Exclude early access games**, using Steam's `store_item.is_early_access`.
- **More scoring options**, e.g. favour more games per basket, or reward bigger discounts. Each would be a
  `ScoringPolicy` chosen in the UI.
- **Better default scoring.** `N + 1 − rank` treats the gap between #1 and #2 the same as between #150 and #151;
  weighting top-ranked games more heavily would better match what people want most.
- **No more page freezes:** run `findBaskets` in a Web Worker, and make it faster (e.g. linked parent pointers
  instead of copying arrays).
- **Fewer near-duplicate results:** the top 20 often differ by a single cheap game.
- **Custom profile URLs:** resolve `/id/<name>` to a SteamID64 with Steam's `ResolveVanityURL`, which needs an API
  key kept server-side in the Lambda.
- **DLC awareness:** flag add-ons (`store_item.type === 4`), whose base game you may not own.
- **Exclude and must-include games:** pick games to leave out of, or force into, every basket.
- **Wishlists over 1,000 games:** request further pages.
- **Better website caching and CI deploys:** deploy from GitHub Actions (with OIDC) instead of Terraform uploads,
  cache hashed assets for a year and `index.html` not at all, so deploys are live immediately.