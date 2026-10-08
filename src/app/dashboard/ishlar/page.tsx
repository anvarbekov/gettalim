"use client";

import { memo, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pin, RotateCcw, Trash2, Unlock } from "lucide-react";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { useAuth } from "@/components/auth/AuthProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { GradeBadge, WorkFiles } from "@/components/works/WorkFiles";
import { listClasses } from "@/lib/classes";
import { getBrowserClient } from "@/lib/supabase/client";
import type { ClassRow } from "@/lib/supabase/types";
import { uzDateTime } from "@/lib/links";
import {
  EDIT_LIMIT,
  deleteWork,
  gradeWork,
  isLate,
  resetWorkLimits,
  teacherWorks,
  type Work,
  type WorkStatus,
} from "@/lib/works/api";
import { cn } from "@/lib/utils";

/**
 * O'quvchilar ishlari — o'qituvchi ko'radi, 2–5 baho qo'yadi, o'chiradi.
 * Faqat o'z sinflaridagi o'quvchilar ishlari (bazada tekshiriladi).
 * `?topshiriq=<id>` — faqat shu uy vazifasiga yuklangan ishlar.
 */

const GRADE_ON: Record<number, string> = {
  5: "bg-emerald-500 text-white",
  4: "bg-sky-500 text-white",
  3: "bg-amber-400 text-ink",
  2: "bg-rose-500 text-white",
};

