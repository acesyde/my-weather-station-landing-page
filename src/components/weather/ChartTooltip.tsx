"use client";

import React from "react";

export type RechartsTooltipEntry = { name?: string; value?: number | string; color?: string };
export type RechartsTooltipData = { active?: boolean; label?: string | number; payload?: RechartsTooltipEntry[] };

export function ChartTooltip({ valueFormatter, ...rest }: { valueFormatter?: (v: number | string) => string } & Partial<RechartsTooltipData>) {
  const { active, label, payload } = rest as RechartsTooltipData;
  if (!active || !payload || payload.length === 0) return null;
  const items = payload.filter((p: RechartsTooltipEntry) => p && p.value != null);
  if (items.length === 0) return null;
  const formatValue = (v: number | string) => {
    if (valueFormatter) return valueFormatter(v);
    return typeof v === "number" ? v.toFixed(2) : String(v);
  };
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 backdrop-blur px-3 py-2 shadow-lg">
      {label != null && <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">{String(label)}</div>}
      <div className="space-y-1">
        {items.map((entry: RechartsTooltipEntry, idx: number) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color || "#0ea5e9" }} />
            {entry.name && <span className="text-slate-600 dark:text-slate-300">{entry.name}:</span>}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatValue(entry.value as number | string)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChartTooltip;


