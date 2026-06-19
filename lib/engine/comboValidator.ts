// lib/engine/comboValidator.ts
import { Card, PlayabilityContext } from "@/lib/types/game";
import { isCardPlayable } from "./playability";

/**
 * Validates that a Question Card (Q or 8) is paired with a valid Answer Card.
 *
 * The answer card must share suit with either:
 * - The question card's suit, OR
 * - The currently declared suit (if any) from an Ace play.
 *
 * @param questionCard - The Question Card being played.
 * @param answerCard - The Answer Card being paired.
 * @param context - Current game context (declaredSuit, topCard).
 * @returns `true` if the answer card is a valid match.
 */
export function validateQuestionCombo(
  questionCard: Card,
  answerCard: Card,
  context: PlayabilityContext,
): boolean {
  // Type guard: both must be correct types
  if (questionCard.type !== "question") return false;
  if (answerCard.type !== "answer" && answerCard.type !== "ace") return false; // Ace is considered an answer per rules

  // Determine the target suit: declared suit overrides question's natural suit
  const targetSuit = context.declaredSuit ?? questionCard.suit;
  if (!targetSuit) return false; // should not happen

  // Answer card must match the target suit
  return answerCard.suit === targetSuit;
}

/**
 * Validates a full combo play consisting of a Question Card and an Answer Card.
 *
 * Requirements:
 * - Exactly two cards are provided.
 * - Exactly one is a Question Card, exactly one is an Answer Card (or Ace).
 * - The Question Card must be playable on its own (given current context).
 * - The Answer Card must be a valid match per `validateQuestionCombo`.
 *
 * @param cards - The two cards being played together.
 * @param context - Current game context.
 * @returns An object with `valid: boolean` and an optional `reason` string.
 */
export function validateComboPlay(
  cards: Card[],
  context: PlayabilityContext,
): { valid: boolean; reason?: string } {
  if (cards.length !== 2) {
    return { valid: false, reason: "Combo must be exactly 2 cards" };
  }

  const questionCards = cards.filter((c) => c.type === "question");
  const answerCards = cards.filter(
    (c) => c.type === "answer" || c.type === "ace",
  );

  if (questionCards.length !== 1) {
    return { valid: false, reason: "Must have exactly one Question Card" };
  }
  if (answerCards.length !== 1) {
    return {
      valid: false,
      reason: "Must have exactly one Answer Card (or Ace)",
    };
  }

  const [question] = questionCards;
  const [answer] = answerCards;

  // Check that the question card is playable on its own
  const effectiveSuit = context.declaredSuit ?? context.topCard.suit;
  const effectiveRank = context.topCard.rank;
  if (!isCardPlayable(question, effectiveSuit, effectiveRank)) {
    return {
      valid: false,
      reason: "Question card is not playable on the current top card",
    };
  }

  // Validate that the answer matches
  if (!validateQuestionCombo(question, answer, context)) {
    return {
      valid: false,
      reason: "Answer card does not match the required suit",
    };
  }

  return { valid: true };
}
