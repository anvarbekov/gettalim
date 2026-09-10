"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createFeed } from "@/lib/games/feed";
import {
  EVENT,
  channelName,
  type BoardRow,
  type LiveAnswer,
  type LiveHello,
  type LiveQuestion,
  type LiveState,
} from "@/lib/live/protocol";
import { listParticipants, setParticipantTeam, setSessionStatus, submitAnswer } from "@/lib/live/api";
import { getBrowserClient } from "@/lib/supabase/client";
import type { Pack } from "@/lib/types";
import { normalizeAnswer } from "@/lib/utils";

export interface HostPlayer extends BoardRow {
  /** Oxirgi javob to'g'ri bo'ldimi — kartochkani yashil/qizil qilish uchun. */
  lastCorrect: boolean | null;
  lastAt: number;
}

export interface HostOptions {
  pin: string;
  sessionId: string;
  gameId: string;
  pack: Pack | undefined;
  /** Bankdagi savollar soni. */
  questionCount: number;
  /** Test davomiyligi (soniya). */
  duration: number;
  teams: number;
  teamNames: string[];
}

/** Reytingni qayta yuborish oralig'i — 25 o'quvchida ham tarmoq bo'sh qoladi. */
const BOARD_INTERVAL = 700;

/** Xato javob uchun jarima. Baza bilan bir xil bo'lishi shart. */
export const WRONG_PENALTY = 25;

/**
 * Savollar banki brauzerda saqlanadi: o'qituvchi sahifani tasodifan
 * yangilab yuborsa ham test davom etadi.
 */
interface HostSnapshot {
  bank: LiveQuestion[];
  answers: string[];
  endsAt: number;
}

const snapshotKey = (sessionId: string) => `gettalim.host.${sessionId}`;

