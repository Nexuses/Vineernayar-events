import { BRAND_LOGO_URL } from "@/lib/constants";
import { EVENT_TIMEZONE, formatEventDate, getEventTimeDisplay } from "@/lib/date-utils";
import { MARKETING_SITE_URL } from "@/lib/marketing-site";
import {
  buildAttendanceConfirmUrls,
  buildAttendanceRsvpFooterHtml,
  buildAttendanceRsvpFooterText,
  isAttendanceRsvpSequenceKey,
} from "@/lib/attendance-rsvp";
import { getBannerHighlightLabel } from "@/lib/banner-label";
import type { EmailSequenceKey } from "@/lib/email-sequence";
import { getSequenceContent, type SequenceRenderContext } from "@/lib/email-sequence";

const PRE_ORDER_URL =
  process.env.PRE_ORDER_URL?.trim() || `${MARKETING_SITE_URL}/book`;

const EMAIL_LOGO = process.env.EMAIL_LOGO_URL || BRAND_LOGO_URL;
const CTA_BLUE = "#1d4ed8";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c);
}

function capitalizeFirst(s: string): string {
  const text = String(s || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function formatEventDateDetail(d: Date | string): string {
  if (!d) return "—";
  try {
    const date = new Date(d);
    const dayMonthYear = date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: EVENT_TIMEZONE,
    });
    const weekday = date.toLocaleDateString("en-IN", {
      weekday: "long",
      timeZone: EVENT_TIMEZONE,
    });
    return `${dayMonthYear}, ${weekday}`;
  } catch {
    return "—";
  }
}

function getCalendarChip(d: Date | string): { month: string; day: string; weekday: string } {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) {
    return { month: "—", day: "—", weekday: "—" };
  }
  return {
    month: date
      .toLocaleDateString("en-US", { month: "short", timeZone: EVENT_TIMEZONE })
      .toUpperCase(),
    day: date.toLocaleDateString("en-IN", { day: "numeric", timeZone: EVENT_TIMEZONE }),
    weekday: date.toLocaleDateString("en-IN", { weekday: "long", timeZone: EVENT_TIMEZONE }),
  };
}

function getEventPageUrl(passUrl: string): string {
  return passUrl.replace(/\/pass\/[^/]+$/, "");
}

export function buildSequenceRenderContext(data: {
  firstName: string;
  eventName: string;
  eventStartDate: string;
  eventEndDate?: string;
  eventTime?: string;
  venue: string;
  passUrl: string;
  priorityPass?: boolean;
  uniqueCode?: string;
}): SequenceRenderContext {
  const eventTime = getEventTimeDisplay({
    eventStartDate: data.eventStartDate,
    eventEndDate: data.eventEndDate,
    eventTime: data.eventTime,
  });

  const venue = data.venue?.trim() || "—";
  const confirmUrls = data.uniqueCode
    ? buildAttendanceConfirmUrls(data.passUrl, data.uniqueCode)
    : {};

  return {
    firstName: capitalizeFirst(data.firstName),
    eventName: data.eventName.trim(),
    eventDateDetail: formatEventDateDetail(data.eventStartDate),
    eventDateLong: formatEventDate(data.eventStartDate),
    eventTime,
    venue,
    eventCity: getBannerHighlightLabel(venue, data.eventName) || venue,
    eventLocationFull: venue,
    eventPageUrl: getEventPageUrl(data.passUrl),
    preOrderUrl: PRE_ORDER_URL,
    websiteUrl: MARKETING_SITE_URL,
    calendar: getCalendarChip(data.eventStartDate),
    isPriorityPass: data.priorityPass === true,
    ...confirmUrls,
  };
}

function buildParagraphHtml(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#111111;">${escapeHtml(text)}</p>`;
}

function buildRichParagraphHtml(html: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#111111;">${html}</p>`;
}

