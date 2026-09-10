"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronUp, Clock, Flame, Trophy, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { GameStage } from "@/components/live/GameStage";
import { Aurora, Confetti, TimerRing, useCountUp } from "@/components/live/PlayEffects";
import { usePlayerSession } from "@/hooks/usePlayerSession";
import { awardXp, checkAchievements, liveXp } from "@/lib/gamification/api";
import { readPlayer, type StoredPlayer } from "@/lib/live/protocol";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/** Har bir variantning o'z rangi — bola javobni rang bo'yicha eslab qoladi. */
const TILES = [
  { from: "#3b8bef", to: "#1a56a8", ring: "#8fc0ff" },
  { from: "#f0644d", to: "#b32d1c", ring: "#ffab9c" },
  { from: "#f2bb3c", to: "#b8830f", ring: "#ffdf9b" },
  { from: "#36b87b", to: "#177a4b", ring: "#95e5bd" },
  { from: "#9a63e6", to: "#5f2fa6", ring: "#cdaaf5" },
  { from: "#1eb8a9", to: "#0d7368", ring: "#8fe3da" },
];

const TEAM_COLORS = ["#3b8bef", "#f0644d", "#f2bb3c", "#36b87b"];

/** Qurilma tebranishi — javob berilganini qo'l ham sezadi. */
function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* qo'llab-quvvatlamasa — e'tiborsiz */
  }
}

