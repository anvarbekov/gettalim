"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { createFeed, type QuestionFeed } from "@/lib/games/feed";
import { applyTile, buildPath, type Tile } from "@/lib/games/xazina/engine";
import type { QuizItem } from "@/lib/quiz";
import type { Pack, XazinaSettings } from "@/lib/types";
import { normalizeAnswer } from "@/lib/utils";

export type XazinaPhase = "question" | "feedback" | "moving" | "finished";

export interface TeamState {
  position: number;
  correct: number;
  wrong: number;
}

interface State {
  phase: XazinaPhase;
  turn: number;
  teams: TeamState[];
  current: QuizItem;
  chosen: string | null;
  lastCorrect: boolean | null;
  /** Katak ta'siri haqida xabar. */
  event: string | null;
  winner: number | null;
  moves: number;
}

type Action =
  | { type: "ANSWER"; choice: string; tiles: Tile[] }
  | { type: "NEXT_TURN"; next: QuizItem; teamCount: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ANSWER": {
      if (state.phase !== "question" || state.chosen) return state;
      const ok = normalizeAnswer(action.choice) === normalizeAnswer(state.current.answer);
      const team = state.teams[state.turn];
      const teams = [...state.teams];

      if (!ok) {
        teams[state.turn] = { ...team, wrong: team.wrong + 1 };
        return {
          ...state,
          phase: "feedback",
          chosen: action.choice,
          lastCorrect: false,
          event: null,
          teams,
        };
      }

      // To'g'ri javob — bir katak oldinga, so'ng katak ta'siri
      const stepped = Math.min(action.tiles.length - 1, team.position + 1);
      const result = applyTile(stepped, action.tiles);

      teams[state.turn] = {
        ...team,
        position: result.position,
        correct: team.correct + 1,
      };

      const reached = result.position >= action.tiles.length - 1;

      return {
        ...state,
        phase: reached ? "finished" : "feedback",
        chosen: action.choice,
        lastCorrect: true,
        event: result.message,
        teams,
        winner: reached ? state.turn : state.winner,
        moves: state.moves + 1,
      };
    }

    case "NEXT_TURN": {
      if (state.phase === "finished") return state;
      return {
        ...state,
        phase: "question",
        // Javob to'g'ri bo'lsa ham navbat keyingi jamoaga o'tadi — hamma o'ynasin
        turn: (state.turn + 1) % Math.max(1, action.teamCount),
        current: action.next,
        chosen: null,
        lastCorrect: null,
        event: null,
      };
    }

    default:
      return state;
  }
}

export function useXazina(pack: Pack | undefined, settings: XazinaSettings) {
  const tiles = useMemo(() => buildPath(settings.length, settings.events), [settings.length, settings.events]);
  const feed = useRef<QuestionFeed>(createFeed(pack, Math.max(1, settings.teamCount), true)).current;

  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    (): State => ({
      phase: "question",
      turn: 0,
      teams: Array.from({ length: Math.max(1, settings.teamCount) }, () => ({
        position: 0,
        correct: 0,
        wrong: 0,
      })),
      current: feed.next(0),
      chosen: null,
      lastCorrect: null,
      event: null,
      winner: null,
      moves: 0,
    }),
  );

  /* Javobdan keyin — qisqa pauza, so'ng navbat almashadi */
  useEffect(() => {
    if (state.phase !== "feedback") return;
    const delay = state.event ? 2100 : state.lastCorrect ? 900 : 1400;
    const id = setTimeout(() => {
      const nextTurn = (state.turn + 1) % Math.max(1, settings.teamCount);
      feed.release(state.turn);
      dispatch({ type: "NEXT_TURN", next: feed.next(nextTurn), teamCount: settings.teamCount });
    }, delay);
    return () => clearTimeout(id);
  }, [state.phase, state.event, state.lastCorrect, state.turn, settings.teamCount, feed]);

  const answer = useCallback(
    (choice: string) => dispatch({ type: "ANSWER", choice, tiles }),
    [tiles],
  );

  const leader = useMemo(() => {
    let best = 0;
    state.teams.forEach((t, i) => {
      if (t.position > state.teams[best].position) best = i;
    });
    return best;
  }, [state.teams]);

  return { ...state, tiles, answer, leader };
}
