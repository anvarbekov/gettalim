"use client";

import { getBrowserClient } from "@/lib/supabase/client";
import type { BoostKind } from "@/lib/live/protocol";

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

export type ShopKind =
  | "reward"
  | "boost"
  | "avatar"
  | "frame"
  | "effect"
  | "theme"
  | "racer"
  | "title";

export interface ShopItem {
  id: string;
  kind: ShopKind;
  title: string;
  emoji: string | null;
  description: string | null;
  /** Ilova ichida ishlatiladigan kalit: ramka uslubi, effekt turi, mavzu nomi. */
  value: string | null;
  price: number;
  /** Shu darajaga yetmaguncha sotib olib bo'lmaydi. */
  minLevel: number;
  /** Sarflanuvchi (kuchaytirgich) — bir necha marta sotib olinadi. */
  consumable: boolean;
  owned: boolean;
  qty: number;
  equipped: boolean;
}

/** Do'kon bo'limlari — shu tartibda ko'rsatiladi. */
export const KIND_ORDER: ShopKind[] = [
  "reward",
  "boost",
  "avatar",
  "frame",
  "effect",
  "theme",
  "racer",
  "title",
];

export const KIND_LABEL: Record<ShopKind, string> = {
  reward: "Haqiqiy sovg'alar",
  boost: "Kuchaytirgichlar",
  avatar: "Avatarlar",
  frame: "Ramkalar",
  effect: "To'g'ri javob effektlari",
  theme: "Kabinet mavzulari",
  racer: "Poyga ko'rinishlari",
  title: "Unvonlar",
};

export const KIND_HINT: Record<ShopKind, string> = {
  reward:
    "Bu ekrandagi bezak emas — sinfdagi haqiqiy imtiyoz. Kupon o'qituvchiga boradi, u tasdiqlagach amal qiladi. Tasdiqlanmasa XP qaytariladi.",
  boost: "O'yin paytida ishlatiladi va sarflanadi. Bir nechtasini olib qo'ysa bo'ladi.",
  avatar: "Kabinetda va reytingda ismingiz yonida turadi.",
  frame: "Avatar atrofidagi halqa — uzoqdan ham ko'rinadi.",
  effect: "To'g'ri javob berganingizda ekranda chiqadi.",
  theme: "Kabinet fonining rangini o'zgartiradi.",
  racer: "Poyga o'yinida sizning ko'rinishingiz.",
  title: "Ism ostida yoziladi.",
};

type ShopRow = Omit<ShopItem, "kind" | "minLevel"> & {
  kind: string;
  min_level: number;
};

