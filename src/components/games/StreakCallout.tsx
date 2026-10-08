"use client";

import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sound";

/**
 * Seriya e'loni: jamoa ketma-ket 3, 5, 7, 10… ta to'g'ri javob bersa,
 * ekran o'rtasida katta yozuv chiqadi va ohang yangraydi.
 *
 * Har bir o'yin o'z jamoalarining `streak` qiymatlarini beradi — komponent
 * qachon e'lon qilishni o'zi biladi (faqat seriya o'sganda, bir marta).
 */

const MILESTONES = [3, 5, 7, 10, 15, 20];

const TEXT: Record<number, string> = {
  3: "Ketma-ket 3 ta!",
  5: "5 ta ketma-ket — olov!",
  7: "7 ta! To'xtatib bo'lmaydi!",
  10: "10 ta! Afsonaviy!",
  15: "15 ta! Chempion!",
  20: "20 ta! Ishonib bo'lmaydi!",
};

interface Callout {
  id: number;
  name: string;
  streak: number;
  color: string;
}

export function StreakCallout({
  streaks,
  names,
  colors,
}: {
  streaks: number[];
  names: string[];
  colors: string[];
}) {
  const prev = useRef<number[]>([]);
  const [callout, setCallout] = useState<Callout | null>(null);
  const id = useRef(0);

  useEffect(() => {
    streaks.forEach((n, i) => {
      const before = prev.current[i] ?? 0;
      if (n > before && MILESTONES.includes(n)) {
        id.current += 1;
        setCallout({ id: id.current, name: names[i] ?? `${i + 1}-jamoa`, streak: n, color: colors[i] ?? "#12233f" });
        sfx.streak(MILESTONES.indexOf(n) + 1);
      }
    });
    prev.current = streaks;
  }, [streaks, names, colors]);

  useEffect(() => {
    if (!callout) return;
    const t = setTimeout(() => setCallout(null), 1700);
    return () => clearTimeout(t);
  }, [callout]);

  if (!callout) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[22%] z-40 flex justify-center px-4" aria-live="polite">
      <div
        key={callout.id}
        className="animate-pop-in rounded-2xl px-6 py-4 text-center text-white shadow-lift"
        style={{ backgroundColor: callout.color }}
      >
        <p className="text-4xl font-extrabold leading-none sm:text-5xl">
          🔥 {callout.streak}
        </p>
        <p className="mt-1 text-lg font-extrabold sm:text-xl">{TEXT[callout.streak]}</p>
        <p className="text-sm font-bold text-white/80">{callout.name}</p>
      </div>
    </div>
  );
}
