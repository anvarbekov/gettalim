import { EXCEL_ITEMS } from "@/lib/practice/quiz/excel";
import { FISHING_ITEMS } from "@/lib/practice/quiz/fishing";
import { PARTS_ITEMS } from "@/lib/practice/quiz/parts";
import type { PracticeItem } from "@/lib/practice/quiz/types";
import { toBase } from "@/lib/practice/sanoq/data";
import type { Pack, Question } from "@/lib/types";
import { shuffle } from "@/lib/utils";

/**
 * Mashq mavzularini **savol paketiga** aylantiradi.
 *
 * Shu tufayli mashqlar avtomatik ravishda hamma joyda ishlaydi: arqon
 * tortishda, poygada, savol yomg'irida, sinf musobaqasida va uy vazifasida.
 * Alohida protokol yozish shart emas — o'yin dvigateli savol paketini kutadi,
 * biz esa unga mashq savollarini beramiz.
 */

/** Mashq savolini o'yin savoliga o'giradi. */
function toQuestion(item: PracticeItem, prefix: string): Question {
  // Ko'rgazma (xat, jadval) savol matniga qisqacha qo'shiladi — o'yin
  // ekranida rasm ko'rsatib bo'lmaydi, lekin ma'no yo'qolmasligi kerak.
  let prompt = item.prompt;

  if (item.media?.kind === "email") {
    prompt = `«${item.media.from}» dan xat: «${item.media.subject}». ${item.prompt}`;
  } else if (item.media?.kind === "note") {
    prompt = `${item.media.text} — ${item.prompt}`;
  } else if (item.media?.kind === "device") {
    prompt = `${item.media.caption}. ${item.prompt}`;
  } else if (item.media?.kind === "sheet" && item.media.rows.length) {
    const preview = item.media.rows.map((r) => r.join(" | ")).join(" ; ");
    prompt = `Jadval: ${preview}. ${item.prompt}`;
  }

  return {
    id: `${prefix}-${item.id}`,
    type: "choice",
    prompt,
    answer: item.answer,
    options: item.options,
    level: item.level ?? 1,
    explanation: item.explanation,
  };
}

/* ------------------------------------------------------------------ */
/*  Sanoq sistemalari — savollar avtomatik yaratiladi                  */
/* ------------------------------------------------------------------ */

/** Bitta savol: sonni bir sistemadan ikkinchisiga o'tkazish. */
function numberQuestion(index: number): Question {
  const value = 3 + Math.floor(Math.random() * 250);
  const variants = [
    { from: 2, to: 10, label: "ikkilik", target: "o'nlik" },
    { from: 10, to: 2, label: "o'nlik", target: "ikkilik" },
    { from: 16, to: 10, label: "o'n oltilik", target: "o'nlik" },
    { from: 10, to: 16, label: "o'nlik", target: "o'n oltilik" },
  ] as const;
  const v = variants[index % variants.length];

  const answer = toBase(value, v.to);
  // Chalg'ituvchi variantlar: yaqin sonlar
  const wrong = new Set<string>();
  let guard = 0;
  while (wrong.size < 3 && guard < 50) {
    guard += 1;
    const delta = [1, -1, 2, -2, 4, -4, 8][Math.floor(Math.random() * 7)];
    const candidate = value + delta;
    if (candidate > 0 && candidate !== value) wrong.add(toBase(candidate, v.to));
  }

  return {
    id: `sanoq-${index}`,
    type: "choice",
    prompt: `${toBase(value, v.from)} soni ${v.label} sistemada berilgan. Uni ${v.target} sistemaga o'tkazing.`,
    answer,
    options: shuffle([answer, ...Array.from(wrong)]),
    level: v.from === 16 || v.to === 16 ? 3 : 2,
  };
}

const NUMBER_QUESTIONS: Question[] = Array.from({ length: 24 }, (_, i) => numberQuestion(i));

/* ------------------------------------------------------------------ */
/*  Paketlar                                                           */
/* ------------------------------------------------------------------ */

export const PRACTICE_PACKS: Pack[] = [
  {
    id: "mashq-fishing",
    title: "Firibgar xatlar",
    subject: "Raqamli savodxonlik",
    icon: "🎣",
    color: "#d2402f",
    description: "Soxta xabarlarni tanish: manzil, havola, shoshiltirish belgilari.",
    builtin: true,
    questions: FISHING_ITEMS.map((item) => toQuestion(item, "fishing")),
  },
  {
    id: "mashq-qismlar",
    title: "Kompyuter qurilmalari",
    subject: "Informatika va AT",
    icon: "🖥️",
    color: "#1f6fd0",
    description: "Tizimli blok ichidagi qurilmalar va ularning vazifasi.",
    builtin: true,
    questions: PARTS_ITEMS.map((item) => toQuestion(item, "qismlar")),
  },
  {
    id: "mashq-excel",
    title: "Excel formulalari",
    subject: "Informatika va AT",
    icon: "📊",
    color: "#1f9d63",
    description: "SUM, AVERAGE, IF, COUNTIF va jadval bilan ishlash.",
    builtin: true,
    questions: EXCEL_ITEMS.map((item) => toQuestion(item, "excel")),
  },
  {
    id: "mashq-sanoq",
    title: "Sanoq sistemalari",
    subject: "Informatika va AT",
    icon: "🔢",
    color: "#0f9b8e",
    description: "Ikkilik, o'nlik va o'n oltilik sistemalar orasida o'tkazish.",
    builtin: true,
    questions: NUMBER_QUESTIONS,
  },
];
