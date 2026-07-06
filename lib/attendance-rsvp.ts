import type { EmailSequenceKey } from "@/lib/email-sequence";
import type { SequenceRenderContext } from "@/lib/email-sequence";
import { toAbsolutePublicUrl } from "@/lib/site-url";

export type AttendanceRsvpStatus = "pending" | "reconfirmed" | "declined";
export type AttendanceRsvpIntent = "attending" | "declined";

const RSVP_SEQUENCE_KEYS = new Set<EmailSequenceKey>(["seq1", "seq2"]);
const RSVP_BUTTON_BG = "#F4EA30";
const RSVP_BUTTON_TEXT = "#111111";

export function buildAttendanceConfirmUrls(
  passUrl: string,
  uniqueCode: string
): { confirmAttendingUrl: string; confirmDeclinedUrl: string } {
  const absolutePassUrl = toAbsolutePublicUrl(passUrl);
  const eventBase = absolutePassUrl.replace(/\/pass\/[^/]+\/?$/, "");
  const attendingParams = new URLSearchParams({ code: uniqueCode, intent: "attending" });
  const declinedParams = new URLSearchParams({ code: uniqueCode, intent: "declined" });
  return {
    confirmAttendingUrl: `${eventBase}/confirm-attendance?${attendingParams.toString()}`,
    confirmDeclinedUrl: `${eventBase}/confirm-attendance?${declinedParams.toString()}`,
  };
}

export function isAttendanceRsvpSequenceKey(key: EmailSequenceKey): boolean {
  return RSVP_SEQUENCE_KEYS.has(key);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c);
}

function getAttendanceRsvpIntroText(key: EmailSequenceKey): string {
  if (key === "seq1") {
    return "As seats are limited, we would appreciate it if you could let us know if your plans change and you're unable to attend.";
  }
  if (key === "seq2") {
    return "If your plans change and you're unable to attend, we'd appreciate it if you could let us know so we can offer your place to another guest.";
  }
  return "We are looking forward to seeing you. Please confirm so we can keep your seat reserved.";
}

export function buildAttendanceRsvpFooterHtml(
  key: EmailSequenceKey,
  ctx: SequenceRenderContext
): string {
  const attendingUrl = ctx.confirmAttendingUrl ?? "";
  const declinedUrl = ctx.confirmDeclinedUrl ?? "";
  if (!attendingUrl || !declinedUrl) return "";

  const intro = getAttendanceRsvpIntroText(key);
  const sectionStyle =
    key === "seq1"
      ? "margin:20px 0 0;"
      : "margin:24px 0 0;border-top:1px solid #e5e7eb;padding-top:24px;";

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="${sectionStyle}">
      <tr>
        <td>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#111111;">
            ${escapeHtml(intro)}
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="padding:0 12px 8px 0;">
                <a href="${escapeHtml(attendingUrl)}" style="display:inline-block;padding:12px 18px;border-radius:6px;background:${RSVP_BUTTON_BG};color:${RSVP_BUTTON_TEXT};font-size:14px;font-weight:700;text-decoration:none;">
                  Yes, I am attending
                </a>
              </td>
              <td style="padding:0 0 8px;">
                <a href="${escapeHtml(declinedUrl)}" style="display:inline-block;padding:12px 18px;border-radius:6px;background:${RSVP_BUTTON_BG};color:${RSVP_BUTTON_TEXT};font-size:14px;font-weight:700;text-decoration:none;">
                  I can no longer attend
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

export function buildAttendanceRsvpFooterText(key: EmailSequenceKey, ctx: SequenceRenderContext): string {
  const attendingUrl = ctx.confirmAttendingUrl ?? "";
  const declinedUrl = ctx.confirmDeclinedUrl ?? "";
  if (!attendingUrl || !declinedUrl) return "";

  return [
    "",
    getAttendanceRsvpIntroText(key),
    `Yes, I am attending: ${attendingUrl}`,
    `I can no longer attend: ${declinedUrl}`,
  ].join("\n");
}

export function appendAttendanceRsvpToEmailHtml(
  html: string,
  key: EmailSequenceKey,
  ctx: SequenceRenderContext
): string {
  if (!isAttendanceRsvpSequenceKey(key)) return html;
  const footer = buildAttendanceRsvpFooterHtml(key, ctx);
  if (!footer) return html;
  if (html.includes("Yes, I am attending")) return html;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${footer}</body>`);
  }
  return `${html}${footer}`;
}

export function appendAttendanceRsvpToEmailText(
  text: string,
  key: EmailSequenceKey,
  ctx: SequenceRenderContext
): string {
  if (!isAttendanceRsvpSequenceKey(key)) return text;
  const footer = buildAttendanceRsvpFooterText(key, ctx);
  if (!footer || text.includes("Yes, I am attending:")) return text;
  return `${text}${footer}`;
}

export function attendanceRsvpLabel(status?: AttendanceRsvpStatus): string {
  if (status === "reconfirmed") return "Reconfirmed";
  if (status === "declined") return "Not Able to Attend";
  return "Pending";
}

export function attendanceRsvpBadgeClass(status?: AttendanceRsvpStatus): string {
  if (status === "reconfirmed") return "bg-emerald-100 text-emerald-800";
  if (status === "declined") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}
