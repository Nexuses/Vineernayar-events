import { NextResponse } from "next/server";
import { getAdminFromCookie } from "@/lib/auth";
import { parseEventDateTime, resolveEventDatesFromAdminFields } from "@/lib/date-utils";
import { createEvent, listEvents } from "@/lib/models/Event";
import { saveBannerFile } from "@/lib/banner-upload";
import { parseSeatLimit } from "@/lib/parse-seat-limit";
import {
  transportLocationsFromFormData,
  transportLocationsFromJsonBody,
} from "@/lib/admin-transport-locations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const admin = await getAdminFromCookie();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const events = await listEvents();
    return NextResponse.json(events, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    console.error("List events error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const admin = await getAdminFromCookie();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let eventName: string;
    let description: string;
    let eventBanner: string;
    let eventDate: string;
    let eventTime: string;
    let registrationStartDate: string;
    let registrationEndDate: string;
    let venue: string;
    let speaker: string;
    let phone: string;
    let registrationType: "open_for_all" | "invitees_only";
    let collectApparelSize: boolean;
    let collectOvernightStay: boolean;
    let collectPassportNic: boolean;
    let collectTransport: boolean;
    let requireWhatsAppNumber: boolean;
    let requireApparelSize: boolean;
    let requireOvernightStay: boolean;
    let requirePassportNic: boolean;
    let requireTransport: boolean;
    let published: boolean;
    let transportLocationsParsed: string[];
    let seatLimitRaw: unknown;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      eventName = (formData.get("eventName") as string) || "";
      description = (formData.get("description") as string) || "";
      eventBanner = (formData.get("eventBanner") as string) || "";
      eventDate = (formData.get("eventDate") as string) || "";
      eventTime = (formData.get("eventTime") as string) || "";
      registrationStartDate = (formData.get("registrationStartDate") as string) || "";
      registrationEndDate = (formData.get("registrationEndDate") as string) || "";
      venue = (formData.get("venue") as string) || "";
      speaker = (formData.get("speaker") as string) || "";
      phone = (formData.get("phone") as string) || "";
      registrationType =
        (formData.get("registrationType") as "open_for_all" | "invitees_only") || "invitees_only";
      collectApparelSize = formData.get("collectApparelSize") === "true" || formData.get("collectApparelSize") === "1";
      collectOvernightStay = formData.get("collectOvernightStay") === "true" || formData.get("collectOvernightStay") === "1";
      collectPassportNic = formData.get("collectPassportNic") === "true" || formData.get("collectPassportNic") === "1";
      collectTransport = formData.get("collectTransport") === "true" || formData.get("collectTransport") === "1";
      requireWhatsAppNumber = formData.get("requireWhatsAppNumber") === "true" || formData.get("requireWhatsAppNumber") === "1";
      requireApparelSize = formData.get("requireApparelSize") === "true" || formData.get("requireApparelSize") === "1";
      requireOvernightStay = formData.get("requireOvernightStay") === "true" || formData.get("requireOvernightStay") === "1";
      requirePassportNic = formData.get("requirePassportNic") === "true" || formData.get("requirePassportNic") === "1";
      requireTransport = formData.get("requireTransport") === "true" || formData.get("requireTransport") === "1";
      published = formData.get("published") === "true" || formData.get("published") === "1";
      seatLimitRaw = formData.get("seatLimit");
      transportLocationsParsed = transportLocationsFromFormData(formData);

      const file = formData.get("bannerFile") as File | null;
      if (file && file.size > 0) {
        eventBanner = await saveBannerFile(file);
      }
    } else {
      const body = await request.json();
      eventName = body.eventName ?? "";
      description = body.description ?? "";
      eventBanner = body.eventBanner ?? "";
      eventDate = body.eventDate ?? "";
      eventTime = body.eventTime ?? "";
      registrationStartDate = body.registrationStartDate ?? "";
      registrationEndDate = body.registrationEndDate ?? "";
      venue = body.venue ?? "";
      speaker = body.speaker ?? "";
      phone = body.phone ?? "";
      registrationType = body.registrationType ?? "invitees_only";
      collectApparelSize = !!body.collectApparelSize;
      collectOvernightStay = !!body.collectOvernightStay;
      collectPassportNic = !!body.collectPassportNic;
      collectTransport = !!body.collectTransport;
      requireWhatsAppNumber = !!body.requireWhatsAppNumber;
      requireApparelSize = !!body.requireApparelSize;
      requireOvernightStay = !!body.requireOvernightStay;
      requirePassportNic = !!body.requirePassportNic;
      requireTransport = !!body.requireTransport;
      published = !!body.published;
      seatLimitRaw = body.seatLimit;
      transportLocationsParsed = transportLocationsFromJsonBody(body);
    }

    if (!eventName.trim()) {
      return NextResponse.json(
        { error: "Event name is required" },
        { status: 400 }
      );
    }
    if (!eventDate.trim()) {
      return NextResponse.json(
        { error: "Event date is required" },
        { status: 400 }
      );
    }

    const resolvedEventDates = resolveEventDatesFromAdminFields(eventDate, eventTime);
    if (Number.isNaN(resolvedEventDates.eventStartDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid event date" },
        { status: 400 }
      );
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

    if (collectTransport && transportLocationsParsed.length === 0) {
      return NextResponse.json(
        { error: "Add at least one transport location when Transport is enabled" },
        { status: 400 }
      );
    }

    let seatLimit: number | undefined;
    try {
      seatLimit = parseSeatLimit(seatLimitRaw);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid seat limit" },
        { status: 400 }
      );
    }

    const event = await createEvent({
      eventName,
      description: description.trim() || undefined,
      eventBanner,
      eventStartDate: resolvedEventDates.eventStartDate,
      eventEndDate: resolvedEventDates.eventEndDate,
      eventTime: resolvedEventDates.eventTime || undefined,
      registrationStartDate: registrationStartDate ? parseEventDateTime(registrationStartDate) : undefined,
      registrationEndDate: registrationEndDate ? parseEventDateTime(registrationEndDate) : undefined,
      venue,
      speaker,
      phone,
      registrationStatus: "open",
      registrationType: registrationType === "open_for_all" ? "open_for_all" : "invitees_only",
      collectApparelSize: !!collectApparelSize,
      collectOvernightStay: !!collectOvernightStay,
      collectPassportNic: !!collectPassportNic,
      collectTransport: !!collectTransport,
      requireWhatsAppNumber: !!requireWhatsAppNumber,
      requireApparelSize: !!requireApparelSize,
      requireOvernightStay: !!requireOvernightStay,
      requirePassportNic: !!requirePassportNic,
      requireTransport: !!requireTransport,
      published: !!published,
      transportLocations: collectTransport ? transportLocationsParsed : [],
      seatLimit,
    });

    return NextResponse.json(event);
  } catch (err) {
    console.error("Create event error:", err);
    const message = err instanceof Error ? err.message : "Something went wrong";
    const status = /Only image files|too large/i.test(message) ? 400 : 500;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
