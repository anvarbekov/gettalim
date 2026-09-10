"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, RotateCcw, Trophy, X } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { sfx } from "@/lib/sound";
import type { PracticeItem } from "@/lib/practice/quiz/types";
import { cn, shuffle } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/**
 * Mashq savollari uchun umumiy ekran.
 *
 * Testdan farqi: javobdan keyin **tushuntirish** chiqadi va u savolning
 * o'zidan muhimroq. Bola nega xato qilganini tushunmasa, mashqning ma'nosi yo'q.
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
  const [order, setOrder] = useState<PracticeItem[]>([]);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);

  const restart = useCallback(() => {
    setOrder(shuffle(items));
    setIndex(0);
    setChosen(null);
    setCorrect(0);
    setWrong(0);
    setDone(false);
  }, [items]);

  useEffect(() => {
    restart();
  }, [restart]);

  const item = order[index];
  const options = useMemo(() => (item ? shuffle(item.options) : []), [item]);

  if (!item && !done) {
    return <div className="grid min-h-dvh place-items-center text-ink-mute">Tayyorlanmoqda…</div>;
  }

  const answer = (option: string) => {
    if (chosen) return;
    setChosen(option);
    if (option === item.answer) {
      setCorrect((n) => n + 1);
      sfx.correct();
    } else {
      setWrong((n) => n + 1);
      sfx.wrong();
    }
  };

  const next = () => {
    if (index + 1 >= order.length) {
      setDone(true);
      sfx.win();
      return;
    }
    setIndex((i) => i + 1);
    setChosen(null);
  };

  const accuracy = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link href="/mashq" className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" /> Mashqlar
        </Link>

        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">
          {emoji} {title}
        </h1>
        <p className="mt-1 text-ink-mute">{intro}</p>

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
            <button
              type="button"
              onClick={restart}
              className="mt-6 inline-flex items-center gap-2 rounded-xl2 bg-ink px-6 py-3 text-sm font-extrabold text-white hover:bg-ink-soft"
            >
              <RotateCcw className="h-4 w-4" /> Yana bir marta
            </button>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="mt-5 flex items-center gap-3">
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
                <span
                  className="block h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${((index + (chosen ? 1 : 0)) / order.length) * 100}%`, background: color }}
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
                    key={option}
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
                        background:
                          state === "correct" ? "#10b981" : state === "wrong" ? "#f43f5e" : color,
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
                  chosen === item.answer
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-amber-300 bg-amber-50",
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
                <td className="bg-paper px-2 py-2 text-center font-mono text-xs text-ink-mute">{i + 1}</td>
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
