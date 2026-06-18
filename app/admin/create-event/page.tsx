"use client";

import { useState } from "react";
import { RichDescriptionEditor } from "@/app/admin/components/RichDescriptionEditor";

export default function CreateEventPage() {
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
  const [seatLimit, setSeatLimit] = useState("");
  const [eventBannerUrl, setEventBannerUrl] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const bannerUrl = eventBannerUrl.trim();
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
        if (seatLimit.trim()) formData.set("seatLimit", seatLimit.trim());
        formData.set("bannerFile", bannerFile);
        res = await fetch("/api/admin/events", { method: "POST", body: formData });
      } else {
        res = await fetch("/api/admin/events", {
          method: "POST",
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
            ...(seatLimit.trim() ? { seatLimit: Number.parseInt(seatLimit.trim(), 10) } : {}),
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create event");
        return;
      }
      setSuccess(`Event created. Event ID: ${data.eventId}`);
      setEventName("");
      setDescription("");
      setEventDate("");
      setEventTime("");
      setRegistrationStartDate("");
      setRegistrationEndDate("");
      setVenue("");
      setSpeaker("");
      setPhone("");
      setRegistrationType("invitees_only");
      setPublished(true);
      setSeatLimit("");
      setEventBannerUrl("");
      setBannerFile(null);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">
        Create Event
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        Event ID is generated automatically when you create an event.
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
            <p className="mt-1 text-xs text-zinc-500">
              Optional. Registration closes automatically when seats are full. Not shown on the public site.
            </p>
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
          <div className="flex items-end">
            <button type="submit" disabled={loading}
              className="rounded-md bg-zinc-900 px-6 py-2.5 font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
              {loading ? "Creating…" : "Create Event"}
            </button>
          </div>
        </div>
      </form>

    </div>
  );
}
