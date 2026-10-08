"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, Pin, Plus, RefreshCw, Trash2 } from "lucide-react";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { useAuth } from "@/components/auth/AuthProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardBody, Field, Input } from "@/components/ui/card";
import { AttachmentEditor } from "@/components/works/AttachmentEditor";
import { TaskCard, type TaskInfo } from "@/components/works/TaskCard";
import { GradeBadge, WorkFiles } from "@/components/works/WorkFiles";
import { getBrowserClient } from "@/lib/supabase/client";
import { GETMOTION_URL, uzDateTime } from "@/lib/links";
import {
  DELETE_LIMIT,
  EDIT_LIMIT,
  deleteWork,
  isLate,
  listMyWorks,
  saveWork,
  type Work,
  type WorkDraft,
} from "@/lib/works/api";
import { cn } from "@/lib/utils";

/**
 * O'quvchining ishlari: fayl, video, matn, havola yuklaydi — o'qituvchi
 * baho qo'yadi. `?topshiriq=<id>` bilan ochilsa — uy vazifasiga javob.
 *
 * Limitlar: jami 3 marta o'chirish, har bir ishni 3 marta qayta yuklash.
 */

const EMPTY: WorkDraft = { title: "", body: "", link: "", files: [] };

type Tab = "all" | "ungraded" | "graded";

