import { For, Show, type Component } from "solid-js";
import { eventOnDay, formatShortDate } from "@/lib/date";
import type { CalendarEvent, SchoolTerm } from "@/lib/types";

interface Props {
  terms: SchoolTerm[];
  events: CalendarEvent[];
  selectedTerm: number | null;
  onSelect: (term: number | null) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const daysIn = (start: string, end: string): string[] => {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const count = Math.max(
    1,
    Math.round((Date.UTC(ey!, em! - 1, ed!) - Date.UTC(sy!, sm! - 1, sd!)) / 86_400_000) + 1,
  );
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(sy!, sm! - 1, sd! + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
};

export const TermView: Component<Props> = (props) => {
  const inTerm = (term: SchoolTerm) => {
    const days = daysIn(term.startDate, term.endDate);
    return props.events.filter((e) => days.some((day) => eventOnDay(e.startDate, e.endDate, day)));
  };
  const active = () => props.terms.find((t) => t.termNumber === props.selectedTerm) ?? null;
  const shown = () => (active() ? inTerm(active()!) : props.events);

  return (
    <Show
      when={props.terms.length > 0}
      fallback={
        <div class="empty-state">
          <h3>No school terms recorded yet</h3>
          <p>
            Run <code>pnpm seed</code> in this app, or add terms through the API.
          </p>
        </div>
      }
    >
      <div class="term-cards">
        <For each={props.terms}>
          {(term) => (
            <button
              type="button"
              class={`term-card ${props.selectedTerm === term.termNumber ? "selected" : ""}`}
              onClick={() =>
                props.onSelect(props.selectedTerm === term.termNumber ? null : term.termNumber)
              }
            >
              <span class="term-kicker">{term.year}</span>
              <strong>Term {term.termNumber}</strong>
              <span class="term-range">
                {formatShortDate(term.startDate)} — {formatShortDate(term.endDate)}
              </span>
              <span class="term-count">{inTerm(term).length} dates</span>
            </button>
          )}
        </For>
      </div>

      <div class="term-events">
        <h3>{active() ? `${active()!.name} · dates` : "All dates this year"}</h3>
        <Show
          when={shown().length > 0}
          fallback={<p class="muted">Nothing recorded for this range yet.</p>}
        >
          <ul class="event-list">
            <For each={shown()}>
              {(event) => (
                <li>
                  <button type="button" onClick={() => props.onEventClick(event)}>
                    <span class={`list-marker cat-${event.category}`} />
                    <span class="list-main">
                      <strong>{event.title}</strong>
                      <small>
                        {formatShortDate(event.startDate)}
                        {event.endDate ? ` → ${formatShortDate(event.endDate)}` : ""}
                      </small>
                    </span>
                    <span class="list-source">{event.source ?? ""}</span>
                  </button>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>
    </Show>
  );
};
