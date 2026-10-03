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
  gameId: GameId;
  packId: string;
  title: string;
  config: Record<string, unknown>;
  dueAt: string | null;
  maxAttempts: number;
}): Promise<{ error: string | null }> {
  const supabase = getBrowserClient();
  if (!supabase) return { error: "Supabase sozlanmagan." };

  const { error } = await supabase.from("assignments").insert({
    teacher_id: input.teacherId,
    class_id: input.classId,
    game_id: input.gameId,
    pack_id: input.packId,
    title: input.title.trim(),
    config: input.config,
    due_at: input.dueAt,
    max_attempts: input.maxAttempts,
  });

  return { error: error?.message ?? null };
}

export async function listTeacherAssignments(): Promise<AssignmentView[]> {
  const supabase = getBrowserClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("assignments")
    .select("*, classes(name)")
    .order("created_at", { ascending: false });

  return ((data as unknown as (AssignmentRow & { classes: { name: string } | null })[] | null) ?? []).map(
    (row) => ({ ...row, className: row.classes?.name }),
  );
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
    (row) => ({ ...row, className: row.classes?.name }),
  );
  if (!rows.length) return [];

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
    return { ...row, myAttempts: mineRow?.attempts ?? 0, myBest: mineRow?.best, myMax: mineRow?.max };
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
