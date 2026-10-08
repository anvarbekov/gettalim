"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronUp, Clock, Flame, Trophy, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { BoostBar } from "@/components/live/BoostBar";
import { GameStage } from "@/components/live/GameStage";
import { Aurora, Confetti, TimerRing, useCountUp } from "@/components/live/PlayEffects";
import { AnswerEffect, AvatarBadge, TitleChip } from "@/components/gamification/Cosmetics";
import { usePlayerSession } from "@/hooks/usePlayerSession";
import { awardXp, checkAchievements, liveXp } from "@/lib/gamification/api";
import { EMPTY_LOADOUT, fetchLoadout, type Loadout } from "@/lib/gamification/shop";
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
  const { cloud, user } = useAuth();
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

  /* ---- Do'kondan olingan bezaklar ---- */
  const [loadout, setLoadout] = useState<Loadout>(EMPTY_LOADOUT);
  useEffect(() => {
    if (!cloud || !user) return;
    void fetchLoadout().then(setLoadout);
  }, [cloud, user]);

  /* ---- To'g'ri javob effekti ---- */
  const [effectTick, setEffectTick] = useState(0);
  useEffect(() => {
    if (live.verdict?.correct) setEffectTick((n) => n + 1);
  }, [live.verdict]);

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
  // Sahifa yangilansa XP qayta berilmasligi uchun sessiya bo'yicha belgi
  const rewardKey = `gettalim.live.xp.${player?.participantId ?? ""}`;
  const [xpGained, setXpGained] = useState<number | null>(null);
  useEffect(() => {
    if (live.state.phase !== "finished" || rewarded.current) return;
    rewarded.current = true;
    try {
      if (localStorage.getItem(rewardKey)) return;
      localStorage.setItem(rewardKey, "1");
    } catch {
      /* e'tiborsiz */
    }
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

      {/* Do'kondan olingan effekt — faqat to'g'ri javobda */}
      <AnswerEffect effect={loadout.effect} trigger={effectTick} />

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
      <header className="relative z-10 mx-auto flex w-full max-w-[2200px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
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

          {/* Do'kondan olingan avatar va ramka */}
          {loadout.avatar || loadout.frame ? (
            <AvatarBadge
              emoji={loadout.avatar}
              frame={loadout.frame}
              name={player.nickname}
              size={38}
            />
          ) : null}

          <span className="min-w-0">
            <span className="block truncate text-base font-extrabold leading-tight">{player.nickname}</span>
            {loadout.title ? (
              <TitleChip
                title={loadout.title}
                emoji={loadout.titleEmoji}
                className="bg-white/15 text-white/80"
              />
            ) : (
              <span className="block text-[11px] font-bold uppercase tracking-wide text-white/50">
                {hasTeams ? `${live.teamNo}-jamoa · ` : ""}
                {live.rank > 0 ? `${live.rank}/${live.total} o'rin` : `PIN ${pin}`}
              </span>
            )}
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

      <main className="relative z-10 mx-auto flex w-full max-w-[2200px] flex-1 flex-col px-4 pb-4 sm:px-6">
        {/* ---------------- Kutish ---------------- */}
        {live.state.phase === "lobby" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <span className="relative grid h-28 w-28 place-items-center">
              <span
                className="absolute inset-0 animate-pulse-ring rounded-full"
                style={{ background: teamColor }}
                aria-hidden
              />
              <span className="relative grid h-24 w-24 place-items-center rounded-3xl bg-white/10">
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

        {/* ---------------- Hamma savol yechildi ---------------- */}
        {live.state.phase === "running" && live.done ? (
          <div className="animate-pop-in mx-auto mt-6 w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-lift">
            <p className="text-5xl" aria-hidden>
              🎯
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-ink">Hamma savolga javob berdingiz!</h2>
            <p className="mt-1 text-ink-mute">
              {live.correct} ta to'g'ri · {live.wrong} ta xato. Natijani ekranda kuting.
            </p>
          </div>
        ) : null}

        {/* ---------------- Test ---------------- */}
        {live.state.phase === "running" && question ? (
          <>
            {/* O'yin sahnasi — ekranning yuqori qismini egallaydi */}
            <div className="mb-2.5">
              <GameStage
                gameId={live.state.gameId}
                nickname={player.nickname}
                correct={live.correct}
                wrong={live.wrong}
                rank={live.rank}
                total={live.total}
                leaderCorrect={leaderCorrect}
                teamNo={live.teamNo}
                teamColor={teamColor}
                teamPoints={live.state.teamPoints}
                teamNames={live.state.teamNames}
                racer={loadout.racer}
              />
            </div>

            {/* Savol kartasi — har savolda yangidan chiqadi */}
            <div
              key={`q-${live.answered}`}
              className="animate-slide-question shrink-0 rounded-2xl bg-white px-4 py-3 text-center shadow-lift sm:py-4"
            >
              <span className="flex items-center justify-center gap-3 text-[11px] font-extrabold uppercase tracking-wider text-ink-mute sm:text-xs">
                <span>{live.answered + 1}-savol</span>
                <span className="text-emerald-600">{live.correct} ✓</span>
                <span className="text-rose-500">{live.wrong} ✕</span>
                {streak ? (
                  <span className="flex animate-pop-in items-center gap-1 text-amber-600">
                    <Flame className="h-3.5 w-3.5" fill="currentColor" /> {live.correct} ketma-ket
                  </span>
                ) : null}
              </span>
              <p className="mt-1 text-balance text-lg font-extrabold leading-snug text-ink sm:text-xl lg:text-2xl xl:text-3xl">
                {question.prompt}
              </p>
            </div>

            {/* Kuchaytirgichlar — do'kondan sotib olinganlari */}
            <div className="mt-2">
              <BoostBar
                step={live.answered}
                locked={!!live.chosen}
                usedHere={live.usedHere}
                onUse={live.sendBoost}
              />
            </div>

            {/* Variantlar */}
            <div className="mt-2.5 grid flex-1 auto-rows-fr grid-cols-2 gap-2 sm:gap-3">
              {question.options.map((option, i) => {
                const tile = TILES[i % TILES.length];
                const removed = live.hidden.includes(option);
                const picked = live.chosen === option;
                const revealed = live.verdict && !live.verdict.skipped;
                const isAnswer = revealed && option === live.verdict!.answer;
                const wrongPick = revealed && picked && !live.verdict!.correct;

                return (
                  <button
                    key={`${live.answered}-${option}`}
                    type="button"
                    disabled={!!live.chosen || removed}
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
                      "group relative flex min-h-[3.5rem] animate-tile-in items-center justify-center gap-2.5 overflow-hidden rounded-xl2 px-3 py-2.5 text-left transition-all duration-200 sm:gap-4 sm:px-5 sm:py-4",
                      "active:translate-y-[3px] active:brightness-95",
                      live.chosen && !picked && !isAnswer && "opacity-25",
                      // 50/50 o'chirgan variant — ko'rinadi, lekin tanlab bo'lmaydi
                      removed && "pointer-events-none scale-95 opacity-15 grayscale",
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
                    {/*
                      Katta shaffof harf. `inset-y-0` bilan qat'iy bog'langan:
                      ilgari faqat `-right-1` bor edi va harf tugma balandligiga
                      qarab pastga chiqib ketardi — katta ekranda bu ko'zga
                      tashlanardi.
                    */}
                    <span
                      className="pointer-events-none absolute inset-y-0 -right-2 flex select-none items-center text-[3.5rem] font-extrabold leading-none text-white/10 sm:text-[5rem]"
                      aria-hidden
                    >
                      {LETTERS[i]}
                    </span>

                    <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/25 text-sm font-extrabold sm:h-11 sm:w-11 sm:text-lg">
                      {isAnswer ? (
                        <Check className="h-4 w-4 sm:h-6 sm:w-6" strokeWidth={3} />
                      ) : wrongPick ? (
                        <X className="h-4 w-4 sm:h-6 sm:w-6" strokeWidth={3} />
                      ) : (
                        LETTERS[i]
                      )}
                    </span>

                    <span className="relative max-w-full text-pretty text-center text-sm font-extrabold leading-tight sm:text-lg lg:text-xl xl:text-2xl">
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Natija */}
            <div className="mt-2 min-h-[2.75rem] shrink-0">
              {live.verdict ? (
                live.verdict.retry ? (
                  <p className="animate-verdict-in rounded-2xl bg-amber-500 px-4 py-3 text-center text-base font-extrabold shadow-lift">
                    🔁 Ikkinchi imkon — qaytadan tanlang!
                  </p>
                ) : live.verdict.skipped ? (
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
                    <span>
                      {live.verdict.correct
                        ? live.verdict.doubled
                          ? "To'g'ri — ikki barobar!"
                          : "To'g'ri!"
                        : `To'g'risi: ${live.verdict.answer}`}
                    </span>
                    {live.verdict.shielded ? (
                      <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-extrabold">
                        🛡️ jarimasiz
                      </span>
                    ) : null}
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
