/**
 * @file game.ts
 * Shared TypeScript interfaces and types for the Kadi card game.
 */

// ---------------------------------------------------------------------------
// Primitive / literal types
// ---------------------------------------------------------------------------

/** The four card suits used in a standard deck. */
export type Suit = "hearts" | "diamonds" | "spades" | "clubs";

/**
 * All possible card ranks, including the special JOKER rank.
 * Numeric ranks are represented as strings for uniformity.
 */
export type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A"
  | "JOKER";

/**
 * Functional category of a card, used to determine game-rule behaviour.
 *
 * - `"answer"` – a normal playable card with no special effect
 * - `"question"` – forces the next player to play a card of the same rank or suit
 * - `"jump"` – skips the next player's turn
 * - `"kickback"` – reverses the direction of play
 * - `"penalty"` – forces the next player to draw cards
 * - `"ace"` – lets the current player declare a new suit
 */
export type CardType =
  | "answer"
  | "question"
  | "jump"
  | "kickback"
  | "penalty"
  | "ace";

/** The direction in which play proceeds around the table. */
export type Direction = "clockwise" | "counterclockwise";

/** Difficulty level for AI-controlled players. */
export type AIDifficulty = "easy" | "medium" | "hard";

/**
 * The current phase of the game state machine.
 *
 * - `"idle"` – no game is in progress
 * - `"dealing"` – cards are being distributed to players
 * - `"playerTurn"` – the human player is choosing an action
 * - `"aiTurn"` – an AI player is computing and executing its action
 * - `"questionCombo"` – a question-card chain is being resolved
 * - `"aceDeclaration"` – the active player must declare a suit after playing an Ace
 * - `"penaltyChain"` – a penalty chain is active; players may counter or accept
 * - `"nikoKadiPrompt"` – prompting the player to announce "Niko Kadi" (one card left)
 * - `"resolvingPlay"` – mid-animation / side-effect resolution between turns
 * - `"gameOver"` – the game has ended and a winner has been determined
 */
export type GamePhase =
  | "idle"
  | "dealing"
  | "playerTurn"
  | "aiTurn"
  | "questionCombo"
  | "aceDeclaration"
  | "penaltyChain"
  | "nikoKadiPrompt"
  | "resolvingPlay"
  | "gameOver";

// ---------------------------------------------------------------------------
// Core domain interfaces
// ---------------------------------------------------------------------------

/**
 * Represents a single playing card in the Kadi deck.
 */
export interface Card {
  /** Unique identifier, e.g. `"hearts-Q"` or `"JOKER-1"`. */
  id: string;
  /** The card's suit. `null` for Jokers, which have no suit. */
  suit: Suit | null;
  /** The card's rank. */
  rank: Rank;
  /** Functional category that drives game-rule behaviour. */
  type: CardType;
  /**
   * Number of cards the next player must draw when this card triggers a penalty.
   * - `0` for most cards
   * - `2` for rank-2 cards
   * - `3` for rank-3 cards
   * - `5` for Jokers
   */
  penaltyValue: number;
}

/**
 * Represents a player participating in a game session.
 */
export interface Player {
  /** Unique numeric identifier for the player within the session. */
  id: number;
  /** Display name shown in the UI. */
  name: string;
  /** `true` if this player is controlled by a human; `false` for AI players. */
  isHuman: boolean;
  /** AI difficulty level. `null` when `isHuman` is `true`. */
  difficulty: AIDifficulty | null;
  /** The cards currently in this player's hand. */
  hand: Card[];
  /**
   * Whether the player has announced "Niko Kadi" (they have one card left).
   * Must be announced before playing the second-to-last card to avoid a penalty.
   */
  hasAnnouncedNikoKadi: boolean;
  /** Seed string used to deterministically generate the player's avatar. */
  avatarSeed: string;
}

/**
 * Static configuration for a game session, established before dealing.
 */
export interface GameConfig {
  /** Total number of players (human + AI). Must be between 2 and 5 inclusive. */
  playerCount: number;
  /** Number of cards dealt to each player at the start. Either 3 or 4. */
  cardDealCount: 3 | 4;
  /** Per-player configuration entries, ordered by seating position. */
  players: PlayerConfig[];
}

/**
 * Configuration for a single player slot, used when setting up a game.
 */
export interface PlayerConfig {
  /** Display name for this player. */
  name: string;
  /** Whether this slot is controlled by a human. */
  isHuman: boolean;
  /** AI difficulty for this slot. `null` when `isHuman` is `true`. */
  difficulty: AIDifficulty | null;
}

/**
 * Tracks an active penalty chain that one or more players must resolve.
 */
export interface PendingPenalty {
  /** Cumulative number of cards the targeted player must draw if they cannot counter. */
  totalDrawCount: number;
  /** The `id` of the player who initiated the penalty chain. */
  sourcePlayerId: number;
  /** All penalty cards that have been played in the current chain, in order. */
  chainCards: Card[];
  /** Whether the current player has cards that can counter this penalty. */
  canCounter: boolean;
}

/**
 * The complete, serialisable state of a running game.
 */