export default function PlayPage() {
  const { cloud } = useAuth();
  const router = useRouter();
  const params = useParams<{ pin: string }>();
  const pin = String(params.pin ?? "");

  const [player, setPlayer] = useState<StoredPlayer | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readPlayer(pin);
    if (!stored) {
      router.replace(`/join?pin=${pin}`);
      return;
    }
    setPlayer(stored);
    setReady(true);
  }, [pin, router]);

  const live = usePlayerSession(player);

  /* ---- Ball o'zgarishi: "+130" uchib chiqadi ---- */
  const [gain, setGain] = useState<{ value: number; at: number } | null>(null);
  const prevScore = useRef(0);
  useEffect(() => {
    const diff = live.score - prevScore.current;
    prevScore.current = live.score;
    if (diff > 0) setGain({ value: diff, at: Date.now() });
  }, [live.score]);

  /* ---- O'rin o'zgarishi ---- */
  const [rankMove, setRankMove] = useState<"up" | "down" | null>(null);
  const prevRank = useRef(0);
  useEffect(() => {
    if (live.rank > 0 && prevRank.current > 0 && live.rank !== prevRank.current) {
      setRankMove(live.rank < prevRank.current ? "up" : "down");
      const id = setTimeout(() => setRankMove(null), 1800);
      prevRank.current = live.rank;
      return () => clearTimeout(id);
    }
    prevRank.current = live.rank;
  }, [live.rank]);

  /* ---- Tebranish ---- */
  useEffect(() => {
    if (!live.verdict || live.verdict.skipped) return;
    buzz(live.verdict.correct ? 30 : [40, 60, 40]);
  }, [live.verdict]);

  /* ---- XP va nishonlar ---- */
  const rewarded = useRef(false);
  const [xpGained, setXpGained] = useState<number | null>(null);
  useEffect(() => {
    if (live.state.phase !== "finished" || rewarded.current) return;
    rewarded.current = true;
    const amount = liveXp(live.score, live.rank, live.total);
    void awardXp(amount).then((result) => {
      if (result) setXpGained(amount);
    });
    void checkAchievements({
      score: live.correct,
      maxScore: live.correct + live.wrong,
      rank: live.rank,
      correct: live.correct,
      wrong: live.wrong,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live.state.phase]);

  const shownScore = useCountUp(live.score);
  const totalSeconds = useMemo(() => {
    const config = live.state.endsAt;
    return config ? Math.max(live.timeLeft, 1) : 1;
  }, [live.state.endsAt, live.timeLeft]);
  const maxSeconds = useRef(1);
  if (live.timeLeft > maxSeconds.current) maxSeconds.current = live.timeLeft;

  if (!cloud) return <CloudDisabled title="Ulangan rejim uchun bulut sozlanmagan" />;
  if (!ready || !player) {
    return <div className="grid min-h-dvh place-items-center bg-[#0b1220] text-white/60">Ulanmoqda…</div>;
  }

  const hasTeams = live.state.teams > 0;
  const teamColor = TEAM_COLORS[(live.teamNo - 1) % TEAM_COLORS.length];
  const question = live.question;
  const answered = live.correct + live.wrong;
  const accuracy = answered > 0 ? Math.round((live.correct / answered) * 100) : 0;
  const streak = live.correct >= 3 && live.wrong === 0;
  // Sinfdagi eng yaxshi natija — sahnada masofani ko'rsatish uchun
  const leaderCorrect = live.state.board.reduce((best, row) => Math.max(best, row.correct), 0);
  const podium = live.rank > 0 && live.rank <= 3;
  void totalSeconds;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#0b1220] text-white">
      <Aurora color={teamColor} />

      {/* Javob chaqnashi */}
      {live.verdict && !live.verdict.skipped ? (
        <div
          key={`flash-${live.answered}`}
          className="pointer-events-none absolute inset-0 z-20 animate-flash-in"
          style={{
            background: live.verdict.correct
              ? "radial-gradient(circle at 50% 60%, #10b98188, transparent 70%)"
              : "radial-gradient(circle at 50% 60%, #f43f5e88, transparent 70%)",
          }}
          aria-hidden
        />
      ) : null}

      {/* ---------------- Yuqori panel ---------------- */}
      <header className="relative z-10 flex items-center justify-between gap-3 px-4 py-3">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="relative grid h-11 w-11 shrink-0 place-items-center">
            {rankMove ? (
              <span
                className="absolute inset-0 animate-pulse-ring rounded-2xl"
                style={{ background: rankMove === "up" ? "#10b981" : "#f43f5e" }}
                aria-hidden
              />
            ) : null}
            <span
              className="relative grid h-11 w-11 place-items-center rounded-2xl text-base font-extrabold shadow-lift"
              style={{ background: teamColor }}
            >
              {live.rank > 0 ? live.rank : "•"}
            </span>
            {rankMove ? (
              <span
                className={cn(
                  "absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full text-white shadow-card",
                  rankMove === "up" ? "bg-emerald-500" : "bg-rose-500",
                )}
              >
                {rankMove === "up" ? (
                  <ChevronUp className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={3} />
                )}
              </span>
            ) : null}
          </span>

          <span className="min-w-0">
            <span className="block truncate text-base font-extrabold leading-tight">{player.nickname}</span>
            <span className="block text-[11px] font-bold uppercase tracking-wide text-white/50">
              {hasTeams ? `${live.teamNo}-jamoa · ` : ""}
              {live.rank > 0 ? `${live.rank}/${live.total} o'rin` : `PIN ${pin}`}
            </span>
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-2.5">
          {live.state.phase === "running" ? (
            <TimerRing left={live.timeLeft} total={maxSeconds.current} />
          ) : null}

          <span className="relative">
            <span className="block rounded-xl bg-white px-3.5 py-1.5 font-mono text-base font-extrabold text-ink">
              {shownScore}
            </span>
            {gain ? (
              <span
                key={gain.at}
                className="pointer-events-none absolute -top-1 right-1 animate-float-up font-mono text-sm font-extrabold text-emerald-300"
              >
                +{gain.value}
              </span>
            ) : null}
          </span>
        </span>
      </header>

      <main className="relative z-10 flex flex-1 flex-col px-4 pb-4">
        {/* ---------------- Kutish ---------------- */}
        {live.state.phase === "lobby" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <span className="relative grid h-28 w-28 place-items-center">
              <span
                className="absolute inset-0 animate-pulse-ring rounded-full"
                style={{ background: teamColor }}
                aria-hidden
              />
              <span className="relative grid h-24 w-24 place-items-center rounded-3xl bg-white/10 backdrop-blur">
                <Clock className="h-10 w-10 text-white/80" />
              </span>
            </span>
            <p className="text-2xl font-extrabold">Siz o'yindasiz!</p>
            <p className="text-white/60">O'qituvchi testni boshlashini kuting.</p>
            {hasTeams ? (
              <p
                className="rounded-full px-5 py-2 text-sm font-extrabold shadow-lift"
                style={{ background: teamColor }}
              >
                {live.state.teamNames[live.teamNo - 1] ?? `${live.teamNo}-jamoa`}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* ---------------- Test ---------------- */}
        {live.state.phase === "running" && question ? (
          <>
            {/* O'yin sahnasi — qaysi o'yin tanlangan bo'lsa, o'shanisi */}
            <div className="mb-3">
              <GameStage
                gameId={live.state.gameId}
                correct={live.correct}
                wrong={live.wrong}
                rank={live.rank}
                total={live.total}
                leaderCorrect={leaderCorrect}
                teamNo={live.teamNo}
                teamColor={teamColor}
                teamPoints={live.state.teamPoints}
                teamNames={live.state.teamNames}
              />
            </div>

            {/* Savol kartasi — har savolda yangidan chiqadi */}
            <div
              key={`q-${live.answered}`}
              className="animate-slide-question rounded-2xl bg-white px-5 py-4 text-center shadow-lift"
            >
              <span className="flex items-center justify-center gap-3 text-[11px] font-extrabold uppercase tracking-wider text-ink-mute">
                <span>{live.answered + 1}-savol</span>
                <span className="text-emerald-600">{live.correct} ✓</span>
                <span className="text-rose-500">{live.wrong} ✕</span>
                {streak ? (
                  <span className="flex animate-pop-in items-center gap-1 text-amber-600">
                    <Flame className="h-3.5 w-3.5" fill="currentColor" /> {live.correct} ketma-ket
                  </span>
                ) : null}
              </span>
              <p className="mt-2 text-balance text-xl font-extrabold leading-snug text-ink sm:text-2xl">
                {question.prompt}
              </p>
            </div>

            {/* Variantlar */}
            <div className="mt-3 grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
              {question.options.map((option, i) => {
                const tile = TILES[i % TILES.length];
                const picked = live.chosen === option;
                const revealed = live.verdict && !live.verdict.skipped;
                const isAnswer = revealed && option === live.verdict!.answer;
                const wrongPick = revealed && picked && !live.verdict!.correct;

                return (
                  <button
                    key={`${live.answered}-${option}`}
                    type="button"
                    disabled={!!live.chosen}
                    onClick={() => {
                      buzz(12);
                      live.answer(option);
                    }}
                    style={{
                      background: `linear-gradient(160deg, ${tile.from}, ${tile.to})`,
                      animationDelay: `${i * 60}ms`,
                      boxShadow: isAnswer
                        ? `0 0 0 4px ${tile.ring}, 0 20px 44px -20px rgba(0,0,0,.85)`
                        : wrongPick
                          ? "0 0 0 4px #ff8f8f, 0 20px 44px -20px rgba(0,0,0,.85)"
                          : "0 14px 32px -18px rgba(0,0,0,.9)",
                    }}
                    className={cn(
                      "group relative flex min-h-[5rem] animate-tile-in items-center justify-center gap-3.5 overflow-hidden rounded-2xl px-5 py-4 text-left transition-all duration-200",
                      "active:translate-y-[3px] active:brightness-95",
                      live.chosen && !picked && !isAnswer && "opacity-25",
                      picked && !live.verdict && "scale-[1.03] brightness-110",
                      isAnswer && "animate-pop-in",
                      wrongPick && "animate-shake",
                    )}
                  >
                    {/* Yuqori yorug'lik */}
                    <span
                      className="pointer-events-none absolute inset-x-0 top-0 h-1/2 opacity-25"
                      style={{ background: "linear-gradient(180deg,#fff,transparent)" }}
                      aria-hidden
                    />
                    {/* Katta shaffof harf */}
                    <span
                      className="pointer-events-none absolute -right-2 select-none text-[7rem] font-extrabold leading-none text-white/10"
                      aria-hidden
                    >
                      {LETTERS[i]}
                    </span>

                    <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/25 text-lg font-extrabold backdrop-blur">
                      {isAnswer ? (
                        <Check className="h-6 w-6" strokeWidth={3} />
                      ) : wrongPick ? (
                        <X className="h-6 w-6" strokeWidth={3} />
                      ) : (
                        LETTERS[i]
                      )}
                    </span>

                    <span className="relative text-pretty text-lg font-extrabold leading-tight sm:text-xl">
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Natija */}
            <div className="mt-3 min-h-[3.25rem]">
              {live.verdict ? (
                live.verdict.skipped ? (
                  <p className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-bold text-white/70">
                    Aloqa sekinlashdi — keyingi savolga o'tamiz
                  </p>
                ) : (
                  <div
                    className={cn(
                      "flex animate-verdict-in items-center justify-center gap-3 rounded-2xl px-4 py-3 text-center text-lg font-extrabold shadow-lift",
                      live.verdict.correct ? "bg-emerald-500" : "bg-rose-500",
                    )}
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-white/25">
                      {live.verdict.correct ? (
                        <Check className="h-5 w-5" strokeWidth={3} />
                      ) : (
                        <X className="h-5 w-5" strokeWidth={3} />
                      )}
                    </span>
                    <span>{live.verdict.correct ? "To'g'ri!" : `To'g'risi: ${live.verdict.answer}`}</span>
                  </div>
                )
              ) : live.chosen ? (
                <div className="flex flex-col items-center gap-1.5">
                  <p className="text-sm font-bold text-white/50">Tekshirilmoqda…</p>
                  <button
                    type="button"
                    onClick={live.skip}
                    className="rounded-xl bg-white/10 px-4 py-1.5 text-xs font-extrabold text-white/70 hover:bg-white/20"
                  >
                    Keyingi savolga o'tish
                  </button>
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        {/* ---------------- Yakun ---------------- */}
        {live.state.phase === "finished" ? (
          <>
            {podium ? <Confetti /> : null}

            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <span className="relative grid h-28 w-28 place-items-center">
                <span
                  className="absolute inset-0 animate-pulse-ring rounded-full"
                  style={{ background: live.rank === 1 ? "#e9b02f" : teamColor }}
                  aria-hidden
                />
                <Trophy
                  className="relative h-16 w-16 animate-verdict-in"
                  style={{ color: live.rank === 1 ? "#ffd76a" : "#fff" }}
                />
              </span>

              <p className="text-2xl font-extrabold">Test tugadi</p>
              <p className="font-mono text-5xl font-bold">{shownScore}</p>

              {live.rank > 0 ? (
                <p
                  className={cn(
                    "rounded-full px-5 py-2 text-lg font-extrabold",
                    live.rank === 1 ? "bg-amber-400 text-ink" : "bg-white/10",
                  )}
                >
                  {live.rank === 1 ? "🥇 " : live.rank === 2 ? "🥈 " : live.rank === 3 ? "🥉 " : ""}
                  {live.rank}-o'rin / {live.total}
                </p>
              ) : null}

              <p className="text-sm text-white/60">
                {live.correct} to'g'ri · {live.wrong} xato · {accuracy}% aniqlik
              </p>

              {xpGained ? (
                <p className="animate-pop-in rounded-full bg-[#8b52d8]/25 px-4 py-1.5 text-sm font-extrabold text-[#cdaaf5]">
                  +{xpGained} XP
                </p>
              ) : null}

              {live.state.board.length ? (
                <ol className="mt-4 w-full max-w-xs space-y-1.5 text-left">
                  {live.state.board.slice(0, 5).map((row, i) => (
                    <li
                      key={row.participantId}
                      className={cn(
                        "flex animate-tile-in items-center gap-2.5 rounded-xl px-3 py-2",
                        row.participantId === player.participantId ? "bg-white text-ink" : "bg-white/10",
                      )}
                      style={{ animationDelay: `${i * 70}ms` }}
                    >
                      <span
                        className={cn(
                          "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-extrabold",
                          i === 0 ? "bg-amber-400 text-ink" : "bg-white/20",
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-bold">{row.nickname}</span>
                      <span className="font-mono text-sm font-bold">{row.score}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
