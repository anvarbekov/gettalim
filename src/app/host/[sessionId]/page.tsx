"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Play, Shuffle, Square, Timer, Trophy, Users } from "lucide-react";
import { LeaderBoard } from "@/components/live/LeaderBoard";
import { useAuth } from "@/components/auth/AuthProvider";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { useHostSession, type HostPlayer } from "@/hooks/useHostSession";
import { loadSession } from "@/lib/live/api";
import { LANE_COLORS } from "@/lib/racers";
import { getPack } from "@/lib/storage";
import type { SessionRow } from "@/lib/supabase/types";
import type { Pack } from "@/lib/types";
import { cn, formatClock } from "@/lib/utils";

export default function HostPage() {
  const { cloud, loading, user } = useAuth();
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();
  const sessionId = String(params.sessionId ?? "");

  const [session, setSession] = useState<SessionRow | null>(null);
  const [pack, setPack] = useState<Pack | undefined>(undefined);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!cloud) return;
    void loadSession(sessionId).then((row) => {
      if (!row) {
        setNotFound(true);
        return;
      }
      setSession(row);
      setPack(getPack(String(row.config?.packId ?? "")) ?? undefined);
    });
  }, [cloud, sessionId]);

  if (!cloud) return <CloudDisabled title="Ulangan rejim uchun bulut sozlanmagan" />;
  if (loading) return <div className="grid min-h-dvh place-items-center text-ink-mute">Yuklanmoqda…</div>;

  if (notFound) {
    return (
      <div className="grid min-h-dvh place-items-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Sessiya topilmadi</h1>
          <button type="button" onClick={() => router.push("/")} className="mt-4 font-bold text-teamA hover:underline">
            Bosh sahifa →
          </button>
        </div>
      </div>
    );
  }
  if (!session) return <div className="grid min-h-dvh place-items-center text-ink-mute">Yuklanmoqda…</div>;
  if (user && session.host_id !== user.id) {
    return (
      <div className="grid min-h-dvh place-items-center px-4 text-center">
        <h1 className="text-2xl font-extrabold text-ink">Bu sessiya boshqa o'qituvchiga tegishli</h1>
      </div>
    );
  }

  return <HostBoard session={session} pack={pack} />;
}

