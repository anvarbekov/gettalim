import type { MemorySize, Pack, Question } from "@/lib/types";
import { shuffle } from "@/lib/utils";

/**
 * "Xotira jufti" mantiqi.
 *
 * Har bir juft — **atama ↔ ta'rif**: savol matni bir kartochkada,
 * to'g'ri javob ikkinchisida. Juftlik topilganda ikkalasi birga
 * ko'rsatiladi — o'quv effekti aynan shu yerda.
 */

export interface MemoryCard {
  id: string;
  /** Juftlikni bog'lovchi kalit. */
  pairId: string;
  kind: "term" | "definition";
  text: string;
  /** Juft ochilganda ko'rsatiladigan to'liq ma'lumot. */
  term: string;
  definition: string;
}

export const SIZE_INFO: Record<MemorySize, { cols: number; rows: number; pairs: number; label: string }> = {
  "4x4": { cols: 4, rows: 4, pairs: 8, label: "4 × 4 · 8 juft" },
  "4x5": { cols: 5, rows: 4, pairs: 10, label: "4 × 5 · 10 juft" },
  "6x6": { cols: 6, rows: 6, pairs: 18, label: "6 × 6 · 18 juft" },
};

/** Uzun matnni kartochkaga sig'adigan qilib qisqartiradi. */
function trim(text: string, limit: number): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length <= limit ? clean : `${clean.slice(0, limit - 1)}…`;
}

/**
 * Paketdan juftliklar to'plamini yasaydi.
 * Javobi bir xil bo'lgan savollar tashlab ketiladi — aks holda
 * ikkita ta'rif bir xil atamaga to'g'ri kelib qoladi.
 */
export function buildDeck(pack: Pack | undefined, size: MemorySize): { cards: MemoryCard[]; shortage: number } {
  const need = SIZE_INFO[size].pairs;
  if (!pack || pack.generator) return { cards: [], shortage: need };

  const seen = new Set<string>();
  const usable: Question[] = [];
  shuffle(pack.questions).forEach((q) => {
    const key = q.answer.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    usable.push(q);
  });

  const picked = usable.slice(0, need);
  const cards: MemoryCard[] = [];

  picked.forEach((q, i) => {
    const pairId = `p${i}`;
    const term = q.answer.trim();
    const definition = q.prompt.trim();
    cards.push(
      { id: `${pairId}-d`, pairId, kind: "definition", text: trim(definition, 90), term, definition },
      { id: `${pairId}-t`, pairId, kind: "term", text: trim(term, 40), term, definition },
    );
  });

  return { cards: shuffle(cards), shortage: Math.max(0, need - picked.length) };
}
