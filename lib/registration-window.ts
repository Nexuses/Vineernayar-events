export type RegistrationWindowStatus = "open_soon" | "open" | "closed";

type RegistrationWindowEvent = {
  registrationStartDate?: Date | string;
  registrationEndDate?: Date | string;
};

/** Open / opens soon / closed from registration start and end dates only. */
export function getRegistrationWindowStatus(
  event: RegistrationWindowEvent
): RegistrationWindowStatus {
  const now = Date.now();
  const startMs = event.registrationStartDate
    ? new Date(event.registrationStartDate).getTime()
    : NaN;
  const endMs = event.registrationEndDate
    ? new Date(event.registrationEndDate).getTime()
    : NaN;
  const hasStart = !Number.isNaN(startMs);
  const hasEnd = !Number.isNaN(endMs);

  // Before registration opens → Opens Soon
  if (hasStart && now < startMs) return "open_soon";

  // After registration end date has passed → Closed
  if (hasEnd && now > endMs) return "closed";

  // Between start and end (or after start with no end) → Open
  return "open";
}

export function getRegistrationWindowLabel(status: RegistrationWindowStatus): string {
  if (status === "open_soon") return "Opens Soon";
  if (status === "open") return "Open";
  return "Closed";
}

export function getPublicRegistrationWindowLabel(status: RegistrationWindowStatus): string {
  if (status === "open_soon") return "Registration Opens Soon";
  if (status === "open") return "Registration Open";
  return "Registration Closed";
}

export function getRegistrationWindowBadgeClass(status: RegistrationWindowStatus): string {
  if (status === "open") return "bg-green-100 text-green-800";
  if (status === "open_soon") return "bg-brand-100 text-brand-800";
  return "bg-red-100 text-red-800";
}