function buildEventSummaryHtml(ctx: SequenceRenderContext): string {
  const chip = ctx.calendar;
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 8px;">
      <tr>
        <td width="52" valign="top" style="padding:0 14px 16px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:48px;border:1px solid #d4d4d8;border-radius:6px;overflow:hidden;text-align:center;">
            <tr>
              <td style="padding:4px 0;background:#f4f4f5;font-size:10px;font-weight:700;letter-spacing:0.04em;color:#52525b;text-transform:uppercase;">
                ${escapeHtml(chip.month)}
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0 8px;font-size:22px;font-weight:700;line-height:1;color:#111111;">
                ${escapeHtml(chip.day)}
              </td>
            </tr>
          </table>
        </td>
        <td valign="middle" style="padding:0 0 16px;">
          <p style="margin:0 0 4px;font-size:16px;font-weight:700;line-height:1.35;color:#111111;">
            ${escapeHtml(ctx.eventDateLong)}
          </p>
          <p style="margin:0;font-size:15px;line-height:1.5;color:#52525b;">
            ${escapeHtml(ctx.eventTime)}
          </p>
        </td>
      </tr>
      <tr>
        <td width="52" valign="top" style="padding:0 14px 0 0;">
          <div style="width:40px;height:40px;border-radius:10px;background:#f4f4f5;text-align:center;line-height:40px;font-size:18px;">
            &#128205;
          </div>
        </td>
        <td valign="middle">
          <p style="margin:0;font-size:16px;font-weight:700;line-height:1.45;color:#111111;">
            ${escapeHtml(ctx.venue)}
          </p>
        </td>
      </tr>
    </table>`;
}

function buildEventDetailsHtml(ctx: SequenceRenderContext): string {
  return `
    <p style="margin:0 0 10px;font-size:15px;font-weight:700;line-height:1.5;color:#111111;">Event Details:</p>
    <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#111111;">
      <strong>Date:</strong> ${escapeHtml(ctx.eventDateDetail)}
    </p>
    <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#111111;">
      <strong>Time:</strong> ${escapeHtml(ctx.eventTime)}
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#111111;">
      <strong>Venue:</strong> ${escapeHtml(ctx.venue)}
    </p>`;
}

function buildPreOrderHtml(
  ctx: SequenceRenderContext,
  variant: "default" | "tomorrow",
  asCard = false
): string {
  const lead =
    variant === "tomorrow"
      ? "If you have not already, get your copy of Humans First, Machines Second and have it signed by Vineet Nayar tomorrow at the event."
      : "Get your copy of Humans First, Machines Second and have it signed by Vineet Nayar at the event.";

  const link = `<a href="${escapeHtml(ctx.preOrderUrl)}" style="color:${CTA_BLUE};text-decoration:underline;word-break:break-all;">${escapeHtml(ctx.preOrderUrl)}</a>`;

  if (!asCard) {
    return buildRichParagraphHtml(`${escapeHtml(lead)} Pre-order here: ${link}`);
  }

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;">
      <tr>
        <td style="background-color:#F4EA30;border:1px solid #e0d52b;border-radius:12px;padding:18px 20px;">
          <p style="margin:0;padding:0;font-size:15px;line-height:1.65;color:#111111;">${escapeHtml(lead)}</p>
          <p style="margin:12px 0 0;padding:0;font-size:15px;line-height:1.65;color:#111111;">
            Pre-order here: ${link}
          </p>
        </td>
      </tr>
    </table>`;
}

