"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  EMAIL_SEQUENCE_LABELS,
  EMAIL_SEQUENCE_ORDER,
  EMAIL_SEQUENCE_SCHEDULE,
  type EmailSequenceKey,
} from "@/lib/email-sequence";
import {
  WHATSAPP_SEQUENCE_LABELS,
  WHATSAPP_SEQUENCE_ORDER,
  WHATSAPP_SEQUENCE_SCHEDULE,
  type WhatsAppSequenceKey,
} from "@/lib/whatsapp-sequence";
import {
  attendanceRsvpBadgeClass,
  attendanceRsvpLabel,
  type AttendanceRsvpStatus,
} from "@/lib/attendance-rsvp";
import {
  getEffectiveDesignation,
  REGISTRATION_DESIGNATION_OTHER,
} from "@/lib/registration-field-limits";

type EventItem = {
  eventId: string;
  eventName: string;
  dropdownLabel: string;
};

type ParticipationStatus = "registered" | "attended";

type StatusFilter = "all" | "registered" | "attended";
type RsvpFilter = "all" | "pending" | "reconfirmed" | "declined";

const PAGE_SIZE = 25;

const selectClassName =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 flex-1 sm:min-w-[160px]">
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClassName}
      >
        {children}
      </select>
    </div>
  );
}

