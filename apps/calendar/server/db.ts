import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createClient, type Client, type InValue } from "@libsql/client";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

let client: Client | null = null;

/** Resolve the configured database URL, creating the local data dir if needed. */
function databaseConfig(): { url: string; authToken?: string } {
  const url = process.env.DATABASE_URL?.trim() || "file:./data/calendar.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN?.trim() || undefined;

  if (url.startsWith("file:")) {
    const filePath = resolve(url.slice("file:".length));
    mkdirSync(dirname(filePath), { recursive: true });
  }

  return { url, authToken };
}

/** Lazily-created singleton libSQL client (works with `file:` and `libsql://`). */
export function getDb(): Client {
  if (!client) client = createClient(databaseConfig());
  return client;
}

/** Apply the idempotent schema. Safe to call on every boot. */
export async function initializeDatabase(): Promise<void> {
  const schemaPath = fileURLToPath(new URL("./schema.sql", import.meta.url));
  const schema = await readFile(schemaPath, "utf8");
  await getDb().executeMultiple(schema);
}

// ── Types ──────────────────────────────────────────────────────────────────

export type EventCategory = "holiday" | "tax" | "school" | "deadline" | "other";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  startDate: string;
  endDate: string | null;
  recurrence: "none" | "yearly" | "monthly";
  location: string | null;
  source: string | null;
  sourceUrl: string | null;
  tags: string[];
  embedding: ArrayBuffer | null;
  embeddingModel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewEvent {
  title: string;
  description?: string | null;
  category?: EventCategory;
  startDate: string;
  endDate?: string | null;
  recurrence?: "none" | "yearly" | "monthly";
  location?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  tags?: string[];
}

type Row = Record<string, InValue>;

/** Narrow a libSQL cell to text without relying on Object's default stringification. */
function text(value: InValue | null | undefined): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean")
    return String(value);
  if (value instanceof Date) return value.toISOString();
  return "";
}

function nullableText(value: InValue | null | undefined): string | null {
  if (value == null) return null;
  return text(value) || null;
}

