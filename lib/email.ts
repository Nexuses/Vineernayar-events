import nodemailer from "nodemailer";
import { formatEventDateTime, resolveEventEndDate } from "@/lib/date-utils";
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

function formatRegisteredDate(d: string | Date): string {
  if (!d) return "—";
  return new Date(d).toISOString().replace("T", " ").slice(0, 19);
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
  venue: string;
  createdAt: string;
  passUrl: string;
  uniqueCode: string;
  /** QR code PNG buffer to embed in email */
  qrBuffer?: Buffer;
  /** Optional PDF buffer to attach as event pass (58mm × 40mm name tag) */
  passPdfBuffer?: Buffer;
  /** Optional .ics file buffer for calendar invite */
  passIcsBuffer?: Buffer;
};

function getEmailHtml(data: PassEmailData): string {
  const safeName = escapeHtml(`${data.firstName} ${data.surname}`);
  const safeEvent = escapeHtml(data.eventName);
  const safeMobile = escapeHtml(data.mobileNumber || "—");
  const safeEmail = escapeHtml(data.email);
  const safeVenue = escapeHtml(data.venue || "—");
  const startDate = formatEventDateTime(data.eventStartDate);
  const endDate = formatEventDateTime(
    resolveEventEndDate(data.eventStartDate, data.eventEndDate)
  );
  const registeredDate = formatRegisteredDate(data.createdAt);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Event Pass</title>
</head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; color: #18181b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Pass Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #18181b; overflow: hidden;">
          <tr>
            <td style="padding: 20px;">
              <!-- Top row: Logo + QR -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="top" style="width: 60%;">
                    <img src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" width="180" height="51" style="display: block; height: auto; max-height: 51px; width: auto; max-width: 180px;" />
                    <p style="margin: 16px 0 4px 0; font-size: 18px; font-weight: 700; color: #18181b;">Welcome,</p>
                    <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 700; color: #18181b;">${safeName}</h1>
                    <p style="margin: 0 0 2px 0; font-size: 16px; color: #18181b;">${safeMobile}</p>
                    <p style="margin: 0; font-size: 16px; color: #18181b;">${safeEmail}</p>
                  </td>
                  <td valign="middle" align="center" style="width: 40%;">
                    <div style="border: 2px solid ${BRAND_COLOR}; border-radius: 4px; padding: 4px; display: inline-block;">
                      <img src="cid:qrcode" alt="QR Code" width="140" height="140" style="display: block;" />
                    </div>
                    <p style="margin: 8px 0 0 0; font-family: ui-monospace, monospace; font-size: 14px; font-weight: 700; color: #18181b;">${data.uniqueCode}</p>
                  </td>
                </tr>
              </table>

              <!-- Event details -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #18181b;">${safeEvent}</h2>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 16px; color: #18181b;">
                      <tr>
                        <td style="padding: 6px 0; font-weight: 600; width: 100px;">Start Date</td>
                        <td style="padding: 6px 0;">${startDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-weight: 600; width: 100px;">End Date</td>
                        <td style="padding: 6px 0;">${endDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-weight: 600; width: 100px;">Venue</td>
                        <td style="padding: 6px 0;">${safeVenue}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Registered date -->
              <p style="margin: 24px 0 0 0; font-size: 14px; color: #18181b;">
                Registered Date – ${registeredDate}
              </p>
            </td>
          </tr>
        </table>

        <p style="margin: 24px 0 0 0; font-size: 12px; color: #a1a1aa;">
          &copy; ${BRAND_NAME}. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function getEmailText(data: PassEmailData): string {
  const startDate = formatEventDateTime(data.eventStartDate);
  const endDate = formatEventDateTime(
    resolveEventEndDate(data.eventStartDate, data.eventEndDate)
  );
  const registeredDate = formatRegisteredDate(data.createdAt);

  return `${BRAND_NAME.toUpperCase()}

Welcome,
${data.firstName} ${data.surname}

${data.mobileNumber || "—"}
${data.email}

Pass Code: ${data.uniqueCode}

---

${data.eventName}

Start Date: ${startDate}
End Date: ${endDate}
Venue: ${data.venue || "—"}

Registered Date: ${registeredDate}

---
© ${BRAND_NAME}. All rights reserved.`;
}

export async function sendPassEmail(data: PassEmailData): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("Email not configured: missing SMTP_HOST, EMAIL_USER or EMAIL_APP_PASSWORD");
    return false;
  }
  try {
    const attachments: nodemailer.SendMailOptions["attachments"] = [];
    
    // Embed QR code as inline image with CID
    if (data.qrBuffer && data.qrBuffer.length > 0) {
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
      attachments.push({
        filename: "event-invite.ics",
        content: data.passIcsBuffer,
        contentType: "text/calendar; method=PUBLISH",
      });
    }
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: data.to,
      subject: `Your event pass – ${data.eventName}`,
      text: getEmailText(data),
      html: getEmailHtml(data),
      attachments,
    });
    return true;
  } catch (err) {
    console.error("Send pass email error:", err);
    return false;
  }
}
