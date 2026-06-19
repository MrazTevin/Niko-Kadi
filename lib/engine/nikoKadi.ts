import { Card, GameState, Player, PlayabilityContext } from "@/lib/types/game";
import { isCardPlayable } from "./playability";
import { validateComboPlay } from "./comboValidator";

/**
 * Checks if a player can play their entire hand in a single valid move.
 *
 * @param hand - The player's current hand.
 * @param context - The current game context.
 * @returns `true` if the hand can be played as a winning move.
 */
export function canPlayAllCards(
  hand: Card[],
  context: PlayabilityContext,
): boolean {
  if (hand.length === 0) return false;

  // 1. Single card: must be answer or ace and playable.
  if (hand.length === 1) {
    const card = hand[0];
    const isAnswer = card.type === "answer" || card.type === "ace";
    if (!isAnswer) return false;
    const effectiveSuit = context.declaredSuit ?? context.topCard.suit;
    return isCardPlayable(card, effectiveSuit, context.topCard.rank);
  }

  // 2. Two cards: must be Question + Answer combo valid.
  if (hand.length === 2) {
    const result = validateComboPlay(hand, context);
    return result.valid;
  }

  // 3. More than two cards: all must be answer or ace, and each must be playable.
  const allAnswers = hand.every((c) => c.type === "answer" || c.type === "ace");
  if (!allAnswers) return false;

  const effectiveSuit = context.declaredSuit ?? context.topCard.suit;
  const effectiveRank = context.topCard.rank;
  return hand.every((c) => isCardPlayable(c, effectiveSuit, effectiveRank));
}
// export function canPlayAllCards(hand: Card[], context: PlayabilityContext): boolean {
//   if (hand.length === 0) return false;

//   // 1. Single card: must be answer or ace and playable.
//   if (hand.length === 1) {
//     const card = hand[0];
//     const isAnswer = card.type === 'answer' || card.type === 'ace';
//     if (!isAnswer) return false;
//     const effectiveSuit = context.declaredSuit ?? context.topCard.suit;
//     return isCardPlayable(card, effectiveSuit, context.topCard.rank);
//   }

//   // 2. Two cards: must be Question + Answer combo valid.
//   if (hand.length === 2) {
//     const result = validateComboPlay(hand, context);
//     return result.valid;
//   }

//   // 3. More than two cards: all must be answer or ace, and each must be playable individually.
//   // According to rules, multiple answer cards can be played together if they all match suit/rank.
//   // We'll check that every card is answer/ace and is playable.
//   const allAnswers = hand.every(c => c.type === 'answer' || c.type === 'ace');
//   if (!allAnswers) return false;

//   const effectiveSuit = context.declaredSuit ?? context.topCard.suit;
//   const effectiveRank = context.topCard.rank;
//   return hand.every(c => isCardPlayable(c, effectiveSuit, effectiveRank));
// }

/**
 * Determines if a player is eligible to announce "Niko Kadi".
 *
 * @param player - The player to check.
 * @param context - The current game context.
 * @returns `true` if the player can announce Niko Kadi.
 */
export function isNikoKadiEligible(
  player: Player,
  context: PlayabilityContext,
): boolean {
  if (player.hasAnnouncedNikoKadi) return false;
  if (player.hand.length === 0) return false;
  return canPlayAllCards(player.hand, context);
}

/**
 * Checks if a player has won after a play.
 *
 * Conditions:
 * - Player's hand is empty.
 * - Player has announced Niko Kadi.
 * - No other player has an empty hand (to prevent simultaneous wins).
 *
 * @param state - The current game state.
 * @param playerId - The player ID to check.
 * @returns `true` if the player has won.
 */
export function checkWinCondition(state: GameState, playerId: number): boolean {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return false;
  if (player.hand.length !== 0) return false;
  if (!player.hasAnnouncedNikoKadi) return false;

  // Ensure no other player is cardless.
  const otherCardless = state.players.some(
    (p) => p.id !== playerId && p.hand.length === 0,
  );
  return !otherCardless;
}
