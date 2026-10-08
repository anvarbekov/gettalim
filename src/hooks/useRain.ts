"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { useAutoAdvance, useQuizFlow, type FlowStatus } from "@/hooks/useQuizFlow";
import { createFeed } from "@/lib/games/feed";
import type { QuizItem } from "@/lib/quiz";
import type { Pack, RainSettings } from "@/lib/types";

export type RainStatus = FlowStatus;

export interface RainTeam {
  score: number;
  lives: number;
  correct: number;
  wrong: number;
  missed: number;
  streak: number;
  bestStreak: number;
  level: number;
  current: QuizItem;
  /** Javobdan keyingi qisqa ko'rsatish. `chosen` null — savol yerga tushib ketgan. */
  feedback: { chosen: string | null; ok: boolean } | null;
}

interface State {
  teams: RainTeam[];
  /** Jonlari tugagan jamoa indeksi. */
  loser: number | null;
}

type Action =
  | { type: "HIT"; team: number; choice: string; ok: boolean }
  | { type: "MISS"; team: number }
  | { type: "NEXT"; team: number; next: QuizItem };

/** Har 5 to'g'ri javobdan keyin tezlik oshadi. */
export const levelOf = (correct: number) => Math.floor(correct / 5);

const newTeam = (current: QuizItem, lives: number): RainTeam => ({
  score: 0,
  lives,
  correct: 0,
  wrong: 0,
  missed: 0,
  streak: 0,
  bestStreak: 0,
  level: 0,
  current,
  feedback: null,
});

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HIT": {
      const team = state.teams[action.team];
      if (!team || team.feedback || team.lives <= 0) return state;

      const correct = action.ok ? team.correct + 1 : team.correct;
      const lives = action.ok ? team.lives : team.lives - 1;
      const updated: RainTeam = {
        ...team,
        feedback: { chosen: action.choice, ok: action.ok },
        score: action.ok ? team.score + 1 : team.score,
        correct,
        wrong: action.ok ? team.wrong : team.wrong + 1,
        streak: action.ok ? team.streak + 1 : 0,
        bestStreak: action.ok ? Math.max(team.bestStreak, team.streak + 1) : team.bestStreak,
        level: levelOf(correct),
        lives,
      };
      return {
        teams: state.teams.map((x, i) => (i === action.team ? updated : x)),
        loser: lives <= 0 ? action.team : state.loser,
      };
    }

    case "MISS": {
      const team = state.teams[action.team];
      if (!team || team.feedback || team.lives <= 0) return state;
      const lives = team.lives - 1;
      const updated: RainTeam = {
        ...team,
        feedback: { chosen: null, ok: false },
        missed: team.missed + 1,
        streak: 0,
        lives,
      };
      return {
        teams: state.teams.map((x, i) => (i === action.team ? updated : x)),
        loser: lives <= 0 ? action.team : state.loser,
      };
    }

    case "NEXT": {
      const team = state.teams[action.team];
      if (!team?.feedback) return state;
      return {
        ...state,
        teams: state.teams.map((x, i) => (i === action.team ? { ...x, current: action.next, feedback: null } : x)),
      };
    }

    default:
      return state;
  }
}

export function useRain(pack: Pack | undefined, settings: RainSettings) {
  const count = settings.teamCount;
  const feed = useRef(createFeed(pack, count, settings.shuffle)).current;
  const flow = useQuizFlow(settings.duration);

  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    (): State => ({
      teams: Array.from({ length: count }, (_, i) => newTeam(feed.next(i), settings.lives)),
      loser: null,
    }),
  );

  useAutoAdvance(
    state.teams.map((t) => t.feedback),
    (lane) => {
      feed.release(lane);
      dispatch({ type: "NEXT", team: lane, next: feed.next(lane) });
    },
  );

  /* Jonlari tugagan jamoa bo'lsa — o'yin yakunlanadi */
  useEffect(() => {
    if (state.loser !== null) flow.finish();
  }, [state.loser, flow]);

  const hit = useCallback(
    (team: number, choice: string, ok: boolean) => {
      if (!flow.running) return;
      dispatch({ type: "HIT", team, choice, ok });
    },
    [flow.running],
  );

  const miss = useCallback(
    (team: number) => {
      if (!flow.running) return;
      dispatch({ type: "MISS", team });
    },
    [flow.running],
  );

  const actions = useMemo(
    () => ({ hit, miss, pause: flow.pause, resume: flow.resume, finish: flow.finish }),
    [hit, miss, flow.pause, flow.resume, flow.finish],
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
