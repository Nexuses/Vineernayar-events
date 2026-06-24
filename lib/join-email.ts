import nodemailer from "nodemailer";
import { BRAND_LOGO_URL } from "@/lib/constants";
import { EVENT_TIMEZONE } from "@/lib/date-utils";
import { JOIN_NOTIFY_HTML, JOIN_THANK_YOU_HTML } from "@/lib/join-email-templates";
import { getEmailTemplateOverride } from "@/lib/models/EmailTemplate";
import { MARKETING_SITE_URL } from "@/lib/marketing-site";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_APP_PASSWORD;
const FROM_EMAIL =
  process.env.SMTP_FROM_EMAIL || process.env.FROM_EMAIL || "noreply@example.com";
const FROM_NAME = process.env.SMTP_FROM_NAME || "Humans First";
const LOGO_URL = process.env.EMAIL_LOGO_URL || BRAND_LOGO_URL;

function getSiteUrl(): string {
  const raw =
    process.env.SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (!raw) return "http://localhost:3000";

  if (/^https:\/\/localhost/i.test(raw) || /^https:\/\/127\.0\.0\.1/i.test(raw)) {
    return raw.replace(/^https:/i, "http:");
  }

  return raw;
}

function getNavLogoUrl(): string {
  if (process.env.EMAIL_NAV_LOGO_URL) {
    return process.env.EMAIL_NAV_LOGO_URL;
  }

  const siteUrl = getSiteUrl();
  const localAsset = `${siteUrl}/assets/figma/logo.png`;

  if (/localhost|127\.0\.0\.1/i.test(siteUrl)) {
    return process.env.EMAIL_LOGO_URL || localAsset;
  }

  return localAsset;
}

function getJoinTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

function getNotifyRecipients(): string[] {
  const raw = process.env.JOIN_NOTIFY_EMAIL || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

function formatSubmittedAt(date = new Date()): string {
  return date.toLocaleString("en-IN", {
    timeZone: EVENT_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export type JoinEmailPayload = {
  name: string;
  email: string;
  city: string;
};

export function isJoinEmailConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

export async function sendJoinEmails(
  payload: JoinEmailPayload
): Promise<{ ok: boolean; error?: string }> {
  const transporter = getJoinTransporter();
  if (!transporter) {
    return {
      ok: false,
      error: "Email is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.",
    };
  }

  const submittedAt = formatSubmittedAt();
  const templateVars = {
    name: payload.name,
    email: payload.email,
    city: payload.city,
    logoUrl: LOGO_URL,
    navLogoUrl: getNavLogoUrl(),
    homeUrl: MARKETING_SITE_URL,
    bookUrl: `${MARKETING_SITE_URL}/book`,
    citiesUrl: `${MARKETING_SITE_URL}/#cities-cards`,
    watchUrl: `${MARKETING_SITE_URL}/#mosaic`,
    wallUrl: `${MARKETING_SITE_URL}/#wall`,
    submittedAt,
  };

  const thankYouHtml = renderTemplate(
    (await getEmailTemplateOverride("join_thank_you")) || JOIN_THANK_YOU_HTML,
    templateVars
  );
  const notifyHtml = renderTemplate(
    (await getEmailTemplateOverride("join_notify")) || JOIN_NOTIFY_HTML,
    templateVars
  );

  const thankYouText = `Hi ${payload.name},

Thank you for joining the Humans First movement.

Your seat is reserved for: ${payload.city}

We will send venue details, timings, and next steps closer to the date.

Warm regards,
Vineet Nayar Team
Humans First Machine Second`;

  const notifyText = `New seat reservation

Name: ${payload.name}
Email: ${payload.email}
City: ${payload.city}
Submitted: ${submittedAt}`;

  try {
    const thankYouMail = transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: payload.email,
      replyTo: FROM_EMAIL,
      subject: `Thank you — your seat is reserved | Humans First`,
      text: thankYouText,
      html: thankYouHtml,
    });

    const notifyTo = getNotifyRecipients();
    const notifyMail =
      notifyTo.length > 0
        ? transporter.sendMail({
            from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
            to: notifyTo.join(", "),
            replyTo: payload.email,
            subject: `New seat reservation — ${payload.name} (${payload.city})`,
            text: notifyText,
            html: notifyHtml,
          })
        : Promise.resolve();

    if (notifyTo.length === 0) {
      console.warn("JOIN_NOTIFY_EMAIL is not set; admin notification skipped.");
    }

    await Promise.all([thankYouMail, notifyMail]);

    return { ok: true };
  } catch (err) {
    console.error("Join email send error:", err);
    return {
      ok: false,
      error: "Unable to send confirmation email. Please try again.",
    };
  }
}
