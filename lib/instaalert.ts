import "server-only";

/** Digits only (no +), e.g. 919876543210 */
export function toInstaAlertMobile(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Send OTP via InstaAlerts QueryStringReceiver HTTP API.
 * Requires INSTAALERTS_API_KEY and INSTAALERTS_SENDER_ID.
 *
 * Message text must match the approved DLT template (including trailing sender id).
 */
export async function sendOtpSms(phone: string, otp: string): Promise<void> {
  const apiKey = process.env.INSTAALERTS_API_KEY?.trim();
  const senderId = process.env.INSTAALERTS_SENDER_ID?.trim();

  if (!apiKey || !senderId) {
    throw new Error(
      "InstaAlerts OTP is not configured. Set INSTAALERTS_API_KEY and INSTAALERTS_SENDER_ID."
    );
  }

  const dest = toInstaAlertMobile(phone);
  if (!dest) {
    throw new Error("Invalid mobile number for SMS");
  }

  // Keep newline + sender id — required for DLT template match
  const message = `Your HFMS Registration OTP verification code is : ${otp}\n${senderId}`;
  const sms = encodeURI(message);

  const url =
    `https://japi.instaalerts.zone/httpapi/QueryStringReceiver?ver=1.0&encrpt=0` +
    `&key=${encodeURIComponent(apiKey)}` +
    `&send=${encodeURIComponent(senderId)}` +
    `&dest=${dest}` +
    `&text=${sms}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const body = await response.text().catch(() => "");

  if (!response.ok) {
    console.error("InstaAlerts SMS error:", response.status, body);
    throw new Error(`Unable to send OTP (SMS provider returned ${response.status})`);
  }

  // Provider often returns HTTP 200 even when delivery fails
  const normalized = body.trim().toLowerCase();
  if (
    normalized.includes("fail") ||
    normalized.includes("error") ||
    normalized.includes("invalid") ||
    normalized.includes("reject")
  ) {
    console.error("InstaAlerts SMS rejected:", body);
    throw new Error("Unable to send OTP. SMS provider rejected the message.");
  }

  console.info("InstaAlerts SMS response:", body || "(empty)");
}
