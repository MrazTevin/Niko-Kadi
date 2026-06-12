/**
 * @file playability.ts
 * Pure functions for determining which cards can be legally played in various game contexts.
 */

import type {
  Card,
  Suit,
  Rank,
  PlayabilityContext,
  PlayabilityResult,
  PendingPenalty,
} from "../types/game";

/**
 * Determines whether a single card can be played given the current effective suit and rank.
 *
 * @param card - The card to check for playability
 * @param effectiveSuit - The suit that must be matched (or null if no suit requirement)
 * @param effectiveRank - The rank that must be matched
 * @returns true if the card can be played, false otherwise
 *
 * Rules:
 * - Joker (rank "JOKER") is always playable
 * - A card is playable if its suit matches effectiveSuit OR its rank matches effectiveRank
 */
export function isCardPlayable(
  card: Card,
  effectiveSuit: Suit | null,
  effectiveRank: Rank,
): boolean {
  // Joker is always playable
  if (card.rank === "JOKER") {
    return true;
  }

  // Card is playable if its suit matches effectiveSuit OR its rank matches effectiveRank
  const suitMatches = effectiveSuit !== null && card.suit === effectiveSuit;
  const rankMatches = card.rank === effectiveRank;

  return suitMatches || rankMatches;
}

/**
 * Filters a hand to find cards that can counter an active penalty chain.
 *
 * @param hand - The player's current hand
 * @param topCard - The card on top of the discard pile
 * @param penalty - The active pending penalty
 * @returns Array of cards from the hand that can counter the penalty
 *
 * Counter rules:
 * - Ace (rank "A") always counters
 * - A card of the same rank as topCard counters (e.g., 2 counters 2, 3 counters 3, Joker counters Joker)
 */
export function getCounterCards(
  hand: Card[],
  topCard: Card,
  penalty: PendingPenalty,
): Card[] {
  return hand.filter((card) => {
    // Ace always counters
    if (card.rank === "A") {
      return true;
    }

    // A card of the same rank as topCard counters
    if (card.rank === topCard.rank) {
      return true;
    }

    return false;
  });
}

/**
 * Main entry point for playability checking.
 * Determines which cards from a hand can be played given the current game context.
 *
 * @param hand - The player's current hand
 * @param context - The current game context including top card, declared suit, and pending penalty
 * @returns A PlayabilityResult describing which cards can be played and under what conditions
 *
 * Logic:
 * - If there's a pending penalty and the player can counter:
 *   - Only counter cards are playable
 *   - Cannot play multiple cards
 *   - No answer requirement
 * - Otherwise:
 *   - Effective suit is declaredSuit (if set) or topCard's suit
 *   - Filter hand using isCardPlayable
 *   - Can play multiple if any playable cards are question cards
 *   - Requires answer if there are question cards but no answer cards
 */
export function getPlayableCards(
  hand: Card[],
  context: PlayabilityContext,
): PlayabilityResult {
  // Handle penalty chain scenario
  if (context.pendingPenalty && context.pendingPenalty.canCounter) {
    const counters = getCounterCards(
      hand,
      context.topCard,
      context.pendingPenalty,
    );

    return {
      playableCards: counters,
      canPlayMultiple: false,
      requiresAnswer: false,
      canCounter: counters.length > 0,
    };
  }

  // Normal playability scenario
  const effectiveSuit = context.declaredSuit ?? context.topCard.suit;
  const effectiveRank = context.topCard.rank;

  const playableCards = hand.filter((card) =>
    isCardPlayable(card, effectiveSuit, effectiveRank),
  );

  // Check for question and answer cards
  const hasQuestion = playableCards.some((card) => card.type === "question");
  const hasAnswer = playableCards.some(
    (card) => card.type === "answer" || card.type === "ace",
  );

  return {
    playableCards,
    canPlayMultiple: hasQuestion,
    requiresAnswer: hasQuestion && !hasAnswer,
    canCounter: false,
  };
}
