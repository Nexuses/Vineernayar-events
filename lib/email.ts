import nodemailer from "nodemailer";
import { getSequenceSubject, type EmailSequenceKey } from "@/lib/email-sequence";
import {
  buildSequenceEmailHtml,
  buildSequenceEmailText,
  buildSequenceRenderContext,
} from "@/lib/email-sequence-template";
import {
  applyEmailTemplate,
  sequenceContextToVars,
} from "@/lib/email-template-registry";
import { getEmailTemplateOverride } from "@/lib/models/EmailTemplate";
import { BRAND_NAME } from "@/lib/constants";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@example.com";
const FROM_NAME = process.env.FROM_NAME || `${BRAND_NAME} Events`;

function getTransporter() {
  if (!SMTP_HOST || !EMAIL_USER || !EMAIL_APP_PASSWORD) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_APP_PASSWORD,
    },
  });
}

export type PassEmailData = {
  to: string;
  firstName: string;
  surname: string;
  mobileNumber?: string;
  email: string;
  eventName: string;
  eventStartDate: string;
  eventEndDate: string;
  eventTime?: string;
  venue: string;
  createdAt: string;
  passUrl: string;
  uniqueCode: string;
  sequenceKey?: EmailSequenceKey;
};

export type SequenceEmailAttachments = {
  passPdfBuffer?: Buffer;
  passIcsBuffer?: Buffer;
};

export async function sendSequenceEmail(
  data: PassEmailData,
  key: EmailSequenceKey,
  attachments?: SequenceEmailAttachments
): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("Email not configured: missing SMTP_HOST, EMAIL_USER or EMAIL_APP_PASSWORD");
    return false;
  }
  try {
    const mailAttachments: nodemailer.SendMailOptions["attachments"] = [];
    let icalEvent: nodemailer.SendMailOptions["icalEvent"];

    if (attachments?.passPdfBuffer && attachments.passPdfBuffer.length > 0) {
      mailAttachments.push({
        filename: `event-pass-${data.uniqueCode}.pdf`,
        content: attachments.passPdfBuffer,
      });
    }
    if (attachments?.passIcsBuffer && attachments.passIcsBuffer.length > 0) {
      icalEvent = {
        filename: "event-invite.ics",
        method: "REQUEST",
        content: attachments.passIcsBuffer.toString("utf-8"),
      };
    }

    const renderCtx = buildSequenceRenderContext(data);
    const subject = getSequenceSubject(key, {
      firstName: data.firstName,
      eventName: data.eventName,
    });
    const customHtml = await getEmailTemplateOverride(key);
    const html = customHtml
      ? applyEmailTemplate(customHtml, {
          ...sequenceContextToVars(renderCtx),
          eventStartDate: data.eventStartDate,
          eventEndDate: data.eventEndDate,
          passUrl: data.passUrl,
        })
      : buildSequenceEmailHtml(key, renderCtx);

    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: data.to,
      subject,
      text: buildSequenceEmailText(key, renderCtx),
      html,
      attachments: mailAttachments.length > 0 ? mailAttachments : undefined,
      ...(icalEvent ? { icalEvent } : {}),
    });
    return true;
  } catch (err) {
    console.error("Send sequence email error:", err);
    return false;
  }
}

/** @deprecated Use sendSequenceEmail — kept for existing imports */
export async function sendPassEmail(
  data: PassEmailData & SequenceEmailAttachments
): Promise<boolean> {
  const { passPdfBuffer, passIcsBuffer, ...emailData } = data;
  return sendSequenceEmail(emailData, data.sequenceKey ?? "seq1", {
    passPdfBuffer,
    passIcsBuffer,
  });
}
