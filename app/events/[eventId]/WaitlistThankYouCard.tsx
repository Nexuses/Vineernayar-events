export function WaitlistThankYouCard() {
  return (
    <div className="min-h-full bg-slate-100">
      <div className="mx-auto max-w-3xl px-5 py-16">
        <div className="rounded-2xl border-2 border-brand-500 bg-white p-8 shadow-[0_12px_40px_rgba(248,232,40,0.22)] sm:p-10">
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <div className="relative mb-5 flex h-24 w-24 items-center justify-center">
              <span className="absolute inline-flex h-20 w-20 rounded-full bg-brand-100" />
              <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 shadow-lg shadow-brand-200/70">
                <svg className="h-9 w-9 text-zinc-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-zinc-900">
              Thank You for applying for an invitation.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              You will receive a confirmation mail soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
