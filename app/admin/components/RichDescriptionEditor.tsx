"use client";

import { useMemo, useState } from "react";
import { descriptionToSafeHtml } from "@/lib/sanitize-description-html";

type RichDescriptionEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

const previewClassName =
  "text-base leading-relaxed text-zinc-700 [&_.desc-gap-lg]:my-5 [&_.desc-gap-sm]:my-1.5 [&_b]:font-bold [&_br.desc-gap-sm]:block [&_br.desc-gap-sm]:h-0 [&_hr]:my-4 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-zinc-300 [&_li]:mb-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_span]:inline [&_strong]:font-bold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5";

export function RichDescriptionEditor({
  value,
  onChange,
  placeholder = "Describe the event for attendees",
}: RichDescriptionEditorProps) {
  const [mode, setMode] = useState<"split" | "html" | "preview">("split");
  const previewHtml = useMemo(() => descriptionToSafeHtml(value), [value]);
  const hasPreview = previewHtml.length > 0;

  return (
    <div className="overflow-hidden rounded-md border border-zinc-300">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2">
        <p className="text-xs text-zinc-600">
          Write HTML for the public event page. Use the preview to check formatting.
        </p>
        <div className="flex rounded-md border border-zinc-200 bg-white p-0.5 sm:hidden">
          <button
            type="button"
            onClick={() => setMode("html")}
            className={`rounded px-2.5 py-1 text-xs font-medium ${
              mode === "html" ? "bg-zinc-900 text-white" : "text-zinc-700"
            }`}
          >
            HTML
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={`rounded px-2.5 py-1 text-xs font-medium ${
              mode === "preview" ? "bg-zinc-900 text-white" : "text-zinc-700"
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      <div
        className={`grid ${
          mode === "split" ? "lg:grid-cols-2" : "grid-cols-1"
        }`}
      >
        <div className={mode === "preview" ? "hidden lg:block" : ""}>
          <div className="border-b border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 lg:border-b-0 lg:border-r">
            HTML
          </div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`${placeholder}\n\nExample:\n<p>Welcome to our event.</p>\n<ul>\n  <li>Keynote session</li>\n  <li>Networking lunch</li>\n</ul>`}
            spellCheck={false}
            className="min-h-[260px] w-full resize-y border-0 px-3 py-3 font-mono text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-0 lg:min-h-[320px]"
          />
        </div>

        <div className={mode === "html" ? "hidden lg:block" : ""}>
          <div className="border-b border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 lg:border-b-0">
            Preview
          </div>
          <div className="min-h-[260px] bg-zinc-50 px-3 py-3 lg:min-h-[320px]">
            {hasPreview ? (
              <div
                className={previewClassName}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <p className="text-sm text-zinc-500">Preview will appear here as you type HTML.</p>
            )}
          </div>
        </div>
      </div>

      <p className="border-t border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
        Allowed tags: p, div, span, b, strong, em, i, br, hr, ul, ol, li. Inline styles: color,
        font-size, font-weight.
      </p>
    </div>
  );
}
