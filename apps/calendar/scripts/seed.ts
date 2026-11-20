/**
 * Starter data for the Kenya Tools calendar.
 *
 * ⚠️  These are SEED / REFERENCE values, not an authoritative calendar.
 * Fixed-date public holidays are reliable; movable feasts (Easter, Eid),
 * KRA deadlines and KICD school terms are indicative for 2026 and MUST be
 * verified against the official sources before relying on them. Every row
 * carries a `source` string so provenance is visible in the UI.
 *
 * Re-running this script is safe: rows use stable IDs and are upserted.
 */
import { getDb, initializeDatabase } from "../server/db.js";

try {
  process.loadEnvFile?.(".env");
} catch {
  // no .env file
}

type SeedEvent = {
  id: string;
  title: string;
  description: string;
  category: "holiday" | "tax" | "school" | "deadline" | "other";
  startDate: string;
  endDate?: string | null;
  recurrence?: "none" | "yearly" | "monthly";
  source: string;
  sourceUrl?: string;
  tags: string[];
};

const events: SeedEvent[] = [
  // ── Public holidays (recurring) ──────────────────────────────────────────
  {
    id: "holiday-new-year",
    title: "New Year's Day",
    description: "Public holiday.",
    category: "holiday",
    startDate: "2026-01-01",
    recurrence: "yearly",
    source: "Public Holidays Act",
    tags: ["public-holiday"],
  },
  {
    id: "holiday-good-friday",
    title: "Good Friday",
    description: "Moveable public holiday — verify date each year.",
    category: "holiday",
    startDate: "2026-04-03",
    recurrence: "yearly",
    source: "Indicative 2026 — verify",
    tags: ["public-holiday", "moveable"],
  },
  {
    id: "holiday-easter-monday",
    title: "Easter Monday",
    description: "Moveable public holiday — verify date each year.",
    category: "holiday",
    startDate: "2026-04-06",
    recurrence: "yearly",
    source: "Indicative 2026 — verify",
    tags: ["public-holiday", "moveable"],
  },
  {
    id: "holiday-labour-day",
    title: "Labour Day",
    description: "Public holiday.",
    category: "holiday",
    startDate: "2026-05-01",
    recurrence: "yearly",
    source: "Public Holidays Act",
    tags: ["public-holiday"],
  },
  {
    id: "holiday-madaraka",
    title: "Madaraka Day",
    description: "Public holiday.",
    category: "holiday",
    startDate: "2026-06-01",
    recurrence: "yearly",
    source: "Public Holidays Act",
    tags: ["public-holiday"],
  },
  {
    id: "holiday-mashujaa",
    title: "Mashujaa Day",
    description: "Public holiday (Heroes' Day).",
    category: "holiday",
    startDate: "2026-10-20",
    recurrence: "yearly",
    source: "Public Holidays Act",
    tags: ["public-holiday"],
  },
  {
    id: "holiday-jamhuri",
    title: "Jamhuri Day",
    description: "Public holiday (Republic Day).",
    category: "holiday",
    startDate: "2026-12-12",
    recurrence: "yearly",
    source: "Public Holidays Act",
    tags: ["public-holiday"],
  },
  {
    id: "holiday-christmas",
    title: "Christmas Day",
    description: "Public holiday.",
    category: "holiday",
    startDate: "2026-12-25",
    recurrence: "yearly",
    source: "Public Holidays Act",
    tags: ["public-holiday"],
  },
  {
    id: "holiday-boxing",
    title: "Boxing Day",
    description: "Public holiday.",
    category: "holiday",
    startDate: "2026-12-26",
    recurrence: "yearly",
    source: "Public Holidays Act",
    tags: ["public-holiday"],
  },
  {
    id: "holiday-eid-fitr",
    title: "Eid al-Fitr",
    description: "Moveable public holiday — verify date each year.",
    category: "holiday",
    startDate: "2026-03-20",
    recurrence: "yearly",
    source: "Indicative 2026 — verify",
    tags: ["public-holiday", "moveable"],
  },
  {
    id: "holiday-eid-adha",
    title: "Eid al-Adha",
    description: "Moveable public holiday — verify date each year.",
    category: "holiday",
    startDate: "2026-05-27",
    recurrence: "yearly",
    source: "Indicative 2026 — verify",
    tags: ["public-holiday", "moveable"],
  },

  // ── KRA filing deadlines (monthly) ───────────────────────────────────────
  {
    id: "tax-paye-monthly",
    title: "PAYE & NSSF filing",
    description: "Monthly PAYE/NSSF remittance and filing for the previous month (due by the 9th).",
    category: "tax",
    startDate: "2026-01-09",
    recurrence: "monthly",
    source: "KRA — verify current calendar",
    sourceUrl: "https://www.kra.go.ke/",
    tags: ["kra", "paye", "monthly"],
  },
  {
    id: "tax-vat-monthly",
    title: "VAT filing & payment",
    description: "Monthly VAT return and payment for the previous month (due by the 20th).",
    category: "tax",
    startDate: "2026-01-20",
    recurrence: "monthly",
    source: "KRA — verify current calendar",
    sourceUrl: "https://www.kra.go.ke/",
    tags: ["kra", "vat", "monthly"],
  },
  {
    id: "tax-turnover-monthly",
    title: "Turnover Tax filing",
    description: "Monthly turnover tax return (due by the 20th).",
    category: "tax",
    startDate: "2026-01-20",
    recurrence: "monthly",
    source: "KRA — verify current calendar",
    sourceUrl: "https://www.kra.go.ke/",
    tags: ["kra", "ttx", "monthly"],
  },
  {
    id: "tax-annual-return",
    title: "Annual income tax return",
    description: "Individual annual tax return filing deadline (30 June).",
    category: "tax",
    startDate: "2026-06-30",
    recurrence: "yearly",
    source: "KRA — verify current calendar",
    sourceUrl: "https://www.kra.go.ke/",
    tags: ["kra", "annual"],
  },

  // ── School terms (indicative KICD 2026) ───────────────────────────────────
  {
    id: "school-term1-start-2026",
    title: "School Term 1 begins",
    description: "Indicative KICD 2026 school calendar — verify.",
    category: "school",
    startDate: "2026-01-05",
    source: "Indicative KICD 2026 — verify",
    tags: ["school", "term-1"],
  },
  {
    id: "school-term1-end-2026",
    title: "School Term 1 ends",
    description: "Indicative KICD 2026 school calendar — verify.",
    category: "school",
    startDate: "2026-03-26",
    source: "Indicative KICD 2026 — verify",
    tags: ["school", "term-1"],
  },
  {
    id: "school-term2-start-2026",
    title: "School Term 2 begins",
    description: "Indicative KICD 2026 school calendar — verify.",
    category: "school",
    startDate: "2026-04-20",
    source: "Indicative KICD 2026 — verify",
    tags: ["school", "term-2"],
  },
  {
    id: "school-term2-end-2026",
    title: "School Term 2 ends",
    description: "Indicative KICD 2026 school calendar — verify.",
    category: "school",
    startDate: "2026-07-24",
    source: "Indicative KICD 2026 — verify",
    tags: ["school", "term-2"],
  },
  {
    id: "school-term3-start-2026",
    title: "School Term 3 begins",
    description: "Indicative KICD 2026 school calendar — verify.",
    category: "school",
    startDate: "2026-09-07",
    source: "Indicative KICD 2026 — verify",
    tags: ["school", "term-3"],
  },
  {
    id: "school-term3-end-2026",
    title: "School Term 3 ends",
    description: "Indicative KICD 2026 school calendar — verify.",
    category: "school",
    startDate: "2026-11-20",
    source: "Indicative KICD 2026 — verify",
    tags: ["school", "term-3"],
  },

  // ── Other deadlines ───────────────────────────────────────────────────────
  {
    id: "deadline-kcse-2026",
    title: "KCSE examinations",
    description:
      "Indicative Kenya Certificate of Secondary Education exam window — verify with KNEC.",
    category: "deadline",
    startDate: "2026-11-09",
    endDate: "2026-12-04",
    source: "Indicative KNEC 2026 — verify",
    sourceUrl: "https://www.knec.ac.ke/",
    tags: ["education", "exams"],
  },
];

