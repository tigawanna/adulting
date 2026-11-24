import { Meta, Title } from "@solidjs/meta";
import {
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
  IconMoon,
  IconPlus,
  IconSearch,
  IconSun,
} from "@/components/Icons";
import {
  createDeferred,
  createEffect,
  createMemo,
  createSignal,
  Errored,
  For,
  isPending,
  Loading,
  onSettled,
  Show,
  type Component,
} from "solid-js";
import { CalendarGrid } from "@/components/CalendarGrid";
import { EventDialog } from "@/components/EventDialog";
import { ListView } from "@/components/ListView";
import { TermView } from "@/components/TermView";
import { getCalendarData, getCategories } from "@/lib/data";
import { CATEGORY_LABELS, MONTH_NAMES, monthBounds, monthGrid } from "@/lib/date";
import type { CalendarEvent, EventQuery, SchoolTerm } from "@/lib/types";
import "@fontsource-variable/outfit";
import "@ui-sdk/core/web.css";
import "./styles.css";

type View = "month" | "term" | "list";

const DESCRIPTION =
  "A shared registry of Kenyan public holidays, KRA filing periods, school terms and deadlines — collected in one calendar.";

const now = new Date();

const App: Component = () => {
  const [year, setYear] = createSignal(now.getFullYear());
  const [month, setMonth] = createSignal(now.getMonth() + 1);
  const [view, setView] = createSignal<View>("month");
  const [query, setQuery] = createSignal("");
  const [category, setCategory] = createSignal("all");
  const [selectedTerm, setSelectedTerm] = createSignal<number | null>(null);
  const [dialog, setDialog] = createSignal<{ event: CalendarEvent | null; date: string } | null>(
    null,
  );
  const [reloadKey, setReloadKey] = createSignal(0);
  const [theme, setTheme] = createSignal<"light" | "dark">("light");
  const [ready, setReady] = createSignal(false);
  const [categories, setCategories] = createSignal<string[]>([]);

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
    void getCategories().then(setCategories);
    window.addEventListener("popstate", readUrl);
    return () => window.removeEventListener("popstate", readUrl);
  });

  createEffect(
    () => ({ ready: ready(), y: year(), m: month(), v: view(), q: query(), cat: category() }),
    ({ ready: isReady, y, m, v, q, cat }) => {
      if (!isReady) return;
      const p = new URLSearchParams();
      p.set("year", String(y));
      p.set("month", String(m));
      p.set("view", v);
      if (q) p.set("q", q);
      if (cat !== "all") p.set("category", cat);
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

  // ── Stale-while-revalidate data ────────────────────────────────────────
  // createDeferred holds the last committed answer while a refetch is in
  // flight: views never flash to a loader once data exists. Only the very
  // first load falls back to the skeleton inside <Loading>.
  const data = createDeferred(() => {
    if (!ready())
      return Promise.resolve({ events: [] as CalendarEvent[], terms: [] as SchoolTerm[] });
    const y = year();
    const m = month();
    const v = view();
    const q = debouncedQuery().trim();
    const cat = category();
    void reloadKey();

    const eventQuery: EventQuery = {};
    if (v === "list") {
      if (q) eventQuery.search = q;
      if (cat !== "all") eventQuery.category = cat;
    } else {
      const range = v === "month" ? monthBounds(y, m) : { from: `${y}-01-01`, to: `${y}-12-31` };
      eventQuery.from = range.from;
      eventQuery.to = range.to;
      if (cat !== "all") eventQuery.category = cat;
    }
    return getCalendarData({ ...eventQuery, year: y, withTerms: v === "term" });
  });

  const events = createMemo(() => data()?.events ?? []);
  const terms = createMemo(() => data()?.terms ?? ([] as SchoolTerm[]));
  const pending = createMemo(() => isPending(data));
  const cells = createMemo(() => monthGrid(year(), month()));

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
            <span class="brand-text">
              <strong>Kenya Tools</strong>
              <small>Calendar</small>
            </span>
          </a>

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
              onClick={() =>
                setDialog({ event: null, date: `${year()}-${String(month()).padStart(2, "0")}-01` })
              }
            >
              <IconPlus size={17} /> <span>Add date</span>
            </button>
          </div>
        </header>

        <main class="main">
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
              <span class="month-label">
                {MONTH_NAMES[month() - 1]} {year()}
              </span>
              <button
                class="icon-btn"
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
              >
                <IconChevronRight size={18} />
              </button>
              <button
                class="btn btn-ghost today-btn"
                type="button"
                onClick={() => {
                  setYear(now.getFullYear());
                  setMonth(now.getMonth() + 1);
                }}
              >
                Today
              </button>
            </div>

            <label class="select-box view-select">
              <select
                value={view()}
                onChange={(e) => setView(e.currentTarget.value as View)}
                aria-label="Calendar view"
              >
                <option value="month">Month</option>
                <option value="term">Terms</option>
                <option value="list">Search</option>
              </select>
            </label>

            <label class="search-box">
              <IconSearch size={17} />
              <input
                value={query()}
                onInput={(e) => setQuery(e.currentTarget.value)}
                placeholder="Look up a date by name…"
                aria-label="Search dates by name"
              />
              <Show when={pending()}>
                <span class="search-spinner" aria-label="Loading" />
              </Show>
            </label>

            <label class="select-box">
              <select
                value={category()}
                onChange={(e) => setCategory(e.currentTarget.value)}
                aria-label="Category"
              >
                <option value="all">All categories</option>
                <For each={categories()}>
                  {(c) => <option value={c}>{CATEGORY_LABELS[c] ?? c}</option>}
                </For>
              </select>
            </label>
          </section>

          <Errored
            fallback={(err: unknown) => (
              <div class="banner banner-error" role="alert">
                Could not load dates: {err instanceof Error ? err.message : String(err)}
              </div>
            )}
          >
            <Loading fallback={<CalendarSkeleton />}>
              <Show when={view() === "month"}>
                <CalendarGrid
                  cells={cells()}
                  events={events()}
                  onDayClick={(date) => setDialog({ event: null, date })}
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
            </Loading>
          </Errored>
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
            onSaved={() => {
              setDialog(null);
              setReloadKey((k) => k + 1);
            }}
          />
        )}
      </Show>
    </>
  );
};

const CalendarSkeleton: Component = () => (
  <div class="calendar skeleton" aria-hidden="true">
    <div class="calendar-weekdays">
      <For each={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}>{(d) => <div>{d}</div>}</For>
    </div>
    <div class="calendar-grid">
      <For each={Array.from({ length: 42 })}>
        {() => (
          <div class="day">
            <span class="sk-day" />
            <span class="sk-pill" />
          </div>
        )}
      </For>
    </div>
  </div>
);

export default App;
