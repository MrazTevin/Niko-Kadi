'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { PlayerConfig, AIDifficulty } from '@/lib/types/game';
import { X } from 'lucide-react';

interface PlayerSlotProps {
  index: number;
  config: PlayerConfig;
  onUpdate: (config: PlayerConfig) => void;
  onRemove: () => void;
  canRemove: boolean;
}

const AVATAR_COLORS = [
  'bg-[#fef3c7]', // Yellow
  'bg-[#bfdbfe]', // Blue
  'bg-[#fed7aa]', // Orange
  'bg-[#ddd6fe]', // Purple
  'bg-[#fecaca]', // Red
];

const AVATAR_LETTERS = ['Y', 'A', 'K', 'P', 'M'];

export function PlayerSlot({
  index,
  config,
  onUpdate,
  onRemove,
  canRemove,
}: PlayerSlotProps) {
  const [isEditing, setIsEditing] = useState(false);

  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const avatarLetter = config.name.charAt(0).toUpperCase() || AVATAR_LETTERS[index];

  const handleTogglePlayerType = () => {
    onUpdate({
      ...config,
      isHuman: !config.isHuman,
      difficulty: !config.isHuman ? null : 'easy',
    });
  };

  return (
    <div className="flex items-center gap-3 py-2">
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center flex-shrink-0`}
      >
        <span className="text-sm font-semibold text-gray-900">
          {avatarLetter}
        </span>
      </div>

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Input
              value={config.name}
              onChange={(e) => onUpdate({ ...config, name: e.target.value })}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditing(false);
              }}
              autoFocus
              maxLength={16}
              className="h-7 text-sm max-w-[200px] border-gray-300"
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-base font-medium text-gray-900 hover:text-gray-600 transition-colors"
            >
              {config.name}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <button
            onClick={handleTogglePlayerType}
            className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
          >
            {config.isHuman ? 'Human' : 'Computer'}
          </button>
          {!config.isHuman && (
            <>
              <span className="text-gray-300">•</span>
              <select
                value={config.difficulty || 'easy'}
                onChange={(e) =>
                  onUpdate({
                    ...config,
                    difficulty: e.target.value as AIDifficulty,
                  })
                }
                className="text-xs text-gray-600 border-none bg-transparent p-0 cursor-pointer hover:text-gray-900 focus:outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Remove Button */}
      {canRemove && (
        <button
          onClick={onRemove}
          className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
``