export default function IshlarimPage() {
  const { cloud, loading, user, role } = useAuth();
  const [works, setWorks] = useState<Work[] | null>(null);
  const [deletesUsed, setDeletesUsed] = useState(0);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("all");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Work | null>(null);
  const [draft, setDraft] = useState<WorkDraft>(EMPTY);
  const [task, setTask] = useState<TaskInfo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [flash, setFlash] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    const res = await listMyWorks(user.id);
    setWorks(res.data);
    setDeletesUsed(res.deletesUsed);
    setError(res.error ?? "");
    return res.data;
  }, [user]);

  // `?topshiriq=…` — uy vazifasiga javob yuklash
  useEffect(() => {
    if (!user) return;
    void load().then(async (list) => {
      const id = new URLSearchParams(window.location.search).get("topshiriq");
      const supabase = getBrowserClient();
      if (!id || !supabase) return;
      const { data } = await supabase
        .from("assignments")
        .select("id, title, body, files, link, due_at")
        .eq("id", id)
        .maybeSingle();
      if (!data) return;
      const info = data as unknown as TaskInfo;
      setTask(info);
      const existing = list?.find((w) => w.assignmentId === id);
      if (existing) {
        if (existing.grade == null && existing.editCount < EDIT_LIMIT) startEdit(existing);
        else setFlash("Bu topshiriqqa ishingiz yuklangan — pastda ko'rinadi.");
      } else {
        setEditing(null);
        setDraft({ ...EMPTY, title: info.title });
        setOpen(true);
      }
    });
    // startEdit barqaror; faqat foydalanuvchi o'zgarganda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, load]);

  const startNew = () => {
    setEditing(null);
    setTask(null);
    setDraft(EMPTY);
    setNote("");
    setOpen(true);
  };

  function startEdit(w: Work) {
    setEditing(w);
    setDraft({ title: w.title, body: w.body ?? "", link: w.link ?? "", files: w.files });
    setNote("");
    setOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const close = () => {
    setOpen(false);
    setEditing(null);
    setTask(null);
    setNote("");
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
  };

  const submit = async () => {
    if (!user) return;
    if (!draft.title.trim()) {
      setNote("Ish nomini yozing.");
      return;
    }
    if (!draft.files.length && !draft.body.trim() && !draft.link.trim()) {
      setNote("Fayl, matn yoki havoladan kamida bittasini qo'shing.");
      return;
    }
    if (editing && !window.confirm(`Qayta yuklash: ${EDIT_LIMIT - editing.editCount - 1} ta imkoniyat qoladi. Davom etasizmi?`)) {
      return;
    }
    setSaving(true);
    const res = await saveWork(user.id, draft, {
      id: editing?.id,
      assignmentId: editing ? undefined : task?.id,
    });
    setSaving(false);
    if (!res.ok) {
      setNote(res.error ?? "Saqlab bo'lmadi");
      return;
    }
    setFlash(editing ? "Ish yangilandi." : "Ish yuborildi — o'qituvchi ko'rib baho qo'yadi.");
    close();
    setDraft(EMPTY);
    void load();
  };

  const remove = async (w: Work) => {
    const left = DELETE_LIMIT - deletesUsed;
    if (!window.confirm(`«${w.title}» o'chirilsinmi?\n\nO'chirish imkoniyati: ${left} tadan ${left - 1} tasi qoladi.`)) return;
    const res = await deleteWork(w.id);
    if (!res.ok) setError(res.error ?? "O'chirib bo'lmadi");
    else setFlash("Ish o'chirildi.");
    void load();
  };

  const counts = useMemo(() => {
    const list = works ?? [];
    const graded = list.filter((w) => w.grade != null);
    return {
      all: list.length,
      graded: graded.length,
      ungraded: list.length - graded.length,
      avg: graded.length ? graded.reduce((s, w) => s + (w.grade ?? 0), 0) / graded.length : null,
    };
  }, [works]);

  const shown = useMemo(
    () =>
      (works ?? []).filter((w) =>
        tab === "all" ? true : tab === "graded" ? w.grade != null : w.grade == null,
      ),
    [works, tab],
  );

  if (!cloud) return <CloudDisabled title="Bulut sozlanmagan" />;
  if (loading) return <div className="grid min-h-dvh place-items-center text-ink-mute">Yuklanmoqda…</div>;
  if (!user) {
    return (
      <div className="grid min-h-dvh place-items-center text-center">
        <Link href="/kirish" className="font-bold text-teamA hover:underline">
          Avval kiring →
        </Link>
      </div>
    );
  }

  const deletesLeft = Math.max(0, DELETE_LIMIT - deletesUsed);

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href={role === "student" ? "/talaba" : "/dashboard"}
          className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold"
        >
          <ArrowLeft className="h-4 w-4" /> Kabinet
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-ink">Mening ishlarim</h1>
            <p className="mt-1 text-ink-mute">Ishingizni yuklang — o'qituvchi ko'rib baho qo'yadi.</p>
          </div>
          {!open ? (
            <button
              type="button"
              onClick={startNew}
              className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 font-extrabold text-white hover:bg-ink-soft"
            >
              <Plus className="h-5 w-5" /> Yangi ish
            </button>
          ) : null}
        </div>

        {/* Statistika va limitlar */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Jami ish" value={counts.all} />
          <Stat label="Baholangan" value={counts.graded} />
          <Stat label="O'rtacha baho" value={counts.avg != null ? counts.avg.toFixed(1) : "—"} tone="emerald" />
          <Stat
            label="O'chirish imkoniyati"
            value={`${deletesLeft}/${DELETE_LIMIT}`}
            tone={deletesLeft === 0 ? "rose" : undefined}
          />
        </div>

        <a
          href={GETMOTION_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-center gap-3 rounded-xl2 bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 text-white shadow-card hover:opacity-95"
        >
          <span className="text-2xl" aria-hidden>
            🎬
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-extrabold">GetMotion — video va animatsiya</span>
            <span className="block text-xs text-white/85">
              U yerda ish qiling, havolasini nusxalab shu yerga «Havola» qatoriga qo'ying.
            </span>
          </span>
          <span className="shrink-0 rounded-lg bg-white/20 px-2.5 py-1 text-sm font-extrabold">Ochish ↗</span>
        </a>

        {flash ? (
          <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">{flash}</p>
        ) : null}

        {open ? (
          <Card className="mt-6">
            <CardBody className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold text-ink">
                  {editing ? "Qayta yuklash" : task ? "Topshiriqqa javob" : "Yangi ish"}
                </h2>
                {editing ? (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-900 ring-1 ring-amber-200">
                    Qayta yuklash: {EDIT_LIMIT - editing.editCount} ta qoldi
                  </span>
                ) : null}
              </div>

              {task ? <TaskCard task={task} /> : null}

              <Field label="Ish nomi">
                <Input
                  value={draft.title}
                  maxLength={160}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Masalan: Scratch — labirint o'yini"
                />
              </Field>

              <AttachmentEditor
                value={draft}
                onChange={(next) => setDraft((d) => ({ ...d, ...next }))}
                folder="ishlar"
                bodyPlaceholder="Ish haqida qisqacha yoki javobingiz matni…"
                onBusyChange={setUploading}
              />

              {note ? (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">{note}</p>
              ) : null}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={saving || uploading}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? "Saqlanmoqda…" : editing ? "Qayta yuklash" : "Yuborish"}
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-xl border-2 border-paper-line bg-white px-4 py-3 font-extrabold text-ink hover:bg-paper"
                >
                  Bekor
                </button>
              </div>
            </CardBody>
          </Card>
        ) : null}

        {error ? (
          <p className="mt-6 rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">{error}</p>
        ) : null}

        {/* Bo'limlar */}
        <div className="mt-6 flex rounded-xl border-2 border-paper-line bg-white p-1 text-sm font-extrabold">
          {(
            [
              ["all", "Hammasi", counts.all],
              ["ungraded", "Baholanmagan", counts.ungraded],
              ["graded", "Baholangan", counts.graded],
            ] as [Tab, string, number][]
          ).map(([id, label, n]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2",
                tab === id ? "bg-ink text-white" : "text-ink-soft hover:bg-paper",
              )}
            >
              {label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  tab === id ? "bg-white/20" : "bg-paper text-ink-mute",
                )}
              >
                {n}
              </span>
            </button>
          ))}
        </div>

        <ul className="mt-4 space-y-3">
          {works === null ? <li className="py-8 text-center text-ink-mute">Yuklanmoqda…</li> : null}
          {works && shown.length === 0 ? (
            <li className="surface p-8 text-center">
              <div className="text-4xl">{tab === "graded" ? "⏳" : "📂"}</div>
              <p className="mt-2 font-bold text-ink">
                {tab === "graded"
                  ? "Hali baholangan ish yo'q"
                  : tab === "ungraded"
                    ? "Baholanishni kutayotgan ish yo'q"
                    : "Hali ish yuklanmagan"}
              </p>
              {tab !== "graded" && !open ? (
                <button type="button" onClick={startNew} className="mt-3 font-extrabold text-teamA hover:underline">
                  Ish yuklash →
                </button>
              ) : null}
            </li>
          ) : null}
          {shown.map((w) => {
            const editsLeft = EDIT_LIMIT - w.editCount;
            return (
              <li key={w.id} className="surface p-4 [content-visibility:auto] [contain-intrinsic-size:auto_180px]">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    {w.assignmentTitle ? (
                      <span className="mb-1 inline-flex max-w-full items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-extrabold text-sky-900">
                        <Pin className="h-3 w-3 shrink-0" />
                        <span className="truncate">Uy vazifasi: {w.assignmentTitle}</span>
                      </span>
                    ) : null}
                    <h3 className="break-words text-lg font-extrabold text-ink">{w.title}</h3>
                    <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-mute">
                      <span>{uzDateTime(w.createdAt)}</span>
                      {isLate(w) ? <span className="font-bold text-rose-600">· muddatdan keyin</span> : null}
                      {w.editCount > 0 ? <span>· {w.editCount} marta qayta yuklangan</span> : null}
                    </p>
                  </div>
                  <GradeBadge grade={w.grade} />
                </div>
                {w.body ? (
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink-soft">{w.body}</p>
                ) : null}
                <WorkFiles files={w.files} link={w.link} />
                {w.gradeComment ? (
                  <p className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-950">
                    <b>O'qituvchi:</b> {w.gradeComment}
                  </p>
                ) : null}
                {w.grade == null ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(w)}
                      disabled={editsLeft <= 0}
                      title={editsLeft <= 0 ? "Imkoniyat tugadi — o'qituvchidan so'rang" : undefined}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold text-ink-soft hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <RefreshCw className="h-4 w-4" /> Qayta yuklash
                      <span className="text-xs font-normal text-ink-mute">({Math.max(0, editsLeft)} qoldi)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(w)}
                      disabled={deletesLeft <= 0}
                      title={deletesLeft <= 0 ? "Imkoniyat tugadi — o'qituvchidan so'rang" : undefined}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold text-ink-mute hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" /> O'chirish
                      <span className="text-xs font-normal">({deletesLeft} qoldi)</span>
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-mute">
                    <Lock className="h-3.5 w-3.5" /> Baholangan — o'zgartirib bo'lmaydi
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: "emerald" | "rose" }) {
  return (
    <div
      className={cn(
        "rounded-xl2 border-2 px-3 py-2.5",
        tone === "emerald"
          ? "border-emerald-100 bg-emerald-50"
          : tone === "rose"
            ? "border-rose-100 bg-rose-50"
            : "border-paper-line bg-white",
      )}
    >
      <span className="block font-mono text-xl font-bold tabular-nums text-ink">{value}</span>
      <span className="block text-[11px] font-extrabold uppercase tracking-wide text-ink-mute">{label}</span>
    </div>
  );
}
