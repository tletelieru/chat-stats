# chat-stats project brief

Source spec: Notion page "Chat Stats / WhatsApp export analyzer"
(https://app.notion.com/p/409222f5472b81ddb066c67d269b7199). The stats list (S1 to S21), export
format details and engine design live there.

## Purpose

Analyzer for exported chats, Telegram first, WhatsApp too. 100% client-side: no backend, no network
requests, nothing stored unless chosen. One page: import, then stats.

## Stack

Astro static output, one React island (`client:only="react"`), TypeScript strict, MUI, ECharts,
`fflate`, `@streamparser/json`, `date-fns`, `@vite-pwa/astro`, Vitest, ESLint + Prettier, Husky.

## Architecture

- One adapter per source in `src/lib/sources/`, all producing the normalized `Message` model.
- Stats are pure functions and never know the source.
- Parsing and stats run in a Web Worker. One pass with pluggable accumulators (`add`/`result`).
- Messages are stored as columns (typed arrays). The main thread only receives final results.

## Conventions

- No code comments unless explicitly requested.
- Real exports never enter the repo. Fixtures are synthetic with invented names.
- Peer ranges lag: keep `overrides` in `package.json`, do not use `legacy-peer-deps`.
- `eslint-plugin-react` needs an explicit `settings.react.version`.
- TypeScript stays on 6.x.
- lint-staged calls tools through `node node_modules/...`: its `tinyexec` cannot spawn Windows `.cmd`
  shims.
- `scripts/csp.mjs` adds the CSP meta tag with inline script hashes at build time and must stay
  before `AstroPWA` in `integrations`, so the precache revision sees the final `index.html`.
- The precache holds only the app shell. `globIgnores` in `astro.config.mjs` lists lazy chunks by name, so
  a new lazy library adds its chunk there; everything else is cached by `src/sw.ts` on first use.
- `trailingSlash: 'always'` keeps the precached app URL as `/chat-stats/`. Offline breaks without it.
- Unit tests mock `Chart`, so check chart changes against `npm run preview` in a real browser.
- WhatsApp exports have no timezone: times are read as America/Santiago wall time at import.
- All UI text lives in `src/i18n/messages.ts` (en and es). Locale and color mode are kept in localStorage.
- Branches: `feat/*` with PRs to `dev`. `main` and `dev` are protected, merges are manual.
