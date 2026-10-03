"use client";

import { useEffect, useMemo, useReducer } from "react";
import {
  LADDER,
  TOTAL_STEPS,
  audienceVotes,
  buildLadderQuestions,
  fiftyFifty,
  friendHint,
  guaranteedPrize,
} from "@/lib/games/millioner/engine";
import type { QuizItem } from "@/lib/quiz";
import type { MillionerSettings, Pack } from "@/lib/types";
import { normalizeAnswer } from "@/lib/utils";

export type MillionerPhase =
  | "question"
  | "suspense"
  | "correct"
  | "wrong"
  | "team-done"
  | "finished";

export interface TeamResult {
  name: string;
  step: number;
  prize: number;
  quit: boolean;
}

export interface Lifelines {
  fifty: boolean;
  audience: boolean;
  friend: boolean;
}

interface State {
  phase: MillionerPhase;
  /** Joriy jamoa indeksi. */
  team: number;
  /** 0..14 */
  step: number;
  questions: QuizItem[];
  /** 50/50 dan keyin qolgan variantlar. */
  visible: string[] | null;
  chosen: string | null;
  lifelines: Lifelines;
  audience: number[] | null;
  friend: string | null;
  timeLeft: number;
  results: TeamResult[];
}

type Action =
  | { type: "PICK"; choice: string }
  | { type: "RESOLVE" }
  | { type: "NEXT"; seconds: number }
  | { type: "QUIT" }
  | { type: "TICK" }
  | { type: "USE_FIFTY" }
  | { type: "USE_AUDIENCE" }
  | { type: "USE_FRIEND" }
  | { type: "NEXT_TEAM"; questions: QuizItem[]; seconds: number; name: string }
  | { type: "FINISH"; name: string };

const freshLifelines = (): Lifelines => ({ fifty: true, audience: true, friend: true });

function reducer(state: State, action: Action): State {
  const current = state.questions[state.step];

  switch (action.type) {
    case "PICK": {
      if (state.phase !== "question" || state.chosen) return state;
      return { ...state, chosen: action.choice, phase: "suspense" };
    }

    case "RESOLVE": {
      if (state.phase !== "suspense" || !current || !state.chosen) return state;
      const ok = normalizeAnswer(state.chosen) === normalizeAnswer(current.answer);
      if (ok) {
        const last = state.step + 1 >= TOTAL_STEPS;
        return { ...state, phase: last ? "team-done" : "correct" };
      }
      return { ...state, phase: "wrong" };
    }

    case "NEXT": {
      if (state.phase !== "correct") return state;
      return {
        ...state,
        step: state.step + 1,
        chosen: null,
        visible: null,
        audience: null,
        friend: null,
        timeLeft: action.seconds,
        phase: "question",
      };
    }

    case "QUIT": {
      if (state.phase !== "question") return state;
      return { ...state, phase: "team-done" };
    }

    case "TICK": {
      if (state.phase !== "question" || state.timeLeft <= 0) return state;
      const left = state.timeLeft - 1;
      // Vaqt tugadi — javob berilmagan hisoblanadi
      if (left === 0) return { ...state, timeLeft: 0, phase: "wrong", chosen: null };
      return { ...state, timeLeft: left };
    }

    case "USE_FIFTY": {
      if (!state.lifelines.fifty || !current || state.phase !== "question") return state;
      // Zal ovozi eski variantlar uchun hisoblangan bo'lsa — o'chiramiz
      return {
        ...state,
        visible: fiftyFifty(state.visible ?? current.options, current.answer),
        audience: null,
        lifelines: { ...state.lifelines, fifty: false },
      };
    }

    case "USE_AUDIENCE": {
      if (!state.lifelines.audience || !current || state.phase !== "question") return state;
      const options = state.visible ?? current.options;
      return {
        ...state,
        audience: audienceVotes(options, current.answer, state.step),
        lifelines: { ...state.lifelines, audience: false },
      };
    }

    case "USE_FRIEND": {
      if (!state.lifelines.friend || !current || state.phase !== "question") return state;
      const options = state.visible ?? current.options;
      return {
        ...state,
        friend: friendHint(options, current.answer, state.step).text,
        lifelines: { ...state.lifelines, friend: false },
      };
    }

    case "NEXT_TEAM": {
      const nextTeam = state.team + 1;
      return {
        ...state,
        results: [...state.results, resultOf(state, action.name)],
        team: nextTeam,
        step: 0,
        questions: action.questions,
        chosen: null,
        visible: null,
        audience: null,
        friend: null,
        lifelines: freshLifelines(),
        timeLeft: action.seconds,
        phase: "question",
      };
    }

    case "FINISH": {
      return { ...state, results: [...state.results, resultOf(state, action.name)], phase: "finished" };
    }

    default:
      return state;
  }
}

