"use client";

import { useEffect, useState } from "react";
import { getCountdownState, type CountdownState } from "@/lib/countdown";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

type EventCountdownProps = {
  startIso: string;
  endIso: string;
  initialState: CountdownState;
  variant?: "default" | "hub";
};

export function EventCountdown({
  startIso,
  endIso,
  initialState,
  variant = "default",
}: EventCountdownProps) {
  const startMs = new Date(startIso).getTime();
  const endMs = new Date(endIso).getTime();
  const valid = Number.isFinite(startMs) && Number.isFinite(endMs);

  const [state, setState] = useState(initialState);

  useEffect(() => {
    if (!valid) return;

    const tick = () => setState(getCountdownState(startMs, endMs));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [valid, startMs, endMs]);

  if (!valid) return null;

  if (variant === "hub") {
    if (state.status !== "upcoming") {
      return (
        <p className="mt-2 text-base font-bold text-amber-900">
          {state.status === "live" ? "Event is live now" : "Event has ended"}
        </p>
      );
    }

    return (
      <div className="mx-auto grid max-w-[240px] grid-cols-4 gap-2">
        {state.units.map((unit) => (
          <div key={unit.label} className="flex flex-col items-center">
            <span className="text-2xl font-extrabold tabular-nums text-amber-900">
              {pad(unit.value)}
            </span>
            <span className="text-[10px] font-semibold uppercase text-amber-800">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-lg border border-brand-200 bg-brand-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
        Event starts in
      </p>

      {state.status === "upcoming" ? (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {state.units.map((unit) => (
            <div
              key={unit.label}
              className="rounded-md border border-brand-200 bg-white px-2 py-2.5 text-center"
            >
              <p className="font-mono text-xl font-bold tabular-nums text-zinc-900 sm:text-2xl">
                {pad(unit.value)}
              </p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">
                {unit.label}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {state.status === "live" ? (
        <p className="mt-2 text-lg font-semibold text-brand-800">Event is live now</p>
      ) : null}

      {state.status === "ended" ? (
        <p className="mt-2 text-lg font-semibold text-zinc-600">Event has ended</p>
      ) : null}
    </div>
  );
}
