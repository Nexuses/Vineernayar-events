/**
 * Attendee category (VIP / HCL-Other).
 *
 * Collected only on the admin manual registration form — this is intentionally
 * not part of the public event registration form.
 *
 * Kept in its own module (rather than in models/Registration.ts) so client
 * components can import the labels without pulling in the MongoDB driver.
 */
export type AttendeeCategory = "vip" | "hcl_other";

export const ATTENDEE_CATEGORY_LABELS: Record<AttendeeCategory, string> = {
  vip: "VIP",
  hcl_other: "HCL / Other",
};

export const ATTENDEE_CATEGORY_OPTIONS: { value: AttendeeCategory; label: string }[] = [
  { value: "vip", label: ATTENDEE_CATEGORY_LABELS.vip },
  { value: "hcl_other", label: ATTENDEE_CATEGORY_LABELS.hcl_other },
];

export function isAttendeeCategory(value: unknown): value is AttendeeCategory {
  return value === "vip" || value === "hcl_other";
}

export function attendeeCategoryLabel(value?: AttendeeCategory | null): string {
  return value ? ATTENDEE_CATEGORY_LABELS[value] : "";
}

/**
 * Parse a free-text attendee category from a CSV cell.
 *
 * Returns the category, `null` when the cell is blank (the field is optional),
 * or "invalid" when the text does not match a known category.
 * Accepts "VIP", "vip", "HCL", "HCL / Other", "hcl_other", "Other", etc.
 */
export function parseAttendeeCategoryInput(
  value: string
): AttendeeCategory | null | "invalid" {
  const raw = value.trim();
  if (!raw) return null;
  const normalized = raw.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (normalized === "vip") return "vip";
  if (normalized === "hcl" || normalized === "other" || normalized === "hclother") {
    return "hcl_other";
  }
  return "invalid";
}
