import { Metadata } from 'next';
import { LobbyClient } from './_components/LobbyClient';

export const metadata: Metadata = {
  title: 'Kadi – Lobby',
  description: 'Set up your game of Kadi.',
};

export default function LobbyPage() {
  return <LobbyClient />;
}