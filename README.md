# Kenya Tools

A small pnpm/turbo monorepo of Kenya-focused utilities. It was seeded from the
`agentic-json-resume` monorepo and pruned down to the parts we care about.

## Apps

| App                                            | Stack                                     | Dev port | Description                                                                                       |
| ---------------------------------------------- | ----------------------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| [`apps/calendar`](apps/calendar)               | Solid 2 + server functions + libSQL/Turso | 3061     | One continuous calendar of Kenyan holidays, KRA deadlines, school terms and other dates. **New.** |
| [`apps/calc-paye-kenya`](apps/calc-paye-kenya) | Solid 2 + Vite                            | 3060     | PAYE / statutory deductions calculator (own lockfile).                                            |
| [`apps/rate-calculator`](apps/rate-calculator) | React + Vite Plus                         | 3050     | Rate / tax calculator.                                                                            |

Only these three apps remain. All other apps, shared packages, marketing and
deployment code from the source monorepo were removed. `calc-paye-kenya` keeps
its own `pnpm-lock.yaml` because it runs Solid 2 while the React apps use
different peer versions.

## Quick start

```bash
pnpm install

# Three independent dev servers:
pnpm dev:calendar   # http://localhost:3061
pnpm dev:calc       # http://localhost:3060
pnpm dev:rate       # http://localhost:3050

# Or run all at once:
pnpm dev
```

First-time calendar setup:

```bash
pnpm calendar:db:init
pnpm calendar:seed
```

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