export async function fetchShop(): Promise<ShopItem[]> {
  const supabase = getBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("my_shop");
  if (error) return [];
  return ((data as unknown as ShopRow[] | null) ?? []).map((row) => ({
    id: row.id,
    kind: row.kind as ShopKind,
    title: row.title,
    emoji: row.emoji,
    description: row.description ?? null,
    value: row.value ?? null,
    price: row.price,
    minLevel: row.min_level ?? 1,
    consumable: row.consumable ?? false,
    owned: row.owned,
    qty: row.qty ?? 0,
    equipped: row.equipped,
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

/* ------------------------------------------------------------------ */
/*  Kiyilgan narsalar                                                  */
/* ------------------------------------------------------------------ */

export interface Loadout {
  avatar: string | null; // emoji
  frame: string | null; // 'gold' | 'fire' | …
  effect: string | null; // 'confetti' | 'stars' | …
  theme: string | null; // 'sunset' | 'ocean' | …
  racer: string | null; // emoji
  title: string | null; // unvon matni
  titleEmoji: string | null;
}

export const EMPTY_LOADOUT: Loadout = {
  avatar: null,
  frame: null,
  effect: null,
  theme: null,
  racer: null,
  title: null,
  titleEmoji: null,
};

export async function fetchLoadout(): Promise<Loadout> {
  const supabase = getBrowserClient();
  if (!supabase) return EMPTY_LOADOUT;
  const { data, error } = await supabase.rpc("my_loadout");
  if (error) return EMPTY_LOADOUT;

  const rows = (data as unknown as {
    kind: string;
    id: string;
    title: string;
    emoji: string | null;
    value: string | null;
  }[] | null) ?? [];

  const out = { ...EMPTY_LOADOUT };
  rows.forEach((row) => {
    switch (row.kind) {
      case "avatar":
        out.avatar = row.emoji;
        break;
      case "racer":
        out.racer = row.emoji;
        break;
      case "frame":
        out.frame = row.value;
        break;
      case "effect":
        out.effect = row.value;
        break;
      case "theme":
        out.theme = row.value;
        break;
      case "title":
        out.title = row.title;
        out.titleEmoji = row.emoji;
        break;
      default:
        break;
    }
  });
  return out;
}

/* ------------------------------------------------------------------ */
/*  Kuchaytirgichlar                                                   */
/* ------------------------------------------------------------------ */

/** Kuchaytirgich turlari — o'yin protokoli bilan bir xil. */
export type BoostKey = BoostKind;

export interface Boost {
  id: string;
  title: string;
  emoji: string | null;
  key: BoostKey;
  qty: number;
}

/** O'quvchining qo'lidagi kuchaytirgichlar (soni 0 dan katta bo'lganlari). */
export async function fetchBoosts(): Promise<Boost[]> {
  const supabase = getBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("my_boosts");
  if (error) return [];
  return ((data as unknown as {
    id: string;
    title: string;
    emoji: string | null;
    value: string | null;
    qty: number;
  }[] | null) ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    emoji: row.emoji,
    key: (row.value ?? "fifty") as BoostKey,
    qty: row.qty,
  }));
}

/**
 * Kuchaytirgichni sarflash.
 *
 * Qaytadi: qolgan soni, yoki mahsulot yo'q bo'lsa `null`. Ishlatish serverda
 * hisoblanadi — brauzerdagi son bilan aldab bo'lmaydi.
 */
export async function spendBoost(itemId: string): Promise<number | null> {
  const supabase = getBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("use_boost", { p_item: itemId });
  if (error) return null;
  const left = Number(data);
  return Number.isFinite(left) && left >= 0 ? left : null;
}

/* ------------------------------------------------------------------ */
/*  Haqiqiy sovg'alar — imtiyoz kuponlari                              */
/* ------------------------------------------------------------------ */

export type ClaimStatus = "pending" | "approved" | "refunded";

export const CLAIM_LABEL: Record<ClaimStatus, string> = {
  pending: "O'qituvchi tasdig'i kutilmoqda",
  approved: "Tasdiqlandi",
  refunded: "Berilmadi — XP qaytarildi",
};

export interface Claim {
  id: string;
  itemId: string;
  title: string;
  emoji: string | null;
  status: ClaimStatus;
  createdAt: string;
  decidedAt: string | null;
}

/** O'quvchining kuponlari. */
export async function fetchMyClaims(): Promise<Claim[]> {
  const supabase = getBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("my_claims");
  if (error) return [];
  return ((data as unknown as {
    id: string;
    item_id: string;
    title: string;
    emoji: string | null;
    status: string;
    created_at: string;
    decided_at: string | null;
  }[] | null) ?? []).map((row) => ({
    id: row.id,
    itemId: row.item_id,
    title: row.title,
    emoji: row.emoji,
    status: row.status as ClaimStatus,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
  }));
}

export interface TeacherClaim extends Claim {
  studentId: string;
  fullName: string;
  className: string | null;
  price: number;
}

/** O'qituvchi paneli uchun kuponlar navbati. */
export async function fetchTeacherClaims(status: ClaimStatus | null = "pending"): Promise<TeacherClaim[]> {
  const supabase = getBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("teacher_claims", { p_status: status });
  if (error) return [];
  return ((data as unknown as {
    id: string;
    student_id: string;
    full_name: string;
    class_name: string | null;
    item_id: string;
    title: string;
    emoji: string | null;
    price: number;
    status: string;
    created_at: string;
  }[] | null) ?? []).map((row) => ({
    id: row.id,
    studentId: row.student_id,
    fullName: row.full_name,
    className: row.class_name,
    itemId: row.item_id,
    title: row.title,
    emoji: row.emoji,
    price: row.price,
    status: row.status as ClaimStatus,
    createdAt: row.created_at,
    decidedAt: null,
  }));
}

/** O'qituvchi qarori: berildi yoki XP qaytarildi. */
export async function decideClaim(claimId: string, status: "approved" | "refunded"): Promise<boolean> {
  const supabase = getBrowserClient();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("decide_claim", { p_claim: claimId, p_status: status });
  return !error && data === true;
}
