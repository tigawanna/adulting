import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { Hono } from "hono";
import {
  createEvent,
  deleteEvent,
  getEvent,
  initializeDatabase,
  listEvents,
  listTerms,
  updateEvent,
  upsertTerm,
  type EventCategory,
  type NewEvent,
} from "./db.js";

// Load apps/calendar/.env when present (Node 22+).
try {
  process.loadEnvFile?.(".env");
} catch {
  // no .env file — local defaults apply
}

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: (process.env.CORS_ORIGIN ?? "http://localhost:3061").split(",").map((s) => s.trim()),
  }),
);

const CATEGORIES: EventCategory[] = ["holiday", "tax", "school", "deadline", "other"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

app.get("/api/health", (c) => c.json({ ok: true, service: "kenya-tools-calendar" }));

app.get("/api/events", async (c) => {
  const from = c.req.query("from");
  const to = c.req.query("to");
  const search = c.req.query("search")?.trim() || undefined;
  const category = c.req.query("category") as EventCategory | undefined;

  if (from && !ISO_DATE.test(from)) return badRequest("from must be yyyy-mm-dd");
  if (to && !ISO_DATE.test(to)) return badRequest("to must be yyyy-mm-dd");
  if (category && !CATEGORIES.includes(category)) return badRequest("unknown category");

  const events = await listEvents({ from, to, search, category });
  return c.json({ events, count: events.length });
});

app.get("/api/events/:id", async (c) => {
  const event = await getEvent(c.req.param("id"));
  return event ? c.json(event) : c.json({ error: "Not found" }, 404);
});

app.post("/api/events", async (c) => {
  let body: Partial<NewEvent>;
  try {
    body = await c.req.json();
  } catch {
    return badRequest("invalid JSON body");
  }
  if (!body.title?.trim()) return badRequest("title is required");
  if (!body.startDate || !ISO_DATE.test(body.startDate))
    return badRequest("startDate must be yyyy-mm-dd");
  if (body.endDate && !ISO_DATE.test(body.endDate)) return badRequest("endDate must be yyyy-mm-dd");
  if (body.category && !CATEGORIES.includes(body.category)) return badRequest("unknown category");

  const created = await createEvent({
    title: body.title.trim(),
    description: body.description ?? null,
    category: body.category ?? "other",
    startDate: body.startDate,
    endDate: body.endDate ?? null,
    recurrence: body.recurrence ?? "none",
    location: body.location ?? null,
    source: body.source ?? null,
    sourceUrl: body.sourceUrl ?? null,
    tags: Array.isArray(body.tags) ? body.tags : [],
  });
  return c.json(created, 201);
});

app.patch("/api/events/:id", async (c) => {
  let body: Partial<NewEvent>;
  try {
    body = await c.req.json();
  } catch {
    return badRequest("invalid JSON body");
  }
  if (body.startDate && !ISO_DATE.test(body.startDate))
    return badRequest("startDate must be yyyy-mm-dd");
  if (body.endDate && !ISO_DATE.test(body.endDate)) return badRequest("endDate must be yyyy-mm-dd");
  if (body.category && !CATEGORIES.includes(body.category)) return badRequest("unknown category");

  const updated = await updateEvent(c.req.param("id"), body);
  return updated ? c.json(updated) : c.json({ error: "Not found" }, 404);
});

app.delete("/api/events/:id", async (c) => {
  const removed = await deleteEvent(c.req.param("id"));
  return removed ? c.body(null, 204) : c.json({ error: "Not found" }, 404);
});

app.get("/api/terms", async (c) => {
  const yearParam = c.req.query("year");
  const year = yearParam ? Number(yearParam) : undefined;
  if (year !== undefined && !Number.isInteger(year)) return badRequest("year must be an integer");
  return c.json({ terms: await listTerms(year) });
});

app.post("/api/terms", async (c) => {
  let body: {
    name?: string;
    year?: number;
    termNumber?: number;
    startDate?: string;
    endDate?: string;
  };
  try {
    body = await c.req.json();
  } catch {
    return badRequest("invalid JSON body");
  }
  const { name, year, termNumber, startDate, endDate } = body;
  if (!name?.trim()) return badRequest("name is required");
  if (!year || !termNumber || !startDate || !endDate)
    return badRequest("year, termNumber, startDate and endDate are required");
  if (!ISO_DATE.test(startDate) || !ISO_DATE.test(endDate))
    return badRequest("dates must be yyyy-mm-dd");

  const term = await upsertTerm({
    name: name.trim(),
    year,
    termNumber,
    startDate,
    endDate,
  });
  return c.json(term, 201);
});

const port = Number(process.env.PORT ?? 3161);

await initializeDatabase();
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Calendar API listening on http://localhost:${info.port}`);
});
