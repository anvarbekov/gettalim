"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Do'kondan olingan bezaklarni ko'rsatuvchi komponentlar.
 *
 * Do'konda sotib olingan narsa faqat ro'yxatda turib qolsa, XP sarflashning
 * ma'nosi yo'q. Shu sababli ramka, avatar va unvon kabinetda ham, o'yin
 * ekranida ham ko'rinadi.
 */

/* ------------------------------------------------------------------ */
/*  Ramkalar                                                           */
/* ------------------------------------------------------------------ */

interface FrameStyle {
  /** Halqa gradienti. */
  ring: string;
  /** Tashqi yorug'lik. */
  glow: string;
  /** Aylanadimi. */
  spin: boolean;
}

export const FRAMES: Record<string, FrameStyle> = {
  mint: {
    ring: "linear-gradient(140deg,#6ee7b7,#10b981)",
    glow: "0 0 0 0 transparent",
    spin: false,
  },
  ocean: {
    ring: "linear-gradient(140deg,#7dd3fc,#2563eb)",
    glow: "0 0 0 0 transparent",
    spin: false,
  },
  gold: {
    ring: "linear-gradient(140deg,#fde68a,#f59e0b,#fbbf24)",
    glow: "0 0 18px -2px #f59e0b88",
    spin: false,
  },
  fire: {
    ring: "conic-gradient(from 0deg,#f97316,#ef4444,#fbbf24,#f97316)",
    glow: "0 0 20px -2px #f9731699",
    spin: true,
  },
  neon: {
    ring: "linear-gradient(140deg,#c084fc,#7c3aed,#22d3ee)",
    glow: "0 0 22px -2px #a855f7aa",
    spin: false,
  },
  rainbow: {
    ring: "conic-gradient(from 0deg,#ef4444,#f59e0b,#84cc16,#06b6d4,#8b5cf6,#ef4444)",
    glow: "0 0 22px -4px #8b5cf6aa",
    spin: true,
  },
};

export interface AvatarBadgeProps {
  /** Sotib olingan avatar emojisi. Bo'lmasa — ismning birinchi harfi. */
  emoji?: string | null;
  /** Ramka kaliti (`gold`, `fire`, …). */
  frame?: string | null;
  /** Avatar yo'q bo'lganda ko'rsatiladigan ism. */
  name?: string | null;
  /** Piksel o'lchami. */
  size?: number;
  className?: string;
}

/** Avatar + ramka. Ikkalasi ham ixtiyoriy — hech biri bo'lmasa oddiy doira. */
export function AvatarBadge({ emoji, frame, name, size = 56, className }: AvatarBadgeProps) {
  const style = frame ? FRAMES[frame] : undefined;
  const pad = Math.max(3, Math.round(size * 0.07));

  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      {style ? (
        <>
          <span
            className={cn("absolute inset-0 rounded-full", style.spin && "animate-frame-spin")}
            style={{ background: style.ring }}
            aria-hidden
          />
          <span
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: style.glow }}
            aria-hidden
          />
        </>
      ) : null}

      <span
        className={cn(
          "relative grid place-items-center rounded-full",
          // Ramka bo'lmasa oq fon oq sahifada ko'rinmaydi — engil kulrang beramiz
          style ? "bg-white" : "bg-paper ring-2 ring-paper-line",
        )}
        style={{
          width: size - (style ? pad * 2 : 0),
          height: size - (style ? pad * 2 : 0),
          fontSize: Math.round(size * 0.5),
          lineHeight: 1,
        }}
      >
        {emoji ?? (
          <span className="font-extrabold text-ink" style={{ fontSize: Math.round(size * 0.38) }}>
            {(name ?? "?").trim().charAt(0).toUpperCase()}
          </span>
        )}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Kabinet mavzulari                                                  */
/* ------------------------------------------------------------------ */

