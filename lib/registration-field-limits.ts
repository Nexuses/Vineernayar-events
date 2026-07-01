import { PHONE_COUNTRIES } from "./phone-countries";

export const REGISTRATION_FIELD_LIMITS = {
  firstName: 50,
  surname: 50,
  email: 100,
  organization: 100,
  mobileLocalDigits: 10,
} as const;

export const REGISTRATION_PROFILE_OPTIONS = [
  "Student",
  "Frontline Employee",
  "Middle Manager",
  "Senior Manager",
] as const;

export type RegistrationProfile = (typeof REGISTRATION_PROFILE_OPTIONS)[number];

export function isRegistrationProfile(value: string): value is RegistrationProfile {
  return (REGISTRATION_PROFILE_OPTIONS as readonly string[]).includes(value);
}

export function trimToFieldLimit(value: string, max: number): string {
  return value.slice(0, max);
}

export function getMobileLocalDigits(e164: string): string | null {
  if (!e164.startsWith("+")) return null;

  const dialCodes = [...new Set(PHONE_COUNTRIES.map((c) => c.dial))].sort(
    (a, b) => b.length - a.length
  );

  for (const dial of dialCodes) {
    if (e164.startsWith(dial)) {
      const local = e164.slice(dial.length);
      return local.length > 0 ? local : null;
    }
  }

  const fallback = e164.match(/^\+\d{1,3}(\d{6,})$/);
  return fallback ? fallback[1] : null;
}

export function validateRegistrationFieldLengths(input: {
  firstName: string;
  surname: string;
  email: string;
  organization?: string;
  mobileE164?: string;
}): string | null {
  const first = input.firstName.trim();
  const last = input.surname.trim();
  const mail = input.email.trim();

  if (first.length > REGISTRATION_FIELD_LIMITS.firstName) {
    return "First name is too long";
  }
  if (last.length > REGISTRATION_FIELD_LIMITS.surname) {
    return "Surname is too long";
  }
  if (mail.length > REGISTRATION_FIELD_LIMITS.email) {
    return "Email is too long";
  }
  if (input.organization && input.organization.trim().length > REGISTRATION_FIELD_LIMITS.organization) {
    return "Organisation name is too long";
  }

  if (input.mobileE164) {
    const local = getMobileLocalDigits(input.mobileE164);
    if (!local || local.length !== REGISTRATION_FIELD_LIMITS.mobileLocalDigits) {
      return "Enter a valid 10-digit mobile number";
    }
  }

  return null;
}
