"use client";

import React from "react";
import { useI18n } from "@/components/weather/i18n";
import { UnitSystem } from "@/components/weather/UnitSystem";
import { cn } from "@/lib/utils";

export function UnitToggle({
  unit,
  onChange,
}: {
  unit: typeof UnitSystem[keyof typeof UnitSystem];
  onChange: (u: typeof UnitSystem[keyof typeof UnitSystem]) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="inline-flex rounded-2xl bg-white/60 backdrop-blur border border-slate-200 overflow-hidden dark:bg-slate-800/60 dark:border-slate-700">
      <button
        onClick={() => onChange(UnitSystem.METRIC)}
        className={cn(
          "px-3 py-1.5 text-sm",
          unit === UnitSystem.METRIC ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-600 dark:text-slate-300"
        )}
      >
        {t("metric")}
      </button>
      <button
        onClick={() => onChange(UnitSystem.IMPERIAL)}
        className={cn(
          "px-3 py-1.5 text-sm",
          unit === UnitSystem.IMPERIAL ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-600 dark:text-slate-300"
        )}
      >
        {t("imperial")}
      </button>
    </div>
  );
}

export default UnitToggle;