function matchesSearch(row: RegistrationItem, query: string): boolean {
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
    row.currentDesignation,
    row.specialComment,
    row.questionForVineet,
    row.workedWithVineetDetails,
    row.whyAttend,
    row.participationStatus,
    row.attendanceRsvpStatus,
    row.attendanceRsvpStatus === "reconfirmed" ? "reconfirm" : "",
    row.attendanceRsvpStatus === "declined" ? "not able to attend" : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function matchesStatusFilter(row: RegistrationItem, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  return (row.participationStatus || "registered") === filter;
}

function getAttendanceRsvpStatus(row: RegistrationItem): AttendanceRsvpStatus {
  return row.attendanceRsvpStatus ?? "pending";
}

function isRegisteredClient(row: RegistrationItem): boolean {
  return getAttendanceRsvpStatus(row) !== "declined";
}

function matchesRsvpFilter(row: RegistrationItem, filter: RsvpFilter): boolean {
  const status = getAttendanceRsvpStatus(row);
  if (filter === "declined") return status === "declined";
  if (filter === "reconfirmed") return status === "reconfirmed";
  if (filter === "pending") return status === "pending";
  return status !== "declined";
}

type EmailSequenceEntryView = {
  status: string;
  sentAt: string | null;
  error: string | null;
};

type RegistrationItem = {
  _id: string;
  uniqueCode: string;
  eventId: string;
  eventName: string;
  firstName: string;
  surname: string;
  email: string;
  organization?: string;
  currentDesignation?: string;
  designation?: string;
  whyAttend?: string;
  signedCopyInterested?: boolean;
  mobileNumber?: string;
  workedWithVineet?: boolean;
  workedWithVineetDetails?: string;
  questionForVineet?: string;
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
  attendanceRsvpStatus?: AttendanceRsvpStatus;
  attendanceRsvpAt?: string | null;
  createdAt: string;
  participationTimestamp?: string;
  emailSequence?: Record<EmailSequenceKey, EmailSequenceEntryView>;
  whatsappSequence?: Record<WhatsAppSequenceKey, EmailSequenceEntryView>;
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

function sequenceStatusClass(status: string): string {
  if (status === "sent") return "bg-green-100 text-green-800";
  if (status === "failed") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

type DetailField = {
  label: string;
  value: string;
  mono?: boolean;
};

function buildRegistrationDetailFields(row: RegistrationItem): DetailField[] {
  const fields: DetailField[] = [];
  const push = (label: string, value?: string | null, mono?: boolean) => {
    const text = value?.trim();
    if (text) fields.push({ label, value: text, mono });
  };
  const pushYesNo = (label: string, value?: boolean) => {
    if (value == null) return;
    fields.push({ label, value: value ? "Yes" : "No" });
  };

  push("First Name", row.firstName);
  push("Surname", row.surname);
  push("Email", row.email);
  push("Mobile Number", row.mobileNumber);
  push(
    "WhatsApp Number",
    row.addToWhatsapp ? row.whatsappNumber?.trim() || row.mobileNumber : undefined
  );
  push("Your Current Organisation", row.organization);
  const profile = row.currentDesignation?.trim();
  if (profile) {
    push("Your Current Designation", profile);
    if (profile === REGISTRATION_DESIGNATION_OTHER) {
      push("Please specify your designation", row.designation);
    }
  } else {
    push("Your Current Designation", row.designation);
  }
  pushYesNo("Have you worked, studied, or partnered with Vineet Nayar?", row.workedWithVineet);
  push("Tell us more about where or how you connected?", row.workedWithVineetDetails);
  push("Why would you like to attend this event?", row.whyAttend);
  pushYesNo(
    "Would you like to have your copy of Humans First, Machines Second signed by Vineet Nayar?",
    row.signedCopyInterested
  );
  push("Apparel - sizes", row.apparelSize);
  pushYesNo("Overnight Stay", row.overnightStay);
  push("Passport/NIC", row.passportNic);
  if (row.transportNeeded != null) {
    push("Transport", row.transportNeeded ? "Yes" : "No");
  }
  push("Location", row.transportNeeded ? row.transportLocation : undefined);
  push("Registration code", row.uniqueCode, true);
  fields.push({
    label: "Status",
    value: (row.participationStatus || "registered") === "attended" ? "Attended" : "Registered",
  });
  fields.push({ label: "Registered on", value: formatDate(row.createdAt) });
  fields.push({
    label: "RSVP status",
    value: `${attendanceRsvpLabel(getAttendanceRsvpStatus(row))}${
      row.attendanceRsvpAt ? ` · ${formatDate(row.attendanceRsvpAt)}` : ""
    }`,
  });

  return fields;
}

function RegistrationDetailGrid({ row }: { row: RegistrationItem }) {
  const fields = buildRegistrationDetailFields(row);
  const splitAt = Math.ceil(fields.length / 2);
  const leftFields = fields.slice(0, splitAt);
  const rightFields = fields.slice(splitAt);

  function renderColumn(items: DetailField[]) {
    return (
      <dl className="space-y-2 text-sm">
        {items.map((field, index) => (
          <div key={`${field.label}-${index}`}>
            <dt className="text-zinc-500 leading-snug">{field.label}</dt>
            <dd className={`text-zinc-900 ${field.mono ? "font-mono" : ""}`}>{field.value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
      {renderColumn(leftFields)}
      {renderColumn(rightFields)}
    </div>
  );
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
  const optionalColumns: {
    header: string;
    value: (r: RegistrationItem) => string;
    hasData: (r: RegistrationItem) => boolean;
  }[] = [
    {
      header: "Tell us more about where or how you connected?",
      value: (r) => r.workedWithVineetDetails || "",
      hasData: (r) => Boolean(r.workedWithVineetDetails?.trim()),
    },
    {
      header: "Your Current Organisation",
      value: (r) => r.organization || "",
      hasData: (r) => Boolean(r.organization?.trim()),
    },
    {
      header: "Your Current Designation",
      value: (r) => getEffectiveDesignation(r),
      hasData: (r) => Boolean(getEffectiveDesignation(r).trim()),
    },
    {
      header: "Why would you like to attend this event?",
      value: (r) => r.whyAttend || "",
      hasData: (r) => Boolean(r.whyAttend?.trim()),
    },
    {
      header: "Would you like to have your copy of Humans First, Machines Second signed by Vineet Nayar?",
      value: (r) =>
        r.signedCopyInterested == null ? "" : r.signedCopyInterested ? "Yes" : "No",
      hasData: (r) => r.signedCopyInterested != null,
    },
  ];

  const activeOptional = optionalColumns.filter((col) =>
    rows.some((r) => col.hasData(r))
  );

  const headers = [
    "First Name",
    "Surname",
    "Email",
    "Mobile Number",
    ...activeOptional.map((col) => col.header),
    "Status",
    "RSVP Status",
  ];

  const headerLine = headers.map(escapeCsvCell).join(",");
  const dataLines = rows.map((r) =>
    [
      r.firstName,
      r.surname,
      r.email,
      r.mobileNumber || "",
      ...activeOptional.map((col) => col.value(r)),
      (r.participationStatus || "registered") === "attended" ? "Attended" : "Registered",
      attendanceRsvpLabel(getAttendanceRsvpStatus(r)),
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

export function RegisteredClientSection({
  events,
  readOnly = false,
}: {
  events: EventItem[];
  readOnly?: boolean;
}) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [rsvpFilter, setRsvpFilter] = useState<RsvpFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

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
      setSearchQuery("");
      setStatusFilter("all");
      setRsvpFilter("all");
      setCurrentPage(1);
      return;
    }
    setSearchQuery("");
    setStatusFilter("all");
    setRsvpFilter("all");
    setCurrentPage(1);
    fetchRegistrations();
  }, [selectedEventId]);

  const registeredClients = useMemo(
    () => registrations.filter(isRegisteredClient),
    [registrations]
  );

  const filteredRegistrations = useMemo(
    () =>
      registrations.filter(
        (row) =>
          matchesSearch(row, searchQuery) &&
          matchesStatusFilter(row, statusFilter) &&
          matchesRsvpFilter(row, rsvpFilter)
      ),
    [registrations, searchQuery, statusFilter, rsvpFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRegistrations.length / PAGE_SIZE));

  const paginatedRegistrations = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRegistrations.slice(start, start + PAGE_SIZE);
  }, [filteredRegistrations, currentPage]);

  const statusCounts = useMemo(
    () => ({
      all: registeredClients.length,
      registered: registeredClients.filter((r) => (r.participationStatus || "registered") === "registered").length,
      attended: registeredClients.filter((r) => r.participationStatus === "attended").length,
      rsvpPending: registeredClients.filter((r) => getAttendanceRsvpStatus(r) === "pending").length,
      rsvpReconfirmed: registeredClients.filter((r) => getAttendanceRsvpStatus(r) === "reconfirmed").length,
      rsvpDeclined: registrations.filter((r) => getAttendanceRsvpStatus(r) === "declined").length,
    }),
    [registrations, registeredClients]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, rsvpFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pageStart =
    filteredRegistrations.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, filteredRegistrations.length);

  async function handleStatusChange(id: string, participationStatus: ParticipationStatus) {
    if (readOnly) return;
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
    if (readOnly) return;
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
    const csv = buildRegistrationsCsv(filteredRegistrations);
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
              {ev.dropdownLabel}
            </option>
          ))}
        </select>
      </div>

      {selectedEventId && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-900">
              Registered clients ({registeredClients.length})
              {searchQuery.trim() || statusFilter !== "all" || rsvpFilter !== "all" ? (
                <span className="ml-2 text-sm font-normal text-zinc-500">
                  · {filteredRegistrations.length} shown
                </span>
              ) : null}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              {registrations.length > 0 ? (
                <div className="w-full max-w-sm sm:w-auto sm:min-w-[280px]">
                  <label className="sr-only" htmlFor="registrations-search">
                    Search registrations
                  </label>
                  <input
                    id="registrations-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, email, code, mobile…"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              ) : null}
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
          </div>

          {registrations.length > 0 ? (
            <div className="mt-4 rounded-xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <FilterSelect
                  id="registrations-status-filter"
                  label="Status"
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value as StatusFilter)}
                >
                  <option value="all">All ({statusCounts.all})</option>
                  <option value="registered">Registered ({statusCounts.registered})</option>
                  <option value="attended">Attended ({statusCounts.attended})</option>
                </FilterSelect>

                <FilterSelect
                  id="registrations-rsvp-filter"
                  label="RSVP"
                  value={rsvpFilter}
                  onChange={(value) => setRsvpFilter(value as RsvpFilter)}
                >
                  <option value="all">All ({statusCounts.all})</option>
                  <option value="pending">Pending ({statusCounts.rsvpPending})</option>
                  <option value="reconfirmed">Reconfirmed ({statusCounts.rsvpReconfirmed})</option>
                  <option value="declined">Not Able to Attend ({statusCounts.rsvpDeclined})</option>
                </FilterSelect>
              </div>
            </div>
          ) : null}

          {loading ? (
            <p className="mt-2 text-sm text-zinc-500">Loading…</p>
          ) : registrations.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No registrations for this event yet.</p>
          ) : registeredClients.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">
              No active registered clients. Use the RSVP filter to view Not Able to Attend.
            </p>
          ) : filteredRegistrations.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No registrations match your search or filters.</p>
          ) : (
            <>
            <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 -mx-2 sm:mx-0">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="w-8 px-2 py-3" aria-label="Expand" />
                    <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Name</th>
                    <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Email</th>
                    <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Status</th>
                    <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Code</th>
                    {!readOnly ? <th className="w-10 px-2 py-3" aria-label="Delete" /> : null}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRegistrations.map((r) => (
                    <React.Fragment key={r._id || r.uniqueCode}>
                      <tr
                        onClick={() => setExpandedId((prev) => (prev === r._id ? null : r._id))}
                        className="cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50"
                      >
                        <td className="px-2 py-3">
                          <ChevronDown className="h-5 w-5 text-zinc-500" open={expandedId === r._id} />
                        </td>
                        <td className="px-3 py-3 font-medium text-zinc-900 sm:px-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>
                              {r.firstName} {r.surname}
                            </span>
                            {getAttendanceRsvpStatus(r) !== "pending" ? (
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${attendanceRsvpBadgeClass(
                                  getAttendanceRsvpStatus(r)
                                )}`}
                              >
                                {attendanceRsvpLabel(getAttendanceRsvpStatus(r))}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-zinc-700 sm:px-4">{r.email}</td>
                        <td className="px-3 py-3 sm:px-4" onClick={(e) => e.stopPropagation()}>
                          {readOnly ? (
                            <span className="text-zinc-700">{r.participationStatus || "registered"}</span>
                          ) : (
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
                          )}
                        </td>
                        <td className="px-3 py-3 font-mono text-zinc-700 sm:px-4">{r.uniqueCode}</td>
                        {!readOnly ? (
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
                        ) : null}
                      </tr>
                      {expandedId === r._id && (
                        <tr key={`${r._id}-details`} className="bg-zinc-50">
                          <td colSpan={readOnly ? 5 : 6} className="px-4 py-4">
                            <div className="rounded-lg border border-zinc-200 bg-white p-4">
                              <h3 className="mb-3 text-sm font-semibold text-zinc-700">
                                Full details
                              </h3>
                              <RegistrationDetailGrid row={r} />

                              <div className="mt-6 border-t border-zinc-200 pt-4">
                                <h4 className="mb-1 text-sm font-semibold text-zinc-700">
                                  Email communications
                                </h4>
                                <p className="mb-3 text-xs text-zinc-500">
                                  Sent automatically on schedule. Registration confirmation goes out immediately when someone registers.
                                </p>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-zinc-200 text-left text-zinc-500">
                                        <th className="pb-2 pr-4 font-medium">Email</th>
                                        <th className="pb-2 pr-4 font-medium">Schedule</th>
                                        <th className="pb-2 pr-4 font-medium">Status</th>
                                        <th className="pb-2 font-medium">Sent at</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {EMAIL_SEQUENCE_ORDER.map((key) => {
                                        const entry = r.emailSequence?.[key];
                                        const status = entry?.status ?? "pending";
                                        return (
                                          <tr key={key} className="border-b border-zinc-100">
                                            <td className="py-2 pr-4 font-medium text-zinc-800">
                                              {EMAIL_SEQUENCE_LABELS[key]}
                                            </td>
                                            <td className="py-2 pr-4 text-zinc-600">
                                              {EMAIL_SEQUENCE_SCHEDULE[key]}
                                            </td>
                                            <td className="py-2 pr-4">
                                              <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${sequenceStatusClass(status)}`}
                                              >
                                                {status}
                                              </span>
                                              {entry?.error ? (
                                                <p className="mt-1 text-xs text-red-600">{entry.error}</p>
                                              ) : null}
                                            </td>
                                            <td className="py-2 text-zinc-600">
                                              {entry?.sentAt ? formatDate(entry.sentAt) : "—"}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              <div className="mt-6 border-t border-zinc-200 pt-4">
                                <h4 className="mb-1 text-sm font-semibold text-zinc-700">
                                  WhatsApp communications
                                </h4>
                                <p className="mb-3 text-xs text-zinc-500">
                                  Sent automatically on the same sequence schedule as emails.
                                </p>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-zinc-200 text-left text-zinc-500">
                                        <th className="pb-2 pr-4 font-medium">WhatsApp</th>
                                        <th className="pb-2 pr-4 font-medium">Schedule</th>
                                        <th className="pb-2 pr-4 font-medium">Status</th>
                                        <th className="pb-2 font-medium">Sent at</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {WHATSAPP_SEQUENCE_ORDER.map((key) => {
                                        const entry = r.whatsappSequence?.[key];
                                        const status = entry?.status ?? "pending";
                                        return (
                                          <tr key={key} className="border-b border-zinc-100">
                                            <td className="py-2 pr-4 font-medium text-zinc-800">
                                              {WHATSAPP_SEQUENCE_LABELS[key]}
                                            </td>
                                            <td className="py-2 pr-4 text-zinc-600">
                                              {WHATSAPP_SEQUENCE_SCHEDULE[key]}
                                            </td>
                                            <td className="py-2 pr-4">
                                              <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${sequenceStatusClass(status)}`}
                                              >
                                                {status}
                                              </span>
                                              {entry?.error ? (
                                                <p className="mt-1 text-xs text-red-600">{entry.error}</p>
                                              ) : null}
                                            </td>
                                            <td className="py-2 text-zinc-600">
                                              {entry?.sentAt ? formatDate(entry.sentAt) : "—"}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRegistrations.length > PAGE_SIZE ? (
              <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-zinc-200 pt-6 sm:flex-row">
                <p className="text-sm text-zinc-600">
                  Showing {pageStart}–{pageEnd} of {filteredRegistrations.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage <= 1}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-2 text-sm text-zinc-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage >= totalPages}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : filteredRegistrations.length > 0 ? (
              <p className="mt-4 text-sm text-zinc-500">
                Showing {filteredRegistrations.length} registration{filteredRegistrations.length === 1 ? "" : "s"}
              </p>
            ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
}