/** Jamoaning yakuniy natijasi — narvon holatidan hisoblanadi. */
function resultOf(state: State, name: string): TeamResult {
  const quit = state.phase === "team-done" && state.chosen === null;
  let prize: number;
  if (state.phase === "wrong") {
    prize = guaranteedPrize(state.step);
  } else if (state.step >= TOTAL_STEPS - 1 && state.chosen) {
    prize = LADDER[TOTAL_STEPS - 1];
  } else {
    prize = state.step > 0 ? LADDER[state.step - 1] : 0;
  }
  return { name, step: state.phase === "wrong" ? state.step : state.step + (state.chosen ? 1 : 0), prize, quit };
}

export function useMillioner(pack: Pack | undefined, settings: MillionerSettings) {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    (): State => ({
      phase: "question",
      team: 0,
      step: 0,
      questions: buildLadderQuestions(pack),
      visible: null,
      chosen: null,
      lifelines: freshLifelines(),
      audience: null,
      friend: null,
      timeLeft: settings.seconds,
      results: [],
    }),
  );

  /* Javob tanlangach — qisqa kutish, keyin natija */
  useEffect(() => {
    if (state.phase !== "suspense") return;
    const id = setTimeout(() => dispatch({ type: "RESOLVE" }), 1600);
    return () => clearTimeout(id);
  }, [state.phase]);

  /* Savol taymeri */
  useEffect(() => {
    if (state.phase !== "question" || settings.seconds <= 0) return;
    const id = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(id);
  }, [state.phase, state.step, settings.seconds]);

  const current = state.questions[state.step];
  const options = state.visible ?? current?.options ?? [];

  /** Joriy jamoaning shu daqiqadagi yutug'i. */
  const prize = useMemo(() => {
    if (state.phase === "wrong") return guaranteedPrize(state.step);
    if (state.phase === "team-done") {
      // To'g'ri javobdan keyin yakunlangan yoki o'yindan chiqqan
      return state.step >= TOTAL_STEPS - 1 && state.chosen ? LADDER[TOTAL_STEPS - 1] : LADDER[state.step - 1] ?? 0;
    }
    return state.step > 0 ? LADDER[state.step - 1] : 0;
  }, [state.phase, state.step, state.chosen]);

  const teamName = settings.teams[state.team] ?? `${state.team + 1}-jamoa`;
  const isLastTeam = state.team + 1 >= settings.teamCount;
  const roundOver = state.phase === "wrong" || state.phase === "team-done";

  const actions = useMemo(
    () => ({
      pick: (choice: string) => dispatch({ type: "PICK", choice }),
      next: () => dispatch({ type: "NEXT", seconds: settings.seconds }),
      quit: () => dispatch({ type: "QUIT" }),
      useFifty: () => dispatch({ type: "USE_FIFTY" }),
      useAudience: () => dispatch({ type: "USE_AUDIENCE" }),
      useFriend: () => dispatch({ type: "USE_FRIEND" }),
      nextTeam: (name: string) =>
        dispatch({ type: "NEXT_TEAM", questions: buildLadderQuestions(pack), seconds: settings.seconds, name }),
      finishAll: (name: string) => dispatch({ type: "FINISH", name }),
    }),
    [pack, settings.seconds],
  );

  return {
    ...state,
    current,
    options,
    prize,
    teamName,
    isLastTeam,
    roundOver,
    ladder: LADDER,
    total: TOTAL_STEPS,
    actions,
  };
}
