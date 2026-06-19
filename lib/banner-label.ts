const CITY_LABELS = [
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Kolkata",
] as const;

export function getBannerHighlightLabel(venue?: string, eventName?: string): string {
  const venueText = (venue || "").trim();
  if (venueText) {
    for (const city of CITY_LABELS) {
      if (venueText.toLowerCase().includes(city.toLowerCase())) {
        return city === "Bangalore" ? "Bengaluru" : city;
      }
    }

    const parts = venueText.split(",").map((part) => part.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) {
      const words = last.split(/\s+/).filter(Boolean);
      if (words.length === 1) return words[0]!;
      if (words.length >= 2 && words[0]!.toLowerCase() === "new") {
        return `${words[0]} ${words[1]}`;
      }
      return words[words.length - 1]!;
    }
  }

  const name = (eventName || "").trim();
  if (!name) return "";

  const firstChunk = name.split(/[·|,|–|-]/)[0]?.trim();
  return firstChunk || name.split(/\s+/).slice(0, 2).join(" ");
}
