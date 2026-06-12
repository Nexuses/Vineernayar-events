"use client";

import React, { useState, useEffect } from "react";

type EventItem = { eventId: string; eventName: string };

type ParticipationStatus = "registered" | "attended";

type RegistrationItem = {
  _id: string;
  uniqueCode: string;
  eventId: string;
  eventName: string;
  firstName: string;
  surname: string;
  email: string;
  organization: string;
  designation: string;
  mobileNumber: string;
  addToWhatsapp: boolean;
  whatsappNumber?: string;
  identityCardOrPassport?: string;
  specialComment?: string;
  apparelSize?: string;
  overnightStay?: boolean;
  passportNic?: string;
  transportNeeded?: boolean;
  transportLocation?: string;
  participationStatus: ParticipationStatus;
  createdAt: string;
  participationTimestamp?: string;
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

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
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

function escapeCsvCell(value: string): string {
  const s = String(value ?? "").trim();
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildRegistrationsCsv(rows: RegistrationItem[]): string {
  const headers = [
    "First Name",
    "Surname",
    "Email",
    "Organization",
    "Designation",
    "Mobile Number",
    "WhatsApp Number",
    "Identity / Passport",
    "Apparel Size",
    "Overnight Stay",
    "Passport/NIC",
    "Transport Needed",
    "Transport Location",
    "Participation Status",
    "Registered",
    "Participation Time",
    "Code",
    "Special Comment",
  ];
  const headerLine = headers.map(escapeCsvCell).join(",");
  const dataLines = rows.map((r) =>
    [
      r.firstName,
      r.surname,
      r.email,
      r.organization || "",
      r.designation || "",
      r.mobileNumber || "",
      r.whatsappNumber || "",
      r.identityCardOrPassport || "",
      r.apparelSize || "",
      r.overnightStay ? "Yes" : "",
      r.passportNic || r.identityCardOrPassport || "",
      r.transportNeeded == null ? "" : r.transportNeeded ? "Yes" : "No",
      r.transportLocation || "",
      r.participationStatus || "registered",
      formatDate(r.createdAt),
      r.participationTimestamp ? formatDate(r.participationTimestamp) : "",
      r.uniqueCode,
      r.specialComment || "",
    ].map(escapeCsvCell).join(",")
  );
  return [headerLine, ...dataLines].join("\r\n");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function RegisteredClientSection({ events }: { events: EventItem[] }) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function fetchRegistrations() {
    if (!selectedEventId) return;
    setLoading(true);
    fetch(`/api/admin/registrations?eventId=${encodeURIComponent(selectedEventId)}`)
      .then((r) => r.json())
      .then((data) => setRegistrations(Array.isArray(data) ? data : []))
      .catch(() => setRegistrations([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!selectedEventId) {
      setRegistrations([]);
      setExpandedId(null);
      return;
    }
    fetchRegistrations();
  }, [selectedEventId]);

  async function handleStatusChange(id: string, participationStatus: ParticipationStatus) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/registrations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participationStatus }),
      });
      if (res.ok) {
        const data = (await res.json()) as { participationStatus?: ParticipationStatus; participationTimestamp?: string };
        setRegistrations((prev) =>
          prev.map((r) =>
            r._id === id
              ? {
                  ...r,
                  participationStatus: data.participationStatus || participationStatus,
                  participationTimestamp: data.participationTimestamp ?? r.participationTimestamp,
                }
              : r
          )
        );
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this registration? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/registrations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRegistrations((prev) => prev.filter((r) => r._id !== id));
        if (expandedId === id) setExpandedId(null);
      }
    } finally {
      setDeletingId(null);
    }
  }

  function handleExportCsv() {
    const eventName = events.find((e) => e.eventId === selectedEventId)?.eventName || selectedEventId;
    const safeName = eventName.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 50);
    const csv = buildRegistrationsCsv(registrations);
    downloadCsv(csv, `registered-clients-${safeName}.csv`);
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

      {selectedEventId && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-zinc-900">
              Registered clients ({registrations.length})
            </h2>
            {registrations.length > 0 && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            )}
          </div>
          {loading ? (
            <p className="mt-2 text-sm text-zinc-500">Loading…</p>
          ) : registrations.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No registrations for this event yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 -mx-2 sm:mx-0">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="w-8 px-2 py-3" aria-label="Expand" />
                    <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Name</th>
                    <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Email</th>
                    <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Status</th>
                    <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Code</th>
                    <th className="w-10 px-2 py-3" aria-label="Delete" />
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r) => (
                    <React.Fragment key={r._id || r.uniqueCode}>
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
                        <td className="px-3 py-3 sm:px-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={r.participationStatus || "registered"}
                            onChange={(e) => handleStatusChange(r._id, e.target.value as ParticipationStatus)}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            disabled={updatingId === r._id}
                            className="rounded border border-zinc-300 bg-white px-2 py-1 text-zinc-900 disabled:opacity-50"
                          >
                            <option value="registered">Registered</option>
                            <option value="attended">Attended</option>
                          </select>
                        </td>
                        <td className="px-3 py-3 font-mono text-zinc-700 sm:px-4">{r.uniqueCode}</td>
                        <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(r._id, e)}
                            disabled={deletingId === r._id}
                            className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                            title="Delete registration"
                            aria-label="Delete registration"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                      {expandedId === r._id && (
                        <tr key={`${r._id}-details`} className="bg-zinc-50">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="rounded-lg border border-zinc-200 bg-white p-4">
                              <h3 className="mb-3 text-sm font-semibold text-zinc-700">
                                Full details
                              </h3>
                              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                                <div>
                                  <dt className="text-zinc-500">Organization</dt>
                                  <dd className="text-zinc-900">{r.organization || "—"}</dd>
                                </div>
                                <div>
                                  <dt className="text-zinc-500">Designation</dt>
                                  <dd className="text-zinc-900">{r.designation || "—"}</dd>
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
                                <div>
                                  <dt className="text-zinc-500">Identity / Passport</dt>
                                  <dd className="text-zinc-900">{r.identityCardOrPassport || "—"}</dd>
                                </div>
                                {(r.apparelSize != null && r.apparelSize !== "") ? (
                                  <div>
                                    <dt className="text-zinc-500">Apparel size</dt>
                                    <dd className="text-zinc-900">{r.apparelSize}</dd>
                                  </div>
                                ) : null}
                                {r.overnightStay != null ? (
                                  <div>
                                    <dt className="text-zinc-500">Overnight Stay</dt>
                                    <dd className="text-zinc-900">{r.overnightStay ? "Yes" : "No"}</dd>
                                  </div>
                                ) : null}
                                {(r.passportNic != null && r.passportNic !== "") ? (
                                  <div>
                                    <dt className="text-zinc-500">Passport/NIC</dt>
                                    <dd className="text-zinc-900">{r.passportNic}</dd>
                                  </div>
                                ) : null}
                                <div>
                                  <dt className="text-zinc-500">Registered</dt>
                                  <dd className="text-zinc-900">{formatDate(r.createdAt)}</dd>
                                </div>
                                <div>
                                  <dt className="text-zinc-500">Participation time</dt>
                                  <dd className="text-zinc-900">
                                    {r.participationTimestamp
                                      ? formatDate(r.participationTimestamp)
                                      : "—"}
                                  </dd>
                                </div>
                                {r.specialComment ? (
                                  <div className="sm:col-span-2">
                                    <dt className="text-zinc-500">Special comment</dt>
                                    <dd className="text-zinc-900">{r.specialComment}</dd>
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
