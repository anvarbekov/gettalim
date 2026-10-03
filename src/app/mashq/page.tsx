"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, GraduationCap, Target } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { PRACTICES } from "@/lib/practice/registry";
import { cn } from "@/lib/utils";

/**
 * Mashqlar bo'limi.
 *
 * O'yinlardan farqi: bu yerda bola **yangi narsa o'rganadi**, faqat
 * bilganini tekshirmaydi. Har biri 10–15 daqiqalik bo'lak, shuning uchun
 * darsning istalgan joyiga tushadi.
 */
export default function MashqPage() {
  /** Rekordlar brauzerda saqlanadi — serverga bog'liq emas, internetsiz ham ishlaydi. */
  const [records, setRecords] = useState<Record<string, number>>({});

  useEffect(() => {
    const out: Record<string, number> = {};
    PRACTICES.forEach((item) => {
      if (!item.recordKey) return;
      try {
        const n = Number(localStorage.getItem(item.recordKey));
        if (Number.isFinite(n) && n > 0) out[item.id] = n;
      } catch {
        /* xotira yopiq — e'tiborsiz */
      }
    });
    setRecords(out);
  }, []);

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/" className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" /> Bosh sahifa
        </Link>

        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Mashqlar</h1>
        <p className="mt-1 max-w-2xl text-pretty text-ink-mute">
          Test emas — mashq. Bu yerda o'quvchi yangi narsa o'rganadi va ko'nikma hosil qiladi.
          Har biri 10–15 daqiqaga mo'ljallangan, ya'ni darsning istalgan qismiga sig'adi.
        </p>

        <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PRACTICES.map((item) => {
            const ready = item.status === "ready";

            const inner = (
              <>
                <div
                  className="relative flex h-28 items-center justify-center overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${item.rang}1f, ${item.rang}06)` }}
                >
                  <span className="text-6xl opacity-90">{item.ikonka}</span>

                  <span
                    className="absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white"
                    style={{ background: item.rang }}
                  >
                    <GraduationCap className="h-3 w-3" /> {item.grades}
                  </span>

                  {!ready ? (
                    <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
                      Tez orada
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-lg font-extrabold text-ink">{item.nomi}</h2>
                  <p className="mt-0.5 text-sm font-bold" style={{ color: item.rang }}>
                    {item.shior}
                  </p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{item.tavsif}</p>

                  <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-bold text-ink-mute">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> {item.minutes} daqiqa
                    </span>
                    {records[item.id] ? (
                      <span
                        className="flex items-center gap-1 rounded-full px-2 py-0.5 font-extrabold text-white"
                        style={{ background: item.rang }}
                      >
                        <Target className="h-3 w-3" /> Rekord {records[item.id]}%
                      </span>
                    ) : null}
                  </span>

                  {ready ? (
                    <span className="mt-3 flex items-center gap-1.5 text-sm font-extrabold text-ink">
                      Boshlash
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  ) : null}
                </div>
              </>
            );

            const shell =
              "group flex h-full flex-col overflow-hidden rounded-xl2 border border-paper-line bg-white shadow-card transition";

            return ready ? (
              <Link key={item.id} href={`/mashq/${item.slug}`} className={cn(shell, "hover:shadow-lift")}>
                {inner}
              </Link>
            ) : (
              <div key={item.id} className={cn(shell, "opacity-70")}>
                {inner}
              </div>
            );
          })}
        </div>

        <p className="mt-8 rounded-xl2 border-2 border-paper-line bg-paper/50 px-5 py-4 text-sm leading-relaxed text-ink-soft">
          <b className="text-ink">Darsda qanday ishlatiladi.</b> 90 daqiqalik darsni bo'laklarga bo'ling:
          5 daqiqa qizdirish (o'yin), 20 daqiqa yangi mavzu (siz tushuntirasiz), 15 daqiqa mashq
          (bola o'zi bajaradi), 5 daqiqa test. Mashqlar aynan uchinchi bo'lak uchun.
        </p>
      </main>
    </div>
  );
}
