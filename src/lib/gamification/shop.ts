"use client";

import { getBrowserClient } from "@/lib/supabase/client";

/* ------------------------------------------------------------------ */
/*  Mening xatolarim                                                   */
/* ------------------------------------------------------------------ */

export interface Mistake {
  question: string;
  correctAnswer: string | null;
  lastAnswer: string | null;
  timesWrong: number;
  lastAt: string;
}

/**
 * O'quvchining hali to'g'ri javob bermagan savollari.
 *
 * Savolga keyinchalik to'g'ri javob berilsa, u ro'yxatdan chiqadi — ya'ni
 * ro'yxat qisqarib borishi bolaning o'sishini ko'rsatadi.
 */
export async function fetchMistakes(limit = 40): Promise<Mistake[]> {
  const supabase = getBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("my_mistakes", { p_limit: limit });
  if (error) return [];
  return ((data as unknown as {
    question_text: string;
    correct_answer: string | null;
    last_answer: string | null;
    times_wrong: number;
    last_at: string;
  }[] | null) ?? []).map((row) => ({
    question: row.question_text,
    correctAnswer: row.correct_answer,
    lastAnswer: row.last_answer,
    timesWrong: row.times_wrong,
    lastAt: row.last_at,
  }));
}

/* ------------------------------------------------------------------ */
/*  XP do'koni                                                         */
/* ------------------------------------------------------------------ */

export type ShopKind = "avatar" | "racer" | "title";

export interface ShopItem {
  id: string;
  kind: ShopKind;
  title: string;
  emoji: string | null;
  price: number;
  owned: boolean;
  equipped: boolean;
}

export const KIND_LABEL: Record<ShopKind, string> = {
  avatar: "Avatarlar",
  racer: "Poyga ko'rinishlari",
  title: "Unvonlar",
};

export async function fetchShop(): Promise<ShopItem[]> {
  const supabase = getBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("my_shop");
  if (error) return [];
  return ((data as unknown as ShopItem[] | null) ?? []).map((row) => ({
    ...row,
    kind: row.kind as ShopKind,
  }));
}

export async function buyItem(itemId: string): Promise<{ ok: boolean; message: string; xp: number }> {
  const supabase = getBrowserClient();
  if (!supabase) return { ok: false, message: "Supabase sozlanmagan.", xp: 0 };
  const { data, error } = await supabase.rpc("buy_item", { p_item: itemId });
  if (error) return { ok: false, message: error.message, xp: 0 };
  const row = (data as unknown as { ok: boolean; message: string; xp: number }[] | null)?.[0];
  return row ?? { ok: false, message: "Xatolik", xp: 0 };
}

export async function equipItem(itemId: string): Promise<boolean> {
  const supabase = getBrowserClient();
  if (!supabase) return false;
  const { error } = await supabase.rpc("equip_item", { p_item: itemId });
  return !error;
}
