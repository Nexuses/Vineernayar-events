export type PhoneCountry = {
  code: string;
  name: string;
  dial: string;
};

/** Common countries for event registration; India first as default. */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "IN", name: "India", dial: "+91" },
  { code: "LK", name: "Sri Lanka", dial: "+94" },
  { code: "US", name: "United States", dial: "+1" },
  { code: "GB", name: "United Kingdom", dial: "+44" },
  { code: "AE", name: "United Arab Emirates", dial: "+971" },
  { code: "SG", name: "Singapore", dial: "+65" },
  { code: "AU", name: "Australia", dial: "+61" },
  { code: "CA", name: "Canada", dial: "+1" },
  { code: "DE", name: "Germany", dial: "+49" },
  { code: "FR", name: "France", dial: "+33" },
  { code: "MY", name: "Malaysia", dial: "+60" },
  { code: "NP", name: "Nepal", dial: "+977" },
  { code: "BD", name: "Bangladesh", dial: "+880" },
  { code: "PK", name: "Pakistan", dial: "+92" },
  { code: "QA", name: "Qatar", dial: "+974" },
  { code: "SA", name: "Saudi Arabia", dial: "+966" },
  { code: "ZA", name: "South Africa", dial: "+27" },
  { code: "NZ", name: "New Zealand", dial: "+64" },
  { code: "HK", name: "Hong Kong", dial: "+852" },
  { code: "JP", name: "Japan", dial: "+81" },
  { code: "CN", name: "China", dial: "+86" },
];

export const DEFAULT_PHONE_COUNTRY = PHONE_COUNTRIES[0];

export function buildE164Phone(dial: string, localNumber: string): string {
  const digits = localNumber.replace(/\D/g, "");
  if (!digits || !dial.startsWith("+")) return "";
  const full = `${dial}${digits}`;
  return /^\+\d{8,15}$/.test(full) ? full : "";
}

export function maskPhoneForDisplay(phone: string): string {
  if (phone.length < 6) return phone;
  const visible = phone.slice(-4);
  const prefix = phone.slice(0, Math.min(4, phone.length - 4));
  return `${prefix}••••${visible}`;
}
