"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildE164Phone,
  DEFAULT_PHONE_COUNTRY,
  maskPhoneForDisplay,
  PHONE_COUNTRIES,
} from "@/lib/phone-countries";

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
  const [countryDial, setCountryDial] = useState(DEFAULT_PHONE_COUNTRY.dial);
  const [mobileLocal, setMobileLocal] = useState("");
  const [workedWithVineetChoice, setWorkedWithVineetChoice] = useState<"" | "yes" | "no">("");
  const [workedWithVineetDetails, setWorkedWithVineetDetails] = useState("");
  const [questionForVineet, setQuestionForVineet] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [apparelSize, setApparelSize] = useState("");
  const [overnightStayChoice, setOvernightStayChoice] = useState<"" | "yes" | "no">("");
  const [passportNic, setPassportNic] = useState("");
  const [transportChoice, setTransportChoice] = useState<"" | "yes" | "no">("");
  const [transportLocation, setTransportLocation] = useState("");
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpModalError, setOtpModalError] = useState("");
  const [verifiedMobile, setVerifiedMobile] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);

  const apparelSizes = ["S", "M", "L", "XL", "XXL", "XXXL", "XXXXL", "XXXXXL"];

  const transportNeeded = transportChoice === "yes";

  const whatsappRequired = !!event.requireWhatsAppNumber;

  function getFullMobileNumber(): string {
    return buildE164Phone(countryDial, mobileLocal);
  }

  function validateForm(): string | null {
    if (!agreedToPrivacy) return "You must agree to the Privacy Policy to register.";
    if (workedWithVineetChoice === "yes" && !workedWithVineetDetails.trim()) {
      return "Please tell us more about where or how you connected.";
    }
    if (!questionForVineet.trim()) {
      return "Please share one question you would like to ask Vineet Nayar at the event.";
    }
    if (!mobileLocal.trim()) return "Mobile number is required.";
    if (!getFullMobileNumber()) {
      return "Enter a valid mobile number for the selected country.";
    }
    if (event.requireWhatsAppNumber && !whatsappNumber.trim()) return "WhatsApp number is required.";
    if (event.collectApparelSize && event.requireApparelSize && !apparelSize.trim()) {
      return "Please select an apparel size.";
    }
    if (event.collectOvernightStay && event.requireOvernightStay) {
      if (overnightStayChoice === "") return "Please select an option for Overnight Stay.";
      if (overnightStayChoice !== "yes") return "Overnight Stay is required.";
    }
    if (event.collectPassportNic && event.requirePassportNic && !passportNic.trim()) {
      return "Passport or NIC is required.";
    }
    if (event.collectTransport && event.requireTransport && transportChoice === "") {
      return "Please select an option for Transport.";
    }
    if (event.collectTransport && transportNeeded && !transportLocation.trim()) {
      return "Please select a transport location.";
    }
    return null;
  }

  function buildRegistrationPayload(mobileNumber: string, otp: string) {
    return {
      firstName,
      surname,
      email,
      mobileNumber,
      ...(workedWithVineetChoice !== "" && {
        workedWithVineet: workedWithVineetChoice === "yes",
        workedWithVineetDetails:
          workedWithVineetChoice === "yes" ? workedWithVineetDetails.trim() : undefined,
      }),
      questionForVineet: questionForVineet.trim(),
      addToWhatsapp: whatsappRequired,
      whatsappNumber: whatsappRequired ? whatsappNumber?.trim() || undefined : undefined,
      ...(event.collectApparelSize && { apparelSize: apparelSize || undefined }),
      ...(event.collectOvernightStay && {
        overnightStay: overnightStayChoice === "yes",
      }),
      ...(event.collectPassportNic && { passportNic: passportNic || undefined }),
      ...(event.collectTransport && { transportNeeded }),
      ...(event.collectTransport && transportNeeded && {
        transportLocation: transportLocation || undefined,
      }),
      otpCode: otp,
      agreedToPrivacy: true,
    };
  }

  async function sendOtpToMobile(mobileNumber: string): Promise<string | null> {
    setSendingOtp(true);
    try {
      const otpRes = await fetch(`/api/events/${eventId}/register/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber }),
      });
      const otpData = await otpRes.json();
      if (!otpRes.ok) {
        return otpData.error || "Unable to send OTP";
      }
      return null;
    } catch {
      return "Unable to send OTP. Please try again.";
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const mobileNumber = getFullMobileNumber();
    const otpError = await sendOtpToMobile(mobileNumber);
    if (otpError) {
      setError(otpError);
      return;
    }

    setVerifiedMobile(mobileNumber);
    setOtpCode("");
    setOtpModalError("");
    setOtpModalOpen(true);
  }

  function closeOtpModal() {
    if (loading || sendingOtp) return;
    setOtpModalOpen(false);
    setOtpCode("");
    setOtpModalError("");
  }

  async function handleResendOtp() {
    if (!verifiedMobile || sendingOtp) return;
    setOtpModalError("");
    const otpError = await sendOtpToMobile(verifiedMobile);
    if (otpError) {
      setOtpModalError(otpError);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOtpModalError("");

    if (!otpCode.trim()) {
      setOtpModalError("Enter the OTP sent to your mobile.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRegistrationPayload(verifiedMobile, otpCode.trim())),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpModalError(data.error || "Registration failed");
        return;
      }
      router.replace(`/events/${eventId}/register?waitlisted=1`);
    } catch {
      setOtpModalError("Something went wrong. Please try again.");
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
          Mobile Number <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <div className="relative w-[9.5rem] shrink-0 sm:w-44">
            <select
              value={countryDial}
              onChange={(e) => setCountryDial(e.target.value)}
              className={`${inputClass} cursor-pointer appearance-none pr-8 text-sm`}
              aria-label="Country code"
            >
              {PHONE_COUNTRIES.map((country) => (
                <option key={country.code} value={country.dial}>
                  {country.dial} {country.name}
                </option>
              ))}
            </select>
            {selectChevron}
          </div>
          <input
            type="tel"
            inputMode="numeric"
            value={mobileLocal}
            onChange={(e) =>
              setMobileLocal(e.target.value.replace(/[^\d]/g, "").slice(0, 15))
            }
            required
            className={`${inputClass} min-w-0 flex-1`}
            placeholder="Mobile number"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Have you worked, studied, or partnered with Vineet Nayar?
        </label>
        <div className="relative">
          <select
            value={workedWithVineetChoice}
            onChange={(e) => {
              const v = e.target.value as "" | "yes" | "no";
              setWorkedWithVineetChoice(v);
              if (v !== "yes") setWorkedWithVineetDetails("");
            }}
            className={`${inputClass} cursor-pointer appearance-none pr-10`}
            aria-label="Worked, studied, or partnered with Vineet Nayar"
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          {selectChevron}
        </div>
      </div>

      {workedWithVineetChoice === "yes" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Tell us more about where or how you connected.{" "}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            value={workedWithVineetDetails}
            onChange={(e) => setWorkedWithVineetDetails(e.target.value)}
            required
            rows={3}
            className={inputClass}
            placeholder="e.g. How and where you connected — company, university, event, or partnership"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          One question you'd like to ask Vineet Nayar at the event{" "}
          <span className="text-red-500">*</span>
        </label>
        <textarea
          value={questionForVineet}
          onChange={(e) => setQuestionForVineet(e.target.value)}
          required
          rows={3}
          className={inputClass}
          placeholder="Type your question here"
        />
      </div>

        {whatsappRequired && (
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

      <p className="text-center text-sm font-medium text-zinc-700">
        <span className="text-red-600">300 seats only.</span> Apply early, applications close once full.
      </p>

      <button
        type="submit"
        disabled={loading || sendingOtp}
        className="w-full rounded-md bg-brand-500 px-4 py-3 font-medium text-zinc-900 hover:bg-brand-600 disabled:opacity-50"
      >
        {sendingOtp ? "Sending OTP…" : "Apply to Attend"}
      </button>
    </form>

      {otpModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="otp-modal-title"
        >
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h2 id="otp-modal-title" className="text-lg font-semibold text-zinc-900">
              Verify your mobile
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Enter the OTP sent to{" "}
              <span className="font-medium text-zinc-800">
                {maskPhoneForDisplay(verifiedMobile)}
              </span>
            </p>

            <form onSubmit={handleOtpSubmit} className="mt-5 space-y-4">
              {otpModalError && (
                <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">
                  {otpModalError}
                </p>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  OTP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/[^\d]/g, "").slice(0, 8))
                  }
                  required
                  className={inputClass}
                  placeholder="Enter 6-digit OTP"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={loading || sendingOtp}
                  className="flex-1 rounded-md bg-brand-500 px-4 py-3 font-medium text-zinc-900 hover:bg-brand-600 disabled:opacity-50"
                >
                  {loading ? "Submitting…" : "Submit"}
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || sendingOtp}
                  className="rounded-md border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                >
                  {sendingOtp ? "Sending…" : "Resend OTP"}
                </button>
              </div>

              <button
                type="button"
                onClick={closeOtpModal}
                disabled={loading || sendingOtp}
                className="w-full text-sm text-zinc-500 hover:text-zinc-700 disabled:opacity-50"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
