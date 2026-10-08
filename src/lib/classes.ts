"use client";

import { createEphemeralClient, getBrowserClient } from "@/lib/supabase/client";
import type { ClassRow, ProfileRow } from "@/lib/supabase/types";
import {
  randomClassCode,
  randomPin,
  studentCode,
  studentEmail,
  studentPassword,
} from "@/lib/auth/studentIdentity";

export interface StudentRow {
  id: string;
  full_name: string;
  pin: string | null;
  xp: number;
  level: number;
  added_at: string;
}

/** O'qituvchining barcha sinflari (o'quvchilar soni bilan). */
export async function listClasses(): Promise<(ClassRow & { students: number })[]> {
  const supabase = getBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("classes")
    .select("*, class_students(count)")
    .eq("archived", false)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as unknown as (ClassRow & { class_students: { count: number }[] })[]).map((row) => ({
    ...row,
    students: row.class_students?.[0]?.count ?? 0,
  }));
}

/** Yangi sinf. Kod takrorlansa avtomatik qayta uriniladi. */
export async function createClass(name: string, teacherId: string): Promise<{ error: string | null }> {
  const supabase = getBrowserClient();
  if (!supabase) return { error: "Supabase sozlanmagan." };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error } = await supabase
      .from("classes")
      .insert({ name: name.trim(), teacher_id: teacherId, join_code: randomClassCode() });
    if (!error) return { error: null };
    if (!error.message.includes("duplicate key")) return { error: error.message };
  }
  return { error: "Sinf kodi yaratilmadi, qaytadan urinib ko'ring." };
}

export async function renameClass(id: string, name: string) {
  const supabase = getBrowserClient();
  if (!supabase) return;
  await supabase.from("classes").update({ name: name.trim() }).eq("id", id);
}

export async function archiveClass(id: string) {
  const supabase = getBrowserClient();
  if (!supabase) return;
  await supabase.from("classes").update({ archived: true }).eq("id", id);
}

/** Sinfdagi o'quvchilar ro'yxati. */
export async function listStudents(classId: string): Promise<StudentRow[]> {
  const supabase = getBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("class_students")
    .select("pin, added_at, profiles!inner(id, full_name, xp, level)")
    .eq("class_id", classId)
    .order("added_at", { ascending: true });

  if (error || !data) return [];
  return (data as unknown as { pin: string | null; added_at: string; profiles: ProfileRow }[]).map((row) => ({
    id: row.profiles.id,
    full_name: row.profiles.full_name,
    pin: row.pin,
    xp: row.profiles.xp,
    level: row.profiles.level,
    added_at: row.added_at,
  }));
}

export interface CreatedStudent {
  fullName: string;
  pin: string;
  code: string;
}

/**
 * O'quvchi hisobini yaratish.
 *
 * Hisob vaqtinchalik mijoz orqali ochiladi — shunda o'qituvchining o'z
 * sessiyasi buzilmaydi. Kirish ma'lumotlari sinf kodi + ism + PIN dan
 * hisoblanadi, shuning uchun o'quvchi hech qanday pochtasiz kira oladi.
 */
export async function addStudent(
  classId: string,
  classCode: string,
  fullName: string,
): Promise<{ student: CreatedStudent | null; error: string | null }> {
  const supabase = getBrowserClient();
  const temp = createEphemeralClient();
  if (!supabase || !temp) return { student: null, error: "Supabase sozlanmagan." };

  const name = fullName.trim();
  if (name.length < 3) return { student: null, error: "Ism-familiyani to'liq yozing." };

  const pin = randomPin();
  const email = studentEmail(classCode, name);
  const code = studentCode(classCode, name);

  const { data, error } = await temp.auth.signUp({
    email,
    password: studentPassword(pin),
    options: { data: { full_name: name, role: "student", student_code: code } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { student: null, error: "Bu ismli o'quvchi shu sinfda allaqachon bor." };
    }
    if (error.message.toLowerCase().includes("email address") && error.message.toLowerCase().includes("invalid")) {
      return {
        student: null,
        error:
          "Supabase sintetik pochtani rad etdi. Authentication → Providers → Email bo'limida " +
          "'Confirm email' ni o'chiring.",
      };
    }
    return { student: null, error: error.message };
  }

  const studentId = data.user?.id;
  if (!studentId) {
    return { student: null, error: "Hisob yaratildi, lekin tasdiqlash kutilmoqda. 'Confirm email' ni o'chiring." };
  }

  const { error: linkError } = await supabase
    .from("class_students")
    .insert({ class_id: classId, student_id: studentId, pin });

  if (linkError) return { student: null, error: linkError.message };
  return { student: { fullName: name, pin, code }, error: null };
}

/** O'quvchini sinfdan chiqarish (hisobi o'chirilmaydi). */
export async function removeStudent(classId: string, studentId: string) {
  const supabase = getBrowserClient();
  if (!supabase) return;
  await supabase.from("class_students").delete().eq("class_id", classId).eq("student_id", studentId);
}

/** PIN ni yangilash — o'quvchi kodini unutgan bo'lsa. */
export async function resetPin(
  classId: string,
  studentId: string,
): Promise<{ pin: string | null; error: string | null }> {
  const supabase = getBrowserClient();
  if (!supabase) return { pin: null, error: "Supabase sozlanmagan." };

  const pin = randomPin();
  const { error } = await supabase
    .from("class_students")
    .update({ pin })
    .eq("class_id", classId)
    .eq("student_id", studentId);

  if (error) return { pin: null, error: error.message };
  return {
    pin,
    error:
      "PIN ro'yxatda yangilandi, lekin parolni almashtirish uchun Supabase panelidan " +
      "foydalanuvchi parolini ham yangilang.",
  };
}
