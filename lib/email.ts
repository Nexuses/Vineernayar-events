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
import { isMailConfigured, sendAppMail } from "@/lib/mail";
import { SMTP_REPLY_EMAIL } from "@/lib/smtp";

export type PassEmailData = {
  to: string;
  firstName: string;
  surname: string;
  mobileNumber?: string;
  email: string;
  eventId: string;
  eventName: string;
  eventStartDate: string;
  eventEndDate: string;
  eventTime?: string;
  venue: string;
  createdAt: string;
  passUrl: string;
  uniqueCode: string;
  sequenceKey?: EmailSequenceKey;
  priorityPass?: boolean;
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
  if (!isMailConfigured()) {
    console.warn(
      "Email not configured: set SENDCLEAN_OWNER_ID, SENDCLEAN_TOKEN, SENDCLEAN_SMTPUSER (API), or SMTP_HOST + SENDCLEAN_SMTP_PASSWORD (SMTP)."
    );
    return false;
  }
  try {
    const mailAttachments: {
      filename: string;
      content: Buffer;
      contentType: string;
    }[] = [];
    let icalEvent:
      | { filename: string; method: string; content: string }
      | undefined;

    if (attachments?.passPdfBuffer && attachments.passPdfBuffer.length > 0) {
      mailAttachments.push({
        filename: `event-pass-${data.uniqueCode}.pdf`,
        content: attachments.passPdfBuffer,
        contentType: "application/pdf",
      });
    }
    if (attachments?.passIcsBuffer && attachments.passIcsBuffer.length > 0) {
      icalEvent = {
        filename: "event-invite.ics",
        method: "REQUEST",
        content: attachments.passIcsBuffer.toString("utf-8"),
      };
    }

    const renderCtx = buildSequenceRenderContext({
      firstName: data.firstName,
      eventName: data.eventName,
      eventStartDate: data.eventStartDate,
      eventEndDate: data.eventEndDate,
      eventTime: data.eventTime,
      venue: data.venue,
      passUrl: data.passUrl,
      priorityPass: data.priorityPass,
    });
    const subject = getSequenceSubject(key, {
      firstName: data.firstName,
      eventName: data.eventName,
    });
    const customHtml = await getEmailTemplateOverride(key, data.eventId);
    const html = customHtml
      ? applyEmailTemplate(customHtml, {
          ...sequenceContextToVars(renderCtx),
          eventStartDate: data.eventStartDate,
          eventEndDate: data.eventEndDate,
          passUrl: data.passUrl,
        })
      : buildSequenceEmailHtml(key, renderCtx);

    await sendAppMail({
      to: data.to,
      toName: `${data.firstName} ${data.surname}`.trim(),
      replyTo: SMTP_REPLY_EMAIL,
      subject,
      text: buildSequenceEmailText(key, renderCtx),
      html,
      attachments: mailAttachments.length > 0 ? mailAttachments : undefined,
      icalEvent,
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

export { isMailConfigured as isSmtpConfigured };
