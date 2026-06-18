/** Parse optional seat limit from admin form/API. Empty = no limit. */
export function parseSeatLimit(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = typeof value === "number" ? value : Number.parseInt(String(value).trim(), 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Seat limit must be a positive whole number");
  }
  return Math.floor(n);
}