export const THEMES: Record<string, { background: string; dark: boolean }> = {
  sunset: { background: "linear-gradient(160deg,#fff7ed 0%,#fed7aa 45%,#fdba74 100%)", dark: false },
  ocean: { background: "linear-gradient(160deg,#f0f9ff 0%,#bae6fd 45%,#7dd3fc 100%)", dark: false },
  forest: { background: "linear-gradient(160deg,#f0fdf4 0%,#bbf7d0 45%,#86efac 100%)", dark: false },
  space: { background: "linear-gradient(160deg,#0f172a 0%,#1e1b4b 50%,#312e81 100%)", dark: true },
  candy: { background: "linear-gradient(160deg,#fdf2f8 0%,#fbcfe8 45%,#e9d5ff 100%)", dark: false },
};

/** Kabinet foni. Mavzu tanlanmagan bo'lsa — hech narsa chizmaydi. */
export function ThemeBackdrop({ theme }: { theme?: string | null }) {
  const style = theme ? THEMES[theme] : undefined;
  if (!style) return null;
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ background: style.background }}
      aria-hidden
    />
  );
}

/* ------------------------------------------------------------------ */
/*  To'g'ri javob effektlari                                           */
/* ------------------------------------------------------------------ */

const EFFECT_PARTS: Record<string, { glyphs: string[]; count: number; color?: string }> = {
  confetti: { glyphs: ["🎊", "🎉", "🟡", "🔵", "🔴", "🟢"], count: 16 },
  stars: { glyphs: ["✨", "⭐", "🌟"], count: 14 },
  fire: { glyphs: ["🔥", "💥"], count: 12 },
  bolt: { glyphs: ["⚡"], count: 10 },
  galaxy: { glyphs: ["🌌", "🪐", "✨", "💫"], count: 14 },
};

export interface AnswerEffectProps {
  /** Effekt kaliti. Bo'lmasa hech narsa chiqmaydi. */
  effect?: string | null;
  /** Har safar o'zgarganda effekt qaytadan ishga tushadi. */
  trigger: number;
}

/**
 * To'g'ri javobdan keyin ekran bo'ylab uchadigan zarrachalar.
 * `position: fixed` — o'yin sahnasining ustida turadi.
 */
export function AnswerEffect({ effect, trigger }: AnswerEffectProps) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!effect || trigger <= 0) return;
    setShown(trigger);
    const id = setTimeout(() => setShown(0), 1000);
    return () => clearTimeout(id);
  }, [effect, trigger]);

  const parts = useMemo(() => {
    const conf = effect ? EFFECT_PARTS[effect] : undefined;
    if (!conf) return [];
    return Array.from({ length: conf.count }, (_, i) => {
      const angle = (i / conf.count) * Math.PI * 2 + (i % 3) * 0.2;
      const dist = 90 + (i % 5) * 34;
      return {
        glyph: conf.glyphs[i % conf.glyphs.length],
        bx: `${Math.cos(angle) * dist}px`,
        by: `${Math.sin(angle) * dist - 30}px`,
        delay: (i % 4) * 45,
        size: 18 + (i % 3) * 8,
      };
    });
  }, [effect]);

  if (!effect || shown === 0 || parts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-30 grid place-items-center" aria-hidden>
      {effect === "bolt" ? (
        <span
          key={`flash-${shown}`}
          className="absolute inset-0 animate-bolt-flash"
          style={{ background: "radial-gradient(circle at 50% 45%,#fde68a55,transparent 65%)" }}
        />
      ) : null}

      {parts.map((part, i) => (
        <span
          key={`${shown}-${i}`}
          className="absolute animate-burst-out"
          style={
            {
              "--bx": part.bx,
              "--by": part.by,
              animationDelay: `${part.delay}ms`,
              fontSize: part.size,
            } as React.CSSProperties
          }
        >
          {part.glyph}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Unvon                                                              */
/* ------------------------------------------------------------------ */

export function TitleChip({
  title,
  emoji,
  className,
}: {
  title?: string | null;
  emoji?: string | null;
  className?: string;
}) {
  if (!title) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-[#7a3fd0]/12 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-[#7a3fd0]",
        className,
      )}
    >
      {emoji ? <span aria-hidden>{emoji}</span> : null}
      {title}
    </span>
  );
}
