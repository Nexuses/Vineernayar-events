"use client";

import { useEffect, useRef, useState } from "react";

const HEADER_OFFSET_PX = 96; // 80px navbar + 16px gap

type StickySidebarShellProps = {
  children: React.ReactNode;
};

export function StickySidebarShell({ children }: StickySidebarShellProps) {
  const columnRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);
  const [pinStyle, setPinStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  useEffect(() => {
    const column = columnRef.current;
    const panel = panelRef.current;
    if (!column || !panel) return;

    const mq = window.matchMedia("(min-width: 1024px)");

    function measure() {
      if (!mq.matches || !column || !panel) {
        setPinned(false);
        return;
      }

      const columnRect = column.getBoundingClientRect();
      const scrollY = window.scrollY;
      const columnTop = scrollY + columnRect.top;
      const columnBottom = columnTop + column.offsetHeight;
      const panelH = panel.offsetHeight;
      const pinTop = scrollY + HEADER_OFFSET_PX;
      const pinBottom = pinTop + panelH;

      const shouldPin =
        pinTop >= columnTop && pinBottom <= columnBottom;

      setPanelHeight(panelH);
      setPinStyle({ left: columnRect.left, width: columnRect.width });
      setPinned(shouldPin);
    }

    measure();

    const onScroll = () => measure();
    const onResize = () => measure();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    const ro = new ResizeObserver(measure);
    ro.observe(column);
    ro.observe(panel);

    mq.addEventListener("change", measure);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      mq.removeEventListener("change", measure);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={columnRef} className="relative h-full min-w-0">
      {pinned ? <div aria-hidden style={{ height: panelHeight }} /> : null}
      <div
        ref={panelRef}
        className={pinned ? "fixed z-[5]" : "relative"}
        style={
          pinned
            ? {
                top: HEADER_OFFSET_PX,
                left: pinStyle.left,
                width: pinStyle.width,
              }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}
