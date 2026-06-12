/**
 * @file penaltyChain.ts
 * Pure functions for managing penalty chains in the Kadi card game.
 *
 * A penalty chain accumulates draw penalties when players counter incoming
 * penalty cards with their own penalty cards. These functions handle chain
 * construction, Ace-based resolution, and final penalty acceptance.
 */

import type { Card, GameState, PendingPenalty, Suit } from "../types/game";

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

export interface PenaltyChainState {
  accumulated: number;
  chainCards: Card[];
  currentTopCard: Card;
}

// ---------------------------------------------------------------------------
// Chain construction
// ---------------------------------------------------------------------------

/**
 * Immutably adds a card to an existing penalty chain.
 *
 * @param chain - The current chain state.
 * @param card  - The card being added (must be a penalty card).
 * @returns A new {@link PenaltyChainState} with the card appended and
 *          `accumulated` incremented by `card.penaltyValue`.
 */
export function addToChain(
  chain: PenaltyChainState,
  card: Card,
): PenaltyChainState {
  return {
    accumulated: chain.accumulated + card.penaltyValue,
    chainCards: [...chain.chainCards, card],
    currentTopCard: card,
  };
}

// ---------------------------------------------------------------------------
// Ace resolution
// ---------------------------------------------------------------------------

/**
 * Resolves a penalty chain using an Ace card.
 *
 * When a player plays an Ace against an incoming penalty chain the chain is
 * cancelled entirely. The suit that was active before the Ace play is
 * preserved so the game can continue on the correct suit.
 *
 * @param chain        - The chain being resolved (not used in the returned
 *                       value but kept for signature consistency).
 * @param ace          - The Ace card played to cancel the chain.
 * @param previousSuit - The suit that was in effect before this Ace.
 * @returns `{ newChain: null, continueSuit: previousSuit }`.
 */
export function resolveWithAce(
  chain: PenaltyChainState,
  ace: Card,
  previousSuit: Suit,
): { newChain: null; continueSuit: Suit } {
  // Suppress unused-variable warnings while keeping the parameters in the
  // public signature for callers that pass them explicitly.
  void chain;
  void ace;

  return { newChain: null, continueSuit: previousSuit };
}

// ---------------------------------------------------------------------------
// Penalty acceptance
// ---------------------------------------------------------------------------

/**
 * Applies a pending penalty to a player: draws the required cards, rebuilds
 * the draw pile if necessary, and clears the pending penalty on the state.
 *
 * @param state    - The current game state (not mutated).
 * @param playerId - ID of the player who is accepting the penalty.
 * @returns A new {@link GameState} reflecting the penalty resolution.
 */
export function acceptPenalty(state: GameState, playerId: number): GameState {
  const penalty = state.pendingPenalty as PendingPenalty;
  const totalToDraw = penalty.totalDrawCount;

  // -----------------------------------------------------------------------
  // Ensure the draw pile has enough cards, reshuffling the discard pile
  // (minus its current top card) into the draw pile if needed.
  // -----------------------------------------------------------------------

  let drawPile = [...state.drawPile];
  let discardPile = [...state.discardPile];

  if (drawPile.length < totalToDraw) {
    // Keep the top discard card in place; shuffle the rest back into the draw pile.
    const [topDiscard, ...reshuffleCards] = discardPile;

    // Simple Fisher-Yates shuffle (pure — no external RNG dependency needed
    // beyond Math.random which is acceptable in a game context).
    const shuffled = [...reshuffleCards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    drawPile = [...drawPile, ...shuffled];
    discardPile = [topDiscard];
  }

  // Draw up to `totalToDraw` cards (or as many as remain if still short).
  const drawCount = Math.min(totalToDraw, drawPile.length);
  const drawnCards = drawPile.slice(drawPile.length - drawCount);
  const remainingDrawPile = drawPile.slice(0, drawPile.length - drawCount);

  // -----------------------------------------------------------------------
  // Update the targeted player's hand.
  // -----------------------------------------------------------------------

  const updatedPlayers = state.players.map((player) => {
    if (player.id !== playerId) return player;
    return { ...player, hand: [...player.hand, ...drawnCards] };
  });

  // -----------------------------------------------------------------------
  // Determine declaredSuit after clearing the penalty.
  // If the last chain card was a JOKER, look up the pre-Joker suit so the
  // game resumes on the correct suit; otherwise clear the declared suit.
  // -----------------------------------------------------------------------

  const chainCards = penalty.chainCards;
  const lastChainCard = chainCards[chainCards.length - 1];

  const declaredSuit: Suit | null =
    lastChainCard?.rank === "JOKER"
      ? getPreJokerSuit(chainCards, discardPile)
      : null;

  return {
    ...state,
    players: updatedPlayers,
    drawPile: remainingDrawPile,
    discardPile,
    pendingPenalty: null,
    declaredSuit,
  };
}

// ---------------------------------------------------------------------------
// Suit recovery helpers
// ---------------------------------------------------------------------------

/**
 * Finds the suit that was active before a Joker was played by walking the
 * chain cards in reverse and skipping any Jokers.
 *
 * Falls back to `discardPile[1]?.suit` (the card directly under the Joker on
 * the discard pile) when every card in `chainCards` is a Joker.
 *
 * @param chainCards  - The penalty chain cards, in play order.
 * @param discardPile - The current discard pile (index 0 = top card).
 * @returns The last non-Joker suit found, or `null` if none can be determined.
 */
export function getPreJokerSuit(
  chainCards: Card[],
  discardPile: Card[],
): Suit | null {
  // Walk from the most-recent chain card backwards, skipping JOKERs.
  for (let i = chainCards.length - 1; i >= 0; i--) {
    const card = chainCards[i];
    if (card.rank !== "JOKER" && card.suit !== null) {
      return card.suit;
    }
  }

  // All chain cards were JOKERs — fall back to the card under the Joker in
  // the discard pile (index 1, since index 0 is the Joker itself).
  const cardUnderJoker = discardPile[1];
  if (cardUnderJoker?.suit != null) {
    return cardUnderJoker.suit;
  }

  return null;
}
