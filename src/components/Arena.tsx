/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Rope, type Anchor } from "@/components/Rope";
import type { CharacterModel } from "@/lib/characters";
import { clamp } from "@/lib/utils";

export interface ArenaProps {
  /** A.pull - B.pull. Musbat bo'lsa arqon 1-jamoa tomonga siljiydi. */
  pull: number;
  pullToWin: number;
  aName: string;
  bName: string;
  charA: CharacterModel;
  charB: CharacterModel;
  pulse?: { team: "A" | "B"; n: number } | null;
  paused?: boolean;
  finished?: boolean;
}

function sideOf(model: CharacterModel, which: "left" | "right") {
  const thickness = model.ropeThickness ?? 0.026;
  const gripLeft = model.gripX ?? 1;
  if (which === "left")
    return {
      src: model.leftSrc,
      backSrc: model.backLeftSrc ?? model.leftSrc,
      flip: false,
      ratio: model.ropeRatio,
      thickness,
      grip: gripLeft,
    };
  if (model.rightSrc)
    return {
      src: model.rightSrc,
      backSrc: model.backRightSrc ?? model.rightSrc,
      flip: false,
      ratio: model.ropeRatioRight ?? model.ropeRatio,
      thickness,
      grip: model.gripXRight ?? 1 - gripLeft,
    };
  // aylantirilgan rasm — musht ham aks etadi
  return {
    src: model.leftSrc,
    backSrc: model.backLeftSrc ?? model.leftSrc,
    flip: true,
    ratio: model.ropeRatio,
    thickness,
    grip: 1 - gripLeft,
  };
}

/** Arqon uchini musht ortiga kiritish (rasm balandligiga nisbatan) — chok qo'l ostida qoladi. */
const TUCK = 0.075;

/** Chizilgan arqon rasmnikidan biroz to'liqroq ko'rinsin. */
const THICKNESS_BOOST = 1.1;

