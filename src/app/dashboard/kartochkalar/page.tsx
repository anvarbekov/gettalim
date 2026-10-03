"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Maximize2, Printer, Search } from "lucide-react";
import { BroadcastCredentials } from "@/components/dashboard/BroadcastCredentials";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { useAuth } from "@/components/auth/AuthProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { Input, Select } from "@/components/ui/card";
import { listClasses, listStudents, type StudentRow } from "@/lib/classes";
import type { ClassRow } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

/**
 * Kirish kartochkalari.
 *
 * O'qituvchi bir marta bosadi — butun sinf proyektorda o'z sinf kodi,
 * ismi va PIN kodini ko'radi. Shu sahifani chop etib, qirqib tarqatsa
 * ham bo'ladi: chop etishda faqat kartochkalar chiqadi.
 */
function CardsInner() {
  const { cloud, loading, role } = useAuth();
  const params = useSearchParams();

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classId, setClassId] = useState(params.get("sinf") ?? "");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [query, setQuery] = useState("");
  const [showPins, setShowPins] = useState(true);
  const [big, setBig] = useState(false);

  useEffect(() => {
    if (!cloud || role !== "teacher") return;
    void listClasses().then((list) => {
      setClasses(list);
      setClassId((prev) => prev || list[0]?.id || "");
    });
  }, [cloud, role]);

  const reload = useCallback(async () => {
    if (!classId) return;
    setStudents(await listStudents(classId));
  }, [classId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const klass = useMemo(() => classes.find((c) => c.id === classId), [classes, classId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.full_name.toLowerCase().includes(q));
  }, [students, query]);

  if (!cloud) return <CloudDisabled title="Kartochkalar uchun bulut sozlanmagan" />;
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
      <div className="print:hidden">
        <SiteHeader />
      </div>

      <main className="mx-auto max-w-[1600px] px-4 py-6 print:max-w-none print:px-0 print:py-0">
        {/* ---- Boshqaruv (chop etishda ko'rinmaydi) ---- */}
        <div className="print:hidden">
          <Link
            href="/dashboard/classes"
            className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold"
          >
            <ArrowLeft className="h-4 w-4" /> Sinflar
          </Link>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Kirish kartochkalari</h1>
              <p className="mt-1 text-ink-mute">
                &laquo;Hammaga ko'rsatish&raquo; — tizimda turgan har bir o'quvchi o'z qurilmasida
              sinf kodi, ismi va PIN kodini ko'radi. Ekranni proyektorga chiqarish yoki chop
              etib tarqatish ham mumkin.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {klass ? (
                <BroadcastCredentials
                  classId={klass.id}
                  joinCode={klass.join_code}
                  openUntil={klass.roster_open_until}
                />
              ) : null}
              <button
                type="button"
                onClick={() => setShowPins((v) => !v)}
                className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3.5 py-2 text-sm font-extrabold text-ink hover:bg-paper"
              >
                {showPins ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPins ? "PIN'ni yashirish" : "PIN'ni ko'rsatish"}
              </button>
              <button
                type="button"
                onClick={() => setBig((v) => !v)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-sm font-extrabold transition",
                  big ? "border-ink bg-ink text-white" : "border-paper-line bg-white text-ink hover:bg-paper",
                )}
              >
                <Maximize2 className="h-4 w-4" /> Yirik ko'rinish
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-xl bg-ink px-3.5 py-2 text-sm font-extrabold text-white hover:bg-ink-soft"
              >
                <Printer className="h-4 w-4" /> Chop etish
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="min-w-[200px] flex-1">
              <span className="eyebrow mb-1.5 block">Sinf</span>
              <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
                {classes.length === 0 ? <option value="">Sinf yo'q</option> : null}
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="min-w-[200px] flex-1">
              <span className="eyebrow mb-1.5 block">Ism bo'yicha topish</span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Alisher"
                  className="pl-9"
                />
              </span>
            </label>
          </div>

          {klass ? (
            <div className="mt-5 flex flex-wrap items-center gap-4 rounded-xl2 border-2 border-ink bg-ink px-5 py-4 text-white">
              <span>
                <span className="block text-xs font-extrabold uppercase tracking-wider text-white/60">
                  Sinf kodi — hammaga bir xil
                </span>
                <span className="block font-mono text-4xl font-bold tracking-[0.2em]">{klass.join_code}</span>
              </span>
              <span className="ml-auto text-sm font-bold text-white/70">
                {klass.name} · {filtered.length} o'quvchi
              </span>
            </div>
          ) : null}
        </div>

        {/* ---- Chop etish sarlavhasi ---- */}
        {klass ? (
          <div className="hidden print:mb-4 print:block">
            <h1 className="text-xl font-extrabold text-ink">
              {klass.name} — kirish ma'lumotlari
            </h1>
            <p className="text-sm text-ink-soft">
              Sinf kodi: <b className="font-mono tracking-widest">{klass.join_code}</b> · Manzil:
              gettalim /kirish
            </p>
          </div>
        ) : null}

        {/* ---- Kartochkalar ---- */}
        {filtered.length === 0 ? (
          <p className="surface mt-6 p-10 text-center text-ink-mute print:hidden">
            {students.length === 0
              ? "Bu sinfda hali o'quvchi yo'q."
              : "Bunday ism topilmadi."}
          </p>
        ) : (
          <div
            className={cn(
              "mt-5 grid gap-3 print:mt-0 print:grid-cols-2 print:gap-2",
              big ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
            )}
          >
            {filtered.map((student) => (
              <div
                key={student.id}
                className={cn(
                  "relative overflow-hidden rounded-xl2 border-2 border-paper-line bg-white shadow-card",
                  "print:break-inside-avoid print:border print:border-dashed print:shadow-none",
                  big ? "p-6" : "p-4",
                )}
              >
                <span
                  className="absolute inset-x-0 top-0 h-1.5"
                  style={{ background: "linear-gradient(90deg,#1f6fd0,#7a3fd0)" }}
                  aria-hidden
                />

                <p
                  className={cn(
                    "truncate font-extrabold text-ink",
                    big ? "text-2xl" : "text-base",
                  )}
                  title={student.full_name}
                >
                  {student.full_name}
                </p>

                <div className={cn("mt-2 grid gap-2", big ? "grid-cols-2" : "grid-cols-2")}>
                  <span className="rounded-lg bg-paper px-2.5 py-1.5">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-ink-mute">
                      Sinf kodi
                    </span>
                    <span
                      className={cn(
                        "block font-mono font-bold tracking-widest text-ink",
                        big ? "text-xl" : "text-sm",
                      )}
                    >
                      {klass?.join_code ?? "—"}
                    </span>
                  </span>

                  <span className="rounded-lg bg-paper px-2.5 py-1.5">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-ink-mute">
                      PIN
                    </span>
                    <span
                      className={cn(
                        "block font-mono font-bold tracking-[0.3em] text-ink",
                        big ? "text-xl" : "text-sm",
                      )}
                    >
                      {showPins ? (student.pin ?? "—") : "••••"}
                    </span>
                  </span>
                </div>

                {big ? (
                  <p className="mt-3 text-xs leading-relaxed text-ink-mute">
                    Kirish: <b className="text-ink-soft">/kirish</b> → &laquo;O'quvchi&raquo; →
                    sinf kodi, ism-familiya va PIN.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {/* ---- Chop etish izohi ---- */}
        <p className="hidden pt-3 text-[10px] text-ink-mute print:block">
          Kartochkani qirqib, o'quvchiga bering. PIN shaxsiy — boshqalarga ko'rsatmasin.
        </p>
      </main>
    </div>
  );
}

export default function CardsPage() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center text-ink-mute">…</div>}>
      <CardsInner />
    </Suspense>
  );
}
