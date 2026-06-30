import type { SendMailOptions } from "nodemailer";
import { isSendCleanApiConfigured, sendViaSendCleanApi, type MailAttachment } from "@/lib/sendclean";
import {
  getSmtpTransporter,
  isSmtpConfigured,
  SMTP_FROM_EMAIL,
  SMTP_FROM_NAME,
  SMTP_REPLY_EMAIL,
} from "@/lib/smtp";

export type AppMailInput = {
  to: string | string[];
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: MailAttachment[];
  icalEvent?: {
    filename: string;
    method: string;
    content: string;
  };
};

export function isMailConfigured(): boolean {
  return isSendCleanApiConfigured() || isSmtpConfigured();
}

function toNodemailerAttachments(
  attachments?: MailAttachment[]
): SendMailOptions["attachments"] {
  if (!attachments?.length) return undefined;
  return attachments.map((attachment) => ({
    filename: attachment.filename,
    content: attachment.content,
    contentType: attachment.contentType,
  }));
}

export async function sendAppMail(input: AppMailInput): Promise<void> {
  const replyTo = input.replyTo?.trim() || SMTP_REPLY_EMAIL;
  const attachments = [...(input.attachments ?? [])];

  if (input.icalEvent) {
    attachments.push({
      filename: input.icalEvent.filename,
      content: Buffer.from(input.icalEvent.content, "utf-8"),
      contentType: "text/calendar; method=REQUEST",
    });
  }

  if (isSendCleanApiConfigured()) {
    await sendViaSendCleanApi({
      to: input.to,
      toName: input.toName,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    return;
  }

  const transporter = getSmtpTransporter();
  if (!transporter) {
    throw new Error(
      "Email is not configured. Set SENDCLEAN_OWNER_ID, SENDCLEAN_TOKEN, SENDCLEAN_SMTPUSER (API), or SMTP_HOST + SENDCLEAN_SMTP_PASSWORD (SMTP)."
    );
  }

  await transporter.sendMail({
    from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
    to: Array.isArray(input.to) ? input.to.join(", ") : input.to,
    replyTo,
    subject: input.subject,
    text: input.text,
    html: input.html,
    attachments: toNodemailerAttachments(attachments),
    ...(input.icalEvent
      ? {
          icalEvent: {
            filename: input.icalEvent.filename,
            method: input.icalEvent.method,
            content: input.icalEvent.content,
          },
        }
      : {}),
  });
}
