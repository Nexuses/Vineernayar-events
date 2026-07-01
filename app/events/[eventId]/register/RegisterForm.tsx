"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildE164Phone,
  DEFAULT_PHONE_COUNTRY,
  maskPhoneForDisplay,
  PHONE_COUNTRIES,
} from "@/lib/phone-countries";
import {
  REGISTRATION_FIELD_LIMITS,
  REGISTRATION_PROFILE_OPTIONS,
  trimToFieldLimit,
} from "@/lib/registration-field-limits";

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
  seatLimit?: number;
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
  const [organization, setOrganization] = useState("");
  const [profile, setProfile] = useState("");
  const [workedWithVineetChoice, setWorkedWithVineetChoice] = useState<"" | "yes" | "no">("");
  const [workedWithVineetDetails, setWorkedWithVineetDetails] = useState("");
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
    if (workedWithVineetChoice === "") {
      return "Please answer whether you have worked, studied, or partnered with Vineet Nayar.";
    }
    if (workedWithVineetChoice === "yes" && !workedWithVineetDetails.trim()) {
      return "Please tell us more about where or how you connected.";
    }
    if (!mobileLocal.trim()) return "Mobile number is required.";
    if (mobileLocal.length !== REGISTRATION_FIELD_LIMITS.mobileLocalDigits) {
      return "Enter a valid 10-digit mobile number.";
    }
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
      organization: organization.trim() || undefined,
      designation: profile || undefined,
      workedWithVineet: workedWithVineetChoice === "yes",
      workedWithVineetDetails:
        workedWithVineetChoice === "yes" ? workedWithVineetDetails.trim() : undefined,
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

  async function checkEmailBeforeOtp(): Promise<string | null> {
    try {
      const res = await fetch(`/api/events/${eventId}/check-eligible`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (data.alreadyRegistered) {
        return "This email is already registered for this event.";
      }
      if (data.registrationClosed) {
        return "Registration is closed for this event.";
      }
      if (!data.eligible) {
        return "This email is not eligible to register for this event.";
      }
      return null;
    } catch {
      return "Unable to verify email right now. Please try again.";
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

    const emailCheckError = await checkEmailBeforeOtp();
    if (emailCheckError) {
      setError(emailCheckError);
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
        if (res.status === 409 || data.error === "Already registered") {
          setOtpModalError("This email is already registered for this event.");
        } else {
          setOtpModalError(data.error || "Registration failed");
        }
        return;
      }
      router.replace(`/events/${eventId}?waitlisted=1`);
    } catch {
      setOtpModalError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-zinc-900 focus:outline-none focus:ring-[3px] focus:ring-brand-500/40";
  const labelClass = "mb-1.5 block text-[13px] font-semibold text-slate-700";
  const seatLimit = event.seatLimit && event.seatLimit > 0 ? event.seatLimit : 300;

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
      <div className="mb-8 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
        <div
          className={`flex items-center gap-2 text-[13px] font-semibold ${
            otpModalOpen ? "text-slate-500" : "text-slate-900"
          }`}
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
              otpModalOpen ? "bg-slate-200 text-slate-700" : "border border-zinc-900 bg-brand-500"
            }`}
          >
            1
          </span>
          Account details
        </div>
        <div className="mx-3 h-0.5 flex-1 bg-slate-200" aria-hidden />
        <div
          className={`flex items-center gap-2 text-[13px] font-semibold ${
            otpModalOpen ? "text-slate-900" : "text-slate-500"
          }`}
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
              otpModalOpen ? "border border-zinc-900 bg-brand-500" : "bg-slate-200 text-slate-700"
            }`}
          >
            2
          </span>
          Verification pass
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>
            First Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) =>
              setFirstName(trimToFieldLimit(e.target.value, REGISTRATION_FIELD_LIMITS.firstName))
            }
            maxLength={REGISTRATION_FIELD_LIMITS.firstName}
            required
            className={inputClass}
            placeholder="First Name"
          />
        </div>
        <div>
          <label className={labelClass}>
            Surname <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={surname}
            onChange={(e) =>
              setSurname(trimToFieldLimit(e.target.value, REGISTRATION_FIELD_LIMITS.surname))
            }
            maxLength={REGISTRATION_FIELD_LIMITS.surname}
            required
            className={inputClass}
            placeholder="Surname"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>
          Email <span className="text-red-600">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) =>
            setEmail(trimToFieldLimit(e.target.value, REGISTRATION_FIELD_LIMITS.email))
          }
          maxLength={REGISTRATION_FIELD_LIMITS.email}
          required
          className={inputClass}
          placeholder="email@example.com"
        />
      </div>

      <div>
        <label className={labelClass}>
          Mobile Number <span className="text-red-600">*</span>
        </label>
        <div className="flex gap-2.5">
          <div className="relative w-[9.5rem] shrink-0 sm:w-36">
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
              setMobileLocal(
                e.target.value
                  .replace(/[^\d]/g, "")
                  .slice(0, REGISTRATION_FIELD_LIMITS.mobileLocalDigits)
              )
            }
            maxLength={REGISTRATION_FIELD_LIMITS.mobileLocalDigits}
            required
            className={`${inputClass} min-w-0 flex-1`}
            placeholder="Mobile number"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>
          Have you worked, studied, or partnered with Vineet Nayar?{" "}
          <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={workedWithVineetChoice}
            onChange={(e) => {
              const v = e.target.value as "" | "yes" | "no";
              setWorkedWithVineetChoice(v);
              if (v !== "yes") setWorkedWithVineetDetails("");
            }}
            required
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
          <label className={labelClass}>
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
        <label className={labelClass}>
          Your current organisation
        </label>
        <input
          type="text"
          value={organization}
          onChange={(e) =>
            setOrganization(trimToFieldLimit(e.target.value, REGISTRATION_FIELD_LIMITS.organization))
          }
          maxLength={REGISTRATION_FIELD_LIMITS.organization}
          className={inputClass}
          placeholder="Organisation name"
        />
      </div>

      <div>
        <label className={labelClass}>
          Your profile
        </label>
        <div className="relative">
          <select
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            className={`${inputClass} cursor-pointer appearance-none pr-10`}
            aria-label="Your profile"
          >
            <option value="">Select</option>
            {REGISTRATION_PROFILE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {selectChevron}
        </div>
      </div>

        {whatsappRequired && (
        <div>
          <label className={labelClass}>
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
          <label className={labelClass}>
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
          <label className={labelClass}>
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
          <label className={labelClass}>
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
              <label className={labelClass}>
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

      <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
        <input
          id="privacy"
          type="checkbox"
          checked={agreedToPrivacy}
          onChange={(e) => setAgreedToPrivacy(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
        />
        <label htmlFor="privacy" className="text-[13px] text-slate-700">
          I agree to the{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline hover:no-underline"
          >
            Privacy Policy
          </a>{" "}
          <span className="text-red-600">*</span>
        </label>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-600">
        <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>
          Limited availability: Only {seatLimit} seats open to preserve networking value.
        </span>
      </div>

      <button
        type="submit"
        disabled={loading || sendingOtp}
        className="w-full rounded-lg border-2 border-zinc-900 bg-brand-500 px-4 py-4 text-base font-extrabold uppercase tracking-wide text-zinc-900 shadow-[0_4px_0_#0f172a] transition hover:translate-y-0.5 hover:shadow-[0_2px_0_#0f172a] disabled:translate-y-0 disabled:opacity-50 disabled:shadow-[0_4px_0_#0f172a]"
      >
        {sendingOtp ? "Sending OTP…" : "Apply to Attend"}
      </button>

      <div className="border-t border-slate-200 pt-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
          Published & managed in collaboration with
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm font-bold text-slate-500">
          <span>PENGUIN BUSINESS</span>
          <span aria-hidden>•</span>
          <span>THE MOVEMENTS TEAM</span>
        </div>
      </div>
    </form>

      {otpModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="otp-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <h2 id="otp-modal-title" className="text-xl font-extrabold text-slate-900">
              Verify your mobile
            </h2>
            <p className="mt-2 text-sm text-slate-600">
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
                <label className={labelClass}>
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
                  className="flex-1 rounded-lg border-2 border-zinc-900 bg-brand-500 px-4 py-3 font-bold text-zinc-900 shadow-[0_3px_0_#0f172a] transition hover:translate-y-0.5 hover:shadow-[0_1px_0_#0f172a] disabled:opacity-50"
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
