"use client";

import { useCallback, useEffect, useState } from "react";
import { JOIN_CITIES } from "@/lib/join-cities";

type JoinMovementModalProps = {
  open: boolean;
  onClose: () => void;
};

export function JoinMovementModal({ open, onClose }: JoinMovementModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const reset = useCallback(() => {
    setLoading(false);
    setSuccess(false);
    setError("");
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
    };
  }, [open, handleClose]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const city = String(data.get("city") ?? "").trim();

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, city }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setLoading(false);
        setError(json.error || "Something went wrong. Please try again.");
        return;
      }

      setLoading(false);
      setSuccess(true);
      form.reset();
    } catch {
      setLoading(false);
      setError("Unable to reach the server. Please try again.");
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white px-8 py-9 shadow-xl sm:px-10 sm:py-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-modal-title"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-lg font-medium text-zinc-900 transition hover:bg-brand-600"
          aria-label="Close"
        >
          ×
        </button>

        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
          Join the movement
        </p>
        <h2
          id="join-modal-title"
          className="mt-2 text-3xl font-extrabold uppercase leading-tight tracking-tight text-zinc-900 sm:text-4xl"
        >
          Save your seat.
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-zinc-600">
          Six cities. Free, public and limited. Tell us where to keep a place for you.
        </p>

        <div className="mt-8">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-10 text-zinc-600" aria-live="polite">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-700" />
              <p className="text-sm">Reserving your seat…</p>
            </div>
          ) : success ? (
            <div
              className="mt-8 flex min-h-[280px] flex-col items-center justify-center rounded-3xl bg-brand-500 px-8 py-12 text-center text-zinc-900 sm:min-h-[300px] sm:px-10 sm:py-14"
              role="status"
            >
              <p className="text-3xl font-extrabold uppercase leading-tight tracking-tight sm:text-4xl">
                Thank you!
              </p>
              <p className="mt-4 max-w-sm text-[15px] leading-relaxed sm:text-base">
                You&apos;re on the list. A confirmation email is on its way to your inbox with
                the details.
              </p>
            </div>
          ) : (
            <form className="space-y-5" noValidate onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-zinc-600">
                  Your name
                </span>
                <input
                  type="text"
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="Full name"
                  className="w-full rounded-xl border-0 bg-zinc-100 px-4 py-3.5 text-[15px] text-zinc-900 outline-none ring-1 ring-transparent placeholder:text-zinc-400 focus:ring-brand-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-zinc-600">
                  Email
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border-0 bg-zinc-100 px-4 py-3.5 text-[15px] text-zinc-900 outline-none ring-1 ring-transparent placeholder:text-zinc-400 focus:ring-brand-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-zinc-600">
                  City
                </span>
                <select
                  name="city"
                  required
                  defaultValue=""
                  className="w-full appearance-none rounded-xl border-0 bg-zinc-100 px-4 py-3.5 text-[15px] text-zinc-900 outline-none ring-1 ring-transparent focus:ring-brand-500"
                >
                  <option value="" disabled>
                    Choose a city
                  </option>
                  {JOIN_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>

              {error ? (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="mt-2 w-full rounded-full bg-brand-500 py-4 text-sm font-bold uppercase tracking-wide text-zinc-900 transition hover:bg-brand-600"
              >
                Reserve my seat
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
