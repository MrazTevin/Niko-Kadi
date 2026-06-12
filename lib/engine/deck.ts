import {
  Card,
  Suit,
  Rank,
  CardType,
  GameConfig,
  Player,
  PlayerConfig,
  GameState,
} from "@/lib/types/game";

// ---------------------------------------------------------------------------
// Card creation helpers
// ---------------------------------------------------------------------------

const SUITS: Suit[] = ["hearts", "diamonds", "spades", "clubs"];
const RANKS: Rank[] = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

/**
 * Returns the functional card type based on rank.
 */
export function getCardType(rank: Rank): CardType {
  const typeMap: Record<Rank, CardType> = {
    "2": "penalty",
    "3": "penalty",
    "4": "answer",
    "5": "answer",
    "6": "answer",
    "7": "answer",
    "8": "question",
    "9": "answer",
    "10": "answer",
    J: "jump",
    Q: "question",
    K: "kickback",
    A: "ace",
    JOKER: "penalty",
  };
  return typeMap[rank];
}

/**
 * Returns the number of cards the next player must draw when this penalty is played.
 */
export function getPenaltyValue(rank: Rank): number {
  if (rank === "2") return 2;
  if (rank === "3") return 3;
  if (rank === "JOKER") return 5;
  return 0;
}

/**
 * Creates a full 54‑card deck (52 standard + 2 Jokers).
 */
export function createDeck(): Card[] {
  const cards: Card[] = [];

  // Standard 52 cards
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        type: getCardType(rank),
        penaltyValue: getPenaltyValue(rank),
      });
    }
  }

  // Two Jokers
  for (let i = 1; i <= 2; i++) {
    cards.push({
      id: `JOKER-${i}`,
      suit: null,
      rank: "JOKER",
      type: "penalty",
      penaltyValue: 5,
    });
  }

  return cards;
}

// ---------------------------------------------------------------------------
// Shuffling (Fisher‑Yates)
// ---------------------------------------------------------------------------

/**
 * Pure Fisher‑Yates shuffle – returns a new shuffled array.
 */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// Dealing and starter validation
// ---------------------------------------------------------------------------

const INVALID_STARTERS: Rank[] = ["2", "3", "Q", "K", "J", "A", "JOKER"];

/**
 * Deals cards to players and sets up the draw/discard piles.
 * Returns the initial game state (players, draw pile, discard pile).
 */
export function dealCards(config: GameConfig): {
  players: Player[];
  drawPile: Card[];
  discardPile: Card[];
} {
  let deck = shuffle(createDeck());

  // 1. Deal round‑robin to each player
  const playerHands: Card[][] = Array.from(
    { length: config.playerCount },
    () => [],
  );
  for (let i = 0; i < config.cardDealCount; i++) {
    for (let p = 0; p < config.playerCount; p++) {
      const card = deck.shift();
      if (!card) throw new Error("Not enough cards in deck during deal");
      playerHands[p].push(card);
    }
  }

  // 2. Find a valid starter card
  let starterIndex = deck.findIndex(
    (card) => !INVALID_STARTERS.includes(card.rank),
  );
  // Edge case: all remaining cards are invalid – reshuffle
  if (starterIndex === -1) {
    deck = shuffle(deck);
    starterIndex = deck.findIndex(
      (card) => !INVALID_STARTERS.includes(card.rank),
    );
  }
  const [starter] = deck.splice(starterIndex, 1);

  // 3. Build Player objects
  const players: Player[] = config.players.map(
    (pc: PlayerConfig, idx: number) => ({
      id: idx,
      name: pc.name,
      isHuman: pc.isHuman,
      difficulty: pc.difficulty,
      hand: playerHands[idx],
      hasAnnouncedNikoKadi: false,
      avatarSeed: `${pc.name}-${idx}`,
    }),
  );

  return {
    players,
    drawPile: deck,
    discardPile: [starter],
  };
}

/**
 * Reshuffles the discard pile (except the top card) into the draw pile.
 * Used when the draw pile becomes empty.
 */
export function reshuffleDiscard(state: GameState): GameState {
  const [topCard, ...rest] = state.discardPile;
  return {
    ...state,
    drawPile: shuffle(rest),
    discardPile: [topCard],
  };
}
// /**
//  * @file deck.ts
//  * Pure functions for deck creation, shuffling, dealing, and reshuffling in Kadi.
//  */

// import type {
//   Card,
//   CardType,
//   GameConfig,
//   GameState,
//   Player,
//   Rank,
//   Suit,
// } from "../types/game";

// // ---------------------------------------------------------------------------
// // Constants
// // ---------------------------------------------------------------------------

// const SUITS: Suit[] = ["hearts", "diamonds", "spades", "clubs"];
// const RANKS: Rank[] = [
//   "2",
//   "3",
//   "4",
//   "5",
//   "6",
//   "7",
//   "8",
//   "9",
//   "10",
//   "J",
//   "Q",
//   "K",
//   "A",
// ];
// const INVALID_STARTERS: Rank[] = ["2", "3", "Q", "K", "J", "A", "JOKER"];

// // ---------------------------------------------------------------------------
// // getCardType
// // ---------------------------------------------------------------------------

