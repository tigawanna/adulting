# Adulting

A pnpm/turbo monorepo of Kenya-focused tools for the unglamorous parts of
adult life: pay, rates, and the calendar of dates you actually have to track.

## Apps

| App                                            | Stack                                     | Dev port | Description                                                                        |
| ---------------------------------------------- | ----------------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| [`apps/calendar`](apps/calendar)               | Solid 2 + server functions + libSQL/Turso | 3061     | One continuous calendar of Kenyan holidays, KRA deadlines, school terms and dates. |
| [`apps/calc-paye-kenya`](apps/calc-paye-kenya) | Solid 2 + Vite                            | 3060     | PAYE / statutory deductions calculator.                                            |

Both apps are workspace packages, so `pnpm install`, `pnpm build`, and
`pnpm --filter <name> …` work from the repo root.

## Quick start

```bash
pnpm install

pnpm dev:calendar   # http://localhost:3061
pnpm dev:calc       # http://localhost:3060

# Or run all at once:
pnpm dev
```

First-time calendar setup:

```bash
pnpm calendar:db:init
pnpm calendar:seed
```

## Deploy / CI from the root

```bash
pnpm --filter calendar build
pnpm --filter calc-paye-kenya build
```

Calendar: `apps/calendar/dist/client` plus a Netlify function for `/_server`
(see `apps/calendar/netlify.toml`). Set `DATABASE_URL` and
`DATABASE_AUTH_TOKEN` on the site.

Calculator: `apps/calc-paye-kenya/dist/client` (`apps/calc-paye-kenya/netlify.toml`).

## Other commands

```bash
pnpm build          # turbo build all apps
pnpm test           # turbo test
pnpm check-types    # turbo check-types
pnpm quality        # lint + format
```

## Calendar data & Turso

The calendar uses `@libsql/client`. By default it stores data in a local SQLite
file at `apps/calendar/data/calendar.db`. To point it at Turso, copy
`apps/calendar/.env.example` to `apps/calendar/.env` and set `DATABASE_URL` and
`DATABASE_AUTH_TOKEN`. See [`apps/calendar/README.md`](apps/calendar/README.md)
for the full details, the server-function data layer, and the reserved embeddings scaffold.

> Seeded dates are reference data, not authoritative — verify against KRA, KICD
> and KNEC before relying on them.
