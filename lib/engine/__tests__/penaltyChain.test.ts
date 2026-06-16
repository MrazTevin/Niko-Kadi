import { describe, it, expect } from "vitest";
import {
  addToChain,
  resolveWithAce,
  getPreJokerSuit,
  acceptPenalty,
  type PenaltyChainState,
} from "../penaltyChain";
import { createDeck } from "../deck";
import type { GameState, PendingPenalty } from "@/lib/types/game";

function findCard(rank: string, suit: string | null = "hearts") {
  const deck = createDeck();
  if (suit) {
    return deck.find((c) => c.rank === rank && c.suit === suit)!;
  } else {
    return deck.find((c) => c.rank === rank && c.suit === null)!;
  }
}

describe("penaltyChain", () => {
  describe("addToChain", () => {
    it("adds to chain correctly", () => {
      const card2 = findCard("2", "hearts");
      const card3 = findCard("3", "spades");
      const initial: PenaltyChainState = {
        accumulated: 0,
        chainCards: [],
        currentTopCard: card2, // placeholder
      };
      const chain1 = addToChain(initial, card2);
      expect(chain1.accumulated).toBe(2);
      expect(chain1.chainCards).toHaveLength(1);
      expect(chain1.currentTopCard).toEqual(card2);

      const chain2 = addToChain(chain1, card3);
      expect(chain2.accumulated).toBe(5);
      expect(chain2.chainCards).toHaveLength(2);
      expect(chain2.currentTopCard).toEqual(card3);
    });
  });

  describe("resolveWithAce", () => {
    it("clears chain and returns continueSuit", () => {
      const card2 = findCard("2", "hearts");
      const ace = findCard("A", "diamonds");
      const chain: PenaltyChainState = {
        accumulated: 2,
        chainCards: [card2],
        currentTopCard: card2,
      };
      const result = resolveWithAce(chain, ace, "hearts");
      expect(result.newChain).toBeNull();
      expect(result.continueSuit).toBe("hearts");
    });
  });

  describe("getPreJokerSuit", () => {
    it("finds suit from chain before Joker", () => {
      const joker = findCard("JOKER", null);
      const card2 = findCard("2", "hearts");
      const chainCards = [card2, joker];
      const discardPile = [joker, card2];
      const suit = getPreJokerSuit(chainCards, discardPile);
      expect(suit).toBe("hearts");
    });

    it("falls back to discard pile when chain only Jokers", () => {
      const joker1 = findCard("JOKER", null);
      const joker2 = findCard("JOKER", null);
      const previousCard = findCard("5", "clubs");
      const chainCards = [joker1, joker2];
      const discardPile = [joker2, joker1, previousCard];
      const suit = getPreJokerSuit(chainCards, discardPile);
      expect(suit).toBe("clubs");
    });

    it("returns null if no suit found", () => {
      const joker = findCard("JOKER", null);
      const chainCards = [joker];
      const discardPile = [joker];
      const suit = getPreJokerSuit(chainCards, discardPile);
      expect(suit).toBeNull();
    });
  });
});
