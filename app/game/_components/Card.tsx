'use client';

import { Card as CardType } from '@/lib/types/game';
import { cn } from '@/lib/utils';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  className?: string;
  isSelected?: boolean;
  isPlayable?: boolean;
}

// Geometric pattern components based on rank
const getGeometricPattern = (rank: CardType['rank'], suit: CardType['suit']) => {
  // Base colors for suits
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const primary = isRed ? '#c53030' : '#1e3a5f';
  const secondary = isRed ? '#e57373' : '#4a90e2';
  const accent = isRed ? '#ffb3b3' : '#87CEEB';

  // SVG patterns for each rank
  switch (rank) {
    case 'A':
      return (
        <svg viewBox="0 0 100 140" className="w-full h-full">
          <rect x="30" y="40" width="40" height="60" fill={primary} />
          <circle cx="50" cy="70" r="25" fill={secondary} />
          <polygon points="50,50 65,80 35,80" fill={accent} />
        </svg>
      );
    
    case '2':
      return (
        <svg viewBox="0 0 100 140" className="w-full h-full">
          <circle cx="35" cy="50" r="15" fill={primary} />
          <circle cx="65" cy="90" r="15" fill={secondary} />
          <rect x="25" y="55" width="50" height="30" fill={accent} opacity="0.7" />
        </svg>
      );
    
    case '3':
      return (
        <svg viewBox="0 0 100 140" className="w-full h-full">
          <circle cx="50" cy="45" r="12" fill={primary} />
          <circle cx="35" cy="70" r="12" fill={secondary} />
          <circle cx="65" cy="70" r="12" fill={accent} />
          <polygon points="50,80 40,95 60,95" fill={primary} opacity="0.6" />
        </svg>
      );
    
    case '4':
      return (
        <svg viewBox="0 0 100 140" className="w-full h-full">
          <rect x="25" y="40" width="20" height="20" fill={primary} />
          <rect x="55" y="40" width="20" height="20" fill={primary} />
          <rect x="25" y="80" width="20" height="20" fill={secondary} />
          <rect x="55" y="80" width="20" height="20" fill={secondary} />
        </svg>
      );
    
    case '5':
      return (
        <svg viewBox="0 0 100 140" className="w-full h-full">
          <circle cx="50" cy="50" r="15" fill={primary} />
          <circle cx="30" cy="75" r="10" fill={secondary} />
          <circle cx="70" cy="75" r="10" fill={secondary} />
          <circle cx="40" cy="95" r="8" fill={accent} />
          <circle cx="60" cy="95" r="8" fill={accent} />
        </svg>
      );
    
    case '6':
      return (
        <svg viewBox="0 0 100 140" className="w-full h-full">
          <circle cx="35" cy="45" r="10" fill={primary} />
          <circle cx="65" cy="45" r="10" fill={primary} />
          <circle cx="35" cy="70" r="10" fill={secondary} />
          <circle cx="65" cy="70" r="10" fill={secondary} />
          <circle cx="35" cy="95" r="10" fill={accent} />
          <circle cx="65" cy="95" r="10" fill={accent} />
        </svg>
      );
    
    case '7':
      return (
        <svg viewBox="0 0 100 140" className="w-full h-full">
          <polygon points="50,35 30,55 70,55" fill={primary} />
          <rect x="40" y="60" width="20" height="30" fill={secondary} />
          <circle cx="35" cy="100" r="8" fill={accent} />
          <circle cx="65" cy="100" r="8" fill={accent} />
        </svg>
      );
    
    case '8':
      return (
        <svg viewBox="0 0 100 140" className="w-full h-full">
          <circle cx="50" cy="40" r="12" fill={primary} />
          <circle cx="35" cy="65" r="10" fill={secondary} />
          <circle cx="65" cy="65" r="10" fill={secondary} />
          <circle cx="50" cy="85" r="12" fill={accent} />
          <rect x="42" y="55" width="16" height="20" fill={primary} opacity="0.4" />
        </svg>
      );
    
    case '9':
      return (
        <svg viewBox="0 0 100 140" className="w-full h-full">
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => (
              <circle
                key={`${row}-${col}`}
                cx={30 + col * 20}
                cy={45 + row * 20}
                r="6"
                fill={row === 0 ? primary : row === 1 ? secondary : accent}
              />
            ))
          )}
        </svg>
      );
    
    case '10':
      return (
        <svg viewBox="0 0 100 140" className="w-full h-full">
          <rect x="25" y="35" width="15" height="70" fill={primary} />
          <circle cx="60" cy="70" r="20" fill={secondary} />
          <circle cx="60" cy="70" r="12" fill={accent} />
        </svg>
      );
    
    case 'J':
      return (
        <svg viewBox="0 0 100 140" className="w-full h-full">
          <polygon points="30,40 50,30 70,40 70,90 30,90" fill={primary} />
          <rect x="40" y="60" width="20" height="35" fill={secondary} />
          <circle cx="50" cy="50" r="8" fill={accent} />
        </svg>
      );
    
    case 'Q':
      return (
        <svg viewBox="0 0 100 140" className="w-full h-full">
          <circle cx="50" cy="65" r="25" fill={primary} />
          <polygon points="50,40 65,55 50,70 35,55" fill={secondary} />
          <rect x="55" y="80" width="20" height="8" fill={accent} transform="rotate(45 65 84)" />
        </svg>
      );
    
    case 'K':
      return (
        <svg viewBox="0 0 100 140" className="w-full h-full">
          <rect x="30" y="35" width="15" height="70" fill={primary} />
          <polygon points="45,55 70,35 70,50 50,65" fill={secondary} />
          <polygon points="45,75 70,90 70,105 50,90" fill={secondary} />
          <rect x="35" y="50" width="30" height="8" fill={accent} />
        </svg>
      );
    
    case 'JOKER':
      return (
        <svg viewBox="0 0 100 140" className="w-full h-full">
          <defs>
            <linearGradient id="joker-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff6b6b" />
              <stop offset="33%" stopColor="#4ecdc4" />
              <stop offset="66%" stopColor="#ffe66d" />
              <stop offset="100%" stopColor="#a8e6cf" />
            </linearGradient>
          </defs>
          <circle cx="30" cy="50" r="18" fill="url(#joker-grad)" />
          <circle cx="70" cy="50" r="18" fill="url(#joker-grad)" />
          <circle cx="50" cy="85" r="18" fill="url(#joker-grad)" />
          <polygon points="50,40 35,65 65,65" fill="#1e3a5f" opacity="0.3" />
        </svg>
      );
    
    default:
      return (
        <svg viewBox="0 0 100 140" className="w-full h-full">
          <rect x="30" y="50" width="40" height="40" fill={primary} />
        </svg>
      );
  }
};

