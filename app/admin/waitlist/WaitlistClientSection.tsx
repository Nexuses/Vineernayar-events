"use client";

import React, { useEffect, useMemo, useState } from "react";

type EventItem = { eventId: string; eventName: string };

type WaitlistItem = {
  _id: string;
  uniqueCode: string;
  firstName: string;
  surname: string;
  email: string;
  organization?: string;
  designation?: string;
  mobileNumber?: string;
  workedWithVineet?: boolean;
  workedWithVineetDetails?: string;
  questionForVineet?: string;
  addToWhatsapp?: boolean;
  whatsappNumber?: string;
  identityCardOrPassport?: string;
  specialComment?: string;
  apparelSize?: string;
  overnightStay?: boolean;
  passportNic?: string;
  transportNeeded?: boolean;
  transportLocation?: string;
  adminNotes?: string;
  createdAt: string;
};

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function ChevronDown({ className, open }: { className?: string; open: boolean }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
      style={{ transform: open ? "rotate(180deg)" : undefined }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function matchesSearch(
  row: WaitlistItem,
  query: string,
  notes: Record<string, string>
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    row.firstName,
    row.surname,
    `${row.firstName} ${row.surname}`,
    row.email,
    row.mobileNumber,
    row.whatsappNumber,
    row.uniqueCode,
    row.organization,
    row.designation,
    notes[row._id] ?? row.adminNotes,
    row.specialComment,
    row.questionForVineet,
    row.workedWithVineetDetails,
    row.workedWithVineet ? "priority" : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function WaitlistClientSection({ events }: { events: EventItem[] }) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [rows, setRows] = useState<WaitlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  function fetchWaitlist() {
    if (!selectedEventId) return;
    setLoading(true);
    fetch(`/api/admin/waitlist?eventId=${encodeURIComponent(selectedEventId)}`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setRows(list);
        setNotesDraft(
          Object.fromEntries(list.map((r: WaitlistItem) => [r._id, r.adminNotes ?? ""]))
        );
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!selectedEventId) {
      setRows([]);
      setExpandedId(null);
      setSearchQuery("");
      return;
    }
    setSearchQuery("");
    fetchWaitlist();
  }, [selectedEventId]);

  const filteredRows = useMemo(
    () => rows.filter((row) => matchesSearch(row, searchQuery, notesDraft)),
    [rows, searchQuery, notesDraft]
  );

  async function handleSaveNotes(id: string) {
    const adminNotes = notesDraft[id] ?? "";
    const existing = rows.find((r) => r._id === id)?.adminNotes ?? "";
    if (adminNotes === existing) return;

    setSavingNotesId(id);
    try {
      const res = await fetch(`/api/admin/waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      });
      if (res.ok) {
        const data = (await res.json()) as { adminNotes?: string };
        const saved = data.adminNotes ?? adminNotes;
        setRows((prev) =>
          prev.map((r) => (r._id === id ? { ...r, adminNotes: saved } : r))
        );
        setNotesDraft((prev) => ({ ...prev, [id]: saved }));
      }
    } finally {
      setSavingNotesId(null);
    }
  }

  async function handleAction(id: string, action: "accept" | "reject", e: React.MouseEvent) {
    e.stopPropagation();
    const label = action === "accept" ? "accept" : "reject";
    if (!window.confirm(`Are you sure you want to ${label} this registration?`)) return;

    setActionId(id);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/waitlist/${id}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || `Unable to ${label} registration`);
        return;
      }
      setMessage(
        action === "accept"
          ? "Accepted. Confirmation email with event pass has been sent."
          : "Rejected. Rejection email has been sent."
      );
      setRows((prev) => prev.filter((row) => row._id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch {
      setMessage(`Unable to ${label} registration`);
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700">
          Select event
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full max-w-md rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">Choose an event</option>
          {events.map((ev) => (
            <option key={ev.eventId} value={ev.eventId}>
              {ev.eventName}
            </option>
          ))}
        </select>
      </div>

      {message ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
          {message}
        </p>
      ) : null}

      {selectedEventId && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-900">
              Waitlisted ({rows.length})
              {searchQuery.trim() ? (
                <span className="ml-2 text-sm font-normal text-zinc-500">
                  · {filteredRows.length} shown
                </span>
              ) : null}
            </h2>
            {rows.length > 0 ? (
              <div className="w-full max-w-sm">
                <label className="sr-only" htmlFor="waitlist-search">
                  Search waitlist
                </label>
                <input
                  id="waitlist-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, email, code, mobile, notes…"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            ) : null}
          </div>
          {loading ? (
            <p className="mt-2 text-sm text-zinc-500">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No waitlisted registrations for this event.</p>
          ) : filteredRows.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No waitlisted registrations match your search.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 -mx-2 sm:mx-0">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="w-8 px-2 py-3" aria-label="Expand" />
                    <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Name</th>
                    <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Email</th>
                    <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Priority</th>
                    <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Registered</th>
                    <th className="min-w-[180px] px-3 py-3 font-medium text-zinc-700 sm:px-4">Notes</th>
                    <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => (
                    <React.Fragment key={r._id}>
                      <tr
                        onClick={() => setExpandedId((prev) => (prev === r._id ? null : r._id))}
                        className="cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50"
                      >
                        <td className="px-2 py-3">
                          <ChevronDown className="h-5 w-5 text-zinc-500" open={expandedId === r._id} />
                        </td>
                        <td className="px-3 py-3 font-medium text-zinc-900 sm:px-4">
                          {r.firstName} {r.surname}
                        </td>
                        <td className="px-3 py-3 text-zinc-700 sm:px-4">{r.email}</td>
                        <td className="px-3 py-3 text-zinc-700 sm:px-4">
                          {r.workedWithVineet ? (
                            <span className="inline-flex rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white">
                              Priority
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-3 text-zinc-600 sm:px-4">{formatDate(r.createdAt)}</td>
                        <td
                          className="px-3 py-3 sm:px-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={notesDraft[r._id] ?? ""}
                            onChange={(e) =>
                              setNotesDraft((prev) => ({ ...prev, [r._id]: e.target.value }))
                            }
                            onBlur={() => handleSaveNotes(r._id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            disabled={savingNotesId === r._id}
                            placeholder="Add notes…"
                            className="w-full min-w-[140px] rounded border border-zinc-300 bg-white px-2 py-1 text-zinc-900 placeholder:text-zinc-400 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-3 py-3 sm:px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={actionId === r._id}
                              onClick={(e) => handleAction(r._id, "accept", e)}
                              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              disabled={actionId === r._id}
                              onClick={(e) => handleAction(r._id, "reject", e)}
                              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === r._id && (
                        <tr className="bg-zinc-50">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="rounded-lg border border-zinc-200 bg-white p-4">
                              <h3 className="mb-3 text-sm font-semibold text-zinc-700">
                                Full details
                              </h3>
                              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                                <div>
                                  <dt className="text-zinc-500">Code</dt>
                                  <dd className="font-mono text-zinc-900">{r.uniqueCode}</dd>
                                </div>
                                <div>
                                  <dt className="text-zinc-500">Mobile</dt>
                                  <dd className="text-zinc-900">{r.mobileNumber || "—"}</dd>
                                </div>
                                <div>
                                  <dt className="text-zinc-500">WhatsApp</dt>
                                  <dd className="text-zinc-900">
                                    {r.addToWhatsapp ? (r.whatsappNumber || "—") : "—"}
                                  </dd>
                                </div>
                                {r.workedWithVineet != null ? (
                                  <div>
                                    <dt className="text-zinc-500">Priority Pass</dt>
                                    <dd className="text-zinc-900">{r.workedWithVineet ? "Yes" : "No"}</dd>
                                  </div>
                                ) : null}
                                {r.workedWithVineet && r.workedWithVineetDetails ? (
                                  <div className="sm:col-span-2">
                                    <dt className="text-zinc-500">Connection details</dt>
                                    <dd className="text-zinc-900">{r.workedWithVineetDetails}</dd>
                                  </div>
                                ) : null}
                                {r.organization ? (
                                  <div>
                                    <dt className="text-zinc-500">Organization</dt>
                                    <dd className="text-zinc-900">{r.organization}</dd>
                                  </div>
                                ) : null}
                                {r.designation ? (
                                  <div>
                                    <dt className="text-zinc-500">Designation</dt>
                                    <dd className="text-zinc-900">{r.designation}</dd>
                                  </div>
                                ) : null}
                                {r.identityCardOrPassport ? (
                                  <div>
                                    <dt className="text-zinc-500">Identity card / Passport</dt>
                                    <dd className="text-zinc-900">{r.identityCardOrPassport}</dd>
                                  </div>
                                ) : null}
                                {(r.apparelSize != null && r.apparelSize !== "") ? (
                                  <div>
                                    <dt className="text-zinc-500">Apparel size</dt>
                                    <dd className="text-zinc-900">{r.apparelSize}</dd>
                                  </div>
                                ) : null}
                                {r.overnightStay != null ? (
                                  <div>
                                    <dt className="text-zinc-500">Overnight stay</dt>
                                    <dd className="text-zinc-900">{r.overnightStay ? "Yes" : "No"}</dd>
                                  </div>
                                ) : null}
                                {(r.passportNic != null && r.passportNic !== "") ? (
                                  <div>
                                    <dt className="text-zinc-500">Passport/NIC</dt>
                                    <dd className="text-zinc-900">{r.passportNic}</dd>
                                  </div>
                                ) : null}
                                {r.transportNeeded != null ? (
                                  <div>
                                    <dt className="text-zinc-500">Transport needed</dt>
                                    <dd className="text-zinc-900">
                                      {r.transportNeeded
                                        ? r.transportLocation
                                          ? `Yes — ${r.transportLocation}`
                                          : "Yes"
                                        : "No"}
                                    </dd>
                                  </div>
                                ) : null}
                                <div>
                                  <dt className="text-zinc-500">Registered</dt>
                                  <dd className="text-zinc-900">{formatDate(r.createdAt)}</dd>
                                </div>
                                {r.specialComment ? (
                                  <div className="sm:col-span-2">
                                    <dt className="text-zinc-500">Special comment</dt>
                                    <dd className="text-zinc-900">{r.specialComment}</dd>
                                  </div>
                                ) : null}
                                {r.questionForVineet ? (
                                  <div className="sm:col-span-2">
                                    <dt className="text-zinc-500">Question for Vineet Nayar</dt>
                                    <dd className="text-zinc-900">{r.questionForVineet}</dd>
                                  </div>
                                ) : null}
                                {(notesDraft[r._id] ?? r.adminNotes) ? (
                                  <div className="sm:col-span-2">
                                    <dt className="text-zinc-500">Admin notes</dt>
                                    <dd className="text-zinc-900">{notesDraft[r._id] ?? r.adminNotes}</dd>
                                  </div>
                                ) : null}
                              </dl>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
