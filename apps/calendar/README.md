# Calendar — Kenya Tools

A single, continuous calendar for Kenya-related dates: public holidays, KRA
filing windows, school terms, exam windows and other deadlines. Built with
**React + TanStack Router** on the frontend and a small **Hono** API backed by
**libSQL / Turso**.

> ⚠️ The seeded dates are **starter/reference data**. Fixed-date public holidays
> are reliable; movable feasts, KRA deadlines and KICD/KNEC dates for 2026 are
> indicative and must be verified against the official sources before use.
> Every row records its `source` so you can see where it came from.

## Stack

| Layer      | Choice                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------- |
| UI         | React 19, TanStack Router (file-based routes), plain CSS                                       |
| API        | Hono + `@hono/node-server`                                                                     |
| DB         | `@libsql/client` — `file:` SQLite for dev, `libsql://` (Turso) for prod                        |
| Embeddings | Reserved `embedding BLOB` + `embedding_model` columns and a scaffold in `server/embeddings.ts` |

## Getting started

From the repo root:

```bash
pnpm install
pnpm --filter calendar db:init   # create tables
pnpm --filter calendar seed      # load starter dates (idempotent)
pnpm dev:calendar                # API on :3161, Vite on :3061
```

The web app proxies `/api` to the API server, so open **http://localhost:3061**.

Without any config the API writes to `apps/calendar/data/calendar.db` (gitignored).

## Using Turso

Copy `.env.example` to `.env` in this directory and set:

```dotenv
DATABASE_URL=libsql://your-db-your-org.turso.io
DATABASE_AUTH_TOKEN=your-auth-token
```

Then run `pnpm db:init` and `pnpm seed` again against the remote database.
No application code changes are needed.

## Features

- **Month view** — 6×7 grid, colour-coded by category, click any day to add a date.
- **Term view** — the three Kenyan school terms for a year with event counts.
- **Search view** — look up events by name/description/tag, with a category filter.
- **Recurrence** — events can be `once`, `yearly` or `monthly`; the API expands
  recurring events into whatever date range the UI asks for, so holidays keep
  appearing in future years.
- **Provenance** — `source`, `source_url` and `tags` on every event.

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

## Embeddings (not yet enabled)

The schema already has `embedding BLOB` and `embedding_model` on `events`, so
turning on natural-language search later needs no migration. See
`server/embeddings.ts` for the `generateEmbedding`, `cosineSimilarity` and
`rankBySimilarity` stubs and the steps to wire a provider.
