"use client";

import React, { useMemo } from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function AnimatedBackground({
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
      <div
        className={cn(
          "absolute inset-0 animate-[gradientShift_20s_linear_infinite]",
          isNight ? "bg-gradient-to-b from-slate-900 via-slate-950 to-black" : "bg-gradient-to-b from-sky-100 via-cyan-100 to-white"
        )}
      />

      <div className={cn("absolute -top-20 right-10 h-72 w-72 rounded-full blur-3xl", isNight ? "bg-slate-400/10" : "bg-amber-200/40")} />

      {clouds.map((c) => (
        <div
          key={c.key}
          className="absolute -left-1/3 w-[50vw] h-24 md:h-28 lg:h-32 opacity-70"
          style={{
            top: `${c.topPct}%`,
            animation: `cloudDrift ${c.duration}s linear ${c.delay}s infinite`,
            opacity: c.opacity,
            filter: "blur(2px)",
            ["--cloud-scale"]: c.scale,
          } as CSSProperties & { ["--cloud-scale"]: number }}
        >
          <div
            className={cn("absolute inset-0", isNight ? "bg-slate-300/30" : "bg-white/70")}
            style={{ borderRadius: "40px", boxShadow: "0 20px 40px rgba(0,0,0,0.06)" }}
          />
          <div className={cn("absolute -top-6 left-8 h-16 w-24 rounded-full", isNight ? "bg-slate-200/25" : "bg-white/70")} />
          <div className={cn("absolute -top-4 left-36 h-14 w-20 rounded-full", isNight ? "bg-slate-200/25" : "bg-white/70")} />
        </div>
      ))}

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

export default AnimatedBackground;


