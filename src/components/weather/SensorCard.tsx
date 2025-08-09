"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SensorCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <Card className="rounded-2xl shadow-sm hover:shadow transition-shadow bg-white/70 dark:bg-slate-900/60 backdrop-blur border-slate-200/80 dark:border-slate-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200">{icon}</span>
            {title}
          </CardTitle>
          {subtitle && <span className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</span>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl md:text-4xl font-black tracking-tight tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

export default SensorCard;


