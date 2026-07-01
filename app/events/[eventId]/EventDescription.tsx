import { descriptionToSafeHtml } from "@/lib/sanitize-description-html";

export function EventDescription({ text }: { text: string }) {
  const safeHtml = descriptionToSafeHtml(text);

  return (
    <div
      className="text-base leading-relaxed text-zinc-700 [&_.desc-gap-lg]:my-5 [&_.desc-gap-sm]:my-1.5 [&_b]:font-bold [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-brand-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_br.desc-gap-sm]:block [&_br.desc-gap-sm]:h-0 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-zinc-900 [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-zinc-900 [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-zinc-900 [&_hr]:my-4 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-zinc-300 [&_li]:mb-1 [&_mark]:rounded-sm [&_mark]:px-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_span]:inline [&_strong]:font-bold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