function buildCtaHtml(label: string, href: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 0;">
      <tr>
        <td style="border-radius:6px;background:${CTA_BLUE};">
          <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

const EMAIL_ICON_STROKE = "#18181b";

const EMAIL_CLOCK_ICON_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${EMAIL_ICON_STROKE}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;

const EMAIL_MAP_PIN_ICON_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${EMAIL_ICON_STROKE}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`;

function buildEventDetailIconCell(iconSvg: string, isLast = false): string {
  const paddingBottom = isLast ? "0" : "14px";
  return `
        <td width="60" valign="top" style="padding:0 12px ${paddingBottom} 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td align="center" valign="middle" style="width:48px;height:48px;border-radius:999px;background:#f3e31d;line-height:0;">
                ${iconSvg}
              </td>
            </tr>
          </table>
        </td>`;
}

function buildEventDetailRow(label: string, value: string, iconSvg: string, isLast = false): string {
  const paddingBottom = isLast ? "0" : "14px";
  return `
      <tr>
        ${buildEventDetailIconCell(iconSvg, isLast)}
        <td valign="middle" style="padding:0 0 ${paddingBottom};">
          <p style="margin:0 0 3px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;">${escapeHtml(label)}</p>
          <p style="margin:0;font-size:15px;font-weight:600;line-height:1.5;color:#111111;">${escapeHtml(value)}</p>
        </td>
      </tr>`;
}

function buildSeq1EventDetailsCardHtml(ctx: SequenceRenderContext): string {
  const chip = ctx.calendar;
  const dateRow = `
      <tr>
        <td width="52" valign="top" style="padding:0 12px 14px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:48px;border:1px solid #e0d52b;border-radius:8px;overflow:hidden;text-align:center;background:#ffffff;">
            <tr>
              <td style="padding:4px 0;background:#f8e828;font-size:10px;font-weight:700;letter-spacing:0.04em;color:#3f3f46;text-transform:uppercase;">
                ${escapeHtml(chip.month)}
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0 8px;font-size:22px;font-weight:700;line-height:1;color:#111111;">
                ${escapeHtml(chip.day)}
              </td>
            </tr>
          </table>
        </td>
        <td valign="middle" style="padding:0 0 14px;">
          <p style="margin:0 0 3px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;">Date</p>
          <p style="margin:0;font-size:15px;font-weight:600;line-height:1.45;color:#111111;">${escapeHtml(ctx.eventDateLong)}</p>
          <p style="margin:4px 0 0;font-size:13px;line-height:1.4;color:#52525b;">${escapeHtml(chip.weekday)}</p>
        </td>
      </tr>`;

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0 24px;">
      <tr>
        <td style="background-color:#fffef5;border:2px solid #f8e828;border-radius:14px;padding:20px 22px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 16px;">
            <tr>
              <td valign="middle" style="padding:0;">
                <p style="margin:0;font-size:13px;font-weight:700;line-height:1.3;letter-spacing:0.08em;text-transform:uppercase;color:#9a9100;">Event Details</p>
              </td>
              <td align="right" valign="middle" style="padding:0;">
                <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#f8e828;border:1px solid #e0d52b;font-size:11px;font-weight:700;letter-spacing:0.04em;color:#3f3f46;text-transform:uppercase;">Confirmed</span>
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            ${dateRow}
            ${buildEventDetailRow("Time", ctx.eventTime, EMAIL_CLOCK_ICON_SVG)}
            ${buildEventDetailRow("Location", ctx.eventLocationFull, EMAIL_MAP_PIN_ICON_SVG, true)}
          </table>
        </td>
      </tr>
    </table>`;
}

function buildSeq1DetailsSplitHtml(ctx: SequenceRenderContext): string {
  return buildSeq1EventDetailsCardHtml(ctx);
}

