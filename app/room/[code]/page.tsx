import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { GameProvider } from '@/lib/GameContext';
import RoomContainer from '@/components/game/RoomContainer';

export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const session = await auth();

  // Enforce mandatory Google login redirection
  if (!session?.user) {
    redirect('/');
  }

  const resolvedParams = await params;
  const roomCode = resolvedParams?.code || '123456';
  const userId = session.user.id || 'usr_unknown';
  const userName = session.user.name || 'Pemain';

  return (
    <GameProvider>
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-start text-white">
        <RoomContainer
          roomCode={roomCode}
          userId={userId}
          userName={userName}
        />
      </div>
    </GameProvider>
  );
}
