import { generateQuestion } from "@/lib/generator";
import { buildQuizItem, answerPool, type QuizItem } from "@/lib/quiz";
import type { Pack, Question } from "@/lib/types";
import { shuffle, uid } from "@/lib/utils";

/**
 * "Kim millioner bo'ladi" mantiqi — sof funksiyalar.
 * UI'dan mustaqil, shuning uchun alohida sinash oson.
 */

/** 15 bosqichli narvon. 5 va 10-bosqich — kafolatlangan. */
export const LADDER = [
  1_000, 2_000, 3_000, 5_000, 10_000,
  15_000, 25_000, 50_000, 100_000, 200_000,
  400_000, 800_000, 1_500_000, 3_000_000, 5_000_000,
] as const;

export const SAFE_STEPS = [4, 9] as const; // indekslar: 5- va 10-bosqich

export const TOTAL_STEPS = LADDER.length;

/** Yiqilganda qo'lda qoladigan summa. */
export function guaranteedPrize(step: number): number {
  let prize = 0;
  SAFE_STEPS.forEach((safe) => {
    if (step > safe) prize = LADDER[safe];
  });
  return prize;
}

export const formatPrize = (sum: number) => sum.toLocaleString("uz-UZ").replace(/,/g, " ");

/**
 * Savollarni qiyinligi bo'yicha tartiblaydi: birinchi beshtasi oson,
 * keyingisi o'rtacha, oxirgisi qiyin. Paketda `difficulty` bo'lmasa
 * savollar shunchaki aralashtiriladi.
 */
export function buildLadderQuestions(pack: Pack | undefined, steps = TOTAL_STEPS): QuizItem[] {
  if (!pack) return [];

  // Generatorli paket (arifmetika) — cheksiz savol
  if (pack.generator) {
    return Array.from({ length: steps }, () => buildQuizItem(generateQuestion(pack.generator!)));
  }

  const pool = answerPool(pack.questions);
  const byLevel: Record<number, Question[]> = { 1: [], 2: [], 3: [] };
  pack.questions.forEach((q) => {
    const level = Math.min(3, Math.max(1, q.level ?? 1));
    byLevel[level].push(q);
  });

  const picked: Question[] = [];
  const takeFrom = (levels: number[], count: number) => {
    for (let i = 0; i < count; i += 1) {
      let question: Question | undefined;
      for (const level of levels) {
        const bucket = byLevel[level];
        if (bucket.length) {
          const index = Math.floor(Math.random() * bucket.length);
          question = bucket.splice(index, 1)[0];
          break;
        }
      }
      if (question) picked.push(question);
    }
  };

  const perTier = Math.ceil(steps / 3);
  takeFrom([1, 2, 3], perTier);
  takeFrom([2, 3, 1], perTier);
  takeFrom([3, 2, 1], steps - picked.length);

  // Yetmasa — qolgan savollardan to'ldiramiz
  if (picked.length < steps) {
    const rest = shuffle(pack.questions).filter((q) => !picked.includes(q));
    picked.push(...rest.slice(0, steps - picked.length));
  }

  return picked
    .slice(0, steps)
    .map((q) => buildQuizItem({ ...q, id: `${q.id}_${uid("m")}` }, pool));
}

/** 50/50 — to'g'ri javob va bitta xato variant qoladi. */
export function fiftyFifty(options: string[], answer: string): string[] {
  const wrong = shuffle(options.filter((o) => o !== answer));
  const survivor = wrong[0];
  const kept = options.filter((o) => o === answer || o === survivor);
  // Kamida ikkita variant qolishi kafolatlanadi
  return kept.length >= 2 ? kept : options.slice(0, 2);
}

/**
 * Zaldan so'rash — ustunli diagramma uchun taqsimot.
 * To'g'ri javob ustunligi savol qiyinligiga qarab kamayadi.
 */
export function audienceVotes(options: string[], answer: string, step: number): number[] {
  const confidence = Math.max(0.32, 0.82 - step * 0.035);
  const weights = options.map((option) => (option === answer ? confidence : Math.random() * 0.4));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const percents = weights.map((w) => Math.round((w / sum) * 100));

  // Yig'indi aniq 100 bo'lsin
  const diff = 100 - percents.reduce((a, b) => a + b, 0);
  const target = options.indexOf(answer);
  percents[target >= 0 ? target : 0] += diff;
  return percents.map((p) => Math.max(0, p));
}

/** Do'stga qo'ng'iroq — taxminan 75% hollarda to'g'ri aytadi. */
export function friendHint(options: string[], answer: string, step: number): { text: string; guess: string } {
  const sure = Math.random() < Math.max(0.5, 0.85 - step * 0.02);
  const guess = sure ? answer : shuffle(options.filter((o) => o !== answer))[0] ?? answer;
  const phrases = sure
    ? [
        `Menimcha bu — "${guess}". Ancha ishonchim komil.`,
        `"${guess}" bo'lishi kerak, buni yaxshi bilaman.`,
        `Aniq "${guess}". Bemalol tanlayvering.`,
      ]
    : [
        `Aniq bilmayman, lekin "${guess}" ga o'xshaydi.`,
        `Taxminim — "${guess}", lekin ishonchim yo'q.`,
        `Menimcha "${guess}"… tekshirib ko'ring.`,
      ];
  return { text: phrases[Math.floor(Math.random() * phrases.length)], guess };
}
