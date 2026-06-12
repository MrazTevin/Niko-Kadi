import { describe, it, expect } from 'vitest';
import { createDeck, shuffle, getCardType, getPenaltyValue, dealCards } from '../deck';
import type { GameConfig, PlayerConfig } from '@/lib/types/game';

describe('Deck engine', () => {
  it('creates a 54‑card deck', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(54);
    const ids = new Set(deck.map(c => c.id));
    expect(ids.size).toBe(54);
  });

  it('assigns correct types and penalty values', () => {
    const deck = createDeck();
    const twoClubs = deck.find(c => c.id === 'clubs-2')!;
    expect(twoClubs.type).toBe('penalty');
    expect(twoClubs.penaltyValue).toBe(2);

    const joker = deck.find(c => c.rank === 'JOKER')!;
    expect(joker.type).toBe('penalty');
    expect(joker.penaltyValue).toBe(5);

    const queenHearts = deck.find(c => c.id === 'hearts-Q')!;
    expect(queenHearts.type).toBe('question');
    expect(queenHearts.penaltyValue).toBe(0);
  });

  it('shuffles without losing cards', () => {
    const deck = createDeck();
    const shuffled = shuffle(deck);
    expect(shuffled).toHaveLength(54);
    expect(shuffled).not.toEqual(deck);
    const originalIds = deck.map(c => c.id).sort();
    const shuffledIds = shuffled.map(c => c.id).sort();
    expect(shuffledIds).toEqual(originalIds);
  });

  it('deals cards correctly for 3 players, 4 cards each', () => {
    const playerConfigs: PlayerConfig[] = [
      { name: 'Alice', isHuman: true, difficulty: null },
      { name: 'Bob', isHuman: false, difficulty: 'easy' },
      { name: 'Charlie', isHuman: false, difficulty: 'medium' },
    ];
    const config: GameConfig = {
      playerCount: 3,
      cardDealCount: 4,
      players: playerConfigs,
    };
    const { players, drawPile, discardPile } = dealCards(config);
    
    expect(players).toHaveLength(3);
    players.forEach(p => expect(p.hand).toHaveLength(4));
    expect(drawPile.length).toBe(54 - 3*4 - 1); // 54 - 12 - 1 = 41
    expect(discardPile).toHaveLength(1);
    const starter = discardPile[0];
    const invalidStarters = ['2','3','Q','K','J','A','JOKER'];
    expect(invalidStarters).not.toContain(starter.rank);
  });
});
