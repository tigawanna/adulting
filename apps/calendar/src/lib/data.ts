import type { CalendarEvent, EventInput, EventQuery, SchoolTerm } from "./types";

/**
 * Server functions. Each `"use server"` body is compiled away from the client
 * bundle by @solidjs/vite-plugin; the browser calls Solid's server-function
 * transport instead of a separate REST API.
 */

type ServerDb = typeof import("../../server/db.js");

let ready: Promise<ServerDb> | null = null;
function server(): Promise<ServerDb> {
  ready ??= import("../../server/db.js").then(async (mod) => {
    await mod.initializeDatabase();
    return mod;
  });
  return ready;
}

export interface CalendarData {
  events: CalendarEvent[];
  terms: SchoolTerm[];
}

export async function getCalendarData(
  params: EventQuery & { year: number; withTerms: boolean },
): Promise<CalendarData> {
  "use server";
  const db = await server();
  const [events, terms] = await Promise.all([
    db.listEvents({
      from: params.from,
      to: params.to,
      search: params.search,
      category: params.category as never,
    }),
    params.withTerms ? db.listTerms(params.year) : Promise.resolve([]),
  ]);
  return { events, terms };
}

export async function getCategories(): Promise<string[]> {
  "use server";
  const db = await server();
  return db.listCategories();
}

export async function addEvent(input: EventInput): Promise<CalendarEvent> {
  "use server";
  const db = await server();
  const created = await db.createEvent(input);
  return created;
}

export async function editEvent(
  id: string,
  input: Partial<EventInput>,
): Promise<CalendarEvent | null> {
  "use server";
  const db = await server();
  const updated = await db.updateEvent(id, input);
  return updated;
}

export async function removeEvent(id: string): Promise<boolean> {
  "use server";
  const db = await server();
  const removed = await db.deleteEvent(id);
  return removed;
}
