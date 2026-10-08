"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, ChevronDown, Plus, Trash2, Users } from "lucide-react";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { useAuth } from "@/components/auth/AuthProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardBody, Field, Input, Select } from "@/components/ui/card";
import { AttachmentEditor } from "@/components/works/AttachmentEditor";
import { TaskCard } from "@/components/works/TaskCard";
import { GradeBadge } from "@/components/works/WorkFiles";
import { getGameDef, type GameId } from "@/lib/games/registry";
import {
  HOMEWORK_GAMES,
  assignmentStats,
  createAssignment,
  deleteAssignment,
  isOverdue,
  listTeacherAssignments,
  taskStats,
  type AssignmentView,
  type Materials,
  type StudentStat,
  type TaskStat,
} from "@/lib/homework/api";
import { publishPack } from "@/lib/homework/packs";
import { listClasses } from "@/lib/classes";
import { uzDateTime } from "@/lib/links";
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

const EMPTY_MATERIALS: Materials = { body: "", link: "", files: [] };

export default function AssignmentsPage() {
  const { cloud, loading, user, role } = useAuth();

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [assignments, setAssignments] = useState<AssignmentView[] | null>(null);
  const [listError, setListError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [stats, setStats] = useState<StudentStat[]>([]);
  const [tstats, setTstats] = useState<TaskStat[]>([]);

  const [kind, setKind] = useState<"task" | "game">("task");
  const [classId, setClassId] = useState("");
  const [gameId, setGameId] = useState<GameId>("yomgir");
  const [packId, setPackId] = useState("");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [attempts, setAttempts] = useState(2);
  const [materials, setMaterials] = useState<Materials>(EMPTY_MATERIALS);
  const [showExtra, setShowExtra] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isTeacher = role === "teacher" || role === "admin";

  const reload = useCallback(async () => {
    if (!user) return;
    const res = await listTeacherAssignments(user.id);
    setAssignments(res.data);
    setListError(res.error ?? "");
  }, [user]);

  useEffect(() => {
    if (!cloud || !isTeacher) return;
    void listClasses().then((list) => {
      setClasses(list);
      setClassId((prev) => prev || list[0]?.id || "");
    });
    const local = getAllPacks().filter((p) => !p.generator);
    setPacks(local);
    setPackId((prev) => prev || local[0]?.id || "");
    void reload();
  }, [cloud, isTeacher, reload]);

  const opened = useMemo(() => assignments?.find((a) => a.id === openId) ?? null, [assignments, openId]);

  useEffect(() => {
    setStats([]);
    setTstats([]);
    if (!opened) return;
    if (opened.kind === "task") void taskStats(opened.id).then(setTstats);
    else void assignmentStats(opened.id).then(setStats);
  }, [opened]);

  const pack = useMemo(() => packs.find((p) => p.id === packId), [packs, packId]);

  if (!cloud) return <CloudDisabled title="Topshiriqlar uchun bulut sozlanmagan" />;
  if (loading) return <div className="grid min-h-dvh place-items-center text-ink-mute">Yuklanmoqda…</div>;
  if (!isTeacher) {
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

  const hasMaterials = Boolean(materials.body.trim() || materials.link.trim() || materials.files.length);
  const canSubmit =
    !busy &&
    !uploading &&
    Boolean(classId) &&
    (kind === "game" ? Boolean(pack) : Boolean(title.trim()) && hasMaterials);

  const submit = async () => {
    if (!user || !classId) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    let cloudPackId: string | null = null;
    if (kind === "game") {
      if (!pack) return;
      // Savollar bulutga ko'chiriladi — o'quvchi ularni uydan ochadi
      const published = await publishPack(pack, user.id);
      if (published.error || !published.packId) {
        setBusy(false);
        setError(published.error ?? "Paket yuklanmadi.");
        return;
      }
      cloudPackId = published.packId;
    }

    const { error: err } = await createAssignment({
      teacherId: user.id,
      classId,
      kind,
      gameId: kind === "game" ? gameId : null,
      packId: cloudPackId,
      title: title.trim() || (pack ? `${getGameDef(gameId).nomi.uz} — ${pack.title}` : "Uy vazifasi"),
      config: kind === "game" ? defaultConfig(gameId) : {},
      dueAt: due ? new Date(due).toISOString() : null,
      maxAttempts: kind === "game" ? attempts : 1,
      materials,
    });

    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setTitle("");
    setDue("");
    setMaterials(EMPTY_MATERIALS);
    setShowExtra(false);
    setNotice("Topshiriq berildi — o'quvchilar kabinetida ko'rinadi.");
    await reload();
  };

  const submitted = tstats.filter((s) => s.work_id).length;

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/dashboard" className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" /> Panel
        </Link>
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Uy vazifalari</h1>
        <p className="mt-1 text-ink-mute">
          Fayl, video, matn yoki havola bilan topshiriq bering — yoki o'yin orqali takrorlatish.
        </p>

        {/* Yangi topshiriq */}
        <Card className="mt-6">
          <CardBody>
            <h2 className="eyebrow mb-3">Yangi topshiriq</h2>

            {/* Turi */}
            <div className="mb-5 grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["task", "📎", "Topshiriq", "Fayl, video, matn, havola — o'quvchi ishini yuklaydi, siz baholaysiz"],
                  ["game", "🎮", "O'yin", "Savollar paketi bilan — natija jurnalga o'zi tushadi"],
                ] as const
              ).map(([id, icon, label, hint]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setKind(id)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl2 border-2 p-3.5 text-left transition",
                    kind === id ? "border-ink bg-paper" : "border-paper-line bg-white hover:border-ink-mute",
                  )}
                >
                  <span className="text-2xl" aria-hidden>
                    {icon}
                  </span>
                  <span>
                    <span className="block font-extrabold text-ink">{label}</span>
                    <span className="block text-xs text-ink-mute">{hint}</span>
                  </span>
                </button>
              ))}
            </div>

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

              <Field
                label="Sarlavha"
                hint={kind === "game" ? "Bo'sh qoldirsangiz avtomatik yoziladi" : "Masalan: GetMotion'da 10 soniyalik animatsiya"}
              >
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={kind === "game" ? "Masalan: 5-dars takrori" : "Topshiriq nomi"}
                />
              </Field>

              {kind === "game" ? (
                <>
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

                  <Field label="Urinishlar soni">
                    <Select value={attempts} onChange={(e) => setAttempts(Number(e.target.value))}>
                      {[1, 2, 3, 5].map((n) => (
                        <option key={n} value={n}>
                          {n} marta
                        </option>
                      ))}
                    </Select>
                  </Field>
                </>
              ) : null}

              <Field label="Muddat" hint="Bo'sh qoldirsangiz muddatsiz">
                <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
              </Field>
            </div>

            {/* Materiallar */}
            {kind === "task" || showExtra ? (
              <div className="mt-5 rounded-xl2 border-2 border-paper-line p-4">
                <h3 className="mb-3 font-extrabold text-ink">
                  {kind === "task" ? "Topshiriq mazmuni" : "Qo'shimcha material"}
                </h3>
                <AttachmentEditor
                  value={materials}
                  onChange={setMaterials}
                  folder="vazifalar"
                  bodyLabel={kind === "task" ? "Topshiriq matni" : "Izoh (ixtiyoriy)"}
                  bodyPlaceholder="Nima qilish kerak, qanday topshiriladi…"
                  onBusyChange={setUploading}
                />
                {kind === "task" ? (
                  <p className="mt-3 text-xs text-ink-mute">
                    O'quvchi javob sifatida fayl, video, matn yoki havola (masalan, GetMotion ishi) yuklaydi.
                  </p>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowExtra(true)}
                className="mt-4 flex items-center gap-1.5 text-sm font-bold text-teamA hover:underline"
              >
                <Plus className="h-4 w-4" /> Fayl, video yoki havola qo'shish
              </button>
            )}

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

            <Button variant="dark" className="mt-4" onClick={submit} disabled={!canSubmit || classes.length === 0}>
              <Plus className="h-4 w-4" /> {busy ? "Berilmoqda…" : "Topshiriq berish"}
            </Button>
            {kind === "task" && !hasMaterials ? (
              <p className="mt-2 text-xs text-ink-mute">Matn, fayl yoki havoladan kamida bittasini qo'shing.</p>
            ) : null}

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
        <h2 className="eyebrow mb-2 mt-8">Berilgan topshiriqlar · {assignments?.length ?? 0}</h2>
        {listError ? (
          <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
            Ro'yxatni o'qib bo'lmadi: {listError}
          </p>
        ) : null}
        {assignments === null ? (
          <p className="surface p-8 text-center text-ink-mute">Yuklanmoqda…</p>
        ) : assignments.length === 0 ? (
          <p className="surface p-8 text-center text-ink-mute">Hozircha topshiriq yo'q.</p>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => {
              const isTask = a.kind === "task";
              const game = !isTask && a.game_id ? getGameDef(a.game_id as GameId) : null;
              const open = openId === a.id;
              const overdue = isOverdue(a.due_at);
              const withMaterials = Boolean(a.body || a.link || a.files.length);
              return (
                <div key={a.id} className="surface overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-paper">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : a.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className="text-2xl" aria-hidden>
                        {isTask ? "📎" : (game?.ikonka ?? "🎮")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-extrabold text-ink">{a.title}</span>
                        <span className="flex flex-wrap items-center gap-x-3 text-xs text-ink-mute">
                          <span className="font-bold">{isTask ? "Topshiriq" : (game?.nomi.uz ?? "O'yin")}</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {a.className ?? "—"}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarClock className="h-3 w-3" />
                            {a.due_at ? uzDateTime(a.due_at) : "muddatsiz"}
                          </span>
                          {!isTask ? <span>{a.max_attempts} urinish</span> : null}
                          {withMaterials ? <span>📎 material</span> : null}
                        </span>
                      </span>
                      {overdue ? (
                        <span className="hidden rounded-full bg-paper px-2.5 py-1 text-[11px] font-extrabold text-ink-mute sm:inline">
                          Muddati tugadi
                        </span>
                      ) : null}
                      <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-mute transition", open && "rotate-180")} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            isTask
                              ? "Topshiriq o'chirilsinmi? O'quvchilar yuklagan ishlar «O'quvchilar ishlari»da qoladi."
                              : "Topshiriq o'chirilsinmi?",
                          )
                        ) {
                          void deleteAssignment(a.id).then(reload);
                        }
                      }}
                      className="rounded-lg p-1.5 text-ink-mute transition hover:bg-white hover:text-teamB"
                      aria-label="O'chirish"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {open ? (
                    <div className="border-t border-paper-line px-4 py-3">
                      {withMaterials ? (
                        <div className="mb-4">
                          <h3 className="eyebrow mb-1">Material</h3>
                          <TaskCard task={a} compact />
                        </div>
                      ) : null}

                      {isTask ? (
                        <>
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="eyebrow">
                              Topshirganlar · {submitted}/{tstats.length}
                            </h3>
                            <Link
                              href={`/dashboard/ishlar?topshiriq=${a.id}`}
                              className="rounded-lg bg-ink px-3 py-1.5 text-sm font-extrabold text-white hover:bg-ink-soft"
                            >
                              Ishlarni ko'rish va baholash →
                            </Link>
                          </div>
                          {tstats.length === 0 ? (
                            <p className="py-4 text-center text-sm text-ink-mute">Ma'lumot yo'q.</p>
                          ) : (
                            <ul className="divide-y divide-paper-line text-sm">
                              {tstats.map((row) => (
                                <li key={row.student_id} className="flex items-center gap-3 py-1.5">
                                  <span className="min-w-0 flex-1 truncate font-bold text-ink">{row.full_name}</span>
                                  <span className="text-xs text-ink-mute">
                                    {row.submitted_at ? uzDateTime(row.submitted_at) : "topshirmagan"}
                                  </span>
                                  {row.work_id ? (
                                    <GradeBadge grade={row.grade} className="!h-8 !w-8 !text-base" />
                                  ) : (
                                    <span className="grid h-8 w-8 place-items-center text-ink-mute">—</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      ) : (
                        <>
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
                                    <td className="py-1.5 text-xs text-ink-mute">{uzDateTime(row.finished_at)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </>
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
