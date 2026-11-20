import { For, Show, type Component } from "solid-js";
import { DAY_NAMES, eventOnDay, type GridCell } from "@/lib/date";
import type { CalendarEvent } from "@/lib/types";

interface Props {
  cells: GridCell[];
  events: CalendarEvent[];
  onDayClick: (iso: string) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export const CalendarGrid: Component<Props> = (props) => {
  const forDay = (iso: string) =>
    props.events.filter((e) => eventOnDay(e.startDate, e.endDate, iso));

  return (
    <div class="calendar">
      <div class="calendar-weekdays">
        <For each={DAY_NAMES}>{(day) => <div>{day}</div>}</For>
      </div>
      <div class="calendar-grid">
        <For each={props.cells}>
          {(cell) => {
            const events = () => forDay(cell.iso);
            return (
              <div
                class={`day ${cell.inMonth ? "" : "outside"} ${cell.isWeekend ? "weekend" : ""} ${cell.isToday ? "today" : ""}`}
              >
                <button
                  type="button"
                  class="day-number"
                  title="Add a date on this day"
                  onClick={() => props.onDayClick(cell.iso)}
                >
                  {cell.day}
                </button>
                <div class="day-events">
                  <For each={events().slice(0, 3)}>
                    {(event) => (
                      <button
                        type="button"
                        class={`event-pill cat-${event.category}`}
                        title={event.description ?? event.title}
                        onClick={() => props.onEventClick(event)}
                      >
                        <span class="pill-dot" />
                        <span class="pill-title">{event.title}</span>
                      </button>
                    )}
                  </For>
                  <Show when={events().length > 3}>
                    <span class="more">+{events().length - 3} more</span>
                  </Show>
                </div>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};