// Suit symbols
const getSuitSymbol = (suit: CardType['suit']) => {
  switch (suit) {
    case 'hearts':
      return '♥';
    case 'diamonds':
      return '♦';
    case 'clubs':
      return '♣';
    case 'spades':
      return '♠';
    default:
      return '';
  }
};

export function Card({ card, onClick, className, isSelected, isPlayable }: CardProps) {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitColor = isRed ? 'text-[#c53030]' : 'text-[#1e3a5f]';
  const displayRank = card.rank === 'JOKER' ? 'JKR' : card.rank;

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={cn(
        'relative w-28 h-40 bg-[#faf9f7] rounded-xl shadow-md transition-all duration-200',
        'border-2 border-gray-200',
        isPlayable && 'cursor-pointer hover:shadow-xl hover:-translate-y-2',
        isSelected && 'ring-4 ring-yellow-400 -translate-y-2',
        !isPlayable && 'opacity-50',
        className
      )}
    >
      {/* Top left corner */}
      <div className={cn('absolute top-2 left-2 text-sm font-bold', suitColor)}>
        <div className="leading-none">{displayRank}</div>
        <div className="text-xl leading-none">{getSuitSymbol(card.suit)}</div>
      </div>

      {/* Geometric pattern center */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {getGeometricPattern(card.rank, card.suit)}
      </div>

      {/* Bottom right corner (rotated) */}
      <div className={cn('absolute bottom-2 right-2 text-sm font-bold rotate-180', suitColor)}>
        <div className="leading-none">{displayRank}</div>
        <div className="text-xl leading-none">{getSuitSymbol(card.suit)}</div>
      </div>
    </div>
  );
}
