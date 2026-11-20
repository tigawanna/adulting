# Calendar — Kenya Tools

A single, prerendered calendar for Kenya-related dates: public holidays, KRA
filing windows, school terms, exam windows and other deadlines.

Built with **Solid 2**, `@solidjs/router` queries and Solid **server functions**
(`"use server"`) backed by libSQL / Turso. There is no separate REST API —
reads and writes call server functions through Solid's transport.

> ⚠️ Seeded dates are **reference data**. Fixed-date public holidays are
> reliable; movable feasts, KRA deadlines and KICD/KNEC dates for 2026 are
> indicative and must be verified against official sources. Every row records
> its `source`.

## Stack

| Layer | Choice                                                                          |
| ----- | ------------------------------------------------------------------------------- |
| UI    | Solid 2 (`@solidjs/web`), `@solidjs/router`, `@solidjs/meta`, native CSS tokens |
| Data  | Solid server functions in `src/lib/data.ts` + `query()` cache                   |
| Build | Vite 8 + `@solidjs/vite-plugin` + `@solidjs/prerender` (static shell)           |
| DB    | `@libsql/client` — `file:` SQLite locally, `libsql://` (Turso) in production    |

## Getting started

From the repo root:

```bash
pnpm install
pnpm calendar:db:init
pnpm calendar:seed
pnpm dev:calendar        # http://localhost:3061
```

## Stale-while-revalidate

Reads use `createDeferred()` + `isPending()`: after the first answer, changing
month / view / search keeps the previous calendar on screen while the new data
loads. A small spinner appears inside the search field; only the very first
load shows a skeleton. No view flashes to a loader once data exists.

## Turso

Copy `.env.example` to `.env` and set `DATABASE_URL` / `DATABASE_AUTH_TOKEN`,
then rerun `db:init` and `seed`. No code changes needed.

## Features

- Month, term and search views from a compact toolbar selector; search by
  name/description/tag and filter by a dynamically loaded category list.
- `yearly` / `monthly` recurrence expanded by the data layer.
- `source`, `source_url` and `tags` on every event.
- `embedding BLOB` + `embedding_model` reserved; scaffold in `server/embeddings.ts`.
- Light/dark themes via CSS variables and a header toggle;
  `prefers-reduced-motion` disables animation.
