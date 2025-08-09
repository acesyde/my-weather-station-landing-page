"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Thermometer, Droplets, Wind, Gauge, CloudRain, SunDim, MapPin, TimerReset, Leaf } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import type { CSSProperties } from "react";

const API_BASE = "";
const AUTO_REFRESH_MS = 30_000;

// ---- i18n (en/fr) ----
type Lang = "en" | "fr";

type TranslationKey =
  | "weatherStation"
  | "online"
  | "offline"
  | "updated"
  | "refresh"
  | "sampleDataError"
  | "sampleDataHint"
  | "temperature"
  | "humidity"
  | "pressure"
  | "wind"
  | "rain"
  | "uvIndex"
  | "uvShort"
  | "solar"
  | "airQuality"
  | "air"
  | "relative"
  | "seaLevelApprox"
  | "gust"
  | "today"
  | "globalIrradiance"
  | "trends"
  | "last24h"
  | "mean"
  | "metric"
  | "imperial"
  | "autoRefreshEvery"
  | "secondsShort"
  | "uvLow"
  | "uvModerate"
  | "uvHigh"
  | "uvVeryHigh"
  | "uvExtreme"
  | "aqiGood"
  | "aqiModerate"
  | "aqiSensitive"
  | "aqiUnhealthy"
  | "aqiVeryUnhealthy"
  | "aqiHazardous";

const translations: Record<Lang, Record<TranslationKey, string>> = {
  en: {
    weatherStation: "Weather Station",
    online: "Online",
    offline: "Offline",
    updated: "Updated",
    refresh: "Refresh",
    sampleDataError: "Running on sample data. Connect your API.",
    sampleDataHint: "update API_BASE & endpoints when ready.",
    temperature: "Temperature",
    humidity: "Humidity",
    pressure: "Pressure",
    wind: "Wind",
    rain: "Rain",
    uvIndex: "UV Index",
    uvShort: "UV",
    solar: "Solar",
    airQuality: "Air Quality",
    air: "Air",
    relative: "Relative",
    seaLevelApprox: "Sea‑level approx.",
    gust: "Gust",
    today: "Today",
    globalIrradiance: "Global irradiance",
    trends: "Trends",
    last24h: "last 24h",
    mean: "Mean",
    metric: "Metric",
    imperial: "Imperial",
    autoRefreshEvery: "Auto‑refresh every",
    secondsShort: "s",
    uvLow: "Low",
    uvModerate: "Moderate",
    uvHigh: "High",
    uvVeryHigh: "Very High",
    uvExtreme: "Extreme",
    aqiGood: "Good",
    aqiModerate: "Moderate",
    aqiSensitive: "Sensitive",
    aqiUnhealthy: "Unhealthy",
    aqiVeryUnhealthy: "Very Unhealthy",
    aqiHazardous: "Hazardous",
  },
  fr: {
    weatherStation: "Station météo",
    online: "En ligne",
    offline: "Hors ligne",
    updated: "Mis à jour",
    refresh: "Actualiser",
    sampleDataError: "Utilisation de données d'exemple. Connectez votre API.",
    sampleDataHint: "mettez à jour API_BASE et les endpoints lorsque prêt.",
    temperature: "Température",
    humidity: "Humidité",
    pressure: "Pression",
    wind: "Vent",
    rain: "Pluie",
    uvIndex: "Indice UV",
    uvShort: "UV",
    solar: "Solaire",
    airQuality: "Qualité de l’air",
    air: "Air",
    relative: "Relative",
    seaLevelApprox: "Niveau de la mer (approx.)",
    gust: "Rafale",
    today: "Aujourd’hui",
    globalIrradiance: "Irradiance globale",
    trends: "Tendances",
    last24h: "dernières 24 h",
    mean: "Moyenne",
    metric: "Métrique",
    imperial: "Impérial",
    autoRefreshEvery: "Rafraîchissement auto toutes les",
    secondsShort: "s",
    uvLow: "Faible",
    uvModerate: "Modéré",
    uvHigh: "Élevé",
    uvVeryHigh: "Très élevé",
    uvExtreme: "Extrême",
    aqiGood: "Bon",
    aqiModerate: "Modéré",
    aqiSensitive: "Sensible",
    aqiUnhealthy: "Mauvais",
    aqiVeryUnhealthy: "Très mauvais",
    aqiHazardous: "Dangereux",
  },
};

function detectLocale(): Lang {
  try {
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    const raw = nav?.language || nav?.languages?.[0] || "en";
    return raw.toLowerCase().startsWith("fr") ? "fr" : "en";
  } catch {
    return "en";
  }
}

interface LocationInfo {
  name?: string;
  lat?: number;
  lon?: number;
}

