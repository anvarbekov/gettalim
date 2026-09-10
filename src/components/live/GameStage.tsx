"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flag, Gem, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * O'quvchi qurilmasidagi o'yin sahnasi.
 *
 * Musobaqada har bir bola **o'yinni o'ynaydi**, quruq test emas: qaysi o'yin
 * tanlangan bo'lsa, uning ko'rinishi chiziladi. Javob berish mantiqi bir xil
 * qoladi — o'zgaradigan narsa faqat ko'rinish va his.
 *
 * Sahna o'quvchining o'z natijasini (to'g'ri javoblar soni) va sinfdagi
 * o'rnini ko'rsatadi, ya'ni bola musobaqa ichida ekanini his qilib turadi.
 */

export interface StageProps {
  gameId: string;
  /** O'quvchining to'g'ri javoblari. */
  correct: number;
  wrong: number;
  /** Sinfdagi o'rni va umumiy soni. */
  rank: number;
  total: number;
  /** Sinfdagi eng yaxshi natija — masofani solishtirish uchun. */
  leaderCorrect: number;
  teamNo: number;
  teamColor: string;
  /** Jamoalar hisobi (arqon uchun). */
  teamPoints: number[];
  teamNames: string[];
}

/** Marraga qadar necha qadam — poyga va xazina uchun. */
const GOAL = 12;

