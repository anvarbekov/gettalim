import { shuffle } from "@/lib/utils";

/**
 * "Xazina xaritasi" — yo'l bo'ylab qadam tashlash o'yini.
 *
 * Kataklar har safar qaytadan tasodifiy joylashtiriladi, shuning uchun
 * o'qituvchi tayyorgarlik ko'rmaydi va har bir dars yangi o'yin bo'ladi.
 */

export type TileKind = "plain" | "bonus" | "trap" | "chance" | "treasure";

export interface Tile {
  index: number;
  kind: TileKind;
  /** Bonus/tuzoq nechta katakka siljitadi. */
  amount: number;
}

export const TILE_INFO: Record<TileKind, { label: string; icon: string; color: string }> = {
  plain: { label: "Oddiy katak", icon: "", color: "#e9eef5" },
  bonus: { label: "Bonus", icon: "⭐", color: "#1f9d63" },
  trap: { label: "Tuzoq", icon: "🕳️", color: "#d2402f" },
  chance: { label: "Omad", icon: "🎲", color: "#7a3fd0" },
  treasure: { label: "Xazina", icon: "💎", color: "#e0a92e" },
};

/**
 * Yo'lni yasaydi. Bonus va tuzoqlar boshdan biroz uzoqroqqa qo'yiladi —
 * birinchi qadamdayoq orqaga tushib qolish qiziq emas.
 */
export function buildPath(length: number, withEvents: boolean): Tile[] {
  const tiles: Tile[] = Array.from({ length }, (_, index) => ({
    index,
    kind: "plain" as TileKind,
    amount: 0,
  }));

  tiles[length - 1] = { index: length - 1, kind: "treasure", amount: 0 };

  if (!withEvents) return tiles;

  // Voqealar 3-katakdan boshlanadi va marraga tegmaydi
  const free = Array.from({ length }, (_, i) => i).filter((i) => i >= 3 && i < length - 2);
  const picked = shuffle(free);

  const bonuses = Math.max(2, Math.round(length * 0.16));
  const traps = Math.max(2, Math.round(length * 0.14));
  const chances = Math.max(1, Math.round(length * 0.08));

  let cursor = 0;
  const take = (count: number, kind: TileKind, amounts: number[]) => {
    for (let i = 0; i < count && cursor < picked.length; i += 1, cursor += 1) {
      const index = picked[cursor];
      tiles[index] = { index, kind, amount: amounts[i % amounts.length] };
    }
  };

  take(bonuses, "bonus", [2, 3, 2]);
  take(traps, "trap", [2, 1, 3]);
  take(chances, "chance", [0]);

  return tiles;
}

/** "Omad" katagi — tasodifiy oldinga yoki orqaga. */
export function rollChance(): { amount: number; text: string } {
  const options = [
    { amount: 3, text: "Omad kulib boqdi — 3 katak oldinga!" },
    { amount: 2, text: "Yaxshi topildiq — 2 katak oldinga." },
    { amount: -2, text: "Yo'l yopilibdi — 2 katak orqaga." },
    { amount: -1, text: "Bir oz adashdingiz — 1 katak orqaga." },
    { amount: 1, text: "Kichik yordam — 1 katak oldinga." },
  ];
  return options[Math.floor(Math.random() * options.length)];
}

/** Qadamdan keyin katak ta'sirini hisoblaydi. */
export function applyTile(
  position: number,
  tiles: Tile[],
): { position: number; message: string | null; kind: TileKind } {
  const tile = tiles[position];
  if (!tile) return { position, message: null, kind: "plain" };

  if (tile.kind === "bonus") {
    const next = Math.min(tiles.length - 1, position + tile.amount);
    return { position: next, message: `⭐ Bonus! ${tile.amount} katak oldinga.`, kind: "bonus" };
  }
  if (tile.kind === "trap") {
    const next = Math.max(0, position - tile.amount);
    return { position: next, message: `🕳️ Tuzoq! ${tile.amount} katak orqaga.`, kind: "trap" };
  }
  if (tile.kind === "chance") {
    const roll = rollChance();
    const next = Math.min(tiles.length - 1, Math.max(0, position + roll.amount));
    return { position: next, message: `🎲 ${roll.text}`, kind: "chance" };
  }
  return { position, message: null, kind: tile.kind };
}
