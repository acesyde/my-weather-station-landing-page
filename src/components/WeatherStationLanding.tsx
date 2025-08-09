"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Thermometer, Droplets, Wind, Gauge, CloudRain, SunDim, MapPin, TimerReset, Leaf } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";

const API_BASE = "";
const AUTO_REFRESH_MS = 30_000;

const SAMPLE_LATEST = {
  station_name: "Maison de Pierre‑Emmanuel",
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

const SAMPLE_HISTORY = Array.from({ length: 24 }).map((_, i) => {
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

function fmtRelative(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.round((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleString();
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
  const [latest, setLatest] = useState(SAMPLE_LATEST as any);
  const [history, setHistory] = useState(SAMPLE_HISTORY as any[]);
  const [error, setError] = useState<string | null>(null);
  const { unit, setUnit } = useUnitToggle();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setError(null);
      try {
        const [l, h] = await Promise.all([
          fetchJSON("/api/weather/latest"),
          fetchJSON("/api/weather/history"),
        ]);
        if (!cancelled) {
          setLatest(l);
          setHistory((h as any).points || (h as any));
        }
      } catch (e: any) {
        console.warn("Using sample data (API not reachable)", e?.message);
        if (!cancelled) setError("Running on sample data. Connect your API.");
      }
    };
    load();
    const id = setInterval(load, AUTO_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-40 blur-3xl" aria-hidden>
          <div className="h-72 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-300 via-cyan-200 to-transparent dark:from-cyan-700/40 dark:via-sky-600/30" />
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
                  {online ? "Online" : "Offline"}
                </span>
                <TimerReset className="h-4 w-4" />
                <span className="text-sm">Updated {fmtRelative(latest?.timestamp)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UnitToggle unit={unit} onChange={setUnit} />
              <Button variant="outline" size="sm" onClick={() => location.reload()}>Refresh</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-16">
        {error && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">{error} — update API_BASE & endpoints when ready.</div>
        )}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <SensorCard title="Temperature" value={display.temperature} icon={<Thermometer />} subtitle="Air" />
          <SensorCard title="Humidity" value={display.humidity} icon={<Droplets />} subtitle="Relative" />
          <SensorCard title="Pressure" value={display.pressure} icon={<Gauge />} subtitle="Sea‑level approx." />
          <SensorCard title="Wind" value={`${display.windSpeed}`} icon={<Wind />} subtitle={`Gust ${display.windGust} • ${degToCompass(display.windDir)} (${display.windDir ?? "—"}°)`} />
          <SensorCard title="Rain" value={display.rainRate} icon={<CloudRain />} subtitle={`Today ${display.rainDaily}`} />
          <SensorCard title="UV Index" value={String(display.uv)} icon={<SunDim />} subtitle={uvCategory(Number((latest as any)?.uv_index))} />
          <SensorCard title="Solar" value={String(display.solar)} icon={<SunDim />} subtitle="Global irradiance" />
          <SensorCard title="Air Quality" value={String(display.aqi)} icon={<Leaf />} subtitle={aqiCategory(Number((latest as any)?.aqi))} />
        </section>

        <section className="mt-10">
          <Tabs defaultValue="temperature" className="w-full">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Trends (last 24h)</h2>
              <TabsList>
                <TabsTrigger value="temperature">Temperature</TabsTrigger>
                <TabsTrigger value="humidity">Humidity</TabsTrigger>
                <TabsTrigger value="pressure">Pressure</TabsTrigger>
                <TabsTrigger value="wind">Wind</TabsTrigger>
                <TabsTrigger value="rain">Rain</TabsTrigger>
                <TabsTrigger value="uv">UV</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="temperature" className="mt-4">
              <ChartCard title={`Temperature (${unit === UnitSystem.METRIC ? "°C" : "°F"})`}>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" minTickGap={24} />
                    <YAxis domain={["auto", "auto"]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="temperature" fillOpacity={0.2} fill="currentColor" stroke="currentColor" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </TabsContent>

            <TabsContent value="humidity" className="mt-4">
              <ChartCard title="Humidity (%)">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" minTickGap={24} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="humidity" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </TabsContent>

            <TabsContent value="pressure" className="mt-4">
              <ChartCard title={`Pressure (${unit === UnitSystem.METRIC ? "hPa" : "inHg"})`}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" minTickGap={24} />
                    <YAxis domain={["auto", "auto"]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="pressure" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </TabsContent>

            <TabsContent value="wind" className="mt-4">
              <ChartCard title={`Wind (${unit === UnitSystem.METRIC ? "km/h" : "mph"})`}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" minTickGap={24} />
                    <YAxis domain={[0, "auto"]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="wind" name="Mean" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="gust" name="Gust" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </TabsContent>

            <TabsContent value="rain" className="mt-4">
              <ChartCard title={`Rain Rate (${unit === UnitSystem.METRIC ? "mm/h" : "in/h"})`}>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" minTickGap={24} />
                    <YAxis domain={[0, "auto"]} />
                    <Tooltip />
                    <Area type="step" dataKey="rainRate" fillOpacity={0.25} fill="currentColor" stroke="currentColor" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </TabsContent>

            <TabsContent value="uv" className="mt-4">
              <ChartCard title="UV Index">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" minTickGap={24} />
                    <YAxis domain={[0, 12]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="uv" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <footer className="border-t border-slate-200/60 dark:border-slate-800 mt-12">
        <div className="mx-auto max-w-7xl px-6 py-6 text-sm text-slate-500 dark:text-slate-400 flex flex-col md:flex-row items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} Pierre‑Emmanuel — Weather Station</span>
          <span className="opacity-80">Auto‑refresh every {AUTO_REFRESH_MS / 1000}s</span>
        </div>
      </footer>
    </div>
  );
}

function UnitToggle({ unit, onChange }: { unit: string; onChange: (u: string) => void }) {
  return (
    <div className="inline-flex rounded-2xl bg-white/60 backdrop-blur border border-slate-200 overflow-hidden dark:bg-slate-800/60 dark:border-slate-700">
      <button onClick={() => onChange(UnitSystem.METRIC)} className={cn("px-3 py-1.5 text-sm", unit === UnitSystem.METRIC ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-600 dark:text-slate-300")}>Metric</button>
      <button onClick={() => onChange(UnitSystem.IMPERIAL)} className={cn("px-3 py-1.5 text-sm", unit === UnitSystem.IMPERIAL ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-600 dark:text-slate-300")}>Imperial</button>
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

function uvCategory(uv?: number) {
  if (uv == null) return "—";
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very High";
  return "Extreme";
}

function aqiCategory(aqi?: number) {
  if (aqi == null) return "—";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Sensitive";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}
