"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, LogOut, Users } from "lucide-react";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { useAuth } from "@/components/auth/AuthProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardBody } from "@/components/ui/card";
import { listClasses } from "@/lib/classes";
import { getBrowserClient } from "@/lib/supabase/client";
import type { ClassRow } from "@/lib/supabase/types";

export default function DashboardPage() {
  const { cloud, loading, profile, role, user, signOut, refresh } = useAuth();
  const [classes, setClasses] = useState<(ClassRow & { students: number })[]>([]);
  const [promoting, setPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);

  /**
   * Hisob o'quvchi sifatida ochilib qolgan bo'lsa (masalan `/kirish` orqali),
   * haqiqiy pochtali foydalanuvchi o'zini o'qituvchi qilib belgilay oladi.
   * O'quvchilarning pochtasi sintetik — ularga baza triggeri ruxsat bermaydi.
   */
  const promote = async () => {
    const supabase = getBrowserClient();
    if (!supabase || !user) return;
    setPromoting(true);
    setPromoteError(null);
    const { error } = await supabase.from("profiles").update({ role: "teacher" }).eq("id", user.id);
    setPromoting(false);
    if (error) {
      setPromoteError("Bu hisobda o'qituvchi rejimi mavjud emas.");
      return;
    }
    await refresh();
  };

  useEffect(() => {
    if (cloud && role === "teacher") void listClasses().then(setClasses);
  }, [cloud, role]);

  if (!cloud) return <CloudDisabled title="O'qituvchi paneli uchun bulut sozlanmagan" />;
  if (loading) return <div className="grid min-h-dvh place-items-center text-ink-mute">Yuklanmoqda…</div>;

  if (role === "student") {
    const synthetic = (user?.email ?? "").endsWith("@gettalim.local");
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-2xl font-extrabold text-ink">Bu bo'lim o'qituvchilar uchun</h1>
          {synthetic ? (
            <>
              <p className="mt-2 text-ink-mute">Siz o'quvchi hisobi bilan kirgansiz.</p>
              <Link href="/talaba" className="mt-4 inline-block font-bold text-teamA hover:underline">
                Kabinetimga o'tish →
              </Link>
            </>
          ) : (
            <>
              <p className="mt-2 text-pretty text-ink-mute">
                Hisobingiz o'quvchi sifatida ochilgan. O'qituvchi rejimiga o'tsangiz, sinf yaratib
                sessiya ocha olasiz.
              </p>
              {promoteError ? (
                <p className="mt-3 rounded-xl border-2 border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
                  {promoteError}
                </p>
              ) : null}
              <button
                type="button"
                onClick={promote}
                disabled={promoting}
                className="mt-5 rounded-xl2 bg-ink px-5 py-3 text-sm font-extrabold text-white shadow-lift hover:bg-ink-soft disabled:opacity-50"
              >
                {promoting ? "Bajarilmoqda…" : "O'qituvchi rejimiga o'tish"}
              </button>
            </>
          )}
        </main>
      </div>
    );
  }

  const totalStudents = classes.reduce((sum, c) => sum + c.students, 0);

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">O'qituvchi paneli</h1>
            <p className="mt-1 text-ink-mute">{profile?.full_name || "Xush kelibsiz"}</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3.5 py-2 text-sm font-extrabold text-ink hover:bg-paper"
          >
            <LogOut className="h-4 w-4" /> Chiqish
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            [classes.length, "Sinf", Users],
            [totalStudents, "O'quvchi", GraduationCap],
            ["∞", "Savol paketi", BookOpen],
          ].map(([value, label, Icon]) => {
            const Ico = Icon as typeof Users;
            return (
              <Card key={String(label)}>
                <CardBody className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-paper text-ink-soft">
                    <Ico className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-mono text-2xl font-bold tabular-nums text-ink">{String(value)}</span>
                    <span className="block text-xs font-bold uppercase tracking-wide text-ink-mute">
                      {String(label)}
                    </span>
                  </span>
                </CardBody>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link href="/dashboard/classes" className="surface p-5 transition hover:shadow-lift">
            <h2 className="text-lg font-extrabold text-ink">Sinflar va o'quvchilar</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Sinf yarating, o'quvchilarni qo'shing, kirish kodlarini chop eting.
            </p>
          </Link>

          <Link href="/dashboard/korinish" className="surface p-5 transition hover:shadow-lift">
            <h2 className="text-lg font-extrabold text-ink">O'quvchilar nimani ko'radi</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Qaysi savol paketlari o'quvchilarga ochiq bo'lishini belgilang.
            </p>
          </Link>

          <Link href="/dashboard/kartochkalar" className="surface p-5 transition hover:shadow-lift">
            <h2 className="text-lg font-extrabold text-ink">Kirish kartochkalari</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Ekranga chiqaring — butun sinf o'z sinf kodi, ismi va PIN kodini ko'radi.
            </p>
          </Link>

          <Link href="/dashboard/assignments" className="surface p-5 transition hover:shadow-lift">
            <h2 className="text-lg font-extrabold text-ink">Uy vazifalari</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Sinfga muddat bilan topshiriq bering, jurnalda natijalarni ko'ring.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
