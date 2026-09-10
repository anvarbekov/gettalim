"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import { buildDeck, type MemoryCard } from "@/lib/games/xotira/engine";
import type { Pack, XotiraSettings } from "@/lib/types";

interface State {
  cards: MemoryCard[];
  /** Ochilgan kartochkalar (0, 1 yoki 2 ta). */
  open: string[];
  /** Topilgan juftliklar. */
  matched: Set<string>;
  /** Navbatdagi jamoa indeksi. */
  turn: number;
  scores: number[];
  moves: number;
  elapsed: number;
  /** Juftlik topilganda ko'rsatiladigan kartochka. */
  reveal: MemoryCard | null;
  finished: boolean;
}

type Action =
  | { type: "FLIP"; id: string }
  | { type: "RESOLVE" }
  | { type: "HIDE_REVEAL" }
  | { type: "TICK" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FLIP": {
      if (state.finished || state.open.length >= 2) return state;
      if (state.open.includes(action.id)) return state;
      const card = state.cards.find((c) => c.id === action.id);
      if (!card || state.matched.has(card.pairId)) return state;
      return { ...state, open: [...state.open, action.id] };
    }

    case "RESOLVE": {
      if (state.open.length !== 2) return state;
      const [a, b] = state.open.map((id) => state.cards.find((c) => c.id === id));
      if (!a || !b) return { ...state, open: [] };

      const hit = a.pairId === b.pairId;
      const matched = hit ? new Set([...state.matched, a.pairId]) : state.matched;
      const scores = [...state.scores];
      if (hit) scores[state.turn] += 1;

      const totalPairs = state.cards.length / 2;
      const finished = matched.size >= totalPairs;

      return {
        ...state,
        open: [],
        matched,
        scores,
        moves: state.moves + 1,
        // Juft topilsa navbat o'sha jamoada qoladi
        turn: hit ? state.turn : (state.turn + 1) % Math.max(1, state.scores.length),
        reveal: hit ? a : null,
        finished,
      };
    }

    case "HIDE_REVEAL":
      return { ...state, reveal: null };

    case "TICK":
      return state.finished ? state : { ...state, elapsed: state.elapsed + 1 };

    default:
      return state;
  }
}

export function useXotira(pack: Pack | undefined, settings: XotiraSettings) {
  const deck = useMemo(() => buildDeck(pack, settings.size), [pack, settings.size]);

  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    (): State => ({
      cards: deck.cards,
      open: [],
      matched: new Set<string>(),
      turn: 0,
      scores: Array.from({ length: Math.max(1, settings.teamCount) }, () => 0),
      moves: 0,
      elapsed: 0,
      reveal: null,
      finished: deck.cards.length === 0,
    }),
  );

  /* Ikkita kartochka ochilgach — tekshiramiz */
  useEffect(() => {
    if (state.open.length !== 2) return;
    const id = setTimeout(() => dispatch({ type: "RESOLVE" }), 850);
    return () => clearTimeout(id);
  }, [state.open]);

  /* Topilgan juft biroz ko'rinib turadi */
  useEffect(() => {
    if (!state.reveal) return;
    const id = setTimeout(() => dispatch({ type: "HIDE_REVEAL" }), 2200);
    return () => clearTimeout(id);
  }, [state.reveal]);

  /* Soat */
  useEffect(() => {
    if (state.finished) return;
    const id = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(id);
  }, [state.finished]);

  const flip = useCallback((id: string) => dispatch({ type: "FLIP", id }), []);

  const isOpen = useCallback(
    (card: MemoryCard) => state.open.includes(card.id) || state.matched.has(card.pairId),
    [state.open, state.matched],
  );

  const winner = useMemo(() => {
    if (!state.finished || state.scores.length < 2) return -1;
    const best = Math.max(...state.scores);
    const leaders = state.scores.filter((s) => s === best).length;
    return leaders > 1 ? -1 : state.scores.indexOf(best);
  }, [state.finished, state.scores]);

  return {
    ...state,
    shortage: deck.shortage,
    totalPairs: state.cards.length / 2,
    flip,
    isOpen,
    winner,
  };
}
