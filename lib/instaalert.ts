import "server-only";

/** Digits only (no +), e.g. 919876543210 */
export function toInstaAlertMobile(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Send OTP via InstaAlerts QueryStringReceiver HTTP API.
 * Requires INSTAALERTS_API_KEY and INSTAALERTS_SENDER_ID.
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

  const message = `Your one time password for Sampark Smart Shala is ${otp}. Verify to sign in!`;
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

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("InstaAlerts SMS error:", response.status, body);
    throw new Error(`Unable to send OTP (SMS provider returned ${response.status})`);
  }
}
