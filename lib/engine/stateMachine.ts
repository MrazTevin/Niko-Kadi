// lib/engine/stateMachine.ts
import {
  GameState,
  GameAction,
  GamePhase,
  Direction,
  Card,
  Suit,
  PendingPenalty,
  PlayabilityContext,
  Player,
} from "@/lib/types/game";
import { checkWinCondition, isNikoKadiEligible } from "./nikoKadi";
import { getPlayableCards } from "./playability";
import { validateComboPlay } from "./comboValidator";
import {
  addToChain,
  acceptPenalty,
  type PenaltyChainState,
} from "./penaltyChain";
import { reshuffleDiscard } from "./deck";

/**
 * Error thrown when an action is invalid for the current phase.
 */
export class InvalidActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidActionError";
  }
}

/**
 * Pure transition function – takes current state and an action, returns a new state.
 * Throws InvalidActionError if the action is illegal in the current phase.
 */
export function transition(state: GameState, action: GameAction): GameState {
  // Make a shallow copy of the state to avoid mutations
  let newState: GameState = { ...state };

  // --- Phase-specific handling ---
  switch (state.phase) {
    case "idle":
      throw new InvalidActionError(
        "Cannot perform actions while game is idle. Start a game first.",
      );

    case "dealing":
      throw new InvalidActionError("Game is still dealing. Please wait.");

    case "gameOver":
      throw new InvalidActionError("Game is already over. Start a new game.");

    // ------------------------------
    // PLAYER TURN
    // ------------------------------
    case "playerTurn":
      newState = handlePlayerTurn(state, action);
      break;

    // ------------------------------
    // AI TURN (same as player turn, but triggered by AI scheduler)
    // ------------------------------
    case "aiTurn":
      newState = handlePlayerTurn(state, action);
      break;

    // ------------------------------
    // QUESTION COMBO
    // ------------------------------
    case "questionCombo":
      newState = handleQuestionCombo(state, action);
      break;

    // ------------------------------
    // ACE DECLARATION
    // ------------------------------
    case "aceDeclaration":
      newState = handleAceDeclaration(state, action);
      break;

    // ------------------------------
    // PENALTY CHAIN
    // ------------------------------
    case "penaltyChain":
      newState = handlePenaltyChain(state, action);
      break;

    // ------------------------------
    // NIKO KADI PROMPT
    // ------------------------------
    case "nikoKadiPrompt":
      newState = handleNikoKadiPrompt(state, action);
      break;

    // ------------------------------
    // RESOLVING PLAY
    // ------------------------------
    case "resolvingPlay":
      // After animation completes, advance to next player's turn
      newState = handleResolvingPlay(state, action);
      break;

    default:
      throw new InvalidActionError(`Unknown phase: ${state.phase}`);
  }

  // Ensure the new state has the correct phase and turn order
  return newState;
}

// ----------------------------------------------------------------------------
// Handlers for each phase
// ----------------------------------------------------------------------------

