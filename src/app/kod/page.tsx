"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, KeyRound, Search, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { Button } from "@/components/ui/button";
import { Card, CardBody, Field, Input } from "@/components/ui/card";
import {
  publicCredentials,
  publicRoster,
  rosterStatus,
  type PublicCredentials,
  type RosterStudent,
} from "@/lib/roster/api";
import { cn } from "@/lib/utils";

/**
 * "Ma'lumotimni bilmayman" sahifasi.
 *
 * Hisobsiz ham ochiladi: o'quvchi sinf kodini kiritadi, ro'yxatdan o'z ismini
 * topadi va PIN kodini ko'radi. Ro'yxat faqat o'qituvchi ochgan vaqt oralig'ida
 * ishlaydi — vaqt tugagach sahifa hech narsa ko'rsatmaydi.
 */
function KodInner() {
  const { cloud } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const [code, setCode] = useState((params.get("kod") ?? "").toUpperCase());
  const [status, setStatus] = useState<{ className: string; openUntil: Date } | null>(null);
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<PublicCredentials | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(0);

  /* Qolgan vaqt */
  useEffect(() => {
    if (!status) return;
    const tick = () => {
      const seconds = Math.max(0, Math.round((status.openUntil.getTime() - Date.now()) / 1000));
      setLeft(seconds);
      if (seconds === 0) {
        setStatus(null);
        setStudents([]);
        setPicked(null);
        setError("Ro'yxat yopildi. O'qituvchingizdan qaytadan ochishni so'rang.");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status]);

  const search = useCallback(async () => {
    const trimmed = code.trim();
    if (trimmed.length < 4) {
      setError("Sinf kodini to'liq kiriting.");
      return;
    }
    setBusy(true);
    setError(null);
    setPicked(null);

    const open = await rosterStatus(trimmed);
    if (!open) {
      setBusy(false);
      setStatus(null);
      setStudents([]);
      setError(
        "Bu kod bo'yicha ro'yxat ochiq emas. O'qituvchingiz «Ro'yxatni ochish» tugmasini bosishi kerak.",
      );
      return;
    }

    const list = await publicRoster(trimmed);
    setBusy(false);
    setStatus(open);
    setStudents(list);
    if (list.length === 0) setError("Bu sinfda hali o'quvchi yo'q.");
  }, [code]);

  /* Havola bilan kelgan bo'lsa — o'zi izlaydi */
  useEffect(() => {
    if (params.get("kod")) void search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.fullName.toLowerCase().includes(q));
  }, [students, query]);

  const reveal = async (student: RosterStudent) => {
    setBusy(true);
    const creds = await publicCredentials(code, student.studentId);
    setBusy(false);
    if (!creds) {
      setError("Ma'lumot olinmadi — ro'yxat yopilgan bo'lishi mumkin.");
      return;
    }
    setPicked(creds);
  };

  if (!cloud) return <CloudDisabled title="Bu bo'lim uchun bulut sozlanmagan" />;

  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mark.png" alt="Gettalim" className="mx-auto h-14 w-14 rounded-full" />
          <h1 className="mt-3 text-2xl font-extrabold text-ink">Kirish ma'lumotim</h1>
          <p className="mt-1 text-sm text-ink-mute">
            Sinf kodini kiriting va ro'yxatdan o'z ismingizni toping.
          </p>
        </div>

        {/* ---- Tanlangan o'quvchi ---- */}
        {picked ? (
          <Card>
            <CardBody>
              <p className="text-center text-2xl font-extrabold text-ink">{picked.fullName}</p>
              <p className="mt-0.5 text-center text-sm text-ink-mute">{picked.className}</p>

              <div className="mt-5 grid gap-3">
                <span className="rounded-xl2 bg-paper px-4 py-3 text-center">
                  <span className="block text-[11px] font-extrabold uppercase tracking-wider text-ink-mute">
                    Sinf kodi
                  </span>
                  <span className="mt-0.5 block font-mono text-3xl font-bold tracking-[0.25em] text-ink">
                    {picked.joinCode}
                  </span>
                </span>

                <span className="rounded-xl2 bg-paper px-4 py-3 text-center">
                  <span className="block text-[11px] font-extrabold uppercase tracking-wider text-ink-mute">
                    PIN kodingiz
                  </span>
                  <span className="mt-0.5 block font-mono text-3xl font-bold tracking-[0.35em] text-ink">
                    {picked.pin ?? "—"}
                  </span>
                </span>
              </div>

              <p className="mt-4 text-center text-xs leading-relaxed text-ink-mute">
                Yozib oling — bu sahifa bir necha daqiqadan keyin yopiladi. PIN shaxsiy,
                boshqalarga aytmang.
              </p>

              <Button
                variant="dark"
                size="lg"
                className="mt-4 w-full"
                onClick={() =>
                  router.push(
                    `/kirish?rol=oquvchi&kod=${encodeURIComponent(picked.joinCode)}&ism=${encodeURIComponent(
                      picked.fullName,
                    )}`,
                  )
                }
              >
                Tizimga kirish <ArrowRight className="h-5 w-5" />
              </Button>

              <button
                type="button"
                onClick={() => setPicked(null)}
                className="mt-2 w-full rounded-xl2 border-2 border-paper-line py-2.5 text-sm font-extrabold text-ink hover:bg-paper"
              >
                Ro'yxatga qaytish
              </button>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="grid gap-4">
              <Field label="Sinf kodi" hint="O'qituvchingiz ekranda ko'rsatadi">
                <Input
                  value={code}
                  maxLength={8}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && void search()}
                  placeholder="ABC123"
                  className="text-center font-mono text-2xl uppercase tracking-[0.3em]"
                />
              </Field>

              {!status ? (
                <Button variant="dark" size="lg" onClick={search} disabled={busy || code.trim().length < 4}>
                  <Search className="h-5 w-5" /> {busy ? "Izlanmoqda…" : "Ro'yxatni ochish"}
                </Button>
              ) : null}

              {error ? (
                <p className="rounded-xl border-2 border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
                  {error}
                </p>
              ) : null}

              {/* ---- Ro'yxat ---- */}
              {status && students.length > 0 ? (
                <>
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-paper px-3 py-2">
                    <span className="text-sm font-extrabold text-ink">{status.className}</span>
                    <span
                      className={cn(
                        "flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums",
                        left <= 60 ? "text-teamB" : "text-ink-soft",
                      )}
                    >
                      <Clock className="h-3.5 w-3.5" /> {clock}
                    </span>
                  </div>

                  <Field label="Ismingizni toping">
                    <span className="relative block">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Alisher"
                        className="pl-9"
                      />
                    </span>
                  </Field>

                  <div className="max-h-72 space-y-1.5 overflow-auto scroll-slim">
                    {filtered.map((student) => (
                      <button
                        key={student.studentId}
                        type="button"
                        disabled={busy}
                        onClick={() => void reveal(student)}
                        className="flex w-full items-center gap-3 rounded-xl border-2 border-paper-line bg-white px-3 py-2.5 text-left font-bold text-ink transition hover:bg-paper disabled:opacity-50"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-paper text-ink-mute">
                          <UserRound className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1 truncate">{student.fullName}</span>
                        <KeyRound className="h-4 w-4 shrink-0 text-ink-mute" />
                      </button>
                    ))}
                    {filtered.length === 0 ? (
                      <p className="py-6 text-center text-sm text-ink-mute">Bunday ism topilmadi.</p>
                    ) : null}
                  </div>
                </>
              ) : null}
            </CardBody>
          </Card>
        )}

        <Link
          href="/kirish"
          className="link-quiet mt-4 flex items-center justify-center gap-1.5 text-sm font-bold"
        >
          <ArrowLeft className="h-4 w-4" /> Kirish sahifasi
        </Link>
      </div>
    </div>
  );
}

export default function KodPage() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center text-ink-mute">…</div>}>
      <KodInner />
    </Suspense>
  );
}
