/** Opens Google Maps directions to `destination` (user's location as origin when available). */
export function buildGoogleMapsDirectionsUrl(destination: string): string {
  const query = destination.trim();
  if (!query) return "";

  const search = new URLSearchParams({
    api: "1",
    destination: query,
  });

  return `https://www.google.com/maps/dir/?${search.toString()}`;
}
