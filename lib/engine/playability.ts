import {
  Card,
  PlayabilityContext,
  PlayabilityResult,
  PendingPenalty,
  Suit,
  Rank,
} from "@/lib/types/game";

/**
 * Checks if a single card is playable given the current effective suit and rank.
 *
 * Rules:
 * - Jokers are ALWAYS playable.
 * - Otherwise, card is playable if its suit matches effectiveSuit OR its rank matches effectiveRank.
 *
 * @param card - The card to check.
 * @param effectiveSuit - The suit that must be matched (either top card's suit or declared suit from Ace).
 * @param effectiveRank - The rank that must be matched (top card's rank).
 * @returns true if the card can be played.
 */
export function isCardPlayable(
  card: Card,
  effectiveSuit: Suit | null,
  effectiveRank: Rank,
): boolean {
  // Jokers are always playable
  if (card.rank === "JOKER") return true;

  // Match suit (if effectiveSuit exists, Jokers already handled)
  if (effectiveSuit && card.suit === effectiveSuit) return true;

  // Match rank
  if (card.rank === effectiveRank) return true;

  return false;
}

/**
 * Returns cards that can counter an active penalty chain.
 *
 * According to rules:
 * - Any card with the same rank as the top penalty card counters (2 counters 2, 3 counters 3, Joker counters Joker).
 * - Any Ace counters regardless of suit/rank.
 *
 * @param hand - The player's current hand.
 * @param topCard - The most recently played penalty card (top of discard pile).
 * @param penalty - The active penalty chain (used to check canCounter flag, but we ignore it here and compute fresh).
 * @returns Array of cards that can be used as a counter.
 */
export function getCounterCards(
  hand: Card[],
  topCard: Card,
  penalty: PendingPenalty,
): Card[] {
  return hand.filter((card) => {
    // Ace always counters
    if (card.rank === "A") return true;
    // Same rank as the top penalty card counters
    if (card.rank === topCard.rank) return true;
    return false;
  });
}

/**
 * Builds the effective suit and rank from the playability context.
 *
 * - If declaredSuit is present (from an Ace), use that as effective suit.
 * - Otherwise, use the top card's suit.
 * - Effective rank is always the top card's rank (penalty chain does not change rank matching).
 *
 * @param context - The current playability context.
 * @returns An object with effectiveSuit and effectiveRank.
 */
function getEffectiveSuitAndRank(context: PlayabilityContext): {
  effectiveSuit: Suit | null;
  effectiveRank: Rank;
} {
  const effectiveSuit = context.declaredSuit ?? context.topCard.suit;
  const effectiveRank = context.topCard.rank;
  return { effectiveSuit, effectiveRank };
}

/**
 * Main entry point for determining which cards can be played, and any special conditions.
 *
 * Behavior:
 * - If there is an active penalty chain AND the current player can counter,
 *   only counter cards are playable. This overrides normal playability.
 * - Otherwise, evaluate normal playability using suit/rank matching.
 * - Additionally:
 *   - canPlayMultiple is set if there is at least one question card in playableCards
 *     (meaning a Question Card could be played, requiring an answer card later).
 *   - requiresAnswer is set if there is a question card in playableCards AND no answer card is in hand.
 *   - canCounter is set if there are counter cards available (already used above, but included for completeness).
 *
 * @param hand - The player's current hand.
 * @param context - The current playability context (top card, declared suit, pending penalty, phase).
 * @returns PlayabilityResult object.
 */
export function getPlayableCards(
  hand: Card[],
  context: PlayabilityContext,
): PlayabilityResult {
  // 1. Handle active penalty chain with counter opportunity
  if (context.pendingPenalty !== null && context.pendingPenalty.canCounter) {
    const counters = getCounterCards(
      hand,
      context.topCard,
      context.pendingPenalty,
    );
    return {
      playableCards: counters,
      canPlayMultiple: false, // Penalty counter is single card only
      requiresAnswer: false, // No question/answer involved
      canCounter: counters.length > 0,
    };
  }

  // 2. Normal playability (no active penalty chain, or penalty chain present but canCounter == false -> no counter allowed)
  const { effectiveSuit, effectiveRank } = getEffectiveSuitAndRank(context);

  const playableCards = hand.filter((card) =>
    isCardPlayable(card, effectiveSuit, effectiveRank),
  );

  // Determine if any question card is playable
  const hasQuestion = playableCards.some((card) => card.type === "question");
  // Check if the player has any answer card in hand (regardless of playability? The rule: answer must match suit of question or declared suit.
  // For simplicity, we assume if any answer card exists, the player can pair it later. A more precise check would require knowing which answer cards are valid.
  // The design doc: "requiresAnswer is set if there is a question card in playableCards AND no answer card is in hand."
  const hasAnswerInHand = hand.some(
    (card) => card.type === "answer" || card.type === "ace",
  ); // Ace is also an answer card per rules.

  return {
    playableCards,
    canPlayMultiple: hasQuestion,
    requiresAnswer: hasQuestion && !hasAnswerInHand,
    canCounter: false, // Not in penalty chain phase, counters irrelevant
  };
}

