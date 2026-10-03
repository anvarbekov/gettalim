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
import { Arena } from "@/components/Arena";
import { MusicPanel } from "@/components/MusicPanel";
import { LanguageSwitcher } from "@/components/SiteHeader";
import { TeamPanel } from "@/components/TeamPanel";
import { WinnerOverlay } from "@/components/WinnerOverlay";
import { useI18n } from "@/components/providers";
import { useMatch, type TeamKey } from "@/hooks/useMatch";
import { getCharacter, type CharacterModel } from "@/lib/characters";
import { getMusicPrefs, music } from "@/lib/music";
import { sfx } from "@/lib/sound";
import { getPack, getSettings, saveMatch } from "@/lib/storage";
import { isCloudEnabled, pushMatch } from "@/lib/supabase";
import type { MatchSettings, Pack } from "@/lib/types";
import { cn, formatClock, uid } from "@/lib/utils";

function GameBoard({
  pack,
  settings,
  charA,
  charB,
  onRestart,
}: {
  pack: Pack;
  settings: MatchSettings;
  charA: CharacterModel;
  charB: CharacterModel;
  onRestart: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { state, actions } = useMatch(pack, settings);
  const [muted, setMuted] = useState(!settings.sound);
  const [zoom, setZoom] = useState(1);
  const [musicOpen, setMusicOpen] = useState(false);
  const saved = useRef(false);

  /* --------------------------- ovoz --------------------------- */
  useEffect(() => {
    sfx.enabled = !muted;
  }, [muted]);

  useEffect(() => {
    if (!state.event) return;
    if (state.event.kind === "correct") sfx.correct();
    else sfx.wrong();
  }, [state.event]);

  useEffect(() => {
    if (state.status === "finished") sfx.win();
  }, [state.status]);

  useEffect(() => {
    if (state.status === "running" && settings.duration > 0 && state.timeLeft > 0 && state.timeLeft <= 10) {
      sfx.tick();
    }
  }, [state.timeLeft, state.status, settings.duration]);

  /* -------------------------- musiqa -------------------------- */
  useEffect(() => {
    const prefs = getMusicPrefs();
    music.setVolume(prefs.volume);
    if (prefs.track !== "off") music.play(prefs.track);
    return () => music.stop();
  }, []);

  useEffect(() => {
    music.duck(state.status !== "running");
  }, [state.status]);

  /* ------------------------- natijani saqlash ----------------- */
  useEffect(() => {
    if (state.status !== "finished" || saved.current) return;
    saved.current = true;
    const result = {
      id: uid("m"),
      packId: pack.id,
      packTitle: pack.title,
      subject: pack.subject,
      teamA: settings.teamA,
      teamB: settings.teamB,
      scoreA: state.A.pull,
      scoreB: state.B.pull,
      winner: (state.winner ?? "draw") as "A" | "B" | "draw",
      statsA: {
        correct: state.A.correct,
        wrong: state.A.wrong,
        score: state.A.pull,
        bestStreak: state.A.bestStreak,
      },
      statsB: {
        correct: state.B.correct,
        wrong: state.B.wrong,
        score: state.B.pull,
        bestStreak: state.B.bestStreak,
      },
      durationSec: state.elapsed,
      playedAt: new Date().toISOString(),
    };
    saveMatch(result);
    if (isCloudEnabled()) void pushMatch(result).catch(() => undefined);
  }, [state, pack, settings]);

  /* -------------------------- klaviatura ---------------------- */
  const answer = useCallback(
    (team: TeamKey, choice: string) => {
      sfx.unlock();
      actions.answer(team, choice);
    },
    [actions],
  );

  useEffect(() => {
    if (!settings.keyboard) return;
    const onKey = (e: KeyboardEvent) => {
      if (state.status === "finished") return;
      const { code } = e;

      const pick = (team: TeamKey, index: number) => {
        e.preventDefault();
        if (state.status !== "running") return;
        const team_ = state[team];
        if (team_.reviewIndex !== null || team_.feedback) return;
        const option = team_.current.options[index];
        if (option) answer(team, option);
      };

      if (/^Digit[1-6]$/.test(code)) return pick("A", Number(code.slice(5)) - 1);
      if (/^Numpad[1-6]$/.test(code)) return pick("B", Number(code.slice(6)) - 1);
      if (code === "KeyQ") {
        e.preventDefault();
        return actions.reviewBack("A");
      }
      if (code === "KeyE") {
        e.preventDefault();
        return actions.reviewForward("A");
      }
      if (code === "Numpad7" || code === "NumpadSubtract") {
        e.preventDefault();
        return actions.reviewBack("B");
      }
      if (code === "Numpad9" || code === "NumpadAdd") {
        e.preventDefault();
        return actions.reviewForward("B");
      }
      if (code === "Space") {
        e.preventDefault();
        if (state.status === "running") actions.pause();
        else actions.resume();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settings.keyboard, state, actions, answer]);

  const toggleFullscreen = () => {
    if (typeof document === "undefined") return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => undefined);
  };

  const disabled = state.status !== "running";
  const pull = state.A.pull - state.B.pull;

  const labels = useMemo(
    () => ({
      hint: t("game.hint"),
      reviewBack: t("game.reviewBack"),
      reviewLive: t("game.reviewLive"),
      reviewTitle: t("game.reviewTitle"),
      correctWas: t("game.correctWas"),
      yourAnswer: t("game.yourAnswer"),
    }),
    [t],
  );

  const panel = (team: TeamKey) => (
    <TeamPanel
      side={team === "A" ? "a" : "b"}
      name={team === "A" ? settings.teamA : settings.teamB}
      team={state[team]}
      disabled={disabled}
      allowReview={settings.allowReview}
      labels={labels}
      onAnswer={(choice) => answer(team, choice)}
      onReviewBack={() => actions.reviewBack(team)}
      onReviewForward={() => actions.reviewForward(team)}
    />
  );

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
          <h1 className="flex-1 truncate text-center text-lg font-extrabold uppercase tracking-wide text-teamA sm:text-2xl">
            {t("app.name")}: {pack.subject}
          </h1>
          <LanguageSwitcher />
        </div>
        <p className="mx-auto mt-1.5 max-w-3xl text-balance text-center text-xs text-ink-mute sm:text-sm">
          {t("game.rules")}
        </p>
      </header>

      <main className="mx-auto grid w-full max-w-[1600px] flex-1 place-content-center gap-4 px-4 lg:grid-cols-[minmax(260px,1fr)_minmax(0,1.7fr)_minmax(260px,1fr)]">
        <div className="order-2 lg:order-1">{panel("A")}</div>

        <div className="order-1 lg:order-2">
          <div className="surface mb-3 flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold uppercase tracking-wide text-ink-mute">
                {settings.teamA}
              </p>
              <p className="font-mono text-2xl font-bold tabular-nums text-teamA">{state.A.pull}</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-paper px-4 py-2">
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
            <div className="min-w-0 text-right">
              <p className="truncate text-xs font-extrabold uppercase tracking-wide text-ink-mute">
                {settings.teamB}
              </p>
              <p className="font-mono text-2xl font-bold tabular-nums text-teamB">{state.B.pull}</p>
            </div>
          </div>

          <div className="relative">
            <Arena
              pull={pull}
              pullToWin={settings.pullToWin}
              aName={settings.teamA}
              bName={settings.teamB}
              charA={charA}
              charB={charB}
              pulse={state.pulse}
              paused={state.status === "paused"}
              finished={state.status === "finished"}
            />

            {state.status === "countdown" ? (
              <div className="absolute inset-0 grid place-items-center rounded-xl2 bg-white/80 backdrop-blur-sm">
                <div className="text-center">
                  <p className="eyebrow">{t("game.ready")}</p>
                  <p key={state.countdown} className="animate-pop-in font-mono text-7xl font-bold text-ink">
                    {state.countdown}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
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
        </div>

        <div className="order-3">{panel("B")}</div>
      </main>

      {/* Masshtab va musiqa */}
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
          className="grid h-9 w-9 place-items-center rounded-lg text-teamA hover:bg-paper"
          onClick={() => setMusicOpen(true)}
          aria-label={t("music.open")}
          title={t("music.open")}
        >
          <Music className="h-4 w-4" />
        </button>
      </div>

      <MusicPanel open={musicOpen} onClose={() => setMusicOpen(false)} />

      {state.status === "finished" && state.winner ? (
        <WinnerOverlay
          winner={state.winner}
          aName={settings.teamA}
          bName={settings.teamB}
          statsA={{
            score: state.A.pull,
            correct: state.A.correct,
            wrong: state.A.wrong,
            bestStreak: state.A.bestStreak,
          }}
          statsB={{
            score: state.B.pull,
            correct: state.B.correct,
            wrong: state.B.wrong,
            bestStreak: state.B.bestStreak,
          }}
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

function GameLoader() {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const [pack, setPack] = useState<Pack | null>(null);
  const [settings, setSettings] = useState<MatchSettings | null>(null);
  const [chars, setChars] = useState<{ a: CharacterModel; b: CharacterModel } | null>(null);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    const stored = getSettings();
    const id = params.get("pack") ?? stored.packId;
    const found = getPack(id);
    if (!found) {
      router.replace("/arqon");
      return;
    }
    setPack(found);
    setSettings({ ...stored, packId: found.id });
    setChars({ a: getCharacter(stored.charA), b: getCharacter(stored.charB) });
  }, [params, router]);

  if (!pack || !settings || !chars) {
    return <div className="grid min-h-dvh place-items-center text-ink-mute">{t("game.ready")}</div>;
  }

  return (
    <GameBoard
      key={runId}
      pack={pack}
      settings={settings}
      charA={chars.a}
      charB={chars.b}
      onRestart={() => setRunId((n) => n + 1)}
    />
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center text-ink-mute">…</div>}>
      <GameLoader />
    </Suspense>
  );
}
