"use client";

import { getBrowserClient } from "@/lib/supabase/client";
import type { AssignmentRow, SubmissionRow } from "@/lib/supabase/types";
import type { GameId } from "@/lib/games/registry";

/** Uy vazifasiga beriladigan o'yinlar — yolg'iz o'ynasa bo'ladiganlari. */
export const HOMEWORK_GAMES: GameId[] = ["yomgir", "millioner", "xotira", "krossvord"];

export interface AssignmentView extends AssignmentRow {
  className?: string;
  /** O'quvchi uchun: nechta urinish qilingan va eng yaxshi natija. */
  myAttempts?: number;
  myBest?: number;
  myMax?: number;
  /** O'quvchi uchun (topshiriq turi): yuklangan ishi va bahosi. */
  myWorkId?: string | null;
  myGrade?: number | null;
}

export interface TaskStat {
  student_id: string;
  full_name: string;
  work_id: string | null;
  grade: number | null;
  submitted_at: string | null;
}

export interface Materials {
  body: string;
  link: string;
  files: { url: string; name: string; size: number; kind: string }[];
}

function explainHomeworkError(message: string): string {
  if (/column .*(kind|files|body|link)|kind.*does not exist|schema cache/i.test(message)) {
    return "Fayl bilan topshiriq uchun Supabase'da migration-17 ni bajaring (SQL Editor → Run).";
  }
  if (message.includes("game_id") && message.includes("null")) {
    return "Supabase'da migration-17 ni bajaring (SQL Editor → Run).";
  }
  return message;
}

export interface StudentStat {
  student_id: string;
  full_name: string;
  attempts: number;
  best_score: number;
  max_score: number;
  finished_at: string | null;
}

/* ------------------------------------------------------------------ */
/*  O'qituvchi                                                         */
/* ------------------------------------------------------------------ */

