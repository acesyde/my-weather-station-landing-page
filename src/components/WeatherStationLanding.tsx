"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Thermometer, Droplets, Wind, Gauge, CloudRain, SunDim, MapPin, TimerReset, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import AnimatedBackground from "@/components/weather/AnimatedBackground";
import ChartCard from "@/components/weather/ChartCard";
import ChartTooltip from "@/components/weather/ChartTooltip";
import SensorCard from "@/components/weather/SensorCard";
import UnitToggle from "@/components/weather/UnitToggle";
import { useI18n } from "@/components/weather/i18n";
import { UnitSystem, useUnitToggle, toF, toKPH, toMPH, toInHg, toIn } from "@/components/weather/UnitSystem";
import type { LatestWeather, HistoryPoint } from "@/components/weather/types";
import { fmtRelative, degToCompass, uvCategory, aqiCategory } from "@/components/weather/utils";
import { cn } from "@/lib/utils";

const API_BASE = "";
const AUTO_REFRESH_MS = 30_000;



type HttpError = Error & { status?: number };
function httpError(status: number, message: string): HttpError {
  const err = new Error(message) as HttpError;
  err.status = status;
  return err;
}

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    try {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = (await res.json()) as { error?: string } | unknown;
        const maybeError = (body as { error?: string }).error;
        const msg: string = typeof maybeError === "string" && maybeError.length > 0 ? maybeError : `HTTP ${res.status}`;
        throw httpError(res.status, msg);
      } else {
        const text = await res.text();
        throw httpError(res.status, text && text.length > 0 ? text : `HTTP ${res.status}`);
      }
    } catch {
      // Fallback if parsing failed
      throw httpError(res.status, `HTTP ${res.status}`);
    }
  }
  return res.json();
}

async function fetchWeatherData(): Promise<{ latest: LatestWeather; history: HistoryPoint[] }> {
  const [latest, historyResponse] = await Promise.all([
    fetchJSON<LatestWeather>("/api/weather/latest"),
    fetchJSON<HistoryPoint[] | { points: HistoryPoint[] }>("/api/weather/history"),
  ]);
  
  const history = Array.isArray(historyResponse) ? historyResponse : historyResponse.points;
  return { latest, history };
}

