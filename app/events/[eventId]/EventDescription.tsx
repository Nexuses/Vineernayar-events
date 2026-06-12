import { descriptionToSafeHtml } from "@/lib/sanitize-description-html";

export function EventDescription({ text }: { text: string }) {
  const safeHtml = descriptionToSafeHtml(text);

  return (
    <div
      className="text-base leading-relaxed text-zinc-700 [&_.desc-gap-lg]:my-5 [&_.desc-gap-sm]:my-1.5 [&_b]:font-bold [&_br.desc-gap-sm]:block [&_br.desc-gap-sm]:h-0 [&_hr]:my-4 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-zinc-300 [&_li]:mb-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_span]:inline [&_strong]:font-bold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
