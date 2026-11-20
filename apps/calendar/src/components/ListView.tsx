import { formatRange } from "@/lib/date";
import type { CalendarEvent } from "@/lib/types";

interface Props {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function ListView({ events, onEventClick }: Props) {
  if (events.length === 0) {
    return (
      <div className="empty-state">
        <h3>No matching events</h3>
        <p>Try a different name, tag or category — or add a new date.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="event-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Event</th>
            <th>Category</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              key={event.id}
              onClick={() => onEventClick(event)}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onEventClick(event)}
            >
              <td className="date-cell">{formatRange(event.startDate, event.endDate)}</td>
              <td>
                <strong>{event.title}</strong>
                {event.description && <small>{event.description}</small>}
              </td>
              <td>
                <span className={`badge cat-${event.category}`}>{event.category}</span>
              </td>
              <td className="source-cell">{event.source ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