function HostBoard({ session, pack }: { session: SessionRow; pack: Pack | undefined }) {
  const config = session.config ?? {};
  const questionCount = Number(config.questionCount ?? 20);
  const duration = Number(config.duration ?? 300);
  const teams = Number(config.teams ?? 0);
  const teamNames = ((config.teamNames as string[] | undefined) ?? []).slice(0, teams);
  const subject = String(config.subject ?? config.packTitle ?? "");

  const host = useHostSession({
    pin: session.pin,
    sessionId: session.id,
    gameId: session.game_id,
    pack,
    questionCount,
    duration,
    teams,
    teamNames,
  });

  const [joinHost, setJoinHost] = useState("");
  const [qr, setQr] = useState("");

  useEffect(() => {
    setJoinHost(`${window.location.host}/join`);
    void QRCode.toDataURL(`${window.location.origin}/join?pin=${session.pin}`, {
      width: 480,
      margin: 1,
      color: { dark: "#12233f", light: "#ffffff" },
    }).then(setQr);
  }, [session.pin]);

  const nameOf = (i: number) => teamNames[i] ?? `${i + 1}-jamoa`;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* ---- Yuqori panel ---- */}
      <header className="border-b border-paper-line bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1800px] flex-wrap items-center justify-between gap-3 px-5 py-3">
          <span className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mark.png" alt="" className="h-9 w-9 rounded-full" />
            <span>
              <span className="block text-lg font-extrabold leading-none text-ink">Gettalim</span>
              <span className="block text-xs font-bold uppercase tracking-wide text-ink-mute">{subject}</span>
            </span>
          </span>

          <span className="flex items-center gap-2">
            {host.phase === "running" ? (
              <span
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-2xl font-bold tabular-nums",
                  host.timeLeft <= 30 ? "bg-teamB text-white" : "bg-ink text-white",
                )}
              >
                <Timer className="h-5 w-5" /> {formatClock(host.timeLeft)}
              </span>
            ) : null}
            {host.phase !== "lobby" ? (
              <span className="rounded-xl border-2 border-paper-line bg-white px-3 py-2 font-mono text-sm font-extrabold tracking-widest text-ink">
                {session.pin}
              </span>
            ) : null}
            <span className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3 py-2 text-sm font-extrabold text-ink">
              <Users className="h-4 w-4" /> {host.board.length}
            </span>
            {host.phase === "running" ? (
              <button
                type="button"
                onClick={host.finish}
                className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3 py-2 text-sm font-extrabold text-ink hover:bg-paper"
              >
                <Square className="h-4 w-4" /> Yakunlash
              </button>
            ) : null}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1800px] flex-1 px-5 py-5">
        {host.phase === "lobby" ? (
          <Lobby
            pin={session.pin}
            joinHost={joinHost}
            qr={qr}
            board={host.board}
            teams={teams}
            teamSizes={host.teamSizes}
            nameOf={nameOf}
            questionCount={questionCount}
            duration={duration}
            onShuffle={host.shuffleTeams}
            onMove={host.moveToTeam}
            onStart={host.start}
          />
        ) : null}

        {host.phase === "running" ? (
          <>
            {teams > 0 ? (
              <TeamBar points={host.teamPoints} sizes={host.teamSizes} nameOf={nameOf} />
            ) : null}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-extrabold text-ink">Sinf reytingi</h2>
              <span className="flex flex-wrap items-center gap-x-3 text-sm font-bold text-ink-mute">
                <span>
                  {host.answeredTotal} javob · {host.bankSize} savol bankda
                </span>
                <span className="rounded-lg bg-paper px-2.5 py-1 text-xs">
                  To'g'ri +100 (tezlikka +50 gacha) · Xato −25
                </span>
              </span>
            </div>
            <LeaderBoard board={host.board} teams={teams} />
          </>
        ) : null}

        {host.phase === "finished" ? (
          <Finish board={host.board} teams={teams} points={host.teamPoints} nameOf={nameOf} />
        ) : null}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TeamBar({
  points,
  sizes,
  nameOf,
}: {
  points: number[];
  sizes: number[];
  nameOf: (i: number) => string;
}) {
  const max = Math.max(1, ...points);
  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {points.map((score, i) => (
        <div key={i} className="surface flex items-center gap-3 px-4 py-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-extrabold text-white"
            style={{ background: LANE_COLORS[i % LANE_COLORS.length] }}
          >
            {i + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-extrabold text-ink">{nameOf(i)}</span>
            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-paper">
              <span
                className="block h-full rounded-full transition-[width] duration-700"
                style={{ width: `${(score / max) * 100}%`, background: LANE_COLORS[i % LANE_COLORS.length] }}
              />
            </span>
            <span className="mt-1 block text-[11px] font-bold text-ink-mute">
              {sizes[i] ?? 0} o'quvchi
              {sizes[i] ? ` · o'rtacha ${(score / sizes[i]).toFixed(1)}` : ""}
            </span>
          </span>
          <span className="font-mono text-3xl font-bold tabular-nums text-ink">{score}</span>
        </div>
      ))}
    </div>
  );
}