interface LatestWeather {
  station_name?: string;
  location?: LocationInfo;
  timestamp?: string;
  temperature_c?: number;
  humidity_pct?: number;
  pressure_hpa?: number;
  wind_speed_ms?: number;
  wind_gust_ms?: number;
  wind_dir_deg?: number;
  rain_rate_mm_h?: number;
  rain_daily_mm?: number;
  uv_index?: number;
  solar_w_m2?: number;
  aqi?: number;
}

interface HistoryPoint {
  t: string;
  temperature_c?: number;
  humidity_pct?: number;
  pressure_hpa?: number;
  wind_speed_ms?: number;
  wind_gust_ms?: number;
  rain_rate_mm_h?: number;
  rain_daily_mm?: number;
  uv_index?: number;
}

const SAMPLE_LATEST: LatestWeather = {
  station_name: "Maison de Acesyde",
  location: { name: "Bordeaux, FR", lat: 44.84, lon: -0.58 },
  timestamp: new Date().toISOString(),
  temperature_c: 24.6,
  humidity_pct: 58,
  pressure_hpa: 1016.3,
  wind_speed_ms: 2.4,
  wind_gust_ms: 5.1,
  wind_dir_deg: 230,
  rain_rate_mm_h: 0.0,
  rain_daily_mm: 0.8,
  uv_index: 6.2,
  solar_w_m2: 780,
  aqi: 22,
};

function hoursAgo(h: number) {
  const d = new Date();
  d.setHours(d.getHours() - h);
  return d.toISOString();
}

const SAMPLE_HISTORY: HistoryPoint[] = Array.from({ length: 24 }).map((_, i) => {
  const baseT = 18 + Math.sin((i / 24) * Math.PI * 2) * 5 + (Math.random() - 0.5);
  return {
    t: hoursAgo(24 - i),
    temperature_c: Number(baseT.toFixed(2)),
    humidity_pct: Math.round(55 + Math.cos((i / 24) * Math.PI * 2) * 15),
    pressure_hpa: Number((1014 + Math.sin(i / 8) * 2).toFixed(1)),
    wind_speed_ms: Number((1.5 + Math.random() * 3).toFixed(1)),
    wind_gust_ms: Number((2.5 + Math.random() * 4).toFixed(1)),
    rain_rate_mm_h: i % 7 === 0 ? Number((Math.random() * 2).toFixed(1)) : 0,
    rain_daily_mm: Number((i * 0.03).toFixed(2)),
    uv_index: Math.max(0, Number((Math.sin(((i - 6) / 24) * Math.PI) * 7).toFixed(1))),
  };
});

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

function fmtRelative(iso?: string, lang: Lang = "en") {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.round((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return lang === "fr" ? `il y a ${diff}s` : `${diff}s ago`;
  if (diff < 3600) return lang === "fr" ? `il y a ${Math.floor(diff / 60)}m` : `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return lang === "fr" ? `il y a ${Math.floor(diff / 3600)}h` : `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleString(lang);
}

function degToCompass(deg?: number) {
  if (deg == null) return "—";
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  const idx = Math.round(((deg % 360) / 22.5)) % 16;
  return dirs[idx];
}

const UnitSystem = {
  METRIC: "metric",
  IMPERIAL: "imperial",
} as const;

function useI18n() {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    setLang(detectLocale());
  }, []);
  const t = (key: TranslationKey) => translations[lang][key];
  return { lang, t };
}

