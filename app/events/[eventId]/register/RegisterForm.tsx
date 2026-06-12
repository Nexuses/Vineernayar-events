"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type EventSnap = {
  eventId: string;
  eventName: string;
  eventBanner?: string;
  eventStartDate: string;
  eventEndDate: string;
  venue: string;
  speaker?: string;
  phone?: string;
  registrationStatus?: string;
  collectApparelSize?: boolean;
  requireApparelSize?: boolean;
  collectOvernightStay?: boolean;
  requireOvernightStay?: boolean;
  collectPassportNic?: boolean;
  requirePassportNic?: boolean;
  collectTransport?: boolean;
  requireTransport?: boolean;
  requireWhatsAppNumber?: boolean;
  transportLocations?: string[];
};

export function RegisterForm({
  eventId,
  event,
  prefilledEmail,
}: {
  eventId: string;
  event: EventSnap;
  prefilledEmail: string;
}) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState(prefilledEmail);
  const [organization, setOrganization] = useState("");
  const [designation, setDesignation] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [addToWhatsapp, setAddToWhatsapp] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [apparelSize, setApparelSize] = useState("");
  const [overnightStayChoice, setOvernightStayChoice] = useState<"" | "yes" | "no">("");
  const [passportNic, setPassportNic] = useState("");
  const [transportChoice, setTransportChoice] = useState<"" | "yes" | "no">("");
  const [transportLocation, setTransportLocation] = useState("");
  const [specialComment, setSpecialComment] = useState("");
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);

  const apparelSizes = ["S", "M", "L", "XL", "XXL", "XXXL", "XXXXL", "XXXXXL"];

  const transportNeeded = transportChoice === "yes";

  const whatsappRequired = !!event.requireWhatsAppNumber;
  const whatsappUsingMobile = addToWhatsapp; // toggle means "WhatsApp number = Mobile number"

  // When toggle is ON, always sync WhatsApp number with Mobile.
  // When toggle is OFF, we don't touch whatsappNumber (user can type or leave it empty).
  useEffect(() => {
    if (!whatsappUsingMobile) return;
    setWhatsappNumber(mobileNumber);
  }, [whatsappUsingMobile, mobileNumber]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!agreedToPrivacy) {
      setError("You must agree to the Privacy Policy to register.");
      return;
    }
    if (!organization.trim() || !designation.trim() || !mobileNumber.trim()) {
      setError("Organization, designation and mobile number are required.");
      return;
    }
    if (event.requireWhatsAppNumber && !whatsappNumber.trim()) {
      setError("WhatsApp number is required.");
      return;
    }
    if (event.collectApparelSize && event.requireApparelSize && !apparelSize.trim()) {
      setError("Please select an apparel size.");
      return;
    }
    if (event.collectOvernightStay && event.requireOvernightStay) {
      if (overnightStayChoice === "") {
        setError("Please select an option for Overnight Stay.");
        return;
      }
      if (overnightStayChoice !== "yes") {
        setError("Overnight Stay is required.");
        return;
      }
    }
    if (event.collectPassportNic && event.requirePassportNic && !passportNic.trim()) {
      setError("Passport or NIC is required.");
      return;
    }
    if (event.collectTransport && event.requireTransport) {
      if (transportChoice === "") {
        setError("Please select an option for Transport.");
        return;
      }
    }
    if (
      event.collectTransport &&
      transportNeeded &&
      !transportLocation.trim()
    ) {
      setError("Please select a transport location.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          surname,
          email,
          organization,
          designation,
          mobileNumber,
          addToWhatsapp,
          whatsappNumber: whatsappRequired
            ? whatsappNumber?.trim() || undefined
            : addToWhatsapp
              ? whatsappNumber?.trim() || undefined
              : undefined,
          ...(event.collectApparelSize && { apparelSize: apparelSize || undefined }),
          ...(event.collectOvernightStay && {
            overnightStay: overnightStayChoice === "yes",
          }),
          ...(event.collectPassportNic && { passportNic: passportNic || undefined }),
          ...(event.collectTransport && { transportNeeded }),
          ...(event.collectTransport && transportNeeded && { transportLocation: transportLocation || undefined }),
          specialComment: specialComment || undefined,
          agreedToPrivacy: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      router.push(`/events/${eventId}/pass/${data.uniqueCode}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder:text-zinc-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

  const selectChevron = (
    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500">
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );

  return (
    <>
      {/* Full-screen loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-2xl">
            {/* Spinner */}
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-zinc-200"></div>
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-brand-500"></div>
            </div>
            {/* Message */}
            <div className="text-center">
              <p className="text-lg font-semibold text-zinc-800">
                Generating Your Pass
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Please wait while we process your registration...
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
      {error && (
        <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className={inputClass}
            placeholder="First Name"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Surname <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            required
            className={inputClass}
            placeholder="Surname"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
          placeholder="email@example.com"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Organization <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          required
          className={inputClass}
          placeholder="Organization"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Designation <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          required
          className={inputClass}
          placeholder="Designation"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Mobile Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          required
          className={inputClass}
          placeholder="e.g. 0779400675"
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={addToWhatsapp}
          onClick={() => {
              const next = !addToWhatsapp;
              setAddToWhatsapp(next);
              if (next) setWhatsappNumber(mobileNumber);
          }}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
              addToWhatsapp ? "bg-brand-500" : "bg-zinc-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                addToWhatsapp ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm text-zinc-600">Add to WhatsApp</span>
        </div>
      </div>

        {(addToWhatsapp || whatsappRequired) && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            WhatsApp Number {event.requireWhatsAppNumber ? <span className="text-red-500">*</span> : null}
          </label>
          <div className="flex items-start gap-2">
            <input
              type="tel"
              inputMode="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              required={!!event.requireWhatsAppNumber}
              readOnly={whatsappUsingMobile}
              aria-readonly={whatsappUsingMobile}
              className={inputClass}
              placeholder="WhatsApp number"
            />
          </div>
        </div>
      )}

      {event.collectApparelSize && (
        <div>
          <div className="mb-1 flex items-center gap-2">
            <label className="block text-sm font-medium text-zinc-700">
              Apparel - sizes{" "}
              {event.requireApparelSize ? <span className="text-red-500">*</span> : null}
            </label>
            <button
              type="button"
              onClick={() => setSizeChartOpen(true)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 underline"
            >
              Size chart
            </button>
          </div>
          <select
            value={apparelSize}
            onChange={(e) => setApparelSize(e.target.value)}
            required={!!event.requireApparelSize}
            className={inputClass}
          >
            <option value="">Select size</option>
            {apparelSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          {sizeChartOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Size chart"
              onClick={() => setSizeChartOpen(false)}
            >
              <div
                className="relative max-h-[90vh] max-w-4xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setSizeChartOpen(false)}
                  className="absolute -top-10 right-0 rounded bg-white/90 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-white"
                >
                  Close
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://nexuseslink2024.s3.us-east-2.amazonaws.com/Screenshot_2026-03-09_at_2.49.27_PM.png"
                  alt="Size chart"
                  className="max-h-[85vh] w-auto rounded-lg border border-zinc-200 bg-white shadow-xl"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {event.collectOvernightStay && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Overnight Stay{" "}
            {event.requireOvernightStay ? (
              <span className="text-red-500">*</span>
            ) : null}
          </label>
          <div className="relative">
            <select
              value={overnightStayChoice}
              onChange={(e) =>
                setOvernightStayChoice(e.target.value as "" | "yes" | "no")
              }
              required={!!event.requireOvernightStay}
              className={`${inputClass} cursor-pointer appearance-none pr-10`}
              aria-label="Overnight stay"
            >
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
            {selectChevron}
          </div>
        </div>
      )}

      {event.collectPassportNic && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Passport/NIC{" "}
            {event.requirePassportNic ? (
              <span className="text-red-500">*</span>
            ) : null}
          </label>
          <input
            type="text"
            value={passportNic}
            onChange={(e) => setPassportNic(e.target.value)}
            required={!!event.requirePassportNic}
            className={inputClass}
            placeholder="Passport or NIC number"
          />
        </div>
      )}

      {event.collectTransport && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Transport{" "}
            {event.requireTransport ? (
              <span className="text-red-500">*</span>
            ) : null}
          </label>
          <div className="relative">
            <select
              value={transportChoice}
              onChange={(e) => {
                const v = e.target.value as "" | "yes" | "no";
                setTransportChoice(v);
                if (v === "yes") {
                  setTransportLocation(event.transportLocations?.[0] ?? "");
                } else {
                  setTransportLocation("");
                }
              }}
              required={!!event.requireTransport}
              className={`${inputClass} cursor-pointer appearance-none pr-10`}
              aria-label="Transport needed"
            >
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
            {selectChevron}
          </div>

          {transportNeeded && (
            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Location{" "}
                {transportNeeded ? (
                  <span className="text-red-500">*</span>
                ) : null}
              </label>
              <select
                value={transportLocation}
                onChange={(e) => setTransportLocation(e.target.value)}
                required={transportNeeded}
                className={inputClass}
              >
                <option value="">Select location</option>
                {(event.transportLocations ?? []).map((loc, idx) => (
                  <option key={`${loc}-${idx}`} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="flex items-start gap-3">
        <input
          id="privacy"
          type="checkbox"
          checked={agreedToPrivacy}
          onChange={(e) => setAgreedToPrivacy(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-zinc-300 text-brand-500 focus:ring-brand-500"
        />
        <label htmlFor="privacy" className="text-sm text-zinc-700">
          I agree to the{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            Privacy Policy
          </a>{" "}
          <span className="text-red-500">*</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-brand-500 px-4 py-3 font-medium text-zinc-900 hover:bg-brand-600 disabled:opacity-50"
      >
        {loading ? "Registering…" : "Register"}
      </button>
    </form>
    </>
  );
}
