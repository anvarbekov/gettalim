"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Home, RotateCcw, Trophy, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/SiteHeader";
import { useXazina } from "@/hooks/useXazina";
import { TILE_INFO } from "@/lib/games/xazina/engine";
import { getMusicPrefs, music } from "@/lib/music";
import { LANE_COLORS } from "@/lib/racers";
import { sfx } from "@/lib/sound";
import { getPack, getXazinaSettings } from "@/lib/storage";
import type { Pack, XazinaSettings } from "@/lib/types";
import { cn, normalizeAnswer } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function Board({ pack, settings, onRestart }: { pack: Pack; settings: XazinaSettings; onRestart: () => void }) {
  const router = useRouter();
  const game = useXazina(pack, settings);
  const teamName = (i: number) => settings.teams[i] ?? `${i + 1}-jamoa`;

  useEffect(() => {
    sfx.enabled = settings.sound;
    const prefs = getMusicPrefs();
    music.setVolume(prefs.volume);
    if (prefs.track !== "off") music.play(prefs.track);
    return () => music.stop();
  }, [settings.sound]);

  useEffect(() => {
    if (game.lastCorrect === true) sfx.correct();
    if (game.lastCorrect === false) sfx.wrong();
  }, [game.lastCorrect, game.moves]);

  useEffect(() => {
    if (game.phase === "finished") sfx.win();
  }, [game.phase]);

  const stateOf = (option: string): "idle" | "correct" | "wrong" | "muted" => {
    if (!game.chosen) return "idle";
    const isAnswer = normalizeAnswer(option) === normalizeAnswer(game.current.answer);
    if (isAnswer) return "correct";
    if (option === game.chosen) return "wrong";
    return "muted";
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-[1500px] px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3 py-2 text-sm font-extrabold text-ink hover:bg-paper"
          >
            <Home className="h-4 w-4" /> <span className="hidden sm:inline">Bosh sahifa</span>
          </Link>
          <h1 className="flex-1 truncate text-center text-lg font-extrabold uppercase tracking-wide text-[#b07e1f] sm:text-2xl">
            🗺️ Xazina xaritasi: {pack.subject}
          </h1>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 pb-6">
        {/* Jamoalar hisobi */}
        <div className="surface mb-4 flex flex-wrap items-center justify-center gap-2.5 px-4 py-3">
          {game.teams.map((team, i) => (
            <span
              key={i}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-extrabold transition",
                game.turn === i && game.phase !== "finished" ? "text-white shadow-lift" : "text-ink-soft",
              )}
              style={{ background: game.turn === i && game.phase !== "finished" ? LANE_COLORS[i] : "#eef2f7" }}
            >
              {teamName(i)}
              <span className="font-mono text-base">
                {team.position + 1}/{settings.length}
              </span>
            </span>
          ))}
          <button
            type="button"
            onClick={onRestart}
            className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3 py-1.5 text-sm font-extrabold text-ink hover:bg-paper"
          >
            <RotateCcw className="h-4 w-4" /> Boshidan
          </button>
        </div>

        {/* Yo'l */}
        <div className="surface mb-4 p-3">
          <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(52px, 1fr))" }}>
            {game.tiles.map((tile) => {
              const here = game.teams
                .map((team, i) => ({ team, i }))
                .filter(({ team }) => team.position === tile.index);
              const info = TILE_INFO[tile.kind];
              return (
                <div
                  key={tile.index}
                  className={cn(
                    "relative flex aspect-square items-center justify-center rounded-xl border-2 text-lg transition",
                    tile.kind === "treasure" ? "border-gold bg-gold/15" : "border-paper-line",
                  )}
                  style={{
                    background:
                      tile.kind === "plain"
                        ? undefined
                        : tile.kind === "treasure"
                          ? undefined
                          : `${info.color}18`,
                  }}
                  title={info.label}
                >
                  <span className="absolute left-1 top-0.5 font-mono text-[9px] text-ink-mute">
                    {tile.index + 1}
                  </span>
                  <span aria-hidden>{info.icon}</span>

                  {here.length ? (
                    <span className="absolute -bottom-1 flex gap-0.5">
                      {here.map(({ i }) => (
                        <span
                          key={i}
                          className="h-3.5 w-3.5 rounded-full border-2 border-white shadow-card"
                          style={{ background: LANE_COLORS[i] }}
                          title={teamName(i)}
                        />
                      ))}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs font-bold text-ink-mute">
            {(["bonus", "trap", "chance", "treasure"] as const).map((kind) => (
              <span key={kind} className="flex items-center gap-1.5">
                <span>{TILE_INFO[kind].icon}</span> {TILE_INFO[kind].label}
              </span>
            ))}
          </div>
        </div>

        {/* Voqea xabari */}
        {game.event ? (
          <p className="animate-pop-in mb-4 rounded-xl2 border-2 border-gold bg-gold/10 px-4 py-3 text-center text-lg font-extrabold text-ink">
            {game.event}
          </p>
        ) : null}

        {/* Savol */}
        {game.phase !== "finished" ? (
          <div className="mx-auto max-w-3xl">
            <div
              className="rounded-xl2 px-6 py-5 text-center"
              style={{ background: `${LANE_COLORS[game.turn]}12` }}
            >
              <p className="text-xs font-extrabold uppercase tracking-wide" style={{ color: LANE_COLORS[game.turn] }}>
                {teamName(game.turn)} navbati
              </p>
              <p className="mt-2 text-balance text-2xl font-extrabold leading-snug text-ink">
                {game.current.question.prompt}
              </p>
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {game.current.options.map((option, i) => {
                const status = stateOf(option);
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={game.phase !== "question"}
                    onClick={() => {
                      sfx.unlock();
                      game.answer(option);
                    }}
                    className={cn(
                      "flex min-h-[3.5rem] items-center gap-3 rounded-xl2 border-2 px-4 py-3 text-left text-lg font-extrabold shadow-key transition",
                      status === "idle" &&
                        "border-paper-line bg-white text-ink hover:bg-paper active:translate-y-[2px] active:shadow-none",
                      status === "correct" && "animate-pop-in border-emerald-500 bg-emerald-50 text-emerald-900",
                      status === "wrong" && "border-rose-500 bg-rose-50 text-rose-900",
                      status === "muted" && "border-paper-line bg-white text-ink-mute opacity-50",
                    )}
                  >
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm text-white"
                      style={{
                        background:
                          status === "correct" ? "#10b981" : status === "wrong" ? "#f43f5e" : LANE_COLORS[game.turn],
                      }}
                    >
                      {status === "correct" ? (
                        <Check className="h-4 w-4" strokeWidth={3} />
                      ) : status === "wrong" ? (
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
          </div>
        ) : null}

        {/* Yakun */}
        {game.phase === "finished" && game.winner !== null ? (
          <div className="fixed inset-0 z-40 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl2 bg-white p-7 text-center shadow-lift">
              <span className="text-5xl">💎</span>
              <h2 className="mt-3 text-2xl font-extrabold text-ink">Xazina topildi!</h2>
              <p className="mt-1 text-xl font-extrabold" style={{ color: LANE_COLORS[game.winner] }}>
                {teamName(game.winner)}
              </p>

              <ol className="mt-5 space-y-1.5 text-left">
                {game.teams
                  .map((team, i) => ({ team, i }))
                  .sort((a, b) => b.team.position - a.team.position)
                  .map(({ team, i }) => (
                    <li key={i} className="flex items-center gap-3 rounded-xl border-2 border-paper-line px-3 py-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ background: LANE_COLORS[i] }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate font-bold text-ink">{teamName(i)}</span>
                      <span className="font-mono text-xs text-ink-mute">
                        {team.correct} ✓ · {team.wrong} ✕
                      </span>
                      <span className="font-mono text-lg font-bold text-ink">{team.position + 1}</span>
                    </li>
                  ))}
              </ol>

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
  const [pack, setPack] = useState<Pack | null>(null);
  const [settings, setSettings] = useState<XazinaSettings | null>(null);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    const stored = getXazinaSettings();
    const id = params.get("pack") ?? stored.packId;
    const found = getPack(id);
    if (!found) {
      router.replace("/xazina");
      return;
    }
    setPack(found);
    setSettings({ ...stored, packId: found.id });
  }, [params, router]);

  if (!pack || !settings) {
    return <div className="grid min-h-dvh place-items-center text-ink-mute">Tayyorlanmoqda…</div>;
  }

  return <Board key={runId} pack={pack} settings={settings} onRestart={() => setRunId((n) => n + 1)} />;
}

export default function XazinaPlayPage() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center text-ink-mute">…</div>}>
      <Loader />
    </Suspense>
  );
}
