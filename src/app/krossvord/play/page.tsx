"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Eye, Home, Printer, RotateCcw, Trophy } from "lucide-react";
import { LanguageSwitcher } from "@/components/SiteHeader";
import { useHomework } from "@/hooks/useHomework";
import { buildCrossword, type Crossword, type Direction } from "@/lib/games/krossvord/engine";
import { sfx } from "@/lib/sound";
import { getKrossvordSettings, getPack } from "@/lib/storage";
import type { KrossvordSettings, Pack } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Position {
  row: number;
  col: number;
}

function Board({
  pack,
  settings,
  onRestart,
  onFinish,
}: {
  pack: Pack;
  settings: KrossvordSettings;
  onRestart: () => void;
  onFinish?: (score: number, max: number) => void;
}) {
  const router = useRouter();
  const puzzle = useMemo<Crossword>(() => buildCrossword(pack, settings.words), [pack, settings.words]);

  const [letters, setLetters] = useState<Record<string, string>>({});
  const [cursor, setCursor] = useState<Position | null>(null);
  const [direction, setDirection] = useState<Direction>("across");
  const [checked, setChecked] = useState(false);
  const inputs = useRef<Map<string, HTMLInputElement>>(new Map());

  const key = (r: number, c: number) => `${r}:${c}`;

  /** Joriy so'z — kursor turgan katakdagi so'z. */
  const activeWord = useMemo(() => {
    if (!cursor) return null;
    const cell = puzzle.cells[cursor.row]?.[cursor.col];
    if (!cell) return null;
    const candidates = cell.words.map((i) => puzzle.words[i]);
    return candidates.find((w) => w.direction === direction) ?? candidates[0] ?? null;
  }, [cursor, direction, puzzle]);

  const inActiveWord = useCallback(
    (r: number, c: number) => {
      if (!activeWord) return false;
      const { row, col, answer, direction: dir } = activeWord;
      if (dir === "across") return r === row && c >= col && c < col + answer.length;
      return c === col && r >= row && r < row + answer.length;
    },
    [activeWord],
  );

  const focusCell = useCallback((r: number, c: number) => {
    const input = inputs.current.get(`${r}:${c}`);
    input?.focus();
    input?.select();
  }, []);

  /** Kursorni yo'nalish bo'yicha siljitadi. */
  const step = useCallback(
    (r: number, c: number, back = false) => {
      const delta = back ? -1 : 1;
      const nr = direction === "down" ? r + delta : r;
      const nc = direction === "across" ? c + delta : c;
      if (puzzle.cells[nr]?.[nc]) {
        setCursor({ row: nr, col: nc });
        focusCell(nr, nc);
      }
    },
    [direction, puzzle, focusCell],
  );

  const type = (r: number, c: number, value: string) => {
    const letter = value.slice(-1).toUpperCase();
    setLetters((prev) => ({ ...prev, [key(r, c)]: letter }));
    setChecked(false);
    if (letter) step(r, c);
  };

  const solvedWords = useMemo(() => {
    return puzzle.words.map((word) => {
      for (let i = 0; i < word.answer.length; i += 1) {
        const r = word.direction === "across" ? word.row : word.row + i;
        const c = word.direction === "across" ? word.col + i : word.col;
        if ((letters[key(r, c)] ?? "") !== word.answer[i]) return false;
      }
      return true;
    });
  }, [puzzle.words, letters]);

  const solvedCount = solvedWords.filter(Boolean).length;
  const finished = puzzle.words.length > 0 && solvedCount === puzzle.words.length;

  useEffect(() => {
    if (!finished) return;
    sfx.win();
    onFinish?.(solvedCount, puzzle.words.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const reveal = () => {
    const next: Record<string, string> = {};
    puzzle.cells.forEach((row) =>
      row.forEach((cell) => {
        if (cell) next[key(cell.row, cell.col)] = cell.letter;
      }),
    );
    setLetters(next);
    setChecked(true);
  };

  if (puzzle.words.length < 2) {
    return (
      <div className="grid min-h-dvh place-items-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Krossvord tuzib bo'lmadi</h1>
          <p className="mt-2 text-ink-mute">So'zlar kesishmadi — boshqa paket yoki kamroq so'z tanlang.</p>
          <Link href="/krossvord" className="mt-4 inline-block font-bold text-teamA hover:underline">
            Sozlamalarga qaytish →
          </Link>
        </div>
      </div>
    );
  }

  // Katak o'lchami to'r kengligiga qarab moslashadi
  const cellSize = Math.max(24, Math.min(46, Math.floor(620 / Math.max(1, puzzle.cols))));

  const across = puzzle.words.filter((w) => w.direction === "across");
  const down = puzzle.words.filter((w) => w.direction === "down");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-[1500px] px-4 py-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3 py-2 text-sm font-extrabold text-ink hover:bg-paper"
          >
            <Home className="h-4 w-4" /> <span className="hidden sm:inline">Bosh sahifa</span>
          </Link>
          <h1 className="flex-1 truncate text-center text-lg font-extrabold uppercase tracking-wide text-[#0e7fa8] sm:text-2xl">
            🔡 Krossvord: {pack.subject}
          </h1>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 pb-8">
        {/* Boshqaruv */}
        <div className="surface mb-4 flex flex-wrap items-center justify-center gap-2.5 px-4 py-3 print:hidden">
          <span className="rounded-xl bg-paper px-3.5 py-2 text-sm font-extrabold text-ink-soft">
            {solvedCount} / {puzzle.words.length} so'z topildi
          </span>
          <button
            type="button"
            onClick={() => setChecked(true)}
            className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3.5 py-2 text-sm font-extrabold text-ink hover:bg-paper"
          >
            <Check className="h-4 w-4" /> Tekshirish
          </button>
          <button
            type="button"
            onClick={reveal}
            className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3.5 py-2 text-sm font-extrabold text-ink hover:bg-paper"
          >
            <Eye className="h-4 w-4" /> Javoblarni ko'rsatish
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3.5 py-2 text-sm font-extrabold text-ink hover:bg-paper"
          >
            <RotateCcw className="h-4 w-4" /> Yangi krossvord
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3.5 py-2 text-sm font-extrabold text-ink hover:bg-paper"
          >
            <Printer className="h-4 w-4" /> Chop etish
          </button>
        </div>

        {puzzle.skipped > 0 ? (
          <p className="mb-4 text-center text-xs text-ink-mute print:hidden">
            {puzzle.skipped} ta so'z kesishmagani uchun to'rga tushmadi.
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
          {/* To'r */}
          <div className="mx-auto w-full overflow-x-auto">
            <div
              className="mx-auto grid gap-[2px] rounded-xl2 bg-ink/10 p-[2px]"
              style={{
                gridTemplateColumns: `repeat(${puzzle.cols}, ${cellSize}px)`,
                width: puzzle.cols * (cellSize + 2) + 2,
              }}
            >
              {puzzle.cells.map((row, r) =>
                row.map((cell, c) => {
                  if (!cell) return <span key={`${r}:${c}`} className="aspect-square" />;
                  const value = letters[key(r, c)] ?? "";
                  const right = checked && value === cell.letter;
                  const wrong = checked && value !== "" && value !== cell.letter;
                  const highlighted = inActiveWord(r, c);
                  const isCursor = cursor?.row === r && cursor?.col === c;

                  return (
                    <span key={`${r}:${c}`} className="relative aspect-square">
                      {cell.number ? (
                        <span className="pointer-events-none absolute left-0.5 top-0 z-10 font-mono text-[9px] font-bold text-ink-mute">
                          {cell.number}
                        </span>
                      ) : null}
                      <input
                        ref={(el) => {
                          if (el) inputs.current.set(key(r, c), el);
                          else inputs.current.delete(key(r, c));
                        }}
                        value={value}
                        maxLength={1}
                        inputMode="text"
                        aria-label={`${r + 1}-qator ${c + 1}-ustun`}
                        onChange={(e) => type(r, c, e.target.value)}
                        onFocus={() => setCursor({ row: r, col: c })}
                        onDoubleClick={() => setDirection((d) => (d === "across" ? "down" : "across"))}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !value) {
                            e.preventDefault();
                            step(r, c, true);
                          }
                          if (e.key === "ArrowRight") { setDirection("across"); step(r, c); }
                          if (e.key === "ArrowLeft") { setDirection("across"); step(r, c, true); }
                          if (e.key === "ArrowDown") { setDirection("down"); step(r, c); }
                          if (e.key === "ArrowUp") { setDirection("down"); step(r, c, true); }
                          if (e.key === " ") {
                            e.preventDefault();
                            setDirection((d) => (d === "across" ? "down" : "across"));
                          }
                        }}
                        className={cn(
                          "h-full w-full rounded-[3px] border-0 text-center text-base font-extrabold uppercase outline-none transition sm:text-lg",
                          right && "bg-emerald-100 text-emerald-900",
                          wrong && "bg-rose-100 text-rose-900",
                          !right && !wrong && highlighted && "bg-teamA/15 text-ink",
                          !right && !wrong && !highlighted && "bg-white text-ink",
                          isCursor && "ring-2 ring-inset ring-ink",
                        )}
                        style={{ minWidth: 0 }}
                      />
                    </span>
                  );
                }),
              )}
            </div>
          </div>

          {/* Savollar */}
          {settings.showClues ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {[
                ["Gorizontal", across] as const,
                ["Vertikal", down] as const,
              ].map(([title, list]) => (
                <div key={title}>
                  <h2 className="eyebrow mb-2">{title}</h2>
                  <ol className="space-y-1.5">
                    {list.map((word) => {
                      const index = puzzle.words.indexOf(word);
                      const done = solvedWords[index];
                      const active = activeWord === word;
                      return (
                        <li key={`${word.number}-${word.direction}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setDirection(word.direction);
                              setCursor({ row: word.row, col: word.col });
                              focusCell(word.row, word.col);
                            }}
                            className={cn(
                              "flex w-full items-start gap-2 rounded-xl px-2.5 py-1.5 text-left text-sm transition",
                              active ? "bg-teamA/10" : "hover:bg-paper",
                              done && "text-ink-mute line-through",
                            )}
                          >
                            <span className="font-mono text-xs font-bold text-ink-mute">{word.number}</span>
                            <span className="flex-1 font-medium text-ink">{word.clue}</span>
                            <span className="font-mono text-[10px] text-ink-mute">{word.answer.length}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Yakun */}
        {finished ? (
          <div className="fixed inset-0 z-40 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm print:hidden">
            <div className="w-full max-w-sm rounded-xl2 bg-white p-7 text-center shadow-lift">
              <Trophy className="mx-auto h-14 w-14 text-gold" />
              <h2 className="mt-3 text-2xl font-extrabold text-ink">Krossvord to'ldirildi!</h2>
              <p className="mt-1 text-ink-soft">{puzzle.words.length} ta so'z topildi</p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={onRestart}
                  className="rounded-xl2 bg-ink px-5 py-3 font-extrabold text-white hover:bg-ink-soft"
                >
                  Yangi krossvord
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="rounded-xl2 border-2 border-paper-line px-5 py-3 font-extrabold text-ink hover:bg-paper"
                >
                  Bosh sahifa
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function Loader() {
  const params = useSearchParams();
  const router = useRouter();
  const homeworkId = params.get("vazifa");
  const homework = useHomework(homeworkId);

  const [pack, setPack] = useState<Pack | null>(null);
  const [settings, setSettings] = useState<KrossvordSettings | null>(null);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (homeworkId) return;
    const stored = getKrossvordSettings();
    const id = params.get("pack") ?? stored.packId;
    const found = getPack(id);
    if (!found) {
      router.replace("/krossvord");
      return;
    }
    setPack(found);
    setSettings({ ...stored, packId: found.id });
  }, [params, router, homeworkId]);

  useEffect(() => {
    if (!homework.context) return;
    const config = homework.context.assignment.config ?? {};
    setPack(homework.context.pack);
    setSettings({
      packId: homework.context.pack.id,
      words: Number(config.words ?? 10),
      showClues: config.showClues !== false,
    });
  }, [homework.context]);

  if (homework.error) {
    return <div className="grid min-h-dvh place-items-center px-4 text-center text-ink-mute">{homework.error}</div>;
  }
  if (!pack || !settings || homework.loading) {
    return <div className="grid min-h-dvh place-items-center text-ink-mute">Tayyorlanmoqda…</div>;
  }

  return (
    <Board
      key={runId}
      pack={pack}
      settings={settings}
      onRestart={() => setRunId((n) => n + 1)}
      onFinish={homework.isHomework ? (score, max) => void homework.submit(score, max) : undefined}
    />
  );
}

export default function KrossvordPlayPage() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center text-ink-mute">…</div>}>
      <Loader />
    </Suspense>
  );
}
