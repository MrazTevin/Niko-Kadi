import { describe, it, expect } from "vitest";
import {
  isCardPlayable,
  getCounterCards,
  getPlayableCards,
} from "../playability";
import { Card, PlayabilityContext, PendingPenalty } from "@/lib/types/game";

// Helper to create a card
function createCard(
  rank: string,
  suit: string | null = "hearts",
  type?: string,
  penaltyValue = 0,
): Card {
  const id = suit ? `${suit}-${rank}` : `JOKER-${rank}`;
  return {
    id,
    suit: suit as any,
    rank: rank as any,
    type: (type as any) || "answer",
    penaltyValue,
  };
}

describe("isCardPlayable", () => {
  it("Joker is always playable", () => {
    const joker = createCard("JOKER", null, "penalty", 5);
    expect(isCardPlayable(joker, "hearts", "5")).toBe(true);
    expect(isCardPlayable(joker, null, "5")).toBe(true);
  });

  it("matches suit", () => {
    const heart5 = createCard("5", "hearts");
    expect(isCardPlayable(heart5, "hearts", "K")).toBe(true);
    expect(isCardPlayable(heart5, "spades", "K")).toBe(false);
  });

  it("matches rank", () => {
    const heart5 = createCard("5", "hearts");
    expect(isCardPlayable(heart5, "spades", "5")).toBe(true);
    expect(isCardPlayable(heart5, "spades", "K")).toBe(false);
  });

  it("matches either suit or rank", () => {
    const clubQueen = createCard("Q", "clubs", "question");
    expect(isCardPlayable(clubQueen, "clubs", "K")).toBe(true);
    expect(isCardPlayable(clubQueen, "hearts", "Q")).toBe(true);
  });
});

describe("getCounterCards", () => {
  const topCard = createCard("2", "hearts", "penalty", 2);
  const penalty: PendingPenalty = {
    totalDrawCount: 2,
    sourcePlayerId: 0,
    chainCards: [topCard],
    canCounter: true,
  };

  it("returns Aces and same-rank cards", () => {
    const hand = [
      createCard("2", "spades", "penalty", 2),
      createCard("A", "diamonds", "ace", 0),
      createCard("5", "hearts"),
      createCard("3", "clubs", "penalty", 3),
    ];
    const counters = getCounterCards(hand, topCard, penalty);
    expect(counters).toHaveLength(2);
    expect(counters.map((c) => c.rank)).toContain("2");
    expect(counters.map((c) => c.rank)).toContain("A");
  });

  it("no counters if none exist", () => {
    const hand = [
      createCard("5", "hearts"),
      createCard("K", "diamonds", "kickback"),
    ];
    const counters = getCounterCards(hand, topCard, penalty);
    expect(counters).toHaveLength(0);
  });
});

describe("getPlayableCards", () => {
  const topCard = createCard("5", "hearts");
  const context: PlayabilityContext = {
    topCard,
    declaredSuit: null,
    pendingPenalty: null,
    phase: "playerTurn",
  };

  it("returns playable cards based on suit/rank matching", () => {
    const hand = [
      createCard("5", "spades"), // rank match
      createCard("K", "hearts"), // suit match
      createCard("2", "clubs"), // none
      createCard("JOKER", null, "penalty", 5), // joker always
    ];
    const result = getPlayableCards(hand, context);
    expect(result.playableCards).toHaveLength(3);
    expect(result.playableCards.map((c) => c.rank)).toEqual([
      "5",
      "K",
      "JOKER",
    ]);
  });

  it("handles penalty chain with canCounter true", () => {
    const penaltyCard = createCard("2", "hearts", "penalty", 2);
    const penaltyContext: PlayabilityContext = {
      ...context,
      topCard: penaltyCard, // The penalty card is now the top of discard pile
      pendingPenalty: {
        totalDrawCount: 2,
        sourcePlayerId: 0,
        chainCards: [penaltyCard],
        canCounter: true,
      },
    };
    const hand = [
      createCard("2", "spades", "penalty", 2), // counter (same rank)
      createCard("5", "hearts"), // not a counter (different rank, not Ace)
      createCard("A", "diamonds", "ace"), // counter (Ace)
    ];
    const result = getPlayableCards(hand, penaltyContext);
    expect(result.playableCards).toHaveLength(2);
    expect(result.playableCards.map((c) => c.rank)).toContain("2");
    expect(result.playableCards.map((c) => c.rank)).toContain("A");
    expect(result.canPlayMultiple).toBe(false);
    expect(result.requiresAnswer).toBe(false);
    expect(result.canCounter).toBe(true);
  });

  it("sets canPlayMultiple when question card is playable", () => {
    const questionCard = createCard("Q", "hearts", "question");
    const hand = [questionCard, createCard("5", "spades")];
    const result = getPlayableCards(hand, context);
    expect(result.playableCards).toContain(questionCard);
    expect(result.canPlayMultiple).toBe(true);
  });

  it("sets requiresAnswer when question card playable but no answer in hand", () => {
    const questionCard = createCard("Q", "hearts", "question");
    const hand = [questionCard];
    const result = getPlayableCards(hand, context);
    expect(result.playableCards).toContain(questionCard);
    expect(result.requiresAnswer).toBe(true);
  });

  it("does NOT set requiresAnswer if answer card exists in hand", () => {
    const questionCard = createCard("Q", "hearts", "question");
    const answerCard = createCard("4", "hearts");
    const hand = [questionCard, answerCard];
    const result = getPlayableCards(hand, context);
    expect(result.playableCards).toContain(questionCard);
    expect(result.requiresAnswer).toBe(false);
  });
});
