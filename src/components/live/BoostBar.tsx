"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fetchBoosts, spendBoost, type Boost } from "@/lib/gamification/shop";
import type { BoostKind } from "@/lib/live/protocol";

/**
 * O'yin paytidagi kuchaytirgich paneli.
 *
 * Kuchaytirgich XP do'konidan sotib olinadi va bir marta ishlatiladi. Soni
 * serverda kamayadi — brauzerdagi raqamni o'zgartirib qo'shimcha olib
 * bo'lmaydi.
 */

const HINT: Record<BoostKind, string> = {
  fifty: "Ikkita noto'g'ri variant o'chadi",
  shield: "Xato javob jarimasiz o'tadi",
  double: "To'g'ri javob ikki barobar ball",
  retry: "Xato qilsangiz qayta javob berasiz",
};

export interface BoostBarProps {
  /** Javob berilganda panel o'chadi — o'yin adolatli qolsin. */
  locked: boolean;
  /** Shu savolda allaqachon ishlatilganlar. */
  usedHere: BoostKind[];
  /** HOST ga xabar yuborish. `false` qaytsa — kuchaytirgich sarflanmaydi. */
  onUse: (kind: BoostKind) => boolean;
  /** Savol raqami — o'zgarganda panel yangilanadi. */
  step: number;
}

export function BoostBar({ locked, usedHere, onUse, step }: BoostBarProps) {
  const [boosts, setBoosts] = useState<Boost[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(() => {
    void fetchBoosts().then(setBoosts);
  }, []);

  useEffect(load, [load]);

  const run = async (boost: Boost) => {
    if (locked || busy) return;
    // Avval HOST ga aytamiz — qabul qilinmasa XP sarflanmaydi.
    if (!onUse(boost.key)) return;

    setBusy(boost.id);
    const left = await spendBoost(boost.id);
    setBusy(null);

    if (left === null) {
      load();
      return;
    }
    setBoosts((list) =>
      list.map((b) => (b.id === boost.id ? { ...b, qty: left } : b)).filter((b) => b.qty > 0),
    );
    setFlash(boost.id);
    setTimeout(() => setFlash(null), 1200);
  };

  if (boosts.length === 0) return null;

  return (
    <div key={step} className="flex items-center justify-center gap-2">
      {boosts.map((boost) => {
        const used = usedHere.includes(boost.key);
        const off = locked || used;
        return (
          <button
            key={boost.id}
            type="button"
            title={HINT[boost.key]}
            disabled={off || busy === boost.id}
            onClick={() => void run(boost)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-xl border-2 px-2.5 py-1.5 text-sm font-extrabold transition",
              off
                ? "border-white/10 bg-white/5 text-white/30"
                : "border-white/25 bg-white/10 text-white hover:bg-white/20 active:translate-y-[2px]",
              flash === boost.id && "animate-pop-in border-emerald-400 bg-emerald-500/30",
            )}
          >
            <span className="text-base leading-none" aria-hidden>
              {boost.emoji}
            </span>
            <span className="font-mono text-xs">×{boost.qty}</span>
          </button>
        );
      })}
    </div>
  );
}
