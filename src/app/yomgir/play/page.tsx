"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart, Home, Maximize, Music, Pause, Play, RotateCcw, Timer as TimerIcon, Volume2, VolumeX } from "lucide-react";
import { MusicPanel } from "@/components/MusicPanel";
import { RainField } from "@/components/RainField";
import { LanguageSwitcher } from "@/components/SiteHeader";
import { WinnerOverlay } from "@/components/WinnerOverlay";
import { useI18n } from "@/components/providers";
import { useHomework } from "@/hooks/useHomework";
import { useRain } from "@/hooks/useRain";
import { getGameDef } from "@/lib/games/registry";
import { getMusicPrefs, music } from "@/lib/music";
import { LANE_COLORS } from "@/lib/racers";
import { sfx } from "@/lib/sound";
import { getPack, getRainSettings, saveMatch } from "@/lib/storage";
import type { Pack, RainSettings } from "@/lib/types";
import { cn, formatClock, uid } from "@/lib/utils";

function RainBoard({
  pack,
  settings,
  onRestart,
  onFinish,
}: {
  pack: Pack;
  settings: RainSettings;
  onRestart: () => void;
  onFinish?: (score: number, max: number) => void;
}) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { state, actions } = useRain(pack, settings);
  const [muted, setMuted] = useState(!settings.sound);
  const [musicOpen, setMusicOpen] = useState(false);
  const saved = useRef(false);

  const teams = settings.teams.slice(0, settings.teamCount);

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
    music.duck(state.status !== "running");
  }, [state.status]);

  useEffect(() => {
    if (state.status !== "finished") return;
    sfx.win();
    // Uy vazifasi: to'plangan ball va urinishlar soni jurnalga yoziladi
    const me = state.teams[0];
    if (me) onFinish?.(me.score, me.correct + me.wrong + me.missed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  useEffect(() => {
    if (state.status === "running" && settings.duration > 0 && state.timeLeft > 0 && state.timeLeft <= 10) {
      sfx.tick();
    }
  }, [state.timeLeft, state.status, settings.duration]);

  const hit = useCallback(
    (team: number, choice: string, ok: boolean) => {
      sfx.unlock();
      if (ok) sfx.correct();
      else sfx.wrong();
      actions.hit(team, choice, ok);
    },
    [actions],
  );

  const miss = useCallback(
    (team: number) => {
      sfx.wrong();
      actions.miss(team);
    },
    [actions],
  );

  /* Klaviatura: 1-jamoa 1..4 · 2-jamoa NumPad 1..4 */
  useEffect(() => {
    if (!settings.keyboard) return;
    const onKey = (e: KeyboardEvent) => {
      if (state.status === "finished") return;
      const { code } = e;
      const pick = (team: number, index: number) => {
        e.preventDefault();
        if (state.status !== "running") return;
        const data = state.teams[team];
        if (!data || data.feedback || data.lives <= 0) return;
        const option = data.current.options[index];
        if (option) {
          const ok = option.trim().toLowerCase() === data.current.answer.trim().toLowerCase();
          hit(team, option, ok);
        }
      };
      if (/^Digit[1-4]$/.test(code)) return pick(0, Number(code.slice(5)) - 1);
      if (/^Numpad[1-4]$/.test(code) && settings.teamCount > 1) return pick(1, Number(code.slice(6)) - 1);
      if (code === "Space") {
        e.preventDefault();
        if (state.status === "running") actions.pause();
        else actions.resume();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settings.keyboard, settings.teamCount, state, actions, hit]);

  const ranking = useMemo(
    () =>
      teams
        .map((name, index) => ({ name, index, score: state.teams[index]?.score ?? 0 }))
        // G'olib — ball ko'p bo'lgan jamoa; teng bo'lsa jonlari qolgani ustun
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (state.loser === a.index) return 1;
          if (state.loser === b.index) return -1;
          return 0;
        }),
    [teams, state.teams, state.loser],
  );

  useEffect(() => {
    if (state.status !== "finished" || saved.current) return;
    saved.current = true;
    const first = ranking[0];
    const second = ranking[1];
    saveMatch({
      id: uid("rain"),
      packId: pack.id,
      packTitle: pack.title,
      subject: pack.subject,
      teamA: first?.name ?? "—",
      teamB: second?.name ?? "—",
      scoreA: first?.score ?? 0,
      scoreB: second?.score ?? 0,
      winner: "A",
      statsA: {
        correct: state.teams[first?.index ?? 0]?.correct ?? 0,
        wrong: state.teams[first?.index ?? 0]?.wrong ?? 0,
        score: first?.score ?? 0,
        bestStreak: state.teams[first?.index ?? 0]?.bestStreak ?? 0,
      },
      statsB: {
        correct: state.teams[second?.index ?? 0]?.correct ?? 0,
        wrong: state.teams[second?.index ?? 0]?.wrong ?? 0,
        score: second?.score ?? 0,
        bestStreak: state.teams[second?.index ?? 0]?.bestStreak ?? 0,
      },
      durationSec: state.elapsed,
      playedAt: new Date().toISOString(),
    });
  }, [state, pack, ranking]);

  const toggleFullscreen = () => {
    if (typeof document === "undefined") return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => undefined);
  };

  const winner = ranking[0];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-[1600px] px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3 py-2 text-sm font-extrabold text-ink hover:bg-paper"
          >
            <Home className="h-4 w-4" /> <span className="hidden sm:inline">{t("nav.home")}</span>
          </Link>
          <h1 className="flex-1 truncate text-center text-lg font-extrabold uppercase tracking-wide text-[#0f9b8e] sm:text-2xl">
            🌧️ {getGameDef("yomgir").nomi[lang]}: {pack.subject}
          </h1>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 pb-4">
        {/* Soat va boshqaruv */}
        <div className="surface mb-3 flex flex-wrap items-center justify-center gap-2 px-4 py-2">
          <div className="flex items-center gap-2 rounded-xl bg-paper px-3 py-1.5">
            <TimerIcon className="h-4 w-4 text-ink-mute" />
            <span
              className={cn(
                "font-mono text-lg font-bold tabular-nums",
                settings.duration > 0 && state.timeLeft <= 10 ? "text-teamB" : "text-ink",
              )}
            >
              {settings.duration > 0 ? formatClock(state.timeLeft) : formatClock(state.elapsed)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => (state.status === "running" ? actions.pause() : actions.resume())}
            className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3 py-1.5 text-sm font-extrabold text-ink hover:bg-paper"
          >
            {state.status === "running" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {state.status === "running" ? t("game.pause") : t("game.resume")}
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3 py-1.5 text-sm font-extrabold text-ink hover:bg-paper"
          >
            <RotateCcw className="h-4 w-4" /> {t("game.restart")}
          </button>
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="grid h-9 w-9 place-items-center rounded-xl border-2 border-paper-line bg-white text-ink hover:bg-paper"
            aria-label={t("setup.sound")}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMusicOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-xl border-2 border-paper-line bg-white text-[#0f9b8e] hover:bg-paper"
            aria-label={t("music.open")}
          >
            <Music className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden h-9 w-9 place-items-center rounded-xl border-2 border-paper-line bg-white text-ink hover:bg-paper sm:grid"
            aria-label="Fullscreen"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>

        {/* Maydonlar */}
        <div
          className={cn(
            "relative grid flex-1 gap-3",
            settings.teamCount === 2 ? "lg:grid-cols-2" : "mx-auto w-full max-w-3xl",
          )}
        >
          {teams.map((name, index) => {
            const team = state.teams[index];
            const color = LANE_COLORS[index % LANE_COLORS.length];
            const out = team.lives <= 0;
            return (
              <section
                key={index}
                className="surface flex flex-col overflow-hidden"
                aria-label={name}
              >
                <header
                  className="flex items-center justify-between gap-2 px-4 py-2 text-white"
                  style={{ background: color }}
                >
                  <h2 className="truncate text-base font-extrabold sm:text-lg">{name}</h2>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: settings.lives }, (_, i) => (
                        <Heart
                          key={i}
                          className={cn("h-4 w-4", i < team.lives ? "text-white" : "text-white/25")}
                          fill="currentColor"
                        />
                      ))}
                    </span>
                    {team.streak > 1 ? (
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-extrabold">
                        ×{team.streak}
                      </span>
                    ) : null}
                    <span className="grid h-8 min-w-8 place-items-center rounded-full bg-white px-2 font-mono text-base font-extrabold text-ink">
                      {team.score}
                    </span>
                  </div>
                </header>

                {/* Savol */}
                <div className="px-4 py-3 text-center" style={{ background: `${color}12` }}>
                  <p className="text-balance text-lg font-extrabold leading-snug sm:text-xl" style={{ color }}>
                    {team.current.question.prompt}
                  </p>
                </div>

                {/* Tushayotgan variantlar */}
                {out ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
                    <Heart className="h-8 w-8 text-teamB" />
                    <p className="text-lg font-extrabold text-ink">{t("rain.out")}</p>
                    <p className="font-mono text-3xl font-bold" style={{ color }}>
                      {team.score}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col p-3">
                    <RainField
                      key={team.current.key}
                      item={team.current}
                      color={color}
                      level={team.level}
                      tempo={settings.tempo}
                      paused={state.status !== "running"}
                      feedback={team.feedback}
                      compact={settings.teamCount > 1}
                      onHit={(choice, ok) => hit(index, choice, ok)}
                      onMiss={() => miss(index)}
                    />
                    <p className="mt-2 text-center text-[11px] font-bold text-ink-mute">
                      {t("rain.level")} {team.level + 1} · {team.correct} ✓ · {team.missed} ⤓
                    </p>
                  </div>
                )}
              </section>
            );
          })}

          {state.status === "countdown" ? (
            <div className="absolute inset-0 grid place-items-center rounded-xl2 bg-white/85 backdrop-blur-sm">
              <div className="text-center">
                <p className="eyebrow">{t("game.ready")}</p>
                <p key={state.countdown} className="animate-pop-in font-mono text-7xl font-bold text-ink">
                  {state.countdown}
                </p>
              </div>
            </div>
          ) : null}

          {state.status === "paused" ? (
            <div className="absolute inset-0 grid place-items-center rounded-xl2 bg-white/70 backdrop-blur-[2px]">
              <span className="rounded-full bg-ink px-5 py-2 text-sm font-extrabold text-white">
                {t("game.paused")}
              </span>
            </div>
          ) : null}
        </div>

        <p className="mt-2 text-center text-xs text-ink-mute">{t("rain.rules")}</p>
      </main>

      <MusicPanel open={musicOpen} onClose={() => setMusicOpen(false)} />

      {state.status === "finished" && winner ? (
        <WinnerOverlay
          winner="A"
          aName={winner.name}
          bName={ranking[1]?.name ?? "—"}
          accent={LANE_COLORS[winner.index % LANE_COLORS.length]}
          standings={ranking.map((row, i) => ({
            place: i + 1,
            name: row.name,
            steps: row.score,
            color: LANE_COLORS[row.index % LANE_COLORS.length],
            correct: state.teams[row.index]?.correct ?? 0,
            wrong: (state.teams[row.index]?.wrong ?? 0) + (state.teams[row.index]?.missed ?? 0),
          }))}
          statsA={{
            score: winner.score,
            correct: state.teams[winner.index]?.correct ?? 0,
            wrong: state.teams[winner.index]?.wrong ?? 0,
            bestStreak: state.teams[winner.index]?.bestStreak ?? 0,
          }}
          statsB={{ score: 0, correct: 0, wrong: 0, bestStreak: 0 }}
          elapsed={state.elapsed}
          labels={{
            winner: t("game.winner"),
            draw: t("game.draw"),
            again: t("game.again"),
            home: t("nav.home"),
            correct: t("game.correct"),
            wrong: t("game.wrong"),
            streak: t("game.streak"),
            steps: t("rain.points"),
            result: t("game.result"),
          }}
          onAgain={onRestart}
          onHome={() => router.push("/")}
        />
      ) : null}
    </div>
  );
}

