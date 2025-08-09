"use client";

import { useEffect, useState } from "react";

export type Lang = "en" | "fr";

export type TranslationKey =
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

export const translations: Record<Lang, Record<TranslationKey, string>> = {
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

export function detectLocale(): Lang {
  try {
    const nav: { language?: string; languages?: string[] } | undefined =
      typeof navigator !== "undefined" ? (navigator as unknown as { language?: string; languages?: string[] }) : undefined;
    const raw = nav?.language || nav?.languages?.[0] || "en";
    return String(raw).toLowerCase().startsWith("fr") ? "fr" : "en";
  } catch {
    return "en";
  }
}

export function useI18n() {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    setLang(detectLocale());
  }, []);
  const t = (key: TranslationKey) => translations[lang][key];
  return { lang, t };
}


