"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, RefreshCw, TriangleAlert } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { SiteHeader } from "@/components/SiteHeader";
import { fetchMistakes, type Mistake } from "@/lib/gamification/shop";
import { cn } from "@/lib/utils";

/**
 * «Mening xatolarim».
 *
 * Bola hali to'g'ri javob bermagan savollar to'planib boradi. Savolga
 * keyinchalik to'g'ri javob berilsa, u ro'yxatdan chiqadi — ro'yxatning
 * qisqarishi o'sishni ko'rsatadi.
 */
export default function MistakesPage() {
  const { cloud, loading, user } = useAuth();
  const [items, setItems] = useState<Mistake[]>([]);
  const [busy, setBusy] = useState(true);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const load = () => {
    setBusy(true);
    void fetchMistakes().then((rows) => {
      setItems(rows);
      setBusy(false);
    });
  };

  useEffect(() => {
    if (cloud && user) load();
    else setBusy(false);
  }, [cloud, user]);

  if (!cloud) return <CloudDisabled title="Bu bo'lim uchun bulut sozlanmagan" />;
  if (loading) return <div className="grid min-h-dvh place-items-center text-ink-mute">Yuklanmoqda…</div>;

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/talaba" className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" /> Kabinet
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Mening xatolarim</h1>
            <p className="mt-1 text-ink-mute">
              Hali to'g'ri javob bermagan savollaringiz. To'g'ri javob bersangiz, ro'yxatdan chiqadi.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3.5 py-2 text-sm font-extrabold text-ink hover:bg-paper"
          >
            <RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} /> Yangilash
          </button>
        </div>

        {busy ? (
          <p className="surface mt-6 p-10 text-center text-ink-mute">Yuklanmoqda…</p>
        ) : items.length === 0 ? (
          <div className="surface mt-6 p-10 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <p className="mt-3 text-lg font-extrabold text-ink">Xatolar yo'q</p>
            <p className="mt-1 text-ink-mute">
              Ajoyib! Yoki siz hali musobaqada qatnashmagansiz — o'ynab ko'ring, xato qilsangiz
              shu yerda to'planadi va ustida ishlaysiz.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-5 flex items-center gap-2 rounded-xl2 border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              {items.length} ta savol ustida ishlash kerak. Avval o'zingiz o'ylang, keyin javobni oching.
            </p>

            <div className="mt-4 space-y-3">
              {items.map((item, i) => {
                const open = revealed.has(item.question);
                return (
                  <div key={item.question + i} className="surface p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rose-50 font-mono text-sm font-bold text-rose-600">
                        {item.timesWrong}
                      </span>
                      <p className="min-w-0 flex-1 text-balance font-extrabold leading-snug text-ink">
                        {item.question}
                      </p>
                    </div>

                    {open ? (
                      <div className="animate-pop-in mt-3 grid gap-2 sm:grid-cols-2">
                        <span className="rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 py-2">
                          <span className="block text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                            To'g'ri javob
                          </span>
                          <span className="mt-0.5 block font-bold text-emerald-900">
                            {item.correctAnswer || "—"}
                          </span>
                        </span>
                        <span className="rounded-xl border-2 border-paper-line bg-paper/60 px-3 py-2">
                          <span className="block text-[11px] font-extrabold uppercase tracking-wider text-ink-mute">
                            Siz yozgan
                          </span>
                          <span className="mt-0.5 block font-bold text-ink-soft">
                            {item.lastAnswer || "—"}
                          </span>
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRevealed((prev) => new Set(prev).add(item.question))}
                        className="mt-3 rounded-xl border-2 border-paper-line bg-white px-4 py-2 text-sm font-extrabold text-ink hover:bg-paper"
                      >
                        Javobni ko'rsatish
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
