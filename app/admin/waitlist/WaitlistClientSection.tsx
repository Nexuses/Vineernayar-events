"use client";

import React, { useEffect, useMemo, useState } from "react";

type EventItem = {
  eventId: string;
  eventName: string;
  dropdownLabel: string;
};

type AdmissionStatus = "waitlisted" | "confirmed" | "rejected";

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
  admissionStatus?: AdmissionStatus;
  createdAt: string;
};

type StatusFilter = "all" | "pending" | "accepted" | "rejected";
type PriorityFilter = "all" | "priority" | "non-priority";

function statusLabel(status?: AdmissionStatus): string {
  if (status === "confirmed") return "Accepted";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function statusBadgeClass(status?: AdmissionStatus): string {
  if (status === "confirmed") return "bg-emerald-100 text-emerald-800";
  if (status === "rejected") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

function matchesStatusFilter(row: WaitlistItem, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "accepted") return row.admissionStatus === "confirmed";
  if (filter === "rejected") return row.admissionStatus === "rejected";
  return row.admissionStatus === "waitlisted" || !row.admissionStatus;
}

function matchesPriorityFilter(row: WaitlistItem, filter: PriorityFilter): boolean {
  if (filter === "all") return true;
  if (filter === "priority") return row.workedWithVineet === true;
  return row.workedWithVineet !== true;
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all sm:px-3 sm:text-sm ${
        active
          ? "bg-zinc-900 text-white shadow-sm"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      {children}
    </button>
  );
}

function FilterGroup({
  label,
  align = "start",
  children,
}: {
  label: string;
  align?: "start" | "end";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex min-w-0 flex-wrap items-center gap-2 sm:gap-3 ${
        align === "end" ? "lg:justify-end" : ""
      }`}
    >
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <div className="inline-flex max-w-full flex-wrap gap-0.5 rounded-lg border border-zinc-200 bg-white p-1 shadow-sm">
        {children}
      </div>
    </div>
  );
}

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");

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
      setStatusFilter("all");
      setPriorityFilter("all");
      return;
    }
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
    fetchWaitlist();
  }, [selectedEventId]);

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          matchesSearch(row, searchQuery, notesDraft) &&
          matchesStatusFilter(row, statusFilter) &&
          matchesPriorityFilter(row, priorityFilter)
      ),
    [rows, searchQuery, notesDraft, statusFilter, priorityFilter]
  );

  const statusCounts = useMemo(
    () => ({
      all: rows.length,
      pending: rows.filter((r) => r.admissionStatus === "waitlisted" || !r.admissionStatus).length,
      accepted: rows.filter((r) => r.admissionStatus === "confirmed").length,
      rejected: rows.filter((r) => r.admissionStatus === "rejected").length,
      priority: rows.filter((r) => r.workedWithVineet === true).length,
      nonPriority: rows.filter((r) => r.workedWithVineet !== true).length,
    }),
    [rows]
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
      setRows((prev) =>
        prev.map((row) =>
          row._id === id
            ? {
                ...row,
                admissionStatus: action === "accept" ? "confirmed" : "rejected",
              }
            : row
        )
      );
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
              {ev.dropdownLabel}
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
              Waitlist ({rows.length})
              {searchQuery.trim() || statusFilter !== "all" || priorityFilter !== "all" ? (
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

          {rows.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white p-4 sm:p-5">
              <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-6">
                <FilterGroup label="Status">
                  <FilterPill active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
                    All <span className={statusFilter === "all" ? "opacity-80" : "text-zinc-400"}>({statusCounts.all})</span>
                  </FilterPill>
                  <FilterPill
                    active={statusFilter === "pending"}
                    onClick={() => setStatusFilter("pending")}
                  >
                    Pending <span className={statusFilter === "pending" ? "opacity-80" : "text-zinc-400"}>({statusCounts.pending})</span>
                  </FilterPill>
                  <FilterPill
                    active={statusFilter === "accepted"}
                    onClick={() => setStatusFilter("accepted")}
                  >
                    Accepted <span className={statusFilter === "accepted" ? "opacity-80" : "text-zinc-400"}>({statusCounts.accepted})</span>
                  </FilterPill>
                  <FilterPill
                    active={statusFilter === "rejected"}
                    onClick={() => setStatusFilter("rejected")}
                  >
                    Rejected <span className={statusFilter === "rejected" ? "opacity-80" : "text-zinc-400"}>({statusCounts.rejected})</span>
                  </FilterPill>
                </FilterGroup>

                <div
                  className="mx-auto hidden h-8 w-px shrink-0 self-center bg-zinc-200 lg:block"
                  aria-hidden
                />
                <div className="h-px w-full bg-zinc-200 lg:hidden" aria-hidden />

                <FilterGroup label="Priority" align="end">
                  <FilterPill
                    active={priorityFilter === "all"}
                    onClick={() => setPriorityFilter("all")}
                  >
                    All <span className={priorityFilter === "all" ? "opacity-80" : "text-zinc-400"}>({statusCounts.all})</span>
                  </FilterPill>
                  <FilterPill
                    active={priorityFilter === "priority"}
                    onClick={() => setPriorityFilter("priority")}
                  >
                    Priority <span className={priorityFilter === "priority" ? "opacity-80" : "text-zinc-400"}>({statusCounts.priority})</span>
                  </FilterPill>
                  <FilterPill
                    active={priorityFilter === "non-priority"}
                    onClick={() => setPriorityFilter("non-priority")}
                  >
                    Non-priority <span className={priorityFilter === "non-priority" ? "opacity-80" : "text-zinc-400"}>({statusCounts.nonPriority})</span>
                  </FilterPill>
                </FilterGroup>
              </div>
            </div>
          ) : null}

          {loading ? (
            <p className="mt-2 text-sm text-zinc-500">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No waitlist registrations for this event.</p>
          ) : filteredRows.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No registrations match your filters.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 -mx-2 sm:mx-0">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="w-8 px-2 py-3" aria-label="Expand" />
                    <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Name</th>
                    <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Email</th>
                    <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Status</th>
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
                        <td className="px-3 py-3 sm:px-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(r.admissionStatus)}`}
                          >
                            {statusLabel(r.admissionStatus)}
                          </span>
                        </td>
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
                          {r.admissionStatus === "waitlisted" || !r.admissionStatus ? (
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
                          ) : (
                            <span className="text-xs text-zinc-500">—</span>
                          )}
                        </td>
                      </tr>
                      {expandedId === r._id && (
                        <tr className="bg-zinc-50">
                          <td colSpan={8} className="px-4 py-4">
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
                                    <dt className="text-zinc-500">Profile</dt>
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
