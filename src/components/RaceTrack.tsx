/* eslint-disable @next/next/no-img-element */
"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { getRacer, getRacerSet, LANE_COLORS, type RacerKind } from "@/lib/racers";
import { cn } from "@/lib/utils";

export interface RaceTrackProps {
  teams: string[];
  steps: number[];
  distance: number;
  racer: RacerKind;
  /** To'g'ri javobda tezlanish animatsiyasi. */
  boost?: { lane: number; n: number } | null;
  places: (number | null)[];
  labels: { start: string; finish: string; steps: string };
}

export function RaceTrack({ teams, steps, distance, racer, boost, places, labels }: RaceTrackProps) {
  const scope = useRef<HTMLDivElement>(null);
  const runners = useRef<(HTMLDivElement | null)[]>([]);
  const set = getRacerSet(racer);

  /* Har bir qadamda oldinga siljish */
  useLayoutEffect(() => {
    steps.forEach((value, lane) => {
      const node = runners.current[lane];
      if (!node) return;
      // chopuvchi yo'lakcha ichida to'liq ko'rinadi
      gsap.to(node, {
        left: `${10 + (Math.min(value, distance) / distance) * 82}%`,
        duration: 0.85,
        ease: "power2.out",
      });
    });
  }, [steps, distance]);

  /* Tezlanish — sakrash va bir oz cho'zilish */
  useLayoutEffect(() => {
    if (!boost) return;
    const node = runners.current[boost.lane];
    if (!node) return;
    const ctx = gsap.context(() => {
      gsap
        .timeline()
        .to(node, { y: -10, scaleX: 1.06, duration: 0.14, ease: "power2.out" })
        .to(node, { y: 0, scaleX: 1, duration: 0.5, ease: "bounce.out" });
    }, scope);
    return () => ctx.revert();
  }, [boost]);

  return (
    <div ref={scope} className="surface overflow-hidden">
      {/* Start va marra sarlavhasi */}
      <div className="flex items-center justify-between border-b border-paper-line bg-paper/70 px-4 py-2">
        <span className="eyebrow">{labels.start}</span>
        <span className="eyebrow flex items-center gap-1.5 text-ink">
          <span className="inline-block h-3 w-3 rounded-[2px] bg-[repeating-conic-gradient(#12233f_0_25%,#fff_0_50%)] bg-[length:6px_6px]" />
          {labels.finish} · {distance} {labels.steps}
        </span>
      </div>

      <div className="divide-y divide-paper-line/70">
        {teams.map((name, lane) => {
          const color = LANE_COLORS[lane % LANE_COLORS.length];
          const model = getRacer(racer, lane + 1);
          const progress = Math.min(steps[lane] ?? 0, distance) / distance;
          const place = places[lane];

          return (
            <div key={lane} className="relative" style={{ background: `${color}08` }}>
              <div className="flex items-center gap-3 px-3 py-2">
                {/* Jamoa yorlig'i */}
                <div className="flex w-28 shrink-0 items-center gap-2 sm:w-36">
                  <span
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold text-white"
                    style={{ background: color }}
                  >
                    {lane + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold text-ink">{name}</span>
                    <span className="block font-mono text-[11px] tabular-nums text-ink-mute">
                      {steps[lane] ?? 0}/{distance}
                    </span>
                  </span>
                </div>

                {/* Yo'lakcha */}
                <div className="relative h-16 flex-1 sm:h-[4.5rem]">
                  {/* asfalt / maydon */}
                  <div className="absolute inset-x-0 bottom-1 top-1 rounded-lg bg-white/70" />
                  <div
                    className="absolute inset-y-1 left-0 rounded-l-lg transition-[width] duration-700"
                    style={{ width: `${10 + progress * 82}%`, background: `${color}14` }}
                  />
                  {/* markaz punktiri */}
                  <div
                    className="absolute inset-x-2 top-1/2 h-[3px] -translate-y-1/2 opacity-40"
                    style={{
                      backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 14px, transparent 14px 28px)`,
                    }}
                  />
                  {/* marra chizig'i */}
                  <div className="absolute inset-y-1 right-0 w-2 rounded-r-lg bg-[repeating-conic-gradient(#12233f_0_25%,#fff_0_50%)] bg-[length:8px_8px]" />

                  {/* Chopuvchi */}
                  <div
                    ref={(el) => {
                      runners.current[lane] = el;
                    }}
                    className="absolute bottom-0 top-0"
                    style={{ left: "10%", width: 0 }}
                  >
                    <img
                      src={model.src}
                      alt=""
                      aria-hidden
                      className="absolute bottom-1 max-w-none -translate-x-1/2 object-contain"
                      style={{
                        height: `${set.scale * 92}%`,
                        filter: "drop-shadow(0 6px 8px rgba(18,35,63,.28))",
                      }}
                    />
                  </div>
                </div>

                {/* O'rin */}
                <div className="w-9 shrink-0 text-right">
                  {place ? (
                    <span
                      className={cn(
                        "inline-grid h-8 w-8 place-items-center rounded-full text-sm font-extrabold text-white",
                        place === 1 ? "bg-gold" : "bg-ink-mute",
                      )}
                    >
                      {place}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
