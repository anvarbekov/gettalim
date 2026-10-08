"use client";

import { getBrowserClient } from "@/lib/supabase/client";
import { uzDateTime } from "@/lib/links";

/**
 * O'quvchi ishlari (portfolio) — migration-16 va 17.
 * Fayllar Cloudinary'da, bazada faqat havolalar.
 *
 * Limitlar bazada tekshiriladi (bu yerda faqat ko'rsatiladi):
 *   - o'quvchi jami 3 marta ish o'chira oladi;
 *   - har bir ishni 3 martagacha qayta yuklaydi (tahrirlaydi).
 */

export const DELETE_LIMIT = 3;
export const EDIT_LIMIT = 3;

export interface WorkFile {
  url: string;
  name: string;
  size: number;
  kind: string;
}

export interface Work {
  id: string;
  studentId: string;
  studentName?: string;
  className?: string;
  title: string;
  body: string | null;
  files: WorkFile[];
  link: string | null;
  grade: number | null;
  gradeComment: string | null;
  editCount: number;
  assignmentId: string | null;
  assignmentTitle: string | null;
  dueAt: string | null;
  createdAt: string;
}

export interface WorkDraft {
  title: string;
  body: string;
  link: string;
  files: WorkFile[];
}

export type WorkStatus = "ungraded" | "graded" | null;

const ERRORS: Record<string, string> = {
  WORK_LOCKED: "Baholangan ishni o'zgartirib bo'lmaydi.",
  GRADE_NOT_ALLOWED: "Bahoni faqat o'qituvchi qo'yadi.",
  BAD_GRADE: "Baho 2 dan 5 gacha bo'ladi.",
  EDIT_LIMIT: "Bu ishni qayta yuklash imkoniyati tugadi (3 marta). O'qituvchingizdan so'rang.",
  DELETE_LIMIT: "O'chirish imkoniyati tugadi (3 marta). O'qituvchingizdan so'rang.",
  works_one_per_assignment: "Bu topshiriqqa ish allaqachon yuklangan — o'shani tahrirlang.",
  "row-level security": "Ruxsat yo'q.",
  works: "Ishlar bo'limi hali yoqilmagan (migration-16/17 bajarilmagan).",
};

export function explainWorkError(message: string): string {
  const code = Object.keys(ERRORS).find((k) => message.includes(k));
  return code ? ERRORS[code] : message;
}

