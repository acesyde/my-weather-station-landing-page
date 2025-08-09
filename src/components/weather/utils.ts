export function fmtRelative(iso?: string, lang: "en" | "fr" = "en") {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.round((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return lang === "fr" ? `il y a ${diff}s` : `${diff}s ago`;
  if (diff < 3600) return lang === "fr" ? `il y a ${Math.floor(diff / 60)}m` : `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return lang === "fr" ? `il y a ${Math.floor(diff / 3600)}h` : `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleString(lang);
}

export function degToCompass(deg?: number) {
  if (deg == null) return "—";
  const dirs = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const idx = Math.round(((deg % 360) / 22.5)) % 16;
  return dirs[idx];
}

export function uvCategory(uv?: number, t?: (k: string) => string) {
  const translate = t ?? ((k: string) => k);
  if (uv == null) return "—";
  if (uv < 3) return translate("uvLow");
  if (uv < 6) return translate("uvModerate");
  if (uv < 8) return translate("uvHigh");
  if (uv < 11) return translate("uvVeryHigh");
  return translate("uvExtreme");
}

export function aqiCategory(aqi?: number, t?: (k: string) => string) {
  const translate = t ?? ((k: string) => k);
  if (aqi == null) return "—";
  if (aqi <= 50) return translate("aqiGood");
  if (aqi <= 100) return translate("aqiModerate");
  if (aqi <= 150) return translate("aqiSensitive");
  if (aqi <= 200) return translate("aqiUnhealthy");
  if (aqi <= 300) return translate("aqiVeryUnhealthy");
  return translate("aqiHazardous");
}


