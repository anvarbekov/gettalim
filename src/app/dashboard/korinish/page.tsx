"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Eye, EyeOff, Save } from "lucide-react";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { useAuth } from "@/components/auth/AuthProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { Select } from "@/components/ui/card";
import { listClasses } from "@/lib/classes";
import { setVisiblePacks } from "@/lib/packs/visibility";
import { getAllPacks } from "@/lib/storage";
import { getBrowserClient } from "@/lib/supabase/client";
import type { ClassRow } from "@/lib/supabase/types";
import type { Pack } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * "O'quvchilar nimani ko'radi" sahifasi.
 *
 * O'qituvchi har bir sinf uchun ruxsat etilgan paketlarni belgilaydi.
 * Cheklov faqat o'quvchiga tegishli — o'qituvchi hamma paketni ko'raveradi.
 */
export default function VisibilityPage() {
  const { cloud, loading, role } = useAuth();

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classId, setClassId] = useState("");
  const [packs, setPacks] = useState<Pack[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [unlimited, setUnlimited] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!cloud || role !== "teacher") return;
    setPacks(getAllPacks());
    void listClasses().then((list) => {
      setClasses(list);
      setClassId((prev) => prev || list[0]?.id || "");
    });
  }, [cloud, role]);

  /** Tanlangan sinfning joriy ro'yxatini o'qiymiz. */
  const load = useCallback(async (id: string) => {
    const supabase = getBrowserClient();
    if (!supabase || !id) return;
    const { data } = await supabase.from("classes").select("visible_packs").eq("id", id).maybeSingle();
    const row = data as { visible_packs: string[] | null } | null;
    if (!row || row.visible_packs === null) {
      setUnlimited(true);
      setSelected(new Set());
      return;
    }
    setUnlimited(false);
    setSelected(new Set(row.visible_packs));
  }, []);

  useEffect(() => {
    void load(classId);
  }, [classId, load]);

  const bySubject = useMemo(() => {
    const map = new Map<string, Pack[]>();
    packs.forEach((pack) => {
      const list = map.get(pack.subject) ?? [];
      list.push(pack);
      map.set(pack.subject, list);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [packs]);

  const toggle = (id: string) => {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSubject = (subject: string, on: boolean) => {
    setSaved(false);
    const ids = packs.filter((p) => p.subject === subject).map((p) => p.id);
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });
  };

  const save = async () => {
    if (!classId) return;
    setBusy(true);
    const ok = await setVisiblePacks(classId, unlimited ? null : [...selected]);
    setBusy(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  if (!cloud) return <CloudDisabled title="Bu bo'lim uchun bulut sozlanmagan" />;
  if (loading) return <div className="grid min-h-dvh place-items-center text-ink-mute">Yuklanmoqda…</div>;
  if (role !== "teacher") {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-2xl font-extrabold text-ink">Bu bo'lim o'qituvchilar uchun</h1>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/dashboard" className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" /> Panel
        </Link>

        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">O'quvchilar nimani ko'radi</h1>
        <p className="mt-1 max-w-2xl text-pretty text-ink-mute">
          Belgilangan paketlargina o'quvchilarga ko'rinadi. O'zingiz hamma paketni ko'raverasiz —
          cheklov faqat o'quvchi hisobiga tegishli.
        </p>

        {/* Sinf */}
        <div className="mt-5 max-w-xs">
          <span className="eyebrow mb-1.5 block">Sinf</span>
          <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.length === 0 ? <option value="">Sinf yo'q</option> : null}
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Rejim */}
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setUnlimited(true);
              setSaved(false);
            }}
            className={cn(
              "flex items-start gap-3 rounded-xl2 border-2 p-4 text-left transition",
              unlimited ? "border-ink bg-ink text-white" : "border-paper-line bg-white hover:bg-paper",
            )}
          >
            <Eye className="mt-0.5 h-5 w-5 shrink-0" />
            <span>
              <span className="block font-extrabold">Hammasi ochiq</span>
              <span className={cn("mt-0.5 block text-xs", unlimited ? "text-white/70" : "text-ink-mute")}>
                O'quvchi barcha paketlarni ko'radi
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setUnlimited(false);
              setSaved(false);
            }}
            className={cn(
              "flex items-start gap-3 rounded-xl2 border-2 p-4 text-left transition",
              !unlimited ? "border-ink bg-ink text-white" : "border-paper-line bg-white hover:bg-paper",
            )}
          >
            <EyeOff className="mt-0.5 h-5 w-5 shrink-0" />
            <span>
              <span className="block font-extrabold">Faqat tanlanganlar</span>
              <span className={cn("mt-0.5 block text-xs", !unlimited ? "text-white/70" : "text-ink-mute")}>
                Quyida belgilanganlar ko'rinadi, qolgani yashiriladi
              </span>
            </span>
          </button>
        </div>

        {/* Paketlar */}
        <div className={cn("mt-5 space-y-4", unlimited && "pointer-events-none opacity-40")}>
          {bySubject.map(([subject, list]) => {
            const allOn = list.every((p) => selected.has(p.id));
            return (
              <section key={subject} className="surface p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="font-extrabold text-ink">{subject}</h2>
                  <button
                    type="button"
                    onClick={() => toggleSubject(subject, !allOn)}
                    className="rounded-lg border-2 border-paper-line bg-white px-3 py-1.5 text-xs font-extrabold text-ink-soft hover:bg-paper"
                  >
                    {allOn ? "Hammasini yopish" : "Hammasini ochish"}
                  </button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {list.map((pack) => {
                    const on = selected.has(pack.id);
                    return (
                      <button
                        key={pack.id}
                        type="button"
                        onClick={() => toggle(pack.id)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border-2 p-3 text-left transition",
                          on ? "border-emerald-400 bg-emerald-50" : "border-paper-line bg-white hover:bg-paper",
                        )}
                      >
                        <span
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg"
                          style={{ background: `${pack.color}1a` }}
                        >
                          {pack.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold text-ink">{pack.title}</span>
                          <span className="block text-xs text-ink-mute">
                            {pack.generator ? "cheksiz savol" : `${pack.questions.length} savol`}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition",
                            on ? "border-emerald-500 bg-emerald-500 text-white" : "border-paper-line",
                          )}
                        >
                          {on ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="sticky bottom-4 mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={busy || !classId}
            className="flex items-center gap-2 rounded-xl2 bg-ink px-6 py-3 text-sm font-extrabold text-white shadow-lift transition hover:bg-ink-soft disabled:opacity-40"
          >
            <Save className="h-4 w-4" /> {busy ? "Saqlanmoqda…" : "Saqlash"}
          </button>
          {saved ? (
            <span className="animate-pop-in rounded-xl bg-emerald-50 px-3.5 py-2 text-sm font-extrabold text-emerald-800">
              Saqlandi ✓
            </span>
          ) : null}
          {!unlimited ? (
            <span className="text-sm font-bold text-ink-mute">{selected.size} paket ochiq</span>
          ) : null}
        </div>
      </main>
    </div>
  );
}
