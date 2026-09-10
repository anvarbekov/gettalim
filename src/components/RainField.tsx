"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { QuizItem } from "@/lib/quiz";
import { cn, normalizeAnswer, shuffle } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export interface RainFieldProps {
  item: QuizItem;
  color: string;
  /** 0,1,2… — har darajada tezlik oshadi. */
  level: number;
  tempo: "slow" | "normal" | "fast";
  paused: boolean;
  /** Javob berilgach tashqaridan keladi — tomchilar to'xtaydi. */
  feedback: { chosen: string | null; ok: boolean } | null;
  compact?: boolean;
  onHit: (choice: string, ok: boolean) => void;
  onMiss: () => void;
}

const BASE_SECONDS = { slow: 9, normal: 7, fast: 5.4 };

/**
 * Yo'lakcha markazi (foizda).
 *
 * Kartochka kengligi 46% gacha bo'lgani uchun markaz chetdan kamida 24%
 * uzoqda turadi — aks holda uzun javob ekrandan chiqib ketadi.
 */
function laneLeft(index: number, lanes: number): number {
  const pad = 25;
  if (lanes <= 1) return 50;
  return pad + (index * (100 - 2 * pad)) / (lanes - 1);
}

/** Fon yomg'iri — CSS animatsiyasi bilan, protsessorga yuk bermaydi. */
const DROPS = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37 + (i % 5) * 11) % 100,
  delay: (i % 13) * 0.24,
  duration: 0.9 + ((i * 7) % 9) * 0.11,
  height: 14 + ((i * 5) % 4) * 8,
  opacity: 0.18 + ((i * 3) % 5) * 0.06,
}));

interface Splash {
  id: number;
  left: number;
  color: string;
}

/**
 * Javob variantlari yomg'ir tomchilaridek tepadan tushadi.
 *
 * Har bir tomchi tebranib, biroz qiyshayib tushadi va orqasida iz qoldiradi.
 * Yerga tushganda suv sachraydi. To'g'ri javobni yerga tushishidan oldin
 * bosish kerak — aks holda jamoa bitta jonini yo'qotadi.
 */
