import { useState, type FormEvent } from "react";
import { CalendarDays, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { CATEGORY_LABELS } from "@/lib/date";
import type { CalendarEvent, EventCategory, EventInput } from "@/lib/types";

interface Props {
  initial: CalendarEvent | null;
  defaultDate: string;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES: EventCategory[] = ["holiday", "tax", "school", "deadline", "other"];
const RECURRENCES = ["none", "yearly", "monthly"] as const;

export function EventDialog({ initial, defaultDate, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<EventCategory>(initial?.category ?? "other");
  const [startDate, setStartDate] = useState(initial?.startDate ?? defaultDate);
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [recurrence, setRecurrence] = useState<(typeof RECURRENCES)[number]>(
    initial?.recurrence ?? "none",
  );
  const [location, setLocation] = useState(initial?.location ?? "");
  const [source, setSource] = useState(initial?.source ?? "");
  const [sourceUrl, setSourceUrl] = useState(initial?.sourceUrl ?? "");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const input: EventInput = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      startDate,
      endDate: endDate || null,
      recurrence,
      location: location.trim() || null,
      source: source.trim() || null,
      sourceUrl: sourceUrl.trim() || null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    try {
      if (initial) await api.updateEvent(initial.id, input);
      else await api.createEvent(input);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save event");
      setSaving(false);
    }
  }

  let submitLabel = "Add event";
  if (initial) submitLabel = "Save changes";
  if (saving) submitLabel = "Saving…";

  async function handleDelete() {
    if (!initial) return;
    if (!confirm(`Delete "${initial.title}"?`)) return;
    setSaving(true);
    try {
      await api.deleteEvent(initial.id);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete event");
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div className="modal-heading">
            <span className="modal-icon">
              <CalendarDays size={18} />
            </span>
            <div>
              <h2 id="dialog-title">{initial ? "Edit event" : "Add an event"}</h2>
              <p>Record a date worth remembering.</p>
            </div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field field-wide">
              <span>Title *</span>
              <input
                autoFocus
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. KRA VAT filing"
              />
            </label>

            <label className="field field-wide">
              <span>Description</span>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this date about?"
              />
            </label>

            <label className="field">
              <span>Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Recurrence</span>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as typeof recurrence)}
              >
                <option value="none">Once</option>
                <option value="yearly">Every year</option>
                <option value="monthly">Every month</option>
              </select>
            </label>

            <label className="field">
              <span>Start date *</span>
              <input
                required
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>

            <label className="field">
              <span>End date</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>

            <label className="field">
              <span>Location</span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Optional"
              />
            </label>

            <label className="field">
              <span>Tags</span>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="kra, vat, monthly"
              />
            </label>

            <label className="field">
              <span>Source</span>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. KRA calendar 2026"
              />
            </label>

            <label className="field">
              <span>Source URL</span>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://…"
              />
            </label>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="modal-actions">
            {initial && (
              <button
                className="btn btn-danger-ghost"
                type="button"
                onClick={handleDelete}
                disabled={saving}
              >
                <Trash2 size={15} /> Delete
              </button>
            )}
            <span className="spacer" />
            <button className="btn btn-ghost" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
