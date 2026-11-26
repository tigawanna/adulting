# Calc Paye Kenya

A calculator for what your hourly rate actually means in Kenya: take-home pay, PAYE, NSSF, SHIF and the housing levy — in your currency, across periods, with a link you can share.

The site is a static Solid 2 app. It prerenders to HTML, then hydrates in the browser and fetches live exchange rates.

## Why

Hourly and contract rates are hard to compare with a Kenyan payslip. This tool starts from one number — an amount, a currency and how often you earn it — and shows the same result per hour, week, month and year, plus the deductions behind it. It also works backwards: type a gross salary or a take-home target and the rate updates everywhere.

It is an independent estimate, not an official KRA tool. The [disclaimer](src/components/calculator/Disclaimer.tsx) links the KRA and statutory sources used to build the model.

## What it does

- Converts between 20 currencies using live or bundled rates.
- Edits hours per week, weeks per month and hours per month; common month presets update the whole calculation.
- Switches between salaried and contractor deductions, and toggles individual statutory contributions.
- Shows a band-by-band PAYE breakdown and gross/take-home tables for pinned currencies.
- Pins currencies locally, with remove buttons both in the rate row and beside each table, plus an "Add rate" button that opens the currency drawer at the end of the list.
- Follows the system or chosen light/dark theme.
- Produces a shareable URL that restores the exact scenario, including exchange rates.

## Stack

- **Solid 2** with `@solidjs/web`, `@solidjs/meta` and `@solidjs/prerender`; Vite builds a static site via `prerender-crawler`. `src/Document.tsx` replaces `index.html`.
- **Tailwind CSS 4** with `@ui-sdk/core/web.css` imported into the global stylesheet above Tailwind's utilities.
- **ui-sdk** (`@ui-sdk/solid` + `@ui-sdk/core`) for every control: fields, number inputs, selects, the segmented control, switches, buttons, the currency dialog, tooltips and the PAYE disclosure. `vite.config.ts` excludes `@ui-sdk/core` from dependency pre-bundling so the app and the components share one copy in development.
- **State** lives in `src/state/calculator.tsx`: Solid signals/store plus memoised breakdowns. Pins, theme and the disclaimer also persist to `localStorage`.
- **Tests** use Vitest, `@solidjs/testing-library` and `jsdom`, including an agent snapshot test that checks every control has a name.

## Data sources

- Kenyan statutory values, PAYE bands, reliefs and rates are in [`kra-rates.json`](src/lib/calculator/kra-rates.json); `VITE_KRA_*` variables can override them, as documented in [`.env.example`](.env.example).
- Exchange rates come from [open.er-api.com](https://open.er-api.com/v6/latest/USD) on demand. A bundled table in `src/lib/calculator/currencies.ts` is the fallback when the service is unavailable, and is what a fresh visit starts with while rates load.
- Official references are linked from the in-app disclaimer: KRA income tax and PAYE guidance, and the Affordable Housing Levy notice.

## Shareable links

Any change is written to the URL with `replaceState`, so the address bar is always the current scenario. The main parameters are:

| Parameter                      | Meaning                                                |
| ------------------------------ | ------------------------------------------------------ |
| `amount`, `currency`, `period` | The rate being converted                               |
| `hours`, `weeks`               | Hours per month and weeks per month                    |
| `employment`, `deductions`     | Salaried/contractor mode and which contributions apply |
| `pinned`                       | Comma-separated pinned currency codes                  |
| `rates`                        | Compact rate snapshot for the currencies in view       |

Opening a shared link restores those values after hydration and shows **Shared rates** instead of fetching live ones; **Refresh exchange rates** switches back to live data and rewrites the URL. The header's **Copy share link** button copies it, and the footer has a **Copy link** button plus **Clear**, which resets every control to its default and empties the query string. A brief splash covers the initial URL-to-state hop when share parameters are present.

Defaults are omitted from the URL, so a fresh visit stays clean.

## Run it

```bash
pnpm --filter calc-paye-kenya dev          # http://localhost:3060
pnpm --filter calc-paye-kenya test
pnpm --filter calc-paye-kenya check-types
pnpm --filter calc-paye-kenya build        # prerenders / into dist/client
pnpm --filter calc-paye-kenya preview
```

## Deploy (Netlify)

The site files land in `apps/calc-paye-kenya/dist/client`. Netlify's build cwd is the **repo root**, so `publish` in `netlify.toml` is that full path (not `dist/client`).

```bash
pnpm --filter calc-paye-kenya build
netlify deploy --filter calc-paye-kenya --prod --dir=apps/calc-paye-kenya/dist/client
```

No Nitro or Netlify adapter is required.

## Assets

```bash
pnpm --filter calc-paye-kenya gen:favicons  # from public/icon.png
pnpm --filter calc-paye-kenya gen:og        # from public/logo.svg + scripts/OgImage.tsx
```

The pure calculation functions and the UI wiring are covered by Vitest.
