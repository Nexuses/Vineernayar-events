import type { EventDoc } from "@/lib/models/Event";
import type { EmailBlastLogDoc } from "@/lib/models/EmailBlastLog";
import type { EligibleEmailDoc } from "@/lib/models/EligibleEmail";
import {
  getAdmissionStatus,
  isConfirmedRegistration,
  type RegistrationDoc,
} from "@/lib/models/Registration";
import { getRegistrationWindowStatus } from "@/lib/registration-window";

export type DashboardAnalytics = {
  events: {
    total: number;
    upcoming: number;
    past: number;
    published: number;
    registrationOpen: number;
    registrationOpenSoon: number;
    registrationClosed: number;
  };
  registrations: {
    total: number;
    confirmed: number;
    waitlisted: number;
    rejected: number;
    priority: number;
    nonPriority: number;
    attended: number;
    notAttended: number;
    checkInRate: number;
    whatsappOptIn: number;
    last7Days: number;
    last30Days: number;
  };
  eligible: {
    total: number;
    registeredFromEligible: number;
    conversionRate: number;
  };
  charts: {
    byEvent: { label: string; value: number }[];
    admissionStatus: { label: string; value: number }[];
    participation: { label: string; value: number }[];
    priority: { label: string; value: number }[];
    registrationTrend: { label: string; value: number }[];
    eventWindowStatus: { label: string; value: number }[];
  };
  eventRows: EventAnalyticsRow[];
};

export type EventAnalyticsRow = {
  eventId: string;
  eventName: string;
  eventDate: Date;
  venue: string;
  windowStatus: "open_soon" | "open" | "closed";
  registrationType: string;
  total: number;
  confirmed: number;
  waitlisted: number;
  rejected: number;
  attended: number;
  priority: number;
  seatLimit?: number;
  fillPct?: number;
  blastedCount: number;
};

export type EmailBlastStats = {
  campaignCount: number;
  totalSent: number;
  totalFailed: number;
  recipientsBlasted: number;
  recipientsNotBlasted: number;
  lastBlastAt: Date | null;
  recentBlasts: {
    eventName: string;
    audience: string;
    sent: number;
    failed: number;
    sentAt: Date;
    subject: string;
  }[];
};

function countByDay(registrations: RegistrationDoc[], days: number): { label: string; value: number }[] {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const reg of registrations) {
    const created = reg.createdAt instanceof Date ? reg.createdAt : new Date(reg.createdAt);
    const key = created.toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([iso, value]) => {
    const d = new Date(iso);
    const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    return { label, value };
  });
}

function regsInLastDays(registrations: RegistrationDoc[], days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return registrations.filter((r) => {
    const t = r.createdAt instanceof Date ? r.createdAt.getTime() : new Date(r.createdAt).getTime();
    return t >= cutoff;
  }).length;
}

const AUDIENCE_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  waitlisted: "Waitlisted",
  all: "All",
};

export function computeEmailBlastStats(
  registrations: RegistrationDoc[],
  logs: EmailBlastLogDoc[]
): EmailBlastStats {
  let recipientsBlasted = 0;
  for (const r of registrations) {
    if (r.lastEmailBlastAt) recipientsBlasted += 1;
  }

  let totalSent = 0;
  let totalFailed = 0;
  let lastBlastAt: Date | null = null;

  for (const log of logs) {
    totalSent += log.sent;
    totalFailed += log.failed;
    const sentAt = log.sentAt instanceof Date ? log.sentAt : new Date(log.sentAt);
    if (!lastBlastAt || sentAt > lastBlastAt) lastBlastAt = sentAt;
  }

  const recentBlasts = logs.slice(0, 5).map((log) => ({
    eventName: log.eventName,
    audience: AUDIENCE_LABELS[log.audience] ?? log.audience,
    sent: log.sent,
    failed: log.failed,
    sentAt: log.sentAt instanceof Date ? log.sentAt : new Date(log.sentAt),
    subject: log.subject,
  }));

  return {
    campaignCount: logs.length,
    totalSent,
    totalFailed,
    recipientsBlasted,
    recipientsNotBlasted: registrations.length - recipientsBlasted,
    lastBlastAt,
    recentBlasts,
  };
}

