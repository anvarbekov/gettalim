"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { RotateCcw, Home, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatClock } from "@/lib/utils";
import type { TeamKey } from "@/hooks/useMatch";

interface Stats {
  score: number;
  correct: number;
  wrong: number;
  bestStreak: number;
}

export interface Standing {
  place: number;
  name: string;
  steps: number;
  color: string;
  correct: number;
  wrong: number;
}

export function WinnerOverlay({
  winner,
  aName,
  bName,
  statsA,
  statsB,
  elapsed,
  labels,
  accent,
  standings,
  onAgain,
  onHome,
}: {
  winner: TeamKey | "draw";
  aName: string;
  bName: string;
  statsA: Stats;
  statsB: Stats;
  elapsed: number;
  /** Poyga uchun: g'olib rangi. */
  accent?: string;
  /** Poyga uchun: to'liq tartib jadvali (bo'lsa, jamoa kartochkalari o'rniga ko'rsatiladi). */
  standings?: Standing[];
  labels: {
    winner: string;
    draw: string;
    again: string;
    home: string;
    correct: string;
    wrong: string;
    streak: string;
    steps: string;
    result: string;
  };
  onAgain: () => void;
  onHome: () => void;
}) {
  useEffect(() => {
    const base = winner === "A" ? "#1f6fd0" : winner === "B" ? "#d2402f" : "#c4996c";
    const colors = [accent ?? base, "#e7c094"];
    const origin = standings
      ? { x: 0.5, y: 0.42 }
      : winner === "A"
        ? { x: 0.22, y: 0.5 }
        : winner === "B"
          ? { x: 0.78, y: 0.5 }
          : { x: 0.5, y: 0.5 };
    confetti({ particleCount: 140, spread: 78, origin, colors, scalar: 1.1 });
    const id = setTimeout(
      () => confetti({ particleCount: 90, spread: 110, origin, colors, scalar: 0.9 }),
      380,
    );
    return () => clearTimeout(id);
  }, [winner, accent, standings]);

  const winnerName = winner === "A" ? aName : winner === "B" ? bName : labels.draw;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl animate-pop-in rounded-xl2 bg-white p-6 shadow-lift sm:p-8">
        <div className="text-center">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-[.18em] text-white",
              !accent && (winner === "A" ? "bg-teamA" : winner === "B" ? "bg-teamB" : "bg-rope-dark"),
            )}
            style={accent ? { background: accent } : undefined}
          >
            <Trophy className="h-4 w-4" /> {winner === "draw" ? labels.draw : labels.winner}
          </span>
          <h2
            className={cn(
              "mt-4 text-4xl font-extrabold sm:text-5xl",
              !accent && (winner === "A" ? "text-teamA" : winner === "B" ? "text-teamB" : "text-ink"),
            )}
            style={accent ? { color: accent } : undefined}
          >
            {winnerName}
          </h2>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-ink-soft">
            {standings ? `${statsA.score} ${labels.steps}` : `${statsA.score} : ${statsB.score}`}
            <span className="ml-3 text-base text-ink-mute">{formatClock(elapsed)}</span>
          </p>
        </div>

        {standings ? (
          <ol className="mt-7 grid gap-2">
            {standings.map((row) => (
              <li
                key={row.name + row.place}
                className="flex items-center gap-3 rounded-xl border-2 p-3"
                style={{ borderColor: `${row.color}55`, background: `${row.color}0f` }}
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-extrabold text-white"
                  style={{ background: row.place === 1 ? "#e0a92e" : row.color }}
                >
                  {row.place}
                </span>
                <span className="min-w-0 flex-1 truncate font-extrabold text-ink">{row.name}</span>
                <span className="font-mono text-sm tabular-nums text-ink-soft">
                  {row.correct} ✓ · {row.wrong} ✕
                </span>
                <span className="font-mono text-lg font-bold tabular-nums text-ink">{row.steps}</span>
              </li>
            ))}
          </ol>
        ) : (
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {[
            { name: aName, stats: statsA, side: "a" as const },
            { name: bName, stats: statsB, side: "b" as const },
          ].map(({ name, stats, side }) => (
            <div
              key={side}
              className={cn(
                "rounded-xl border-2 p-4",
                side === "a" ? "border-teamA/30 bg-teamA-soft" : "border-teamB/30 bg-teamB-soft",
              )}
            >
              <p className="truncate font-extrabold text-ink">{name}</p>
              <dl className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                {[
                  [labels.steps, stats.score],
                  [labels.correct, stats.correct],
                  [labels.wrong, stats.wrong],
                  [labels.streak, stats.bestStreak],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-lg bg-white/70 px-1 py-2">
                    <dd className="font-mono text-xl font-bold tabular-nums text-ink">{value}</dd>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-ink-mute">{label}</dt>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        )}

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button size="lg" variant="dark" onClick={onAgain}>
            <RotateCcw className="h-5 w-5" /> {labels.again}
          </Button>
          <Button size="lg" variant="outline" onClick={onHome}>
            <Home className="h-5 w-5" /> {labels.home}
          </Button>
        </div>
      </div>
    </div>
  );
}