export default function IshlarPage() {
  const { cloud, loading, role } = useAuth();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [tasks, setTasks] = useState<{ id: string; title: string }[]>([]);
  const [classId, setClassId] = useState("");
  const [assignmentId, setAssignmentId] = useState("");
  const [status, setStatus] = useState<WorkStatus>("ungraded");
  const [works, setWorks] = useState<Work[] | null>(null);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [ready, setReady] = useState(false);

  const isTeacher = role === "teacher" || role === "admin";

  useEffect(() => {
    if (!cloud || !isTeacher) return;
    void listClasses().then(setClasses);
    const supabase = getBrowserClient();
    void supabase
      ?.from("assignments")
      .select("id, title")
      .eq("kind", "task")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setTasks((data as { id: string; title: string }[] | null) ?? []));

    const fromUrl = new URLSearchParams(window.location.search).get("topshiriq");
    if (fromUrl) {
      setAssignmentId(fromUrl);
      setStatus(null);
    }
    setReady(true);
  }, [cloud, isTeacher]);

  const load = useCallback(async () => {
    setWorks(null);
    const res = await teacherWorks({ classId: classId || null, status, assignmentId: assignmentId || null });
    setWorks(res.data);
    setError(res.error ?? "");
  }, [classId, status, assignmentId]);

  useEffect(() => {
    if (cloud && isTeacher && ready) void load();
  }, [cloud, isTeacher, ready, load]);

  /** Baholangandan keyin joyida yangilaymiz — ish ko'zdan yo'qolmaydi. */
  const onGraded = useCallback((id: string, grade: number | null, comment: string) => {
    setWorks((list) =>
      list ? list.map((w) => (w.id === id ? { ...w, grade, gradeComment: comment.trim() || null } : w)) : list,
    );
  }, []);

  const onDeleted = useCallback((id: string) => {
    setWorks((list) => (list ? list.filter((w) => w.id !== id) : list));
    setFlash("Ish o'chirildi.");
  }, []);

  const onReset = useCallback((studentId: string, name: string) => {
    setWorks((list) => (list ? list.map((w) => (w.studentId === studentId ? { ...w, editCount: 0 } : w)) : list));
    setFlash(`${name}: o'chirish va qayta yuklash imkoniyatlari yana 3 taga tiklandi.`);
  }, []);

  if (!cloud) return <CloudDisabled title="Bulut sozlanmagan" />;
  if (loading) return <div className="grid min-h-dvh place-items-center text-ink-mute">Yuklanmoqda…</div>;
  if (!isTeacher) {
    return (
      <div className="grid min-h-dvh place-items-center text-center">
        <Link href="/" className="font-bold text-teamA hover:underline">
          Bosh sahifa →
        </Link>
      </div>
    );
  }

  const selectCls = "h-11 max-w-full rounded-xl border-2 border-paper-line bg-white px-3 font-bold text-ink";

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/dashboard" className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" /> Panel
        </Link>

        <h1 className="text-3xl font-extrabold text-ink">O'quvchilar ishlari</h1>
        <p className="mt-1 text-ink-mute">Ishni ko'ring, baho bosing — o'quvchi darhol ko'radi.</p>

        {/* Bo'limlar */}
        <div className="mt-5 flex rounded-xl border-2 border-paper-line bg-white p-1 text-sm font-extrabold">
          {(
            [
              ["ungraded", "Baholanmaganlar"],
              ["graded", "Baholanganlar"],
              [null, "Hammasi"],
            ] as [WorkStatus, string][]
          ).map(([v, label]) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => setStatus(v)}
              className={cn(
                "flex-1 rounded-lg px-2 py-2",
                status === v ? "bg-ink text-white" : "text-ink-soft hover:bg-paper",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filtrlar */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className={selectCls}>
            <option value="">Barcha sinflar</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={assignmentId}
            onChange={(e) => setAssignmentId(e.target.value)}
            className={cn(selectCls, "min-w-0 flex-1 sm:max-w-xs")}
          >
            <option value="">Barcha ishlar</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                📌 {t.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void load()}
            title="Yangilash"
            className="grid h-11 w-11 place-items-center rounded-xl border-2 border-paper-line bg-white text-ink-soft hover:bg-paper"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          {works ? <span className="text-sm font-bold text-ink-mute">{works.length} ta ish</span> : null}
        </div>

        {flash ? (
          <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">{flash}</p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">{error}</p>
        ) : null}

        <ul className="mt-5 space-y-3">
          {works === null ? <li className="py-8 text-center text-ink-mute">Yuklanmoqda…</li> : null}
          {works?.length === 0 ? (
            <li className="surface p-8 text-center">
              <div className="text-4xl">{status === "ungraded" ? "✅" : "📂"}</div>
              <p className="mt-2 font-bold text-ink">
                {status === "ungraded"
                  ? "Baholanmagan ish yo'q"
                  : status === "graded"
                    ? "Hali baholangan ish yo'q"
                    : "Hali hech kim ish yuklamagan"}
              </p>
              <p className="mt-1 text-sm text-ink-mute">
                O'quvchilar kabinetida «Mening ishlarim» bo'limidan yoki uy vazifasidan yuklashadi.
              </p>
            </li>
          ) : null}
          {works?.map((w) => (
            <WorkItem key={w.id} work={w} onGraded={onGraded} onDeleted={onDeleted} onReset={onReset} />
          ))}
        </ul>
      </main>
    </div>
  );
}

const WorkItem = memo(function WorkItem({
  work,
  onGraded,
  onDeleted,
  onReset,
}: {
  work: Work;
  onGraded: (id: string, grade: number | null, comment: string) => void;
  onDeleted: (id: string) => void;
  onReset: (studentId: string, name: string) => void;
}) {
  const [comment, setComment] = useState(work.gradeComment ?? "");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const name = work.studentName || "O'quvchi";

  const give = async (grade: number | null) => {
    setBusy(true);
    setNote("");
    const res = await gradeWork(work.id, grade, grade == null ? "" : comment);
    setBusy(false);
    if (!res.ok) {
      setNote(res.error ?? "Saqlab bo'lmadi");
      return;
    }
    if (grade == null) setComment("");
    onGraded(work.id, grade, grade == null ? "" : comment);
  };

  const remove = async () => {
    if (!window.confirm(`${name} — «${work.title}» butunlay o'chirilsinmi?\nQaytarib bo'lmaydi.`)) return;
    setBusy(true);
    const res = await deleteWork(work.id);
    setBusy(false);
    if (!res.ok) setNote(res.error ?? "O'chirib bo'lmadi");
    else onDeleted(work.id);
  };

  const reset = async () => {
    if (!window.confirm(`${name}ga yana 3 tadan o'chirish va qayta yuklash imkoniyati berilsinmi?`)) return;
    setBusy(true);
    const ok = await resetWorkLimits(work.studentId);
    setBusy(false);
    if (ok) onReset(work.studentId, name);
    else setNote("Tiklab bo'lmadi");
  };

  return (
    <li className="surface p-4 [content-visibility:auto] [contain-intrinsic-size:auto_240px]">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper font-extrabold text-ink">
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink-soft">
            {name} · <span className="text-ink-mute">{work.className}</span>
          </p>
          {work.assignmentTitle ? (
            <span className="mt-0.5 inline-flex max-w-full items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-extrabold text-sky-900">
              <Pin className="h-3 w-3 shrink-0" />
              <span className="truncate">{work.assignmentTitle}</span>
            </span>
          ) : null}
          <h3 className="break-words text-lg font-extrabold text-ink">{work.title}</h3>
          <p className="flex flex-wrap gap-x-2 text-xs text-ink-mute">
            <span>{uzDateTime(work.createdAt)}</span>
            {isLate(work) ? <span className="font-bold text-rose-600">· muddatdan keyin</span> : null}
            {work.editCount > 0 ? (
              <span>
                · qayta yuklangan {work.editCount}/{EDIT_LIMIT}
              </span>
            ) : null}
          </p>
        </div>
        <GradeBadge grade={work.grade} />
      </div>

      {work.body ? <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink-soft">{work.body}</p> : null}
      <WorkFiles files={work.files} link={work.link} />

      <div className="mt-4 grid gap-2 rounded-xl bg-paper p-3">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          placeholder="Izoh (ixtiyoriy): nima yaxshi, nimani tuzatish kerak…"
          className="h-10 w-full rounded-lg border-2 border-paper-line bg-white px-3 text-sm text-ink outline-none focus:border-teamA"
        />
        <div className="flex flex-wrap items-center gap-2">
          {[5, 4, 3, 2].map((g) => (
            <button
              key={g}
              type="button"
              disabled={busy}
              onClick={() => void give(g)}
              className={cn(
                "h-11 w-12 rounded-xl font-mono text-xl font-bold transition disabled:opacity-50",
                work.grade === g ? GRADE_ON[g] : "border-2 border-paper-line bg-white text-ink hover:border-ink",
              )}
            >
              {g}
            </button>
          ))}
          <div className="ml-auto flex flex-wrap items-center gap-1">
            {work.grade != null ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void give(null)}
                className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-ink-mute hover:bg-white hover:text-ink"
              >
                Bahoni olib tashlash
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => void reset()}
              title="O'quvchiga yana 3 tadan o'chirish va qayta yuklash imkoniyati"
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-bold text-ink-mute hover:bg-white hover:text-ink"
            >
              <Unlock className="h-4 w-4" /> Limitni tiklash
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void remove()}
              title="Ishni o'chirish"
              className="grid h-9 w-9 place-items-center rounded-lg text-ink-mute hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        {note ? <p className="text-sm font-bold text-rose-700">{note}</p> : null}
      </div>
    </li>
  );
});
