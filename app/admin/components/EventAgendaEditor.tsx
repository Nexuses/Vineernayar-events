"use client";

import type { EventAgendaItem } from "@/lib/event-agenda";

type EventAgendaEditorProps = {
  value: EventAgendaItem[];
  onChange: (items: EventAgendaItem[]) => void;
};

const EMPTY_ITEM: EventAgendaItem = { time: "", title: "", description: "" };

export function EventAgendaEditor({ value, onChange }: EventAgendaEditorProps) {
  function updateItem(index: number, field: keyof EventAgendaItem, next: string) {
    onChange(value.map((item, i) => (i === index ? { ...item, [field]: next } : item)));
  }

  function addItem() {
    onChange([...value, { ...EMPTY_ITEM }]);
  }

  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= value.length) return;
    const next = [...value];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No agenda items yet. Add sessions to show the itinerary on the registration page.
        </p>
      ) : null}

      {value.map((item, index) => (
        <div
          key={index}
          className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Item {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
                className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-white disabled:opacity-40"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 1)}
                disabled={index === value.length - 1}
                className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-white disabled:opacity-40"
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Time</label>
              <input
                type="text"
                value={item.time}
                onChange={(e) => updateItem(index, "time", e.target.value)}
                placeholder="e.g. 03:00 PM - 03:10 PM"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Title</label>
              <input
                type="text"
                value={item.title}
                onChange={(e) => updateItem(index, "title", e.target.value)}
                placeholder="Session title"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-zinc-600">Description</label>
              <textarea
                value={item.description}
                onChange={(e) => updateItem(index, "description", e.target.value)}
                rows={2}
                placeholder="Brief session description"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="rounded-md border border-dashed border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
      >
        + Add agenda item
      </button>
    </div>
  );
}