export function computeDashboardAnalytics(
  events: EventDoc[],
  registrations: RegistrationDoc[],
  eligibleClients: EligibleEmailDoc[]
): DashboardAnalytics {
  const now = new Date();

  let registrationOpen = 0;
  let registrationOpenSoon = 0;
  let registrationClosed = 0;
  for (const e of events) {
    const w = getRegistrationWindowStatus(e);
    if (w === "open") registrationOpen += 1;
    else if (w === "open_soon") registrationOpenSoon += 1;
    else registrationClosed += 1;
  }

  let confirmed = 0;
  let waitlisted = 0;
  let rejected = 0;
  let priority = 0;
  let attended = 0;
  let whatsappOptIn = 0;

  for (const r of registrations) {
    const admission = getAdmissionStatus(r);
    if (admission === "confirmed") confirmed += 1;
    else if (admission === "waitlisted") waitlisted += 1;
    else if (admission === "rejected") rejected += 1;

    if (r.workedWithVineet === true) priority += 1;
    if (r.participationStatus === "attended") attended += 1;
    if (r.addToWhatsapp) whatsappOptIn += 1;
  }

  const confirmedRegs = registrations.filter(isConfirmedRegistration);
  const notAttended = confirmedRegs.length - attended;
  const checkInRate =
    confirmedRegs.length === 0 ? 0 : Math.round((attended / confirmedRegs.length) * 100);

  const eligibleEmails = new Set(eligibleClients.map((e) => e.email.toLowerCase()));
  const registeredFromEligible = registrations.filter((r) =>
    eligibleEmails.has(r.email.toLowerCase())
  ).length;
  const conversionRate =
    eligibleClients.length === 0
      ? 0
      : Math.round((registeredFromEligible / eligibleClients.length) * 100);

  const byEventMap = new Map<string, number>();
  for (const r of registrations) {
    byEventMap.set(r.eventName, (byEventMap.get(r.eventName) ?? 0) + 1);
  }
  const byEvent = Array.from(byEventMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const admissionStatus = [
    { label: "Confirmed", value: confirmed },
    { label: "Waitlisted", value: waitlisted },
    { label: "Rejected", value: rejected },
  ].filter((d) => d.value > 0);

  const participation = [
    { label: "Attended", value: attended },
    { label: "Not checked in", value: Math.max(0, notAttended) },
  ].filter((d) => d.value > 0);

  const priorityChart = [
    { label: "Priority pass", value: priority },
    { label: "Standard", value: registrations.length - priority },
  ].filter((d) => d.value > 0);

  const eventWindowStatus = [
    { label: "Reg. open", value: registrationOpen },
    { label: "Opens soon", value: registrationOpenSoon },
    { label: "Reg. closed", value: registrationClosed },
  ].filter((d) => d.value > 0);

  const regsByEventId = new Map<string, RegistrationDoc[]>();
  for (const r of registrations) {
    const list = regsByEventId.get(r.eventId) ?? [];
    list.push(r);
    regsByEventId.set(r.eventId, list);
  }

  const eventRows: EventAnalyticsRow[] = events
    .map((event) => {
      const regs = regsByEventId.get(event.eventId) ?? [];
      let evConfirmed = 0;
      let evWaitlisted = 0;
      let evRejected = 0;
      let evAttended = 0;
      let evPriority = 0;
      let evBlasted = 0;
      for (const r of regs) {
        const a = getAdmissionStatus(r);
        if (a === "confirmed") evConfirmed += 1;
        else if (a === "waitlisted") evWaitlisted += 1;
        else if (a === "rejected") evRejected += 1;
        if (r.participationStatus === "attended") evAttended += 1;
        if (r.workedWithVineet === true) evPriority += 1;
        if (r.lastEmailBlastAt) evBlasted += 1;
      }
      const seatLimit =
        typeof event.seatLimit === "number" && event.seatLimit > 0 ? event.seatLimit : undefined;
      const fillPct =
        seatLimit && seatLimit > 0
          ? Math.min(100, Math.round((evConfirmed / seatLimit) * 100))
          : undefined;

      return {
        eventId: event.eventId,
        eventName: event.eventName,
        eventDate:
          event.eventStartDate instanceof Date
            ? event.eventStartDate
            : new Date(event.eventStartDate),
        venue: event.venue,
        windowStatus: getRegistrationWindowStatus(event),
        registrationType:
          event.registrationType === "open_for_all" ? "Open for all" : "Invitees only",
        total: regs.length,
        confirmed: evConfirmed,
        waitlisted: evWaitlisted,
        rejected: evRejected,
        attended: evAttended,
        priority: evPriority,
        seatLimit,
        fillPct,
        blastedCount: evBlasted,
      };
    })
    .sort((a, b) => b.total - a.total || a.eventDate.getTime() - b.eventDate.getTime());

  return {
    events: {
      total: events.length,
      upcoming: events.filter((e) => e.eventEndDate >= now).length,
      past: events.filter((e) => e.eventEndDate < now).length,
      published: events.filter((e) => e.published !== false).length,
      registrationOpen,
      registrationOpenSoon,
      registrationClosed,
    },
    registrations: {
      total: registrations.length,
      confirmed,
      waitlisted,
      rejected,
      priority,
      nonPriority: registrations.length - priority,
      attended,
      notAttended: Math.max(0, notAttended),
      checkInRate,
      whatsappOptIn,
      last7Days: regsInLastDays(registrations, 7),
      last30Days: regsInLastDays(registrations, 30),
    },
    eligible: {
      total: eligibleClients.length,
      registeredFromEligible,
      conversionRate,
    },
    charts: {
      byEvent,
      admissionStatus,
      participation,
      priority: priorityChart,
      registrationTrend: countByDay(registrations, 14),
      eventWindowStatus,
    },
    eventRows,
  };
}
