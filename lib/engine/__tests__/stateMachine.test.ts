import { describe, it, expect } from "vitest";
import { transition, InvalidActionError } from "../stateMachine";
import { createDeck, dealCards } from "../deck";
import { GameState, GameAction, PlayerConfig, Card } from "@/lib/types/game";

function createMockState(): GameState {
  const config: PlayerConfig[] = [
    { name: "Alice", isHuman: true, difficulty: null },
    { name: "Bob", isHuman: false, difficulty: "easy" },
  ];
  const gameConfig = {
    playerCount: 2,
    cardDealCount: 4 as const,
    players: config,
  };
  const dealt = dealCards(gameConfig);
  return {
    phase: "playerTurn",
    config: gameConfig,
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
  };
}

describe("Game State Machine", () => {
  it("allows a playable card to be played", () => {
    const state = createMockState();
    const currentPlayer = state.players[0];
    const topCard = state.discardPile[0];
    // Find a card that matches top card's suit OR rank, and is not a question card
    const playableCard = currentPlayer.hand.find(
      (c) =>
        (c.suit === topCard.suit || c.rank === topCard.rank) &&
        c.type !== "question",
    );
    expect(playableCard).toBeDefined(); // should exist
    const action: GameAction = {
      type: "PLAY_CARDS",
      cards: [playableCard!],
      playerId: currentPlayer.id,
    };
    const newState = transition(state, action);
    expect(newState.phase).toBe("resolvingPlay");
    expect(newState.discardPile[0]).toEqual(playableCard);
    expect(newState.players[0].hand).not.toContain(playableCard);
  });

  it("rejects playing an unplayable card", () => {
    const state = createMockState();
    const currentPlayer = state.players[0];
    const topCard = state.discardPile[0];
    // Find a card that does NOT match suit OR rank
    const unplayableCard = currentPlayer.hand.find(
      (c) => c.suit !== topCard.suit && c.rank !== topCard.rank,
    );
    if (!unplayableCard) {
      // If no unplayable card exists, skip test
      expect(true).toBe(true);
      return;
    }
    const action: GameAction = {
      type: "PLAY_CARDS",
      cards: [unplayableCard],
      playerId: currentPlayer.id,
    };
    expect(() => transition(state, action)).toThrowError(InvalidActionError);
  });

  it("allows drawing a card", () => {
    const state = createMockState();
    const currentPlayer = state.players[0];
    const action: GameAction = {
      type: "DRAW_CARD",
      playerId: currentPlayer.id,
    };
    const newState = transition(state, action);
    expect(newState.phase).toBe("aiTurn");
    expect(newState.players[0].hand.length).toBe(
      state.players[0].hand.length + 1,
    );
    expect(newState.drawPile.length).toBe(state.drawPile.length - 1);
  });

  it("allows Niko Kadi announcement when eligible", () => {
    const state = createMockState();
    const topCard = state.discardPile[0];
    const validCard: Card = {
      id: `${topCard.suit}-4`,
      suit: topCard.suit,
      rank: "4",
      type: "answer",
      penaltyValue: 0,
    };
    state.players[0].hand = [validCard];
    const action: GameAction = {
      type: "ANNOUNCE_NIKO_KADI",
      playerId: state.players[0].id,
    };
    const newState = transition(state, action);
    expect(newState.players[0].hasAnnouncedNikoKadi).toBe(true);
    expect(newState.phase).toBe("playerTurn");
  });

  it("does not allow Niko Kadi if not eligible", () => {
    const state = createMockState();
    // Player has multiple cards (not eligible)
    const action: GameAction = {
      type: "ANNOUNCE_NIKO_KADI",
      playerId: state.players[0].id,
    };
    expect(() => transition(state, action)).toThrowError(InvalidActionError);
  });
});
