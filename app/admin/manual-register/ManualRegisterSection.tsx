"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  buildE164Phone,
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
} from "@/lib/phone-countries";
import {
  REGISTRATION_FIELD_LIMITS,
  trimToFieldLimit,
} from "@/lib/registration-field-limits";
import { ATTENDEE_CATEGORY_OPTIONS } from "@/lib/attendee-category";

type EventItem = {
  eventId: string;
  eventName: string;
  dropdownLabel: string;
};

const inputClassName =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

const labelClassName = "mb-1.5 block text-sm font-medium text-zinc-700";

const BULK_CSV_HEADERS = [
  "First Name",
  "Last Name",
  "Email",
  "Mobile Number",
  "City",
  "Attendee Category",
  "Coming with how many persons?",
];

const BULK_CSV_SAMPLE_ROWS = [
  ["Asha", "Menon", "asha.menon@example.com", "+919876543210", "Mumbai", "VIP", "1"],
  ["Rahul", "", "rahul@example.com", "+919812345678", "Bengaluru", "HCL / Other", "0"],
  ["Priya", "Nair", "", "+919900112233", "Chennai", "", "2"],
];

function escapeCsvCell(value: string): string {
  const s = String(value ?? "").trim();
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadSampleCsv() {
  const lines = [BULK_CSV_HEADERS, ...BULK_CSV_SAMPLE_ROWS].map((row) =>
    row.map(escapeCsvCell).join(",")
  );
  const csv = lines.join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "manual-registrations-sample.csv";
  a.click();
  URL.revokeObjectURL(url);
}

type BulkRowError = { row: number; name: string; error: string };

type BulkResult = {
  created: number;
  failed: number;
  total: number;
  errors: BulkRowError[];
  truncatedErrors: number;
  warning?: string;
};

export function ManualRegisterSection({
  events,
  readOnly,
}: {
  events: EventItem[];
  readOnly: boolean;
}) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [countryDial, setCountryDial] = useState(DEFAULT_PHONE_COUNTRY.dial);
  const [mobileLocal, setMobileLocal] = useState("");
  const [accompanyingPersons, setAccompanyingPersons] = useState("0");
  const [attendeeCategory, setAttendeeCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ uniqueCode: string } | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function resetClientFields() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setCity("");
    setMobileLocal("");
    setAccompanyingPersons("0");
    setAttendeeCategory("");
    setError("");
  }

  function resetBulkState() {
    setCsvFile(null);
    setBulkError("");
    setBulkResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleBulkUpload(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly || !selectedEventId || !csvFile) return;

    setBulkError("");
    setBulkResult(null);
    setBulkLoading(true);

    try {
      const csv = await csvFile.text();
      const res = await fetch("/api/admin/manual-register/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEventId, csv }),
      });
      const data = await res.json();

      if (!res.ok) {
        setBulkError(data.error || "Unable to import CSV");
        return;
      }

      setBulkResult({
        created: data.created ?? 0,
        failed: data.failed ?? 0,
        total: data.total ?? 0,
        errors: data.errors ?? [],
        truncatedErrors: data.truncatedErrors ?? 0,
        warning: data.warning,
      });
      setCsvFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setBulkError("Something went wrong. Please try again.");
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly || !selectedEventId) return;

    setError("");
    setSuccess(null);
    setLoading(true);

    const mobileNumber = buildE164Phone(countryDial, mobileLocal);

    try {
      const res = await fetch("/api/admin/manual-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          city: city.trim(),
          mobileNumber,
          accompanyingPersons: Number(accompanyingPersons),
          attendeeCategory,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to register client");
        return;
      }

      setSuccess({ uniqueCode: data.uniqueCode });
      resetClientFields();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div>
        <label htmlFor="manual-register-event" className="mb-2 block text-sm font-medium text-zinc-700">
          Select event
        </label>
        <select
          id="manual-register-event"
          value={selectedEventId}
          onChange={(e) => {
            setSelectedEventId(e.target.value);
            setSuccess(null);
            setError("");
            resetBulkState();
          }}
          disabled={readOnly}
          className="w-full max-w-md rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Choose an event</option>
          {events.map((event) => (
            <option key={event.eventId} value={event.eventId}>
              {event.dropdownLabel}
            </option>
          ))}
        </select>
      </div>

      {readOnly ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Sub managers have view-only access. Manual registration is disabled.
        </p>
      ) : null}

      {selectedEventId ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6"
        >
          <h2 className="text-lg font-semibold text-zinc-900">Client details</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Registered clients appear directly in Registered Client for the selected event.
          </p>

          {error ? (
            <p className="mt-4 rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          {success ? (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p className="font-medium">Client registered successfully.</p>
              <p className="mt-1">
                Pass code: <span className="font-mono font-semibold">{success.uniqueCode}</span>
              </p>
              <Link
                href="/admin/registrations"
                className="mt-2 inline-block font-medium text-emerald-800 underline hover:no-underline"
              >
                View in Registered Client
              </Link>
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="manual-first-name" className={labelClassName}>
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="manual-first-name"
                type="text"
                value={firstName}
                onChange={(e) =>
                  setFirstName(trimToFieldLimit(e.target.value, REGISTRATION_FIELD_LIMITS.firstName))
                }
                maxLength={REGISTRATION_FIELD_LIMITS.firstName}
                required
                disabled={readOnly || loading}
                className={inputClassName}
                placeholder="First name"
              />
            </div>

            <div>
              <label htmlFor="manual-last-name" className={labelClassName}>
                Last Name <span className="text-zinc-400">(optional)</span>
              </label>
              <input
                id="manual-last-name"
                type="text"
                value={lastName}
                onChange={(e) =>
                  setLastName(trimToFieldLimit(e.target.value, REGISTRATION_FIELD_LIMITS.surname))
                }
                maxLength={REGISTRATION_FIELD_LIMITS.surname}
                disabled={readOnly || loading}
                className={inputClassName}
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="manual-mobile" className={labelClassName}>
              Mobile <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2.5">
              <select
                value={countryDial}
                onChange={(e) => setCountryDial(e.target.value)}
                disabled={readOnly || loading}
                className={`${inputClassName} w-[9.5rem] shrink-0 sm:w-36`}
                aria-label="Country code"
              >
                {PHONE_COUNTRIES.map((country) => (
                  <option key={country.code} value={country.dial}>
                    {country.dial} {country.name}
                  </option>
                ))}
              </select>
              <input
                id="manual-mobile"
                type="tel"
                inputMode="numeric"
                value={mobileLocal}
                onChange={(e) =>
                  setMobileLocal(
                    e.target.value
                      .replace(/[^\d]/g, "")
                      .slice(0, REGISTRATION_FIELD_LIMITS.mobileLocalDigits)
                  )
                }
                maxLength={REGISTRATION_FIELD_LIMITS.mobileLocalDigits}
                required
                disabled={readOnly || loading}
                className={`${inputClassName} min-w-0 flex-1`}
                placeholder="Mobile number"
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="manual-email" className={labelClassName}>
              Email <span className="text-zinc-400">(optional)</span>
            </label>
            <input
              id="manual-email"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(trimToFieldLimit(e.target.value, REGISTRATION_FIELD_LIMITS.email))
              }
              maxLength={REGISTRATION_FIELD_LIMITS.email}
              disabled={readOnly || loading}
              className={inputClassName}
              placeholder="email@example.com"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="manual-city" className={labelClassName}>
              City <span className="text-zinc-400">(optional)</span>
            </label>
            <input
              id="manual-city"
              type="text"
              value={city}
              onChange={(e) =>
                setCity(trimToFieldLimit(e.target.value, REGISTRATION_FIELD_LIMITS.city))
              }
              maxLength={REGISTRATION_FIELD_LIMITS.city}
              disabled={readOnly || loading}
              className={inputClassName}
              placeholder="City"
            />
          </div>

          <fieldset className="mt-4">
            <legend className={labelClassName}>
              Attendee Category <span className="text-zinc-400">(optional)</span>
            </legend>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {ATTENDEE_CATEGORY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700"
                >
                  <input
                    type="radio"
                    name="manual-attendee-category"
                    value={option.value}
                    checked={attendeeCategory === option.value}
                    onChange={(e) => setAttendeeCategory(e.target.value)}
                    disabled={readOnly || loading}
                    className="h-4 w-4 border-zinc-300 text-brand-500 focus:ring-brand-500"
                  />
                  {option.label}
                </label>
              ))}
              {attendeeCategory ? (
                <button
                  type="button"
                  onClick={() => setAttendeeCategory("")}
                  disabled={readOnly || loading}
                  className="text-sm text-zinc-500 underline hover:no-underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </fieldset>

          <div className="mt-4">
            <label htmlFor="manual-accompanying" className={labelClassName}>
              Coming with how many persons?
            </label>
            <input
              id="manual-accompanying"
              type="number"
              min={0}
              max={20}
              value={accompanyingPersons}
              onChange={(e) => setAccompanyingPersons(e.target.value)}
              disabled={readOnly || loading}
              className={inputClassName}
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              Number of additional people accompanying this guest (excluding the registrant).
            </p>
          </div>

          <button
            type="submit"
            disabled={readOnly || loading}
            className="mt-6 rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Registering…" : "Register client"}
          </button>
        </form>
      ) : null}

      {selectedEventId && !readOnly ? (
        <form
          onSubmit={handleBulkUpload}
          className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6"
        >
          <h2 className="text-lg font-semibold text-zinc-900">Bulk upload (CSV)</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Upload multiple guests at once. Imported guests are added to the{" "}
            <span className="font-medium">waitlist</span> for this event — no confirmation email is
            sent until you accept them in Waitlist.
          </p>

          <button
            type="button"
            onClick={downloadSampleCsv}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Download sample CSV
          </button>

          <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600">
            <p className="font-medium text-zinc-700">Expected columns</p>
            <p className="mt-1">{BULK_CSV_HEADERS.join(" · ")}</p>
            <p className="mt-1.5">
              <span className="font-medium">First Name</span> and{" "}
              <span className="font-medium">Mobile Number</span> are required. Mobile must be in
              international format (e.g. +919876543210). Attendee Category accepts{" "}
              <span className="font-medium">VIP</span> or{" "}
              <span className="font-medium">HCL / Other</span>, or may be left blank.
            </p>
          </div>

          {bulkError ? (
            <p className="mt-4 rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">{bulkError}</p>
          ) : null}

          {bulkResult ? (
            <div className="mt-4 space-y-3">
              <div
                className={`rounded-md border px-4 py-3 text-sm ${
                  bulkResult.failed > 0
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "border-emerald-200 bg-emerald-50 text-emerald-900"
                }`}
              >
                <p className="font-medium">
                  Imported {bulkResult.created} of {bulkResult.total} row
                  {bulkResult.total === 1 ? "" : "s"} to the waitlist.
                </p>
                {bulkResult.failed > 0 ? (
                  <p className="mt-1">
                    {bulkResult.failed} row{bulkResult.failed === 1 ? "" : "s"} skipped — see below.
                  </p>
                ) : null}
                {bulkResult.created > 0 ? (
                  <Link
                    href="/admin/waitlist"
                    className="mt-2 inline-block font-medium underline hover:no-underline"
                  >
                    Review in Waitlist
                  </Link>
                ) : null}
              </div>

              {bulkResult.warning ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {bulkResult.warning}
                </p>
              ) : null}

              {bulkResult.errors.length > 0 ? (
                <div className="overflow-x-auto rounded-md border border-zinc-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Row</th>
                        <th className="px-3 py-2 font-semibold">Name</th>
                        <th className="px-3 py-2 font-semibold">Reason skipped</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {bulkResult.errors.map((rowError) => (
                        <tr key={`${rowError.row}-${rowError.error}`}>
                          <td className="px-3 py-2 text-zinc-500">{rowError.row}</td>
                          <td className="px-3 py-2 text-zinc-900">{rowError.name}</td>
                          <td className="px-3 py-2 text-zinc-700">{rowError.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {bulkResult.truncatedErrors > 0 ? (
                    <p className="border-t border-zinc-200 px-3 py-2 text-xs text-zinc-500">
                      …and {bulkResult.truncatedErrors} more.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4">
            <label htmlFor="manual-bulk-csv" className={labelClassName}>
              CSV file
            </label>
            <input
              id="manual-bulk-csv"
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                setCsvFile(e.target.files?.[0] ?? null);
                setBulkError("");
                setBulkResult(null);
              }}
              disabled={bulkLoading}
              className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
            />
          </div>

          <button
            type="submit"
            disabled={bulkLoading || !csvFile}
            className="mt-5 rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {bulkLoading ? "Uploading…" : "Upload CSV"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
