import nodemailer from "nodemailer";

/** Outbound SMTP relay — not the SendClean JSON API host. */
const SMTP_HOST = process.env.SMTP_HOST?.trim() || "smtp.sendclean.net";
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SENDCLEAN_SMTPUSER?.trim();
/** SMTP password from SendClean panel — not the API token (SENDCLEAN_TOKEN). */
const SMTP_PASS =
  process.env.SENDCLEAN_SMTP_PASSWORD?.trim() ||
  process.env.SENDCLEAN_SMTP_PASS?.trim() ||
  "";

export const SMTP_FROM_EMAIL =
  process.env.SMTP_FROM_EMAIL?.trim() || "contact@hfmsbook.com";
export const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME?.trim() || "HFMS Book";
export const SMTP_REPLY_EMAIL =
  process.env.SMTP_REPLY_EMAIL?.trim() || SMTP_FROM_EMAIL;

export function isSmtpConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS && SMTP_FROM_EMAIL);
}

export function getSmtpTransporter() {
  if (!isSmtpConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER!,
      pass: SMTP_PASS!,
    },
  });
}
