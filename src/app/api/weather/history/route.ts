import { NextResponse } from "next/server";
import type { HistoryPoint } from "@/components/weather/types";
import { getEnvConfig } from "@/lib/env-validation";

type PwsHistoryMetric = {
  tempAvg?: number;
  pressureMean?: number;
  pressureAvg?: number;
  pressureMax?: number;
  pressureMin?: number;
  windspeedAvg?: number;
  windSpeedAvg?: number; // some responses may use camel variations
  windgustHigh?: number;
  windGustHigh?: number;
  precipRate?: number;
  precipTotal?: number;
};

type PwsHistoryRow = {
  epoch?: number;
  humidityAvg?: number;
  uvHigh?: number;
  metric?: PwsHistoryMetric;
};

type PwsHistoryResponse = {
  observations?: PwsHistoryRow[];
};



export const dynamic = "force-dynamic";

const TTL_MS = 30_000;
let cached: { data: { points: HistoryPoint[] }; at: number } | null = null;
let inFlight: Promise<{ points: HistoryPoint[] }> | null = null;

export async function GET() {
  const { WU_API_KEY: apiKey, WU_STATION_ID: stationId } = getEnvConfig();

  // Serve from cache if within TTL
  if (cached && Date.now() - cached.at < TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=15" },
    });
  }

  // We fetch today's and yesterday's summaries to cover last 24h across midnight
  const toYyyyMmDd = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const today = new Date();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const makeUrl = (yyyyMmDd: string) => {
    const u = new URL("https://api.weather.com/v2/pws/history/all");
    u.searchParams.set("stationId", stationId);
    u.searchParams.set("date", yyyyMmDd);
    u.searchParams.set("format", "json");
    u.searchParams.set("units", "m");
    u.searchParams.set("numericPrecision", "decimal");
    u.searchParams.set("apiKey", apiKey);
    return u.toString();
  };

  if (!inFlight) {
    inFlight = (async () => {
      const [resY, resT] = await Promise.all([
        fetch(makeUrl(toYyyyMmDd(yesterday)), { cache: "no-store" }),
        fetch(makeUrl(toYyyyMmDd(today)), { cache: "no-store" }),
      ]);

      if (!resT.ok && !resY.ok) {
        throw new Error(`WU history fetch failed: HTTP ${resY.status}/${resT.status}`);
      }

      const [dataY, dataT]: [PwsHistoryResponse, PwsHistoryResponse] = await Promise.all([
        (resY.ok ? resY.json() : Promise.resolve({ observations: [] })) as Promise<PwsHistoryResponse>,
        (resT.ok ? resT.json() : Promise.resolve({ observations: [] })) as Promise<PwsHistoryResponse>,
      ]);

      const rows: PwsHistoryRow[] = [
        ...(Array.isArray(dataY.observations) ? dataY.observations : []),
        ...(Array.isArray(dataT.observations) ? dataT.observations : []),
      ];

      const points: HistoryPoint[] = rows
        .map((o: PwsHistoryRow): HistoryPoint | null => {
          const metric: PwsHistoryMetric = o.metric || {};
          const epochSec: number | undefined = typeof o.epoch === "number" ? o.epoch : undefined;
          if (!epochSec) return null;
          return {
            t: new Date(epochSec * 1000).toISOString(),
            temperature_c: typeof metric.tempAvg === "number" ? metric.tempAvg : undefined,
            humidity_pct: typeof o.humidityAvg === "number" ? o.humidityAvg : undefined,
            pressure_hpa:
              typeof metric.pressureMean === "number"
                ? metric.pressureMean
                : typeof metric.pressureAvg === "number"
                ? metric.pressureAvg
                : typeof metric.pressureMax === "number"
                ? metric.pressureMax
                : typeof metric.pressureMin === "number"
                ? metric.pressureMin
                : undefined,
            wind_speed_ms:
              typeof metric.windspeedAvg === "number"
                ? metric.windspeedAvg / 3.6
                : typeof metric.windSpeedAvg === "number"
                ? metric.windSpeedAvg / 3.6
                : undefined,
            wind_gust_ms:
              typeof metric.windgustHigh === "number"
                ? metric.windgustHigh / 3.6
                : typeof metric.windGustHigh === "number"
                ? metric.windGustHigh / 3.6
                : undefined,
            rain_rate_mm_h: typeof metric.precipRate === "number" ? metric.precipRate : undefined,
            rain_daily_mm: typeof metric.precipTotal === "number" ? metric.precipTotal : undefined,
            uv_index: typeof o.uvHigh === "number" ? o.uvHigh : undefined,
          };
        })
        .filter(Boolean) as HistoryPoint[];

      // Limit to last 24 hours
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const recent = points.filter((p) => new Date(p.t).getTime() >= cutoff);
      const payload = { points: recent.length > 0 ? recent : points };
      cached = { data: payload, at: Date.now() };
      return payload;
    })().finally(() => {
      inFlight = null;
    });
  }

  try {
    const data = await inFlight;
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=15" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}