export function buildSequenceEmailHtml(
  key: EmailSequenceKey,
  ctx: SequenceRenderContext
): string {
  const content = getSequenceContent(key, ctx);
  const title = escapeHtml(content.headerTitle);
  const subtitle = content.headerSubtitle
    ? `<p style="margin:0 0 8px;font-size:15px;line-height:1.5;color:#6b7280;">${escapeHtml(content.headerSubtitle)}</p>`
    : "";

  const summaryBlock = content.showEventSummary ? buildEventSummaryHtml(ctx) : "";
  const divider = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;"><tr><td style="border-top:1px solid #e5e7eb;font-size:0;line-height:0;">&nbsp;</td></tr></table>`;

  const bodyParagraphs = content.paragraphs
    .map((p) => buildParagraphHtml(p))
    .join("");

  const questionBlock = content.humanQuestion
    ? buildParagraphHtml(content.humanQuestion)
    : "";

  const eventDetails = content.showEventDetails ? buildEventDetailsHtml(ctx) : "";
  const usePreOrderCard = key === "seq1" || key === "seq2" || key === "seq3";
  const preOrder =
    content.preOrderVariant === "default"
      ? buildPreOrderHtml(ctx, "default", usePreOrderCard)
      : content.preOrderVariant === "tomorrow"
        ? buildPreOrderHtml(ctx, "tomorrow", usePreOrderCard)
        : "";

  const cta = content.cta ? buildCtaHtml(content.cta.label, content.cta.href) : "";
  const rsvpFooter = isAttendanceRsvpSequenceKey(key)
    ? buildAttendanceRsvpFooterHtml(ctx)
    : "";

  const signOff = `
    <p style="margin:0 0 4px;font-size:15px;line-height:1.6;color:#111111;">${escapeHtml(content.signOffLine)}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#111111;font-weight:600;">${escapeHtml(content.signOffTeam)}</p>`;

  const seq1SignOff = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#111111;">${escapeHtml(content.signOffLine)}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#111111;">See you there!</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#111111;font-weight:600;">${escapeHtml(content.signOffTeam)}</p>`;

  if (key === "seq1") {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Roboto,Segoe UI,Helvetica,Arial,sans-serif;color:#111111;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding:28px 16px 40px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;">
          <tr>
            <td style="padding:0 0 24px;">
              <img src="${escapeHtml(EMAIL_LOGO)}" alt="Humans First" width="160" style="display:block;width:160px;max-width:160px;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#111111;">${escapeHtml(content.greeting)}</p>
              ${bodyParagraphs}
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#111111;">
                <a href="${escapeHtml(ctx.preOrderUrl)}" style="color:${CTA_BLUE};text-decoration:underline;">Pre-order Now</a>
              </p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#111111;font-weight:700;">${escapeHtml(content.humanQuestion ?? "")}</p>
              ${buildSeq1DetailsSplitHtml(ctx)}
              ${seq1SignOff}
              ${cta}
              ${rsvpFooter}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111111;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding:28px 16px 40px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;">
          <tr>
            <td style="padding:0 0 24px;">
              <img src="${escapeHtml(EMAIL_LOGO)}" alt="Humans First" width="160" style="display:block;width:160px;max-width:160px;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0;">
              ${subtitle}
              <h1 style="margin:0 0 20px;font-size:28px;line-height:1.2;font-weight:700;color:#111111;">
                ${title}
              </h1>
              ${content.showEventSummary ? `${divider}${summaryBlock}${divider}` : ""}
              <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#111111;">${escapeHtml(content.greeting)}</p>
              ${bodyParagraphs}
              ${questionBlock}
              ${eventDetails}
              ${preOrder}
              ${signOff}
              ${cta}
              ${rsvpFooter}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildSequenceEmailText(
  key: EmailSequenceKey,
  ctx: SequenceRenderContext
): string {
  const content = getSequenceContent(key, ctx);
  const lines: string[] = [];

  if (content.headerSubtitle) lines.push(content.headerSubtitle);
  lines.push(content.headerTitle, "");
  lines.push(content.greeting, "");
  lines.push(...content.paragraphs, "");
  if (content.humanQuestion) lines.push(content.humanQuestion, "");
  if (key === "seq1") {
    lines.push(
      "Event Details:",
      `Date: ${ctx.eventDateLong}`,
      `Time: ${ctx.eventTime}`,
      `Location: ${ctx.eventLocationFull}`,
      ""
    );
  } else if (content.showEventDetails) {
    lines.push(
      "Event Details:",
      `Date: ${ctx.eventDateDetail}`,
      `Time: ${ctx.eventTime}`,
      `Venue: ${ctx.venue}`,
      ""
    );
  }
  if (content.preOrderVariant) {
    lines.push(
      content.preOrderVariant === "tomorrow"
        ? "If you have not already, get your copy of Humans First, Machines Second and have it signed by Vineet Nayar tomorrow at the event."
        : "Get your copy of Humans First, Machines Second and have it signed by Vineet Nayar at the event.",
      `Pre-order here: ${ctx.preOrderUrl}`,
      ""
    );
  }
  if (key === "seq1") {
    lines.push(`Pre-order Now: ${ctx.preOrderUrl}`, "");
  }
  if (key === "seq1") {
    lines.push(content.signOffLine, "See you there!", content.signOffTeam);
  } else {
    lines.push(content.signOffLine, content.signOffTeam);
  }
  if (content.cta) lines.push("", `${content.cta.label}: ${content.cta.href}`);
  if (isAttendanceRsvpSequenceKey(key)) {
    const rsvpText = buildAttendanceRsvpFooterText(ctx);
    if (rsvpText) lines.push(rsvpText);
  }
  return lines.join("\n");
}
