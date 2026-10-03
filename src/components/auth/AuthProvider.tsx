"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getBrowserClient, isCloudEnabled } from "@/lib/supabase/client";
import type { ProfileRow, UserRole } from "@/lib/supabase/types";
import {
  normalizeClassCode,
  studentCode,
  studentEmail,
  studentPassword,
} from "@/lib/auth/studentIdentity";

interface AuthState {
  /** Supabase sozlanganmi. false bo'lsa faqat doska rejimi ishlaydi. */
  cloud: boolean;
  loading: boolean;
  user: User | null;
  profile: ProfileRow | null;
  role: UserRole | null;
  signInTeacher: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpTeacher: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signInStudent: (classCode: string, fullName: string, pin: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Supabase xato matnlarini o'zbekchaga o'giradi. */
function humanError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Ma'lumotlar noto'g'ri. Qaytadan tekshiring.";
  if (m.includes("email not confirmed")) return "Pochta tasdiqlanmagan. O'qituvchingizga murojaat qiling.";
  if (m.includes("user already registered")) return "Bu hisob allaqachon mavjud.";
  if (m.includes("password should be")) return "Parol kamida 6 belgidan iborat bo'lsin.";
  if (m.includes("rate limit") || m.includes("too many")) return "Juda ko'p urinish. Biroz kutib turing.";
  if (m.includes("failed to fetch")) return "Serverga ulanib bo'lmadi. Internetni tekshiring.";
  return message;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const cloud = isCloudEnabled();
  const supabase = getBrowserClient();
  const [loading, setLoading] = useState(cloud);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const loadProfile = useCallback(
    async (uid: string | undefined) => {
      if (!supabase || !uid) {
        setProfile(null);
        return;
      }
      const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      setProfile((data as ProfileRow | null) ?? null);
    },
    [supabase],
  );

  useEffect(() => {
    if (!supabase) return;
    let alive = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      void loadProfile(next?.user.id);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, loadProfile]);

  const signInTeacher = useCallback<AuthState["signInTeacher"]>(
    async (email, password) => {
      if (!supabase) return { error: "Supabase sozlanmagan." };
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return { error: error ? humanError(error.message) : null };
    },
    [supabase],
  );

  const signUpTeacher = useCallback<AuthState["signUpTeacher"]>(
    async (email, password, fullName) => {
      if (!supabase) return { error: "Supabase sozlanmagan." };
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim(), role: "teacher" } },
      });
      if (error) return { error: humanError(error.message) };

      // Pochta tasdiqlash o'chirilgan bo'lsa, sessiya darhol ochiladi
      await supabase.auth.signInWithPassword({ email: email.trim(), password }).catch(() => undefined);
      return { error: null };
    },
    [supabase],
  );

  const signInStudent = useCallback<AuthState["signInStudent"]>(
    async (classCode, fullName, pin) => {
      if (!supabase) return { error: "Supabase sozlanmagan." };
      const code = normalizeClassCode(classCode);
      if (code.length < 4) return { error: "Sinf kodi noto'g'ri." };
      if (!fullName.trim()) return { error: "Ism-familiyangizni yozing." };
      if (!/^\d{4}$/.test(pin.trim())) return { error: "PIN 4 xonali son bo'lishi kerak." };

      const { error } = await supabase.auth.signInWithPassword({
        email: studentEmail(code, fullName),
        password: studentPassword(pin),
      });
      if (error) {
        return {
          error: error.message.toLowerCase().includes("invalid login credentials")
            ? "Sinf kodi, ism yoki PIN mos kelmadi. O'qituvchingizdan tekshirib oling."
            : humanError(error.message),
        };
      }

      // Profilda kod saqlanmagan bo'lsa — to'ldiramiz
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase
          .from("profiles")
          .update({
            full_name: fullName.trim(),
            student_code: studentCode(code, fullName),
            last_active: new Date().toISOString(),
          })
          .eq("id", data.user.id);
      }
      return { error: null };
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
  }, [supabase]);

  const refresh = useCallback(async () => {
    await loadProfile(session?.user.id);
  }, [loadProfile, session]);

  const value = useMemo<AuthState>(
    () => ({
      cloud,
      loading,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? null,
      signInTeacher,
      signUpTeacher,
      signInStudent,
      signOut,
      refresh,
    }),
    [cloud, loading, session, profile, signInTeacher, signUpTeacher, signInStudent, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth faqat <AuthProvider> ichida ishlaydi");
  return ctx;
}
