/**
 * @file comboValidator.ts
 * Validators for question-card combo plays in the Kadi card game.
 *
 * A "combo" is a two-card play where a question card is immediately followed
 * by an answer (or Ace) card that satisfies the question's suit requirement.
 */

import type { Card, PlayabilityContext } from "../types/game";
import { isCardPlayable } from "./playability";

// ---------------------------------------------------------------------------
// validateQuestionCombo
// ---------------------------------------------------------------------------

/**
 * Validates that `answerCard` legally answers `questionCard` in the given
 * context.
 *
 * Rules:
 * 1. `questionCard` must have type `"question"`.
 * 2. `answerCard` must have type `"answer"` or `"ace"`.
 * 3. The answer card's suit must match the effective target suit, which is
 *    `context.declaredSuit` when an Ace declaration is active, otherwise
 *    the question card's own suit.
 *
 * @returns `true` when the combination is legal, `false` otherwise.
 */
export function validateQuestionCombo(
  questionCard: Card,
  answerCard: Card,
  context: PlayabilityContext,
): boolean {
  // Rule 1: first card must be a question card
  if (questionCard.type !== "question") return false;

  // Rule 2: second card must be an answer or ace
  if (answerCard.type !== "answer" && answerCard.type !== "ace") return false;

  // Rule 3: answer card suit must match effective target suit
  const targetSuit = context.declaredSuit ?? questionCard.suit;
  return answerCard.suit === targetSuit;
}

// ---------------------------------------------------------------------------
// validateComboPlay
// ---------------------------------------------------------------------------

/**
 * Result returned by {@link validateComboPlay}.
 */
export interface ComboValidationResult {
  valid: boolean;
  /** Human-readable explanation when `valid` is `false`. */
  reason?: string;
}

/**
 * Validates a two-card combo play (one question card + one answer/ace card).
 *
 * Checks performed in order:
 * 1. The array must contain exactly 2 cards.
 * 2. There must be exactly 1 question card and 1 answer/ace card.
 * 3. The question card must itself be playable on the current top card
 *    (using the effective suit from any active Ace declaration).
 * 4. The answer card must pass {@link validateQuestionCombo}.
 *
 * @returns `{ valid: true }` when all checks pass, or
 *          `{ valid: false, reason: "..." }` with a descriptive reason string.
 */
export function validateComboPlay(
  cards: Card[],
  context: PlayabilityContext,
): ComboValidationResult {
  // Check 1: must be exactly 2 cards
  if (cards.length !== 2) {
    return {
      valid: false,
      reason: "A combo play must contain exactly 2 cards",
    };
  }

  // Check 2: identify the question card and the answer/ace card
  const questionCards = cards.filter((c) => c.type === "question");
  const answerCards = cards.filter(
    (c) => c.type === "answer" || c.type === "ace",
  );

  if (questionCards.length !== 1) {
    return {
      valid: false,
      reason: "A combo play must contain exactly 1 question card",
    };
  }

  if (answerCards.length !== 1) {
    return {
      valid: false,
      reason: "A combo play must contain exactly 1 answer or ace card",
    };
  }

  const [questionCard] = questionCards;
  const [answerCard] = answerCards;

  // Check 3: question card must be playable on the current top card
  const effectiveSuit = context.declaredSuit ?? context.topCard.suit;
  const isQuestionPlayable = isCardPlayable(
    questionCard,
    effectiveSuit,
    context.topCard.rank,
  );

  if (!isQuestionPlayable) {
    return {
      valid: false,
      reason: "The question card cannot be played on the current top card",
    };
  }

  // Check 4: answer card must satisfy the question combo rules
  if (!validateQuestionCombo(questionCard, answerCard, context)) {
    return {
      valid: false,
      reason:
        "The answer card's suit does not match the question card's required suit",
    };
  }

  return { valid: true };
}