export async function createAssignment(input: {
  teacherId: string;
  classId: string;
  kind: "game" | "task";
  gameId: GameId | null;
  packId: string | null;
  title: string;
  config: Record<string, unknown>;
  dueAt: string | null;
  maxAttempts: number;
  materials: Materials;
}): Promise<{ error: string | null }> {
  const supabase = getBrowserClient();
  if (!supabase) return { error: "Supabase sozlanmagan." };

  const link = input.materials.link.trim();
  const hasMaterials = Boolean(input.materials.body.trim() || link || input.materials.files.length);

  const { error } = await supabase.from("assignments").insert({
    teacher_id: input.teacherId,
    class_id: input.classId,
    game_id: input.gameId,
    pack_id: input.packId,
    title: input.title.trim(),
    config: input.config,
    due_at: input.dueAt,
    max_attempts: input.maxAttempts,
    // Eski bazada (migration-17 siz) o'yin topshirig'i materialsiz ham ishlayversin
    ...(input.kind === "task" || hasMaterials
      ? {
          kind: input.kind,
          body: input.materials.body.trim() || null,
          link: link ? (/^https?:\/\//i.test(link) ? link : `https://${link}`) : null,
          files: input.materials.files,
        }
      : {}),
  });

  return { error: error ? explainHomeworkError(error.message) : null };
}

export async function listTeacherAssignments(teacherId: string): Promise<{ data: AssignmentView[]; error?: string }> {
  const supabase = getBrowserClient();
  if (!supabase) return { data: [] };

  const { data, error } = await supabase
    .from("assignments")
    .select("*, classes(name)")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (!error) {
    return {
      data: ((data as unknown as (AssignmentRow & { classes: { name: string } | null })[] | null) ?? []).map(
        (row) => normalize({ ...row, className: row.classes?.name }),
      ),
    };
  }

  // Sinf nomini qo'shib o'qib bo'lmasa — alohida so'rov bilan
  const [plain, classes] = await Promise.all([
    supabase.from("assignments").select("*").eq("teacher_id", teacherId).order("created_at", { ascending: false }),
    supabase.from("classes").select("id, name"),
  ]);
  if (plain.error) return { data: [], error: plain.error.message };
  const names = new Map(((classes.data as { id: string; name: string }[] | null) ?? []).map((c) => [c.id, c.name]));
  return {
    data: ((plain.data as unknown as AssignmentRow[] | null) ?? []).map((row) =>
      normalize({ ...row, className: names.get(row.class_id) }),
    ),
  };
}

/** Eski yozuvlarda yangi ustunlar bo'lmasligi mumkin. */
function normalize<T extends AssignmentView>(row: T): T {
  return {
    ...row,
    kind: row.kind === "task" ? "task" : "game",
    files: Array.isArray(row.files) ? row.files : [],
    body: row.body ?? null,
    link: row.link ?? null,
  };
}

/** Topshiriq jurnali: kim ish yukladi, bahosi. */
export async function taskStats(assignmentId: string): Promise<TaskStat[]> {
  const supabase = getBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("task_stats", { p_assignment: assignmentId });
  if (error) return [];
  return (data as unknown as TaskStat[] | null) ?? [];
}

export async function deleteAssignment(id: string) {
  const supabase = getBrowserClient();
  if (!supabase) return;
  await supabase.from("assignments").delete().eq("id", id);
}

/** Jurnal: sinfdagi har bir o'quvchining natijasi. */
export async function assignmentStats(assignmentId: string): Promise<StudentStat[]> {
  const supabase = getBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("assignment_stats", { p_assignment: assignmentId });
  if (error) return [];
  return (data as unknown as StudentStat[] | null) ?? [];
}

/* ------------------------------------------------------------------ */
/*  O'quvchi                                                           */
/* ------------------------------------------------------------------ */

export async function listStudentAssignments(studentId: string): Promise<AssignmentView[]> {
  const supabase = getBrowserClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("assignments")
    .select("*, classes(name)")
    .order("due_at", { ascending: true, nullsFirst: false });

  const rows = ((data as unknown as (AssignmentRow & { classes: { name: string } | null })[] | null) ?? []).map(
    (row) => normalize({ ...row, className: row.classes?.name }),
  );
  if (!rows.length) return [];

  // Topshiriq turidagilarga yuklagan ishlarim
  const myWorks = new Map<string, { id: string; grade: number | null }>();
  if (rows.some((r) => r.kind === "task")) {
    const { data: works } = await supabase
      .from("works")
      .select("id, assignment_id, grade")
      .eq("student_id", studentId)
      .not("assignment_id", "is", null);
    ((works as { id: string; assignment_id: string; grade: number | null }[] | null) ?? []).forEach((w) =>
      myWorks.set(w.assignment_id, { id: w.id, grade: w.grade }),
    );
  }

  const { data: mine } = await supabase
    .from("submissions")
    .select("assignment_id, score, max_score")
    .eq("student_id", studentId);

  const byAssignment = new Map<string, { attempts: number; best: number; max: number }>();
  ((mine as unknown as Pick<SubmissionRow, "assignment_id" | "score" | "max_score">[] | null) ?? []).forEach(
    (s) => {
      const current = byAssignment.get(s.assignment_id) ?? { attempts: 0, best: 0, max: 0 };
      byAssignment.set(s.assignment_id, {
        attempts: current.attempts + 1,
        best: Math.max(current.best, s.score),
        max: Math.max(current.max, s.max_score),
      });
    },
  );

  return rows.map((row) => {
    const mineRow = byAssignment.get(row.id);
    const work = myWorks.get(row.id);
    return {
      ...row,
      myAttempts: mineRow?.attempts ?? 0,
      myBest: mineRow?.best,
      myMax: mineRow?.max,
      myWorkId: work?.id ?? null,
      myGrade: work?.grade ?? null,
    };
  });
}

export async function getAssignment(id: string): Promise<AssignmentView | null> {
  const supabase = getBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase.from("assignments").select("*").eq("id", id).maybeSingle();
  return (data as AssignmentView | null) ?? null;
}

/** Natijani saqlaydi. Urinish raqami avtomatik hisoblanadi. */
export async function saveSubmission(input: {
  assignmentId: string;
  studentId: string;
  score: number;
  maxScore: number;
  details: Record<string, unknown>;
}): Promise<{ error: string | null }> {
  const supabase = getBrowserClient();
  if (!supabase) return { error: "Supabase sozlanmagan." };

  const { count } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("assignment_id", input.assignmentId)
    .eq("student_id", input.studentId);

  const { error } = await supabase.from("submissions").insert({
    assignment_id: input.assignmentId,
    student_id: input.studentId,
    attempt_no: (count ?? 0) + 1,
    score: input.score,
    max_score: input.maxScore,
    details: input.details,
    finished_at: new Date().toISOString(),
  });

  return { error: error?.message ?? null };
}

/** Muddat o'tganmi. */
export const isOverdue = (dueAt: string | null) => Boolean(dueAt && new Date(dueAt).getTime() < Date.now());
