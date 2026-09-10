"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, Plus, Trash2, Users } from "lucide-react";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { useAuth } from "@/components/auth/AuthProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { useI18n } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Card, CardBody, Field, Input, Select } from "@/components/ui/card";
import { getGameDef, type GameId } from "@/lib/games/registry";
import {
  HOMEWORK_GAMES,
  assignmentStats,
  createAssignment,
  deleteAssignment,
  isOverdue,
  listTeacherAssignments,
  type AssignmentView,
  type StudentStat,
} from "@/lib/homework/api";
import { publishPack } from "@/lib/homework/packs";
import { listClasses } from "@/lib/classes";
import { getAllPacks } from "@/lib/storage";
import type { ClassRow } from "@/lib/supabase/types";
import type { Pack } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Har bir o'yin uchun uy vazifasi sozlamalari. */
function defaultConfig(gameId: GameId): Record<string, unknown> {
  switch (gameId) {
    case "yomgir":
      return { lives: 3, tempo: "normal", duration: 300, questionCount: 15 };
    case "millioner":
      return { seconds: 45, lifelines: true };
    case "xotira":
      return { size: "4x4" };
    case "krossvord":
      return { words: 10, showClues: true };
    default:
      return {};
  }
}

export default function AssignmentsPage() {
  const { t } = useI18n();
  const { cloud, loading, user, role } = useAuth();

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [assignments, setAssignments] = useState<AssignmentView[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [stats, setStats] = useState<StudentStat[]>([]);

  const [classId, setClassId] = useState("");
  const [gameId, setGameId] = useState<GameId>("yomgir");
  const [packId, setPackId] = useState("");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [attempts, setAttempts] = useState(2);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setAssignments(await listTeacherAssignments());
  }, []);

  useEffect(() => {
    if (!cloud || role !== "teacher") return;
    void listClasses().then((list) => {
      setClasses(list);
      setClassId((prev) => prev || list[0]?.id || "");
    });
    const local = getAllPacks().filter((p) => !p.generator);
    setPacks(local);
    setPackId((prev) => prev || local[0]?.id || "");
    void reload();
  }, [cloud, role, reload]);

  useEffect(() => {
    if (openId) void assignmentStats(openId).then(setStats);
    else setStats([]);
  }, [openId]);

  const pack = useMemo(() => packs.find((p) => p.id === packId), [packs, packId]);

  if (!cloud) return <CloudDisabled title="Topshiriqlar uchun bulut sozlanmagan" />;
  if (loading) return <div className="grid min-h-dvh place-items-center text-ink-mute">Yuklanmoqda…</div>;
  if (role !== "teacher") {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-2xl font-extrabold text-ink">Bu bo'lim o'qituvchilar uchun</h1>
          <Link href="/talaba" className="mt-4 inline-block font-bold text-teamA hover:underline">
            Kabinetimga o'tish →
          </Link>
        </main>
      </div>
    );
  }

  const submit = async () => {
    if (!user || !pack || !classId) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    // Savollar bulutga ko'chiriladi — o'quvchi ularni uydan ochadi
    const { packId: cloudPackId, error: packError } = await publishPack(pack, user.id);
    if (packError || !cloudPackId) {
      setBusy(false);
      setError(packError ?? "Paket yuklanmadi.");
      return;
    }

    const { error: err } = await createAssignment({
      teacherId: user.id,
      classId,
      gameId,
      packId: cloudPackId,
      title: title.trim() || `${getGameDef(gameId).nomi.uz} — ${pack.title}`,
      config: defaultConfig(gameId),
      dueAt: due ? new Date(due).toISOString() : null,
      maxAttempts: attempts,
    });

    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setTitle("");
    setDue("");
    setNotice("Topshiriq berildi — o'quvchilar kabinetida ko'rinadi.");
    await reload();
  };

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/dashboard" className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" /> Panel
        </Link>
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Uy vazifalari</h1>
        <p className="mt-1 text-ink-mute">
          Sinfga muddat bilan topshiriq bering — natija jurnalga o'zi tushadi.
        </p>

        {/* Yangi topshiriq */}
        <Card className="mt-6">
          <CardBody>
            <h2 className="eyebrow mb-3">Yangi topshiriq</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Sinf">
                <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
                  {classes.length === 0 ? <option value="">Sinf yo'q</option> : null}
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="O'yin" hint="Uy vazifasiga yolg'iz o'ynaladigan o'yinlar beriladi">
                <Select value={gameId} onChange={(e) => setGameId(e.target.value as GameId)}>
                  {HOMEWORK_GAMES.map((id) => (
                    <option key={id} value={id}>
                      {getGameDef(id).ikonka} {getGameDef(id).nomi.uz}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Savollar paketi" hint="Savollar bulutga ko'chiriladi">
                <Select value={packId} onChange={(e) => setPackId(e.target.value)}>
                  {packs.length === 0 ? <option value="">Paket yo'q</option> : null}
                  {packs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.questions.length})
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Sarlavha" hint="Bo'sh qoldirsangiz avtomatik yoziladi">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masalan: 5-dars takrori" />
              </Field>

              <Field label="Muddat" hint="Bo'sh qoldirsangiz muddatsiz">
                <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
              </Field>

              <Field label="Urinishlar soni">
                <Select value={attempts} onChange={(e) => setAttempts(Number(e.target.value))}>
                  {[1, 2, 3, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} marta
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            {error ? (
              <p className="mt-3 rounded-xl border-2 border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
                {error}
              </p>
            ) : null}
            {notice ? (
              <p className="mt-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">
                {notice}
              </p>
            ) : null}

            <Button
              variant="dark"
              className="mt-4"
              onClick={submit}
              disabled={busy || !pack || !classId || classes.length === 0}
            >
              <Plus className="h-4 w-4" /> {busy ? "Berilmoqda…" : "Topshiriq berish"}
            </Button>

            {classes.length === 0 ? (
              <p className="mt-3 text-sm text-ink-mute">
                Avval{" "}
                <Link href="/dashboard/classes" className="font-bold text-teamA hover:underline">
                  sinf yarating
                </Link>
                .
              </p>
            ) : null}
          </CardBody>
        </Card>

        {/* Ro'yxat */}
        <h2 className="eyebrow mb-2 mt-8">Berilgan topshiriqlar · {assignments.length}</h2>
        {assignments.length === 0 ? (
          <p className="surface p-8 text-center text-ink-mute">Hozircha topshiriq yo'q.</p>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => {
              const game = getGameDef(a.game_id as GameId);
              const open = openId === a.id;
              const overdue = isOverdue(a.due_at);
              return (
                <div key={a.id} className="surface overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : a.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-paper"
                  >
                    <span className="text-2xl" aria-hidden>
                      {game.ikonka}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-extrabold text-ink">{a.title}</span>
                      <span className="flex flex-wrap items-center gap-x-3 text-xs text-ink-mute">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {a.className ?? "—"}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          {a.due_at ? new Date(a.due_at).toLocaleString("uz-UZ") : "muddatsiz"}
                        </span>
                        <span>{a.max_attempts} urinish</span>
                      </span>
                    </span>
                    {overdue ? (
                      <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-extrabold text-ink-mute">
                        Muddati tugadi
                      </span>
                    ) : null}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Topshiriq o'chirilsinmi?")) {
                          void deleteAssignment(a.id).then(reload);
                        }
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="rounded-lg p-1.5 text-ink-mute transition hover:bg-paper hover:text-teamB"
                      aria-label="O'chirish"
                    >
                      <Trash2 className="h-4 w-4" />
                    </span>
                  </button>

                  {open ? (
                    <div className="border-t border-paper-line px-4 py-3">
                      <h3 className="eyebrow mb-2">Jurnal</h3>
                      {stats.length === 0 ? (
                        <p className="py-4 text-center text-sm text-ink-mute">Ma'lumot yo'q.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="text-left text-xs font-extrabold uppercase tracking-wide text-ink-mute">
                            <tr>
                              <th className="py-1.5">O'quvchi</th>
                              <th className="py-1.5">Urinish</th>
                              <th className="py-1.5">Natija</th>
                              <th className="py-1.5">Topshirilgan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-paper-line">
                            {stats.map((row) => (
                              <tr key={row.student_id}>
                                <td className="py-1.5 font-bold text-ink">{row.full_name}</td>
                                <td className="py-1.5 font-mono text-ink-soft">{row.attempts}</td>
                                <td
                                  className={cn(
                                    "py-1.5 font-mono font-bold",
                                    row.attempts === 0 ? "text-ink-mute" : "text-ink",
                                  )}
                                >
                                  {row.attempts === 0 ? "—" : `${row.best_score} / ${row.max_score}`}
                                </td>
                                <td className="py-1.5 text-xs text-ink-mute">
                                  {row.finished_at ? new Date(row.finished_at).toLocaleString("uz-UZ") : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
