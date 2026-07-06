"use client";

import React from "react";

type ScalarStat = {
  label: string;
  value: string | number;
  helper?: string;
  accent?: "default" | "green" | "amber" | "red" | "blue";
};

type ChartDatum = { label: string; value: number };

export function DashboardSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 sm:text-lg">{title}</h2>
        {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function StatCards({ items }: { items: ScalarStat[] }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 flex-1 rounded-xl border-2 border-brand-400 bg-white p-4 shadow-sm ring-1 ring-brand-200 sm:p-5"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 sm:text-sm">
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            {item.value}
          </p>
          {item.helper ? (
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{item.helper}</p>
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
  data: ChartDatum[];
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
      <div className="mt-4 flex flex-1 items-end gap-2 overflow-x-auto pb-1 sm:gap-3">
        {data.length === 0 ? (
          <p className="text-sm text-zinc-500">No data yet.</p>
        ) : (
          data.map((d) => {
            const heightPct = (d.value / max) * 100;
            return (
              <div
                key={d.label}
                className="flex min-w-[3rem] flex-1 flex-col items-center gap-1 sm:min-w-0"
              >
                <div className="flex h-44 w-full items-end rounded-md bg-zinc-100/80">
                  <div
                    className="mx-auto w-full max-w-[2rem] rounded-t-md bg-brand-500 shadow-sm transition-all"
                    style={{ height: `${Math.max(heightPct, d.value > 0 ? 4 : 0)}%` }}
                    title={`${d.label}: ${d.value}`}
                  />
                </div>
                <span className="max-w-full truncate text-center text-[10px] font-medium text-zinc-600 sm:text-xs">
                  {d.label}
                </span>
                <span className="text-xs font-semibold text-zinc-800">{d.value}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

