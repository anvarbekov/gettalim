"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Lightbulb, RotateCcw, Trophy, X } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { sfx } from "@/lib/sound";
import {
  LEVELS,
  STEP_STYLE,
  tasksByLevel,
  type AlgoLevel,
  type AlgoStep,
  type AlgoTask,
} from "@/lib/practice/algoritm/data";
import { cn, shuffle } from "@/lib/utils";

/** Bir qadam — aralashtirilganda ham o'z tartibini eslab turadi. */
interface Card {
  id: number;
  step: AlgoStep;
  /** To'g'ri tartibdagi o'rni. */
  correctIndex: number;
}

export default function AlgoritmPage() {
  const [level, setLevel] = useState<AlgoLevel>("2-4");
  const [taskIndex, setTaskIndex] = useState(0);

  const tasks = useMemo(() => tasksByLevel(level), [level]);
  const task: AlgoTask | undefined = tasks[taskIndex];

  const [pool, setPool] = useState<Card[]>([]);
  const [placed, setPlaced] = useState<Card[]>([]);
  const [checked, setChecked] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);
  const [hint, setHint] = useState(false);

  /** Topshiriqni boshidan tayyorlash. */
  const reset = useCallback(
    (current: AlgoTask | undefined) => {
      if (!current) return;
      const cards: Card[] = current.steps.map((step, i) => ({ id: i, step, correctIndex: i }));
      // Boshlanish va tugash bloklari ham aralashadi — bola o'zi topsin
      setPool(shuffle(cards));
      setPlaced([]);
      setChecked(false);
      setAttempts(0);
      setSolved(false);
      setHint(false);
    },
    [],
  );

  useEffect(() => {
    reset(task);
  }, [task, reset]);

  useEffect(() => {
    setTaskIndex(0);
  }, [level]);

  const place = (card: Card) => {
    if (solved) return;
    setPool((prev) => prev.filter((c) => c.id !== card.id));
    setPlaced((prev) => [...prev, card]);
    setChecked(false);
  };

  const takeBack = (card: Card) => {
    if (solved) return;
    setPlaced((prev) => prev.filter((c) => c.id !== card.id));
    setPool((prev) => [...prev, card]);
    setChecked(false);
  };

  const move = (index: number, delta: number) => {
    if (solved) return;
    const next = [...placed];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setPlaced(next);
    setChecked(false);
  };

  const check = () => {
    setChecked(true);
    setAttempts((n) => n + 1);
    const ok = placed.length === task?.steps.length && placed.every((c, i) => c.correctIndex === i);
    if (ok) {
      setSolved(true);
      sfx.win();
    } else {
      sfx.wrong();
    }
  };

  const correctAt = (index: number) => placed[index]?.correctIndex === index;

  if (!task) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-16 text-center text-ink-mute">
          Bu bosqichda topshiriq yo'q.
        </main>
      </div>
    );
  }

  const ready = placed.length === task.steps.length;

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Link href="/mashq" className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" /> Mashqlar
        </Link>

        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">🧩 Algoritm yig'ish</h1>
        <p className="mt-1 text-ink-mute">
          Qadamlarni bosib, to'g'ri tartibda joylashtiring. Tartib noto'g'ri bo'lsa, algoritm ishlamaydi.
        </p>

        <p className="mt-3 rounded-xl2 border-2 border-paper-line bg-paper/50 px-4 py-2.5 text-sm text-ink-soft">
          Bu mashq musobaqa rejimida ishlamaydi: qadamlarni tartibga solish
          variantli savolga sig'maydi. Sinfda birgalikda, doskada bajarilsa qulayroq.
        </p>

        {/* Bosqich tanlash */}
        <div className="mt-5 flex flex-wrap gap-2">
          {LEVELS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLevel(item.id)}
              title={item.izoh}
              className={cn(
                "rounded-xl border-2 px-4 py-2.5 text-sm font-extrabold transition",
                level === item.id
                  ? "border-[#7a3fd0] bg-[#7a3fd0] text-white"
                  : "border-paper-line bg-white text-ink hover:bg-paper",
              )}
            >
              {item.nomi}
            </button>
          ))}
        </div>

        {/* Topshiriq tanlash */}
        <div className="mt-3 flex flex-wrap gap-2">
          {tasks.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTaskIndex(i)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-extrabold transition",
                i === taskIndex ? "bg-ink text-white" : "bg-paper text-ink-soft hover:bg-paper-line",
              )}
            >
              {item.title}
            </button>
          ))}
        </div>

        {/* Vaziyat */}
        <div className="surface mt-5 px-5 py-4">
          <h2 className="text-lg font-extrabold text-ink">{task.title}</h2>
          <p className="mt-1 text-ink-soft">{task.intro}</p>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {/* ---- Aralash qadamlar ---- */}
          <section>
            <h3 className="eyebrow mb-2">Qadamlar · {pool.length}</h3>
            <div className="surface min-h-[120px] space-y-2 p-3">
              {pool.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-mute">Hamma qadam joylashtirildi.</p>
              ) : (
                pool.map((card) => {
                  const style = STEP_STYLE[card.step.kind];
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => place(card)}
                      className="flex w-full items-center gap-3 rounded-xl border-2 border-paper-line bg-white px-3 py-2.5 text-left transition hover:border-ink/25 hover:bg-paper"
                    >
                      <span
                        className="shrink-0 rounded-md px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white"
                        style={{ background: style.color }}
                      >
                        {style.label}
                      </span>
                      <span className="min-w-0 flex-1 font-bold text-ink">{card.step.text}</span>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* ---- Yig'ilgan algoritm ---- */}
          <section>
            <h3 className="eyebrow mb-2">Algoritm · {placed.length}/{task.steps.length}</h3>
            <div className="surface min-h-[120px] space-y-2 p-3">
              {placed.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-mute">
                  Chapdagi qadamlarni bosib, shu yerga joylashtiring.
                </p>
              ) : (
                placed.map((card, index) => {
                  const style = STEP_STYLE[card.step.kind];
                  const right = checked && correctAt(index);
                  const wrong = checked && !correctAt(index);

                  return (
                    <div
                      key={card.id}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border-2 px-2.5 py-2 transition",
                        right && "border-emerald-400 bg-emerald-50",
                        wrong && "animate-shake border-rose-300 bg-rose-50",
                        !checked && "border-paper-line bg-white",
                      )}
                    >
                      <span className="w-5 shrink-0 text-center font-mono text-xs font-bold text-ink-mute">
                        {index + 1}
                      </span>

                      <span
                        className={cn(
                          "shrink-0 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white",
                          style.shape,
                        )}
                        style={{ background: style.color }}
                      >
                        {style.label}
                      </span>

                      <span className="min-w-0 flex-1 text-sm font-bold text-ink">{card.step.text}</span>

                      {checked ? (
                        <span className={cn("shrink-0", right ? "text-emerald-600" : "text-rose-500")}>
                          {right ? <Check className="h-4 w-4" strokeWidth={3} /> : <X className="h-4 w-4" strokeWidth={3} />}
                        </span>
                      ) : null}

                      {!solved ? (
                        <span className="flex shrink-0 gap-0.5">
                          <button
                            type="button"
                            onClick={() => move(index, -1)}
                            disabled={index === 0}
                            className="rounded-md px-1.5 py-0.5 text-xs font-bold text-ink-mute transition hover:bg-paper disabled:opacity-30"
                            aria-label="Yuqoriga"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => move(index, 1)}
                            disabled={index === placed.length - 1}
                            className="rounded-md px-1.5 py-0.5 text-xs font-bold text-ink-mute transition hover:bg-paper disabled:opacity-30"
                            aria-label="Pastga"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => takeBack(card)}
                            className="rounded-md px-1.5 py-0.5 text-xs font-bold text-ink-mute transition hover:bg-paper"
                            aria-label="Qaytarish"
                          >
                            ✕
                          </button>
                        </span>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Boshqaruv */}
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={check}
            disabled={!ready || solved}
            className="flex items-center gap-2 rounded-xl2 bg-ink px-5 py-3 text-sm font-extrabold text-white transition hover:bg-ink-soft disabled:opacity-40"
          >
            <Check className="h-4 w-4" /> Tekshirish
          </button>

          <button
            type="button"
            onClick={() => reset(task)}
            className="flex items-center gap-2 rounded-xl2 border-2 border-paper-line bg-white px-4 py-3 text-sm font-extrabold text-ink hover:bg-paper"
          >
            <RotateCcw className="h-4 w-4" /> Boshidan
          </button>

          {!solved && attempts >= 2 ? (
            <button
              type="button"
              onClick={() => setHint(true)}
              className="flex items-center gap-2 rounded-xl2 border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm font-extrabold text-amber-900 hover:bg-amber-100"
            >
              <Lightbulb className="h-4 w-4" /> Maslahat
            </button>
          ) : null}

          {attempts > 0 ? (
            <span className="text-sm font-bold text-ink-mute">{attempts} urinish</span>
          ) : null}
        </div>

        {/* Maslahat */}
        {hint && !solved ? (
          <p className="mt-3 rounded-xl2 border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            Birinchi qadam har doim «Boshlanish», oxirgisi «Tugash». Qolganlarini o'ylang: qaysi ish
            boshqasidan oldin bajarilishi shart?
          </p>
        ) : null}

        {/* Yechildi */}
        {solved ? (
          <div className="animate-pop-in mt-5 rounded-xl2 border-2 border-emerald-400 bg-emerald-50 p-5">
            <p className="flex items-center gap-2 text-lg font-extrabold text-emerald-900">
              <Trophy className="h-5 w-5" /> To'g'ri! {attempts === 1 ? "Birinchi urinishdayoq." : `${attempts} urinishda.`}
            </p>
            <p className="mt-2 leading-relaxed text-emerald-900/85">{task.lesson}</p>

            {taskIndex + 1 < tasks.length ? (
              <button
                type="button"
                onClick={() => setTaskIndex((i) => i + 1)}
                className="mt-4 rounded-xl2 bg-ink px-5 py-2.5 text-sm font-extrabold text-white hover:bg-ink-soft"
              >
                Keyingi topshiriq →
              </button>
            ) : (
              <p className="mt-4 text-sm font-bold text-emerald-900">
                Bu bosqichdagi barcha topshiriqlar yechildi. Yuqori bosqichga o'ting!
              </p>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
