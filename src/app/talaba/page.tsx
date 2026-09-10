"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2, LogIn, LogOut } from "lucide-react";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { useAuth } from "@/components/auth/AuthProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardBody, Field, Input } from "@/components/ui/card";
import { ProgressPanel } from "@/components/gamification/ProgressPanel";
import { classLeaderboard, type LeaderRow } from "@/lib/gamification/api";
import { getGameDef, type GameId } from "@/lib/games/registry";
import { isOverdue, listStudentAssignments, type AssignmentView } from "@/lib/homework/api";
import { getBrowserClient } from "@/lib/supabase/client";
import type { ClassRow } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export default function TalabaPage() {
  const { cloud, loading, profile, role, user, signOut } = useAuth();
  const router = useRouter();
  const [klass, setKlass] = useState<ClassRow | null>(null);
  const [pin, setPin] = useState("");
  const [tasks, setTasks] = useState<AssignmentView[]>([]);
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase || role !== "student") return;
    void supabase
      .from("class_students")
      .select("classes(*)")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        const row = data as unknown as { classes: ClassRow } | null;
        setKlass(row?.classes ?? null);
      });
  }, [role]);

  /* Uy vazifalari */
  useEffect(() => {
    if (!user || role !== "student") return;
    void listStudentAssignments(user.id).then(setTasks);
    void classLeaderboard().then(setLeaders);
  }, [user, role]);

  if (!cloud) return <CloudDisabled title="Kabinet uchun bulut sozlanmagan" />;
  if (loading) return <div className="grid min-h-dvh place-items-center text-ink-mute">Yuklanmoqda…</div>;

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">
              Salom, {profile?.full_name || "o'quvchi"}!
            </h1>
            <p className="mt-1 text-ink-mute">{klass ? klass.name : "Sinf biriktirilmagan"}</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3.5 py-2 text-sm font-extrabold text-ink hover:bg-paper"
          >
            <LogOut className="h-4 w-4" /> Chiqish
          </button>
        </div>

        {/* O'yinga qo'shilish — o'qituvchi bergan PIN bilan */}
        <Card className="mt-6 border-2 border-teamA/30">
          <CardBody>
            <h2 className="text-lg font-extrabold text-ink">O'yinga qo'shilish</h2>
            <p className="mt-1 text-sm text-ink-soft">
              O'qituvchi ekranidagi 6 xonali PIN kodni kiriting.
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <Field label="PIN" className="min-w-[180px] flex-1">
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="text-center font-mono text-2xl tracking-[0.35em]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && pin.length === 6) router.push(`/join?pin=${pin}`);
                  }}
                />
              </Field>
              <Button
                variant="dark"
                size="lg"
                disabled={pin.length !== 6}
                onClick={() => router.push(`/join?pin=${pin}`)}
              >
                <LogIn className="h-5 w-5" /> Qo'shilish
              </Button>
            </div>
          </CardBody>
        </Card>

        <ProgressPanel
          xp={profile?.xp ?? 0}
          level={profile?.level ?? 1}
          streak={profile?.streak_days ?? 0}
        />

        {/* Tez havolalar */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link href="/talaba/xatolar" className="surface flex items-center gap-3 p-4 transition hover:shadow-lift">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-2xl">🎯</span>
            <span className="min-w-0">
              <span className="block font-extrabold text-ink">Mening xatolarim</span>
              <span className="block text-xs text-ink-mute">Xato qilgan savollar ustida ishlash</span>
            </span>
          </Link>

          <Link href="/talaba/dokon" className="surface flex items-center gap-3 p-4 transition hover:shadow-lift">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#7a3fd0]/10 text-2xl">🛍️</span>
            <span className="min-w-0">
              <span className="block font-extrabold text-ink">XP do'koni</span>
              <span className="block text-xs text-ink-mute">Ballga avatar va unvon oling</span>
            </span>
          </Link>
        </div>

        {/* Uy vazifalari */}
        <div className="mt-6">
          <h2 className="eyebrow mb-2">Uy vazifalari · {tasks.length}</h2>

          {tasks.length === 0 ? (
            <Card>
              <CardBody className="py-8 text-center text-ink-mute">
                Hozircha topshiriq yo'q. O'qituvchingiz bergach shu yerda paydo bo'ladi.
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const game = getGameDef(task.game_id as GameId);
                const overdue = isOverdue(task.due_at);
                const attempts = task.myAttempts ?? 0;
                const left = task.max_attempts - attempts;
                const canPlay = !overdue && left > 0;

                return (
                  <Card key={task.id}>
                    <CardBody className="flex flex-wrap items-center gap-3">
                      <span className="text-3xl" aria-hidden>
                        {game.ikonka}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-extrabold text-ink">{task.title}</span>
                        <span className="flex flex-wrap items-center gap-x-3 text-xs text-ink-mute">
                          <span>{game.nomi.uz}</span>
                          <span className="flex items-center gap-1">
                            <CalendarClock className="h-3 w-3" />
                            {task.due_at ? new Date(task.due_at).toLocaleString("uz-UZ") : "muddatsiz"}
                          </span>
                          <span>
                            {attempts}/{task.max_attempts} urinish
                          </span>
                        </span>
                      </span>

                      {attempts > 0 ? (
                        <span className="flex items-center gap-1.5 rounded-xl bg-paper px-3 py-1.5 text-sm font-extrabold text-ink-soft">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          {task.myBest} / {task.myMax}
                        </span>
                      ) : null}

                      {canPlay ? (
                        <Link href={`/${game.slug}/play?vazifa=${task.id}`}>
                          <Button variant="dark">{attempts > 0 ? "Qayta urinish" : "Boshlash"}</Button>
                        </Link>
                      ) : (
                        <span
                          className={cn(
                            "rounded-xl px-3.5 py-2 text-sm font-extrabold",
                            overdue ? "bg-paper text-ink-mute" : "bg-emerald-50 text-emerald-800",
                          )}
                        >
                          {overdue ? "Muddati tugadi" : "Bajarildi"}
                        </span>
                      )}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Sinf reytingi */}
        {leaders.length > 1 ? (
          <div className="mt-8">
            <h2 className="eyebrow mb-2">Sinf reytingi</h2>
            <Card>
              <CardBody className="space-y-1.5">
                {leaders.slice(0, 10).map((row, i) => (
                  <div
                    key={row.studentId}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 px-3 py-2",
                      row.studentId === user?.id ? "border-ink bg-paper" : "border-paper-line",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-extrabold text-white",
                        i === 0 ? "bg-gold" : i < 3 ? "bg-ink-soft" : "bg-ink-mute",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-bold text-ink">{row.fullName}</span>
                    <span className="font-mono text-xs text-ink-mute">{row.level}-daraja</span>
                    <span className="font-mono text-sm font-bold text-ink">{row.xp} XP</span>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        ) : null}
      </main>
    </div>
  );
}
