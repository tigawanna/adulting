import { formatShortDate, eventOnDay } from "@/lib/date";
import type { CalendarEvent, SchoolTerm } from "@/lib/types";

interface Props {
  terms: SchoolTerm[];
  events: CalendarEvent[];
  selectedTerm: number | null;
  onSelect: (term: number | null) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function TermView({ terms, events, selectedTerm, onSelect, onEventClick }: Props) {
  const active = terms.find((t) => t.termNumber === selectedTerm) ?? null;
  const shown = active
    ? events.filter((e) =>
        Array.from({ length: daysBetween(active.startDate, active.endDate) }, (_, i) =>
          addDays(active.startDate, i),
        ).some((day) => eventOnDay(e.startDate, e.endDate, day)),
      )
    : events;

  if (terms.length === 0) {
    return (
      <div className="empty-state">
        <h3>No school terms recorded yet</h3>
        <p>
          Run <code>pnpm seed</code> in this app, or add terms through the API, to see the term
          view.
        </p>
      </div>
    );
  }

  return (
    <div className="term-view">
      <div className="term-cards">
        {terms.map((term) => {
          const count = events.filter((e) =>
            Array.from({ length: daysBetween(term.startDate, term.endDate) }, (_, i) =>
              addDays(term.startDate, i),
            ).some((day) => eventOnDay(e.startDate, e.endDate, day)),
          ).length;
          return (
            <button
              key={term.id}
              type="button"
              className={`term-card ${selectedTerm === term.termNumber ? "selected" : ""}`}
              onClick={() => onSelect(selectedTerm === term.termNumber ? null : term.termNumber)}
            >
              <span className="term-kicker">{term.year}</span>
              <strong>Term {term.termNumber}</strong>
              <span className="term-range">
                {formatShortDate(term.startDate)} — {formatShortDate(term.endDate)}
              </span>
              <span className="term-count">
                {count} event{count === 1 ? "" : "s"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="term-events">
        <h3>{active ? `${active.name} · events` : "All events this year"}</h3>
        {shown.length === 0 ? (
          <p className="muted">Nothing recorded for this range yet.</p>
        ) : (
          <ul className="event-list">
            {shown.map((event) => (
              <li key={event.id}>
                <button type="button" onClick={() => onEventClick(event)}>
                  <span className={`event-pill cat-${event.category}`}>
                    <span className="pill-dot" />
                  </span>
                  <span className="list-main">
                    <strong>{event.title}</strong>
                    <small>
                      {formatShortDate(event.startDate)}
                      {event.endDate ? ` → ${formatShortDate(event.endDate)}` : ""}
                    </small>
                  </span>
                  <span className="list-source">{event.source ?? ""}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y!, m! - 1, d! + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function daysBetween(start: string, end: string): number {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const a = Date.UTC(sy!, sm! - 1, sd!);
  const b = Date.UTC(ey!, em! - 1, ed!);
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}
