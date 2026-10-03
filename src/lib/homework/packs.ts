"use client";

import { getBrowserClient } from "@/lib/supabase/client";
import type { PackRow, QuestionRow } from "@/lib/supabase/types";
import type { Pack, Question, QuestionType } from "@/lib/types";

/**
 * Uy vazifasida savollar o'quvchi qurilmasiga **bazadan** keladi
 * (doska rejimida ular o'qituvchi kompyuterida qoladi). Shuning uchun
 * topshiriq berilayotganda paket bulutga ko'chiriladi.
 */

/** Paketni bulutga yozadi va yangi `pack_id` ni qaytaradi. */
export async function publishPack(
  pack: Pack,
  ownerId: string,
): Promise<{ packId: string | null; error: string | null }> {
  const supabase = getBrowserClient();
  if (!supabase) return { packId: null, error: "Supabase sozlanmagan." };

  if (pack.generator) {
    return { packId: null, error: "Generatorli paketni uy vazifasiga berib bo'lmaydi." };
  }
  if (!pack.questions.length) {
    return { packId: null, error: "Paketda savol yo'q." };
  }

  const { data, error } = await supabase
    .from("packs")
    .insert({
      owner_id: ownerId,
      title: pack.title,
      subject: pack.subject,
      grade: pack.grade ? Number.parseInt(pack.grade, 10) || null : null,
      icon: pack.icon ?? "📚",
      color: pack.color ?? "#1f6fd0",
      description: pack.description ?? null,
      language: "uz",
      is_public: false,
    })
    .select("id")
    .single();

  if (error || !data) return { packId: null, error: error?.message ?? "Paket yozilmadi." };
  const packId = (data as { id: string }).id;

  const rows = pack.questions.map((q, position) => ({
    pack_id: packId,
    type: q.type as QuestionType,
    text: q.prompt,
    answer: q.answer,
    options: q.options ?? [],
    alt: q.alt ?? [],
    difficulty: q.level ?? 1,
    explanation: q.explanation ?? null,
    position,
  }));

  const { error: qError } = await supabase.from("questions").insert(rows);
  if (qError) {
    // Bo'sh paket qolib ketmasin
    await supabase.from("packs").delete().eq("id", packId);
    return { packId: null, error: qError.message };
  }

  return { packId, error: null };
}

/** Bulutdagi paketni o'yin ishlatadigan ko'rinishga qaytaradi. */
export async function fetchCloudPack(packId: string): Promise<Pack | null> {
  const supabase = getBrowserClient();
  if (!supabase) return null;

  const { data: packRow } = await supabase.from("packs").select("*").eq("id", packId).maybeSingle();
  if (!packRow) return null;

  const { data: questionRows } = await supabase
    .from("questions")
    .select("*")
    .eq("pack_id", packId)
    .order("position", { ascending: true });

  const row = packRow as PackRow;
  const questions: Question[] = ((questionRows as QuestionRow[] | null) ?? []).map((q) => ({
    id: q.id,
    type: q.type,
    prompt: q.text,
    answer: q.answer,
    options: Array.isArray(q.options) ? (q.options as string[]) : [],
    alt: Array.isArray(q.alt) ? (q.alt as string[]) : [],
    level: (Math.min(3, Math.max(1, q.difficulty)) as 1 | 2 | 3) ?? 1,
    explanation: q.explanation ?? undefined,
  }));

  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    grade: row.grade ? String(row.grade) : undefined,
    icon: row.icon ?? "📚",
    color: row.color ?? "#1f6fd0",
    description: row.description ?? undefined,
    questions,
  };
}
