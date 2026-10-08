"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, GraduationCap, LogOut, Users } from "lucide-react";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { useAuth } from "@/components/auth/AuthProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardBody } from "@/components/ui/card";
import { RewardQueue } from "@/components/dashboard/RewardQueue";
import { listClasses } from "@/lib/classes";
import { GETMOTION_URL } from "@/lib/links";
import type { ClassRow } from "@/lib/supabase/types";

export default function DashboardPage() {
  const { cloud, loading, profile, role, isOwner, signOut } = useAuth();
  const [classes, setClasses] = useState<(ClassRow & { students: number })[]>([]);
  const router = useRouter();

  // O'quvchi bu bo'limni ko'rmaydi — o'z kabinetiga yo'naltiriladi
  useEffect(() => {
    if (!loading && role === "student") router.replace("/talaba");
  }, [loading, role, router]);

  useEffect(() => {
    if (cloud && role === "teacher") void listClasses().then(setClasses);
  }, [cloud, role]);

  if (!cloud) return <CloudDisabled title="O'qituvchi paneli uchun bulut sozlanmagan" />;
  if (loading) return <div className="grid min-h-dvh place-items-center text-ink-mute">Yuklanmoqda…</div>;

  if (role !== "teacher" && role !== "admin") {
    return <div className="grid min-h-dvh place-items-center text-ink-mute">Yo'naltirilmoqda…</div>;
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

        {/* Sovg'a kuponlari — kupon bo'lsagina ko'rinadi */}
        <RewardQueue />

        {/* Faqat egaga: o'qituvchilarni belgilash */}
        {isOwner ? (
          <Link
            href="/dashboard/ustozlar"
            className="mt-6 flex items-center gap-4 rounded-xl2 bg-ink p-5 text-white shadow-lift transition hover:bg-ink-soft"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15 text-2xl">🔑</span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-extrabold">O'qituvchilar</span>
              <span className="block text-sm text-white/70">
                Kim o'qituvchi bo'la olishini faqat siz belgilaysiz.
              </span>
            </span>
          </Link>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link href="/chat" className="surface p-5 transition hover:shadow-lift">
            <h2 className="text-lg font-extrabold text-ink">Chat</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Sinf kanallari, shaxsiy yozishmalar va havola orqali ochiladigan suhbatlar.
            </p>
          </Link>

          <Link href="/dashboard/ishlar" className="surface p-5 transition hover:shadow-lift">
            <h2 className="text-lg font-extrabold text-ink">📂 O'quvchilar ishlari</h2>
            <p className="mt-1 text-sm text-ink-soft">
              O'quvchilar yuklagan fayl va ishlarni ko'ring, 2–5 baho va izoh qo'ying.
            </p>
          </Link>

          <a
            href={GETMOTION_URL}
            target="_blank"
            rel="noreferrer"
            className="surface p-5 transition hover:shadow-lift"
          >
            <h2 className="text-lg font-extrabold text-ink">🎬 GetMotion ↗</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Video va animatsiya muharriri. Uy vazifasiga havolasini qo'ying — o'quvchilar ishini yuklaydi.
            </p>
          </a>

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
              Fayl, video, matn, havola yoki o'yin bilan topshiriq bering — javoblarni baholang.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
