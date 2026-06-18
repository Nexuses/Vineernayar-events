import nodemailer from "nodemailer";
import { formatEventDate, formatRegisteredDate, getEventTimeDisplay } from "@/lib/date-utils";
import { generatePassCardImage, PASS_CARD_WIDTH_PX } from "@/lib/pass-card-image";
import {
  getSequenceSubject,
  getSequenceTextParagraphs,
  type EmailSequenceKey,
} from "@/lib/email-sequence";
import { BRAND_COLOR, BRAND_LOGO_URL, BRAND_NAME } from "@/lib/constants";

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

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c);
}

function capitalizeFirst(s: string): string {
  const text = String(s || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export type PassEmailData = {
  to: string;
  firstName: string;
  surname: string;
  mobileNumber: string;
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
  /** QR code PNG buffer — used only if pass image generation fails */
  qrBuffer?: Buffer;
  /** Full event pass PDF (same as download) */
  passPdfBuffer?: Buffer;
  /** Optional .ics file buffer for calendar invite */
  passIcsBuffer?: Buffer;
};

function buildGreetingHtml(firstName: string): string {
  const name = escapeHtml(capitalizeFirst(firstName));
  return `<p style="margin:0 0 20px 0;font-size:16px;line-height:1.6;color:#18181b;">Hi ${name},</p>`;
}

function buildSequenceBodyHtml(paragraphs: string[]): string {
  return paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#18181b;">${escapeHtml(p)}</p>`
    )
    .join("");
}

function getSequenceBodyHtml(data: PassEmailData, key: EmailSequenceKey): string {
  const paragraphs = getSequenceTextParagraphs(key, {
    firstName: data.firstName,
    eventName: data.eventName,
  });
  return buildGreetingHtml(data.firstName) + buildSequenceBodyHtml(paragraphs);
}

function getSequenceGreetingText(firstName: string): string {
  return `Hi ${capitalizeFirst(firstName)},`;
}

function wrapEmailShell(innerHtml: string, title = "Event communication"): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f5;color:#18181b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="${PASS_CARD_WIDTH_PX}" cellpadding="0" cellspacing="0" style="max-width:${PASS_CARD_WIDTH_PX}px;width:100%;">
          ${innerHtml}
        </table>
        <p style="margin:24px 0 0 0;font-size:12px;color:#a1a1aa;">&copy; ${BRAND_NAME}. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function getEmailHtml(data: PassEmailData, opts: { usePassImage: boolean }): string {
  const seqKey = data.sequenceKey ?? "seq1";
  const sequenceHtml = getSequenceBodyHtml(data, seqKey);

  if (opts.usePassImage) {
    return wrapEmailShell(
      `
          <tr>
            <td style="padding-top:8px;text-align:left;">
              ${sequenceHtml}
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;">
              <img src="cid:passcard" alt="Your event pass" width="${PASS_CARD_WIDTH_PX}" style="display:block;max-width:100%;width:100%;height:auto;border:0;border-radius:16px;" />
            </td>
          </tr>`,
      "Your Event Pass"
    );
  }

  const firstName = capitalizeFirst(data.firstName);
  const surname = capitalizeFirst(data.surname);
  const safeName = escapeHtml(`${firstName} ${surname}`);
  const safeEvent = escapeHtml(data.eventName);
  const safeMobile = escapeHtml(data.mobileNumber || "—");
  const safeEmail = escapeHtml(data.email);
  const safeVenue = escapeHtml(data.venue || "—");
  const safeCode = escapeHtml(data.uniqueCode);
  const eventDate = escapeHtml(formatEventDate(data.eventStartDate));
  const eventTime = escapeHtml(getEventTimeDisplay(data));
  const registeredDate = escapeHtml(formatRegisteredDate(data.createdAt));

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Event Pass</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f5;color:#18181b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="${PASS_CARD_WIDTH_PX}" cellpadding="0" cellspacing="0" style="max-width:${PASS_CARD_WIDTH_PX}px;width:100%;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background-color:${BRAND_COLOR};padding:10px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#18181b;">Event Pass</td>
                  <td align="right" style="font-family:ui-monospace,monospace;font-size:11px;font-weight:700;color:#27272a;">${safeCode}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="top" style="padding-right:12px;">
                    <img src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" width="220" style="display:block;height:56px;width:auto;max-width:220px;object-fit:contain;" />
                    <p style="margin:8px 0 2px 0;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#71717a;">Welcome</p>
                    <h1 style="margin:0 0 6px 0;font-size:20px;font-weight:700;line-height:1.25;color:#18181b;">${safeName}</h1>
                    <p style="margin:0 0 4px 0;font-size:14px;color:#3f3f46;">${safeMobile}</p>
                    <p style="margin:0;font-size:14px;color:#52525b;">${safeEmail}</p>
                  </td>
                  <td valign="top" align="right" width="124">
                    <div style="border:2px solid ${BRAND_COLOR};border-radius:8px;padding:4px;display:inline-block;background:#ffffff;">
                      <img src="cid:qrcode" alt="QR Code" width="112" height="112" style="display:block;" />
                    </div>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;background-color:#fefce8;border:1px solid #ebe08d;border-radius:12px;">
                <tr>
                  <td style="padding:12px;">
                    <h2 style="margin:0 0 10px 0;font-size:16px;font-weight:700;line-height:1.35;color:#18181b;">${safeEvent}</h2>
                    <p style="margin:0 0 8px 0;font-size:14px;line-height:1.4;color:#18181b;">&#128197;&nbsp;&nbsp;${eventDate}</p>
                    <p style="margin:0 0 8px 0;font-size:14px;line-height:1.4;color:#18181b;">&#128336;&nbsp;&nbsp;${eventTime}</p>
                    <p style="margin:0;font-size:14px;line-height:1.4;color:#18181b;">&#128205;&nbsp;&nbsp;${safeVenue}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #f4f4f5;background-color:#fafafa;padding:8px 16px;font-size:11px;color:#71717a;">
              Registered ${registeredDate}
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0 0;font-size:12px;color:#a1a1aa;">&copy; ${BRAND_NAME}. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function getEmailText(data: PassEmailData): string {
  const eventDate = formatEventDate(data.eventStartDate);
  const eventTime = getEventTimeDisplay(data);
  const registeredDate = formatRegisteredDate(data.createdAt);
  const seqKey = data.sequenceKey ?? "seq1";
  const sequenceText = getSequenceTextParagraphs(seqKey, {
    firstName: data.firstName,
    eventName: data.eventName,
  }).join("\n\n");

  return `${getSequenceGreetingText(data.firstName)}

${sequenceText}

---

${BRAND_NAME.toUpperCase()}

${data.firstName} ${data.surname}
Pass Code: ${data.uniqueCode}

${data.eventName}
Date: ${eventDate}
Time: ${eventTime}
Venue: ${data.venue || "—"}
Registered: ${registeredDate}

---
© ${BRAND_NAME}. All rights reserved.`;
}

function getSequenceOnlyText(data: PassEmailData, key: EmailSequenceKey): string {
  const paragraphs = getSequenceTextParagraphs(key, {
    firstName: data.firstName,
    eventName: data.eventName,
  });
  return `${getSequenceGreetingText(data.firstName)}\n\n${paragraphs.join("\n\n")}\n\n---\n© ${BRAND_NAME}. All rights reserved.`;
}

export async function sendPassEmail(data: PassEmailData): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("Email not configured: missing SMTP_HOST, EMAIL_USER or EMAIL_APP_PASSWORD");
    return false;
  }
  try {
    const attachments: nodemailer.SendMailOptions["attachments"] = [];
    let icalEvent: nodemailer.SendMailOptions["icalEvent"];

    let passImageBuffer: Buffer | undefined;
    try {
      passImageBuffer = await generatePassCardImage({
        firstName: data.firstName,
        surname: data.surname,
        email: data.email,
        mobileNumber: data.mobileNumber,
        eventName: data.eventName,
        eventStartDate: data.eventStartDate,
        eventEndDate: data.eventEndDate,
        eventTime: data.eventTime,
        venue: data.venue,
        uniqueCode: data.uniqueCode,
        createdAt: data.createdAt,
      });
    } catch (err) {
      console.error("Pass image generation for email failed:", err);
    }

    if (passImageBuffer && passImageBuffer.length > 0) {
      attachments.push({
        filename: "event-pass.png",
        content: passImageBuffer,
        cid: "passcard",
      });
    } else if (data.qrBuffer && data.qrBuffer.length > 0) {
      attachments.push({
        filename: "qrcode.png",
        content: data.qrBuffer,
        cid: "qrcode",
      });
    }

    if (data.passPdfBuffer && data.passPdfBuffer.length > 0) {
      attachments.push({
        filename: `event-pass-${data.uniqueCode}.pdf`,
        content: data.passPdfBuffer,
      });
    }
    if (data.passIcsBuffer && data.passIcsBuffer.length > 0) {
      icalEvent = {
        filename: "event-invite.ics",
        method: "REQUEST",
        content: data.passIcsBuffer.toString("utf-8"),
      };
    }
    const seqKey = data.sequenceKey ?? "seq1";
    const subject = getSequenceSubject(seqKey, {
      firstName: data.firstName,
      eventName: data.eventName,
    });

    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: data.to,
      subject,
      text: getEmailText(data),
      html: getEmailHtml(data, { usePassImage: !!passImageBuffer?.length }),
      attachments,
      ...(icalEvent ? { icalEvent } : {}),
    });
    return true;
  } catch (err) {
    console.error("Send pass email error:", err);
    return false;
  }
}

export async function sendSequenceEmail(
  data: PassEmailData,
  key: EmailSequenceKey
): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("Email not configured: missing SMTP_HOST, EMAIL_USER or EMAIL_APP_PASSWORD");
    return false;
  }
  try {
    const subject = getSequenceSubject(key, {
      firstName: data.firstName,
      eventName: data.eventName,
    });
    const bodyHtml = getSequenceBodyHtml(data, key);
    const html = wrapEmailShell(
      `<tr><td style="padding-top:8px;text-align:left;">${bodyHtml}</td></tr>`,
      subject
    );

    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: data.to,
      subject,
      text: getSequenceOnlyText(data, key),
      html,
    });
    return true;
  } catch (err) {
    console.error("Send sequence email error:", err);
    return false;
  }
}
