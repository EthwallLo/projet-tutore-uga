"use client";

import { useEffect, useReducer } from "react";
import { applyAction, createGame, isGameState, type GameCommand, type GameState, type TurnAction } from "@/lib/game";

const storageKey = "japan-travel-game-v1";
type Store = { game: GameState | null; ready: boolean; turnReady: boolean; error: string | null };
type Event =
  | { type: "restore"; game: GameState | null }
  | { type: "start"; names: string[]; seed: number }
  | { type: "continue" }
  | { type: "act"; action: TurnAction };

function reducer(store: Store, event: Event): Store {
  switch (event.type) {
    case "restore": return { game: event.game, ready: true, turnReady: !!event.game?.pendingCard, error: null };
    case "start": return { game: createGame(event.names, event.seed), ready: true, turnReady: true, error: null };
    case "continue": return { ...store, turnReady: true, error: null };
    case "act": {
      if (!store.game) return store;
      if (!store.turnReady && store.game.phase === "playing") return store;
      const result = applyAction(store.game, event.action);
      return { game: result.game, ready: true, turnReady: result.error ? store.turnReady : result.game.turn === store.game.turn && result.game.phase === "playing", error: result.error };
    }
  }
}

export function useGame() {
  const [store, dispatch] = useReducer(reducer, { game: null, ready: false, turnReady: false, error: null });

  useEffect(() => {
    let game: GameState | null = null;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const candidate: unknown = JSON.parse(saved);
        if (isGameState(candidate)) game = candidate;
      }
    } catch {
      // Une sauvegarde illisible ou un stockage bloqué laisse la carte utilisable
    }
    dispatch({ type: "restore", game });
  }, []);

  useEffect(() => {
    if (!store.ready || !store.game) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(store.game));
    } catch {
      // La partie reste jouable en mémoire lorsque le stockage est indisponible
    }
  }, [store.ready, store.game]);

  function start(names: string[]) {
    const seed = window.crypto.getRandomValues(new Uint32Array(1))[0];
    dispatch({ type: "start", names, seed });
  }

  function act(command: GameCommand) {
    if (store.game) dispatch({ type: "act", action: { ...command, turn: store.game.turn } });
  }

  return { ...store, start, act, continueTurn: () => dispatch({ type: "continue" }) };
}

export type GameSession = ReturnType<typeof useGame>;
