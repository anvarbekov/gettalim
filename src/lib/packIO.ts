import type { Pack, Question, QuestionType } from "./types";
import { shuffle, slugify, uid } from "./utils";

export interface ParseResult {
  pack?: Pack;
  errors: string[];
  warnings: string[];
}

const TYPES: QuestionType[] = ["number", "text", "choice"];

/**
 * Ixtiyoriy JSON'ni savol paketiga aylantiradi.
 * Qabul qilinadigan shakllar:
 *   1) { title, subject, questions: [...] }
 *   2) [ {prompt, answer}, ... ]  — faqat savollar ro'yxati
 *   3) { questions: [...] }
 * Savolda `type` ko'rsatilmasa, `options` bo'yicha aniqlanadi.
 */
export function parsePackJson(raw: string, fallbackTitle = "Yangi paket"): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return { errors: [`JSON o'qib bo'lmadi: ${(e as Error).message}`], warnings };
  }

  const source = Array.isArray(data) ? { questions: data } : (data as Record<string, unknown>);
  if (!source || typeof source !== "object") {
    return { errors: ["JSON obyekt yoki massiv bo'lishi kerak."], warnings };
  }

  const rawQuestions = (source.questions ?? source.items ?? source.savollar) as unknown;
  if (!Array.isArray(rawQuestions)) {
    return { errors: ["`questions` maydoni topilmadi yoki u massiv emas."], warnings };
  }

  const questions: Question[] = [];
  rawQuestions.forEach((item, index) => {
    const row = item as Record<string, unknown>;
    const line = index + 1;
    const prompt = String(row.prompt ?? row.question ?? row.savol ?? "").trim();
    if (!prompt) {
      errors.push(`${line}-savol: \`prompt\` bo'sh.`);
      return;
    }

    const rawOptions = (row.options ?? row.variants ?? row.variantlar) as unknown;
    const options = Array.isArray(rawOptions)
      ? rawOptions.map((o) => String(o).trim()).filter(Boolean)
      : undefined;

    let answerRaw = row.answer ?? row.javob ?? row.correct;
    // choice uchun javob indeks bilan berilgan bo'lishi mumkin: 0, 1, 2…
    if (options && typeof answerRaw === "number") {
      if (answerRaw < 0 || answerRaw >= options.length) {
        errors.push(`${line}-savol: javob indeksi variantlar chegarasidan tashqarida.`);
        return;
      }
      answerRaw = options[answerRaw];
    }

    const answer = String(answerRaw ?? "").trim();
    if (!answer) {
      errors.push(`${line}-savol: \`answer\` bo'sh.`);
      return;
    }

    let type = String(row.type ?? "").trim() as QuestionType;
    if (!TYPES.includes(type)) {
      if (options && options.length > 1) type = "choice";
      else if (/^-?\d+([.,]\d+)?$/.test(answer)) type = "number";
      else type = "text";
    }

    if (type === "choice") {
      if (!options || options.length < 2) {
        errors.push(`${line}-savol: variantli savolda kamida 2 ta variant bo'lishi kerak.`);
        return;
      }
      if (!options.some((o) => o.toLowerCase() === answer.toLowerCase())) {
        errors.push(`${line}-savol: to'g'ri javob variantlar orasida yo'q.`);
        return;
      }
    }

    const altRaw = (row.alt ?? row.alternatives ?? row.qoshimcha) as unknown;
    const alt = Array.isArray(altRaw) ? altRaw.map((a) => String(a)) : undefined;

    const levelRaw = Number(row.level ?? row.daraja ?? 1);
    const level = ([1, 2, 3] as const).includes(levelRaw as 1 | 2 | 3) ? (levelRaw as 1 | 2 | 3) : 1;

    questions.push({
      id: String(row.id ?? uid("q")),
      type,
      prompt,
      answer,
      alt,
      options: type === "choice" ? options : undefined,
      hint: row.hint ? String(row.hint) : undefined,
      level,
    });
  });

  if (!questions.length) {
    errors.push("Hech qanday to'g'ri savol topilmadi.");
    return { errors, warnings };
  }
  if (questions.length < 6) {
    warnings.push("Savollar 6 tadan kam — o'yin tez takrorlanadi. 12+ savol tavsiya etiladi.");
  }

  const title = String(source.title ?? source.nom ?? fallbackTitle).trim() || fallbackTitle;
  const subject = String(source.subject ?? source.fan ?? "Boshqa fan").trim();

  const pack: Pack = {
    id: `${slugify(subject) || "fan"}-${slugify(title) || "paket"}-${uid("").slice(1, 5)}`,
    title,
    subject,
    icon: String(source.icon ?? "📚"),
    color: String(source.color ?? "#1f6fd0"),
    description: source.description ? String(source.description) : undefined,
    grade: source.grade ? String(source.grade) : undefined,
    author: source.author ? String(source.author) : undefined,
    language: (source.language as Pack["language"]) ?? "uz",
    questions,
    createdAt: new Date().toISOString(),
  };

  return { pack, errors, warnings };
}

/** Paketni tashqi JSON ko'rinishiga o'giradi (import formatiga mos). */
export function packToJson(pack: Pack) {
  return JSON.stringify(
    {
      title: pack.title,
      subject: pack.subject,
      icon: pack.icon,
      color: pack.color,
      description: pack.description,
      grade: pack.grade,
      author: pack.author,
      language: pack.language ?? "uz",
      questions: pack.questions.map((q) => ({
        type: q.type,
        prompt: q.prompt,
        answer: q.answer,
        ...(q.options ? { options: q.options } : {}),
        ...(q.alt?.length ? { alt: q.alt } : {}),
        ...(q.hint ? { hint: q.hint } : {}),
        ...(q.level && q.level > 1 ? { level: q.level } : {}),
      })),
    },
    null,
    2,
  );
}

/** Variantli savol uchun aralashtirilgan variantlar. */
export function optionsFor(q: Question) {
  return q.options ? shuffle(q.options) : [];
}

export const SAMPLE_JSON = `{
  "title": "Kimyo: formulalar",
  "subject": "Kimyo",
  "icon": "⚗️",
  "color": "#0f9b8e",
  "grade": "7-sinf",
  "questions": [
    { "type": "text", "prompt": "Suvning kimyoviy formulasi", "answer": "H2O" },
    { "type": "number", "prompt": "Vodorodning tartib raqami", "answer": "1" },
    {
      "type": "choice",
      "prompt": "Osh tuzining formulasi",
      "options": ["NaCl", "KCl", "CaCO3", "H2SO4"],
      "answer": "NaCl"
    }
  ]
}`;
