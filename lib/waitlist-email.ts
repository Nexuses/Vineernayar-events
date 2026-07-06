import { buildSequenceRenderContext } from "@/lib/email-sequence-template";
import type { RegistrationDoc } from "@/lib/models/Registration";
import { getEventByEventId } from "@/lib/models/Event";
import { getEventPassPath } from "@/lib/event-path";
import { getPublicSiteUrl } from "@/lib/site-url";
import { sendEnablexWhatsAppText } from "@/lib/enablex-whatsapp";

async function buildPassUrl(eventId: string, uniqueCode: string): Promise<string> {
  const base = getPublicSiteUrl();
  const event = await getEventByEventId(eventId);
  if (event) return `${base}${getEventPassPath(event, uniqueCode)}`;
  return `${base}/events/${eventId}/pass/${uniqueCode}`;
}

function buildWaitlistThankYouWhatsAppText(reg: RegistrationDoc, passUrl: string): string {
  const ctx = buildSequenceRenderContext({
    firstName: reg.firstName,
    eventName: reg.eventName,
    eventStartDate:
      reg.eventStartDate instanceof Date
        ? reg.eventStartDate.toISOString()
        : String(reg.eventStartDate),
    eventEndDate:
      reg.eventEndDate instanceof Date
        ? reg.eventEndDate.toISOString()
        : String(reg.eventEndDate),
    eventTime: reg.eventTime,
    venue: reg.venue,
    passUrl,
    priorityPass: reg.workedWithVineet === true,
  });

  return [
    `Hi ${ctx.firstName},`,
    "",
    `Thank you for registering for ${ctx.eventName}.`,
    "You are currently on the waitlist.",
    "We will notify you as soon as your seat is confirmed.",
    "",
    `Date: ${ctx.eventDateLong}`,
    `Time: ${ctx.eventTime}`,
    `Location: ${ctx.eventLocationFull}`,
    "",
    "Team HFMS",
  ].join("\n");
}

export async function sendWaitlistThankYouWhatsApp(reg: RegistrationDoc): Promise<{
  ok: boolean;
  error?: string;
}> {
  const number = reg.whatsappNumber || reg.mobileNumber || "";
  if (!number.trim()) return { ok: false, error: "No WhatsApp number on registration" };

  const passUrl = await buildPassUrl(reg.eventId, reg.uniqueCode);
  const text = buildWaitlistThankYouWhatsAppText(reg, passUrl);

  return sendEnablexWhatsAppText({ to: number, message: text.slice(0, 3900) });
}
