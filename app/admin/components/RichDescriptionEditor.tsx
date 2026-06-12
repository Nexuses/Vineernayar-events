"use client";

import { useCallback, useEffect, useRef, type KeyboardEvent } from "react";
import {
  DESC_GAP_LG_HTML,
  DESC_GAP_SM_HTML,
} from "@/lib/description-line-gaps";

const FONT_SIZES_PX = [10, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 40] as const;
const DEFAULT_FONT_SIZE_PX = 16;

type RichDescriptionEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

function stepFontSize(current: number, increase: boolean): number {
  let idx = FONT_SIZES_PX.indexOf(current as (typeof FONT_SIZES_PX)[number]);
  if (idx === -1) {
    idx = FONT_SIZES_PX.findIndex((s) => s >= current);
    if (idx === -1) idx = FONT_SIZES_PX.length - 1;
    else if (FONT_SIZES_PX[idx] > current && !increase) idx = Math.max(0, idx - 1);
  }
  const next = increase
    ? Math.min(FONT_SIZES_PX.length - 1, idx + 1)
    : Math.max(0, idx - 1);
  return FONT_SIZES_PX[next] ?? DEFAULT_FONT_SIZE_PX;
}

function getFontSizePx(node: Node | null, editor: HTMLElement): number {
  let el: HTMLElement | null =
    node?.nodeType === Node.TEXT_NODE
      ? (node.parentElement as HTMLElement | null)
      : (node as HTMLElement | null);

  while (el && el !== editor) {
    if (el.style.fontSize) {
      const parsed = parseInt(el.style.fontSize, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
    el = el.parentElement;
  }

  if (editor.style.fontSize) {
    const parsed = parseInt(editor.style.fontSize, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return (
    parseInt(window.getComputedStyle(editor).fontSize, 10) || DEFAULT_FONT_SIZE_PX
  );
}

export function RichDescriptionEditor({
  value,
  onChange,
  placeholder = "Describe the event for attendees",
}: RichDescriptionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const skipNextSync = useRef(false);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    const normalized = value || "";
    if (el.innerHTML !== normalized) {
      el.innerHTML = normalized;
    }
  }, [value]);

  const syncFromEditor = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? "";
    skipNextSync.current = true;
    onChange(html);
  }, [onChange]);

  function applyBold() {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand("bold", false);
    syncFromEditor();
  }

  function applyBulletList() {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand("insertUnorderedList", false);
    syncFromEditor();
  }

  function isInsideList(editor: HTMLElement): boolean {
    const sel = window.getSelection();
    if (!sel?.anchorNode) return false;
    let node: Node | null = sel.anchorNode;
    while (node && node !== editor) {
      const name = node.nodeName;
      if (name === "LI" || name === "UL" || name === "OL") return true;
      node = node.parentNode;
    }
    return false;
  }

  function insertDivider() {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand("insertHTML", false, "<hr><br>");
    syncFromEditor();
  }

  function adjustFontSize(increase: boolean) {
    const el = editorRef.current;
    if (!el) return;
    el.focus();

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const hasSelection = !range.collapsed && sel.toString().length > 0;

    const current = hasSelection
      ? getFontSizePx(sel.anchorNode, el)
      : getFontSizePx(el, el);
    const newSize = stepFontSize(current, increase);
    if (newSize === current) return;

    if (hasSelection) {
      try {
        const extracted = range.extractContents();
        const span = document.createElement("span");
        span.style.fontSize = `${newSize}px`;
        span.appendChild(extracted);
        range.insertNode(span);
        const after = document.createRange();
        after.selectNodeContents(span);
        after.collapse(false);
        sel.removeAllRanges();
        sel.addRange(after);
      } catch {
        document.execCommand("styleWithCSS", false, "true");
        document.execCommand(increase ? "increaseFontSize" : "decreaseFontSize", false);
      }
    } else {
      const onlyChild = el.firstElementChild;
      const isSingleSizedSpan =
        el.childNodes.length === 1 &&
        onlyChild?.tagName === "SPAN" &&
        (onlyChild as HTMLSpanElement).style.fontSize;

      if (isSingleSizedSpan) {
        (onlyChild as HTMLSpanElement).style.fontSize = `${newSize}px`;
      } else if (el.textContent?.trim()) {
        const rangeAll = document.createRange();
        rangeAll.selectNodeContents(el);
        try {
          const extracted = rangeAll.extractContents();
          const span = document.createElement("span");
          span.style.fontSize = `${newSize}px`;
          span.appendChild(extracted);
          rangeAll.insertNode(span);
        } catch {
          el.style.fontSize = `${newSize}px`;
        }
      } else {
        el.style.fontSize = `${newSize}px`;
      }
    }

    syncFromEditor();
  }

  function handleEnter(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Enter") return;
    const el = editorRef.current;
    if (!el) return;
    if (isInsideList(el)) return;
    e.preventDefault();
    el.focus();
    document.execCommand(
      "insertHTML",
      false,
      e.shiftKey ? DESC_GAP_SM_HTML : DESC_GAP_LG_HTML
    );
    syncFromEditor();
  }

  const gapStyles =
    "[&_.desc-gap-lg]:my-5 [&_.desc-gap-sm]:my-1.5 [&_br.desc-gap-sm]:block [&_br.desc-gap-sm]:h-0";

  const inputClass =
    "min-h-[200px] w-full rounded-b-md border border-t-0 border-zinc-300 px-3 py-2 text-base text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className="rounded-md border border-zinc-300">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-md border-b border-zinc-200 bg-zinc-50 px-2 py-1.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              applyBold();
            }}
            className="rounded px-2.5 py-1 text-sm font-bold text-zinc-800 hover:bg-zinc-200"
            title="Bold"
            aria-label="Bold"
          >
            B
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              insertDivider();
            }}
            className="rounded px-2.5 py-1 text-zinc-800 hover:bg-zinc-200"
            title="Insert divider line"
            aria-label="Insert divider line"
          >
            <span className="block w-5 border-t-2 border-zinc-600" aria-hidden />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              applyBulletList();
            }}
            className="rounded px-2.5 py-1 text-lg leading-none text-zinc-800 hover:bg-zinc-200"
            title="Bullet list"
            aria-label="Bullet list"
          >
            •
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              adjustFontSize(false);
            }}
            className="min-w-[2.25rem] rounded px-2 py-1 text-sm font-semibold text-zinc-800 hover:bg-zinc-200"
            title="Decrease font size"
            aria-label="Decrease font size"
          >
            A−
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              adjustFontSize(true);
            }}
            className="min-w-[2.25rem] rounded px-2 py-1 text-sm font-semibold text-zinc-800 hover:bg-zinc-200"
            title="Increase font size"
            aria-label="Increase font size"
          >
            A+
          </button>
        </div>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        onKeyDown={handleEnter}
        onInput={syncFromEditor}
        onBlur={syncFromEditor}
        data-placeholder={placeholder}
        className={`${inputClass} ${gapStyles} overflow-y-auto rounded-t-none empty:before:pointer-events-none empty:before:text-zinc-500 empty:before:content-[attr(data-placeholder)] [&_b]:font-bold [&_hr]:my-4 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-zinc-300 [&_li]:mb-1 [&_strong]:font-bold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5`}
      />
    </div>
  );
}