export default function WeatherStationLanding() {
  const [latest, setLatest] = useState<LatestWeather | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { unit, setUnit } = useUnitToggle();
  const { lang, t } = useI18n();

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    
    const load = async () => {
      try {
        setError(null);
        const { latest: l, history: points } = await fetchWeatherData();
        if (!cancelled) {
          setLatest(l);
          setHistory(points);
          setLoading(false);
        }
      } catch (e: unknown) {
        const status = (e as { status?: number })?.status;
        const message = e instanceof Error ? e.message : String(e);
        console.warn("Weather API error", status, message);
        if (!cancelled) {
          setError(message || "Failed to load weather data");
          setLoading(false);
          // Stop auto-refresh on server errors to avoid looping
          if (typeof status === "number" && status >= 500 && intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      }
    };
    
    load();
    intervalId = setInterval(load, AUTO_REFRESH_MS);
    
    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [lang]);

  const online = useMemo(() => {
    if (!latest?.timestamp) return false;
    const ageMs = Date.now() - new Date(latest.timestamp).getTime();
    return ageMs < 5 * 60 * 1000;
  }, [latest?.timestamp]);

  const display = useMemo(() => {
    const isMetric = unit === UnitSystem.METRIC;
    const temp = latest?.temperature_c;
    const wind = {
      speed: isMetric ? toKPH(latest?.wind_speed_ms) : toMPH(latest?.wind_speed_ms),
      gust: isMetric ? toKPH(latest?.wind_gust_ms) : toMPH(latest?.wind_gust_ms),
      unit: isMetric ? "km/h" : "mph",
    };
    const pressure = isMetric ? latest?.pressure_hpa : toInHg(latest?.pressure_hpa);
    const rainRate = isMetric ? latest?.rain_rate_mm_h : toIn(latest?.rain_rate_mm_h);
    const rainDaily = isMetric ? latest?.rain_daily_mm : toIn(latest?.rain_daily_mm);
    return {
      temperature: temp == null ? "—" : isMetric ? `${temp.toFixed(1)}°C` : `${toF(temp)?.toFixed(1)}°F`,
      humidity: latest?.humidity_pct == null ? "—" : `${latest.humidity_pct}%`,
      pressure: pressure == null ? "—" : isMetric ? `${pressure.toFixed(1)} hPa` : `${pressure.toFixed(2)} inHg`,
      windSpeed: wind.speed == null ? "—" : `${wind.speed.toFixed(1)} ${wind.unit}`,
      windGust: wind.gust == null ? "—" : `${wind.gust.toFixed(1)} ${wind.unit}`,
      windDir: latest?.wind_dir_deg,
      rainRate: rainRate == null ? "—" : isMetric ? `${rainRate.toFixed(1)} mm/h` : `${rainRate.toFixed(2)} in/h`,
      rainDaily: rainDaily == null ? "—" : isMetric ? `${rainDaily.toFixed(1)} mm` : `${rainDaily.toFixed(2)} in`,
      uv: latest?.uv_index == null ? "—" : latest.uv_index.toFixed(1),
      solar: latest?.solar_w_m2 == null ? "—" : `${latest.solar_w_m2} W/m²`,
      aqi: latest?.aqi == null ? "—" : latest.aqi,
    };
  }, [latest, unit]);

  const chartData = useMemo(() => {
    const isMetric = unit === UnitSystem.METRIC;
    return history.map((p) => ({
      time: new Date(p.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      temperature: isMetric ? p.temperature_c : p.temperature_c != null ? toF(p.temperature_c) : undefined,
      humidity: p.humidity_pct,
      pressure: isMetric ? p.pressure_hpa : p.pressure_hpa != null ? toInHg(p.pressure_hpa) : undefined,
      wind: isMetric ? toKPH(p.wind_speed_ms) : toMPH(p.wind_speed_ms),
      gust: isMetric ? toKPH(p.wind_gust_ms) : toMPH(p.wind_gust_ms),
      rainRate: isMetric ? p.rain_rate_mm_h : toIn(p.rain_rate_mm_h),
      uv: p.uv_index,
    }));
  }, [history, unit]);

  const conditions = useMemo(() => {
    const solarRaw = latest?.solar_w_m2;
    const uvRaw = latest?.uv_index;
    const solar = Number(solarRaw ?? NaN);
    const uv = Number(uvRaw ?? NaN);
    const rainRate = Number(latest?.rain_rate_mm_h ?? 0);
    const windSpeedMs = Number(latest?.wind_speed_ms ?? 0);
    const windGustMs = Number(latest?.wind_gust_ms ?? 0);

    const hasSolar = !isNaN(solar) && solarRaw != null;
    const hasUv = !isNaN(uv) && uvRaw != null;
    let isNight = false;
    if (hasSolar && hasUv) {
      // If both available, require both to indicate night
      isNight = solar < 50 && uv < 1.0;
    } else if (hasSolar) {
      isNight = solar < 50;
    } else if (hasUv) {
      isNight = uv < 1.0;
    } else {
      const hour = new Date(latest?.timestamp ?? Date.now()).getHours();
      isNight = hour < 6 || hour > 18;
    }
    const isRaining = (isNaN(rainRate) ? 0 : rainRate) > 0.05;
    const isWindy = (isNaN(windGustMs) ? 0 : windGustMs) > 6 || (isNaN(windSpeedMs) ? 0 : windSpeedMs) > 4;

    let cloudiness: "low" | "med" | "high" = "low";
    if (!isNight) {
      if (solar < 150 || uv < 2) cloudiness = "high";
      else if (solar < 350 || uv < 4) cloudiness = "med";
      else cloudiness = "low";
    } else {
      cloudiness = "med";
    }

    return { isNight, isRaining, isWindy, cloudiness };
  }, [latest]);

  return (
    <div className="relative min-h-screen text-slate-900 dark:text-slate-100 overflow-hidden">
      <AnimatedBackground isNight={conditions.isNight} isRaining={conditions.isRaining} isWindy={conditions.isWindy} cloudiness={conditions.cloudiness} />
      <header className="relative overflow-hidden">
        {/* Decorative header glow retained lightly for depth */}
        <div className="absolute inset-0 -z-10 opacity-30 blur-3xl" aria-hidden>
          <div className="h-72 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-300 via-cyan-200 to-transparent dark:from-cyan-700/30 dark:via-sky-600/20" />
        </div>
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight">{latest?.station_name || "Weather Station"}</h1>
              <div className="mt-2 flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">
                  {latest?.location?.name || "—"}
                  {latest?.location?.lat != null && latest?.location?.lon != null && (
                    <span className="ml-2 opacity-70">({latest.location.lat.toFixed(2)}, {latest.location.lon.toFixed(2)})</span>
                  )}
                </span>
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", online ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200" : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200")}>
                  <span className={cn("h-2 w-2 rounded-full", online ? "bg-emerald-500" : "bg-rose-500")} />
                  {online ? t("online") : t("offline")}
                </span>
                <TimerReset className="h-4 w-4" />
                <span className="text-sm" suppressHydrationWarning>
                  {t("updated")} {fmtRelative(latest?.timestamp, lang)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UnitToggle unit={unit} onChange={setUnit} />
              <Button variant="outline" size="sm" onClick={() => location.reload()}>{t("refresh")}</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-16">
        {loading && (
          <div className="mb-6 rounded-xl border border-blue-300 bg-blue-50 p-4 text-blue-900 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-200">
            Loading weather data...
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <SensorCard title={t("temperature")} value={display.temperature} icon={<Thermometer />} subtitle={t("air")} />
          <SensorCard title={t("humidity")} value={display.humidity} icon={<Droplets />} subtitle={t("relative")} />
          <SensorCard title={t("pressure")} value={display.pressure} icon={<Gauge />} subtitle={t("seaLevelApprox")} />
          <SensorCard title={t("wind")} value={`${display.windSpeed}`} icon={<Wind />} subtitle={`${t("gust")} ${display.windGust} • ${degToCompass(display.windDir)} (${display.windDir ?? "—"}°)`} />
          <SensorCard title={t("rain")} value={display.rainRate} icon={<CloudRain />} subtitle={`${t("today")} ${display.rainDaily}`} />
          <SensorCard
            title={t("uvIndex")}
            value={String(display.uv)}
            icon={<SunDim />}
            subtitle={uvCategory(
              latest?.uv_index,
              (k) => t(k as unknown as import("@/components/weather/i18n").TranslationKey)
            )}
          />
          <SensorCard title={t("solar")} value={String(display.solar)} icon={<SunDim />} subtitle={t("globalIrradiance")} />
          <SensorCard
            title={t("airQuality")}
            value={String(display.aqi)}
            icon={<Leaf />}
            subtitle={aqiCategory(
              latest?.aqi,
              (k) => t(k as unknown as import("@/components/weather/i18n").TranslationKey)
            )}
          />
        </section>

        <section className="mt-10">
          <Tabs defaultValue="temperature" className="w-full">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{t("trends")} ({t("last24h")})</h2>
              <TabsList>
                <TabsTrigger value="temperature">{t("temperature")}</TabsTrigger>
                <TabsTrigger value="humidity">{t("humidity")}</TabsTrigger>
                <TabsTrigger value="pressure">{t("pressure")}</TabsTrigger>
                <TabsTrigger value="wind">{t("wind")}</TabsTrigger>
                <TabsTrigger value="rain">{t("rain")}</TabsTrigger>
                <TabsTrigger value="uv">{t("uvShort")}</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="temperature" className="mt-4">
              <ChartCard title={`${t("temperature")} (${unit === UnitSystem.METRIC ? "°C" : "°F"})`}>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="grad-temperature" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                        <stop offset="70%" stopColor="#f59e0b" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                    <XAxis dataKey="time" minTickGap={24} />
                    <YAxis domain={["auto", "auto"]} />
                    <Tooltip content={<ChartTooltip valueFormatter={(v) => `${Number(v).toFixed(1)} ${unit === UnitSystem.METRIC ? "°C" : "°F"}`} />} />
                    <Area type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2.5} dot={false} fill="url(#grad-temperature)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </TabsContent>

            <TabsContent value="humidity" className="mt-4">
              <ChartCard title={`${t("humidity")} (%)`}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                    <XAxis dataKey="time" minTickGap={24} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip content={<ChartTooltip valueFormatter={(v) => `${Number(v).toFixed(0)} %`} />} />
                    <Line type="monotone" dataKey="humidity" dot={false} stroke="#0ea5e9" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </TabsContent>

            <TabsContent value="pressure" className="mt-4">
              <ChartCard title={`${t("pressure")} (${unit === UnitSystem.METRIC ? "hPa" : "inHg"})`}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                    <XAxis dataKey="time" minTickGap={24} />
                    <YAxis domain={["auto", "auto"]} />
                    <Tooltip content={<ChartTooltip valueFormatter={(v) => `${Number(v).toFixed(unit === UnitSystem.METRIC ? 1 : 2)} ${unit === UnitSystem.METRIC ? "hPa" : "inHg"}`} />} />
                    <Line type="monotone" dataKey="pressure" dot={false} stroke="#8b5cf6" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </TabsContent>

            <TabsContent value="wind" className="mt-4">
              <ChartCard title={`${t("wind")} (${unit === UnitSystem.METRIC ? "km/h" : "mph"})`}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                    <XAxis dataKey="time" minTickGap={24} />
                    <YAxis domain={[0, "auto"]} />
                    <Tooltip content={<ChartTooltip valueFormatter={(v) => `${Number(v).toFixed(1)} ${unit === UnitSystem.METRIC ? "km/h" : "mph"}`} />} />
                    <Legend />
                    <Line type="monotone" dataKey="wind" name={t("mean")} dot={false} stroke="#10b981" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="gust" name={t("gust")} dot={false} stroke="#06b6d4" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </TabsContent>

            <TabsContent value="rain" className="mt-4">
              <ChartCard title={`${t("rain")} (${unit === UnitSystem.METRIC ? "mm/h" : "in/h"})`}>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="grad-rain" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="70%" stopColor="#6366f1" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                    <XAxis dataKey="time" minTickGap={24} />
                    <YAxis domain={[0, "auto"]} />
                    <Tooltip content={<ChartTooltip valueFormatter={(v) => `${Number(v).toFixed(2)} ${unit === UnitSystem.METRIC ? "mm/h" : "in/h"}`} />} />
                    <Area type="step" dataKey="rainRate" stroke="#6366f1" strokeWidth={2} dot={false} fill="url(#grad-rain)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </TabsContent>

            <TabsContent value="uv" className="mt-4">
              <ChartCard title={t("uvIndex")}>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="grad-uv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#eab308" stopOpacity={0.35} />
                        <stop offset="70%" stopColor="#eab308" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#eab308" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                    <XAxis dataKey="time" minTickGap={24} />
                    <YAxis domain={[0, 12]} />
                    <Tooltip content={<ChartTooltip valueFormatter={(v) => `${Number(v).toFixed(1)} UV`} />} />
                    <Area type="monotone" dataKey="uv" stroke="#eab308" strokeWidth={2.5} dot={false} fill="url(#grad-uv)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <footer className="border-t border-slate-200/60 dark:border-slate-800 mt-12">
        <div className="mx-auto max-w-7xl px-6 py-6 text-sm text-slate-500 dark:text-slate-400 flex flex-col md:flex-row items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} Acesyde — {t("weatherStation")}</span>
          <span className="opacity-80">{t("autoRefreshEvery")} {AUTO_REFRESH_MS / 1000}{t("secondsShort")}</span>
        </div>
      </footer>
    </div>
  );
}