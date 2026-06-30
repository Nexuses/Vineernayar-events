import "server-only";

import Twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

function getClient() {
  if (!accountSid || !authToken || !verifyServiceSid) {
    throw new Error(
      "Twilio OTP is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID."
    );
  }
  return Twilio(accountSid, authToken);
}

export function normalizePhoneForOtp(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (!trimmed.startsWith("+")) {
    return "";
  }
  const normalized = `+${trimmed.slice(1).replace(/[^\d]/g, "")}`;
  return /^\+\d{8,15}$/.test(normalized) ? normalized : "";
}

export async function sendOtpCode(phone: string): Promise<void> {
  const client = getClient();
  await client.verify.v2.services(verifyServiceSid!).verifications.create({
    to: phone,
    channel: "sms",
  });
}

export async function checkOtpCode(phone: string, code: string): Promise<boolean> {
  const client = getClient();
  const check = await client.verify.v2.services(verifyServiceSid!).verificationChecks.create({
    to: phone,
    code: code.trim(),
  });
  return check.status === "approved";
}
