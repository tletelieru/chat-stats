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
- Branches: `feat/*` with PRs to `dev`. `main` and `dev` are protected, merges are manual.
