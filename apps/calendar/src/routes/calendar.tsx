import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CalendarGrid } from "@/components/CalendarGrid";
import { EventDialog } from "@/components/EventDialog";
import { ListView } from "@/components/ListView";
import { TermView } from "@/components/TermView";
import { api } from "@/lib/api";
import { CATEGORY_LABELS, MONTH_NAMES, monthBounds, monthGrid } from "@/lib/date";
import { defaultSearch, parseSearch } from "@/lib/search";
import type { CalendarEvent, EventCategory, SchoolTerm } from "@/lib/types";

const { year: currentYear, month: currentMonth } = defaultSearch();

export const Route = createFileRoute("/calendar")({
  validateSearch: parseSearch,
  component: CalendarPage,
});

const CATEGORY_OPTIONS = ["all", "holiday", "tax", "school", "deadline", "other"];

function CalendarPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/calendar" });
  const { year, month, view, q, category } = search;

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [terms, setTerms] = useState<SchoolTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState(q);
  const [dialog, setDialog] = useState<{ event: CalendarEvent | null; date: string } | null>(null);

  // Debounce the name search into the URL.
  useEffect(() => {
    setSearchInput(q);
  }, [q]);
  useEffect(() => {
    if (searchInput === q) return;
    const id = window.setTimeout(() => {
      void navigate({ search: { year, month, view, q: searchInput, category } });
    }, 250);
    return () => window.clearTimeout(id);
  }, [searchInput, q, year, month, view, category, navigate]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const activeCategory = category === "all" ? undefined : (category as EventCategory);
    let query: Parameters<typeof api.listEvents>[0] = {
      from: `${year}-01-01`,
      to: `${year}-12-31`,
      category: activeCategory,
    };
    if (view === "list") query = { search: q || undefined, category: activeCategory };
    if (view === "month") query = { ...monthBounds(year, month), category: activeCategory };

    Promise.all([
      api.listEvents(query),
      view === "term" ? api.listTerms(year) : Promise.resolve({ terms: [] as SchoolTerm[] }),
    ])
      .then(([eventResult, termResult]) => {
        if (cancelled) return;
        setEvents(eventResult.events);
        setTerms(termResult.terms);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load events");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [view, year, month, q, category, reloadKey]);

  const cells = useMemo(() => monthGrid(year, month), [year, month]);
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const event of events) counts[event.category] = (counts[event.category] ?? 0) + 1;
    return counts;
  }, [events]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    void navigate({ search: { ...search, year: d.getFullYear(), month: d.getMonth() + 1 } });
  }

  function refresh() {
    setReloadKey((k) => k + 1);
  }

  let heading = "All events";
  if (view === "month") heading = `${MONTH_NAMES[month - 1]} ${year}`;
  if (view === "term") heading = `School terms · ${year}`;
  if (view === "list" && q) heading = `Results for “${q}”`;

  return (
    <>
      <section className="page-head">
        <div>
          <p className="eyebrow">A shared sense of time</p>
          <h1>{heading}</h1>
          <p className="lede">
            Public holidays, KRA filing windows, school terms and deadlines — collected in one
            place.
          </p>
        </div>
        <button
          className="btn btn-primary add-btn"
          type="button"
          onClick={() =>
            setDialog({ event: null, date: `${year}-${String(month).padStart(2, "0")}-01` })
          }
        >
          <Plus size={17} /> Add event
        </button>
      </section>

      <section className="toolbar">
        <div className="toolbar-group">
          <button
            className="icon-btn"
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() =>
              void navigate({ search: { ...search, year: currentYear, month: currentMonth } })
            }
          >
            <CalendarDays size={15} /> Today
          </button>
          <button
            className="icon-btn"
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <label className="search-box">
          <Search size={17} />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Look up an event by name…"
            aria-label="Search events by name"
          />
        </label>

        <label className="select-box">
          <select
            value={category}
            onChange={(e) => void navigate({ search: { ...search, category: e.target.value } })}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All categories" : CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="stats">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <div className={`stat cat-${key}`} key={key}>
            <span className="stat-dot" />
            <span className="stat-label">{label}</span>
            <strong>{stats[key] ?? 0}</strong>
          </div>
        ))}
        <div className="stat stat-total">
          <span className="stat-label">Total in view</span>
          <strong>{events.length}</strong>
        </div>
      </section>

      {error && (
        <div className="banner banner-error" role="alert">
          {error} — is the API running? (<code>pnpm dev</code>)
        </div>
      )}
      {loading && <div className="banner">Loading dates…</div>}

      {view === "month" && (
        <CalendarGrid
          cells={cells}
          events={events}
          onDayClick={(date) => setDialog({ event: null, date })}
          onEventClick={(event) => setDialog({ event, date: event.startDate })}
        />
      )}
      {view === "term" && (
        <TermView
          terms={terms}
          events={events}
          selectedTerm={selectedTerm}
          onSelect={setSelectedTerm}
          onEventClick={(event) => setDialog({ event, date: event.startDate })}
        />
      )}
      {view === "list" && (
        <ListView
          events={events}
          onEventClick={(event) => setDialog({ event, date: event.startDate })}
        />
      )}

      {dialog && (
        <EventDialog
          key={dialog.event?.id ?? dialog.date}
          initial={dialog.event}
          defaultDate={dialog.date}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            refresh();
          }}
        />
      )}
    </>
  );
}