function handlePlayerTurn(state: GameState, action: GameAction): GameState {
  // Get the current player (needed for all actions in this phase)
  const currentPlayer = state.players[state.currentPlayerIndex];

  // Ensure the action player is the current player (skip for non-player actions like ANIMATION_DONE)
  if ("playerId" in action) {
    if (action.playerId !== currentPlayer.id) {
      throw new InvalidActionError(
        `It is not player ${action.playerId}'s turn.`,
      );
    }
  }

  switch (action.type) {
    case "PLAY_CARDS": {
      // Validate the play
      const context = buildPlayabilityContext(state);
      const { playableCards, canPlayMultiple, requiresAnswer } =
        getPlayableCards(currentPlayer.hand, context);

      // The selected cards must all be playable
      const allPlayable = action.cards.every((card) =>
        playableCards.some((pc) => pc.id === card.id),
      );
      if (!allPlayable || action.cards.length === 0) {
        throw new InvalidActionError(
          "One or more selected cards are not playable.",
        );
      }

      // If more than one card, check if it's allowed (question combo or all answers)
      if (action.cards.length > 1) {
        // Check if it's a valid question combo
        const comboValid = validateComboPlay(action.cards, context);
        if (!comboValid.valid) {
          // Could also be multiple answers (all playable)
          const allAnswers = action.cards.every(
            (c) => c.type === "answer" || c.type === "ace",
          );
          if (!allAnswers) {
            throw new InvalidActionError(
              `Invalid multi-card play: ${comboValid.reason}`,
            );
          }
          // All answers: they must all be playable (already checked above)
        }
      }

      // Remove played cards from hand
      const remainingHand = currentPlayer.hand.filter(
        (c) => !action.cards.some((pc) => pc.id === c.id),
      );
      const updatedPlayers = state.players.map((p) =>
        p.id === currentPlayer.id ? { ...p, hand: remainingHand } : p,
      );

      // Add played cards to discard pile (top of pile)
      const newDiscard = [...action.cards, ...state.discardPile];

      // Determine if the player has won
      const newState: GameState = {
        ...state,
        players: updatedPlayers,
        discardPile: newDiscard,
        lastAction: action,
      };

      // Check win condition
      if (checkWinCondition(newState, currentPlayer.id)) {
        return {
          ...newState,
          phase: "gameOver",
          winnerId: currentPlayer.id,
        };
      }

      // If not won, transition to resolvingPlay, then after animation, move to next turn
      return {
        ...newState,
        phase: "resolvingPlay",
      };
    }

    case "DRAW_CARD": {
      // If there is a pending penalty, drawing triggers penalty resolution?
      // Actually, drawing when no penalty is a normal draw.
      if (state.pendingPenalty) {
        // If there's a penalty, drawing is not allowed; they must accept or counter.
        throw new InvalidActionError(
          "Cannot draw while a penalty is pending. Accept or counter the penalty.",
        );
      }

      // Draw one card from draw pile
      let drawPile = [...state.drawPile];
      let drawnCard: Card | null = null;
      if (drawPile.length === 0) {
        // Reshuffle discard pile into draw pile
        const reshuffled = reshuffleDiscard(state);
        drawPile = reshuffled.drawPile;
        // Ensure we have a draw pile now
        if (drawPile.length === 0) {
          throw new InvalidActionError("No cards left to draw.");
        }
      }
      drawnCard = drawPile.pop()!;

      // Add to player's hand
      const updatedPlayers = state.players.map((p) =>
        p.id === currentPlayer.id ? { ...p, hand: [...p.hand, drawnCard!] } : p,
      );

      // Check if player can now announce Niko Kadi (eligibility may have changed)
      // But we don't automatically prompt; we'll handle that in UI.

      // Advance to next player
      const nextIndex = getNextPlayerIndex(state, state.currentPlayerIndex);
      return {
        ...state,
        players: updatedPlayers,
        drawPile,
        currentPlayerIndex: nextIndex,
        phase: getNextPhase(state, nextIndex),
        lastAction: action,
        turnNumber: state.turnNumber + 1,
      };
    }

    case "ANNOUNCE_NIKO_KADI": {
      // Check if eligible
      const context = buildPlayabilityContext(state);
      if (!isNikoKadiEligible(currentPlayer, context)) {
        throw new InvalidActionError(
          "Player is not eligible to announce Niko Kadi.",
        );
      }

      const updatedPlayers = state.players.map((p) =>
        p.id === currentPlayer.id ? { ...p, hasAnnouncedNikoKadi: true } : p,
      );

      return {
        ...state,
        players: updatedPlayers,
        phase: "playerTurn", // stay in same phase
        lastAction: action,
      };
    }

    default:
      throw new InvalidActionError(
        `Action ${action.type} not allowed in playerTurn phase.`,
      );
  }
}

function handleQuestionCombo(state: GameState, action: GameAction): GameState {
  // In this phase, player must confirm a combo (PLAY_CARDS with exactly 2 cards) or cancel (DRAW_CARD? or specific cancel action).
  // We'll treat PLAY_CARDS with exactly 2 cards as confirmation, and DRAW_CARD as cancel.
  const currentPlayer = state.players[state.currentPlayerIndex];

  switch (action.type) {
    case "PLAY_CARDS": {
      // Must be exactly 2 cards
      if (action.cards.length !== 2) {
        throw new InvalidActionError("Combo must be exactly 2 cards.");
      }
      // Validate combo
      const context = buildPlayabilityContext(state);
      const result = validateComboPlay(action.cards, context);
      if (!result.valid) {
        throw new InvalidActionError(`Invalid combo: ${result.reason}`);
      }

      // Remove played cards from hand
      const remainingHand = currentPlayer.hand.filter(
        (c) => !action.cards.some((pc) => pc.id === c.id),
      );
      const updatedPlayers = state.players.map((p) =>
        p.id === currentPlayer.id ? { ...p, hand: remainingHand } : p,
      );

      // Add to discard pile
      const newDiscard = [...action.cards, ...state.discardPile];

      const newState: GameState = {
        ...state,
        players: updatedPlayers,
        discardPile: newDiscard,
        lastAction: action,
        phase: "resolvingPlay", // after animation, check win and advance
      };

      // Check win
      if (checkWinCondition(newState, currentPlayer.id)) {
        return {
          ...newState,
          phase: "gameOver",
          winnerId: currentPlayer.id,
        };
      }
      return newState;
    }

    case "DRAW_CARD": {
      // Cancel the combo: return to playerTurn with no selection
      return {
        ...state,
        phase: "playerTurn",
      };
    }

    default:
      throw new InvalidActionError(
        `Action ${action.type} not allowed in questionCombo phase.`,
      );
  }
}