function Lobby({
  pin,
  joinHost,
  qr,
  board,
  teams,
  teamSizes,
  nameOf,
  questionCount,
  duration,
  onShuffle,
  onMove,
  onStart,
}: {
  pin: string;
  joinHost: string;
  qr: string;
  board: HostPlayer[];
  teams: number;
  teamSizes: number[];
  nameOf: (i: number) => string;
  questionCount: number;
  duration: number;
  onShuffle: () => void;
  onMove: (id: string, team: number) => void;
  onStart: () => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <div className="surface flex flex-col items-center justify-center gap-1.5 p-7 text-center">
        <p className="eyebrow">Qo'shilish uchun</p>
        <p className="text-xl font-extrabold text-ink">{joinHost}</p>
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="QR kod" className="mt-2 h-48 w-48 rounded-xl border border-paper-line" />
        ) : null}
        <p className="mt-3 eyebrow">PIN kod</p>
        <p className="font-mono text-[4.5rem] font-bold leading-none tracking-[0.15em] text-ink">{pin}</p>

        <p className="mt-4 text-sm font-bold text-ink-mute">
          {questionCount} savol · {Math.round(duration / 60)} daqiqa
        </p>

        <button
          type="button"
          onClick={onStart}
          disabled={board.length === 0}
          className="mt-4 flex items-center gap-2 rounded-xl2 bg-ink px-8 py-4 text-xl font-extrabold text-white shadow-lift transition hover:bg-ink-soft disabled:opacity-40"
        >
          <Play className="h-6 w-6" fill="currentColor" /> Testni boshlash
        </button>
        {board.length === 0 ? <p className="text-sm text-ink-mute">Birinchi o'quvchini kutmoqdamiz…</p> : null}
      </div>

      <div className="surface p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold text-ink">Ulanganlar · {board.length}</h2>
          {teams > 0 ? (
            <button
              type="button"
              onClick={onShuffle}
              disabled={board.length === 0}
              className="flex items-center gap-1.5 rounded-xl border-2 border-paper-line bg-white px-3 py-1.5 text-xs font-extrabold text-ink hover:bg-paper disabled:opacity-40"
            >
              <Shuffle className="h-3.5 w-3.5" /> Jamoalarga bo'lish
            </button>
          ) : null}
        </div>

        {board.length === 0 ? (
          <p className="py-16 text-center text-ink-mute">
            O'quvchilar QR kodni skanerlaydi yoki PIN kiritadi — ismlari shu yerda paydo bo'ladi.
          </p>
        ) : teams > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: teams }, (_, t) => (
              <div key={t} className="rounded-xl2 border-2 p-3" style={{ borderColor: `${LANE_COLORS[t]}55` }}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-extrabold" style={{ color: LANE_COLORS[t] }}>
                    {nameOf(t)}
                  </span>
                  <span className="font-mono text-xs text-ink-mute">{teamSizes[t] ?? 0}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {board
                    .filter((p) => p.teamNo === t + 1)
                    .map((p) => (
                      <button
                        key={p.participantId}
                        type="button"
                        title="Boshqa jamoaga o'tkazish"
                        onClick={() => onMove(p.participantId, (p.teamNo % teams) + 1)}
                        className="animate-pop-in rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-white transition hover:opacity-80"
                        style={{ background: LANE_COLORS[t] }}
                      >
                        {p.nickname}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {board.map((p) => (
              <span
                key={p.participantId}
                className="animate-pop-in rounded-xl bg-ink px-3.5 py-2 text-sm font-extrabold text-white"
              >
                {p.nickname}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Finish({
  board,
  teams,
  points,
  nameOf,
}: {
  board: HostPlayer[];
  teams: number;
  points: number[];
  nameOf: (i: number) => string;
}) {
  const winner = teams > 0 && points.length ? points.indexOf(Math.max(...points)) : -1;
  const podium = board.slice(0, 3);

  return (
    <div>
      <div className="mb-6 text-center">
        <Trophy className="mx-auto h-14 w-14 text-gold" />
        <h1 className="mt-2 text-4xl font-extrabold text-ink">Test yakunlandi</h1>
        {winner >= 0 ? (
          <p className="mt-2 text-2xl font-extrabold" style={{ color: LANE_COLORS[winner] }}>
            G'olib jamoa: {nameOf(winner)}
          </p>
        ) : null}
      </div>

      {/* Sovrindorlar */}
      {podium.length ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {podium.map((p, i) => (
            <div
              key={p.participantId}
              className={cn(
                "surface flex flex-col items-center gap-1 p-5 text-center",
                i === 0 && "border-2 border-gold sm:order-2 sm:scale-105",
                i === 1 && "sm:order-1",
                i === 2 && "sm:order-3",
              )}
            >
              <span className="text-3xl">{["🥇", "🥈", "🥉"][i]}</span>
              <span className="text-xl font-extrabold text-ink">{p.nickname}</span>
              <span className="font-mono text-3xl font-bold text-ink">{p.score}</span>
              <span className="text-xs font-bold text-ink-mute">
                {p.correct} to'g'ri · {p.wrong} xato
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <h2 className="mb-3 text-lg font-extrabold text-ink">Barcha natijalar</h2>
      <LeaderBoard board={board} teams={teams} />
    </div>
  );
}
