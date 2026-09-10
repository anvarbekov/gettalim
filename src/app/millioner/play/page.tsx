"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Home, PhoneCall, Scissors, Timer, Trophy, Users, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/SiteHeader";
import { useHomework } from "@/hooks/useHomework";
import { useMillioner } from "@/hooks/useMillioner";
import { formatPrize, guaranteedPrize, SAFE_STEPS } from "@/lib/games/millioner/engine";
import { music, getMusicPrefs } from "@/lib/music";
import { sfx } from "@/lib/sound";
import { getMillionerSettings, getPack } from "@/lib/storage";
import type { MillionerSettings, Pack } from "@/lib/types";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function Board({
  pack,
  settings,
  onRestart,
  onFinish,
}: {
  pack: Pack;
  settings: MillionerSettings;
  onRestart: () => void;
  onFinish?: (score: number, max: number) => void;
}) {
  const router = useRouter();
  const game = useMillioner(pack, settings);
  const [muted, setMuted] = useState(!settings.sound);

  useEffect(() => {
    sfx.enabled = !muted;
  }, [muted]);

  useEffect(() => {
    const prefs = getMusicPrefs();
    music.setVolume(prefs.volume);
    if (prefs.track !== "off") music.play(prefs.track);
    return () => music.stop();
  }, []);

  useEffect(() => {
    if (game.phase === "correct") sfx.correct();
    if (game.phase === "wrong") sfx.wrong();
    if (game.phase === "team-done" || game.phase === "finished") sfx.win();
    // Uy vazifasi: bosqichlar soni natija sifatida yoziladi
    if (game.roundOver) onFinish?.(game.step, game.total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.phase]);

  const stateOf = (option: string): "idle" | "picked" | "correct" | "wrong" | "muted" => {
    const isAnswer = option === game.current?.answer;
    if (game.phase === "suspense") return game.chosen === option ? "picked" : "idle";
    if (game.phase === "correct" || game.phase === "wrong" || game.phase === "team-done") {
      if (isAnswer) return "correct";
      if (game.chosen === option) return "wrong";
      return "muted";
    }
    return "idle";
  };

  /* Klaviatura: A B C D yoki 1..4 */
  useEffect(() => {
    if (!settings.keyboard) return;
    const onKey = (e: KeyboardEvent) => {
      if (game.phase !== "question") return;
      const map: Record<string, number> = {
        KeyA: 0, KeyB: 1, KeyC: 2, KeyD: 3,
        Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3,
      };
      const index = map[e.code];
      if (index === undefined) return;
      const option = game.options[index];
      if (option) {
        e.preventDefault();
        sfx.unlock();
        game.actions.pick(option);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settings.keyboard, game]);

  const results = useMemo(() => [...game.results].sort((a, b) => b.prize - a.prize), [game.results]);

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-[#0d1b3e] to-[#050b1c] text-white">
      <header className="mx-auto w-full max-w-[1400px] px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border-2 border-white/20 px-3 py-2 text-sm font-extrabold text-white hover:bg-white/10"
          >
            <Home className="h-4 w-4" /> <span className="hidden sm:inline">Bosh sahifa</span>
          </Link>
          <h1 className="flex-1 truncate text-center text-lg font-extrabold uppercase tracking-wide text-amber-300 sm:text-2xl">
            💰 Kim millioner bo'ladi · {pack.subject}
          </h1>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1400px] flex-1 gap-5 px-4 pb-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex flex-col">
          {/* Jamoa va vaqt */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-sm font-extrabold">
              <Users className="h-4 w-4" /> {game.teamName}
            </span>
            {settings.seconds > 0 && game.phase === "question" ? (
              <span
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xl font-bold tabular-nums",
                  game.timeLeft <= 10 ? "bg-rose-500 text-white" : "bg-white/10",
                )}
              >
                <Timer className="h-5 w-5" /> {game.timeLeft}
              </span>
            ) : null}
            <span className="rounded-xl bg-amber-400/20 px-3.5 py-2 text-sm font-extrabold text-amber-200">
              {game.step + 1}/{game.total} · {formatPrize(game.prize)} so'm
            </span>
          </div>

          {/* Yordamlar */}
          {settings.lifelines && !game.roundOver && game.phase !== "finished" ? (
            <div className="mb-4 flex flex-wrap gap-2">
              <LifelineButton
                icon={<Scissors className="h-4 w-4" />}
                label="50 : 50"
                used={!game.lifelines.fifty}
                onClick={game.actions.useFifty}
              />
              <LifelineButton
                icon={<Users className="h-4 w-4" />}
                label="Zaldan so'rash"
                used={!game.lifelines.audience}
                onClick={game.actions.useAudience}
              />
              <LifelineButton
                icon={<PhoneCall className="h-4 w-4" />}
                label="Qo'ng'iroq"
                used={!game.lifelines.friend}
                onClick={game.actions.useFriend}
              />
            </div>
          ) : null}

          {/* Zal ovozi */}
          {game.audience ? (
            <div className="mb-4 rounded-xl2 border border-white/15 bg-white/5 p-4">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-white/60">Zal ovozi</p>
              <div className="flex h-32 items-stretch gap-3">
                {game.audience.map((percent, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-sm font-bold text-amber-300">{percent}%</span>
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-amber-500 to-amber-300 transition-[height] duration-700"
                        style={{ height: `${Math.max(3, percent)}%` }}
                      />
                    </div>
                    <span className="text-xs font-extrabold text-white/70">{LETTERS[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Do'st javobi */}
          {game.friend ? (
            <p className="mb-4 rounded-xl2 border border-white/15 bg-white/5 px-4 py-3 text-sm italic text-white/90">
              📞 {game.friend}
            </p>
          ) : null}

          {/* Savol */}
          {game.phase !== "finished" && game.current ? (
            <>
              <div className="rounded-xl2 border border-white/15 bg-white/5 px-6 py-6 text-center">
                <p className="text-balance text-2xl font-extrabold leading-snug sm:text-3xl">
                  {game.current.question.prompt}
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {game.options.map((option, i) => {
                  const status = stateOf(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={game.phase !== "question"}
                      onClick={() => {
                        sfx.unlock();
                        game.actions.pick(option);
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-full border-2 px-5 py-4 text-left text-lg font-extrabold transition",
                        status === "idle" && "border-white/25 bg-white/5 hover:bg-white/15",
                        status === "picked" && "animate-pulse border-amber-400 bg-amber-400/25",
                        status === "correct" && "border-emerald-400 bg-emerald-500/30",
                        status === "wrong" && "border-rose-400 bg-rose-500/30",
                        status === "muted" && "border-white/10 bg-white/5 opacity-40",
                      )}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-base text-amber-300">
                        {status === "correct" ? (
                          <Check className="h-5 w-5" strokeWidth={3} />
                        ) : status === "wrong" ? (
                          <X className="h-5 w-5" strokeWidth={3} />
                        ) : (
                          LETTERS[i]
                        )}
                      </span>
                      <span className="leading-tight">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Boshqaruv */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {game.phase === "correct" ? (
                  <button
                    type="button"
                    onClick={game.actions.next}
                    className="rounded-xl2 bg-amber-400 px-6 py-3 text-base font-extrabold text-[#0d1b3e] hover:bg-amber-300"
                  >
                    Keyingi savol →
                  </button>
                ) : null}

                {game.phase === "question" && game.step > 0 ? (
                  <button
                    type="button"
                    onClick={game.actions.quit}
                    className="rounded-xl2 border-2 border-white/25 px-5 py-3 text-sm font-extrabold hover:bg-white/10"
                  >
                    To'xtatish va {formatPrize(game.prize)} so'mni olish
                  </button>
                ) : null}

                {game.roundOver ? (
                  <RoundOver game={game} settings={settings} onRestart={onRestart} />
                ) : null}
              </div>
            </>
          ) : null}

          {/* Yakuniy jadval */}
          {game.phase === "finished" ? (
            <div className="mx-auto w-full max-w-lg text-center">
              <Trophy className="mx-auto h-16 w-16 text-amber-300" />
              <h2 className="mt-3 text-3xl font-extrabold">Natijalar</h2>
              <ol className="mt-6 space-y-2 text-left">
                {results.map((row, i) => (
                  <li
                    key={row.name + i}
                    className={cn(
                      "flex items-center gap-3 rounded-xl2 border-2 px-4 py-3",
                      i === 0 ? "border-amber-400 bg-amber-400/15" : "border-white/15 bg-white/5",
                    )}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-sm font-extrabold">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-extrabold">{row.name}</span>
                    <span className="text-xs text-white/60">{row.step}-bosqich</span>
                    <span className="font-mono text-lg font-bold text-amber-300">{formatPrize(row.prize)}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onRestart}
                  className="rounded-xl2 bg-amber-400 px-6 py-3 font-extrabold text-[#0d1b3e] hover:bg-amber-300"
                >
                  Yana o'ynash
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="rounded-xl2 border-2 border-white/25 px-6 py-3 font-extrabold hover:bg-white/10"
                >
                  Bosh sahifa
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Narvon */}
        <aside className="order-first lg:order-last">
          <ol className="flex flex-row-reverse gap-1 overflow-x-auto rounded-xl2 border border-white/15 bg-white/5 p-2 lg:flex-col lg:overflow-visible">
            {game.ladder.map((prize, i) => {
              const index = game.ladder.length - 1 - i;
              const value = game.ladder[index];
              const active = index === game.step;
              const passed = index < game.step;
              const safe = (SAFE_STEPS as readonly number[]).includes(index);
              void prize;
              return (
                <li
                  key={index}
                  className={cn(
                    "flex shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-sm font-extrabold transition",
                    active && "bg-amber-400 text-[#0d1b3e]",
                    !active && passed && "text-emerald-300",
                    !active && !passed && (safe ? "text-white" : "text-white/55"),
                  )}
                >
                  <span className="tabular-nums">{index + 1}</span>
                  <span className="font-mono">{formatPrize(value)}</span>
                  {safe && !active ? <span className="text-[10px] text-amber-300">◆</span> : null}
                </li>
              );
            })}
          </ol>
          <p className="mt-2 px-1 text-[11px] text-white/50">
            ◆ — kafolatlangan bosqich. Yiqilsangiz shu summa qoladi.
          </p>
        </aside>
      </main>
    </div>
  );
}

function LifelineButton({
  icon,
  label,
  used,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  used: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={used}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-xl2 border-2 px-4 py-2.5 text-sm font-extrabold transition",
        used
          ? "border-white/10 bg-white/5 text-white/30 line-through"
          : "border-amber-400/60 bg-amber-400/15 text-amber-200 hover:bg-amber-400/25",
      )}
    >
      {icon} {label}
    </button>
  );
}

function RoundOver({
  game,
  settings,
  onRestart,
}: {
  game: ReturnType<typeof useMillioner>;
  settings: MillionerSettings;
  onRestart: () => void;
}) {
  const won = game.phase === "team-done";
  return (
    <div className="w-full rounded-xl2 border-2 border-white/20 bg-white/5 p-5 text-center">
      <p className={cn("text-2xl font-extrabold", won ? "text-emerald-300" : "text-rose-300")}>
        {won ? "Ajoyib!" : "Afsus, xato javob"}
      </p>
      <p className="mt-1 text-white/70">
        {game.teamName} · {formatPrize(game.phase === "wrong" ? guaranteedPrize(game.step) : game.prize)} so'm
      </p>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {game.isLastTeam ? (
          <>
            <button
              type="button"
              onClick={() => game.actions.finishAll(game.teamName)}
              className="rounded-xl2 bg-amber-400 px-5 py-2.5 font-extrabold text-[#0d1b3e] hover:bg-amber-300"
            >
              Natijalarni ko'rish
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="rounded-xl2 border-2 border-white/25 px-5 py-2.5 font-extrabold hover:bg-white/10"
            >
              Yangidan
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => game.actions.nextTeam(game.teamName)}
            className="rounded-xl2 bg-amber-400 px-5 py-2.5 font-extrabold text-[#0d1b3e] hover:bg-amber-300"
          >
            {settings.teams[game.team + 1] ?? "Keyingi jamoa"} navbati →
          </button>
        )}
      </div>
    </div>
  );
}

function Loader() {
  const params = useSearchParams();
  const router = useRouter();
  const homeworkId = params.get("vazifa");
  const homework = useHomework(homeworkId);

  const [pack, setPack] = useState<Pack | null>(null);
  const [settings, setSettings] = useState<MillionerSettings | null>(null);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (homeworkId) return;
    const stored = getMillionerSettings();
    const id = params.get("pack") ?? stored.packId;
    const found = getPack(id);
    if (!found) {
      router.replace("/millioner");
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
      ...getMillionerSettings(),
      packId: homework.context.pack.id,
      teamCount: 1,
      teams: ["Men"],
      seconds: Number(config.seconds ?? 45),
      lifelines: config.lifelines !== false,
    });
  }, [homework.context]);

  if (homework.error) {
    return <div className="grid min-h-dvh place-items-center px-4 text-center text-white/70">{homework.error}</div>;
  }
  if (!pack || !settings || homework.loading) {
    return <div className="grid min-h-dvh place-items-center bg-[#0d1b3e] text-white/60">Tayyorlanmoqda…</div>;
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

export default function MillionerPlayPage() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center bg-[#0d1b3e] text-white/60">…</div>}>
      <Loader />
    </Suspense>
  );
}