function handleAceDeclaration(state: GameState, action: GameAction): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];

  switch (action.type) {
    case "DECLARE_SUIT": {
      // Set the declared suit
      const declaredSuit = action.suit;

      const newState: GameState = {
        ...state,
        declaredSuit,
        phase: "resolvingPlay",
        lastAction: action,
      };

      // Check win? The Ace play might have emptied hand, but the win check is done in resolvingPlay.
      return newState;
    }

    default:
      throw new InvalidActionError(
        `Action ${action.type} not allowed in aceDeclaration phase.`,
      );
  }
}

function handlePenaltyChain(state: GameState, action: GameAction): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const penalty = state.pendingPenalty;
  if (!penalty) {
    throw new InvalidActionError("No pending penalty to handle.");
  }

  switch (action.type) {
    case "COUNTER_PENALTY": {
      // Must be exactly one card (counter)
      if (action.cards.length !== 1) {
        throw new InvalidActionError("Counter must be exactly one card.");
      }
      const counterCard = action.cards[0];
      // Check if it's a valid counter: same rank as top penalty card, or Ace
      const topPenaltyCard = penalty.chainCards[penalty.chainCards.length - 1];
      const isValid =
        counterCard.rank === "A" || counterCard.rank === topPenaltyCard.rank;
      if (!isValid) {
        throw new InvalidActionError("Card cannot counter this penalty.");
      }

      // Remove the counter card from player's hand
      const remainingHand = currentPlayer.hand.filter(
        (c) => c.id !== counterCard.id,
      );
      const updatedPlayers = state.players.map((p) =>
        p.id === currentPlayer.id ? { ...p, hand: remainingHand } : p,
      );

      // Add counter card to discard pile (it becomes the new top)
      const newDiscard = [counterCard, ...state.discardPile];

      // Determine new penalty chain state (if Ace, chain clears; else add to chain)
      let newPenalty: PendingPenalty | null = null;
      let declaredSuit = state.declaredSuit;
      if (counterCard.rank === "A") {
        // Ace clears the chain
        // Need to determine suit to continue with (suit of the card before the Ace in the chain)
        // We'll use getPreJokerSuit from penaltyChain, but that's for Jokers; for Ace, we need the suit of the previous penalty card.
        // From rules: "If a player plays an Ace as a counter, the system SHALL clear the penalty chain without any player drawing cards.
        // Play continues with the suit from the previous Penalty Card."
        const previousPenalty =
          penalty.chainCards[penalty.chainCards.length - 1];
        declaredSuit = previousPenalty.suit; // or if none, use top card's suit? We'll assume there is always a previous.
        // Chain cleared
        newPenalty = null;
      } else {
        // Same rank: add to chain
        const chainState: PenaltyChainState = {
          accumulated: penalty.totalDrawCount,
          chainCards: penalty.chainCards,
          currentTopCard: penalty.chainCards[penalty.chainCards.length - 1],
        };
        const newChain = addToChain(chainState, counterCard);
        newPenalty = {
          totalDrawCount: newChain.accumulated,
          sourcePlayerId: penalty.sourcePlayerId,
          chainCards: newChain.chainCards,
          canCounter: true, // Will be recomputed in next turn
        };
      }

      // After counter, the turn passes to the next player (the one who must now respond to the penalty)
      const nextIndex = getNextPlayerIndex(state, state.currentPlayerIndex);
      const nextPlayer = state.players[nextIndex];
      // Check if next player can counter
      const context = buildPlayabilityContext({
        ...state,
        pendingPenalty: newPenalty,
      });
      const { playableCards, canCounter } = getPlayableCards(
        nextPlayer.hand,
        context,
      );
      // Update canCounter in newPenalty
      if (newPenalty) {
        newPenalty.canCounter = canCounter;
      }

      return {
        ...state,
        players: updatedPlayers,
        discardPile: newDiscard,
        pendingPenalty: newPenalty,
        declaredSuit,
        currentPlayerIndex: nextIndex,
        phase: newPenalty ? "penaltyChain" : "playerTurn", // if cleared, go to playerTurn
        lastAction: action,
      };
    }

    case "ACCEPT_PENALTY": {
      // Player accepts the penalty: draw the required cards
      // We'll reuse the acceptPenalty function from penaltyChain.ts
      const updatedState = acceptPenalty(
        { ...state, pendingPenalty: penalty },
        currentPlayer.id,
      );
      // After accepting, turn advances to next player
      const nextIndex = getNextPlayerIndex(
        updatedState,
        updatedState.currentPlayerIndex,
      );
      return {
        ...updatedState,
        currentPlayerIndex: nextIndex,
        phase: getNextPhase(updatedState, nextIndex),
        lastAction: action,
        turnNumber: updatedState.turnNumber + 1,
      };
    }

    default:
      throw new InvalidActionError(
        `Action ${action.type} not allowed in penaltyChain phase.`,
      );
  }
}

