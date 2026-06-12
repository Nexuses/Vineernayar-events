"use client";

import React from "react";

type ScalarStat = {
  label: string;
  value: string | number;
  helper?: string;
};

type BarDatum = { label: string; value: number };

type PieDatum = { label: string; value: number };

export function StatCards({ items }: { items: ScalarStat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm ring-1 ring-zinc-100 sm:p-5"
        >
          <p className="text-sm font-medium text-zinc-500">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            {item.value}
          </p>
          {item.helper ? (
            <p className="mt-1 text-xs text-zinc-500">{item.helper}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function BarChartCard({
  title,
  description,
  data,
}: {
  title: string;
  description?: string;
  data: BarDatum[];
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
          {title}
        </h2>
        {description ? (
          <p className="text-xs text-zinc-500 sm:text-[13px]">{description}</p>
        ) : null}
      </div>
      <div className="mt-4 flex flex-1 items-end gap-3">
        {data.length === 0 ? (
          <p className="text-sm text-zinc-500">No data yet.</p>
        ) : (
          data.map((d) => {
            const heightPct = (d.value / max) * 100;
            return (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-40 w-full items-end rounded-md bg-zinc-100/60">
                  <div
                    className="mx-auto w-6 rounded-md bg-brand-500 shadow-sm"
                    style={{ height: `${heightPct || 2}%` }}
                    aria-label={`${d.label}: ${d.value}`}
                  />
                </div>
                <span className="truncate text-xs font-medium text-zinc-600">
                  {d.label}
                </span>
                <span className="text-xs text-zinc-500">{d.value}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const PIE_COLORS = ["#f8e828", "#22c55e", "#3b82f6", "#a855f7", "#eab308"];

export function PieChartCard({
  title,
  description,
  data,
}: {
  title: string;
  description?: string;
  data: PieDatum[];
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  let offset = 0;
  const segments = total
    ? data
        .map((d, index) => {
          const start = offset;
          const pct = (d.value / total) * 100;
          const end = start + pct;
          const color = PIE_COLORS[index % PIE_COLORS.length];
          offset = end;
          return `${color} ${start}% ${end}%`;
        })
        .join(", ")
    : "";

  const backgroundImage = total ? `conic-gradient(${segments})` : "conic-gradient(#e5e7eb 0 100%)";

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
          {title}
        </h2>
        {description ? (
          <p className="text-xs text-zinc-500 sm:text-[13px]">{description}</p>
        ) : null}
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className="mx-auto h-40 w-40 rounded-full border border-zinc-200 bg-white shadow-sm"
          style={{ backgroundImage }}
          aria-hidden
        />
        <div className="flex-1 space-y-2">
          {data.length === 0 ? (
            <p className="text-sm text-zinc-500">No data yet.</p>
          ) : (
            data.map((d, index) => {
              const color = PIE_COLORS[index % PIE_COLORS.length];
              const pct = total ? Math.round((d.value / total) * 100) : 0;
              return (
                <div key={d.label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-medium text-zinc-700 sm:text-sm">
                      {d.label}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500 sm:text-sm">
                    {d.value} ({pct}%)
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

