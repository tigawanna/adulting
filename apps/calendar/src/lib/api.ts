import type { CalendarEvent, EventInput, SchoolTerm } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`/api${path}`, { ...init, headers });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export interface EventQuery {
  from?: string;
  to?: string;
  search?: string;
  category?: string;
}

export const api = {
  listEvents(query: EventQuery = {}): Promise<{ events: CalendarEvent[]; count: number }> {
    const params = new URLSearchParams();
    if (query.from) params.set("from", query.from);
    if (query.to) params.set("to", query.to);
    if (query.search) params.set("search", query.search);
    if (query.category) params.set("category", query.category);
    const suffix = params.size ? `?${params}` : "";
    return request(`/events${suffix}`);
  },

  createEvent(input: EventInput): Promise<CalendarEvent> {
    return request("/events", { method: "POST", body: JSON.stringify(input) });
  },

  updateEvent(id: string, input: Partial<EventInput>): Promise<CalendarEvent> {
    return request(`/events/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  deleteEvent(id: string): Promise<void> {
    return request(`/events/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  listTerms(year?: number): Promise<{ terms: SchoolTerm[] }> {
    return request(`/terms${year ? `?year=${year}` : ""}`);
  },
};
