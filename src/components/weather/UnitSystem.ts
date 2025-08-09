"use client";

import { useEffect, useState } from "react";

export const UnitSystem = {
  METRIC: "metric",
  IMPERIAL: "imperial",
} as const;

export function useUnitToggle() {
  const [unit, setUnit] = useState<typeof UnitSystem[keyof typeof UnitSystem]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("unitSystem") : null;
      return saved === UnitSystem.IMPERIAL || saved === UnitSystem.METRIC ? saved : UnitSystem.METRIC;
    } catch {
      return UnitSystem.METRIC;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("unitSystem", unit);
    } catch {}
  }, [unit]);
  return { unit, setUnit };
}

export function toF(c?: number) {
  return c == null ? undefined : (c * 9) / 5 + 32;
}
export function toMPH(ms?: number) {
  return ms == null ? undefined : ms * 2.236936;
}
export function toKPH(ms?: number) {
  return ms == null ? undefined : ms * 3.6;
}
export function toInHg(hpa?: number) {
  return hpa == null ? undefined : hpa * 0.0295299830714;
}
export function toIn(mm?: number) {
  return mm == null ? undefined : mm / 25.4;
}


