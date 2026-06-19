import { describe, it, expect } from 'vitest';
import { canPlayAllCards, isNikoKadiEligible, checkWinCondition } from '../nikoKadi';
import { createDeck } from '../deck';
import { PlayabilityContext, GameState, Player, Card } from '@/lib/types/game';

function getCard(rank: string, suit: string = 'hearts') {
  const deck = createDeck();
  return deck.find(c => c.rank === rank && c.suit === suit)!;
}

describe('Niko Kadi Detector', () => {
  const topCard = getCard('5', 'hearts');
  const context: PlayabilityContext = {
    topCard,
    declaredSuit: null,
    pendingPenalty: null,
    phase: 'playerTurn',
  };

  describe('canPlayAllCards', () => {
    it('returns true for a single playable answer card', () => {
      const hand = [getCard('4', 'hearts')];
      expect(canPlayAllCards(hand, context)).toBe(true);
    });

    it('returns false for a single non-answer card', () => {
      const hand = [getCard('J', 'hearts')];
      expect(canPlayAllCards(hand, context)).toBe(false);
    });

    it('returns false for a single answer card that is not playable', () => {
      const hand = [getCard('4', 'spades')];
      expect(canPlayAllCards(hand, context)).toBe(false);
    });

    it('returns true for a valid Q+answer combo', () => {
      const hand = [getCard('Q', 'hearts'), getCard('4', 'hearts')];
      expect(canPlayAllCards(hand, context)).toBe(true);
    });

    it('returns false for an invalid combo (wrong suit)', () => {
      const hand = [getCard('Q', 'hearts'), getCard('4', 'spades')];
      expect(canPlayAllCards(hand, context)).toBe(false);
    });

    it('returns true for multiple answer cards that are all playable', () => {
      const hand = [getCard('4', 'hearts'), getCard('6', 'hearts'), getCard('10', 'hearts')];
      expect(canPlayAllCards(hand, context)).toBe(true);
    });

    it('returns false for multiple answer cards if any is not playable', () => {
      const hand = [getCard('4', 'hearts'), getCard('6', 'spades'), getCard('10', 'hearts')];
      expect(canPlayAllCards(hand, context)).toBe(false);
    });

    it('returns false for mixed types (question without answer combo)', () => {
      const hand = [getCard('Q', 'hearts'), getCard('J', 'hearts')];
      expect(canPlayAllCards(hand, context)).toBe(false);
    });
  });

  describe('isNikoKadiEligible', () => {
    it('returns true for eligible player', () => {
      const player: Player = {
        id: 0,
        name: 'Alice',
        isHuman: true,
        difficulty: null,
        hand: [getCard('4', 'hearts')],
        hasAnnouncedNikoKadi: false,
        avatarSeed: 'alice',
      };
      expect(isNikoKadiEligible(player, context)).toBe(true);
    });

    it('returns false if already announced', () => {
      const player: Player = {
        id: 0,
        name: 'Alice',
        isHuman: true,
        difficulty: null,
        hand: [getCard('4', 'hearts')],
        hasAnnouncedNikoKadi: true,
        avatarSeed: 'alice',
      };
      expect(isNikoKadiEligible(player, context)).toBe(false);
    });

    it('returns false if hand empty', () => {
      const player: Player = {
        id: 0,
        name: 'Alice',
        isHuman: true,
        difficulty: null,
        hand: [],
        hasAnnouncedNikoKadi: false,
        avatarSeed: 'alice',
      };
      expect(isNikoKadiEligible(player, context)).toBe(false);
    });
  });

  describe('checkWinCondition', () => {
    const baseState: GameState = {
      phase: 'resolvingPlay',
      config: { playerCount: 2, cardDealCount: 3, players: [] },
      players: [
        { id: 0, name: 'Alice', isHuman: true, difficulty: null, hand: [], hasAnnouncedNikoKadi: true, avatarSeed: 'a' },
        { id: 1, name: 'Bob', isHuman: false, difficulty: 'easy', hand: [getCard('5', 'hearts')], hasAnnouncedNikoKadi: false, avatarSeed: 'b' },
      ],
      drawPile: [],
      discardPile: [],
      currentPlayerIndex: 0,
      direction: 'clockwise',
      pendingPenalty: null,
      declaredSuit: null,
      winnerId: null,
      lastAction: null,
      turnNumber: 1,
    };

    it('returns true for a winning player', () => {
      expect(checkWinCondition(baseState, 0)).toBe(true);
    });

    it('returns false if hand not empty', () => {
      const state = { ...baseState, players: baseState.players.map(p => p.id === 0 ? { ...p, hand: [getCard('4', 'hearts')] } : p) };
      expect(checkWinCondition(state, 0)).toBe(false);
    });

    it('returns false if not announced', () => {
      const state = { ...baseState, players: baseState.players.map(p => p.id === 0 ? { ...p, hasAnnouncedNikoKadi: false } : p) };
      expect(checkWinCondition(state, 0)).toBe(false);
    });

    it('returns false if another player is also cardless', () => {
      const state = { ...baseState, players: baseState.players.map(p => p.id === 1 ? { ...p, hand: [] } : p) };
      expect(checkWinCondition(state, 0)).toBe(false);
    });
  });
});