function useUnitToggle() {
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

function toF(c?: number) {
  return c == null ? undefined : (c * 9) / 5 + 32;
}
function toMPH(ms?: number) {
  return ms == null ? undefined : ms * 2.236936;
}
function toKPH(ms?: number) {
  return ms == null ? undefined : ms * 3.6;
}
function toInHg(hpa?: number) {
  return hpa == null ? undefined : hpa * 0.0295299830714;
}
function toIn(mm?: number) {
  return mm == null ? undefined : mm / 25.4;
}

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function WeatherStationLanding() {
  const [latest, setLatest] = useState<LatestWeather>(SAMPLE_LATEST);
  const [history, setHistory] = useState<HistoryPoint[]>(SAMPLE_HISTORY);
  const [error, setError] = useState<string | null>(null);
  const { unit, setUnit } = useUnitToggle();
  const { lang, t } = useI18n();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setError(null);
      try {
        const [l, h] = await Promise.all([
          fetchJSON<LatestWeather>("/api/weather/latest"),
          fetchJSON<HistoryPoint[] | { points: HistoryPoint[] }>("/api/weather/history"),
        ] as const);
        if (!cancelled) {
          setLatest(l);
          const points = Array.isArray(h) ? h : h.points;
          setHistory(points);
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.warn("Using sample data (API not reachable)", message);
        if (!cancelled) {
          setError(translations[lang].sampleDataError);
          // Ensure sample data is applied so changes to SAMPLE_* are reflected during dev
          setLatest(SAMPLE_LATEST);
          setHistory(SAMPLE_HISTORY);
        }
      }
    };
    load();
    const id = setInterval(load, AUTO_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
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
              <h1 className="text-3xl md:text-5xl font-black tracking-tight">{latest?.station_name || t("weatherStation")}</h1>
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
        {error && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">{error} — {t("sampleDataHint")}</div>
        )}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <SensorCard title={t("temperature")} value={display.temperature} icon={<Thermometer />} subtitle={t("air")} />
          <SensorCard title={t("humidity")} value={display.humidity} icon={<Droplets />} subtitle={t("relative")} />
          <SensorCard title={t("pressure")} value={display.pressure} icon={<Gauge />} subtitle={t("seaLevelApprox")} />
          <SensorCard title={t("wind")} value={`${display.windSpeed}`} icon={<Wind />} subtitle={`${t("gust")} ${display.windGust} • ${degToCompass(display.windDir)} (${display.windDir ?? "—"}°)`} />
          <SensorCard title={t("rain")} value={display.rainRate} icon={<CloudRain />} subtitle={`${t("today")} ${display.rainDaily}`} />
          <SensorCard title={t("uvIndex")} value={String(display.uv)} icon={<SunDim />} subtitle={uvCategory(latest?.uv_index, lang)} />
          <SensorCard title={t("solar")} value={String(display.solar)} icon={<SunDim />} subtitle={t("globalIrradiance")} />
          <SensorCard title={t("airQuality")} value={String(display.aqi)} icon={<Leaf />} subtitle={aqiCategory(latest?.aqi, lang)} />
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

function UnitToggle({ unit, onChange }: { unit: typeof UnitSystem[keyof typeof UnitSystem]; onChange: (u: typeof UnitSystem[keyof typeof UnitSystem]) => void }) {
  const { t } = useI18n();
  return (
    <div className="inline-flex rounded-2xl bg-white/60 backdrop-blur border border-slate-200 overflow-hidden dark:bg-slate-800/60 dark:border-slate-700">
      <button onClick={() => onChange(UnitSystem.METRIC)} className={cn("px-3 py-1.5 text-sm", unit === UnitSystem.METRIC ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-600 dark:text-slate-300")}>{t("metric")}</button>
      <button onClick={() => onChange(UnitSystem.IMPERIAL)} className={cn("px-3 py-1.5 text-sm", unit === UnitSystem.IMPERIAL ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-600 dark:text-slate-300")}>{t("imperial")}</button>
    </div>
  );
}

function SensorCard({ title, value, icon, subtitle }: { title: string; value: string; icon: React.ReactNode; subtitle?: string }) {
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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur">
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}

type RechartsTooltipEntry = { name?: string; value?: number | string; color?: string };
type RechartsTooltipData = { active?: boolean; label?: string | number; payload?: RechartsTooltipEntry[] };

function ChartTooltip({ valueFormatter, ...rest }: { valueFormatter?: (v: number | string) => string } & Partial<RechartsTooltipData>) {
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

function uvCategory(uv?: number, lang: Lang = "en") {
  const t = (key: TranslationKey) => translations[lang][key];
  if (uv == null) return "—";
  if (uv < 3) return t("uvLow");
  if (uv < 6) return t("uvModerate");
  if (uv < 8) return t("uvHigh");
  if (uv < 11) return t("uvVeryHigh");
  return t("uvExtreme");
}

function aqiCategory(aqi?: number, lang: Lang = "en") {
  const t = (key: TranslationKey) => translations[lang][key];
  if (aqi == null) return "—";
  if (aqi <= 50) return t("aqiGood");
  if (aqi <= 100) return t("aqiModerate");
  if (aqi <= 150) return t("aqiSensitive");
  if (aqi <= 200) return t("aqiUnhealthy");
  if (aqi <= 300) return t("aqiVeryUnhealthy");
  return t("aqiHazardous");
}

function AnimatedBackground({
  isNight,
  isRaining,
  isWindy,
  cloudiness,
}: {
  isNight: boolean;
  isRaining: boolean;
  isWindy: boolean;
  cloudiness: "low" | "med" | "high";
}) {
  type CloudSpec = {
    key: string;
    topPct: number;
    scale: number;
    duration: number;
    delay: number;
    opacity: number;
  };
  type DropSpec = {
    key: string;
    leftPct: number;
    duration: number;
    delay: number;
    height: number;
    opacity: number;
  };
  type GustSpec = {
    key: string;
    topPct: number;
    duration: number;
    delay: number;
    opacity: number;
  };

  const clouds = useMemo(() => {
    const count = cloudiness === "high" ? 10 : cloudiness === "med" ? 6 : 3;
    return Array.from({ length: count }).map((_, i): CloudSpec => ({
      key: `cloud-${i}`,
      topPct: 5 + ((i * 97) % 70),
      scale: 0.8 + ((i * 37) % 40) / 40,
      duration: 40 + ((i * 13) % 35),
      delay: (i * 7) % 20,
      opacity: isNight ? 0.15 : 0.35,
    }));
  }, [cloudiness, isNight]);

  const drops = useMemo(() => {
    if (!isRaining) return [] as DropSpec[];
    const count = 80;
    return Array.from({ length: count }).map((_, i): DropSpec => ({
      key: `drop-${i}`,
      leftPct: (i * 127) % 100,
      duration: 0.8 + ((i * 17) % 50) / 50,
      delay: ((i * 37) % 100) / 50,
      height: 10 + ((i * 29) % 20),
      opacity: isNight ? 0.35 : 0.5,
    }));
  }, [isRaining, isNight]);

  const gusts = useMemo(() => {
    if (!isWindy) return [] as GustSpec[];
    const count = 12;
    return Array.from({ length: count }).map((_, i): GustSpec => ({
      key: `gust-${i}`,
      topPct: ((i * 73) % 90) + 5,
      duration: 6 + ((i * 19) % 8),
      delay: ((i * 11) % 30) / 3,
      opacity: isNight ? 0.15 : 0.25,
    }));
  }, [isWindy, isNight]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      {/* Base sky gradient with subtle animated hue/position shift */}
      <div className={cn(
        "absolute inset-0 animate-[gradientShift_20s_linear_infinite]",
        isNight
          ? "bg-gradient-to-b from-slate-900 via-slate-950 to-black"
          : "bg-gradient-to-b from-sky-100 via-cyan-100 to-white"
      )} />

      {/* Sun/Moon glow */}
      <div className={cn(
        "absolute -top-20 right-10 h-72 w-72 rounded-full blur-3xl",
        isNight ? "bg-slate-400/10" : "bg-amber-200/40"
      )} />

      {/* Clouds */}
      {clouds.map((c) => (
        <div
          key={c.key}
          className="absolute -left-1/3 w-[50vw] h-24 md:h-28 lg:h-32 opacity-70"
          style={{
            top: `${c.topPct}%`,
            animation: `cloudDrift ${c.duration}s linear ${c.delay}s infinite`,
            opacity: c.opacity,
            filter: "blur(2px)",
            ['--cloud-scale']: c.scale,
          } as CSSProperties & { ['--cloud-scale']: number }}
        >
          <div className={cn(
            "absolute inset-0",
            isNight ? "bg-slate-300/30" : "bg-white/70"
          )} style={{ borderRadius: "40px", boxShadow: "0 20px 40px rgba(0,0,0,0.06)" }} />
          <div className={cn(
            "absolute -top-6 left-8 h-16 w-24 rounded-full",
            isNight ? "bg-slate-200/25" : "bg-white/70"
          )} />
          <div className={cn(
            "absolute -top-4 left-36 h-14 w-20 rounded-full",
            isNight ? "bg-slate-200/25" : "bg-white/70"
          )} />
        </div>
      ))}

      {/* Rain */}
      {drops.map((d) => (
        <span
          key={d.key}
          className="absolute top-[-10%] w-[1px] bg-sky-500/60"
          style={{
            left: `${d.leftPct}%`,
            height: `${d.height}px`,
            animation: `rainFall ${d.duration}s linear ${d.delay}s infinite`,
            opacity: d.opacity,
          }}
        />
      ))}

      {/* Wind gust trails */}
      {gusts.map((g) => (
        <span
          key={g.key}
          className="absolute left-[-20%] h-[2px] w-[25vw] rounded-full bg-cyan-400/30"
          style={{
            top: `${g.topPct}%`,
            animation: `gustMove ${g.duration}s ease-in-out ${g.delay}s infinite`,
            opacity: g.opacity,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes gradientShift {
          0% { transform: translateY(0); filter: hue-rotate(0deg); }
          50% { transform: translateY(-1.5%); filter: hue-rotate(6deg); }
          100% { transform: translateY(0); filter: hue-rotate(0deg); }
        }
        @keyframes cloudDrift {
          0% { transform: translateX(0) scale(var(--cloud-scale, 1)); }
          100% { transform: translateX(140%) scale(var(--cloud-scale, 1)); }
        }
        @keyframes rainFall {
          0% { transform: translateY(-10vh); }
          100% { transform: translateY(110vh); }
        }
        @keyframes gustMove {
          0% { transform: translateX(0) translateY(0) skewX(-10deg); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translateX(130%) translateY(-10px) skewX(-10deg); opacity: 0.7; }
          100% { transform: translateX(260%) translateY(-18px) skewX(-10deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