function handleNikoKadiPrompt(state: GameState, action: GameAction): GameState {
  // In this phase, player may announce Niko Kadi or dismiss.
  const currentPlayer = state.players[state.currentPlayerIndex];

  switch (action.type) {
    case "ANNOUNCE_NIKO_KADI": {
      const context = buildPlayabilityContext(state);
      if (!isNikoKadiEligible(currentPlayer, context)) {
        throw new InvalidActionError(
          "Player is not eligible to announce Niko Kadi.",
        );
      }
      const updatedPlayers = state.players.map((p) =>
        p.id === currentPlayer.id ? { ...p, hasAnnouncedNikoKadi: true } : p,
      );
      return {
        ...state,
        players: updatedPlayers,
        phase: "playerTurn",
        lastAction: action,
      };
    }
    // Dismiss: return to playerTurn without announcement
    case "DRAW_CARD": // or a specific dismiss action; we'll use DRAW_CARD as dismiss for simplicity
      return {
        ...state,
        phase: "playerTurn",
        lastAction: null, // clear last action
      };
    default:
      throw new InvalidActionError(
        `Action ${action.type} not allowed in nikoKadiPrompt phase.`,
      );
  }
}

function handleResolvingPlay(state: GameState, action: GameAction): GameState {
  // After animation completes, advance to the next player's turn
  if (action.type !== "ANIMATION_DONE") {
    throw new InvalidActionError(
      `Only ANIMATION_DONE is allowed in resolvingPlay phase, got ${action.type}`,
    );
  }

  // Advance to next player
  const nextIndex = getNextPlayerIndex(state, state.currentPlayerIndex);
  const nextPhase = getNextPhase(state, nextIndex);

  return {
    ...state,
    currentPlayerIndex: nextIndex,
    phase: nextPhase,
    lastAction: action,
    turnNumber: state.turnNumber + 1,
  };
}

// ----------------------------------------------------------------------------
// Helper functions
// ----------------------------------------------------------------------------

function buildPlayabilityContext(state: GameState): PlayabilityContext {
  return {
    topCard: state.discardPile[0],
    declaredSuit: state.declaredSuit,
    pendingPenalty: state.pendingPenalty,
    phase: state.phase,
  };
}

/**
 * Returns the index of the next player, respecting direction and jump effects.
 * Does not handle skips from Jump cards; that must be applied separately.
 */
function getNextPlayerIndex(state: GameState, currentIndex: number): number {
  const playerCount = state.players.length;
  const delta = state.direction === "clockwise" ? 1 : -1;
  return (currentIndex + delta + playerCount) % playerCount;
}

/**
 * Determines the next phase based on whether the next player is human or AI.
 */
function getNextPhase(state: GameState, nextIndex: number): GamePhase {
  const nextPlayer = state.players[nextIndex];
  return nextPlayer.isHuman ? "playerTurn" : "aiTurn";
}
