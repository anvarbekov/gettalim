"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { useAutoAdvance, useQuizFlow, type FlowStatus } from "@/hooks/useQuizFlow";
import { createFeed } from "@/lib/games/feed";
import type { QuizItem } from "@/lib/quiz";
import type { Pack, RaceSettings } from "@/lib/types";
import { normalizeAnswer } from "@/lib/utils";

export type RaceStatus = FlowStatus;

export interface RaceAnswered {
  item: QuizItem;
  chosen: string;
  ok: boolean;
}

export interface RacerState {
  /** Bosib o'tilgan qadamlar. */
  steps: number;
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
  current: QuizItem;
  history: RaceAnswered[];
  feedback: { chosen: string; ok: boolean } | null;
  reviewIndex: number | null;
  /** Marraga yetgan tartib (1 — birinchi). */
  place: number | null;
}

interface State {
  racers: RacerState[];
  /** Marraga yetganlar tartibi (jamoa indekslari). */
  podium: number[];
  boost: { lane: number; n: number } | null;
}

type Action =
  | { type: "ANSWER"; lane: number; choice: string; distance: number }
  | { type: "ADVANCE"; lane: number; next: QuizItem }
  | { type: "REVIEW_BACK"; lane: number }
  | { type: "REVIEW_FORWARD"; lane: number };

const HISTORY_LIMIT = 25;

const newRacer = (current: QuizItem): RacerState => ({
  steps: 0,
  correct: 0,
  wrong: 0,
  streak: 0,
  bestStreak: 0,
  current,
  history: [],
  feedback: null,
  reviewIndex: null,
  place: null,
});

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ANSWER": {
      const racer = state.racers[action.lane];
      if (!racer || racer.feedback || racer.reviewIndex !== null || racer.place !== null) return state;

      const ok = normalizeAnswer(action.choice) === normalizeAnswer(racer.current.answer);
      const steps = ok ? racer.steps + 1 : racer.steps;
      const finished = steps >= action.distance;

      const updated: RacerState = {
        ...racer,
        feedback: { chosen: action.choice, ok },
        steps,
        correct: ok ? racer.correct + 1 : racer.correct,
        // Xato javob raqiblarga hech narsa bermaydi — faqat o'z qadami qo'shilmaydi
        wrong: ok ? racer.wrong : racer.wrong + 1,
        streak: ok ? racer.streak + 1 : 0,
        bestStreak: ok ? Math.max(racer.bestStreak, racer.streak + 1) : racer.bestStreak,
        place: finished ? state.podium.length + 1 : racer.place,
      };

      return {
        ...state,
        racers: state.racers.map((r, i) => (i === action.lane ? updated : r)),
        podium: finished ? [...state.podium, action.lane] : state.podium,
        boost: ok ? { lane: action.lane, n: Date.now() } : state.boost,
      };
    }

    case "ADVANCE": {
      const racer = state.racers[action.lane];
      if (!racer?.feedback) return state;
      const history = [
        ...racer.history,
        { item: racer.current, chosen: racer.feedback.chosen, ok: racer.feedback.ok },
      ].slice(-HISTORY_LIMIT);
      return {
        ...state,
        racers: state.racers.map((r, i) =>
          i === action.lane ? { ...r, history, current: action.next, feedback: null, reviewIndex: null } : r,
        ),
      };
    }

    case "REVIEW_BACK": {
      const racer = state.racers[action.lane];
      if (!racer?.history.length || racer.feedback) return state;
      const index = racer.reviewIndex === null ? racer.history.length - 1 : Math.max(0, racer.reviewIndex - 1);
      return {
        ...state,
        racers: state.racers.map((r, i) => (i === action.lane ? { ...r, reviewIndex: index } : r)),
      };
    }

    case "REVIEW_FORWARD": {
      const racer = state.racers[action.lane];
      if (!racer || racer.reviewIndex === null) return state;
      const next = racer.reviewIndex + 1;
      return {
        ...state,
        racers: state.racers.map((r, i) =>
          i === action.lane ? { ...r, reviewIndex: next >= r.history.length ? null : next } : r,
        ),
      };
    }

    default:
      return state;
  }
}

export function useRace(pack: Pack | undefined, settings: RaceSettings) {
  const count = settings.teamCount;
  const feed = useRef(createFeed(pack, count, settings.shuffle)).current;
  const flow = useQuizFlow(settings.duration);

  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    (): State => ({
      racers: Array.from({ length: count }, (_, i) => newRacer(feed.next(i))),
      podium: [],
      boost: null,
    }),
  );

  useAutoAdvance(
    state.racers.map((r) => r.feedback),
    (lane) => {
      feed.release(lane);
      dispatch({ type: "ADVANCE", lane, next: feed.next(lane) });
    },
  );

  /* Birinchi jamoa marraga yetdi — poyga tugadi */
  const done = state.podium.length > 0 || state.racers.every((r) => r.place !== null);
  useEffect(() => {
    if (done) flow.finish();
  }, [done, flow]);

  const answer = useCallback(
    (lane: number, choice: string) => {
      if (!flow.running) return;
      dispatch({ type: "ANSWER", lane, choice, distance: settings.distance });
    },
    [flow.running, settings.distance],
  );

  const actions = useMemo(
    () => ({
      answer,
      reviewBack: (lane: number) => dispatch({ type: "REVIEW_BACK", lane }),
      reviewForward: (lane: number) => dispatch({ type: "REVIEW_FORWARD", lane }),
      pause: flow.pause,
      resume: flow.resume,
      finish: flow.finish,
    }),
    [answer, flow.pause, flow.resume, flow.finish],
  );

  const merged = useMemo(
    () => ({
      ...state,
      status: flow.status,
      countdown: flow.countdown,
      timeLeft: flow.timeLeft,
      elapsed: flow.elapsed,
    }),
    [state, flow.status, flow.countdown, flow.timeLeft, flow.elapsed],
  );

  return { state: merged, actions };
}
