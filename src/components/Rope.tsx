"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export interface Anchor {
  x: number;
  y: number;
  /** Shu nuqtadagi arqon qalinligi (px). */
  w: number;
}

export interface RopeProps {
  /** Ikki nuqta: chap jamoaning oldingi mushti va o'ng jamoaning oldingi mushti. */
  anchors: Anchor[];
  width: number;
  height: number;
  /** -1 … 1. Musbat — chap jamoa tortyapti. */
  tension: number;
  pulse?: { team: "A" | "B"; n: number } | null;
}

interface P {
  x: number;
  y: number;
  w: number;
}

const SAMPLES = 16;

/** Kub Bezier — arqonning orqadagi bo'sh dumi uchun. */
function cubic(p0: P, c1: { x: number; y: number }, c2: { x: number; y: number }, p1: P, t: number): P {
  const mt = 1 - t;
  return {
    x: mt ** 3 * p0.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t ** 3 * p1.x,
    y: mt ** 3 * p0.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t ** 3 * p1.y,
    w: p0.w + (p1.w - p0.w) * t,
  };
}

/** Kvadrat Bezier. */
function quad(p0: P, c: { x: number; y: number }, p1: P, t: number): P {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * c.x + t * t * p1.x,
    y: mt * mt * p0.y + 2 * mt * t * c.y + t * t * p1.y,
    w: p0.w + (p1.w - p0.w) * t,
  };
}

/** Nuqtalar ketma-ketligidan berilgan kenglikdagi to'ldirilgan konturni yasaydi. */
function ribbon(points: P[], scale: number, offset: number): string {
  if (points.length < 2) return "";
  const top: string[] = [];
  const bottom: string[] = [];

  for (let i = 0; i < points.length; i++) {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const half = (points[i].w * scale) / 2;
    const cx = points[i].x + nx * offset * points[i].w;
    const cy = points[i].y + ny * offset * points[i].w;
    top.push(`${(cx + nx * half).toFixed(2)} ${(cy + ny * half).toFixed(2)}`);
    bottom.push(`${(cx - nx * half).toFixed(2)} ${(cy - ny * half).toFixed(2)}`);
  }

  return `M ${top.join(" L ")} L ${bottom.reverse().join(" L ")} Z`;
}

/**
 * Arqon — to'rt mushtni bog'laydigan uzluksiz ip.
 * Egri chiziq og'irlik ta'sirida osiladi, taranglik oshgani sari to'g'rilanadi.
 * Shakl to'ldirilgan kontur sifatida chiziladi, shuning uchun ikki uchidagi
 * qalinlik har xil bo'lishi va yo'l bo'ylab silliq o'zgarishi mumkin.
 */
export function Rope({ anchors, width, height, tension, pulse }: RopeProps) {
  const bodyRef = useRef<SVGPathElement>(null);
  const shadeRef = useRef<SVGPathElement>(null);
  const shineRef = useRef<SVGPathElement>(null);
  const shadowRef = useRef<SVGPathElement>(null);
  const twistRef = useRef<SVGPathElement>(null);
  const knotRef = useRef<SVGGElement>(null);
  const state = useRef({ sag: 1, wobble: 0, jolt: 0 });

  const draw = () => {
    if (anchors.length < 2 || !width) return;
    const [frontL, frontR] = anchors as P[];
    const span = Math.max(1, frontR.x - frontL.x);

    // Taranglik oshsa osilish kamayadi
    const slack = (1 - Math.min(1, Math.abs(tension) * 0.6)) * state.current.sag;
    const sag = span * 0.024 * slack + state.current.wobble;
    const control = {
      x: (frontL.x + frontR.x) / 2 + state.current.jolt,
      y: (frontL.y + frontR.y) / 2 + sag * 2,
    };

    const points: P[] = [];
    for (let i = 0; i <= SAMPLES; i++) points.push(quad(frontL, control, frontR, i / SAMPLES));

    bodyRef.current?.setAttribute("d", ribbon(points, 1, 0));
    twistRef.current?.setAttribute("d", ribbon(points, 1, 0));
    shineRef.current?.setAttribute("d", ribbon(points, 0.3, -0.24));
    shadeRef.current?.setAttribute("d", ribbon(points, 0.34, 0.28));
    shadowRef.current?.setAttribute("d", ribbon(points, 1.02, 0.42));

    const knot = quad(frontL, control, frontR, 0.5);
    knotRef.current?.setAttribute("transform", `translate(${knot.x} ${knot.y})`);
  };

  useLayoutEffect(draw);

  /* Taranglashgan arqon tinch turmaydi — sekin tebranadi */
  useEffect(() => {
    const w = anchors[0]?.w ?? 10;
    // Yengil tebranish — sekundiga ~20 kadr yetarli, protsessor bo'sh qoladi
    const tween = gsap.to(state.current, {
      wobble: w * 0.22,
      duration: 1.7,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      onUpdate: draw,
    });
    gsap.ticker.fps(30);
    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchors, width, tension]);

  /* Javob berilganda — keskin tortilish, so'ng elastik tinchish */
  useEffect(() => {
    if (!pulse) return;
    const w = anchors[0]?.w ?? 10;
    const dir = pulse.team === "A" ? -1 : 1;
    const tl = gsap.timeline({ onUpdate: draw });
    tl.to(state.current, { sag: 0.2, jolt: dir * w * 2, duration: 0.09, ease: "power3.out" }).to(
      state.current,
      { sag: 1, jolt: 0, duration: 0.95, ease: "elastic.out(1, 0.4)" },
    );
    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulse]);

  const w = anchors[0]?.w ?? 10;

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
    >
      <defs>
        {/* Tolalarning burilishi — qiya chiziqlar */}
        <pattern
          id="rope-twist"
          patternUnits="userSpaceOnUse"
          width={w * 0.62}
          height={w * 4}
          patternTransform="rotate(-28)"
        >
          <rect x={0} width={w * 0.2} height={w * 4} fill="#6f4a28" opacity="0.55" />
          <rect x={w * 0.2} width={w * 0.16} height={w * 4} fill="#a67c4c" opacity="0.42" />
          <rect x={w * 0.38} width={w * 0.2} height={w * 4} fill="#f7e2c2" opacity="0.5" />
        </pattern>
      </defs>

      {/* soya */}
      <path ref={shadowRef} fill="rgba(18,35,63,.20)" />
      {/* asos */}
      <path ref={bodyRef} fill="#c9a173" />
      {/* o'rim */}
      <path ref={twistRef} fill="url(#rope-twist)" />
      {/* pastki soyalash */}
      <path ref={shadeRef} fill="#8f6539" opacity="0.5" />
      {/* yuqori yorug'lik */}
      <path ref={shineRef} fill="#f0d3ab" opacity="0.62" />

      {/* markaz belgisi — qizil popuk */}
      <g ref={knotRef}>
        <rect x={-w * 0.32} y={-w * 0.7} width={w * 0.64} height={w * 1.4} rx={w * 0.22} fill="#7d5230" />
        <path d={`M ${-w * 0.58} ${w * 0.5} L ${w * 0.58} ${w * 0.5} L 0 ${w * 3} Z`} fill="#d2402f" />
        <path d={`M ${-w * 0.58} ${w * 0.5} L 0 ${w * 0.5} L 0 ${w * 3} Z`} fill="#b8331f" />
        <circle cx={0} cy={w * 0.45} r={w * 0.32} fill="#9e2b1e" />
      </g>
    </svg>
  );
}