// /**
//  * Returns the functional CardType for a given rank.
//  */
// export function getCardType(rank: Rank): CardType {
//   switch (rank) {
//     case "2":
//     case "3":
//     case "JOKER":
//       return "penalty";
//     case "4":
//     case "5":
//     case "6":
//     case "7":
//     case "9":
//     case "10":
//       return "answer";
//     case "8":
//     case "Q":
//       return "question";
//     case "J":
//       return "jump";
//     case "K":
//       return "kickback";
//     case "A":
//       return "ace";
//   }
// }

// // ---------------------------------------------------------------------------
// // getPenaltyValue
// // ---------------------------------------------------------------------------

// /**
//  * Returns the number of cards the next player must draw when this rank
//  * triggers a penalty. Returns 0 for non-penalty ranks.
//  */
// export function getPenaltyValue(rank: Rank): number {
//   switch (rank) {
//     case "2":
//       return 2;
//     case "3":
//       return 3;
//     case "JOKER":
//       return 5;
//     default:
//       return 0;
//   }
// }

// // ---------------------------------------------------------------------------
// // createDeck
// // ---------------------------------------------------------------------------

// /**
//  * Builds and returns a full 54-card Kadi deck:
//  * 52 standard cards (4 suits × 13 ranks) + JOKER-1 + JOKER-2.
//  */
// export function createDeck(): Card[] {
//   const deck: Card[] = [];

//   for (const suit of SUITS) {
//     for (const rank of RANKS) {
//       deck.push({
//         id: `${suit}-${rank}`,
//         suit,
//         rank,
//         type: getCardType(rank),
//         penaltyValue: getPenaltyValue(rank),
//       });
//     }
//   }

//   // Add the two Jokers (no suit)
//   for (const n of [1, 2] as const) {
//     deck.push({
//       id: `JOKER-${n}`,
//       suit: null,
//       rank: "JOKER",
//       type: getCardType("JOKER"),
//       penaltyValue: getPenaltyValue("JOKER"),
//     });
//   }

//   return deck;
// }

// // ---------------------------------------------------------------------------
// // shuffle
// // ---------------------------------------------------------------------------

// /**
//  * Pure Fisher-Yates shuffle — returns a new array, leaving the input untouched.
//  */
// export function shuffle<T>(arr: T[]): T[] {
//   const result = [...arr];
//   for (let i = result.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [result[i], result[j]] = [result[j], result[i]];
//   }
//   return result;
// }

// // ---------------------------------------------------------------------------
// // dealCards
// // ---------------------------------------------------------------------------

// /**
//  * Deals cards according to the provided GameConfig.
//  *
//  * - Cards are dealt round-robin to each player.
//  * - The first card of the discard pile must not be in INVALID_STARTERS.
//  *   If no valid starter is found, the remainder of the draw pile is reshuffled
//  *   until a valid starter card is located.
//  * - Returns fully constructed Player objects along with the remaining draw pile
//  *   and the initial discard pile.
//  */
// export function dealCards(config: GameConfig): {
//   players: Player[];
//   drawPile: Card[];
//   discardPile: Card[];
// } {
//   const { playerCount, cardDealCount, players: playerConfigs } = config;

//   // Start with a freshly shuffled full deck
//   let workingDeck = shuffle(createDeck());

//   // Build player objects with empty hands
//   const players: Player[] = playerConfigs.map((pc, i) => ({
//     id: i,
//     name: pc.name,
//     isHuman: pc.isHuman,
//     difficulty: pc.difficulty,
//     hand: [] as Card[],
//     hasAnnouncedNikoKadi: false,
//     avatarSeed: `${pc.name}-${i}`,
//   }));

//   // Deal round-robin
//   const totalCards = playerCount * cardDealCount;
//   for (let cardIndex = 0; cardIndex < totalCards; cardIndex++) {
//     const playerIndex = cardIndex % playerCount;
//     const card = workingDeck.shift();
//     if (card) {
//       players[playerIndex].hand.push(card);
//     }
//   }

//   // Find a valid starter for the discard pile
//   let starterIndex = workingDeck.findIndex(
//     (c) => !INVALID_STARTERS.includes(c.rank),
//   );

//   if (starterIndex === -1) {
//     // Edge case: no valid starter found — reshuffle the remainder and try again
//     workingDeck = shuffle(workingDeck);
//     starterIndex = workingDeck.findIndex(
//       (c) => !INVALID_STARTERS.includes(c.rank),
//     );
//   }

//   // If still none (extremely unlikely with a full deck), fall back to index 0
//   if (starterIndex === -1) {
//     starterIndex = 0;
//   }

//   const [starterCard] = workingDeck.splice(starterIndex, 1);
//   const discardPile: Card[] = [starterCard];

//   return { players, drawPile: workingDeck, discardPile };
// }

// // ---------------------------------------------------------------------------
// // reshuffleDiscard
// // ---------------------------------------------------------------------------

// /**
//  * Pure function: moves all discard-pile cards except the top card back into
//  * the draw pile (shuffled), and returns a new GameState reflecting this.
//  */
// export function reshuffleDiscard(state: GameState): GameState {
//   const [topCard, ...rest] = state.discardPile;

//   const newDrawPile = shuffle([...state.drawPile, ...rest]);

//   return {
//     ...state,
//     drawPile: newDrawPile,
//     discardPile: [topCard],
//   };
// }
