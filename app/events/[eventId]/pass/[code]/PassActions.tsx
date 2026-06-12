"use client";

export function PassActions({ calendarUrl }: { calendarUrl: string }) {
  return (
    <div className="no-print mt-8 flex flex-wrap items-center gap-6">
      <a
        href={calendarUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-6 py-3 font-medium text-zinc-900 hover:bg-brand-600"
      >
        Add to Calendar
      </a>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-6 py-3 font-medium text-white hover:bg-zinc-700"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print Pass
      </button>
    </div>
  );
}
