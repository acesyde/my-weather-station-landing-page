import { NextResponse } from "next/server";
import type { LatestWeather } from "@/components/weather/types";

type PwsCurrentMetric = {
  temp?: number;
  pressure?: number;
  windSpeed?: number;
  windGust?: number;
  precipRate?: number;
  precipTotal?: number;
};

type PwsCurrentObservation = {
  neighborhood?: string;
  stationID?: string;
  obsTimeUtc?: string;
  epoch?: number;
  lat?: number;
  lon?: number;
  humidity?: number;
  winddir?: number;
  uv?: number;
  solarRadiation?: number;
  metric?: PwsCurrentMetric;
};

type PwsCurrentResponse = {
  observations?: PwsCurrentObservation[];
};

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export const dynamic = "force-dynamic";

const TTL_MS = 30_000;
let cached: { data: LatestWeather; at: number } | null = null;
let inFlight: Promise<LatestWeather> | null = null;

export async function GET() {
  const apiKey = getEnv("WU_API_KEY");
  const stationId = getEnv("WU_STATION_ID");
  const isProd = process.env.NODE_ENV === "production";

  // Serve from cache if fresh
  if (cached && Date.now() - cached.at < TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=15" },
    });
  }
  if (!apiKey || !stationId) {
    if (isProd) {
      return NextResponse.json(
        { error: "Missing WU_API_KEY or WU_STATION_ID environment variables" },
        { status: 500 }
      );
    }
    // Dev-friendly fallback: serve sample data to avoid noisy 500s in local dev
    const sample: LatestWeather = {
      station_name: "Sample Station",
      location: { name: "Local Dev", lat: 0, lon: 0 },
      timestamp: new Date().toISOString(),
      temperature_c: 22.3,
      humidity_pct: 55,
      pressure_hpa: 1013.5,
      wind_speed_ms: 1.8,
      wind_gust_ms: 3.2,
      wind_dir_deg: 180,
      rain_rate_mm_h: 0,
      rain_daily_mm: 0.2,
      uv_index: 5.0,
      solar_w_m2: 600,
      aqi: undefined,
    };
    cached = { data: sample, at: Date.now() };
    return NextResponse.json(sample, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=15" },
    });
  }

  if (!inFlight) {
    inFlight = (async () => {
      const url = new URL("https://api.weather.com/v2/pws/observations/current");
      url.searchParams.set("stationId", stationId);
      url.searchParams.set("format", "json");
      url.searchParams.set("units", "m");
      url.searchParams.set("apiKey", apiKey);

      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`WU current fetch failed: HTTP ${res.status}`);
      }
      const data: PwsCurrentResponse = await res.json();
      const obs = Array.isArray(data.observations) ? data.observations : [];
      if (obs.length === 0) {
        throw new Error("WU current: no observations returned");
      }
      const o: PwsCurrentObservation = obs[0] || {};
      const metric: PwsCurrentMetric = o.metric || {};

      const latest: LatestWeather = {
        station_name: o.neighborhood || o.stationID || stationId,
        location: {
          name: o.neighborhood || undefined,
          lat: typeof o.lat === "number" ? o.lat : undefined,
          lon: typeof o.lon === "number" ? o.lon : undefined,
        },
        timestamp: o.obsTimeUtc
          ? new Date(o.obsTimeUtc).toISOString()
          : typeof o.epoch === "number"
          ? new Date(o.epoch * 1000).toISOString()
          : undefined,
        temperature_c: typeof metric.temp === "number" ? metric.temp : undefined,
        humidity_pct: typeof o.humidity === "number" ? o.humidity : undefined,
        pressure_hpa: typeof metric.pressure === "number" ? metric.pressure : undefined,
        wind_speed_ms:
          typeof metric.windSpeed === "number" ? metric.windSpeed / 3.6 : undefined,
        wind_gust_ms:
          typeof metric.windGust === "number" ? metric.windGust / 3.6 : undefined,
        wind_dir_deg: typeof o.winddir === "number" ? o.winddir : undefined,
        rain_rate_mm_h:
          typeof metric.precipRate === "number" ? metric.precipRate : undefined,
        rain_daily_mm:
          typeof metric.precipTotal === "number" ? metric.precipTotal : undefined,
        uv_index: typeof o.uv === "number" ? o.uv : undefined,
        solar_w_m2:
          typeof o.solarRadiation === "number" ? o.solarRadiation : undefined,
        aqi: undefined,
      };
      cached = { data: latest, at: Date.now() };
      return latest;
    })().finally(() => {
      inFlight = null;
    });
  }

  try {
    const data = await inFlight;
    return NextResponse.json(data as LatestWeather, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=15" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}


