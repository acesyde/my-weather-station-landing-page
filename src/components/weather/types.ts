export interface LocationInfo {
  name?: string;
  lat?: number;
  lon?: number;
}

export interface LatestWeather {
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

export interface HistoryPoint {
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


