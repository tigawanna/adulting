# Calendar — Kenya Tools

A single, prerendered calendar for Kenya-related dates: public holidays, KRA
filing windows, school terms, exam windows and other deadlines.

The frontend is **Solid 2** built with the same Vite + `@solidjs/prerender`
setup as `apps/calc-paye-kenya`, so `pnpm build` emits a static site. Data is
served by a small **Hono** API backed by **libSQL / Turso**.

> ⚠️ Seeded dates are **reference data**. Fixed-date public holidays are
> reliable; movable feasts, KRA deadlines and KICD/KNEC dates for 2026 are
> indicative and must be verified against official sources. Every row records
> its `source`.

## Stack

| Layer  | Choice                                                                                                      |
| ------ | ----------------------------------------------------------------------------------------------------------- |
| UI     | Solid 2 (`@solidjs/web`), `@solidjs/meta`, Tabler icons, native CSS tokens                                  |
| Build  | Vite 8 + `@solidjs/vite-plugin` + `@solidjs/prerender` + `prerender-crawler` (static output)                |
| API    | Hono + `@hono/node-server`                                                                                  |
| DB     | `@libsql/client` — `file:` SQLite locally, `libsql://` (Turso) in production                                |
| Design | Local taste skills in `.agents/skills/` (design-taste-frontend, emil-design-eng, high-end-visual-design, …) |

Light and dark themes follow `prefers-color-scheme` and can be toggled in the
header. Motion is gated behind `prefers-reduced-motion`.

## Getting started

From the repo root:

```bash
pnpm install
pnpm calendar:db:init
pnpm calendar:seed
pnpm dev:calendar        # web :3061 (Vite), API :3161
```

Open **http://localhost:3061/calendar**.

Without config the API writes to `apps/calendar/data/calendar.db` (gitignored).

## Build / prerender

```bash
pnpm --filter calendar build
```

The Solid app is statically prerendered into `dist/client` by `prerender-crawler`;
the API runs separately (`pnpm --filter calendar start`).

## Turso

Copy `.env.example` to `.env` and set `DATABASE_URL` / `DATABASE_AUTH_TOKEN`,
then rerun `db:init` and `seed`. No code changes needed.

## Features

- **Month view** — colour-coded date pills, click any day to add.
- **Term view** — three Kenyan school terms with per-term date counts.
- **Search view** — name/description/tag lookup with a category filter.
- **Recurrence** — `yearly` / `monthly` events expand server-side into the
  requested range.
- **Provenance** — `source`, `source_url` and `tags` on every event.
- **Embeddings** — `embedding BLOB` + `embedding_model` columns are reserved;
  see `server/embeddings.ts` for the semantic-search scaffold.

## API

| Method   | Path                                      | Purpose               |
| -------- | ----------------------------------------- | --------------------- |
| `GET`    | `/api/health`                             | liveness              |
| `GET`    | `/api/events?from=&to=&search=&category=` | list / search / range |
| `GET`    | `/api/events/:id`                         | one event             |
| `POST`   | `/api/events`                             | create                |
| `PATCH`  | `/api/events/:id`                         | update                |
| `DELETE` | `/api/events/:id`                         | delete                |
| `GET`    | `/api/terms?year=`                        | school terms          |
| `POST`   | `/api/terms`                              | upsert a school term  |
