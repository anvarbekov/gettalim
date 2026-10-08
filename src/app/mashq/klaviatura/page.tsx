"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gauge, RotateCcw, Target, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { sfx } from "@/lib/sound";
import {
  TYPING_LEVELS,
  accuracy as calcAccuracy,
  readRecords,
  saveRecord,
  verdict,
  wordsPerMinute,
  type TypingRecord,
} from "@/lib/practice/klaviatura/data";
import { cn } from "@/lib/utils";

type Phase = "ready" | "typing" | "done";

export default function KlaviaturaPage() {
  const [levelIndex, setLevelIndex] = useState(0);
  const level = TYPING_LEVELS[levelIndex];

  const [text, setText] = useState("");
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<Phase>("ready");
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [errors, setErrors] = useState(0);
  const [records, setRecords] = useState<Record<string, TypingRecord>>({});
  const [isRecord, setIsRecord] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  /* Yangi matn tanlash */
  const reset = useCallback(() => {
    const list = TYPING_LEVELS[levelIndex].texts;
    setText(list[Math.floor(Math.random() * list.length)]);
    setTyped("");
    setPhase("ready");
    setStartedAt(0);
    setElapsed(0);
    setErrors(0);
    setIsRecord(false);
    setTimeout(() => inputRef.current?.focus(), 40);
  }, [levelIndex]);

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    setRecords(readRecords());
  }, [phase]);

  /* Soat */
  useEffect(() => {
    if (phase !== "typing") return;
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 100);
    return () => clearInterval(id);
  }, [phase, startedAt]);

  const correctChars = useMemo(
    () => typed.split("").filter((ch, i) => ch === text[i]).length,
    [typed, text],
  );

  const wpm = wordsPerMinute(correctChars, elapsed || 1);
  const acc = calcAccuracy(correctChars, typed.length);

  const handleChange = (value: string) => {
    if (phase === "done") return;

    if (phase === "ready" && value.length > 0) {
      setPhase("typing");
      setStartedAt(Date.now());
    }

    // Xatolarni sanaymiz: yangi kiritilgan belgi noto'g'ri bo'lsa
    if (value.length > typed.length) {
      const index = value.length - 1;
      if (value[index] !== text[index]) setErrors((n) => n + 1);
    }

    const next = value.slice(0, text.length);
    setTyped(next);

    if (next.length === text.length) {
      const total = Date.now() - startedAt;
      setElapsed(total);
      setPhase("done");
      sfx.win();
      const finalCorrect = next.split("").filter((ch, i) => ch === text[i]).length;
      const finalWpm = wordsPerMinute(finalCorrect, total);
      const finalAcc = calcAccuracy(finalCorrect, next.length);
      // Rekord faqat aniqlik yetarli bo'lganda yoziladi — tez, lekin
      // xato bosib o'tish rekord bo'lib qolmasin
      if (finalAcc >= 85) setIsRecord(saveRecord(level.id, finalWpm, finalAcc));
    }
  };

  const record = records[level.id];
  const result = verdict(wpm, acc);

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-6">
        <Link href="/mashq" className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" /> Mashqlar
        </Link>

        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">⌨️ Klaviatura trenajyori</h1>
        <p className="mt-1 text-ink-mute">
          Har dars boshida 3–5 daqiqa. Ekranga qarab yozing — klaviaturaga emas.
        </p>

        {/* Bosqichlar */}
        <div className="mt-5 flex flex-wrap gap-2">
          {TYPING_LEVELS.map((item, i) => {
            const best = records[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setLevelIndex(i)}
                title={item.izoh}
                className={cn(
                  "rounded-xl border-2 px-3.5 py-2 text-sm font-extrabold transition",
                  levelIndex === i
                    ? "border-[#e0a92e] bg-[#e0a92e] text-white"
                    : "border-paper-line bg-white text-ink hover:bg-paper",
                )}
              >
                {item.nomi}
                {best ? (
                  <span className={cn("ml-1.5 font-mono text-xs", levelIndex === i ? "text-white/75" : "text-ink-mute")}>
                    {best.wpm}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <p className="mt-2 text-sm text-ink-mute">
          {level.izoh} · {level.grades} sinf
        </p>

        {/* Hisoblagichlar */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric icon={<Gauge className="h-4 w-4" />} label="So'z / daqiqa" value={phase === "ready" ? "—" : String(wpm)} />
          <Metric icon={<Target className="h-4 w-4" />} label="Aniqlik" value={phase === "ready" ? "—" : `${acc}%`} />
          <Metric
            icon={<Trophy className="h-4 w-4" />}
            label="Rekordingiz"
            value={record ? `${record.wpm} so'z/daq` : "hali yo'q"}
          />
        </div>

        {/* Matn */}
        <div
          className="surface mt-4 cursor-text px-5 py-6 font-mono text-xl leading-relaxed sm:text-2xl"
          onClick={() => inputRef.current?.focus()}
        >
          {text.split("").map((ch, i) => {
            const state =
              i >= typed.length ? "pending" : typed[i] === ch ? "right" : "wrong";
            const isCursor = i === typed.length && phase !== "done";

            return (
              <span
                key={i}
                className={cn(
                  "relative",
                  state === "right" && "text-emerald-600",
                  state === "wrong" && "rounded bg-rose-100 text-rose-700",
                  state === "pending" && "text-ink-mute/60",
                  isCursor && "rounded bg-ink/10 text-ink",
                )}
              >
                {ch === " " && state === "wrong" ? "␣" : ch}
                {isCursor ? (
                  <span className="absolute -bottom-1 left-0 h-0.5 w-full animate-glow bg-ink" aria-hidden />
                ) : null}
              </span>
            );
          })}
        </div>

        {/* Yashirin kiritish maydoni */}
        <input
          ref={inputRef}
          value={typed}
          onChange={(e) => handleChange(e.target.value)}
          disabled={phase === "done"}
          className="sr-only"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Matnni yozing"
        />

        {phase === "ready" ? (
          <p className="mt-3 text-center text-sm font-bold text-ink-mute">
            Yozishni boshlang — vaqt birinchi harfdan hisoblanadi.
            <button
              type="button"
              onClick={() => inputRef.current?.focus()}
              className="ml-2 text-teamA underline"
            >
              Bu yerni bosing
            </button>
          </p>
        ) : null}

        {/* Natija */}
        {phase === "done" ? (
          <div
            className={cn(
              "animate-pop-in mt-4 rounded-xl2 border-2 p-5",
              result.tone === "great" && "border-emerald-400 bg-emerald-50",
              result.tone === "good" && "border-teamA/40 bg-teamA/5",
              result.tone === "work" && "border-amber-300 bg-amber-50",
            )}
          >
            <div className="flex flex-wrap items-center gap-4">
              <span>
                <span className="block font-mono text-4xl font-bold text-ink">{wpm}</span>
                <span className="block text-xs font-extrabold uppercase tracking-wider text-ink-mute">
                  so'z / daqiqa
                </span>
              </span>
              <span>
                <span className="block font-mono text-4xl font-bold text-ink">{acc}%</span>
                <span className="block text-xs font-extrabold uppercase tracking-wider text-ink-mute">
                  aniqlik
                </span>
              </span>
              <span>
                <span className="block font-mono text-4xl font-bold text-ink">{errors}</span>
                <span className="block text-xs font-extrabold uppercase tracking-wider text-ink-mute">
                  xato
                </span>
              </span>
            </div>

            {isRecord ? (
              <p className="mt-3 flex items-center gap-2 font-extrabold text-emerald-700">
                <Trophy className="h-4 w-4" /> Yangi rekord!
              </p>
            ) : null}

            <p className="mt-3 font-extrabold text-ink">{result.title}</p>
            <p className="mt-1 leading-relaxed text-ink-soft">{result.note}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-2 rounded-xl2 bg-ink px-5 py-2.5 text-sm font-extrabold text-white hover:bg-ink-soft"
              >
                <RotateCcw className="h-4 w-4" /> Yana bir marta
              </button>
              {levelIndex + 1 < TYPING_LEVELS.length ? (
                <button
                  type="button"
                  onClick={() => setLevelIndex((i) => i + 1)}
                  className="rounded-xl2 border-2 border-paper-line bg-white px-5 py-2.5 text-sm font-extrabold text-ink hover:bg-paper"
                >
                  Keyingi bosqich →
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-2 rounded-xl2 border-2 border-paper-line bg-white px-4 py-2.5 text-sm font-extrabold text-ink hover:bg-paper"
            >
              <RotateCcw className="h-4 w-4" /> Boshqa matn
            </button>
          </div>
        )}

        <div className="mt-8 rounded-xl2 border-2 border-paper-line bg-paper/50 px-5 py-4 text-sm leading-relaxed text-ink-soft">
          <b className="text-ink">Barmoq holati.</b> Chap qo'l ko'rsatkich barmog'i{" "}
          <b className="font-mono">F</b>, o'ng qo'l ko'rsatkich barmog'i{" "}
          <b className="font-mono">J</b> klavishasida turadi — bu klavishalarda kichik do'mboqcha bor,
          barmoq ularni sezadi. Qolgan barmoqlar yonma-yon joylashadi. Ekranga qarab yozish
          birinchi kunlarda sekin bo'ladi, lekin bir-ikki haftadan keyin tezlik keskin oshadi.
        </div>
      </main>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="surface flex items-center gap-3 px-4 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper text-ink-soft">{icon}</span>
      <span>
        <span className="block font-mono text-xl font-bold text-ink">{value}</span>
        <span className="block text-[11px] font-extrabold uppercase tracking-wider text-ink-mute">{label}</span>
      </span>
    </div>
  );
}
