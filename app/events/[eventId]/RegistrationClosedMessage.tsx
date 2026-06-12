"use client";

import { useState } from "react";

export function RegistrationClosedCard({ onOpenModal }: { onOpenModal?: () => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const open = () => setModalOpen(true);
  const close = () => setModalOpen(false);

  return (
    <>
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200">
          <svg className="h-6 w-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-medium text-zinc-700">
          Registration for this event is closed.
        </p>
        <button
          type="button"
          onClick={onOpenModal ?? open}
          className="mt-4 rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-300"
        >
          View details
        </button>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="registration-closed-title"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-8 text-center sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <svg className="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 id="registration-closed-title" className="mt-6 text-xl font-semibold text-zinc-900 sm:text-2xl">
                Registration is closed
              </h2>
              <p className="mt-3 text-sm text-zinc-600">
                Registrations for this event are no longer accepted. Please check back for future events or contact the organizer if you have questions.
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-8 w-full rounded-xl bg-brand-500 px-4 py-3 font-medium text-zinc-900 transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Full-page “registration closed” view with modal (e.g. on /events/[id]/register when closed). */
export function RegistrationClosedPage() {
  const [modalOpen, setModalOpen] = useState(true);

  return (
    <>
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="registration-closed-title-page"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-8 text-center sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <svg className="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 id="registration-closed-title-page" className="mt-6 text-xl font-semibold text-zinc-900 sm:text-2xl">
                Registration is closed
              </h2>
              <p className="mt-3 text-sm text-zinc-600">
                Registrations for this event are no longer accepted. Please check back for future events or contact the organizer if you have questions.
              </p>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="mt-8 w-full rounded-xl bg-brand-500 px-4 py-3 font-medium text-zinc-900 transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
