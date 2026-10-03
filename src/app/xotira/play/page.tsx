"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Home, RotateCcw, Timer, Trophy } from "lucide-react";
import { LanguageSwitcher } from "@/components/SiteHeader";
import { useHomework } from "@/hooks/useHomework";
import { useXotira } from "@/hooks/useXotira";
import { SIZE_INFO } from "@/lib/games/xotira/engine";
import { getMusicPrefs, music } from "@/lib/music";
import { LANE_COLORS } from "@/lib/racers";
import { sfx } from "@/lib/sound";
import { getPack, getXotiraSettings } from "@/lib/storage";
import type { Pack, XotiraSettings } from "@/lib/types";
import { cn, formatClock } from "@/lib/utils";

function Board({
  pack,
  settings,
  onRestart,
  onFinish,
}: {
  pack: Pack;
  settings: XotiraSettings;
  onRestart: () => void;
  onFinish?: (score: number, max: number) => void;
}) {
  const router = useRouter();
  const game = useXotira(pack, settings);
  const info = SIZE_INFO[settings.size];

  useEffect(() => {
    sfx.enabled = settings.sound;
    const prefs = getMusicPrefs();
    music.setVolume(prefs.volume);
    if (prefs.track !== "off") music.play(prefs.track);
    return () => music.stop();
  }, [settings.sound]);

  useEffect(() => {
    if (game.reveal) sfx.correct();
  }, [game.reveal]);

  useEffect(() => {
    if (!game.finished) return;
    sfx.win();
    // Uy vazifasi bo'lsa — natija jurnalga yoziladi
    onFinish?.(game.matched.size, game.totalPairs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.finished]);

  const teamName = (i: number) => settings.teams[i] ?? `${i + 1}-jamoa`;

  if (game.cards.length === 0) {
    return (
      <div className="grid min-h-dvh place-items-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Bu paketdan juftlik tuzib bo'lmadi</h1>
          <p className="mt-2 text-ink-mute">Savollari matnli paket tanlang.</p>
          <Link href="/xotira" className="mt-4 inline-block font-bold text-teamA hover:underline">
            Sozlamalarga qaytish →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-[1400px] px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3 py-2 text-sm font-extrabold text-ink hover:bg-paper"
          >
            <Home className="h-4 w-4" /> <span className="hidden sm:inline">Bosh sahifa</span>
          </Link>
          <h1 className="flex-1 truncate text-center text-lg font-extrabold uppercase tracking-wide text-teamB sm:text-2xl">
            🧠 Xotira jufti: {pack.subject}
          </h1>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-6">
        {/* Hisob */}
        <div className="surface mb-4 flex flex-wrap items-center justify-center gap-3 px-4 py-3">
          <span className="flex items-center gap-2 rounded-xl bg-paper px-3 py-1.5 font-mono text-lg font-bold tabular-nums text-ink">
            <Timer className="h-4 w-4 text-ink-mute" /> {formatClock(game.elapsed)}
          </span>
          <span className="rounded-xl bg-paper px-3 py-1.5 text-sm font-extrabold text-ink-soft">
            {game.matched.size} / {game.totalPairs} juft
          </span>
          <span className="rounded-xl bg-paper px-3 py-1.5 text-sm font-extrabold text-ink-soft">
            {game.moves} urinish
          </span>

          {settings.teamCount > 1
            ? game.scores.map((score, i) => (
                <span
                  key={i}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-sm font-extrabold transition",
                    game.turn === i && !game.finished ? "text-white" : "text-ink-soft",
                  )}
                  style={{
                    background: game.turn === i && !game.finished ? LANE_COLORS[i] : "#eef2f7",
                  }}
                >
                  {teamName(i)}
                  <span className="font-mono text-base">{score}</span>
                </span>
              ))
            : null}

          <button
            type="button"
            onClick={onRestart}
            className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3 py-1.5 text-sm font-extrabold text-ink hover:bg-paper"
          >
            <RotateCcw className="h-4 w-4" /> Boshidan
          </button>
        </div>

        {/* To'r */}
        <div
          className="mx-auto grid gap-2.5 sm:gap-3"
          style={{ gridTemplateColumns: `repeat(${info.cols}, minmax(0, 1fr))`, maxWidth: info.cols * 200 }}
        >
          {game.cards.map((card) => {
            const open = game.isOpen(card);
            const done = game.matched.has(card.pairId);
            return (
              <button
                key={card.id}
                type="button"
                disabled={open || game.open.length >= 2}
                onClick={() => {
                  sfx.unlock();
                  game.flip(card.id);
                }}
                className="group relative aspect-[4/3] w-full [perspective:900px]"
                aria-label={open ? card.text : "Yopiq kartochka"}
              >
                <span
                  className={cn(
                    "absolute inset-0 rounded-xl2 transition-transform duration-500 [transform-style:preserve-3d]",
                    open && "[transform:rotateY(180deg)]",
                  )}
                >
                  {/* Orqa tomon */}
                  <span
                    className="absolute inset-0 grid place-items-center rounded-xl2 border-2 border-paper-line bg-gradient-to-br from-white to-paper text-3xl shadow-card [backface-visibility:hidden] group-hover:brightness-95"
                    aria-hidden
                  >
                    <span className="opacity-30">?</span>
                  </span>

                  {/* Old tomon */}
                  <span
                    className={cn(
                      "absolute inset-0 flex items-center justify-center rounded-xl2 border-2 p-2 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]",
                      done
                        ? "border-emerald-400 bg-emerald-50"
                        : card.kind === "term"
                          ? "border-teamA/40 bg-teamA/10"
                          : "border-teamB/40 bg-teamB/10",
                    )}
                  >
                    <span
                      className={cn(
                        "text-pretty font-extrabold leading-tight text-ink",
                        card.kind === "term" ? "text-sm sm:text-base" : "text-[11px] sm:text-xs",
                      )}
                    >
                      {card.text}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Juft topilganda — o'quv oynasi */}
        {game.reveal ? (
          <div className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
            <div className="animate-pop-in max-w-xl rounded-xl2 border-2 border-emerald-400 bg-white px-6 py-4 text-center shadow-lift">
              <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-600">Juftlik topildi</p>
              <p className="mt-1 text-xl font-extrabold text-ink">{game.reveal.term}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{game.reveal.definition}</p>
            </div>
          </div>
        ) : null}

        {/* Yakun */}
        {game.finished ? (
          <div className="fixed inset-0 z-40 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl2 bg-white p-7 text-center shadow-lift">
              <Trophy className="mx-auto h-14 w-14 text-gold" />
              <h2 className="mt-3 text-2xl font-extrabold text-ink">Barcha juftliklar topildi!</h2>

              {settings.teamCount > 1 ? (
                <>
                  <p className="mt-2 text-lg font-extrabold" style={{ color: LANE_COLORS[Math.max(0, game.winner)] }}>
                    {game.winner >= 0 ? `G'olib: ${teamName(game.winner)}` : "Durrang"}
                  </p>
                  <ol className="mt-4 space-y-1.5 text-left">
                    {game.scores.map((score, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 rounded-xl border-2 border-paper-line px-3 py-2"
                      >
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ background: LANE_COLORS[i] }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate font-bold text-ink">{teamName(i)}</span>
                        <span className="font-mono text-lg font-bold text-ink">{score}</span>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <p className="mt-2 text-ink-soft">
                  {formatClock(game.elapsed)} · {game.moves} urinish
                </p>
              )}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={onRestart}
                  className="rounded-xl2 bg-ink px-5 py-3 font-extrabold text-white hover:bg-ink-soft"
                >
                  Yana o'ynash
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
  const [settings, setSettings] = useState<XotiraSettings | null>(null);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (homeworkId) return;
    const stored = getXotiraSettings();
    const id = params.get("pack") ?? stored.packId;
    const found = getPack(id);
    if (!found) {
      router.replace("/xotira");
      return;
    }
    setPack(found);
    setSettings({ ...stored, packId: found.id });
  }, [params, router, homeworkId]);

  /* Uy vazifasi: paket bulutdan, sozlamalar topshiriqdan */
  useEffect(() => {
    if (!homework.context) return;
    const config = homework.context.assignment.config ?? {};
    setPack(homework.context.pack);
    setSettings({
      ...getXotiraSettings(),
      packId: homework.context.pack.id,
      size: (config.size as XotiraSettings["size"]) ?? "4x4",
      teamCount: 1,
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

export default function XotiraPlayPage() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center text-ink-mute">…</div>}>
      <Loader />
    </Suspense>
  );
}
