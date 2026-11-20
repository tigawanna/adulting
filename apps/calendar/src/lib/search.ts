export type View = "month" | "term" | "list";

export interface CalendarSearch {
  year: number;
  month: number;
  view: View;
  q: string;
  category: string;
}

const now = new Date();

export function defaultSearch(): CalendarSearch {
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    view: "month",
    q: "",
    category: "all",
  };
}

/** Build a complete search object from a partial one (URL params are optional). */
export function makeSearch(
  prev: Partial<CalendarSearch> = {},
  patch: Partial<CalendarSearch> = {},
): CalendarSearch {
  const defined = <T extends object>(obj: T): Partial<T> =>
    Object.fromEntries(
      Object.entries(obj).filter(([, value]) => value !== undefined),
    ) as Partial<T>;
  return { ...defaultSearch(), ...defined(prev), ...defined(patch) };
}

export function parseSearch(raw: Record<string, unknown>): CalendarSearch {
  const year = Number(raw.year);
  const month = Number(raw.month);
  const view = raw.view;
  return makeSearch(
    {},
    {
      year: Number.isInteger(year) && year > 1900 && year < 2200 ? year : undefined,
      month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : undefined,
      view: view === "term" || view === "list" || view === "month" ? view : undefined,
      q: typeof raw.q === "string" ? raw.q : undefined,
      category: typeof raw.category === "string" ? raw.category : undefined,
    },
  );
}
