"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type FlowStatus = "countdown" | "running" | "paused" | "finished";

/** Javob berilgandan keyin variantlar qancha vaqt ko'rinib turadi (ms). */
export const FEEDBACK_MS = { correct: 700, wrong: 1150 };

export interface QuizFlow {
  status: FlowStatus;
  countdown: number;
  /** Sekundlarda. `duration` 0 bo'lsa doim 0. */
  timeLeft: number;
  elapsed: number;
  running: boolean;
  pause: () => void;
  resume: () => void;
  finish: () => void;
}

/**
 * Uchala o'yin uchun umumiy vaqt boshqaruvi: startdan oldingi sanoq,
 * soat, pauza va yakun. O'yinga xos hisob-kitob har bir o'yinning
 * o'z reducerida qoladi.
 */
export function useQuizFlow(duration: number): QuizFlow {
  const [status, setStatus] = useState<FlowStatus>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [elapsed, setElapsed] = useState(0);

  /* Startdan oldingi sanoq: 3 → 2 → 1 → boshlandi */
  useEffect(() => {
    if (status !== "countdown") return;
    const id = setTimeout(() => {
      setCountdown((n) => {
        if (n <= 1) {
          setStatus("running");
          return 0;
        }
        return n - 1;
      });
    }, 750);
    return () => clearTimeout(id);
  }, [status, countdown]);

  /* Soat */
  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => {
      setElapsed((e) => e + 1);
      setTimeLeft((t) => {
        if (duration <= 0) return 0;
        if (t <= 1) {
          setStatus("finished");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [status, duration]);

  const pause = useCallback(() => setStatus((s) => (s === "running" ? "paused" : s)), []);
  const resume = useCallback(() => setStatus((s) => (s === "paused" ? "running" : s)), []);
  const finish = useCallback(() => setStatus((s) => (s === "finished" ? s : "finished")), []);

  return { status, countdown, timeLeft, elapsed, running: status === "running", pause, resume, finish };
}

/**
 * Javob berilgach, to'g'ri variantni ko'rsatib turib, keyin avtomatik
 * keyingi savolga o'tadi. Har bir jamoa uchun alohida hisoblagich.
 */
export function useAutoAdvance(
  feedback: ({ ok: boolean } | null | undefined)[],
  advance: (lane: number) => void,
) {
  const timers = useRef<(ReturnType<typeof setTimeout> | null)[]>([]);
  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  useEffect(() => {
    feedback.forEach((item, lane) => {
      if (item && !timers.current[lane]) {
        const delay = item.ok ? FEEDBACK_MS.correct : FEEDBACK_MS.wrong;
        timers.current[lane] = setTimeout(() => {
          timers.current[lane] = null;
          advanceRef.current(lane);
        }, delay);
      }
    });
  }, [feedback]);

  useEffect(
    () => () => {
      timers.current.forEach((t) => t && clearTimeout(t));
      timers.current = [];
    },
    [],
  );
}