// /**
//  * @file playability.ts
//  * Pure functions for determining which cards can be legally played in various game contexts.
//  */

// import type {
//   Card,
//   Suit,
//   Rank,
//   PlayabilityContext,
//   PlayabilityResult,
//   PendingPenalty,
// } from "../types/game";

// /**
//  * Determines whether a single card can be played given the current effective suit and rank.
//  *
//  * @param card - The card to check for playability
//  * @param effectiveSuit - The suit that must be matched (or null if no suit requirement)
//  * @param effectiveRank - The rank that must be matched
//  * @returns true if the card can be played, false otherwise
//  *
//  * Rules:
//  * - Joker (rank "JOKER") is always playable
//  * - A card is playable if its suit matches effectiveSuit OR its rank matches effectiveRank
//  */
// export function isCardPlayable(
//   card: Card,
//   effectiveSuit: Suit | null,
//   effectiveRank: Rank,
// ): boolean {
//   // Joker is always playable
//   if (card.rank === "JOKER") {
//     return true;
//   }

//   // Card is playable if its suit matches effectiveSuit OR its rank matches effectiveRank
//   const suitMatches = effectiveSuit !== null && card.suit === effectiveSuit;
//   const rankMatches = card.rank === effectiveRank;

//   return suitMatches || rankMatches;
// }

// /**
//  * Filters a hand to find cards that can counter an active penalty chain.
//  *
//  * @param hand - The player's current hand
//  * @param topCard - The card on top of the discard pile
//  * @param penalty - The active pending penalty
//  * @returns Array of cards from the hand that can counter the penalty
//  *
//  * Counter rules:
//  * - Ace (rank "A") always counters
//  * - A card of the same rank as topCard counters (e.g., 2 counters 2, 3 counters 3, Joker counters Joker)
//  */
// export function getCounterCards(
//   hand: Card[],
//   topCard: Card,
//   penalty: PendingPenalty,
// ): Card[] {
//   return hand.filter((card) => {
//     // Ace always counters
//     if (card.rank === "A") {
//       return true;
//     }

//     // A card of the same rank as topCard counters
//     if (card.rank === topCard.rank) {
//       return true;
//     }

//     return false;
//   });
// }

// /**
//  * Main entry point for playability checking.
//  * Determines which cards from a hand can be played given the current game context.
//  *
//  * @param hand - The player's current hand
//  * @param context - The current game context including top card, declared suit, and pending penalty
//  * @returns A PlayabilityResult describing which cards can be played and under what conditions
//  *
//  * Logic:
//  * - If there's a pending penalty and the player can counter:
//  *   - Only counter cards are playable
//  *   - Cannot play multiple cards
//  *   - No answer requirement
//  * - Otherwise:
//  *   - Effective suit is declaredSuit (if set) or topCard's suit
//  *   - Filter hand using isCardPlayable
//  *   - Can play multiple if any playable cards are question cards
//  *   - Requires answer if there are question cards but no answer cards
//  */
// export function getPlayableCards(
//   hand: Card[],
//   context: PlayabilityContext,
// ): PlayabilityResult {
//   // Handle penalty chain scenario
//   if (context.pendingPenalty && context.pendingPenalty.canCounter) {
//     const counters = getCounterCards(
//       hand,
//       context.topCard,
//       context.pendingPenalty,
//     );

//     return {
//       playableCards: counters,
//       canPlayMultiple: false,
//       requiresAnswer: false,
//       canCounter: counters.length > 0,
//     };
//   }

//   // Normal playability scenario
//   const effectiveSuit = context.declaredSuit ?? context.topCard.suit;
//   const effectiveRank = context.topCard.rank;

//   const playableCards = hand.filter((card) =>
//     isCardPlayable(card, effectiveSuit, effectiveRank),
//   );

//   // Check for question and answer cards
//   const hasQuestion = playableCards.some((card) => card.type === "question");
//   const hasAnswer = playableCards.some(
//     (card) => card.type === "answer" || card.type === "ace",
//   );

//   return {
//     playableCards,
//     canPlayMultiple: hasQuestion,
//     requiresAnswer: hasQuestion && !hasAnswer,
//     canCounter: false,
//   };
// }
