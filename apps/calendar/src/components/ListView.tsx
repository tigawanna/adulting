import { For, Show, type Component } from "solid-js";
import { formatRange } from "@/lib/date";
import type { CalendarEvent } from "@/lib/types";

interface Props {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export const ListView: Component<Props> = (props) => (
  <Show
    when={props.events.length > 0}
    fallback={
      <div class="empty-state">
        <h3>No matching dates</h3>
        <p>Try a different name, tag or category — or add a new date.</p>
      </div>
    }
  >
    <div class="table-wrap">
      <table class="event-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Event</th>
            <th>Category</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          <For each={props.events}>
            {(event) => (
              <tr
                tabindex={0}
                onClick={() => props.onEventClick(event)}
                onKeyDown={(e) => e.key === "Enter" && props.onEventClick(event)}
              >
                <td class="date-cell">{formatRange(event.startDate, event.endDate)}</td>
                <td>
                  <strong>{event.title}</strong>
                  <Show when={event.description}>
                    <small>{event.description}</small>
                  </Show>
                </td>
                <td>
                  <span class={`badge cat-${event.category}`}>{event.category}</span>
                </td>
                <td class="source-cell">{event.source ?? "—"}</td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  </Show>
);