export function Arena({ pull, pullToWin, aName, bName, charA, charB, pulse, paused, finished }: ArenaProps) {
  const scope = useRef<HTMLDivElement>(null);
  const rig = useRef<HTMLDivElement>(null);
  const teamA = useRef<HTMLDivElement>(null);
  const teamB = useRef<HTMLDivElement>(null);
  const dustA = useRef<HTMLDivElement>(null);
  const dustB = useRef<HTMLDivElement>(null);

  const backA = useRef<HTMLImageElement>(null);
  const frontA = useRef<HTMLImageElement>(null);
  const frontB = useRef<HTMLImageElement>(null);
  const backB = useRef<HTMLImageElement>(null);

  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [box, setBox] = useState({ w: 0, h: 0 });

  const a = sideOf(charA, "left");
  const b = sideOf(charB, "right");

  /** Har bir rasmdagi musht nuqtasini o'lchaydi — rasm o'lchami qanday bo'lsa ham to'g'ri chiqadi. */
  const measure = useCallback(() => {
    const host = rig.current;
    if (!host) return;
    const base = host.getBoundingClientRect();
    if (!base.width) return;

    const point = (
      img: HTMLImageElement | null,
      side: { ratio: number; thickness: number; grip: number },
      edge: "right" | "left",
    ): Anchor | null => {
      if (!img) return null;
      const r = img.getBoundingClientRect();
      if (!r.height) return null;
      const tuck = r.height * TUCK * (edge === "right" ? -1 : 1);
      return {
        // musht nuqtasi + biroz ichkariga — chok barmoqlar ostida qoladi
        x: r.left - base.left + r.width * side.grip + tuck,
        y: r.top - base.top + r.height * side.ratio,
        w: r.height * side.thickness * THICKNESS_BOOST,
      };
    };

    const list = [point(frontA.current, a, "right"), point(frontB.current, b, "left")];
    if (list.some((p) => p === null)) return;
    setAnchors(list as Anchor[]);
    setBox({ w: base.width, h: base.height });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.ratio, b.ratio, a.thickness, b.thickness, a.grip, b.grip]);

  useLayoutEffect(() => {
    measure();
    const host = rig.current;
    if (!host || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, [measure]);

  /* Doimiy zo'riqish — jamoalar nafas olib turgandek tebranadi */
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to([teamA.current, teamB.current], {
        x: (i: number) => (i === 0 ? -4 : 4),
        duration: 0.9,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: 0.12,
      });
    }, scope);
    return () => ctx.revert();
  }, []);

  /* Umumiy siljish — hisob farqiga qarab */
  useLayoutEffect(() => {
    const ratio = clamp(pull / Math.max(1, pullToWin), -1, 1);
    // Arqon rig ichida — u ham birga siljiydi, qayta o'lchash shart emas
    gsap.to(rig.current, { xPercent: -ratio * 9, duration: 1.1, ease: "elastic.out(1, 0.62)" });
  }, [pull, pullToWin]);

  /* Javob berilganda — chang ko'tarilishi */
  useEffect(() => {
    if (!pulse) return;
    const dust = pulse.team === "A" ? dustA.current : dustB.current;
    const tween = gsap.fromTo(
      dust,
      { opacity: 0.55, scale: 0.4 },
      { opacity: 0, scale: 1.7, duration: 0.7, ease: "power2.out" },
    );
    return () => {
      tween.kill();
    };
  }, [pulse]);

  const ratio = clamp(pull / Math.max(1, pullToWin), -1, 1);
  const imgStyle = (flip: boolean, strong: boolean) => ({
    filter: strong
      ? "drop-shadow(0 10px 12px rgba(18,35,63,.22))"
      : "drop-shadow(0 8px 10px rgba(18,35,63,.18))",
    transform: flip ? ("scaleX(-1)" as const) : undefined,
  });

  return (
    <div className="arena-box w-full">
      <div
        ref={scope}
        className="arena-stage relative w-full overflow-hidden rounded-xl2 border border-paper-line bg-[var(--arena-floor)]"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-white to-transparent" />
          <div className="absolute inset-x-0 bottom-[16%] h-px bg-paper-line" />
          <div className="chalk-line absolute bottom-[8%] left-1/2 top-[6%] w-[3px] -translate-x-1/2 opacity-90" />
          <div className="absolute bottom-[16%] left-[9%] top-[12%] w-[2px] bg-teamA/25" />
          <div className="absolute bottom-[16%] right-[9%] top-[12%] w-[2px] bg-teamB/25" />
        </div>

        <div className="pointer-events-none absolute left-4 top-3 max-w-[38%] truncate text-sm font-extrabold text-teamA">
          {aName}
        </div>
        <div className="pointer-events-none absolute right-4 top-3 max-w-[38%] truncate text-right text-sm font-extrabold text-teamB">
          {bName}
        </div>

        <div ref={rig} className="absolute inset-x-0 bottom-[13%]" style={{ willChange: "transform" }}>
          {/* Arqon — personajlar ortida, to'rt mushtni bog'laydi */}
          <div className="absolute inset-0 z-0">
            <Rope anchors={anchors} width={box.w} height={box.h} tension={ratio} pulse={pulse} />
          </div>

          <div className="relative z-10 flex items-end justify-center">
            {/* 1-jamoa */}
            <div ref={teamA} className="relative" style={{ height: "var(--ph)", width: "calc(var(--ph) * 1.08)" }}>
              <div ref={dustA} className="ground-shadow absolute -bottom-2 left-0 h-8 w-24 opacity-0" aria-hidden />
              <img
                ref={backA}
                src={a.backSrc}
                alt=""
                aria-hidden
                onLoad={measure}
                className="absolute bottom-0 left-0 h-full brightness-[.96]"
                style={imgStyle(a.flip, false)}
              />
              <img
                ref={frontA}
                src={a.src}
                alt={aName}
                onLoad={measure}
                className="absolute bottom-0 right-0 h-full"
                style={imgStyle(a.flip, true)}
              />
            </div>

            {/* Arqonning ochiq qismi */}
            <div style={{ height: "var(--ph)", width: "var(--rope-w)" }} aria-hidden />

            {/* 2-jamoa */}
            <div ref={teamB} className="relative" style={{ height: "var(--ph)", width: "calc(var(--ph) * 1.08)" }}>
              <div ref={dustB} className="ground-shadow absolute -bottom-2 right-0 h-8 w-24 opacity-0" aria-hidden />
              <img
                ref={backB}
                src={b.backSrc}
                alt=""
                aria-hidden
                onLoad={measure}
                className="absolute bottom-0 right-0 h-full brightness-[.96]"
                style={imgStyle(b.flip, false)}
              />
              <img
                ref={frontB}
                src={b.src}
                alt={bName}
                onLoad={measure}
                className="absolute bottom-0 left-0 h-full"
                style={imgStyle(b.flip, true)}
              />
            </div>
          </div>
        </div>

        <div className="absolute inset-x-6 bottom-3 h-2 rounded-full bg-paper-line/80">
          <div
            className="absolute top-0 h-2 rounded-full transition-[width,left] duration-700"
            style={{
              left: ratio >= 0 ? `${50 - Math.abs(ratio) * 50}%` : "50%",
              width: `${Math.abs(ratio) * 50}%`,
              background: ratio >= 0 ? "#1f6fd0" : "#d2402f",
            }}
          />
          <div className="absolute left-1/2 top-[-3px] h-3.5 w-[2px] -translate-x-1/2 bg-ink/30" />
        </div>

        {paused && !finished ? (
          <div className="absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-[2px]">
            <span className="rounded-full bg-ink px-5 py-2 text-sm font-extrabold text-white">II</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
