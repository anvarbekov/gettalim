"use client";

import { getBrowserClient } from "@/lib/supabase/client";

/**
 * XP, daraja, streak va nishonlar.
 *
 * Barcha hisob-kitob bazada bajariladi (`award_xp` funksiyasi) — shunda
 * o'quvchi brauzer konsolidan o'ziga ball qo'shib qo'ya olmaydi.
 */

export interface XpResult {
  xp: number;
  level: number;
  streakDays: number;
  leveledUp: boolean;
}

export interface Achievement {
  code: string;
  title: string;
  description: string | null;
  icon: string | null;
  earnedAt: string | null;
}

export interface LeaderRow {
  studentId: string;
  fullName: string;
  xp: number;
  level: number;
  streakDays: number;
  className: string;
}

/** Daraja chegaralari — progress chizig'i uchun. */
export const xpForLevel = (level: number) => (Math.max(1, level) - 1) ** 2 * 250;

export function levelProgress(xp: number, level: number) {
  const start = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const span = Math.max(1, next - start);
  return { start, next, percent: Math.min(100, Math.max(0, ((xp - start) / span) * 100)) };
}

export async function awardXp(amount: number): Promise<XpResult | null> {
  const supabase = getBrowserClient();
  if (!supabase || amount <= 0) return null;

  const { data, error } = await supabase.rpc("award_xp", { p_amount: Math.round(amount) });
  if (error) return null;

  const row = (data as unknown as {
    xp: number;
    level: number;
    streak_days: number;
    leveled_up: boolean;
  }[])?.[0];
  if (!row) return null;

  return { xp: row.xp, level: row.level, streakDays: row.streak_days, leveledUp: row.leveled_up };
}

/** Nishon beradi. `true` — endi berildi, `false` — allaqachon bor edi. */
export async function grantAchievement(code: string): Promise<boolean> {
  const supabase = getBrowserClient();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("grant_achievement", { p_code: code });
  return !error && data === true;
}

export async function listAchievements(): Promise<Achievement[]> {
  const supabase = getBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("my_achievements");
  if (error) return [];
  return ((data as unknown as {
    code: string;
    title: string;
    description: string | null;
    icon: string | null;
    earned_at: string | null;
  }[] | null) ?? []).map((row) => ({
    code: row.code,
    title: row.title,
    description: row.description,
    icon: row.icon,
    earnedAt: row.earned_at,
  }));
}

export async function classLeaderboard(classId?: string): Promise<LeaderRow[]> {
  const supabase = getBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("class_leaderboard", { p_class: classId ?? undefined });
  if (error) return [];
  return ((data as unknown as {
    student_id: string;
    full_name: string;
    xp: number;
    level: number;
    streak_days: number;
    class_name: string;
  }[] | null) ?? []).map((row) => ({
    studentId: row.student_id,
    fullName: row.full_name,
    xp: row.xp,
    level: row.level,
    streakDays: row.streak_days,
    className: row.class_name,
  }));
}

/* ------------------------------------------------------------------ */
/*  XP hisoblash qoidalari                                             */
/* ------------------------------------------------------------------ */

/**
 * Uy vazifasi uchun XP.
 * Asosiy qism natijaga bog'liq, ustiga topshirgani uchun kichik bonus.
 */
export function homeworkXp(score: number, maxScore: number): number {
  if (maxScore <= 0) return 10;
  const ratio = Math.min(1, Math.max(0, score / maxScore));
  return Math.round(20 + ratio * 80);
}

/** Ulangan rejim uchun XP — musobaqadagi ball asosida. */
export function liveXp(score: number, rank: number, of: number): number {
  const base = Math.round(Math.min(120, score / 12));
  const podium = rank === 1 ? 30 : rank === 2 ? 20 : rank === 3 ? 10 : 0;
  const took = of > 0 ? 10 : 0;
  return base + podium + took;
}

/** O'yin natijasiga qarab beriladigan nishonlar. */
export async function checkAchievements(input: {
  gameId?: string;
  score: number;
  maxScore: number;
  rank?: number;
  correct?: number;
  wrong?: number;
}): Promise<string[]> {
  const earned: string[] = [];
  const push = async (code: string) => {
    if (await grantAchievement(code)) earned.push(code);
  };

  if (input.rank === 1) await push("first_win");

  if (input.maxScore > 0 && input.score >= input.maxScore) {
    await push("flawless");
    if (input.gameId === "krossvord") await push("crossword_pro");
  }

  if ((input.correct ?? 0) >= 10 && (input.wrong ?? 0) === 0) await push("lightning");

  return earned;
}
