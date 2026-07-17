import "server-only";

import {
  canResendOtp,
  generateOtp,
  getOtpTtlMinutes,
  normalizePhoneForOtp,
  saveOtp,
  verifyOtp,
} from "@/lib/otp-store";
import { sendOtpSms } from "@/lib/instaalert";

export { getOtpTtlMinutes, normalizePhoneForOtp };

export class OtpResendCooldownError extends Error {
  retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super(`Please wait ${retryAfterSeconds} seconds before requesting a new OTP`);
    this.name = "OtpResendCooldownError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function sendOtpCode(phone: string): Promise<void> {
  const resendCheck = await canResendOtp(phone);
  if (!resendCheck.allowed) {
    throw new OtpResendCooldownError(resendCheck.retryAfterSeconds ?? 60);
  }

  const otp = generateOtp();
  await sendOtpSms(phone, otp);
  await saveOtp(phone, otp);
}

export async function checkOtpCode(phone: string, code: string): Promise<boolean> {
  const result = await verifyOtp(phone, code);
  return result.success;
}

export { verifyOtp };
