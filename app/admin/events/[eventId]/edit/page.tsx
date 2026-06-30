"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toDatetimeLocal, toEventDateInput, getEventTimeDisplay } from "@/lib/date-utils";
import { RichDescriptionEditor } from "@/app/admin/components/RichDescriptionEditor";

type EventItem = {
  _id: string;
  eventId: string;
  eventName: string;
  description?: string;
  eventBanner: string;
  eventStartDate: string;
  eventEndDate: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  venue: string;
  speaker: string;
  phone: string;
  registrationStatus: string;
  published?: boolean;
  registrationType?: "open_for_all" | "invitees_only";
  eventTime?: string;
  seatLimit?: number;
  showPassQr?: boolean;
};

export default function EditEventPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<EventItem | null>(null);
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [registrationStartDate, setRegistrationStartDate] = useState("");
  const [registrationEndDate, setRegistrationEndDate] = useState("");
  const [venue, setVenue] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [phone, setPhone] = useState("");
  const [registrationType, setRegistrationType] = useState<"open_for_all" | "invitees_only">("invitees_only");
  const [published, setPublished] = useState(true);
  const [showPassQr, setShowPassQr] = useState(true);
  const [seatLimit, setSeatLimit] = useState("");
  const [eventBannerUrl, setEventBannerUrl] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      setFetchLoading(true);
      try {
        const res = await fetch(`/api/admin/events/${eventId}`);
        if (!res.ok) {
          if (res.status === 404) setError("Event not found");
          return;
        }
        const data = await res.json();
        setEvent(data);
        setEventName(data.eventName ?? "");
        setDescription(data.description ?? "");
        setEventDate(toEventDateInput(data.eventStartDate));
        setEventTime(
          data.eventTime?.trim() ||
            getEventTimeDisplay({
              eventStartDate: data.eventStartDate,
              eventEndDate: data.eventEndDate,
            })
        );
        setRegistrationStartDate(toDatetimeLocal(data.registrationStartDate));
        setRegistrationEndDate(toDatetimeLocal(data.registrationEndDate));
        setVenue(data.venue ?? "");
        setSpeaker(data.speaker ?? "");
        setPhone(data.phone ?? "");
        setRegistrationType(data.registrationType === "open_for_all" ? "open_for_all" : "invitees_only");
        setPublished(!!data.published);
        setShowPassQr(data.showPassQr !== false);
        setSeatLimit(
          typeof data.seatLimit === "number" && data.seatLimit > 0
            ? String(data.seatLimit)
            : ""
        );
        setEventBannerUrl(data.eventBanner ?? "");
      } catch {
        setError("Failed to load event");
      } finally {
        setFetchLoading(false);
      }
    }
    if (eventId) load();
  }, [eventId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const bannerUrl = eventBannerUrl.trim();
      const seatLimitValue = seatLimit.trim()
        ? Number.parseInt(seatLimit.trim(), 10)
        : null;
      let res: Response;
      if (bannerFile) {
        const formData = new FormData();
        formData.set("eventName", eventName);
        formData.set("eventBanner", bannerUrl);
        formData.set("description", description);
        formData.set("eventDate", eventDate);
        formData.set("eventTime", eventTime);
        formData.set("registrationStartDate", registrationStartDate);
        formData.set("registrationEndDate", registrationEndDate);
        formData.set("venue", venue);
        formData.set("speaker", speaker);
        formData.set("phone", phone);
        formData.set("registrationType", registrationType);
        formData.set("published", published ? "true" : "false");
        formData.set("showPassQr", showPassQr ? "true" : "false");
        formData.set("seatLimit", seatLimit.trim());
        formData.set("bannerFile", bannerFile);
        res = await fetch(`/api/admin/events/${eventId}`, { method: "PUT", body: formData });
      } else {
        res = await fetch(`/api/admin/events/${eventId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventName,
            description,
            eventBanner: bannerUrl,
            eventDate,
            eventTime,
            registrationStartDate,
            registrationEndDate,
            venue,
            speaker,
            phone,
            registrationType,
            published,
            showPassQr,
            seatLimit: seatLimitValue,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update event");
        return;
      }
      setSuccess("Event updated.");
      setEvent(data);
      setEventBannerUrl(data.eventBanner ?? "");
      setDescription(data.description ?? "");
      setSeatLimit(
        typeof data.seatLimit === "number" && data.seatLimit > 0
          ? String(data.seatLimit)
          : ""
      );
      setShowPassQr(data.showPassQr !== false);
      setBannerFile(null);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (fetchLoading) {
    return (
      <div>
        <p className="text-zinc-500">Loading event…</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div>
        <p className="text-red-600">{error || "Event not found"}</p>
        <Link
          href="/admin/events"
          className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to All Events
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/events"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          ← Back to All Events
        </Link>
      </div>
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">
        Edit Event
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        Event ID: <span className="font-mono">{event.eventId}</span>
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 w-full rounded-lg border border-zinc-200 bg-white p-4 sm:p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {error ? (
            <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700 sm:col-span-2">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-md bg-green-100 px-3 py-2 text-sm text-green-700 sm:col-span-2">
              {success}
            </p>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Event Name <span className="text-red-500">*</span></label>
            <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} required
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Annual Tech Summit" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Venue</label>
            <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Convention Hall A" />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Description
            </label>
            <RichDescriptionEditor
              key={event._id}
              value={description}
              onChange={setDescription}
              placeholder="Describe the event for attendees (shown on the public event page)"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Date</label>
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Time</label>
            <input type="text" value={eventTime} onChange={(e) => setEventTime(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. 10:00 am - 4:00 pm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Start Registration Date</label>
            <input type="datetime-local" value={registrationStartDate} onChange={(e) => setRegistrationStartDate(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">End Registration Date</label>
            <input type="datetime-local" value={registrationEndDate} onChange={(e) => setRegistrationEndDate(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <p className="mt-1 text-xs text-zinc-500">
              Opens Soon — before start date. Open — between start and end. Closed — after end date.
            </p>
          </div>

          <div className="sm:col-span-2 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Banner URL</label>
              <input
                type="url"
                value={eventBannerUrl}
                onChange={(e) => setEventBannerUrl(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="https://example.com/banner.jpg"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Paste an image URL, or upload a file below. Upload replaces the URL when both are provided.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Banner upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-zinc-600 file:mr-2 file:rounded-md file:border-0 file:bg-zinc-200 file:px-3 file:py-1.5 file:text-zinc-800"
              />
              <p className="mt-1 text-xs text-zinc-500">Recommended size: 1200 x 800 px (3:2), max 5MB.</p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Speaker</label>
            <input type="text" value={speaker} onChange={(e) => setSpeaker(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Speaker name" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Contact number" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Who can register</label>
            <select value={registrationType} onChange={(e) => setRegistrationType(e.target.value as "open_for_all" | "invitees_only")}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="open_for_all">Open for all</option>
              <option value="invitees_only">Only for invitees</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Seat limit</label>
            <input
              type="number"
              min={1}
              step={1}
              value={seatLimit}
              onChange={(e) => setSeatLimit(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. 100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Publish status</label>
            <select
              value={published ? "published" : "unpublished"}
              onChange={(e) => setPublished(e.target.value === "published")}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="published">Publish</option>
              <option value="unpublished">Unpublish</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">QR on event pass</label>
            <select
              value={showPassQr ? "show" : "hide"}
              onChange={(e) => setShowPassQr(e.target.value === "show")}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="show">Show QR code</option>
              <option value="hide">Hide QR code</option>
            </select>
            <p className="mt-1 text-xs text-zinc-500">
              The unique pass ID always stays in the header. This only controls the QR box on passes and PDFs.
            </p>
          </div>
          <div className="flex items-end gap-3">
            <button type="submit" disabled={loading}
              className="rounded-md bg-zinc-900 px-6 py-2.5 font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
              {loading ? "Saving…" : "Save changes"}
            </button>
            <Link href="/admin/events"
              className="rounded-md border border-zinc-300 px-6 py-2.5 font-medium text-zinc-700 hover:bg-zinc-50">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
