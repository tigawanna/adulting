-- Kenya Tools Calendar schema.
-- Runs on every API start (idempotent) and from `pnpm db:init`.

CREATE TABLE IF NOT EXISTS events (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL DEFAULT 'other',
  start_date      TEXT NOT NULL,          -- ISO yyyy-mm-dd
  end_date        TEXT,                   -- nullable: ranges (filing windows, terms)
  recurrence      TEXT NOT NULL DEFAULT 'none',  -- none | yearly | monthly
  location        TEXT,
  source          TEXT,                   -- provenance, e.g. "KRA calendar 2026"
  source_url      TEXT,
  tags            TEXT NOT NULL DEFAULT '[]',    -- JSON array of strings
  embedding       BLOB,                   -- reserved: float32 vector for semantic search
  embedding_model TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_start_date ON events (start_date);
CREATE INDEX IF NOT EXISTS idx_events_end_date   ON events (end_date);
CREATE INDEX IF NOT EXISTS idx_events_category   ON events (category);
CREATE INDEX IF NOT EXISTS idx_events_title      ON events (title);

CREATE TABLE IF NOT EXISTS school_terms (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,              -- e.g. "Term 1 2026"
  year        INTEGER NOT NULL,
  term_number INTEGER NOT NULL,
  start_date  TEXT NOT NULL,
  end_date    TEXT NOT NULL,
  UNIQUE (year, term_number)
);

CREATE INDEX IF NOT EXISTS idx_terms_year ON school_terms (year);
