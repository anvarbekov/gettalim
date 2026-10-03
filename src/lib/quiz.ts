import type { Question } from "./types";
import { normalizeAnswer, shuffle, uid } from "./utils";

export interface QuizItem {
  /** Har bir ko'rsatish uchun noyob — React kaliti va animatsiya uchun. */
  key: string;
  question: Question;
  /** Aralashtirilgan variantlar. Doim 2..6 ta, ichida to'g'ri javob bor. */
  options: string[];
  answer: string;
}

const MAX_OPTIONS = 4;

/* ------------------------------------------------------------------ */
/*  Raqamli javoblar uchun chalg'ituvchi variantlar                    */
/* ------------------------------------------------------------------ */

function numericDistractors(answer: number, need: number): string[] {
  const out = new Set<string>();
  const magnitude = Math.abs(answer);
  const step = magnitude >= 1000 ? Math.round(magnitude / 10) : magnitude >= 100 ? 10 : 1;

  const candidates: number[] = [
    answer + step,
    answer - step,
    answer + step * 2,
    answer - step * 2,
    answer + 1,
    answer - 1,
    answer * 2,
    Math.round(answer / 2),
    answer + 10,
    answer - 10,
  ];

  // Raqamlari o'rni almashtirilgan variant (masalan 24 → 42)
  const digits = String(Math.abs(answer));
  if (digits.length > 1) {
    const swapped = Number(digits[1] + digits[0] + digits.slice(2));
    candidates.push(answer < 0 ? -swapped : swapped);
  }

  for (const value of shuffle(candidates)) {
    if (out.size >= need) break;
    if (!Number.isFinite(value)) continue;
    if (value === answer) continue;
    if (answer >= 0 && value < 0) continue;
    if (!Number.isInteger(answer) === false && !Number.isInteger(value)) continue;
    out.add(String(value));
  }

  // Agar yetmasa — tasodifiy yaqin sonlar
  let guard = 0;
  while (out.size < need && guard < 60) {
    guard += 1;
    const delta = (Math.floor(Math.random() * 5) + 1) * step * (Math.random() < 0.5 ? -1 : 1);
    const value = answer + delta;
    if (value !== answer && (answer < 0 || value >= 0)) out.add(String(value));
  }

  return Array.from(out).slice(0, need);
}

/* ------------------------------------------------------------------ */
/*  Matnli javoblar uchun chalg'ituvchi variantlar                     */
/* ------------------------------------------------------------------ */

const isLatin = (value: string) => /^[a-z\s'-]+$/i.test(value.replace(/[‘’ʻʼ]/g, "'"));

/** Boshqa savollarning javoblaridan mos ko'rinishdagilarini tanlaydi. */
function textDistractors(answer: string, pool: string[], need: number): string[] {
  const target = normalizeAnswer(answer);
  const sameScript = isLatin(answer);
  const words = answer.trim().split(/\s+/).length;

  const scored = pool
    .filter((candidate) => normalizeAnswer(candidate) !== target)
    .map((candidate) => {
      let score = 0;
      if (isLatin(candidate) === sameScript) score += 3;
      if (candidate.trim().split(/\s+/).length === words) score += 2;
      const ratio = Math.min(candidate.length, answer.length) / Math.max(candidate.length, answer.length, 1);
      score += ratio * 2;
      return { candidate, score: score + Math.random() * 0.6 };
    })
    .sort((a, b) => b.score - a.score);

  const out: string[] = [];
  const seen = new Set([target]);
  for (const { candidate } of scored) {
    if (out.length >= need) break;
    const key = normalizeAnswer(candidate);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(candidate);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Asosiy funksiya                                                    */
/* ------------------------------------------------------------------ */

/**
 * Istalgan savolni test ko'rinishiga keltiradi.
 * @param question  savol
 * @param pool      shu paketdagi boshqa javoblar (chalg'ituvchilar uchun)
 */
export function buildQuizItem(question: Question, pool: string[] = []): QuizItem {
  const answer = question.answer.trim();
  let options: string[];

  if (question.options && question.options.length >= 2) {
    const others = question.options.filter((o) => normalizeAnswer(o) !== normalizeAnswer(answer));
    options = [answer, ...shuffle(others).slice(0, MAX_OPTIONS - 1)];
  } else if (question.type === "number" || /^-?\d+([.,]\d+)?$/.test(answer)) {
    options = [answer, ...numericDistractors(Number(answer.replace(",", ".")), MAX_OPTIONS - 1)];
  } else {
    const picked = textDistractors(answer, pool, MAX_OPTIONS - 1);
    options = [answer, ...picked];
  }

  // Kamida 2 ta variant bo'lsin
  if (options.length < 2) options = [answer, ...numericDistractors(1, 1)];

  return {
    key: uid("qi"),
    question,
    options: shuffle(options),
    answer,
  };
}

/** Paketdagi barcha javoblar — chalg'ituvchilar manbai. */
export function answerPool(questions: Question[]): string[] {
  return questions.map((q) => q.answer.trim()).filter(Boolean);
}