/** Havolani tozalaydi: `example.com` → `https://example.com`. */
export function normalizeLink(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

type WorkDbRow = {
  id: string;
  student_id: string;
  title: string;
  body: string | null;
  files: WorkFile[] | null;
  link: string | null;
  grade: number | null;
  grade_comment: string | null;
  edit_count: number | null;
  assignment_id: string | null;
  created_at: string;
  assignments?: { title: string; due_at: string | null } | null;
};

function fromRow(r: WorkDbRow): Work {
  return {
    id: r.id,
    studentId: r.student_id,
    title: r.title,
    body: r.body,
    files: Array.isArray(r.files) ? r.files : [],
    link: r.link,
    grade: r.grade,
    gradeComment: r.grade_comment,
    editCount: r.edit_count ?? 0,
    assignmentId: r.assignment_id ?? null,
    assignmentTitle: r.assignments?.title ?? null,
    dueAt: r.assignments?.due_at ?? null,
    createdAt: r.created_at,
  };
}

/* ------------------------------------------------------------------ */
/*  O'quvchi                                                           */
/* ------------------------------------------------------------------ */

export async function listMyWorks(studentId: string): Promise<{ data: Work[]; deletesUsed: number; error?: string }> {
  const supabase = getBrowserClient();
  if (!supabase) return { data: [], deletesUsed: 0 };

  const [works, quota] = await Promise.all([
    supabase
      .from("works")
      .select(
        "id, student_id, title, body, files, link, grade, grade_comment, edit_count, assignment_id, created_at, assignments(title, due_at)",
      )
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("work_quota").select("deletes").eq("student_id", studentId).maybeSingle(),
  ]);

  if (works.error) {
    // migration-17 hali bajarilmagan bo'lsa — eski ustunlar bilan
    const fallback = await supabase
      .from("works")
      .select("id, student_id, title, body, files, link, grade, grade_comment, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (fallback.error) return { data: [], deletesUsed: 0, error: explainWorkError(fallback.error.message) };
    return {
      data: ((fallback.data ?? []) as unknown as WorkDbRow[]).map(fromRow),
      deletesUsed: 0,
    };
  }

  return {
    data: ((works.data ?? []) as unknown as WorkDbRow[]).map(fromRow),
    deletesUsed: (quota.data as { deletes: number } | null)?.deletes ?? 0,
  };
}

export async function saveWork(
  studentId: string,
  draft: WorkDraft,
  options: { id?: string; assignmentId?: string | null } = {},
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getBrowserClient();
  if (!supabase) return { ok: false, error: "Bulut sozlanmagan" };
  const row = {
    title: draft.title.trim().slice(0, 160),
    body: draft.body.trim() || null,
    link: normalizeLink(draft.link),
    files: draft.files,
  };
  const { error } = options.id
    ? await supabase.from("works").update(row).eq("id", options.id)
    : await supabase.from("works").insert({
        ...row,
        student_id: studentId,
        ...(options.assignmentId ? { assignment_id: options.assignmentId } : {}),
      });
  return error ? { ok: false, error: explainWorkError(error.message) } : { ok: true };
}

/** O'quvchi ham, o'qituvchi ham ishlatadi — ruxsatni baza tekshiradi. */
export async function deleteWork(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getBrowserClient();
  if (!supabase) return { ok: false };
  const { error, count } = await supabase.from("works").delete({ count: "exact" }).eq("id", id);
  if (error) return { ok: false, error: explainWorkError(error.message) };
  return (count ?? 0) > 0 ? { ok: true } : { ok: false, error: "O'chirib bo'lmadi." };
}

/* ------------------------------------------------------------------ */
/*  O'qituvchi                                                         */
/* ------------------------------------------------------------------ */

export async function teacherWorks(filter: {
  classId: string | null;
  status: WorkStatus;
  assignmentId: string | null;
}): Promise<{ data: Work[]; error?: string }> {
  const supabase = getBrowserClient();
  if (!supabase) return { data: [] };
  const { data, error } = await supabase.rpc("teacher_works", {
    p_class: filter.classId,
    p_status: filter.status,
    p_assignment: filter.assignmentId,
  });
  if (error) {
    const old = error.message.includes("teacher_works");
    return {
      data: [],
      error: old ? "Supabase'da migration-17 ni bajaring (SQL Editor → Run)." : explainWorkError(error.message),
    };
  }
  return {
    data: (data ?? []).map((r) => ({
      id: r.id,
      studentId: r.student_id,
      studentName: r.student_name,
      className: r.class_name,
      title: r.title,
      body: r.body,
      files: Array.isArray(r.files) ? r.files : [],
      link: r.link,
      grade: r.grade,
      gradeComment: r.grade_comment,
      editCount: r.edit_count ?? 0,
      assignmentId: r.assignment_id,
      assignmentTitle: r.assignment_title,
      dueAt: r.due_at,
      createdAt: r.created_at,
    })),
  };
}

export async function gradeWork(
  id: string,
  grade: number | null,
  comment: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getBrowserClient();
  if (!supabase) return { ok: false };
  const { data, error } = await supabase.rpc("grade_work", {
    p_work: id,
    p_grade: grade,
    p_comment: comment,
  });
  if (error) return { ok: false, error: explainWorkError(error.message) };
  return data ? { ok: true } : { ok: false, error: "Bu ish sizning o'quvchingizniki emas." };
}

/** O'quvchining o'chirish va qayta yuklash limitlarini yana 3 taga tiklaydi. */
export async function resetWorkLimits(studentId: string): Promise<boolean> {
  const supabase = getBrowserClient();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("reset_work_limits", { p_student: studentId });
  return !error && Boolean(data);
}

/** Muddatdan keyin topshirilganmi. */
export const isLate = (w: Pick<Work, "dueAt" | "createdAt">) =>
  Boolean(w.dueAt && new Date(w.createdAt).getTime() > new Date(w.dueAt).getTime());

export const formatDate = uzDateTime;
