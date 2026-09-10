"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, IdCard, Plus, Printer, Trash2, UserPlus } from "lucide-react";
import { BroadcastCredentials } from "@/components/dashboard/BroadcastCredentials";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { useAuth } from "@/components/auth/AuthProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardBody, Field, Input } from "@/components/ui/card";
import {
  addStudent,
  archiveClass,
  createClass,
  listClasses,
  listStudents,
  removeStudent,
  type CreatedStudent,
  type StudentRow,
} from "@/lib/classes";
import type { ClassRow } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export default function ClassesPage() {
  const { cloud, loading, user, role } = useAuth();
  const [classes, setClasses] = useState<(ClassRow & { students: number })[]>([]);
  const [active, setActive] = useState<ClassRow | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [newClass, setNewClass] = useState("");
  const [newStudent, setNewStudent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<CreatedStudent | null>(null);

  const reload = useCallback(async () => {
    const list = await listClasses();
    setClasses(list);
    setActive((prev) => (prev ? list.find((c) => c.id === prev.id) ?? null : list[0] ?? null));
  }, []);

  useEffect(() => {
    if (cloud && role === "teacher") void reload();
  }, [cloud, role, reload]);

  useEffect(() => {
    if (active) void listStudents(active.id).then(setStudents);
    else setStudents([]);
  }, [active]);

  if (!cloud) return <CloudDisabled title="Sinflar uchun bulut sozlanmagan" />;
  if (loading) return <div className="grid min-h-dvh place-items-center text-ink-mute">Yuklanmoqda…</div>;

  const onCreateClass = async () => {
    if (!user || newClass.trim().length < 2) return;
    setBusy(true);
    const { error: err } = await createClass(newClass, user.id);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setNewClass("");
    setError(null);
    await reload();
  };

  const onAddStudent = async () => {
    if (!active) return;
    setBusy(true);
    setError(null);
    const { student, error: err } = await addStudent(active.id, active.join_code, newStudent);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setNewStudent("");
    setJustAdded(student);
    await listStudents(active.id).then(setStudents);
    await reload();
  };

  const onRemove = async (id: string) => {
    if (!active) return;
    await removeStudent(active.id, id);
    await listStudents(active.id).then(setStudents);
    await reload();
  };

  const copy = (text: string) => navigator.clipboard?.writeText(text).catch(() => undefined);

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 print:max-w-none print:py-0">
        <div className="print:hidden">
          <Link href="/dashboard" className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold">
            <ArrowLeft className="h-4 w-4" /> Panel
          </Link>
          <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Sinflar va o'quvchilar</h1>
          <p className="mt-1 text-ink-mute">
            O'quvchi ro'yxatdan o'tmaydi — siz qo'shasiz, u sinf kodi, ismi va PIN bilan kiradi.
          </p>
        </div>

        {/* Sinf yaratish */}
        <Card className="mt-6 print:hidden">
          <CardBody className="flex flex-wrap items-end gap-3">
            <Field label="Yangi sinf nomi" className="min-w-[220px] flex-1">
              <Input
                value={newClass}
                onChange={(e) => setNewClass(e.target.value)}
                placeholder="9-A sinf"
                onKeyDown={(e) => e.key === "Enter" && void onCreateClass()}
              />
            </Field>
            <Button variant="dark" onClick={onCreateClass} disabled={busy || newClass.trim().length < 2}>
              <Plus className="h-4 w-4" /> Sinf qo'shish
            </Button>
          </CardBody>
        </Card>

        {/* Sinflar ro'yxati */}
        {classes.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2 print:hidden">
            {classes.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(c)}
                className={cn(
                  "rounded-xl border-2 px-3.5 py-2 text-sm font-extrabold transition",
                  active?.id === c.id
                    ? "border-ink bg-ink text-white"
                    : "border-paper-line bg-white text-ink hover:bg-paper",
                )}
              >
                {c.name}
                <span className={cn("ml-2 text-xs", active?.id === c.id ? "text-white/70" : "text-ink-mute")}>
                  {c.students}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border-2 border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900 print:hidden">
            {error}
          </p>
        ) : null}

        {active ? (
          <>
            {/* Sinf kodi */}
            <Card className="mt-6">
              <CardBody className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="eyebrow">Sinf kodi</h2>
                  <p className="mt-1 font-mono text-3xl font-bold tracking-[0.2em] text-ink">{active.join_code}</p>
                  <p className="mt-1 text-xs text-ink-mute">O'quvchilar shu kod bilan kiradi</p>
                </div>
                <div className="flex flex-wrap gap-2 print:hidden">
                  <BroadcastCredentials
                    classId={active.id}
                    joinCode={active.join_code}
                    openUntil={active.roster_open_until}
                    onChange={reload}
                  />
                  <Button variant="outline" onClick={() => copy(active.join_code)}>
                    <Copy className="h-4 w-4" /> Nusxa
                  </Button>
                  <Link href={`/dashboard/kartochkalar?sinf=${active.id}`}>
                    <Button variant="dark">
                      <IdCard className="h-4 w-4" /> Kirish kartochkalari
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="h-4 w-4" /> Chop etish
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!confirm(`"${active.name}" arxivga o'tsinmi?`)) return;
                      await archiveClass(active.id);
                      setActive(null);
                      await reload();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* O'quvchi qo'shish */}
            <Card className="mt-4 print:hidden">
              <CardBody className="flex flex-wrap items-end gap-3">
                <Field label="O'quvchi ism-familiyasi" className="min-w-[220px] flex-1">
                  <Input
                    value={newStudent}
                    onChange={(e) => setNewStudent(e.target.value)}
                    placeholder="Alisher Nazarov"
                    onKeyDown={(e) => e.key === "Enter" && void onAddStudent()}
                  />
                </Field>
                <Button variant="dark" onClick={onAddStudent} disabled={busy || newStudent.trim().length < 3}>
                  <UserPlus className="h-4 w-4" /> Qo'shish
                </Button>
              </CardBody>
            </Card>

            {justAdded ? (
              <div className="mt-4 rounded-xl2 border-2 border-emerald-300 bg-emerald-50 p-4 print:hidden">
                <p className="text-sm font-extrabold text-emerald-900">
                  {justAdded.fullName} qo'shildi. Kirish ma'lumotlari:
                </p>
                <p className="mt-1 font-mono text-sm text-emerald-900">
                  Sinf kodi: <b>{active.join_code}</b> · Ism: <b>{justAdded.fullName}</b> · PIN:{" "}
                  <b>{justAdded.pin}</b>
                </p>
                <p className="mt-1 text-xs text-emerald-800">
                  PIN faqat shu yerda va ro'yxatda ko'rinadi — o'quvchiga yozib bering.
                </p>
              </div>
            ) : null}

            {/* O'quvchilar ro'yxati */}
            <div className="mt-6">
              <h2 className="eyebrow mb-2">
                {active.name} · {students.length} o'quvchi
              </h2>
              {students.length === 0 ? (
                <p className="surface p-6 text-center text-ink-mute">Hozircha o'quvchi yo'q.</p>
              ) : (
                <div className="surface overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-paper text-left">
                      <tr className="text-xs font-extrabold uppercase tracking-wide text-ink-mute">
                        <th className="px-4 py-2.5">Ism-familiya</th>
                        <th className="px-4 py-2.5">PIN</th>
                        <th className="px-4 py-2.5">XP</th>
                        <th className="px-4 py-2.5 print:hidden" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-paper-line">
                      {students.map((s) => (
                        <tr key={s.id}>
                          <td className="px-4 py-2.5 font-bold text-ink">{s.full_name}</td>
                          <td className="px-4 py-2.5 font-mono tracking-widest text-ink-soft">{s.pin ?? "—"}</td>
                          <td className="px-4 py-2.5 font-mono tabular-nums text-ink-soft">{s.xp}</td>
                          <td className="px-4 py-2.5 text-right print:hidden">
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`${s.full_name} sinfdan chiqarilsinmi?`)) void onRemove(s.id);
                              }}
                              className="rounded-lg p-1.5 text-ink-mute transition hover:bg-paper hover:text-teamB"
                              aria-label="O'chirish"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="mt-8 surface p-8 text-center text-ink-mute">
            Birinchi sinfingizni yarating — keyin o'quvchilarni qo'shasiz.
          </p>
        )}
      </main>
    </div>
  );
}
