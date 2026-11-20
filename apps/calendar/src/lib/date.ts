export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  holiday: "Public holiday",
  tax: "Tax / KRA",
  school: "School",
  deadline: "Deadline",
  other: "Other",
};

/** Format a local date as yyyy-mm-dd without timezone surprises. */
export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function monthBounds(
  year: number,
  month: number,
): { from: string; to: string; days: number } {
  const days = new Date(year, month, 0).getDate();
  return {
    from: toISO(new Date(year, month - 1, 1)),
    to: toISO(new Date(year, month - 1, days)),
    days,
  };
}

export interface GridCell {
  iso: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

/** A fixed 6×7 calendar grid (42 cells) for the given month. */
export function monthGrid(year: number, month: number): GridCell[] {
  const first = new Date(year, month - 1, 1);
  const startOffset = first.getDay();
  const start = new Date(year, month - 1, 1 - startOffset);
  const today = toISO(new Date());

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const iso = toISO(date);
    return {
      iso,
      day: date.getDate(),
      inMonth: date.getMonth() === month - 1,
      isToday: iso === today,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    };
  });
}

/** True when an event overlaps a given day (inclusive). A null end date means a single-day event. */
export function eventOnDay(start: string, end: string | null, day: string): boolean {
  return end ? day >= start && day <= end : day === start;
}

export function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(y!, m! - 1, d!));
}

export function formatRange(start: string, end: string | null): string {
  return end ? `${formatShortDate(start)} → ${formatShortDate(end)}` : formatShortDate(start);
}
