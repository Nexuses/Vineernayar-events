import {
  SMTP_FROM_EMAIL,
  SMTP_FROM_NAME,
  SMTP_REPLY_EMAIL,
} from "@/lib/smtp";

const API_HOST =
  process.env.SENDCLEAN_API_HOST?.trim() || "us1-mta1.sendclean.net";

export type MailAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

export type SendMailInput = {
  to: string | string[];
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: MailAttachment[];
};

export function isSendCleanApiConfigured(): boolean {
  return Boolean(
    process.env.SENDCLEAN_OWNER_ID?.trim() &&
      process.env.SENDCLEAN_TOKEN?.trim() &&
      process.env.SENDCLEAN_SMTPUSER?.trim() &&
      SMTP_FROM_EMAIL
  );
}

function getApiUrl(): string {
  return `https://api.${API_HOST}/v1.0/messages/sendMail`;
}

function isSendCleanSuccess(data: {
  status?: string;
  message?: string;
  name?: string;
  type?: string;
}): boolean {
  const status = data.status?.toLowerCase().trim() ?? "";
  const message = data.message ?? "";

  if (status === "success" || status === "queued") {
    return true;
  }

  // SendClean sometimes returns SMTP-style success in message without status: "success"
  if (/^250\b/i.test(message) || /queued/i.test(message)) {
    return true;
  }

  if (status === "error" || data.type === "AuthenticationError") {
    return false;
  }

  return false;
}

async function parseSendCleanResponse(response: Response): Promise<void> {
  const raw = await response.text();
  let data: { status?: string; message?: string; name?: string; type?: string };

  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    const preview = raw.replace(/\s+/g, " ").trim().slice(0, 200);
    throw new Error(
      `SendClean API returned non-JSON (HTTP ${response.status})${preview ? `: ${preview}` : ""}`
    );
  }

  if (!isSendCleanSuccess(data)) {
    const detail = data.message || data.name || data.type || `HTTP ${response.status}`;
    throw new Error(`SendClean API error: ${detail}`);
  }
}

export async function sendViaSendCleanApi(input: SendMailInput): Promise<void> {
  const owner_id = process.env.SENDCLEAN_OWNER_ID!.trim();
  const token = process.env.SENDCLEAN_TOKEN!.trim();
  const smtp_user_name = process.env.SENDCLEAN_SMTPUSER!.trim();
  const replyTo = input.replyTo?.trim() || SMTP_REPLY_EMAIL;

  const recipients = (Array.isArray(input.to) ? input.to : [input.to])
    .map((email) => email.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error("SendClean API error: no recipients");
  }

  const message: Record<string, unknown> = {
    html: input.html,
    subject: input.subject,
    from_email: SMTP_FROM_EMAIL,
    from_name: SMTP_FROM_NAME,
    to: recipients.map((email) => ({
      email,
      name: input.toName?.trim() || email,
      type: "to",
    })),
    headers: {
      "Reply-To": replyTo,
    },
  };

  if (input.text) {
    message.text = input.text;
  }

  if (input.attachments?.length) {
    message.attachments = input.attachments.map((attachment) => ({
      type: attachment.contentType,
      name: attachment.filename,
      content: attachment.content.toString("base64"),
    }));
  }

  const body = JSON.stringify({
    owner_id,
    token,
    smtp_user_name,
    message,
  });

  const url = getApiUrl();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!response.ok && response.status >= 500 && attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        continue;
      }

      await parseSendCleanResponse(response);
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        continue;
      }
    }
  }

  throw lastError ?? new Error("SendClean API error: request failed");
}
