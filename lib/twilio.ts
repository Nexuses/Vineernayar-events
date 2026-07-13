import "server-only";

import twilio from "twilio";

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials are not configured");
  }

  return twilio(accountSid, authToken);
}

export async function sendOtpSms(phone: string, otp: string): Promise<void> {
  const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim();

  if (!fromNumber) {
    throw new Error("TWILIO_PHONE_NUMBER is not configured");
  }

  const client = getTwilioClient();

  await client.messages.create({
    body: `Your verification code is ${otp}. It expires in 5 minutes.`,
    from: fromNumber,
    to: phone,
  });
}
