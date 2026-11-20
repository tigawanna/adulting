import { DAY_NAMES, eventOnDay, type GridCell } from "@/lib/date";
import type { CalendarEvent } from "@/lib/types";

interface Props {
  cells: GridCell[];
  events: CalendarEvent[];
  onDayClick: (iso: string) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function CalendarGrid({ cells, events, onDayClick, onEventClick }: Props) {
  return (
    <div className="calendar">
      <div className="calendar-weekdays">
        {DAY_NAMES.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((cell) => {
          const dayEvents = events.filter((e) => eventOnDay(e.startDate, e.endDate, cell.iso));
          const visible = dayEvents.slice(0, 3);
          const extra = dayEvents.length - visible.length;
          return (
            <div
              key={cell.iso}
              className={`day ${cell.inMonth ? "" : "outside"} ${cell.isWeekend ? "weekend" : ""} ${cell.isToday ? "today" : ""}`}
            >
              <button
                className="day-number"
                type="button"
                onClick={() => onDayClick(cell.iso)}
                title="Add an event on this day"
              >
                {cell.day}
              </button>
              <div className="day-events">
                {visible.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className={`event-pill cat-${event.category}`}
                    onClick={() => onEventClick(event)}
                    title={event.description ?? event.title}
                  >
                    <span className="pill-dot" />
                    <span className="pill-title">{event.title}</span>
                  </button>
                ))}
                {extra > 0 && <span className="more">+{extra} more</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
