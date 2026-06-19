import { describe, it, expect } from "vitest";
import { validateQuestionCombo, validateComboPlay } from "../comboValidator";
import { createDeck } from "../deck";
import { PlayabilityContext, Suit } from "@/lib/types/game";

function getCard(rank: string, suit: Suit | null = "hearts") {
  const deck = createDeck();
  if (suit) {
    return deck.find((c) => c.rank === rank && c.suit === suit)!;
  } else {
    return deck.find((c) => c.rank === rank && c.suit === null)!;
  }
}

describe("comboValidator", () => {
  const topCard = getCard("5", "hearts");
  const context: PlayabilityContext = {
    topCard,
    declaredSuit: null,
    pendingPenalty: null,
    phase: "playerTurn",
  };

  describe("validateQuestionCombo", () => {
    it("returns true for valid Q + answer pair", () => {
      const q = getCard("Q", "hearts");
      const a = getCard("4", "hearts");
      expect(validateQuestionCombo(q, a, context)).toBe(true);
    });

    it("returns false for answer not matching suit", () => {
      const q = getCard("Q", "hearts");
      const a = getCard("4", "spades");
      expect(validateQuestionCombo(q, a, context)).toBe(false);
    });

    it("uses declared suit if present", () => {
      const ctx: PlayabilityContext = {
        ...context,
        declaredSuit: "spades" as Suit,
      };
      const q = getCard("Q", "hearts");
      const a = getCard("4", "spades");
      expect(validateQuestionCombo(q, a, ctx)).toBe(true);
    });

    it("returns false if question card type is not question", () => {
      const q = getCard("5", "hearts");
      const a = getCard("4", "hearts");
      expect(validateQuestionCombo(q, a, context)).toBe(false);
    });
  });

  describe("validateComboPlay", () => {
    it("returns valid for a valid combo", () => {
      const cards = [getCard("Q", "hearts"), getCard("4", "hearts")];
      const result = validateComboPlay(cards, context);
      expect(result.valid).toBe(true);
    });

    it("returns invalid if not exactly 2 cards", () => {
      const cards = [getCard("Q", "hearts")];
      const result = validateComboPlay(cards, context);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("exactly 2");
    });

    it("returns invalid if no question card", () => {
      const cards = [getCard("4", "hearts"), getCard("5", "hearts")];
      const result = validateComboPlay(cards, context);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/question/i);
    });

    it("returns invalid if no answer/ace card", () => {
      const cards = [getCard("Q", "hearts"), getCard("J", "hearts")];
      const result = validateComboPlay(cards, context);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/answer/i);
    });

    it("returns invalid if question not playable", () => {
      const cards = [getCard("Q", "spades"), getCard("4", "spades")];
      const result = validateComboPlay(cards, context);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("playable");
    });

    it("returns invalid if answer suit mismatch", () => {
      const cards = [getCard("Q", "hearts"), getCard("4", "spades")];
      const result = validateComboPlay(cards, context);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("match");
    });
  });
});