export interface GameState {
  /** Current phase of the game state machine. */
  phase: GamePhase;
  /** Immutable configuration established at game start. */
  config: GameConfig;
  /** All players in turn order. */
  players: Player[];
  /** Cards remaining in the draw pile (top of pile = last element). */
  drawPile: Card[];
  /**
   * Cards in the discard pile.
   * Index `0` is the top (most recently played) card.
   */
  discardPile: Card[];
  /** Index into `players` for the player whose turn it currently is. */
  currentPlayerIndex: number;
  /** Current direction of play. */
  direction: Direction;
  /** Active penalty chain, or `null` if none is pending. */
  pendingPenalty: PendingPenalty | null;
  /**
   * Suit declared by the most recent Ace play.
   * `null` when no suit declaration is active.
   */
  declaredSuit: Suit | null;
  /** The `id` of the winning player, or `null` while the game is ongoing. */
  winnerId: number | null;
  /** The most recent action taken, or `null` at game start. */
  lastAction: GameAction | null;
  /** Monotonically increasing turn counter, starting at 1. */
  turnNumber: number;
}

// ---------------------------------------------------------------------------
// Action discriminated union
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all actions that can mutate game state.
 *
 * Each variant carries only the data required for that specific action.
 */
export type GameAction =
  | {
      /** The player played one or more cards from their hand. */
      type: "PLAY_CARDS";
      cards: Card[];
      playerId: number;
    }
  | {
      /** The player drew a card from the draw pile. */
      type: "DRAW_CARD";
      playerId: number;
    }
  | {
      /** The player declared a suit after playing an Ace. */
      type: "DECLARE_SUIT";
      suit: Suit;
      playerId: number;
    }
  | {
      /** The player announced "Niko Kadi" (one card remaining in hand). */
      type: "ANNOUNCE_NIKO_KADI";
      playerId: number;
    }
  | {
      /** The player countered an incoming penalty with their own penalty cards. */
      type: "COUNTER_PENALTY";
      cards: Card[];
      playerId: number;
    }
  | {
      /** The player accepted the penalty and will draw the required cards. */
      type: "ACCEPT_PENALTY";
      playerId: number;
    }
  | {
      /** Card animation has completed; advance to the next player's turn. */
      type: "ANIMATION_DONE";
    };

// ---------------------------------------------------------------------------
// Playability helpers
// ---------------------------------------------------------------------------

/**
 * Contextual snapshot passed to playability-evaluation functions.
 */
export interface PlayabilityContext {
  /** The card currently on top of the discard pile. */
  topCard: Card;
  /** Active suit declaration from an Ace, or `null` if none. */
  declaredSuit: Suit | null;
  /** Active penalty chain, or `null` if none. */
  pendingPenalty: PendingPenalty | null;
  /** Current game phase. */
  phase: GamePhase;
}

/**
 * The result of evaluating which cards a player may legally play.
 */
export interface PlayabilityResult {
  /** Subset of the player's hand that may currently be played. */
  playableCards: Card[];
  /**
   * Whether the player may play multiple cards in a single turn
   * (e.g. a run of question cards of the same rank).
   */
  canPlayMultiple: boolean;
  /**
   * Whether the current top card requires the player to respond with an
   * answer card before taking any other action.
   */
  requiresAnswer: boolean;
  /** Whether the player has cards that can counter an active penalty chain. */
  canCounter: boolean;
}

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------

/**
 * The outcome of an AI player's decision-making process for a single turn.
 */
export interface AIDecision {
  /** The action the AI has chosen to execute. */
  action: GameAction;
  /** Simulated thinking time in milliseconds before the action is revealed. */
  thinkTimeMs: number;
  /** Optional human-readable explanation of the AI's reasoning (for debugging). */
  reasoning?: string;
}

// ---------------------------------------------------------------------------
// Animation & audio
// ---------------------------------------------------------------------------

/**
 * Discriminated union of animation events emitted by game engine transitions.
 * UI layers subscribe to these events to drive card animations.
 */
export type AnimationEvent =
  | {
      /** Cards are being dealt to a player. */
      type: "DEAL";
      targetPlayerId: number;
      cardCount: number;
    }
  | {
      /** A player played cards onto the discard pile. */
      type: "PLAY";
      cards: Card[];
      fromPlayerId: number;
    }
  | {
      /** A player drew cards from the draw pile. */
      type: "DRAW";
      toPlayerId: number;
      cardCount: number;
    }
  | {
      /** A player won the game. */
      type: "WIN";
      winnerId: number;
      winningCards: Card[];
    };

/**
 * Identifiers for all audio cues that the sound manager can play.
 *
 * - `"card-play"` – a card was placed on the discard pile
 * - `"card-draw"` – a card was drawn from the draw pile
 * - `"card-deal"` – cards are being dealt at game start
 * - `"penalty-incoming"` – a penalty card was played against the current player
 * - `"niko-kadi-announce"` – a player announced "Niko Kadi"
 * - `"win-fanfare"` – a player won the game
 * - `"direction-reverse"` – a kickback card reversed play direction
 * - `"turn-skip"` – a jump card skipped the next player's turn
 */
export type AudioCue =
  | "card-play"
  | "card-draw"
  | "card-deal"
  | "penalty-incoming"
  | "niko-kadi-announce"
  | "win-fanfare"
  | "direction-reverse"
  | "turn-skip";
