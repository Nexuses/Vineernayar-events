import type { EventAgendaItem } from "@/lib/event-agenda";
import { hasDescriptionContent } from "@/lib/sanitize-description-html";
import { EventDescription } from "../EventDescription";

type RegistrationAgendaProps = {
  items: EventAgendaItem[];
  description?: string;
};

export function RegistrationAgenda({ items, description }: RegistrationAgendaProps) {
  const hasStructuredAgenda = items.length > 0;
  const hasDescription = hasDescriptionContent(description);

  if (!hasStructuredAgenda && !hasDescription) return null;

  return (
    <section
      id="agenda-section"
      className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] sm:p-10"
    >
      {hasStructuredAgenda ? (
        <>
          <div className="border-b-2 border-slate-200 pb-4">
            <h3 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-[22px]">
              Detailed Itinerary
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Plan your arrival and session attendance using the schedule below.
            </p>
          </div>

          <div className="relative ml-2 mt-8 border-l-2 border-slate-200 pl-6">
            {items.map((item, index) => (
              <div key={`${item.time}-${item.title}-${index}`} className="relative mb-7 last:mb-0">
                <span
                  className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-zinc-900 bg-brand-500"
                  aria-hidden
                />
                <span className="inline-block rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[13px] font-bold text-slate-900">
                  {item.time}
                </span>
                <h4 className="mt-1.5 text-base font-bold text-slate-900">{item.title}</h4>
                {item.description ? (
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{item.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        </>
      ) : (
        <EventDescription text={description!} />
      )}
    </section>
  );
}
