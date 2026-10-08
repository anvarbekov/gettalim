"use client";

import { useEffect, useState } from "react";
import { Arena } from "@/components/Arena";
import { BUILTIN_CHARACTERS } from "@/lib/characters";

/**
 * Bosh sahifadagi namoyish arqon tortish.
 * O'z holatini o'zi saqlaydi — butun sahifa har 1.8 soniyada qayta
 * chizilmaydi. Tab ko'rinmay turganda to'xtaydi.
 */
export default function HeroArena() {
  const [pull, setPull] = useState(1);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (!document.hidden) setPull((p) => (p >= 2 ? -2 : p + 1));
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <Arena
      pull={pull}
      pullToWin={4}
      aName="1-Jamoa"
      bName="2-Jamoa"
      charA={BUILTIN_CHARACTERS[0]}
      charB={BUILTIN_CHARACTERS[1] ?? BUILTIN_CHARACTERS[0]}
    />
  );
}
