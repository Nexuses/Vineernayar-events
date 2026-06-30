import "server-only";

import { isMailConfigured, sendAppMail } from "@/lib/mail";
import type { RegistrationDoc } from "@/lib/models/Registration";
import {
  applyBlastTemplate,
  EMAIL_BLAST_DEFAULT_HTML,
  EMAIL_BLAST_PLACEHOLDERS,
  getSampleBlastVars,
} from "@/lib/email-blast-template";

export {
  applyBlastTemplate,
  EMAIL_BLAST_DEFAULT_HTML,
  EMAIL_BLAST_PLACEHOLDERS,
  getSampleBlastVars,
};

export function buildBlastVars(reg: RegistrationDoc): Record<string, string> {
  return {
    firstName: reg.firstName,
    surname: reg.surname,
    fullName: `${reg.firstName} ${reg.surname}`.trim(),
    email: reg.email,
    eventName: reg.eventName,
    uniqueCode: reg.uniqueCode,
    venue: reg.venue || "",
    organization: reg.organization || "",
    designation: reg.designation || "",
    mobileNumber: reg.mobileNumber || "",
  };
}

export async function sendBlastEmail(input: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!isMailConfigured()) {
    throw new Error("Email is not configured");
  }
  await sendAppMail({
    to: input.to,
    toName: input.toName,
    subject: input.subject,
    html: input.html,
  });
}
