import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  GameState,
  GameConfig,
  GameAction,
  PlayerConfig,
  Card,
  PlayabilityResult,
  PlayabilityContext,
  AnimationEvent,
  GamePhase,
} from "@/lib/types/game";
import { transition, InvalidActionError } from "@/lib/engine/stateMachine";
import { dealCards, reshuffleDiscard } from "@/lib/engine/deck";
import { getPlayableCards } from "@/lib/engine/playability";
import { checkWinCondition } from "@/lib/engine/nikoKadi";
import { validateComboPlay } from "@/lib/engine/comboValidator";

// ----------------------------------------------------------------------------
// Store interface
// ----------------------------------------------------------------------------

interface GameStore extends GameState {
  // Actions
  dispatch: (action: GameAction) => void;
  configureGame: (config: GameConfig) => void;
  startGame: () => void;
  resetGame: () => void;

  // UI State
  selectedCards: Card[];
  playabilityResult: PlayabilityResult | null;

  // UI actions
  selectCard: (card: Card) => void;
  deselectCard: (card: Card) => void;
  clearSelection: () => void;

  // Animation queue
  animationQueue: AnimationEvent[];
  isPlayingAnimation: boolean;
  enqueueAnimation: (event: AnimationEvent) => void;
  dequeueAnimation: () => void;
  setAnimationPlaying: (playing: boolean) => void;
}

// ----------------------------------------------------------------------------
// Helper to build PlayabilityContext from GameState
// ----------------------------------------------------------------------------

function buildPlayabilityContext(state: GameState): PlayabilityContext {
  return {
    topCard: state.discardPile[0],
    declaredSuit: state.declaredSuit,
    pendingPenalty: state.pendingPenalty,
    phase: state.phase,
  };
}

// ----------------------------------------------------------------------------
// Zustand store
// ----------------------------------------------------------------------------

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      // -------- Initial state (idle) --------
      phase: "idle" as GamePhase,
      config: {
        playerCount: 2,
        cardDealCount: 4,
        players: [],
      },
      players: [],
      drawPile: [],
      discardPile: [],
      currentPlayerIndex: 0,
      direction: "clockwise",
      pendingPenalty: null,
      declaredSuit: null,
      winnerId: null,
      lastAction: null,
      turnNumber: 0,

      // -------- UI state --------
      selectedCards: [],
      playabilityResult: null,

      // -------- Animation state --------
      animationQueue: [],
      isPlayingAnimation: false,

      // -------- Actions --------
      dispatch: (action: GameAction) => {
        const state = get();
        try {
          const newState = transition(state, action);
          // After transition, recompute playability
          const context = buildPlayabilityContext(newState);
          const currentPlayer = newState.players[newState.currentPlayerIndex];
          let playabilityResult: PlayabilityResult | null = null;
          if (
            currentPlayer &&
            (newState.phase === "playerTurn" || newState.phase === "aiTurn")
          ) {
            playabilityResult = getPlayableCards(currentPlayer.hand, context);
          }
          // Clear selection if not in a selectable phase
          let selectedCards = get().selectedCards;
          if (
            newState.phase !== "playerTurn" &&
            newState.phase !== "questionCombo"
          ) {
            selectedCards = [];
          }
          set({
            ...newState,
            playabilityResult,
            selectedCards,
          });
        } catch (error) {
          if (error instanceof InvalidActionError) {
            // Optionally log or show toast; we just re-throw for UI to handle
            throw error;
          }
          throw error;
        }
      },

      configureGame: (config: GameConfig) => {
        set({ config });
      },

      startGame: () => {
        const { config } = get();
        if (!config || config.players.length < 2) {
          throw new Error("Game not configured. Please set up players first.");
        }
        const dealt = dealCards(config);
        // Determine first player (player 0)
        const firstPlayer = dealt.players[0];
        const initialPhase = firstPlayer.isHuman ? "playerTurn" : "aiTurn";
        set({
          phase: initialPhase,
          players: dealt.players,
          drawPile: dealt.drawPile,
          discardPile: dealt.discardPile,
          currentPlayerIndex: 0,
          direction: "clockwise",
          pendingPenalty: null,
          declaredSuit: null,
          winnerId: null,
          lastAction: null,
          turnNumber: 1,
          selectedCards: [],
          playabilityResult: null,
        });
        // Recompute playability after start
        const state = get();
        const context = buildPlayabilityContext(state);
        const currentPlayer = state.players[state.currentPlayerIndex];
        if (
          currentPlayer &&
          (state.phase === "playerTurn" || state.phase === "aiTurn")
        ) {
          const result = getPlayableCards(currentPlayer.hand, context);
          set({ playabilityResult: result });
        }
      },

      resetGame: () => {
        set({
          phase: "idle",
          players: [],
          drawPile: [],
          discardPile: [],
          currentPlayerIndex: 0,
          direction: "clockwise",
          pendingPenalty: null,
          declaredSuit: null,
          winnerId: null,
          lastAction: null,
          turnNumber: 0,
          selectedCards: [],
          playabilityResult: null,
          animationQueue: [],
          isPlayingAnimation: false,
        });
      },

      // -------- UI selection --------
      selectCard: (card: Card) => {
        const state = get();
        // Only allow selection during playerTurn or questionCombo
        if (state.phase !== "playerTurn" && state.phase !== "questionCombo")
          return;
        // Prevent duplicate selection
        if (state.selectedCards.some((c) => c.id === card.id)) return;
        // If in questionCombo, enforce that we only select answer cards (if a question already selected)
        // We'll handle that in UI, but we can just add.
        set({ selectedCards: [...state.selectedCards, card] });
      },

      deselectCard: (card: Card) => {
        const state = get();
        set({
          selectedCards: state.selectedCards.filter((c) => c.id !== card.id),
        });
      },

      clearSelection: () => {
        set({ selectedCards: [] });
      },

      // -------- Animation queue --------
      enqueueAnimation: (event: AnimationEvent) => {
        set((state) => ({
          animationQueue: [...state.animationQueue, event],
        }));
      },

      dequeueAnimation: () => {
        set((state) => ({
          animationQueue: state.animationQueue.slice(1),
        }));
      },

      setAnimationPlaying: (playing: boolean) => {
        set({ isPlayingAnimation: playing });
      },
    }),
    { name: "KadiGameStore" },
  ),
);