export function GameStage(props: StageProps) {
  switch (props.gameId) {
    case "poyga":
      return <RaceStage {...props} />;
    case "arqon":
      return <RopeStage {...props} />;
    case "millioner":
      return <LadderStage {...props} />;
    case "xazina":
      return <PathStage {...props} />;
    case "yomgir":
      return <RainStage {...props} />;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Poyga — o'z mashinasi va sinfdoshlar                               */
/* ------------------------------------------------------------------ */

function RaceStage({ correct, rank, total, leaderCorrect, teamColor }: StageProps) {
  const goal = Math.max(GOAL, leaderCorrect + 2);
  const me = Math.min(1, correct / goal);
  const leader = Math.min(1, leaderCorrect / goal);
  const behind = leaderCorrect - correct;

  return (
    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
      <div className="mb-2 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-white/60">
        <span>Poyga</span>
        <span>{behind > 0 ? `Yetakchidan ${behind} qadam orqada` : "Siz oldindasiz!"}</span>
      </div>

      <div className="relative h-14 overflow-hidden rounded-xl bg-white/5">
        {/* Yo'l chizig'i */}
        <span
          className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2"
          style={{ backgroundImage: "repeating-linear-gradient(90deg,#ffffff55 0 10px,transparent 10px 22px)" }}
          aria-hidden
        />

        {/* Yetakchi */}
        {leaderCorrect > correct ? (
          <span
            className="absolute top-1 text-lg opacity-45 transition-[left] duration-700"
            style={{ left: `calc(${6 + leader * 82}% - 12px)` }}
            aria-hidden
          >
            🏎️
          </span>
        ) : null}

        {/* Men */}
        <span
          className="absolute bottom-1 text-2xl transition-[left] duration-700"
          style={{ left: `calc(${6 + me * 82}% - 14px)`, filter: "drop-shadow(0 3px 5px rgba(0,0,0,.5))" }}
          aria-hidden
        >
          🚗
        </span>

        {/* Marra */}
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70">
          <Flag className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs font-bold text-white/70">
        <span>{correct} qadam</span>
        <span style={{ color: teamColor }}>
          {rank > 0 ? `${rank}/${total} o'rin` : ""}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Arqon tortish — jamoalar tortishmasi                               */
/* ------------------------------------------------------------------ */

function RopeStage({ teamPoints, teamNames, teamNo, teamColor }: StageProps) {
  const a = teamPoints[0] ?? 0;
  const b = teamPoints[1] ?? 0;
  const diff = a - b;
  // Markazdan siljish: har bir ochko farqi 6% ga tortadi, chegara ±42%
  const shift = Math.max(-42, Math.min(42, diff * 6));
  const mine = teamNo === 1 ? "chap" : "o'ng";

  return (
    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
      <div className="mb-2 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-white/60">
        <span>Arqon tortish</span>
        <span style={{ color: teamColor }}>Siz {mine} tomondasiz</span>
      </div>

      <div className="relative h-16 overflow-hidden rounded-xl bg-white/5">
        {/* Markaz chizig'i */}
        <span className="absolute left-1/2 top-0 h-full w-px bg-white/30" aria-hidden />

        {/* Arqon */}
        <span
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full transition-[left,right] duration-700"
          style={{
            left: `calc(12% + ${shift}%)`,
            right: `calc(12% - ${shift}%)`,
            background: "linear-gradient(90deg,#c9a173,#e2bd90,#b98a5d)",
          }}
          aria-hidden
        />

        {/* Popuk */}
        <span
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-rose-500 transition-[left] duration-700"
          style={{ left: `calc(50% + ${shift}% - 6px)` }}
          aria-hidden
        />

        {/* Jamoalar */}
        <span className="absolute bottom-1 left-2 text-2xl" aria-hidden>
          🧑‍🤝‍🧑
        </span>
        <span className="absolute bottom-1 right-2 text-2xl" aria-hidden>
          🧑‍🤝‍🧑
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs font-bold">
        <span className={cn(teamNo === 1 ? "text-white" : "text-white/60")}>
          {teamNames[0] ?? "1-jamoa"} · {a}
        </span>
        <span className={cn(teamNo === 2 ? "text-white" : "text-white/60")}>
          {b} · {teamNames[1] ?? "2-jamoa"}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Kim millioner — narvon                                             */
/* ------------------------------------------------------------------ */

const PRIZES = [1, 2, 3, 5, 10, 15, 25, 50, 100, 200, 400, 800, 1500, 3000, 5000];

function LadderStage({ correct, wrong }: StageProps) {
  const step = Math.min(PRIZES.length - 1, correct);
  const prize = correct > 0 ? PRIZES[step - 1 >= 0 ? step - 1 : 0] : 0;

  return (
    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
      <div className="mb-2 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-white/60">
        <span>Kim millioner</span>
        <span className="text-amber-300">
          {prize > 0 ? `${prize.toLocaleString("uz-UZ")} 000 so'm` : "Boshlanish"}
        </span>
      </div>

      <div className="flex gap-1">
        {PRIZES.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2.5 flex-1 rounded-full transition",
              i < correct ? "bg-amber-400" : "bg-white/15",
            )}
          />
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs font-bold text-white/70">
        <span>{correct}/15 bosqich</span>
        <span className={wrong > 0 ? "text-rose-300" : ""}>{wrong} xato</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Xazina xaritasi — yo'l va kataklar                                 */
/* ------------------------------------------------------------------ */

function PathStage({ correct, leaderCorrect }: StageProps) {
  const tiles = Math.max(GOAL, leaderCorrect + 2);
  const position = Math.min(tiles - 1, correct);

  return (
    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
      <div className="mb-2 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-white/60">
        <span>Xazina xaritasi</span>
        <span>
          {position + 1}/{tiles} katak
        </span>
      </div>

      <div className="flex flex-wrap gap-1">
        {Array.from({ length: tiles }, (_, i) => {
          const last = i === tiles - 1;
          const here = i === position;
          return (
            <span
              key={i}
              className={cn(
                "relative grid h-7 flex-1 min-w-[18px] place-items-center rounded-md text-[11px] transition",
                i < position ? "bg-amber-400/40" : "bg-white/10",
                last && "bg-gold/40",
              )}
            >
              {last ? <Gem className="h-3.5 w-3.5 text-amber-200" /> : null}
              {here ? <span className="absolute -top-3 text-base">🧍</span> : null}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Savol yomg'iri — tomchilar                                         */
/* ------------------------------------------------------------------ */

function RainStage({ correct, wrong, rank, total }: StageProps) {
  const drops = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: (i * 29 + (i % 4) * 7) % 100,
        delay: (i % 9) * 0.28,
        duration: 1 + ((i * 5) % 8) * 0.14,
        height: 10 + ((i * 3) % 4) * 6,
      })),
    [],
  );

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#2b5f9e]/50 to-[#0f9b8e]/25 p-3 backdrop-blur">
      {/* Yomg'ir */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {drops.map((drop, i) => (
          <span
            key={i}
            className="absolute w-px animate-rain-fall rounded-full bg-white/40"
            style={{
              left: `${drop.left}%`,
              height: drop.height,
              animationDuration: `${drop.duration}s`,
              animationDelay: `${drop.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="relative flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/70">
          Savol yomg'iri
        </span>
        <span className="flex items-center gap-2 text-xs font-bold text-white/80">
          <span className="text-emerald-300">{correct} ✓</span>
          <span className="text-rose-300">{wrong} ✕</span>
          {rank > 0 ? (
            <span className="flex items-center gap-1">
              <Trophy className="h-3 w-3" /> {rank}/{total}
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}