const terms = [
  {
    id: "term-1-2026",
    name: "Term 1 2026",
    year: 2026,
    termNumber: 1,
    startDate: "2026-01-05",
    endDate: "2026-03-26",
  },
  {
    id: "term-2-2026",
    name: "Term 2 2026",
    year: 2026,
    termNumber: 2,
    startDate: "2026-04-20",
    endDate: "2026-07-24",
  },
  {
    id: "term-3-2026",
    name: "Term 3 2026",
    year: 2026,
    termNumber: 3,
    startDate: "2026-09-07",
    endDate: "2026-11-20",
  },
];

await initializeDatabase();
const db = getDb();

for (const e of events) {
  await db.execute({
    sql: `INSERT INTO events
      (id, title, description, category, start_date, end_date, recurrence, source, source_url, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title, description=excluded.description, category=excluded.category,
        start_date=excluded.start_date, end_date=excluded.end_date, recurrence=excluded.recurrence,
        source=excluded.source, source_url=excluded.source_url, tags=excluded.tags,
        updated_at=datetime('now')`,
    args: [
      e.id,
      e.title,
      e.description,
      e.category,
      e.startDate,
      e.endDate ?? null,
      e.recurrence ?? "none",
      e.source,
      e.sourceUrl ?? null,
      JSON.stringify(e.tags),
    ],
  });
}

for (const t of terms) {
  await db.execute({
    sql: `INSERT INTO school_terms (id, name, year, term_number, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(year, term_number) DO UPDATE SET
        name=excluded.name, start_date=excluded.start_date, end_date=excluded.end_date`,
    args: [t.id, t.name, t.year, t.termNumber, t.startDate, t.endDate],
  });
}

console.log(`Seeded ${events.length} events and ${terms.length} school terms.`);
console.log("Reminder: indicative dates must be verified against KRA / KICD / KNEC.");
db.close();