function RainLoader() {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const homeworkId = params.get("vazifa");
  const homework = useHomework(homeworkId);

  const [pack, setPack] = useState<Pack | null>(null);
  const [settings, setSettings] = useState<RainSettings | null>(null);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (homeworkId) return;
    const stored = getRainSettings();
    const id = params.get("pack") ?? stored.packId;
    const found = getPack(id);
    if (!found) {
      router.replace("/yomgir");
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
      ...getRainSettings(),
      packId: homework.context.pack.id,
      teamCount: 1,
      teams: ["Men"],
      lives: Number(config.lives ?? 3),
      duration: Number(config.duration ?? 300),
      tempo: (config.tempo as RainSettings["tempo"]) ?? "normal",
    });
  }, [homework.context]);

  if (homework.error) {
    return <div className="grid min-h-dvh place-items-center px-4 text-center text-ink-mute">{homework.error}</div>;
  }
  if (!pack || !settings || homework.loading) {
    return <div className="grid min-h-dvh place-items-center text-ink-mute">{t("game.ready")}</div>;
  }

  return (
    <RainBoard
      key={runId}
      pack={pack}
      settings={settings}
      onRestart={() => setRunId((n) => n + 1)}
      onFinish={homework.isHomework ? (score, max) => void homework.submit(score, max) : undefined}
    />
  );
}

export default function RainPlayPage() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center text-ink-mute">…</div>}>
      <RainLoader />
    </Suspense>
  );
}