function toEvent(row: Row): CalendarEvent {
  let tags: string[] = [];
  try {
    const parsed: unknown = JSON.parse(text(row.tags) || "[]");
    if (Array.isArray(parsed)) tags = parsed.filter((t): t is string => typeof t === "string");
  } catch {
    tags = [];
  }
  return {
    id: text(row.id),
    title: text(row.title),
    description: nullableText(row.description),
    category: text(row.category) as EventCategory,
    startDate: text(row.start_date),
    endDate: nullableText(row.end_date),
    recurrence: text(row.recurrence) as CalendarEvent["recurrence"],
    location: nullableText(row.location),
    source: nullableText(row.source),
    sourceUrl: nullableText(row.source_url),
    tags,
    embedding: row.embedding instanceof ArrayBuffer ? row.embedding : null,
    embeddingModel: nullableText(row.embedding_model),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

// ── Queries ────────────────────────────────────────────────────────────────

export interface EventQuery {
  from?: string;
  to?: string;
  search?: string;
  category?: EventCategory;
}

/**
 * List events overlapping a date range.
 *
 * Non-recurring events are filtered in SQL. Recurring events are expanded in
 * JS into the requested range so holidays keep showing up year after year.
 */
export async function listEvents(query: EventQuery = {}): Promise<CalendarEvent[]> {
  const db = getDb();
  const where: string[] = [];
  const args: InValue[] = [];

  if (query.from && query.to) {
    // Point events must fall inside the range; ranged events must overlap it.
    // Recurring events are always fetched and expanded into range below.
    where.push(
      "(recurrence != 'none' OR (end_date IS NOT NULL AND start_date <= ? AND end_date >= ?) OR (end_date IS NULL AND start_date >= ? AND start_date <= ?))",
    );
    args.push(query.to, query.from, query.from, query.to);
  } else if (query.from) {
    where.push("(recurrence != 'none' OR end_date >= ? OR start_date >= ?)");
    args.push(query.from, query.from);
  } else if (query.to) {
    where.push("(recurrence != 'none' OR start_date <= ?)");
    args.push(query.to);
  }

  if (query.category) {
    where.push("category = ?");
    args.push(query.category);
  }

  if (query.search) {
    const like = `%${query.search}%`;
    where.push(
      "(lower(title) LIKE lower(?) OR lower(COALESCE(description,'')) LIKE lower(?) OR lower(tags) LIKE lower(?))",
    );
    args.push(like, like, like);
  }

  const sql = `SELECT * FROM events${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY start_date ASC, title ASC`;
  const result = await db.execute({ sql, args });
  const events = result.rows.map((row) => toEvent(row as Row));

  if (!query.from || !query.to) return events;

  // Expand recurring events into [from, to].
  const expanded: CalendarEvent[] = [];
  for (const event of events) {
    if (event.recurrence === "none") {
      expanded.push(event);
      continue;
    }
    expanded.push(...expandRecurring(event, query.from, query.to));
  }
  return expanded.sort(
    (a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title),
  );
}

function expandRecurring(event: CalendarEvent, from: string, to: string): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  const originalStart = new Date(`${event.startDate}T00:00:00Z`);
  const originalEnd = event.endDate ? new Date(`${event.endDate}T00:00:00Z`) : null;
  const cursor = new Date(`${from}T00:00:00Z`);
  const limit = new Date(`${to}T00:00:00Z`);

  if (Number.isNaN(originalStart.getTime())) return [event];

  // Walk month by month; handles both yearly and monthly recurrence.
  while (cursor <= limit) {
    const y = cursor.getUTCFullYear();
    const m = cursor.getUTCMonth();
    let occurrence: Date | null = null;

    if (event.recurrence === "yearly") {
      if (m === originalStart.getUTCMonth()) {
        occurrence = new Date(Date.UTC(y, originalStart.getUTCMonth(), originalStart.getUTCDate()));
      }
    } else {
      occurrence = new Date(Date.UTC(y, m, originalStart.getUTCDate()));
    }

    if (occurrence && occurrence >= originalStart && occurrence <= limit) {
      const spanDays = originalEnd
        ? Math.round((originalEnd.getTime() - originalStart.getTime()) / 86_400_000)
        : 0;
      const occEnd = new Date(occurrence.getTime() + spanDays * 86_400_000);
      if (occEnd >= cursor) {
        out.push({
          ...event,
          id: `${event.id}::${occurrence.toISOString().slice(0, 10)}`,
          startDate: occurrence.toISOString().slice(0, 10),
          endDate: spanDays ? occEnd.toISOString().slice(0, 10) : null,
        });
      }
    }

    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return out;
}

export async function listCategories(): Promise<string[]> {
  const result = await getDb().execute("SELECT DISTINCT category FROM events ORDER BY category");
  return result.rows
    .map((row) => text((row as Row).category))
    .filter((value): value is string => value.length > 0);
}

export async function getEvent(id: string): Promise<CalendarEvent | null> {
  const result = await getDb().execute({ sql: "SELECT * FROM events WHERE id = ?", args: [id] });
  const row = result.rows[0];
  return row ? toEvent(row as Row) : null;
}

export async function createEvent(input: NewEvent): Promise<CalendarEvent> {
  const id = randomUUID();
  await getDb().execute({
    sql: `INSERT INTO events
      (id, title, description, category, start_date, end_date, recurrence, location, source, source_url, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.title,
      input.description ?? null,
      input.category ?? "other",
      input.startDate,
      input.endDate ?? null,
      input.recurrence ?? "none",
      input.location ?? null,
      input.source ?? null,
      input.sourceUrl ?? null,
      JSON.stringify(input.tags ?? []),
    ],
  });
  return (await getEvent(id))!;
}

export async function updateEvent(
  id: string,
  input: Partial<NewEvent>,
): Promise<CalendarEvent | null> {
  const existing = await getEvent(id);
  if (!existing) return null;

  const merged: CalendarEvent = {
    ...existing,
    ...(input.title !== undefined && { title: input.title }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.category !== undefined && { category: input.category }),
    ...(input.startDate !== undefined && { startDate: input.startDate }),
    ...(input.endDate !== undefined && { endDate: input.endDate }),
    ...(input.recurrence !== undefined && { recurrence: input.recurrence }),
    ...(input.location !== undefined && { location: input.location }),
    ...(input.source !== undefined && { source: input.source }),
    ...(input.sourceUrl !== undefined && { sourceUrl: input.sourceUrl }),
    ...(input.tags !== undefined && { tags: input.tags }),
  };

  await getDb().execute({
    sql: `UPDATE events SET title=?, description=?, category=?, start_date=?, end_date=?,
          recurrence=?, location=?, source=?, source_url=?, tags=?, updated_at=datetime('now')
          WHERE id=?`,
    args: [
      merged.title,
      merged.description,
      merged.category,
      merged.startDate,
      merged.endDate,
      merged.recurrence,
      merged.location,
      merged.source,
      merged.sourceUrl,
      JSON.stringify(merged.tags),
      id,
    ],
  });
  return getEvent(id);
}

export async function deleteEvent(id: string): Promise<boolean> {
  const result = await getDb().execute({ sql: "DELETE FROM events WHERE id = ?", args: [id] });
  return (result.rowsAffected ?? 0) > 0;
}

// ── School terms ───────────────────────────────────────────────────────────

export interface SchoolTerm {
  id: string;
  name: string;
  year: number;
  termNumber: number;
  startDate: string;
  endDate: string;
}

export async function listTerms(year?: number): Promise<SchoolTerm[]> {
  const result = year
    ? await getDb().execute({
        sql: "SELECT * FROM school_terms WHERE year = ? ORDER BY start_date",
        args: [year],
      })
    : await getDb().execute("SELECT * FROM school_terms ORDER BY start_date");
  return result.rows.map((row) => {
    const r = row as Row;
    return {
      id: text(r.id),
      name: text(r.name),
      year: Number(text(r.year)),
      termNumber: Number(text(r.term_number)),
      startDate: text(r.start_date),
      endDate: text(r.end_date),
    };
  });
}

export async function upsertTerm(
  term: Omit<SchoolTerm, "id"> & { id?: string },
): Promise<SchoolTerm> {
  const id = term.id ?? randomUUID();
  await getDb().execute({
    sql: `INSERT INTO school_terms (id, name, year, term_number, start_date, end_date)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(year, term_number) DO UPDATE SET
            name=excluded.name, start_date=excluded.start_date, end_date=excluded.end_date`,
    args: [id, term.name, term.year, term.termNumber, term.startDate, term.endDate],
  });
  const rows = await listTerms(term.year);
  return rows.find((t) => t.termNumber === term.termNumber)!;
}
