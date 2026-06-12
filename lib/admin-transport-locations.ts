/** Trim and drop empty entries for storing on the event. */
export function normalizeTransportLocationStrings(values: string[]): string[] {
  return values.map((s) => s.trim()).filter(Boolean);
}

/** FormData: repeated `transportLocations` keys, or legacy `transportLocation1`…`3`. */
export function transportLocationsFromFormData(formData: FormData): string[] {
  const fromMulti = formData
    .getAll("transportLocations")
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (fromMulti.length > 0) return fromMulti;
  const legacy = [1, 2, 3]
    .map((i) => (formData.get(`transportLocation${i}`) as string | null)?.trim() ?? "")
    .filter(Boolean);
  return legacy;
}

/** JSON body: `transportLocations` array or legacy `transportLocation1`…`3`. */
export function transportLocationsFromJsonBody(body: Record<string, unknown>): string[] {
  if (Array.isArray(body.transportLocations)) {
    return body.transportLocations.map((s) => String(s).trim()).filter(Boolean);
  }
  return [body.transportLocation1, body.transportLocation2, body.transportLocation3]
    .map((s) => String(s ?? "").trim())
    .filter(Boolean);
}
