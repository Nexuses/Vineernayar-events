export const EMAIL_BLAST_PLACEHOLDERS = [
  "firstName",
  "surname",
  "fullName",
  "email",
  "eventName",
  "uniqueCode",
  "venue",
  "organization",
  "designation",
  "mobileNumber",
] as const;

export const EMAIL_BLAST_DEFAULT_HTML = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #18181b; line-height: 1.6;">
  <p>Dear {{firstName}},</p>
  <p>We have an update regarding <strong>{{eventName}}</strong>.</p>
  <p>Your registration code: <strong>{{uniqueCode}}</strong></p>
  <p>Best regards,<br/>HFMS Team</p>
</div>`;

export function getSampleBlastVars(): Record<string, string> {
  return {
    firstName: "Alex",
    surname: "Sample",
    fullName: "Alex Sample",
    email: "alex@example.com",
    eventName: "Sample Event",
    uniqueCode: "ABC123XYZ789",
    venue: "Mumbai",
    organization: "Sample Org",
    designation: "Manager",
    mobileNumber: "+91 98765 43210",
  };
}

export function applyBlastTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}
