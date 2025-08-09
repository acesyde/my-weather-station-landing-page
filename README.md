## Weather Station (Next.js + Weather Underground PWS)

Beautiful landing page for a personal weather station. It fetches live and historical data from Weather Underground (Weather.com PWS) via server‑side API routes and renders an animated, responsive dashboard.

### Features
- **Live data**: Current observations from Weather.com PWS
- **Trends**: Last 24h charts (temperature, humidity, pressure, wind, rain, UV)
- **Unit toggle**: Metric/Imperial with local persistence
- **Auto‑refresh**: Every 30s with graceful error handling
- **Animated background**: Day/night, wind, rain cues
- **i18n**: English and French (auto‑detect)
- **Dark mode**: Tailwind CSS 4 design system

### Tech stack
- **Next.js 15** (App Router) + **React 19**
- **Tailwind CSS 4**, Radix UI primitives
- **Recharts** for data viz, **lucide-react** icons

## Quick start

### Prerequisites
- Node.js 18+ and your preferred package manager (uses `pnpm` lockfile)
- Weather Underground / Weather.com API key and your station ID

### 1) Configure environment
Create `.env.local` in the project root:

```env
WU_API_KEY=your_api_key
WU_STATION_ID=your_station_id
```

Environment variables are validated at startup. If missing, the server process exits with a clear message.

### 2) Install and run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment validation
The app validates env vars on boot via `src/lib/env-validation.ts` (called from `next.config.ts`).
- **Required**:
  - `WU_API_KEY`: Weather.com API key
  - `WU_STATION_ID`: Station ID (e.g., `IXXXXXXX`)
- Missing values will print a helpful message and terminate the server process to avoid undefined runtime behavior.

## API routes (server‑side)
Both routes are dynamic and lightly cached (30s TTL with `stale-while-revalidate`). They never expose your secrets to the client.

| Method | Path | Description |
|---|---|---|
| GET | `/api/weather/latest` | Current observation mapped to `LatestWeather` |
| GET | `/api/weather/history` | Last ~24h points mapped to `{ points: HistoryPoint[] }` |

### GET /api/weather/latest
Returns a subset of the PWS "current observations" in a normalized shape:

```json
{
  "station_name": "Backyard WX",
  "location": { "name": "Neighborhood", "lat": 37.77, "lon": -122.42 },
  "timestamp": "2024-06-18T12:34:56.000Z",
  "temperature_c": 22.4,
  "humidity_pct": 56,
  "pressure_hpa": 1014.2,
  "wind_speed_ms": 1.7,
  "wind_gust_ms": 4.3,
  "wind_dir_deg": 250,
  "rain_rate_mm_h": 0,
  "rain_daily_mm": 0,
  "uv_index": 4.5,
  "solar_w_m2": 520,
  "aqi": null
}
```

Example:

```bash
curl -s http://localhost:3000/api/weather/latest | jq .
```

### GET /api/weather/history
Combines today and yesterday from the PWS history endpoint, maps/filters to the last 24h, and returns:

```json
{
  "points": [
    {
      "t": "2024-06-18T11:40:00.000Z",
      "temperature_c": 21.8,
      "humidity_pct": 60,
      "pressure_hpa": 1013.9,
      "wind_speed_ms": 1.2,
      "wind_gust_ms": 2.8,
      "rain_rate_mm_h": 0,
      "rain_daily_mm": 0,
      "uv_index": 3.7
    }
  ]
}
```

Client code accepts either an array or `{ points }`; this route returns `{ points }`.

## Development scripts

```bash
pnpm dev     # start dev server (Turbopack)
pnpm build   # production build
pnpm start   # start production server
pnpm lint    # run ESLint
```

## Project structure

```text
src/
  app/
    api/weather/latest/route.ts     # current observation (server)
    api/weather/history/route.ts    # last ~24h points (server)
    page.tsx                        # landing page
  components/
    WeatherStationLanding.tsx       # main client UI
    weather/                        # UI, charts, units, i18n
  lib/
    env-validation.ts               # env validation + getters
```

## Deployment (Vercel recommended)
1. In Vercel → Project → Settings → Environment Variables, add `WU_API_KEY` and `WU_STATION_ID` for Development, Preview, and Production.
2. Deploy. Only server routes read secrets; the client never sees them.

## Troubleshooting
- **Process exits on boot**: Ensure `.env.local` has both `WU_API_KEY` and `WU_STATION_ID`.
- **502 from API routes**: Upstream Weather.com error or invalid credentials. Check server logs; requests are made with `cache: "no-store"` and errors are surfaced to the client UI.
- **No points around midnight**: History endpoint merges today+yesterday and then filters to last 24h; ensure your station reports regularly.

## Learn more
- Next.js docs: [https://nextjs.org/docs](https://nextjs.org/docs)
- Recharts: [https://recharts.org/en-US](https://recharts.org/en-US)
