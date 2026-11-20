import { Meta, Title } from "@solidjs/meta";
import {
  IconCalendarMonth,
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
  IconMoon,
  IconPlus,
  IconSearch,
  IconSun,
} from "@/components/Icons";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onSettled,
  Show,
  type Component,
} from "solid-js";
import { CalendarGrid } from "@/components/CalendarGrid";
import { EventDialog } from "@/components/EventDialog";
import { ListView } from "@/components/ListView";
import { TermView } from "@/components/TermView";
import { api, type EventQuery } from "@/lib/api";
import { CATEGORY_LABELS, MONTH_NAMES, monthBounds, monthGrid } from "@/lib/date";
import type { CalendarEvent, EventCategory, SchoolTerm } from "@/lib/types";
import "@fontsource-variable/outfit";
import "./styles.css";

type View = "month" | "term" | "list";

const DESCRIPTION =
  "A shared registry of Kenyan public holidays, KRA filing periods, school terms and deadlines — collected in one calendar.";

const now = new Date();
const CATEGORY_OPTIONS = ["all", "holiday", "tax", "school", "deadline", "other"] as const;

const App: Component = () => {
  const [year, setYear] = createSignal(now.getFullYear());
  const [month, setMonth] = createSignal(now.getMonth() + 1);
  const [view, setView] = createSignal<View>("month");
  const [query, setQuery] = createSignal("");
  const [category, setCategory] = createSignal("all");
  const [events, setEvents] = createSignal<CalendarEvent[]>([]);
  const [terms, setTerms] = createSignal<SchoolTerm[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [selectedTerm, setSelectedTerm] = createSignal<number | null>(null);
  const [dialog, setDialog] = createSignal<{ event: CalendarEvent | null; date: string } | null>(
    null,
  );
  const [reloadKey, setReloadKey] = createSignal(0);
  const [theme, setTheme] = createSignal<"light" | "dark">("light");
  const [ready, setReady] = createSignal(false);

  // ── URL as shareable state ──────────────────────────────────────────────
  function readUrl() {
    const p = new URLSearchParams(window.location.search);
    const y = Number(p.get("year"));
    const m = Number(p.get("month"));
    const v = p.get("view");
    if (Number.isInteger(y) && y > 1900 && y < 2200) setYear(y);
    if (Number.isInteger(m) && m >= 1 && m <= 12) setMonth(m);
    if (v === "month" || v === "term" || v === "list") setView(v);
    setQuery(p.get("q") ?? "");
    setCategory(p.get("category") ?? "all");
  }

  onSettled(() => {
    readUrl();
    const saved = localStorage.getItem("kenya-calendar:theme");
    let initial: "light" | "dark" = "light";
    if (saved === "light" || saved === "dark") initial = saved;
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) initial = "dark";
    setTheme(initial);
    setReady(true);
    window.addEventListener("popstate", readUrl);
    return () => window.removeEventListener("popstate", readUrl);
  });

  createEffect(
    () => ({ ready: ready(), y: year(), m: month(), v: view(), q: query(), cat: category() }),
    ({ ready: isReady }) => {
      if (!isReady) return;
      const p = new URLSearchParams();
      p.set("year", String(year()));
      p.set("month", String(month()));
      p.set("view", view());
      if (query()) p.set("q", query());
      if (category() !== "all") p.set("category", category());
      window.history.replaceState(null, "", `${window.location.pathname}?${p}`);
    },
  );

  // ── Debounced search ────────────────────────────────────────────────────
  const [debouncedQuery, setDebouncedQuery] = createSignal("");
  let searchTimer = 0;
  createEffect(
    () => query(),
    (q) => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => setDebouncedQuery(q), 250);
    },
  );

  // ── Data loading ────────────────────────────────────────────────────────
  let latestRequest = 0;
  createEffect(
    () => ({
      ready: ready(),
      y: year(),
      m: month(),
      v: view(),
      q: debouncedQuery(),
      cat: category(),
      key: reloadKey(),
    }),
    ({ ready: isReady, y, m, v, q, cat }) => {
      if (!isReady) return;
      const requestId = ++latestRequest;
      setLoading(true);
      setError(null);

      const activeCategory = cat === "all" ? undefined : (cat as EventCategory);
      const eventQuery: EventQuery = {};
      if (v === "list") {
        if (q.trim()) eventQuery.search = q.trim();
        if (activeCategory) eventQuery.category = activeCategory;
      } else {
        const range = v === "month" ? monthBounds(y, m) : { from: `${y}-01-01`, to: `${y}-12-31` };
        eventQuery.from = range.from;
        eventQuery.to = range.to;
        if (activeCategory) eventQuery.category = activeCategory;
      }

      Promise.all([
        api.listEvents(eventQuery),
        v === "term" ? api.listTerms(y) : Promise.resolve({ terms: [] as SchoolTerm[] }),
      ])
        .then(([eventResult, termResult]) => {
          if (requestId !== latestRequest) return;
          setEvents(eventResult.events);
          setTerms(termResult.terms);
        })
        .catch((err: unknown) => {
          if (requestId === latestRequest)
            setError(err instanceof Error ? err.message : "Could not load dates");
        })
        .finally(() => {
          if (requestId === latestRequest) setLoading(false);
        });
    },
  );

  // ── Derived values ──────────────────────────────────────────────────────
  const cells = createMemo(() => monthGrid(year(), month()));
  const stats = createMemo(() => {
    const counts: Record<string, number> = {};
    for (const event of events()) counts[event.category] = (counts[event.category] ?? 0) + 1;
    return counts;
  });
  const heading = createMemo(() => {
    if (view() === "month") return `${MONTH_NAMES[month() - 1]} ${year()}`;
    if (view() === "term") return `School terms · ${year()}`;
    return query().trim() ? `Results for “${query().trim()}”` : "All dates";
  });

  function shiftMonth(delta: number) {
    const d = new Date(year(), month() - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  }

  function toggleTheme() {
    const next = theme() === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("kenya-calendar:theme", next);
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", next === "dark" ? "#0d1511" : "#f6f7f4");
  }

  function openAdd(date: string) {
    setDialog({ event: null, date });
  }

  function refresh() {
    setDialog(null);
    setReloadKey((k) => k + 1);
  }

  return (
    <>
      <Title>Kenya Tools · Calendar</Title>
      <Meta name="description" content={DESCRIPTION} />
      <Meta property="og:title" content="Kenya Tools · Calendar" />
      <Meta property="og:description" content={DESCRIPTION} />
      <Meta property="og:image" content="/kenya.svg" />
      <Meta name="twitter:card" content="summary_large_image" />

      <div class="shell">
        <header class="topbar">
          <a class="brand" href="/calendar">
            <span class="brand-mark">
              <IconCalendarMonth size={20} />
            </span>
            <span class="brand-text">
              <strong>Kenya Tools</strong>
              <small>Calendar</small>
            </span>
          </a>

          <nav class="view-switch" aria-label="Calendar view">
            <For
              each={
                [
                  { id: "month", label: "Month" },
                  { id: "term", label: "Terms" },
                  { id: "list", label: "Search" },
                ] as const
              }
            >
              {(item) => (
                <button
                  type="button"
                  class={`view-tab ${view() === item.id ? "active" : ""}`}
                  onClick={() => setView(item.id)}
                >
                  {item.label}
                </button>
              )}
            </For>
          </nav>

          <div class="topbar-actions">
            <a class="source-link" href="https://www.kra.go.ke/" target="_blank" rel="noreferrer">
              <IconExternalLink size={15} /> <span>KRA source</span>
            </a>
            <button
              class="icon-btn"
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle colour theme"
            >
              <Show when={theme() === "dark"} fallback={<IconMoon size={18} />}>
                <IconSun size={18} />
              </Show>
            </button>
            <button
              class="btn btn-primary"
              type="button"
              onClick={() => openAdd(`${year()}-${String(month()).padStart(2, "0")}-01`)}
            >
              <IconPlus size={17} /> <span>Add date</span>
            </button>
          </div>
        </header>

        <main class="main">
          <section class="page-head">
            <div>
              <p class="eyebrow">A shared sense of time</p>
              <h1>{heading()}</h1>
              <p class="lede">
                Holidays, filing windows, school terms and deadlines — collected in one place.
              </p>
            </div>
            <div class="head-meta">
              <span class="meta-label">Registry</span>
              <strong>
                {events().length} {events().length === 1 ? "date" : "dates"} in view
              </strong>
            </div>
          </section>

          <section class="toolbar">
            <div class="toolbar-group">
              <button
                class="icon-btn"
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
              >
                <IconChevronLeft size={18} />
              </button>
              <button
                class="btn btn-ghost"
                type="button"
                onClick={() => {
                  setYear(now.getFullYear());
                  setMonth(now.getMonth() + 1);
                }}
              >
                Today
              </button>
              <button
                class="icon-btn"
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
              >
                <IconChevronRight size={18} />
              </button>
            </div>

            <label class="search-box">
              <IconSearch size={17} />
              <input
                value={query()}
                onInput={(e) => setQuery(e.currentTarget.value)}
                placeholder="Look up a date by name…"
                aria-label="Search dates by name"
              />
            </label>

            <label class="select-box">
              <select value={category()} onChange={(e) => setCategory(e.currentTarget.value)}>
                <For each={CATEGORY_OPTIONS}>
                  {(c) => (
                    <option value={c}>{c === "all" ? "All categories" : CATEGORY_LABELS[c]}</option>
                  )}
                </For>
              </select>
            </label>
          </section>

          <section class="stats" aria-label="Dates in view by category">
            <For each={Object.entries(CATEGORY_LABELS)}>
              {([key, label]) => (
                <div class={`stat cat-${key}`}>
                  <span class="stat-dot" />
                  <span class="stat-label">{label}</span>
                  <strong>{stats()[key] ?? 0}</strong>
                </div>
              )}
            </For>
          </section>

          <Show when={error()}>
            <div class="banner banner-error" role="alert">
              {error()} — is the API running? (<code>pnpm dev</code>)
            </div>
          </Show>
          <Show when={loading()}>
            <div class="banner banner-loading" aria-live="polite">
              <span class="loading-bar" /> Loading dates…
            </div>
          </Show>

          <Show when={view() === "month"}>
            <CalendarGrid
              cells={cells()}
              events={events()}
              onDayClick={openAdd}
              onEventClick={(event) => setDialog({ event, date: event.startDate })}
            />
          </Show>
          <Show when={view() === "term"}>
            <TermView
              terms={terms()}
              events={events()}
              selectedTerm={selectedTerm()}
              onSelect={setSelectedTerm}
              onEventClick={(event) => setDialog({ event, date: event.startDate })}
            />
          </Show>
          <Show when={view() === "list"}>
            <ListView
              events={events()}
              onEventClick={(event) => setDialog({ event, date: event.startDate })}
            />
          </Show>
        </main>

        <footer class="footer">
          <span>Kenya Tools · a public-interest date registry</span>
          <span>Dates are community-maintained — verify against official sources.</span>
        </footer>
      </div>

      <Show when={dialog()} keyed>
        {(d) => (
          <EventDialog
            initial={d.event}
            defaultDate={d.date}
            onClose={() => setDialog(null)}
            onSaved={refresh}
          />
        )}
      </Show>
    </>
  );
};

export default App;
