'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { useRouter } from 'next/navigation';
import { Card } from './Card';
import { Button } from '@/components/ui/button';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { Card as CardType } from '@/lib/types/game';

export function GameClient() {
  const router = useRouter();
  const store = useGameStore();
  const { 
    phase, 
    players, 
    discardPile, 
    drawPile, 
    currentPlayerIndex, 
    direction,
    selectedCards,
    selectCard,
    deselectCard,
    clearSelection,
    dispatch,
  } = store;

  useEffect(() => {
    if (!players || phase === 'idle') {
      router.push('/lobby');
    }
  }, [players, phase, router]);

  // Handle animation completion: when resolvingPlay phase is active, signal animation done after a brief delay
  useEffect(() => {
    if (phase === 'resolvingPlay') {
      // Wait for card animation to complete (adjust timing as needed for your animations)
      const timer = setTimeout(() => {
        dispatch({
          type: 'ANIMATION_DONE',
        });
      }, 600); // 600ms for card animation

      return () => clearTimeout(timer);
    }
  }, [phase, dispatch]);

  const currentPlayer = players?.[currentPlayerIndex];
  const isHumanTurn = currentPlayer?.isHuman && phase === 'playerTurn';
  const topCard = discardPile[0];
  const drawPileCount = drawPile.length;

  // During resolvingPlay or other phases without a valid current player, don't render game controls
  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0f4f1] to-[#e8f2ed] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-gray-100 px-6 py-3 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-700">
              Processing game state...
            </span>
          </div>
        </div>
      </div>
    );
  }

  const handleCardClick = (card: CardType) => {
    if (!isHumanTurn) return;

    if (selectedCards.some((c) => c.id === card.id)) {
      deselectCard(card);
    } else {
      selectCard(card);
    }
  };

  const handlePlay = () => {
    if (selectedCards.length === 0) return;
    
    dispatch({
      type: 'PLAY_CARDS',
      cards: selectedCards,
      playerId: currentPlayer.id,
    });
    clearSelection();
  };

  const handleDraw = () => {
    dispatch({
      type: 'DRAW_CARD',
      playerId: currentPlayer.id,
    });
  };

  const handleNikoKadi = () => {
    dispatch({
      type: 'ANNOUNCE_NIKO_KADI',
      playerId: currentPlayer.id,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4f1] to-[#e8f2ed]">
      {/* Top players area */}
      <div className="flex justify-center items-start gap-8 p-6">
        {players.map((player, idx) => {
          if (idx === currentPlayerIndex && player.isHuman) return null;
          
          const isActive = idx === currentPlayerIndex;
          const avatarColor = ['bg-[#bfdbfe]', 'bg-[#fed7aa]', 'bg-[#ddd6fe]', 'bg-[#fecaca]'][idx % 4];
          
          return (
            <div key={player.id} className="flex flex-col items-center gap-2">
              <div
                className={`w-16 h-16 rounded-full ${avatarColor} flex items-center justify-center border-4 transition-all ${
                  isActive ? 'border-yellow-400 shadow-lg' : 'border-white'
                }`}
              >
                <span className="text-xl font-bold text-gray-900">
                  {player.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-700">{player.name}</div>
                <div className="text-xs text-gray-500">{player.hand.length} cards</div>
                {player.hasAnnouncedNikoKadi && (
                  <div className="text-xs font-bold text-yellow-600 mt-1">★ Niko Kadi!</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Direction indicator */}
      <div className="flex justify-end px-8">
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm text-sm text-gray-600">
          <RotateCcw className="w-4 h-4" />
          <span>{direction === 'clockwise' ? 'Clockwise' : 'Counter-clockwise'}</span>
        </div>
      </div>

      {/* Center play area */}
      <div className="flex justify-center items-center gap-8 py-12">
        {/* Draw pile */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-28 h-40 bg-[#1e3a5f] rounded-xl shadow-lg flex items-center justify-center border-2 border-gray-300">
              <span className="text-4xl font-bold text-white">{drawPileCount}</span>
            </div>
          </div>
          <span className="text-sm font-medium text-gray-600">Draw pile</span>
        </div>

        {/* Discard pile */}
        <div className="flex flex-col items-center gap-3">
          {topCard && <Card card={topCard} />}
          <span className="text-sm font-medium text-gray-600">Discard pile</span>
        </div>
      </div>

      {/* Player hand area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-6 shadow-2xl">
        <div className="max-w-6xl mx-auto">
          {/* Human player info */}
          {currentPlayer.isHuman && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Your hand — tap to select
              </h3>
              {phase === 'playerTurn' && (
                <p className="text-xs text-gray-500">
                  {currentPlayer.hand.length === 2 && !currentPlayer.hasAnnouncedNikoKadi
                    ? '⚠️ You must announce "Niko Kadi" before playing your second-to-last card!'
                    : 'Select cards to play or draw from the pile'}
                </p>
              )}
            </div>
          )}

          {/* Cards */}
          <div className="flex justify-center gap-3 mb-4 flex-wrap">
            {currentPlayer.isHuman &&
              currentPlayer.hand.map((card) => (
                <Card
                  key={card.id}
                  card={card}
                  onClick={() => handleCardClick(card)}
                  isSelected={selectedCards.some((c) => c.id === card.id)}
                  isPlayable={isHumanTurn}
                />
              ))}
          </div>

          {/* Action buttons */}
          {currentPlayer.isHuman && isHumanTurn && (
            <div className="flex justify-center gap-3">
              <Button
                onClick={handleDraw}
                variant="outline"
                className="h-11 px-6 border-2 border-gray-300"
              >
                Draw card
              </Button>

              {currentPlayer.hand.length === 2 && !currentPlayer.hasAnnouncedNikoKadi && (
                <Button
                  onClick={handleNikoKadi}
                  className="h-11 px-6 bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                >
                  Niko Kadi!
                </Button>
              )}

              <Button
                onClick={handlePlay}
                disabled={selectedCards.length === 0}
                className="h-11 px-6 bg-[#1e4d3c] hover:bg-[#163a2d] text-white"
              >
                Play {selectedCards.length > 0 && `(${selectedCards.length})`}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* AI turn indicator */}
          {!currentPlayer.isHuman && phase === 'aiTurn' && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-gray-100 px-6 py-3 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-700">
                  {currentPlayer.name} is thinking...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
