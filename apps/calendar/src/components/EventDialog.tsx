import { IconCalendarPlus, IconTrash, IconX } from "@/components/Icons";
import { createSignal, For, Show, type Component } from "solid-js";
import { addEvent, editEvent, removeEvent } from "@/lib/data";
import { CATEGORY_LABELS } from "@/lib/date";
import type { CalendarEvent, EventCategory, EventInput } from "@/lib/types";

interface Props {
  initial: CalendarEvent | null;
  defaultDate: string;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES: EventCategory[] = ["holiday", "tax", "school", "deadline", "other"];

export const EventDialog: Component<Props> = (props) => {
  const [title, setTitle] = createSignal(props.initial?.title ?? "");
  const [description, setDescription] = createSignal(props.initial?.description ?? "");
  const [category, setCategory] = createSignal<EventCategory>(props.initial?.category ?? "other");
  const [startDate, setStartDate] = createSignal(props.initial?.startDate ?? props.defaultDate);
  const [endDate, setEndDate] = createSignal(props.initial?.endDate ?? "");
  const [recurrence, setRecurrence] = createSignal(props.initial?.recurrence ?? "none");
  const [location, setLocation] = createSignal(props.initial?.location ?? "");
  const [source, setSource] = createSignal(props.initial?.source ?? "");
  const [sourceUrl, setSourceUrl] = createSignal(props.initial?.sourceUrl ?? "");
  const [tags, setTags] = createSignal(props.initial?.tags.join(", ") ?? "");
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const submitLabel = () => {
    if (saving()) return "Saving…";
    return props.initial ? "Save changes" : "Add date";
  };

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const input: EventInput = {
      title: title().trim(),
      description: description().trim() || null,
      category: category(),
      startDate: startDate(),
      endDate: endDate() || null,
      recurrence: recurrence() as EventInput["recurrence"],
      location: location().trim() || null,
      source: source().trim() || null,
      sourceUrl: sourceUrl().trim() || null,
      tags: tags()
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    try {
      if (props.initial) await editEvent(props.initial.id, input);
      else await addEvent(input);
      props.onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save date");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!props.initial || !confirm(`Delete "${props.initial.title}"?`)) return;
    setSaving(true);
    try {
      await removeEvent(props.initial.id);
      props.onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete date");
      setSaving(false);
    }
  }

  return (
    <div class="modal-backdrop" onMouseDown={props.onClose}>
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div class="modal-head">
          <div class="modal-heading">
            <span class="modal-icon">
              <IconCalendarPlus size={19} />
            </span>
            <div>
              <h2 id="dialog-title">{props.initial ? "Edit date" : "Add a date"}</h2>
              <p>Keep the record useful — a source makes it verifiable.</p>
            </div>
          </div>
          <button class="icon-btn" type="button" onClick={props.onClose} aria-label="Close">
            <IconX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div class="form-grid">
            <label class="field field-wide">
              <span>Title *</span>
              <input
                autofocus
                required
                value={title()}
                onInput={(e) => setTitle(e.currentTarget.value)}
                placeholder="e.g. KRA VAT filing"
              />
            </label>

            <label class="field field-wide">
              <span>Description</span>
              <textarea
                rows={3}
                value={description()}
                onInput={(e) => setDescription(e.currentTarget.value)}
                placeholder="What is this date about?"
              />
            </label>

            <label class="field">
              <span>Category</span>
              <select
                value={category()}
                onChange={(e) => setCategory(e.currentTarget.value as EventCategory)}
              >
                <For each={CATEGORIES}>
                  {(c) => <option value={c}>{CATEGORY_LABELS[c]}</option>}
                </For>
              </select>
            </label>

            <label class="field">
              <span>Recurrence</span>
              <select
                value={recurrence()}
                onChange={(e) =>
                  setRecurrence(e.currentTarget.value as "none" | "yearly" | "monthly")
                }
              >
                <option value="none">Once</option>
                <option value="yearly">Every year</option>
                <option value="monthly">Every month</option>
              </select>
            </label>

            <label class="field">
              <span>Start date *</span>
              <input
                required
                type="date"
                value={startDate()}
                onInput={(e) => setStartDate(e.currentTarget.value)}
              />
            </label>

            <label class="field">
              <span>End date</span>
              <input
                type="date"
                value={endDate()}
                onInput={(e) => setEndDate(e.currentTarget.value)}
              />
            </label>

            <label class="field">
              <span>Location</span>
              <input
                value={location()}
                onInput={(e) => setLocation(e.currentTarget.value)}
                placeholder="Optional"
              />
            </label>

            <label class="field">
              <span>Tags</span>
              <input
                value={tags()}
                onInput={(e) => setTags(e.currentTarget.value)}
                placeholder="kra, vat, monthly"
              />
            </label>

            <label class="field">
              <span>Source</span>
              <input
                value={source()}
                onInput={(e) => setSource(e.currentTarget.value)}
                placeholder="e.g. KRA calendar 2026"
              />
            </label>

            <label class="field">
              <span>Source URL</span>
              <input
                type="url"
                value={sourceUrl()}
                onInput={(e) => setSourceUrl(e.currentTarget.value)}
                placeholder="https://…"
              />
            </label>
          </div>

          <Show when={error()}>
            <p class="form-error" role="alert">
              {error()}
            </p>
          </Show>

          <div class="modal-actions">
            <Show when={props.initial}>
              <button
                class="btn btn-danger-ghost"
                type="button"
                onClick={handleDelete}
                disabled={saving()}
              >
                <IconTrash size={15} /> Delete
              </button>
            </Show>
            <span class="spacer" />
            <button class="btn btn-ghost" type="button" onClick={props.onClose} disabled={saving()}>
              Cancel
            </button>
            <button class="btn btn-primary" type="submit" disabled={saving()}>
              {submitLabel()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
