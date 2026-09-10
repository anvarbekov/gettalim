"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Raqamning silliq o'sishi                                           */
/* ------------------------------------------------------------------ */

/**
 * Ball birdan sakramaydi — bir necha kadrda o'sib boradi.
 * Kichik narsa, lekin ekranni "tirik" qiladi.
 */
export function useCountUp(value: number, duration = 550): number {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const start = useRef(0);

  useEffect(() => {
    if (value === shown) return;
    from.current = shown;
    start.current = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start.current) / duration);
      // easeOutCubic
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(from.current + (value - from.current) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return shown;
}

/* ------------------------------------------------------------------ */
/*  Taymer halqasi                                                     */
/* ------------------------------------------------------------------ */

export function TimerRing({
  left,
  total,
  size = 44,
}: {
  left: number;
  total: number;
  size?: number;
}) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0;
  const danger = left <= 30;

  const label = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth={4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={danger ? "#f43f5e" : "#fff"}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          style={{ transition: "stroke-dashoffset .95s linear, stroke .3s" }}
        />
      </svg>
      <span
        className={`absolute font-mono text-[11px] font-bold tabular-nums ${danger ? "text-rose-300" : "text-white"}`}
      >
        {label}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Konfetti                                                           */
/* ------------------------------------------------------------------ */

const CONFETTI_COLORS = ["#e9b02f", "#2f7ee0", "#e8543f", "#2fa96f", "#8b52d8", "#ffffff"];

/** Yakundagi bayram. Faqat CSS animatsiyasi — protsessorga yuk bermaydi. */
export function Confetti({ count = 60 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (i * 37) % 100,
        delay: ((i * 13) % 20) / 10,
        duration: 2.4 + ((i * 7) % 15) / 10,
        size: 6 + ((i * 5) % 7),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: i % 3 === 0,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="absolute top-0 animate-confetti-fall"
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size * (piece.round ? 1 : 1.8),
            background: piece.color,
            borderRadius: piece.round ? "50%" : 2,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Fon — yumshoq harakatlanuvchi yorug'lik                            */
/* ------------------------------------------------------------------ */

export function Aurora({ color }: { color: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute -left-1/4 -top-1/3 h-[80vh] w-[80vh] animate-aurora rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${color}55, transparent 62%)` }}
      />
      <div
        className="absolute -bottom-1/3 -right-1/4 h-[70vh] w-[70vh] animate-aurora rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, #7a3fd055, transparent 62%)",
          animationDelay: "-6s",
        }}
      />
      <div
        className="absolute left-1/3 top-1/4 h-[45vh] w-[45vh] animate-aurora rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, #0f9b8e33, transparent 62%)",
          animationDelay: "-12s",
        }}
      />
    </div>
  );
}
