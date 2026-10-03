"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Check, Lightbulb, RotateCcw, Timer, Trophy, X, Zap } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Input } from "@/components/ui/card";
import { sfx } from "@/lib/sound";
import {
  BASE_NAME,
  THEORY,
  bitWeight,
  bitsToValue,
  fromBase,
  toBase,
  toBits,
  type Base,
} from "@/lib/practice/sanoq/data";
import { cn } from "@/lib/utils";

type Tab = "nazariya" | "lampochka" | "mashq";

interface Mode {
  id: string;
  from: Base;
  to: Base;
  nomi: string;
  max: number;
}

const MODES: Mode[] = [
  { id: "b2d", from: 2, to: 10, nomi: "Ikkilik → O'nlik", max: 255 },
  { id: "d2b", from: 10, to: 2, nomi: "O'nlik → Ikkilik", max: 255 },
  { id: "h2d", from: 16, to: 10, nomi: "O'n oltilik → O'nlik", max: 255 },
  { id: "d2h", from: 10, to: 16, nomi: "O'nlik → O'n oltilik", max: 255 },
  { id: "b2h", from: 2, to: 16, nomi: "Ikkilik → O'n oltilik", max: 255 },
];

export default function SanoqPage() {
  const [tab, setTab] = useState<Tab>("nazariya");

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Link href="/mashq" className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" /> Mashqlar
        </Link>

        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">🔢 Sanoq sistemalari</h1>
        <p className="mt-1 text-ink-mute">
          Ikkilik, o'nlik va o'n oltilik sistemalar. Avval tushuning, keyin mashq qiling.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl2 border-2 border-paper-line bg-paper/50 px-4 py-3">
          <span className="text-sm font-bold text-ink-soft">
            Shu mavzuni butun sinf bilan musobaqa qilib o'ynash mumkin:
          </span>
          <Link
            href="/yomgir?pack=mashq-sanoq"
            className="rounded-xl bg-ink px-3.5 py-2 text-sm font-extrabold text-white hover:bg-ink-soft"
          >
            Musobaqa ochish
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl2 bg-paper p-1.5">
          {(
            [
              ["nazariya", "Nazariya", BookOpen],
              ["lampochka", "Lampochkalar", Lightbulb],
              ["mashq", "Mashq", Zap],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-extrabold transition",
                tab === id ? "bg-white text-ink shadow-card" : "text-ink-mute hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {tab === "nazariya" ? <Theory /> : null}
        {tab === "lampochka" ? <BitLab /> : null}
        {tab === "mashq" ? <Trainer /> : null}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Nazariya                                                           */
/* ------------------------------------------------------------------ */

function Theory() {
  return (
    <div className="mt-5 space-y-4">
      {THEORY.map((section, i) => (
        <article key={section.title} className="surface p-5">
          <h2 className="flex items-start gap-2.5 text-lg font-extrabold text-ink">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#0f9b8e] text-sm text-white">
              {i + 1}
            </span>
            {section.title}
          </h2>

          <div className="mt-3 space-y-2.5">
            {section.body.map((paragraph, k) => (
              <p key={k} className="leading-relaxed text-ink-soft">
                {paragraph}
              </p>
            ))}
          </div>

          {section.example ? (
            <div className="mt-4 overflow-hidden rounded-xl2 border-2 border-paper-line">
              <p className="bg-paper px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-ink-mute">
                {section.example.label}
              </p>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-paper-line">
                  {section.example.rows.map(([left, right], k) => (
                    <tr key={k} className={k === section.example!.rows.length - 1 ? "bg-paper/60" : ""}>
                      <td className="px-4 py-2 font-mono text-ink-soft">{left}</td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-ink">{right}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Lampochkalar — erkin tajriba maydoni                               */
/* ------------------------------------------------------------------ */

function BitLab() {
  const [bits, setBits] = useState<number[]>(Array(8).fill(0));
  const value = bitsToValue(bits);

  const toggle = (index: number) => {
    sfx.unlock();
    setBits((prev) => prev.map((bit, i) => (i === index ? (bit ? 0 : 1) : bit)));
  };

  return (
    <div className="mt-5">
      <p className="text-ink-soft">
        Lampochkani bosing — u yonadi va tagidagi son yig'indiga qo'shiladi. Sakkizta lampochka bilan
        0 dan 255 gacha istalgan sonni yasash mumkin.
      </p>

      {/* Lampochkalar */}
      <div className="surface mt-4 overflow-x-auto p-5">
        <div className="mx-auto flex min-w-max justify-center gap-2 sm:gap-3">
          {bits.map((bit, i) => {
            const weight = bitWeight(i, bits.length);
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                className="group flex flex-col items-center gap-2"
                aria-label={`${weight} razryadi`}
              >
                {/* Lampochka */}
                <span className="relative grid h-14 w-14 place-items-center sm:h-16 sm:w-16">
                  {bit ? (
                    <span
                      className="absolute inset-0 animate-glow rounded-full blur-md"
                      style={{ background: "#ffd76a" }}
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative grid h-12 w-12 place-items-center rounded-full border-4 text-2xl transition sm:h-14 sm:w-14",
                      bit
                        ? "border-amber-300 bg-amber-200 shadow-lift"
                        : "border-paper-line bg-paper group-hover:bg-paper-line",
                    )}
                  >
                    {bit ? "💡" : ""}
                  </span>
                </span>

                <span
                  className={cn(
                    "font-mono text-lg font-bold transition",
                    bit ? "text-ink" : "text-ink-mute/50",
                  )}
                >
                  {bit}
                </span>
                <span className="font-mono text-[11px] font-bold text-ink-mute">{weight}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Natija */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {([2, 10, 16] as Base[]).map((base) => (
          <div key={base} className="surface px-4 py-3 text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink-mute">
              {BASE_NAME[base]}
            </p>
            <p className="mt-1 break-all font-mono text-2xl font-bold text-ink">
              {base === 2 ? bits.join("") : toBase(value, base)}
            </p>
          </div>
        ))}
      </div>

      {/* Hisob-kitob */}
      {value > 0 ? (
        <div className="surface mt-4 px-5 py-4">
          <p className="eyebrow mb-2">Qanday hisoblanadi</p>
          <p className="font-mono text-sm leading-relaxed text-ink-soft">
            {bits
              .map((bit, i) => (bit ? `${bitWeight(i, bits.length)}` : null))
              .filter(Boolean)
              .join(" + ")}{" "}
            = <b className="text-ink">{value}</b>
          </p>
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-ink-mute">
          Barcha lampochka o'chiq — son 0 ga teng.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setBits(Array(8).fill(0))}
          className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-4 py-2.5 text-sm font-extrabold text-ink hover:bg-paper"
        >
          <RotateCcw className="h-4 w-4" /> Tozalash
        </button>
        {[13, 42, 100, 181, 255].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setBits(toBits(n))}
            className="rounded-xl border-2 border-paper-line bg-white px-3.5 py-2.5 text-sm font-extrabold text-ink-soft hover:bg-paper"
          >
            {n} ni ko'rsat
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Trenajyor                                                          */
/* ------------------------------------------------------------------ */

function Trainer() {
  const [mode, setMode] = useState<Mode>(MODES[0]);
  const [value, setValue] = useState(0);
  const [answer, setAnswer] = useState("");
  const [verdict, setVerdict] = useState<"none" | "right" | "wrong">("none");
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const nextQuestion = useCallback(
    (current: Mode) => {
      // 0 va 1 juda oson — kamida 2 dan boshlaymiz
      setValue(2 + Math.floor(Math.random() * (current.max - 1)));
      setAnswer("");
      setVerdict("none");
      setShowHint(false);
      setTimeout(() => inputRef.current?.focus(), 30);
    },
    [],
  );

  useEffect(() => {
    nextQuestion(mode);
  }, [mode, nextQuestion]);

  const shown = useMemo(() => toBase(value, mode.from), [value, mode.from]);
  const expected = useMemo(() => toBase(value, mode.to), [value, mode.to]);

  const check = () => {
    if (verdict !== "none") return;
    const parsed = fromBase(answer, mode.to);
    const ok = parsed !== null && parsed === value;

    setVerdict(ok ? "right" : "wrong");
    if (ok) {
      sfx.correct();
      setCorrect((n) => n + 1);
      setStreak((s) => {
        const next = s + 1;
        setBest((b) => Math.max(b, next));
        return next;
      });
      setTimeout(() => nextQuestion(mode), 900);
    } else {
      sfx.wrong();
      setWrong((n) => n + 1);
      setStreak(0);
    }
  };

  const total = correct + wrong;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="mt-5">
      {/* Rejim */}
      <div className="flex flex-wrap gap-2">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item)}
            className={cn(
              "rounded-xl border-2 px-3.5 py-2 text-sm font-extrabold transition",
              mode.id === item.id
                ? "border-[#0f9b8e] bg-[#0f9b8e] text-white"
                : "border-paper-line bg-white text-ink hover:bg-paper",
            )}
          >
            {item.nomi}
          </button>
        ))}
      </div>

      {/* Hisob */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <span className="rounded-xl bg-paper px-3.5 py-2 text-sm font-extrabold text-emerald-700">
          {correct} to'g'ri
        </span>
        <span className="rounded-xl bg-paper px-3.5 py-2 text-sm font-extrabold text-rose-600">
          {wrong} xato
        </span>
        {total > 0 ? (
          <span className="rounded-xl bg-paper px-3.5 py-2 text-sm font-extrabold text-ink-soft">
            {accuracy}% aniqlik
          </span>
        ) : null}
        {best > 1 ? (
          <span className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3.5 py-2 text-sm font-extrabold text-amber-800">
            <Trophy className="h-4 w-4" /> Rekord: {best} ketma-ket
          </span>
        ) : null}
        {streak >= 3 ? (
          <span className="animate-pop-in rounded-xl bg-amber-400 px-3.5 py-2 text-sm font-extrabold text-ink">
            🔥 {streak} ketma-ket
          </span>
        ) : null}
      </div>

      {/* Savol */}
      <div className="surface mt-4 px-6 py-6 text-center">
        <p className="text-sm font-extrabold uppercase tracking-wider text-ink-mute">
          {BASE_NAME[mode.from]} sanoq sistemasida
        </p>
        <p className="mt-2 break-all font-mono text-4xl font-bold text-ink sm:text-5xl">{shown}</p>
        <p className="mt-3 text-sm font-bold text-ink-soft">
          Bu sonni <b className="text-ink">{BASE_NAME[mode.to].toLowerCase()}</b> sistemaga o'tkazing
        </p>

        <div className="mx-auto mt-4 flex max-w-xs items-center gap-2">
          <Input
            ref={inputRef}
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value.toUpperCase());
              setVerdict("none");
            }}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="Javob"
            className={cn(
              "text-center font-mono text-2xl",
              verdict === "right" && "border-emerald-500 bg-emerald-50",
              verdict === "wrong" && "animate-shake border-rose-500 bg-rose-50",
            )}
            disabled={verdict === "right"}
          />
          <button
            type="button"
            onClick={check}
            disabled={!answer.trim() || verdict === "right"}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink text-white transition hover:bg-ink-soft disabled:opacity-40"
            aria-label="Tekshirish"
          >
            <Check className="h-5 w-5" strokeWidth={3} />
          </button>
        </div>

        {verdict === "wrong" ? (
          <div className="mt-4">
            <p className="flex items-center justify-center gap-2 font-extrabold text-rose-600">
              <X className="h-4 w-4" strokeWidth={3} /> To'g'ri javob: <span className="font-mono">{expected}</span>
            </p>
            <button
              type="button"
              onClick={() => setShowHint((v) => !v)}
              className="mt-2 text-sm font-bold text-teamA hover:underline"
            >
              {showHint ? "Yechimni yashirish" : "Qanday yechiladi?"}
            </button>
            {showHint ? <Explain value={value} mode={mode} /> : null}
            <button
              type="button"
              onClick={() => nextQuestion(mode)}
              className="mt-3 block w-full rounded-xl2 bg-ink py-2.5 text-sm font-extrabold text-white hover:bg-ink-soft"
            >
              Keyingi savol →
            </button>
          </div>
        ) : null}

        {verdict === "right" ? (
          <p className="mt-4 flex items-center justify-center gap-2 font-extrabold text-emerald-600">
            <Check className="h-5 w-5" strokeWidth={3} /> To'g'ri!
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => nextQuestion(mode)}
          className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-4 py-2.5 text-sm font-extrabold text-ink hover:bg-paper"
        >
          <Timer className="h-4 w-4" /> Boshqa son
        </button>
        <button
          type="button"
          onClick={() => {
            setCorrect(0);
            setWrong(0);
            setStreak(0);
            nextQuestion(mode);
          }}
          className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-4 py-2.5 text-sm font-extrabold text-ink hover:bg-paper"
        >
          <RotateCcw className="h-4 w-4" /> Hisobni tozalash
        </button>
      </div>
    </div>
  );
}

/** Xato qilinganda yechimni bosqichma-bosqich ko'rsatadi. */
function Explain({ value, mode }: { value: number; mode: Mode }) {
  const bits = toBits(value, value > 255 ? 16 : 8);

  if (mode.to === 10) {
    if (mode.from === 2) {
      const parts = bits
        .map((bit, i) => (bit ? bitWeight(i, bits.length) : null))
        .filter((n): n is number => n !== null);
      return (
        <div className="mt-3 rounded-xl2 border-2 border-paper-line bg-paper/60 px-4 py-3 text-left">
          <p className="text-xs font-extrabold uppercase tracking-wider text-ink-mute">Yechim</p>
          <p className="mt-1.5 font-mono text-sm leading-relaxed text-ink-soft">
            Faqat 1 turgan razryadlarning og'irliklarini qo'shamiz:
            <br />
            {parts.join(" + ")} = <b className="text-ink">{value}</b>
          </p>
        </div>
      );
    }
    // 16 → 10
    const hex = toBase(value, 16);
    const rows = hex
      .split("")
      .map((ch, i) => {
        const digit = Number.parseInt(ch, 16);
        const power = 16 ** (hex.length - 1 - i);
        return `${ch}(${digit}) × ${power} = ${digit * power}`;
      })
      .join("\n");
    return (
      <div className="mt-3 rounded-xl2 border-2 border-paper-line bg-paper/60 px-4 py-3 text-left">
        <p className="text-xs font-extrabold uppercase tracking-wider text-ink-mute">Yechim</p>
        <pre className="mt-1.5 whitespace-pre-wrap font-mono text-sm leading-relaxed text-ink-soft">
          {rows}
          {"\n"}Jami = <b className="text-ink">{value}</b>
        </pre>
      </div>
    );
  }

  // 10 → 2 yoki 10 → 16
  const base = mode.to;
  const steps: string[] = [];
  let current = value;
  while (current > 0) {
    const remainder = current % base;
    steps.push(`${current} : ${base} = ${Math.floor(current / base)}, qoldiq ${remainder.toString(base).toUpperCase()}`);
    current = Math.floor(current / base);
  }

  return (
    <div className="mt-3 rounded-xl2 border-2 border-paper-line bg-paper/60 px-4 py-3 text-left">
      <p className="text-xs font-extrabold uppercase tracking-wider text-ink-mute">Yechim</p>
      <pre className="mt-1.5 whitespace-pre-wrap font-mono text-sm leading-relaxed text-ink-soft">
        {steps.join("\n")}
        {"\n"}Qoldiqlarni pastdan yuqoriga o'qiymiz: <b className="text-ink">{toBase(value, base)}</b>
      </pre>
    </div>
  );
}
