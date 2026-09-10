import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

/**
 * Javoblarni solishtirish: registr, ortiqcha bo'shliq, o'zbek apostroflari
 * (' ' ʻ ʼ ‘ ’) va o'nlik kasr belgisi (, / .) e'tiborga olinmaydi.
 */
export function normalizeAnswer(value: string) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[‘’‛`´ʻʼ']/g, "'")
    .replace(/\s+/g, " ")
    .replace(/^(\d+),(\d+)$/, "$1.$2");
}

export function isCorrect(input: string, question: { answer: string; alt?: string[] }) {
  const given = normalizeAnswer(input);
  if (!given) return false;
  const accepted = [question.answer, ...(question.alt ?? [])].map(normalizeAnswer);
  if (accepted.includes(given)) return true;
  // Raqamli javoblar: 07 === 7, 2.50 === 2.5
  const n = Number(given.replace(",", "."));
  if (!Number.isNaN(n)) {
    return accepted.some((a) => {
      const m = Number(a.replace(",", "."));
      return !Number.isNaN(m) && Math.abs(m - n) < 1e-9;
    });
  }
  return false;
}

export function download(filename: string, content: string, type = "application/json") {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[‘’ʻʼ']/g, "")
    .replace(/[^a-z0-9\u0400-\u04FF]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}
