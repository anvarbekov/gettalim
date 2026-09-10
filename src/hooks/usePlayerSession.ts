"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  EVENT,
  channelName,
  startOffset,
  type LiveState,
  type LiveVerdict,
  type StoredPlayer,
} from "@/lib/live/protocol";
import { getBrowserClient } from "@/lib/supabase/client";

const EMPTY: LiveState = {
  phase: "lobby",
  gameId: "",
  teams: 0,
  teamNames: [],
  teamPoints: [],
  bank: [],
  endsAt: 0,
  board: [],
};

export interface Verdict {
  correct: boolean;
  answer: string;
  /** Javob hisobga olinmadi — savol shunchaki o'tkazib yuborildi. */
  skipped?: boolean;
}

/** Tasdiq shuncha vaqtda kelmasa, savol o'tkazib yuboriladi (ms). */
const VERDICT_TIMEOUT = 4000;

/**
 * O'quvchi tomoni.
 *
 * Savollar banki bir marta keladi, keyin o'quvchi o'z tezligida yuradi:
 * javob → natija → keyingi savol. Har kim boshqa nuqtadan boshlaydi,
 * shuning uchun yonidagi partadan ko'chirish qiyin.
 */
export function usePlayerSession(player: StoredPlayer | null) {
  const supabase = getBrowserClient();
  const channel = useRef<RealtimeChannel | null>(null);

  const [state, setState] = useState<LiveState>(EMPTY);
  const [connected, setConnected] = useState(false);
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [score, setScore] = useState(0);
  const [rank, setRank] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const askedAt = useRef(Date.now());
  const stepRef = useRef(0);
  stepRef.current = step;

  /* --- Kanal --- */
  useEffect(() => {
    if (!supabase || !player) return;
    const ch = supabase.channel(channelName(player.pin), { config: { broadcast: { self: false } } });
    channel.current = ch;

    ch.on("broadcast", { event: EVENT.state }, ({ payload }) => {
      const next = payload as LiveState;
      setState((prev) => {
        // Test endi boshlandi — hisoblagichni tiklaymiz
        if (prev.phase !== "running" && next.phase === "running") {
          setStep(0);
          setChosen(null);
          setVerdict(null);
          askedAt.current = Date.now();
        }
        return next;
      });
    });

    ch.on("broadcast", { event: EVENT.verdict }, ({ payload }) => {
      const v = payload as LiveVerdict;
      if (v.participantId !== player.participantId) return;
      setVerdict({ correct: v.correct, answer: v.answer, skipped: v.skipped });
      if (v.skipped) return;
      setScore(v.score);
      setRank(v.rank);
      if (v.correct) setCorrect((n) => n + 1);
      else setWrong((n) => n + 1);
    });

    void ch.subscribe((status) => {
      if (status !== "SUBSCRIBED") return;
      setConnected(true);
      void ch.send({
        type: "broadcast",
        event: EVENT.hello,
        payload: {
          participantId: player.participantId,
          nickname: player.nickname,
          teamNo: player.teamNo,
        },
      });
    });

    return () => {
      void supabase.removeChannel(ch);
      channel.current = null;
      setConnected(false);
    };
  }, [supabase, player]);

  /* --- Soat --- */
  useEffect(() => {
    if (state.phase !== "running" || !state.endsAt) return;
    const tick = () => setTimeLeft(Math.max(0, Math.round((state.endsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [state.phase, state.endsAt]);

  /* --- Javobdan keyin avtomatik keyingi savolga --- */
  useEffect(() => {
    if (!verdict) return;
    const id = setTimeout(
      () => {
        setVerdict(null);
        setChosen(null);
        setStep((s) => s + 1);
        askedAt.current = Date.now();
      },
      verdict.skipped ? 500 : verdict.correct ? 650 : 1100,
    );
    return () => clearTimeout(id);
  }, [verdict]);

  /** Qo'lda keyingi savolga o'tish — favqulodda holat uchun. */
  const skip = useCallback(() => {
    setVerdict(null);
    setChosen(null);
    setStep((s) => s + 1);
    askedAt.current = Date.now();
  }, []);

  /** Joriy savol — har bir o'quvchi boshqa nuqtadan boshlaydi. */
  const question = useMemo(() => {
    if (!player || state.bank.length === 0) return null;
    const offset = startOffset(player.participantId, state.bank.length);
    return state.bank[(offset + step) % state.bank.length];
  }, [player, state.bank, step]);

  /**
   * Zaxira: tasdiq kelmasa o'yin qotib qolmasligi kerak.
   * 4 soniyada javob bo'lmasa, holatni qayta so'raymiz va keyingi savolga o'tamiz.
   */
  useEffect(() => {
    if (!chosen || verdict) return;
    const id = setTimeout(() => {
      void channel.current?.send({ type: "broadcast", event: EVENT.sync, payload: {} });
      setVerdict({ correct: false, answer: "", skipped: true });
    }, VERDICT_TIMEOUT);
    return () => clearTimeout(id);
  }, [chosen, verdict]);

  const answer = useCallback(
    (choice: string) => {
      if (!player || !question || chosen || state.phase !== "running") return;
      setChosen(choice);
      void channel.current?.send({
        type: "broadcast",
        event: EVENT.answer,
        payload: {
          participantId: player.participantId,
          nickname: player.nickname,
          teamNo: player.teamNo,
          questionIndex: question.index,
          choice,
          ms: Date.now() - askedAt.current,
        },
      });
    },
    [player, question, chosen, state.phase],
  );

  const teamNo = player?.teamNo ?? 1;
  const myTeamPoints = state.teamPoints[teamNo - 1] ?? 0;
  const myRow = player ? state.board.find((r) => r.participantId === player.participantId) : undefined;

  return {
    state,
    connected,
    question,
    chosen,
    verdict,
    score: myRow?.score ?? score,
    rank: rank || (myRow ? state.board.findIndex((r) => r.participantId === myRow.participantId) + 1 : 0),
    total: state.board.length,
    correct: myRow?.correct ?? correct,
    wrong: myRow?.wrong ?? wrong,
    answered: step,
    timeLeft,
    teamNo,
    myTeamPoints,
    answer,
    skip,
  };
}
