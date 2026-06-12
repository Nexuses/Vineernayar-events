"use client";

import { useState } from "react";
import { normalizeTransportLocationStrings } from "@/lib/admin-transport-locations";
import { RichDescriptionEditor } from "@/app/admin/components/RichDescriptionEditor";

export default function CreateEventPage() {
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [registrationStartDate, setRegistrationStartDate] = useState("");
  const [registrationEndDate, setRegistrationEndDate] = useState("");
  const [venue, setVenue] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [phone, setPhone] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState<"open" | "closed">("open");
  const [registrationType, setRegistrationType] = useState<"open_for_all" | "invitees_only">("invitees_only");
  const [published, setPublished] = useState(true);
  const [collectApparelSize, setCollectApparelSize] = useState(false);
  const [collectOvernightStay, setCollectOvernightStay] = useState(false);
  const [collectPassportNic, setCollectPassportNic] = useState(false);
  const [collectTransport, setCollectTransport] = useState(false);
  const [requireWhatsAppNumber, setRequireWhatsAppNumber] = useState(false);
  const [requireApparelSize, setRequireApparelSize] = useState(false);
  const [requireOvernightStay, setRequireOvernightStay] = useState(false);
  const [requirePassportNic, setRequirePassportNic] = useState(false);
  const [requireTransport, setRequireTransport] = useState(false);
  const [transportLocations, setTransportLocations] = useState<string[]>([""]);
  const [eventBannerUrl, setEventBannerUrl] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (collectTransport) {
      const locs = normalizeTransportLocationStrings(transportLocations);
      if (locs.length === 0) {
        setError("Add at least one transport location when Transport is enabled.");
        return;
      }
    }
    setLoading(true);
    try {
      const trimmedTransport = collectTransport
        ? normalizeTransportLocationStrings(transportLocations)
        : [];
      const bannerUrl = eventBannerUrl.trim();
      let res: Response;
      if (bannerFile) {
        const formData = new FormData();
        formData.set("eventName", eventName);
        formData.set("eventBanner", bannerUrl);
        formData.set("description", description);
        formData.set("eventStartDate", eventStartDate);
        formData.set("eventEndDate", eventEndDate);
        formData.set("registrationStartDate", registrationStartDate);
        formData.set("registrationEndDate", registrationEndDate);
        formData.set("venue", venue);
        formData.set("speaker", speaker);
        formData.set("phone", phone);
        formData.set("registrationStatus", registrationStatus);
        formData.set("registrationType", registrationType);
        formData.set("published", published ? "true" : "false");
        formData.set("collectApparelSize", collectApparelSize ? "true" : "false");
        formData.set("collectOvernightStay", collectOvernightStay ? "true" : "false");
        formData.set("collectPassportNic", collectPassportNic ? "true" : "false");
        formData.set("collectTransport", collectTransport ? "true" : "false");
        formData.set("requireWhatsAppNumber", requireWhatsAppNumber ? "true" : "false");
        formData.set("requireApparelSize", requireApparelSize ? "true" : "false");
        formData.set("requireOvernightStay", requireOvernightStay ? "true" : "false");
        formData.set("requirePassportNic", requirePassportNic ? "true" : "false");
        formData.set("requireTransport", requireTransport ? "true" : "false");
        for (const loc of trimmedTransport) {
          formData.append("transportLocations", loc);
        }
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
            eventStartDate,
            eventEndDate,
            registrationStartDate,
            registrationEndDate,
            venue,
            speaker,
            phone,
            registrationStatus,
            registrationType,
            published,
            collectApparelSize,
            collectOvernightStay,
            collectPassportNic,
            collectTransport,
            requireWhatsAppNumber,
            requireApparelSize,
            requireOvernightStay,
            requirePassportNic,
            requireTransport,
            transportLocations: trimmedTransport,
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
      setEventStartDate("");
      setEventEndDate("");
      setRegistrationStartDate("");
      setRegistrationEndDate("");
      setVenue("");
      setSpeaker("");
      setPhone("");
      setRegistrationStatus("open");
      setRegistrationType("invitees_only");
      setPublished(true);
      setCollectApparelSize(false);
      setCollectOvernightStay(false);
      setCollectPassportNic(false);
      setCollectTransport(false);
      setRequireWhatsAppNumber(false);
      setRequireApparelSize(false);
      setRequireOvernightStay(false);
      setRequirePassportNic(false);
      setRequireTransport(false);
      setTransportLocations([""]);
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
            <label className="mb-1 block text-sm font-medium text-zinc-700">Start date</label>
            <input type="datetime-local" value={eventStartDate} onChange={(e) => setEventStartDate(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">End date</label>
            <input type="datetime-local" value={eventEndDate} onChange={(e) => setEventEndDate(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
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
            <label className="mb-1 block text-sm font-medium text-zinc-700">Registration Status</label>
            <select
              value={registrationStatus}
              onChange={(e) => setRegistrationStatus(e.target.value as "open" | "closed")}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
            <p className="mt-1 text-xs text-zinc-500">
              Controlled here only — not from registration start/end dates.
            </p>
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
          <div className="sm:col-span-2 space-y-3">
            <p className="text-sm font-medium text-zinc-700">Registration form fields (toggle to show in registration)</p>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={collectApparelSize}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setCollectApparelSize(next);
                      if (!next) setRequireApparelSize(false);
                    }}
                    className="h-4 w-4 rounded border-zinc-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-zinc-900">Apparel - sizes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={collectOvernightStay}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setCollectOvernightStay(next);
                      if (!next) setRequireOvernightStay(false);
                    }}
                    className="h-4 w-4 rounded border-zinc-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-zinc-900">Overnight Stay</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={collectPassportNic}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setCollectPassportNic(next);
                      if (!next) setRequirePassportNic(false);
                    }}
                    className="h-4 w-4 rounded border-zinc-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-zinc-900">Passport/NIC</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={collectTransport}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setCollectTransport(next);
                      if (!next) setRequireTransport(false);
                    }}
                    className="h-4 w-4 rounded border-zinc-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-zinc-900">Transport</span>
                </label>
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireApparelSize}
                    disabled={!collectApparelSize}
                    onChange={(e) => setRequireApparelSize(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-zinc-900">Size required</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireOvernightStay}
                    disabled={!collectOvernightStay}
                    onChange={(e) => setRequireOvernightStay(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-zinc-900">Stay required</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requirePassportNic}
                    disabled={!collectPassportNic}
                    onChange={(e) => setRequirePassportNic(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-zinc-900">Passport required</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireTransport}
                    disabled={!collectTransport}
                    onChange={(e) => setRequireTransport(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-zinc-900">Transport required</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireWhatsAppNumber}
                    onChange={(e) => setRequireWhatsAppNumber(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-zinc-900">
                    WhatsApp number required
                  </span>
                </label>
              </div>
            </div>

            {collectTransport && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-700">
                  Transport locations
                </p>
                <p className="text-xs text-zinc-500">
                  Add one or more pickup points. Remove rows you do not need.
                </p>
                {transportLocations.map((value, index) => (
                  <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <label className="mb-1 block text-sm font-medium text-zinc-700">
                        Location {index + 1}
                      </label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => {
                          const v = e.target.value;
                          setTransportLocations((rows) =>
                            rows.map((row, i) => (i === index ? v : row))
                          );
                        }}
                        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g. Central station pickup"
                      />
                    </div>
                    {transportLocations.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setTransportLocations((rows) =>
                            rows.length <= 1 ? rows : rows.filter((_, i) => i !== index)
                          )
                        }
                        className="shrink-0 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setTransportLocations((rows) => [...rows, ""])}
                  className="rounded-md border border-dashed border-zinc-400 px-3 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 hover:bg-zinc-50"
                >
                  + Add location
                </button>
              </div>
            )}
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
