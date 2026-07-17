"use client";

import Link from "next/link";
import { useState } from "react";
import {
  buildE164Phone,
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
} from "@/lib/phone-countries";
import {
  REGISTRATION_FIELD_LIMITS,
  trimToFieldLimit,
} from "@/lib/registration-field-limits";

type EventItem = {
  eventId: string;
  eventName: string;
  dropdownLabel: string;
};

const inputClassName =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

const labelClassName = "mb-1.5 block text-sm font-medium text-zinc-700";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ uniqueCode: string } | null>(null);

  function resetClientFields() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setCity("");
    setMobileLocal("");
    setAccompanyingPersons("0");
    setError("");
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
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="manual-last-name"
                type="text"
                value={lastName}
                onChange={(e) =>
                  setLastName(trimToFieldLimit(e.target.value, REGISTRATION_FIELD_LIMITS.surname))
                }
                maxLength={REGISTRATION_FIELD_LIMITS.surname}
                required
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
    </div>
  );
}
