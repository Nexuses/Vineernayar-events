import { NextResponse } from "next/server";
import { getAdminFromCookie } from "@/lib/auth";
import { parseEventDateTime } from "@/lib/date-utils";
import { getEventById, updateEvent } from "@/lib/models/Event";
import { saveBannerFile } from "@/lib/banner-upload";
import {
  transportLocationsFromFormData,
  transportLocationsFromJsonBody,
} from "@/lib/admin-transport-locations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const admin = await getAdminFromCookie();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { eventId } = await params;
    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(event, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    console.error("Get event error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const admin = await getAdminFromCookie();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { eventId } = await params;
    const contentType = request.headers.get("content-type") || "";
    let eventName: string | undefined;
    let description: string | undefined;
    let eventBanner: string | undefined;
    let eventStartDate: string | undefined;
    let eventEndDate: string | undefined;
    let registrationStartDate: string | undefined;
    let registrationEndDate: string | undefined;
    let venue: string | undefined;
    let speaker: string | undefined;
    let phone: string | undefined;
    let registrationStatus: "open" | "closed" | undefined;
    let registrationType: "open_for_all" | "invitees_only" | undefined;
    let collectApparelSize: boolean | undefined;
    let collectOvernightStay: boolean | undefined;
    let collectPassportNic: boolean | undefined;
    let collectTransport: boolean | undefined;
    let requireWhatsAppNumber: boolean | undefined;
    let requireApparelSize: boolean | undefined;
    let requireOvernightStay: boolean | undefined;
    let requirePassportNic: boolean | undefined;
    let requireTransport: boolean | undefined;
    let published: boolean | undefined;
    let transportLocationsParsed: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      eventName = formData.get("eventName") as string | null ?? undefined;
      description = formData.get("description") as string | null ?? undefined;
      eventBanner = formData.get("eventBanner") as string | null ?? undefined;
      eventStartDate = formData.get("eventStartDate") as string | null ?? undefined;
      eventEndDate = formData.get("eventEndDate") as string | null ?? undefined;
      registrationStartDate = formData.get("registrationStartDate") as string | null ?? undefined;
      registrationEndDate = formData.get("registrationEndDate") as string | null ?? undefined;
      venue = formData.get("venue") as string | null ?? undefined;
      speaker = formData.get("speaker") as string | null ?? undefined;
      phone = formData.get("phone") as string | null ?? undefined;
      registrationStatus = (formData.get("registrationStatus") as "open" | "closed") || undefined;
      registrationType = (formData.get("registrationType") as "open_for_all" | "invitees_only") || undefined;
      const ca = formData.get("collectApparelSize");
      const co = formData.get("collectOvernightStay");
      const cp = formData.get("collectPassportNic");
      collectApparelSize = ca === "true" || ca === "1" ? true : ca === "false" || ca === "0" ? false : undefined;
      collectOvernightStay = co === "true" || co === "1" ? true : co === "false" || co === "0" ? false : undefined;
      collectPassportNic = cp === "true" || cp === "1" ? true : cp === "false" || cp === "0" ? false : undefined;
      const ct = formData.get("collectTransport");
      collectTransport = ct === "true" || ct === "1" ? true : ct === "false" || ct === "0" ? false : undefined;
      const rw = formData.get("requireWhatsAppNumber");
      requireWhatsAppNumber = rw === "true" || rw === "1" ? true : rw === "false" || rw === "0" ? false : undefined;
      const ra = formData.get("requireApparelSize");
      requireApparelSize = ra === "true" || ra === "1" ? true : ra === "false" || ra === "0" ? false : undefined;
      const ro = formData.get("requireOvernightStay");
      requireOvernightStay = ro === "true" || ro === "1" ? true : ro === "false" || ro === "0" ? false : undefined;
      const rp = formData.get("requirePassportNic");
      requirePassportNic = rp === "true" || rp === "1" ? true : rp === "false" || rp === "0" ? false : undefined;
      const rt = formData.get("requireTransport");
      requireTransport = rt === "true" || rt === "1" ? true : rt === "false" || rt === "0" ? false : undefined;
      const pub = formData.get("published");
      published = pub === "true" || pub === "1" ? true : pub === "false" || pub === "0" ? false : undefined;
      transportLocationsParsed = transportLocationsFromFormData(formData);
      const file = formData.get("bannerFile") as File | null;
      if (file && file.size > 0) {
        eventBanner = await saveBannerFile(file);
      }
    } else {
      const body = await request.json();
      eventName = body.eventName;
      description = body.description;
      eventBanner = body.eventBanner;
      eventStartDate = body.eventStartDate;
      eventEndDate = body.eventEndDate;
      registrationStartDate = body.registrationStartDate;
      registrationEndDate = body.registrationEndDate;
      venue = body.venue;
      speaker = body.speaker;
      phone = body.phone;
      registrationStatus = body.registrationStatus;
      registrationType = body.registrationType;
      collectApparelSize = body.collectApparelSize;
      collectOvernightStay = body.collectOvernightStay;
      collectPassportNic = body.collectPassportNic;
      collectTransport = body.collectTransport;
      requireWhatsAppNumber = body.requireWhatsAppNumber;
      requireApparelSize = body.requireApparelSize;
      requireOvernightStay = body.requireOvernightStay;
      requirePassportNic = body.requirePassportNic;
      requireTransport = body.requireTransport;
      published = body.published === undefined ? undefined : !!body.published;
      transportLocationsParsed = transportLocationsFromJsonBody(body);
    }

    if (registrationStartDate && registrationEndDate) {
      const start = parseEventDateTime(registrationStartDate);
      const end = parseEventDateTime(registrationEndDate);
      if (start > end) {
        return NextResponse.json(
          { error: "Start Registration Date must be before End Registration Date" },
          { status: 400 }
        );
      }
    }

    if (collectTransport === true && transportLocationsParsed.length === 0) {
      return NextResponse.json(
        { error: "Add at least one transport location when Transport is enabled" },
        { status: 400 }
      );
    }

    const updated = await updateEvent(eventId, {
      ...(eventName !== undefined && { eventName }),
      ...(description !== undefined && { description }),
      ...(eventBanner !== undefined && { eventBanner }),
      ...(eventStartDate !== undefined && { eventStartDate: parseEventDateTime(eventStartDate) }),
      ...(eventEndDate !== undefined && { eventEndDate: parseEventDateTime(eventEndDate) }),
      ...(registrationStartDate !== undefined && {
        registrationStartDate: registrationStartDate ? parseEventDateTime(registrationStartDate) : undefined,
      }),
      ...(registrationEndDate !== undefined && {
        registrationEndDate: registrationEndDate ? parseEventDateTime(registrationEndDate) : undefined,
      }),
      ...(venue !== undefined && { venue }),
      ...(speaker !== undefined && { speaker }),
      ...(phone !== undefined && { phone }),
      ...(registrationStatus !== undefined && { registrationStatus }),
      ...(registrationType !== undefined && { registrationType }),
      ...(collectApparelSize !== undefined && { collectApparelSize }),
      ...(collectOvernightStay !== undefined && { collectOvernightStay }),
      ...(collectPassportNic !== undefined && { collectPassportNic }),
      ...(collectTransport !== undefined && { collectTransport }),
      ...(published !== undefined && { published }),
      ...(requireWhatsAppNumber !== undefined && { requireWhatsAppNumber }),
      ...(requireApparelSize !== undefined && { requireApparelSize }),
      ...(requireOvernightStay !== undefined && { requireOvernightStay }),
      ...(requirePassportNic !== undefined && { requirePassportNic }),
      ...(requireTransport !== undefined && { requireTransport }),
      ...(collectTransport === true && {
        transportLocations: transportLocationsParsed,
      }),
      ...(collectTransport === false && { transportLocations: [] }),
    });

    if (!updated) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Update event error:", err);
    const message = err instanceof Error ? err.message : "Something went wrong";
    const status = /Only image files|too large/i.test(message) ? 400 : 500;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
