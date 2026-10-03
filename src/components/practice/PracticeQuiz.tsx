"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, RotateCcw, Target, Trophy, X } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { sfx } from "@/lib/sound";
import type { PracticeItem } from "@/lib/practice/quiz/types";
import { cn, shuffle } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/** Bir seansdagi savollar soni. 10–15 daqiqalik bo'lakka mos. */
const ROUND = 12;

type Level = "all" | 1 | 2 | 3;

const LEVEL_LABEL: Record<string, string> = {
  all: "Aralash",
  "1": "Oson",
  "2": "O'rta",
  "3": "Qiyin",
};

/** Eng yaxshi natija brauzerda saqlanadi — bola o'z o'sishini ko'radi. */
function bestKey(packId?: string) {
  return `gettalim.mashq.${packId ?? "umumiy"}`;
}

function readBest(packId?: string): number {
  try {
    const raw = localStorage.getItem(bestKey(packId));
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeBest(packId: string | undefined, value: number) {
  try {
    localStorage.setItem(bestKey(packId), String(value));
  } catch {
    /* xotira yopiq — e'tiborsiz */
  }
}

/**
 * Mashq savollari uchun umumiy ekran.
 *
 * Testdan uch farqi bor:
 *   1. Javobdan keyin **tushuntirish** chiqadi — mashqning eng qimmatli qismi.
 *   2. Bir seansda 12 ta savol beriladi, bank esa kattaroq — har safar boshqacha.
 *   3. Yakunda faqat **xato qilingan** savollarni qaytadan ishlash mumkin.
 */
export function PracticeQuiz({
  title,
  emoji,
  color,
  intro,
  items,
  packId,
}: {
  title: string;
  emoji: string;
  color: string;
  intro: string;
  items: PracticeItem[];
  /** Shu mavzuning savol paketi — musobaqa uchun. */
  packId?: string;
}) {
  const [level, setLevel] = useState<Level>("all");
  const [order, setOrder] = useState<PracticeItem[]>([]);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [missed, setMissed] = useState<PracticeItem[]>([]);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [best, setBest] = useState(0);

  useEffect(() => setBest(readBest(packId)), [packId]);

  /** Yangi seans: berilgan ro'yxatdan (yoki butun bankdan) savollar tanlanadi. */
  const start = useCallback(
    (pool?: PracticeItem[]) => {
      const source =
        pool ?? (level === "all" ? items : items.filter((it) => (it.level ?? 1) === level));
      const picked = shuffle(source.length ? source : items).slice(0, pool ? pool.length : ROUND);
      // Oson savollardan boshlanadi — bola ishonch bilan kirishadi
      picked.sort((a, b) => (a.level ?? 1) - (b.level ?? 1));
      setOrder(picked);
      setIndex(0);
      setChosen(null);
      setMissed([]);
      setCorrect(0);
      setDone(false);
    },
    [items, level],
  );

  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, items]);

  const item = order[index];
  // Variantlar savol almashgandagina aralashadi — javob berilganda joyi o'zgarmaydi
  const options = useMemo(() => (item ? shuffle(item.options) : []), [item]);

  const answer = (option: string) => {
    if (chosen || !item) return;
    setChosen(option);
    if (option === item.answer) {
      setCorrect((n) => n + 1);
      sfx.correct();
    } else {
      setMissed((list) => (list.some((m) => m.id === item.id) ? list : [...list, item]));
      sfx.wrong();
    }
  };

  const next = () => {
    if (index + 1 >= order.length) {
      const score = order.length ? Math.round((correct / order.length) * 100) : 0;
      if (score > best) {
        setBest(score);
        writeBest(packId, score);
      }
      setDone(true);
      sfx.win();
      return;
    }
    setIndex((i) => i + 1);
    setChosen(null);
  };

  if (!item && !done) {
    return <div className="grid min-h-dvh place-items-center text-ink-mute">Tayyorlanmoqda…</div>;
  }

  const wrong = missed.length;
  const accuracy = order.length ? Math.round((correct / order.length) * 100) : 0;

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link href="/mashq" className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" /> Mashqlar
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">
              {emoji} {title}
            </h1>
            <p className="mt-1 text-ink-mute">{intro}</p>
          </div>
          {best > 0 ? (
            <span className="flex items-center gap-1.5 rounded-xl2 bg-paper px-3.5 py-2 text-sm font-extrabold text-ink-soft">
              <Target className="h-4 w-4" /> Rekord {best}%
            </span>
          ) : null}
        </div>

        {/* Daraja tanlash */}
        {!done ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {(["all", 1, 2, 3] as Level[]).map((lv) => {
              const count = lv === "all" ? items.length : items.filter((i) => (i.level ?? 1) === lv).length;
              if (count === 0) return null;
              return (
                <button
                  key={String(lv)}
                  type="button"
                  onClick={() => setLevel(lv)}
                  className={cn(
                    "rounded-xl border-2 px-3.5 py-1.5 text-sm font-extrabold transition",
                    lv === level
                      ? "border-ink bg-ink text-white"
                      : "border-paper-line bg-white text-ink-soft hover:bg-paper",
                  )}
                >
                  {LEVEL_LABEL[String(lv)]}{" "}
                  <span className={cn("font-mono text-xs", lv === level ? "text-white/60" : "text-ink-mute")}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {packId ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl2 border-2 border-paper-line bg-paper/50 px-4 py-3">
            <span className="text-sm font-bold text-ink-soft">
              Shu mavzuni butun sinf bilan musobaqa qilib o'ynash mumkin:
            </span>
            <Link
              href={"/yomgir?pack=" + packId}
              className="rounded-xl bg-ink px-3.5 py-2 text-sm font-extrabold text-white hover:bg-ink-soft"
            >
              Musobaqa ochish
            </Link>
          </div>
        ) : null}

        {done ? (
          <div className="surface mt-6 p-8 text-center">
            <Trophy className="mx-auto h-14 w-14 text-gold" />
            <h2 className="mt-3 text-2xl font-extrabold text-ink">Mashq tugadi</h2>
            <p className="mt-2 text-lg font-bold text-ink-soft">
              {correct} / {order.length} to'g'ri · {accuracy}% aniqlik
            </p>
            <p className="mt-3 text-sm text-ink-mute">
              {accuracy === 100
                ? "Bitta ham xato yo'q — mavzuni yaxshi o'zlashtirgansiz."
                : accuracy >= 70
                  ? "Yaxshi natija. Xato qilgan savollarni qaytadan ko'rib chiqing."
                  : "Mashqni yana bir marta bajaring — tushuntirishlarni diqqat bilan o'qing."}
            </p>

            {/* Xatolar ro'yxati — nimani takrorlash kerakligi ko'rinib turadi */}
            {missed.length > 0 ? (
              <ul className="mx-auto mt-5 max-w-lg space-y-2 text-left">
                {missed.map((m) => (
                  <li key={m.id} className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-2.5">
                    <p className="text-sm font-bold text-ink">{m.prompt}</p>
                    <p className="mt-0.5 text-xs font-extrabold text-emerald-700">To'g'risi: {m.answer}</p>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              {missed.length > 0 ? (
                <button
                  type="button"
                  onClick={() => start(missed)}
                  className="inline-flex items-center gap-2 rounded-xl2 bg-amber-500 px-6 py-3 text-sm font-extrabold text-white hover:bg-amber-600"
                >
                  <Target className="h-4 w-4" /> Xatolarni takrorlash ({missed.length})
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => start()}
                className="inline-flex items-center gap-2 rounded-xl2 bg-ink px-6 py-3 text-sm font-extrabold text-white hover:bg-ink-soft"
              >
                <RotateCcw className="h-4 w-4" /> Yangi savollar
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="mt-5 flex items-center gap-3">
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
                <span
                  className="block h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${((index + (chosen ? 1 : 0)) / Math.max(1, order.length)) * 100}%`,
                    background: color,
                  }}
                />
              </span>
              <span className="shrink-0 font-mono text-sm font-bold text-ink-mute">
                {index + 1}/{order.length}
              </span>
              <span className="shrink-0 text-sm font-bold text-emerald-600">{correct} ✓</span>
              <span className="shrink-0 text-sm font-bold text-rose-500">{wrong} ✕</span>
            </div>

            {/* Ko'rgazma */}
            {item.media ? <Media media={item.media} /> : null}

            {/* Savol */}
            <div className="surface mt-4 px-5 py-4">
              <p className="text-balance text-xl font-extrabold leading-snug text-ink">{item.prompt}</p>
            </div>

            {/* Variantlar */}
            <div className="mt-3 grid gap-2.5">
              {options.map((option, i) => {
                const isAnswer = option === item.answer;
                const picked = chosen === option;
                const state = !chosen ? "idle" : isAnswer ? "correct" : picked ? "wrong" : "muted";

                return (
                  <button
                    key={`${item.id}-${i}`}
                    type="button"
                    disabled={!!chosen}
                    onClick={() => answer(option)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl2 border-2 px-4 py-3.5 text-left text-base font-extrabold transition",
                      state === "idle" && "border-paper-line bg-white text-ink hover:bg-paper active:translate-y-[2px]",
                      state === "correct" && "animate-pop-in border-emerald-500 bg-emerald-50 text-emerald-900",
                      state === "wrong" && "animate-shake border-rose-500 bg-rose-50 text-rose-900",
                      state === "muted" && "border-paper-line bg-white text-ink-mute opacity-50",
                    )}
                  >
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm text-white"
                      style={{
                        background: state === "correct" ? "#10b981" : state === "wrong" ? "#f43f5e" : color,
                      }}
                    >
                      {state === "correct" ? (
                        <Check className="h-4 w-4" strokeWidth={3} />
                      ) : state === "wrong" ? (
                        <X className="h-4 w-4" strokeWidth={3} />
                      ) : (
                        LETTERS[i]
                      )}
                    </span>
                    <span className="leading-tight">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Tushuntirish */}
            {chosen ? (
              <div
                className={cn(
                  "animate-pop-in mt-4 rounded-xl2 border-2 p-4",
                  chosen === item.answer ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50",
                )}
              >
                <p className="text-xs font-extrabold uppercase tracking-wider text-ink-mute">
                  {chosen === item.answer ? "To'g'ri" : `To'g'ri javob: ${item.answer}`}
                </p>
                <p className="mt-1.5 leading-relaxed text-ink-soft">{item.explanation}</p>

                <button
                  type="button"
                  onClick={next}
                  className="mt-4 rounded-xl2 bg-ink px-5 py-2.5 text-sm font-extrabold text-white hover:bg-ink-soft"
                >
                  {index + 1 >= order.length ? "Yakunlash" : "Keyingi savol →"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ko'rgazma turlari                                                  */
/* ------------------------------------------------------------------ */

function Media({ media }: { media: NonNullable<PracticeItem["media"]> }) {
  if (media.kind === "email") {
    return (
      <div className="mt-5 overflow-hidden rounded-xl2 border-2 border-paper-line bg-white">
        <div className="border-b border-paper-line bg-paper px-4 py-2.5">
          <p className="text-xs font-bold text-ink-mute">
            Kimdan: <span className="font-mono text-ink">{media.from}</span>
          </p>
          <p className="mt-0.5 font-extrabold text-ink">{media.subject}</p>
        </div>
        <div className="px-4 py-3.5">
          <p className="leading-relaxed text-ink-soft">{media.body}</p>
          {media.link ? (
            <p className="mt-3 break-all rounded-lg bg-paper px-3 py-2 font-mono text-sm text-teamA underline">
              {media.link}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (media.kind === "device") {
    return (
      <div className="mt-5 flex items-center gap-4 rounded-xl2 border-2 border-paper-line bg-white px-5 py-4">
        <span className="text-5xl" aria-hidden>
          {media.emoji}
        </span>
        <p className="leading-relaxed text-ink-soft">{media.caption}</p>
      </div>
    );
  }

  if (media.kind === "sheet") {
    return (
      <div className="mt-5 overflow-hidden rounded-xl2 border-2 border-paper-line bg-white">
        <table className="w-full text-sm">
          <thead className="bg-paper">
            <tr>
              <th className="w-10 px-2 py-2 text-xs font-bold text-ink-mute" />
              {media.headers.map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs font-extrabold text-ink-soft">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-line">
            {media.rows.map((row, i) => (
              <tr key={i}>
                <td className="bg-paper px-2 py-2 text-center font-mono text-xs text-ink-mute">{i + 2}</td>
                {row.map((cell, k) => (
                  <td key={k} className="px-3 py-2 font-mono text-ink">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {media.formula ? (
          <p className="border-t border-paper-line bg-paper px-4 py-2 font-mono text-sm text-ink-soft">
            {media.formula}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-xl2 border-2 border-paper-line bg-white px-5 py-4">
      <p className="leading-relaxed text-ink-soft">{media.text}</p>
    </div>
  );
}