export function RainField({
  item,
  color,
  level,
  tempo,
  paused,
  feedback,
  compact,
  onHit,
  onMiss,
}: RainFieldProps) {
  const host = useRef<HTMLDivElement>(null);
  const nodes = useRef<(HTMLButtonElement | null)[]>([]);
  const progress = useRef<number[]>([]);
  const alive = useRef<boolean[]>([]);
  const missed = useRef(false);
  const [popped, setPopped] = useState<boolean[]>([]);
  const [splashes, setSplashes] = useState<Splash[]>([]);
  const splashId = useRef(0);

  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const frozenRef = useRef(false);
  frozenRef.current = feedback !== null;

  /* Har bir yangi savolda holat tiklanadi */
  useLayoutEffect(() => {
    const offsets = shuffle(item.options.map((_, i) => -0.14 * i - 0.04));
    progress.current = item.options.map((_, i) => offsets[i]);
    alive.current = item.options.map(() => true);
    missed.current = false;
    setPopped(item.options.map(() => false));
  }, [item.key, item.options]);

  /* Tushish animatsiyasi */
  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const seconds = Math.max(2.8, BASE_SECONDS[tempo] - level * 0.45);

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (pausedRef.current || frozenRef.current) return;

      const box = host.current;
      if (!box) return;
      const height = box.clientHeight;

      item.options.forEach((option, i) => {
        if (!alive.current[i]) return;
        progress.current[i] += dt / seconds;
        const p = progress.current[i];
        const node = nodes.current[i];

        if (node) {
          // Tomchi tebranadi va biroz qiyshayadi — tabiiy tushish
          const sway = Math.sin((p + i * 0.7) * 3.4) * (compact ? 5 : 8);
          const tilt = Math.cos((p + i * 0.7) * 3.4) * 3.2;
          node.style.transform = `translate(calc(-50% + ${sway}px), ${Math.max(-70, p * height)}px) rotate(${tilt}deg)`;
          node.style.opacity = p < 0 ? "0.25" : "1";
        }

        if (p >= 1) {
          alive.current[i] = false;
          setPopped((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });

          // Suv sachraydi
          const left = laneLeft(i, item.options.length);
          const id = (splashId.current += 1);
          setSplashes((prev) => [...prev.slice(-5), { id, left, color }]);
          setTimeout(() => setSplashes((prev) => prev.filter((s) => s.id !== id)), 600);

          const isAnswer = normalizeAnswer(option) === normalizeAnswer(item.answer);
          if (isAnswer && !missed.current) {
            missed.current = true;
            onMiss();
          }
        }
      });
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [item, level, tempo, compact, color, onMiss]);

  const stateOf = (option: string): "idle" | "correct" | "wrong" | "muted" => {
    if (!feedback) return "idle";
    const isAnswer = normalizeAnswer(option) === normalizeAnswer(item.answer);
    if (isAnswer) return "correct";
    if (feedback.chosen && normalizeAnswer(option) === normalizeAnswer(feedback.chosen)) return "wrong";
    return "muted";
  };

  const clouds = useMemo(
    () => [
      { left: 6, top: 4, w: 74, h: 22, delay: 0, duration: 46 },
      { left: 40, top: 12, w: 54, h: 16, delay: 12, duration: 62 },
      { left: 72, top: 6, w: 46, h: 14, delay: 26, duration: 54 },
    ],
    [],
  );

  return (
    <div
      ref={host}
      className="relative flex-1 overflow-hidden rounded-2xl border border-white/40"
      style={{
        minHeight: "clamp(240px, 36vh, 580px)",
        background: `linear-gradient(180deg, #dceafc 0%, #eef4fb 42%, ${color}12 100%)`,
      }}
    >
      {/* --- Fon yomg'iri --- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {DROPS.map((drop, i) => (
          <span
            key={i}
            className="absolute w-px animate-rain-fall rounded-full"
            style={{
              left: `${drop.left}%`,
              height: drop.height,
              background: `linear-gradient(180deg, transparent, ${color})`,
              opacity: drop.opacity,
              animationDuration: `${drop.duration}s`,
              animationDelay: `${drop.delay}s`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        ))}
      </div>

      {/* --- Bulutlar --- */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 overflow-hidden" aria-hidden>
        {clouds.map((cloud, i) => (
          <span
            key={i}
            className="absolute animate-cloud-drift rounded-full bg-white/85 shadow-sm"
            style={{
              left: `${cloud.left}%`,
              top: cloud.top,
              width: cloud.w,
              height: cloud.h,
              animationDuration: `${cloud.duration}s`,
              animationDelay: `-${cloud.delay}s`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        ))}
      </div>

      {/* --- Tushayotgan variantlar --- */}
      {item.options.map((option, i) => {
        const status = stateOf(option);
        const left = laneLeft(i, item.options.length);

        return (
          <button
            key={`${item.key}-${option}`}
            ref={(el) => {
              nodes.current[i] = el;
            }}
            type="button"
            disabled={!!feedback || popped[i] || paused}
            onClick={() => onHit(option, normalizeAnswer(option) === normalizeAnswer(item.answer))}
            className={cn(
              "group absolute top-0 flex items-center gap-2 rounded-full border-2 px-3 py-2.5 text-left font-extrabold shadow-lift transition-colors sm:px-4",
              "max-w-[46%] text-xs sm:max-w-[42%] sm:text-sm",
              !compact && "lg:max-w-[38%] lg:text-base",
              popped[i] && "pointer-events-none opacity-0",
              status === "idle" && "border-white bg-white text-ink hover:brightness-95",
              status === "correct" && "border-emerald-500 bg-emerald-100 text-emerald-900",
              status === "wrong" && "border-rose-500 bg-rose-100 text-rose-900",
              status === "muted" && "border-white/70 bg-white/80 text-ink-mute opacity-50",
            )}
            style={{ left: `${left}%`, willChange: "transform" }}
          >
            {/* Tomchi izi */}
            <span
              className="pointer-events-none absolute left-1/2 top-0 -z-10 w-[3px] -translate-x-1/2 -translate-y-full rounded-full opacity-60"
              style={{
                height: compact ? 26 : 40,
                background: `linear-gradient(180deg, transparent, ${color}aa)`,
              }}
              aria-hidden
            />

            <span
              className={cn(
                "grid shrink-0 place-items-center rounded-full text-[11px] text-white",
                compact ? "h-5 w-5" : "h-6 w-6",
              )}
              style={{ background: status === "correct" ? "#10b981" : status === "wrong" ? "#f43f5e" : color }}
            >
              {LETTERS[i]}
            </span>
            <span className="line-clamp-2 leading-tight">{option}</span>
          </button>
        );
      })}

      {/* --- Sachrashlar --- */}
      {splashes.map((splash) => (
        <span
          key={splash.id}
          className="pointer-events-none absolute bottom-3 -translate-x-1/2"
          style={{ left: `${splash.left}%` }}
          aria-hidden
        >
          <span
            className="block h-2 w-10 animate-ripple rounded-full"
            style={{ background: `${splash.color}66` }}
          />
          <span
            className="absolute -top-3 left-1/2 block h-3 w-3 -translate-x-1/2 animate-splash rounded-full"
            style={{ background: `${splash.color}55` }}
          />
        </span>
      ))}

      {/* --- Ko'lmak (yer chizig'i) --- */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-7" aria-hidden>
        <div
          className="absolute inset-x-0 bottom-0 h-3 rounded-t-[50%]"
          style={{ background: `linear-gradient(180deg, ${color}33, ${color}55)` }}
        />
        <div
          className="absolute inset-x-0 bottom-3 h-[3px]"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 12px, transparent 12px 24px)`,
            opacity: 0.5,
          }}
        />
      </div>
    </div>
  );
}