function readSnapshot(sessionId: string): HostSnapshot | null {
  try {
    const raw = localStorage.getItem(snapshotKey(sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HostSnapshot;
    return parsed.endsAt > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

function writeSnapshot(sessionId: string, snapshot: HostSnapshot) {
  try {
    localStorage.setItem(snapshotKey(sessionId), JSON.stringify(snapshot));
  } catch {
    /* xotira to'la — e'tiborsiz */
  }
}

export function useHostSession({
  pin,
  sessionId,
  gameId,
  pack,
  questionCount,
  duration,
  teams,
  teamNames,
}: HostOptions) {
  const supabase = getBrowserClient();
  const channel = useRef<RealtimeChannel | null>(null);

  const [phase, setPhase] = useState<LiveState["phase"]>("lobby");
  const [players, setPlayers] = useState<Record<string, HostPlayer>>({});
  const [endsAt, setEndsAt] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);

  /** Savollar banki: o'quvchilarga javobsiz yuboriladi, javoblar shu yerda qoladi. */
  const bank = useRef<LiveQuestion[]>([]);
  const answers = useRef<string[]>([]);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const endsAtRef = useRef(0);

  const playersRef = useRef(players);
  playersRef.current = players;

  /* --- Hosila qiymatlar --- */
  /**
   * Reyting tartibi: avval ball, keyin to'g'ri javoblar soni, so'ng **kam xato
   * qilgan** yuqorida turadi. Ball teng bo'lganda ehtiyotkorlik ustun keladi.
   */
  const board = useMemo<HostPlayer[]>(
    () =>
      Object.values(players).sort(
        (a, b) =>
          b.score - a.score ||
          b.correct - a.correct ||
          a.wrong - b.wrong ||
          a.nickname.localeCompare(b.nickname),
      ),
    [players],
  );

  /**
   * Jamoa hisobi: to'g'ri javoblar yig'indisidan xatolar ayiriladi.
   * Shaxsiy reyting bilan bir xil qoida — tavakkal qilish jamoaga ham zarar.
   */
  const teamPoints = useMemo(() => {
    if (teams <= 0) return [];
    const totals = Array.from({ length: teams }, () => 0);
    Object.values(players).forEach((p) => {
      const idx = Math.min(teams - 1, Math.max(0, p.teamNo - 1));
      totals[idx] += p.correct - p.wrong;
    });
    return totals.map((n) => Math.max(0, n));
  }, [players, teams]);

  const teamSizes = useMemo(() => {
    if (teams <= 0) return [];
    const sizes = Array.from({ length: teams }, () => 0);
    Object.values(players).forEach((p) => {
      const idx = Math.min(teams - 1, Math.max(0, p.teamNo - 1));
      sizes[idx] += 1;
    });
    return sizes;
  }, [players, teams]);

  const boardRef = useRef(board);
  boardRef.current = board;
  const teamPointsRef = useRef(teamPoints);
  teamPointsRef.current = teamPoints;

  /* --- Holatni yuborish --- */
  const buildState = useCallback(
    (nextPhase: LiveState["phase"]): LiveState => ({
      phase: nextPhase,
      gameId,
      teams,
      teamNames,
      teamPoints: teamPointsRef.current,
      bank: nextPhase === "lobby" ? [] : bank.current,
      endsAt: endsAtRef.current,
      board: boardRef.current.map(({ lastCorrect, lastAt, ...row }) => {
        void lastCorrect;
        void lastAt;
        return row;
      }),
    }),
    [gameId, teams, teamNames],
  );

  const sendState = useCallback(
    (nextPhase?: LiveState["phase"]) => {
      const payload = buildState(nextPhase ?? phaseRef.current);
      void channel.current?.send({ type: "broadcast", event: EVENT.state, payload });
    },
    [buildState],
  );

  /* --- Kanal --- */
  useEffect(() => {
    if (!supabase) return;
    const ch = supabase.channel(channelName(pin), { config: { broadcast: { self: false } } });
    channel.current = ch;

    ch.on("broadcast", { event: EVENT.hello }, ({ payload }) => {
      const hello = payload as LiveHello;
      setPlayers((prev) =>
        prev[hello.participantId]
          ? prev
          : {
              ...prev,
              [hello.participantId]: {
                participantId: hello.participantId,
                nickname: hello.nickname,
                teamNo: hello.teamNo,
                score: 0,
                correct: 0,
                wrong: 0,
                answered: 0,
                streak: 0,
                lastCorrect: null,
                lastAt: 0,
              },
            },
      );
      setTimeout(() => sendState(), 60);
    });

    ch.on("broadcast", { event: EVENT.sync }, () => sendState());

    ch.on("broadcast", { event: EVENT.answer }, ({ payload }) => {
      const answer = payload as LiveAnswer;
      if (phaseRef.current !== "running") return;

      const right = answers.current[answer.questionIndex];

      // Bank yo'q yoki savol topilmadi (masalan HOST sahifasi yangilangan) —
      // o'quvchini qotirib qo'ymaymiz: holatni qayta yuboramiz va javobni
      // hisobsiz o'tkazamiz.
      if (right === undefined) {
        void ch.send({
          type: "broadcast",
          event: EVENT.verdict,
          payload: {
            participantId: answer.participantId,
            questionIndex: answer.questionIndex,
            correct: false,
            answer: "",
            score: playersRef.current[answer.participantId]?.score ?? 0,
            rank: 0,
            of: Object.keys(playersRef.current).length || 1,
            skipped: true,
          },
        });
        sendState();
        return;
      }

      const correct = normalizeAnswer(answer.choice) === normalizeAnswer(right);
      const existing = playersRef.current[answer.participantId] ?? {
        participantId: answer.participantId,
        nickname: answer.nickname,
        teamNo: answer.teamNo,
        score: 0,
        correct: 0,
        wrong: 0,
        answered: 0,
        streak: 0,
        lastCorrect: null,
        lastAt: 0,
      };

      // To'g'ri javob: 100 ball + tezlik uchun 50 gacha qo'shimcha.
      // Xato javob: 25 ball jarima — tavakkal qilish foydasiz bo'lsin.
      // Ball noldan pastga tushmaydi.
      const bonus = correct ? Math.max(0, 50 - Math.floor(answer.ms / 400)) : 0;
      const delta = correct ? 100 + bonus : -WRONG_PENALTY;
      const updated: HostPlayer = {
        ...existing,
        nickname: answer.nickname || existing.nickname,
        score: Math.max(0, existing.score + delta),
        correct: existing.correct + (correct ? 1 : 0),
        wrong: existing.wrong + (correct ? 0 : 1),
        answered: existing.answered + 1,
        streak: correct ? existing.streak + 1 : 0,
        lastCorrect: correct,
        lastAt: Date.now(),
      };

      // Ref darhol yangilanadi — javob React qayta chizishini kutmaydi
      const nextPlayers = { ...playersRef.current, [answer.participantId]: updated };
      playersRef.current = nextPlayers;
      setPlayers(nextPlayers);

      const rank =
        Object.values(nextPlayers)
          .sort((a, b) => b.score - a.score)
          .findIndex((p) => p.participantId === answer.participantId) + 1;

      void ch.send({
        type: "broadcast",
        event: EVENT.verdict,
        payload: {
          participantId: answer.participantId,
          questionIndex: answer.questionIndex,
          correct,
          answer: right,
          score: updated.score,
          rank,
          of: Object.keys(nextPlayers).length || 1,
        },
      });

      // Jurnal uchun bazaga yozamiz (natijaga ta'sir qilmaydi)
      void submitAnswer(
        answer.participantId,
        bank.current[answer.questionIndex]?.prompt ?? "",
        answer.choice,
        correct,
        answer.ms,
        right,
      );
    });

    void ch.subscribe();
    return () => {
      void supabase.removeChannel(ch);
      channel.current = null;
    };
  }, [supabase, pin, sendState]);

  /* --- Sahifa yangilangan bo'lsa, testni tiklaymiz --- */
  useEffect(() => {
    const snapshot = readSnapshot(sessionId);
    if (!snapshot || !snapshot.bank.length) return;
    bank.current = snapshot.bank;
    answers.current = snapshot.answers;
    endsAtRef.current = snapshot.endsAt;
    setEndsAt(snapshot.endsAt);
    setTimeLeft(Math.max(0, Math.round((snapshot.endsAt - Date.now()) / 1000)));
    setPhase("running");
  }, [sessionId]);

  /* --- Bazadagi ro'yxat (qayta ulanish) --- */
  useEffect(() => {
    void listParticipants(sessionId).then((rows) => {
      if (!rows.length) return;
      setPlayers((prev) => {
        const next = { ...prev };
        rows.forEach((r) => {
          next[r.id] = next[r.id] ?? {
            participantId: r.id,
            nickname: r.nickname,
            teamNo: r.team_no,
            score: r.score,
            correct: 0,
            wrong: 0,
            answered: 0,
            streak: 0,
            lastCorrect: null,
            lastAt: 0,
          };
        });
        return next;
      });
    });
  }, [sessionId]);

  /* --- Soat --- */
  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endsAtRef.current - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0) {
        clearInterval(id);
        setPhase("finished");
        void setSessionStatus(sessionId, "finished");
        setTimeout(() => sendState("finished"), 100);
      }
    }, 250);
    return () => clearInterval(id);
  }, [phase, sessionId, sendState]);

  /* --- Reytingni muntazam yuborish --- */
  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => sendState(), BOARD_INTERVAL);
    return () => clearInterval(id);
  }, [phase, sendState]);

  /* --- Boshqaruv --- */
  const shuffleTeams = useCallback(() => {
    if (teams <= 0) return;
    const shuffled = Object.values(playersRef.current).sort(() => Math.random() - 0.5);
    const next: Record<string, HostPlayer> = {};
    shuffled.forEach((p, i) => {
      const teamNo = (i % teams) + 1;
      next[p.participantId] = { ...p, teamNo };
      void setParticipantTeam(p.participantId, teamNo);
    });
    setPlayers(next);
    setTimeout(() => sendState(), 80);
  }, [teams, sendState]);

  const moveToTeam = useCallback(
    (participantId: string, teamNo: number) => {
      setPlayers((prev) =>
        prev[participantId] ? { ...prev, [participantId]: { ...prev[participantId], teamNo } } : prev,
      );
      void setParticipantTeam(participantId, teamNo);
      setTimeout(() => sendState(), 80);
    },
    [sendState],
  );

  const start = useCallback(() => {
    // Savollar bankini bir marta tuzamiz
    const feed = createFeed(pack, 1, true);
    const list: LiveQuestion[] = [];
    const keys: string[] = [];
    for (let i = 0; i < questionCount; i += 1) {
      const item = feed.next(0);
      feed.release(0);
      list.push({ index: i, prompt: item.question.prompt, options: item.options });
      keys.push(item.answer);
    }
    bank.current = list;
    answers.current = keys;

    const ends = Date.now() + duration * 1000;
    endsAtRef.current = ends;
    writeSnapshot(sessionId, { bank: list, answers: keys, endsAt: ends });
    setEndsAt(ends);
    setTimeLeft(duration);
    setPhase("running");
    void setSessionStatus(sessionId, "running");
    setTimeout(() => sendState("running"), 60);
  }, [pack, questionCount, duration, sessionId, sendState]);

  const finish = useCallback(() => {
    endsAtRef.current = Date.now();
    try {
      localStorage.removeItem(snapshotKey(sessionId));
    } catch {
      /* e'tiborsiz */
    }
    setPhase("finished");
    void setSessionStatus(sessionId, "finished");
    setTimeout(() => sendState("finished"), 60);
  }, [sessionId, sendState]);

  const answeredTotal = useMemo(
    () => Object.values(players).reduce((sum, p) => sum + p.answered, 0),
    [players],
  );

  return {
    phase,
    board,
    players: board,
    teamPoints,
    teamSizes,
    timeLeft,
    endsAt,
    answeredTotal,
    bankSize: bank.current.length || questionCount,
    start,
    finish,
    shuffleTeams,
    moveToTeam,
  };
}
