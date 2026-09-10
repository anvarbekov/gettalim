"use client";

import { getBrowserClient } from "@/lib/supabase/client";

/**
 * Kirish ma'lumotlarini vaqtincha ochish.
 *
 * O'qituvchi ro'yxatni ochadi — shu oraliqda sinf kodini bilgan har kim
 * `/kod` sahifasida o'z ismini topib PIN kodini ko'radi. Vaqt tugagach
 * ro'yxat o'zi yopiladi.
 */

export interface RosterStudent {
  studentId: string;
  fullName: string;
  className: string;
}

export interface PublicCredentials {
  fullName: string;
  className: string;
  joinCode: string;
  pin: string | null;
}

/* ---------------------------- O'qituvchi ---------------------------- */

export async function openRoster(classId: string, minutes = 15): Promise<Date | null> {
  const supabase = getBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("open_roster", { p_class: classId, p_minutes: minutes });
  if (error || !data) return null;
  return new Date(data as unknown as string);
}

export async function closeRoster(classId: string): Promise<void> {
  const supabase = getBrowserClient();
  if (!supabase) return;
  await supabase.rpc("close_roster", { p_class: classId });
}

/* ----------------------------- O'quvchi ----------------------------- */

/** Ro'yxat ochiqmi — ochiq bo'lsa sinf nomi va tugash vaqti qaytadi. */
export async function rosterStatus(code: string): Promise<{ className: string; openUntil: Date } | null> {
  const supabase = getBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("roster_open", { p_code: code.trim() });
  if (error) return null;
  const row = (data as unknown as { class_name: string; open_until: string }[] | null)?.[0];
  if (!row) return null;
  return { className: row.class_name, openUntil: new Date(row.open_until) };
}

/** Sinf ro'yxati — faqat ismlar. */
export async function publicRoster(code: string): Promise<RosterStudent[]> {
  const supabase = getBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("public_roster", { p_code: code.trim() });
  if (error) return [];
  return ((data as unknown as { student_id: string; full_name: string; class_name: string }[] | null) ?? []).map(
    (row) => ({ studentId: row.student_id, fullName: row.full_name, className: row.class_name }),
  );
}

/** Tanlangan o'quvchining kirish ma'lumoti. */
export async function publicCredentials(code: string, studentId: string): Promise<PublicCredentials | null> {
  const supabase = getBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("public_credentials", {
    p_code: code.trim(),
    p_student: studentId,
  });
  if (error) return null;
  const row = (data as unknown as {
    full_name: string;
    class_name: string;
    join_code: string;
    pin: string | null;
  }[] | null)?.[0];
  if (!row) return null;
  return { fullName: row.full_name, className: row.class_name, joinCode: row.join_code, pin: row.pin };
}
