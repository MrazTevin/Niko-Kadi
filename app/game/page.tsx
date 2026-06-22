import { Metadata } from 'next';
import { GameClient } from './_components/GameClient';

export const metadata: Metadata = {
  title: 'Kadi – Game',
  description: 'Play Kadi card game.',
};

export default function GamePage() {
  return <GameClient />;
}
