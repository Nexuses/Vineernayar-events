import "server-only";

const INSTAALERTS_API_URL =
  "https://japi.instaalerts.zone/httpapi/QueryStringReceiver";

function getInstaAlertsConfig() {
  const apiKey = process.env.INSTAALERTS_API_KEY?.trim();
  const senderId = process.env.INSTAALERTS_SENDER_ID?.trim();
  const dltEntityId = process.env.INSTAALERTS_DLT_ENTITY_ID?.trim();
  const dltTemplateId = process.env.INSTAALERTS_DLT_TEMPLATE_ID?.trim();
  const dltTmId = process.env.INSTAALERTS_DLT_TM_ID?.trim();

  if (!apiKey) {
    throw new Error("INSTAALERTS_API_KEY is not configured");
  }
  if (!senderId) {
    throw new Error("INSTAALERTS_SENDER_ID is not configured");
  }

  return { apiKey, senderId, dltEntityId, dltTemplateId, dltTmId };
}

function buildOtpMessage(otp: string, senderId: string): string {
  // Must match the DLT-approved template, including sender suffix line.
  return `Your HFMS Registration OTP verification code is : ${otp}\n${senderId}`;
}

function assertInstaAlertsSuccess(status: number, body: string): void {
  const normalized = body.trim();
  const lower = normalized.toLowerCase();

  if (status >= 400) {
    throw new Error(normalized || `InstaAlerts SMS request failed (${status})`);
  }

  if (lower.includes("platform accepted") || lower.includes("request accepted")) {
    return;
  }

  const statusCodeMatch = normalized.match(/statuscode=(\d+)/i);
  if (statusCodeMatch && statusCodeMatch[1] !== "200") {
    throw new Error(normalized);
  }

  if (
    lower.includes("fail") ||
    lower.includes("error") ||
    lower.includes("invalid") ||
    lower.includes("reject") ||
    lower.includes("not accepted")
  ) {
    throw new Error(normalized);
  }
}

export async function sendOtpSms(phone: string, otp: string): Promise<void> {
  const { apiKey, senderId, dltEntityId, dltTemplateId, dltTmId } =
    getInstaAlertsConfig();
  const dest = phone.replace(/\D/g, "");
  const message = buildOtpMessage(otp, senderId);

  // POST the parameters as an application/x-www-form-urlencoded body. The SMS
  // text is passed as-is; URLSearchParams applies the form encoding, so no
  // manual encoding of the message is needed.
  const form = new URLSearchParams();
  form.set("ver", "1.0");
  form.set("encrpt", "0");
  form.set("key", apiKey);
  form.set("send", senderId);
  form.set("dest", dest);
  form.set("text", message);

  if (dltEntityId) {
    form.set("dlt_entity_id", dltEntityId);
  }
  if (dltTemplateId) {
    form.set("dlt_template_id", dltTemplateId);
  }
  if (dltTmId) {
    form.set("dlt_tm_id", dltTmId);
  }

  const response = await fetch(INSTAALERTS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const body = (await response.text()).trim();

  console.info("[InstaAlerts OTP]", {
    dest,
    status: response.status,
    body,
    hasDltEntityId: Boolean(dltEntityId),
    hasDltTemplateId: Boolean(dltTemplateId),
  });

  assertInstaAlertsSuccess(response.status, body);
}
