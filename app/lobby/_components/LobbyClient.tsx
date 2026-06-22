'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/lib/store/gameStore';
import { PlayerConfig } from '@/lib/types/game';
import { PlayerSlot } from './PlayerSlot';
import { ArrowRight } from 'lucide-react';

export function LobbyClient() {
  const router = useRouter();
  const { configureGame, startGame } = useGameStore();

  const [players, setPlayers] = useState<PlayerConfig[]>([
    { name: 'You', isHuman: true, difficulty: null },
    { name: 'Amara', isHuman: false, difficulty: 'easy' },
    { name: 'Kloni', isHuman: false, difficulty: 'easy' },
  ]);
  const [cardCount, setCardCount] = useState<3 | 4>(4);

  const updatePlayer = (index: number, config: PlayerConfig) => {
    const updated = [...players];
    updated[index] = config;
    setPlayers(updated);
  };

  const addPlayer = () => {
    if (players.length >= 5) return;
    const newPlayer: PlayerConfig = {
      name: `Player ${players.length + 1}`,
      isHuman: false,
      difficulty: 'easy',
    };
    setPlayers([...players, newPlayer]);
  };

  const removePlayer = (index: number) => {
    if (players.length <= 2) return;
    setPlayers(players.filter((_, i) => i !== index));
  };

  const handleDeal = () => {
    const invalid = players.some(
      (p) => p.isHuman && (!p.name || p.name.trim() === '')
    );
    if (invalid) {
      alert('Please give a name to all human players.');
      return;
    }

    if (players.length < 2) {
      alert('You need at least 2 players.');
      return;
    }

    let finalCardCount = cardCount;
    if (players.length >= 4 && cardCount === 4) {
      finalCardCount = 3;
    }

    const config = {
      playerCount: players.length,
      cardDealCount: finalCardCount,
      players,
    };

    configureGame(config);
    startGame();
    router.push('/game');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-8">
            <button className="px-6 py-2 bg-[#1e4d3c] text-white rounded-md text-sm font-medium">
              Lobby
            </button>
            <Link href="/game">
              <button className="px-6 py-2 text-gray-600 text-sm font-medium hover:text-gray-900 transition-colors">
                Gameplay
              </button>
            </Link>
            <Link href="/win">
              <button className="px-6 py-2 text-gray-600 text-sm font-medium hover:text-gray-900 transition-colors">
                Win screen
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-2">
            Ka<span className="text-[#d4a574]">di</span>
          </h1>
          <p className="text-gray-600">The Kenyan card game</p>
        </div>

        {/* Players Section */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Players</h2>
          <div className="space-y-3">
            {players.map((p, idx) => (
              <PlayerSlot
                key={idx}
                index={idx}
                config={p}
                onUpdate={(cfg) => updatePlayer(idx, cfg)}
                onRemove={() => removePlayer(idx)}
                canRemove={players.length > 2}
              />
            ))}
          </div>

          {players.length < 5 && (
            <button
              onClick={addPlayer}
              className="mt-4 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              + Add player (up to 5)
            </button>
          )}
        </div>

        {/* Cards per player */}
        <div className="mb-12">
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Cards per player
          </h2>
          <div className="flex items-center gap-8">
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="relative">
                <input
                  type="radio"
                  name="cardCount"
                  value="3"
                  checked={cardCount === 3}
                  onChange={() => setCardCount(3)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    cardCount === 3
                      ? 'border-gray-900'
                      : 'border-gray-300'
                  }`}
                >
                  {cardCount === 3 && (
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-700">
                3 cards (fast mode)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <div className="relative">
                <input
                  type="radio"
                  name="cardCount"
                  value="4"
                  checked={cardCount === 4}
                  onChange={() => setCardCount(4)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    cardCount === 4
                      ? 'border-gray-900'
                      : 'border-gray-300'
                  }`}
                >
                  {cardCount === 4 && (
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-700">4 cards</span>
            </label>
          </div>
        </div>

        {/* Deal Cards Button */}
        <Button
          onClick={handleDeal}
          className="w-full bg-[#1e4d3c] hover:bg-[#163a2d] text-white h-12 text-base font-medium"
        >
          Deal cards <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </main>
    </div>
  );
}
