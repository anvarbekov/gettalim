"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Home,
  Maximize,
  Minus,
  Music,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Timer as TimerIcon,
  Volume2,
  VolumeX,
} from "lucide-react";
import { MusicPanel } from "@/components/MusicPanel";
import { RacePanel } from "@/components/RacePanel";
import { RaceTrack } from "@/components/RaceTrack";
import { LanguageSwitcher } from "@/components/SiteHeader";
import { WinnerOverlay } from "@/components/WinnerOverlay";
import { useI18n } from "@/components/providers";
import { getGameDef } from "@/lib/games/registry";
import { useRace } from "@/hooks/useRace";
import { getMusicPrefs, music } from "@/lib/music";
import { LANE_COLORS } from "@/lib/racers";
import { sfx } from "@/lib/sound";
import { getPack, getRaceSettings, saveMatch } from "@/lib/storage";
import type { Pack, RaceSettings } from "@/lib/types";
import { cn, formatClock, uid } from "@/lib/utils";

function RaceBoard({
  pack,
  settings,
  onRestart,
}: {
  pack: Pack;
  settings: RaceSettings;
  onRestart: () => void;
}) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { state, actions } = useRace(pack, settings);
  const [muted, setMuted] = useState(!settings.sound);
  const [zoom, setZoom] = useState(1);
  const [musicOpen, setMusicOpen] = useState(false);
  const saved = useRef(false);
  const lastBoost = useRef<number | null>(null);

  const teams = settings.teams.slice(0, settings.teamCount);

  /* --------------------------- ovoz --------------------------- */
  useEffect(() => {
    sfx.enabled = !muted;
  }, [muted]);

  useEffect(() => {
    if (!state.boost || state.boost.n === lastBoost.current) return;
    lastBoost.current = state.boost.n;
    sfx.correct();
  }, [state.boost]);

  useEffect(() => {
    if (state.status === "finished") sfx.win();
  }, [state.status]);

  useEffect(() => {
    if (state.status === "running" && settings.duration > 0 && state.timeLeft > 0 && state.timeLeft <= 10) {
      sfx.tick();
    }
  }, [state.timeLeft, state.status, settings.duration]);

  useEffect(() => {
    const prefs = getMusicPrefs();
    music.setVolume(prefs.volume);
    if (prefs.track !== "off") music.play(prefs.track);
    return () => music.stop();
  }, []);

  useEffect(() => {
    music.duck(state.status !== "running");
  }, [state.status]);

  /* ------------------------ natijani saqlash ------------------ */
  const ranking = useMemo(() => {
    return teams
      .map((name, lane) => ({ name, lane, steps: state.racers[lane]?.steps ?? 0, place: state.racers[lane]?.place }))
      .sort((a, b) => (a.place ?? 99) - (b.place ?? 99) || b.steps - a.steps);
  }, [teams, state.racers]);

  useEffect(() => {
    if (state.status !== "finished" || saved.current) return;
    saved.current = true;
    const first = ranking[0];
    const second = ranking[1];
    saveMatch({
      id: uid("race"),
      packId: pack.id,
      packTitle: pack.title,
      subject: pack.subject,
      teamA: first?.name ?? "—",
      teamB: second?.name ?? "—",
      scoreA: first?.steps ?? 0,
      scoreB: second?.steps ?? 0,
      winner: "A",
      statsA: {
        correct: state.racers[first?.lane ?? 0]?.correct ?? 0,
        wrong: state.racers[first?.lane ?? 0]?.wrong ?? 0,
        score: first?.steps ?? 0,
        bestStreak: state.racers[first?.lane ?? 0]?.bestStreak ?? 0,
      },
      statsB: {
        correct: state.racers[second?.lane ?? 1]?.correct ?? 0,
        wrong: state.racers[second?.lane ?? 1]?.wrong ?? 0,
        score: second?.steps ?? 0,
        bestStreak: state.racers[second?.lane ?? 1]?.bestStreak ?? 0,
      },
      durationSec: state.elapsed,
      playedAt: new Date().toISOString(),
    });
  }, [state, pack, ranking]);

  /* -------------------------- klaviatura ---------------------- */
  const answer = useCallback(
    (lane: number, choice: string) => {
      sfx.unlock();
      actions.answer(lane, choice);
    },
    [actions],
  );

  useEffect(() => {
    if (!settings.keyboard) return;
    const onKey = (e: KeyboardEvent) => {
      if (state.status === "finished") return;
      const { code } = e;
      const pick = (lane: number, index: number) => {
        e.preventDefault();
        if (state.status !== "running") return;
        const racer = state.racers[lane];
        if (!racer || racer.feedback || racer.reviewIndex !== null || racer.place !== null) return;
        const option = racer.current.options[index];
        if (option) answer(lane, option);
      };
      // 1-jamoa: 1..4 · 2-jamoa: Q W E R · 3-jamoa: A S D F · 4-jamoa: NumPad 1..4
      const rows: Record<string, [number, number]> = {
        Digit1: [0, 0], Digit2: [0, 1], Digit3: [0, 2], Digit4: [0, 3],
        KeyQ: [1, 0], KeyW: [1, 1], KeyE: [1, 2], KeyR: [1, 3],
        KeyA: [2, 0], KeyS: [2, 1], KeyD: [2, 2], KeyF: [2, 3],
        Numpad1: [3, 0], Numpad2: [3, 1], Numpad3: [3, 2], Numpad4: [3, 3],
      };
      const hit = rows[code];
      if (hit && hit[0] < settings.teamCount) return pick(hit[0], hit[1]);
      if (code === "Space") {
        e.preventDefault();
        if (state.status === "running") actions.pause();
        else actions.resume();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settings.keyboard, settings.teamCount, state, actions, answer]);

  const toggleFullscreen = () => {
    if (typeof document === "undefined") return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => undefined);
  };

  const disabled = state.status !== "running";
  const compact = settings.teamCount > 2;
  const labels = {
    hint: t("game.hint"),
    reviewBack: t("game.reviewBack"),
    reviewLive: t("game.reviewLive"),
    reviewTitle: t("game.reviewTitle"),
    yourAnswer: t("game.yourAnswer"),
    finished: t("race.done"),
  };

  const winner = ranking[0];

  return (
    <div className="flex min-h-dvh flex-col pb-20 sm:pb-6" style={{ zoom } as React.CSSProperties}>
      <header className="mx-auto w-full max-w-[1600px] px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3 py-2 text-sm font-extrabold text-ink hover:bg-paper"
          >
            <Home className="h-4 w-4" /> <span className="hidden sm:inline">{t("nav.home")}</span>
          </Link>
          <h1 className="flex-1 truncate text-center text-lg font-extrabold uppercase tracking-wide text-gold sm:text-2xl">
            🏁 {getGameDef("poyga").nomi[lang]}: {pack.subject}
          </h1>
          <LanguageSwitcher />
        </div>
        <p className="mx-auto mt-1.5 max-w-3xl text-balance text-center text-xs text-ink-mute sm:text-sm">
          {t("race.rules")}
        </p>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4">
        {/* Soat */}
        <div className="surface mb-3 flex items-center justify-center gap-4 px-4 py-2">
          <TimerIcon className="h-4 w-4 text-ink-mute" />
          <span
            className={cn(
              "font-mono text-xl font-bold tabular-nums",
              settings.duration > 0 && state.timeLeft <= 10 ? "text-teamB" : "text-ink",
            )}
          >
            {settings.duration > 0 ? formatClock(state.timeLeft) : formatClock(state.elapsed)}
          </span>
        </div>

        {/* Trek */}
        <div className="relative">
          <RaceTrack
            teams={teams}
            steps={state.racers.map((r) => r.steps)}
            distance={settings.distance}
            racer={settings.racer}
            boost={state.boost}
            places={state.racers.map((r) => r.place)}
            labels={{ start: t("race.start"), finish: t("race.finish"), steps: t("race.steps") }}
          />
          {state.status === "countdown" ? (
            <div className="absolute inset-0 grid place-items-center rounded-xl2 bg-white/85 backdrop-blur-sm">
              <div className="text-center">
                <p className="eyebrow">{t("game.ready")}</p>
                <p key={state.countdown} className="animate-pop-in font-mono text-6xl font-bold text-ink">
                  {state.countdown}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Boshqaruv */}
        <div className="my-3 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => (state.status === "running" ? actions.pause() : actions.resume())}
            className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-4 py-2 text-sm font-extrabold text-ink hover:bg-paper"
          >
            {state.status === "running" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {state.status === "running" ? t("game.pause") : t("game.resume")}
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-4 py-2 text-sm font-extrabold text-ink hover:bg-paper"
          >
            <RotateCcw className="h-4 w-4" /> {t("game.restart")}
          </button>
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3 py-2 text-sm font-extrabold text-ink hover:bg-paper"
            aria-label={t("setup.sound")}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Jamoa panellari */}
        <div
          className={cn(
            "grid gap-3",
            settings.teamCount === 2 && "sm:grid-cols-2",
            settings.teamCount === 3 && "sm:grid-cols-2 lg:grid-cols-3",
            settings.teamCount === 4 && "sm:grid-cols-2 xl:grid-cols-4",
          )}
        >
          {teams.map((name, lane) => (
            <RacePanel
              key={lane}
              lane={lane}
              name={name}
              color={LANE_COLORS[lane % LANE_COLORS.length]}
              racer={state.racers[lane]}
              compact={compact}
              disabled={disabled}
              allowReview={settings.allowReview}
              labels={labels}
              onAnswer={(choice) => answer(lane, choice)}
              onReviewBack={() => actions.reviewBack(lane)}
              onReviewForward={() => actions.reviewForward(lane)}
            />
          ))}
        </div>
      </main>

      <div className="fixed bottom-4 left-4 z-20 hidden items-center gap-1 rounded-xl2 border border-paper-line bg-white/95 p-1.5 shadow-lift backdrop-blur sm:flex">
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-lg hover:bg-paper"
          onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.1).toFixed(2))))}
          aria-label="−"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-12 text-center font-mono text-sm font-bold tabular-nums">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-lg hover:bg-paper"
          onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
          aria-label="+"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-lg hover:bg-paper"
          onClick={toggleFullscreen}
          aria-label="Fullscreen"
        >
          <Maximize className="h-4 w-4" />
        </button>
        <span className="mx-0.5 h-6 w-px bg-paper-line" />
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-lg text-gold hover:bg-paper"
          onClick={() => setMusicOpen(true)}
          aria-label={t("music.open")}
          title={t("music.open")}
        >
          <Music className="h-4 w-4" />
        </button>
      </div>

      <MusicPanel open={musicOpen} onClose={() => setMusicOpen(false)} />

      {state.status === "finished" && winner ? (
        <WinnerOverlay
          winner="A"
          aName={winner.name}
          bName={ranking[1]?.name ?? "—"}
          accent={LANE_COLORS[winner.lane % LANE_COLORS.length]}
          standings={ranking.map((r, i) => ({
            place: i + 1,
            name: r.name,
            steps: r.steps,
            color: LANE_COLORS[r.lane % LANE_COLORS.length],
            correct: state.racers[r.lane]?.correct ?? 0,
            wrong: state.racers[r.lane]?.wrong ?? 0,
          }))}
          statsA={{
            score: winner.steps,
            correct: state.racers[winner.lane]?.correct ?? 0,
            wrong: state.racers[winner.lane]?.wrong ?? 0,
            bestStreak: state.racers[winner.lane]?.bestStreak ?? 0,
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
            steps: t("game.steps"),
            result: t("game.result"),
          }}
          onAgain={onRestart}
          onHome={() => router.push("/")}
        />
      ) : null}
    </div>
  );
}

function RaceLoader() {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const [pack, setPack] = useState<Pack | null>(null);
  const [settings, setSettings] = useState<RaceSettings | null>(null);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    const stored = getRaceSettings();
    const id = params.get("pack") ?? stored.packId;
    const found = getPack(id);
    if (!found) {
      router.replace("/poyga");
      return;
    }
    setPack(found);
    setSettings({ ...stored, packId: found.id });
  }, [params, router]);

  if (!pack || !settings) {
    return <div className="grid min-h-dvh place-items-center text-ink-mute">{t("game.ready")}</div>;
  }

  return <RaceBoard key={runId} pack={pack} settings={settings} onRestart={() => setRunId((n) => n + 1)} />;
}

export default function RacePlayPage() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center text-ink-mute">…</div>}>
      <RaceLoader />
    </Suspense>
  );
}
