"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { useAutoAdvance, useQuizFlow, type FlowStatus } from "@/hooks/useQuizFlow";
import { createFeed } from "@/lib/games/feed";
import type { QuizItem } from "@/lib/quiz";
import type { MatchSettings, Pack } from "@/lib/types";
import { normalizeAnswer } from "@/lib/utils";

export type TeamKey = "A" | "B";
export type MatchStatus = FlowStatus;

export interface AnsweredItem {
  item: QuizItem;
  chosen: string;
  ok: boolean;
}

export interface TeamState {
  /** Arqon qadamlari — g'alaba shu bo'yicha aniqlanadi. */
  pull: number;
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
  current: QuizItem;
  /** Javob berilgan savollar (yangisi oxirida). */
  history: AnsweredItem[];
  feedback: { chosen: string; ok: boolean } | null;
  /** null — jonli savol; son — `history` ichida ko'rilayotgan savol. */
  reviewIndex: number | null;
}

interface State {
  A: TeamState;
  B: TeamState;
  winner: TeamKey | "draw" | null;
  /** G'olib aniqlandi, lekin javob ko'rsatilib bo'lgach yakunlanadi. */
  pendingFinish: boolean;
  pulse: { team: TeamKey; n: number } | null;
  event: { kind: "correct" | "wrong"; team: TeamKey; n: number } | null;
}

type Action =
  | { type: "ANSWER"; team: TeamKey; choice: string; pullToWin: number }
  | { type: "ADVANCE"; team: TeamKey; next: QuizItem }
  | { type: "REVIEW_BACK"; team: TeamKey }
  | { type: "REVIEW_FORWARD"; team: TeamKey };

const HISTORY_LIMIT = 25;

const newTeam = (current: QuizItem): TeamState => ({
  pull: 0,
  correct: 0,
  wrong: 0,
  streak: 0,
  bestStreak: 0,
  current,
  history: [],
  feedback: null,
  reviewIndex: null,
});

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ANSWER": {
      const key = action.team;
      const team = state[key];
      if (team.feedback || team.reviewIndex !== null) return state;

      const ok = normalizeAnswer(action.choice) === normalizeAnswer(team.current.answer);
      const rivalKey: TeamKey = key === "A" ? "B" : "A";
      const rival = state[rivalKey];

      const updated: TeamState = {
        ...team,
        feedback: { chosen: action.choice, ok },
        pull: ok ? team.pull + 1 : team.pull,
        correct: ok ? team.correct + 1 : team.correct,
        wrong: ok ? team.wrong : team.wrong + 1,
        streak: ok ? team.streak + 1 : 0,
        bestStreak: ok ? Math.max(team.bestStreak, team.streak + 1) : team.bestStreak,
      };

      // Xato javob raqibga hech narsa bermaydi — shunchaki keyingi savolga o'tiladi
      const gap = Math.abs(updated.pull - rival.pull);
      const pullWinner: TeamKey | null =
        ok && gap >= action.pullToWin ? (updated.pull > rival.pull ? key : rivalKey) : null;

      return {
        ...state,
        [key]: updated,
        pulse: ok ? { team: key, n: Date.now() } : state.pulse,
        event: { kind: ok ? "correct" : "wrong", team: key, n: Date.now() },
        pendingFinish: state.pendingFinish || pullWinner !== null,
        winner: state.winner ?? pullWinner,
      };
    }

    case "ADVANCE": {
      const key = action.team;
      const team = state[key];
      if (!team.feedback) return state;
      const history = [
        ...team.history,
        { item: team.current, chosen: team.feedback.chosen, ok: team.feedback.ok },
      ].slice(-HISTORY_LIMIT);
      return {
        ...state,
        [key]: { ...team, history, current: action.next, feedback: null, reviewIndex: null },
      };
    }

    case "REVIEW_BACK": {
      const team = state[action.team];
      if (!team.history.length || team.feedback) return state;
      const index = team.reviewIndex === null ? team.history.length - 1 : Math.max(0, team.reviewIndex - 1);
      return { ...state, [action.team]: { ...team, reviewIndex: index } };
    }

    case "REVIEW_FORWARD": {
      const team = state[action.team];
      if (team.reviewIndex === null) return state;
      const next = team.reviewIndex + 1;
      return {
        ...state,
        [action.team]: { ...team, reviewIndex: next >= team.history.length ? null : next },
      };
    }

    default:
      return state;
  }
}

export function useMatch(pack: Pack | undefined, settings: MatchSettings) {
  const feed = useRef(createFeed(pack, 2, settings.shuffle)).current;
  const flow = useQuizFlow(settings.duration);

  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    (): State => ({
      A: newTeam(feed.next(0)),
      B: newTeam(feed.next(1)),
      winner: null,
      pendingFinish: false,
      pulse: null,
      event: null,
    }),
  );

  /* Javobdan keyin keyingi savolga o'tish */
  useAutoAdvance([state.A.feedback, state.B.feedback], (lane) => {
    const team: TeamKey = lane === 0 ? "A" : "B";
    feed.release(lane);
    dispatch({ type: "ADVANCE", team, next: feed.next(lane) });
  });

  /* G'olib aniqlangach — javob ko'rinib bo'lgandan keyin yakunlaymiz */
  useEffect(() => {
    if (state.pendingFinish && !state.A.feedback && !state.B.feedback) flow.finish();
  }, [state.pendingFinish, state.A.feedback, state.B.feedback, flow]);

  /* Vaqt tugadi — hisob bo'yicha g'olib */
  const timeWinner = useMemo<TeamKey | "draw" | null>(() => {
    if (flow.status !== "finished" || state.winner) return null;
    if (state.A.pull === state.B.pull) return "draw";
    return state.A.pull > state.B.pull ? "A" : "B";
  }, [flow.status, state.winner, state.A.pull, state.B.pull]);

  const answer = useCallback(
    (team: TeamKey, choice: string) => {
      if (!flow.running) return;
      dispatch({ type: "ANSWER", team, choice, pullToWin: settings.pullToWin });
    },
    [flow.running, settings.pullToWin],
  );

  const actions = useMemo(
    () => ({
      answer,
      reviewBack: (team: TeamKey) => dispatch({ type: "REVIEW_BACK", team }),
      reviewForward: (team: TeamKey) => dispatch({ type: "REVIEW_FORWARD", team }),
      pause: flow.pause,
      resume: flow.resume,
      finish: flow.finish,
    }),
    [answer, flow.pause, flow.resume, flow.finish],
  );

  const merged = useMemo(
    () => ({
      ...state,
      winner: state.winner ?? timeWinner,
      status: flow.status,
      countdown: flow.countdown,
      timeLeft: flow.timeLeft,
      elapsed: flow.elapsed,
    }),
    [state, timeWinner, flow.status, flow.countdown, flow.timeLeft, flow.elapsed],
  );

  return { state: merged, actions };
}
