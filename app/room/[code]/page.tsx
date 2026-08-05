'use client';

import React, { useEffect, useState } from 'react';
import LobbyView from '@/components/game/LobbyView';
import GameTableView from '@/components/game/GameTableView';
import EndScreenView from '@/components/game/EndScreenView';
import ColorPickerBottomSheet from '@/components/game/ColorPickerBottomSheet';
import { GameProvider, useGameStore } from '@/lib/GameContext';
import usePartySocket from '@/lib/usePartySocket';
import { CardColor, ServerEvent } from '@/lib/events';

function RoomContainer({ roomCode }: { roomCode: string }) {
  const {
    gameState,
    roomPlayers,
    roomStatus,
    hostId,
    houseRules,
    winnerId,
    scores,
    currentUserId,
    guestName,
    setGameState,
    setRoomPlayers,
    setRoomStatus,
    setHostId,
    setHouseRules,
    setGameOver,
    setIdentity,
    resetGame,
    myHand,
    opponents,
    currentColor,
  } = useGameStore();

  const [inputGuestName, setInputGuestName] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.sessionStorage.getItem('tumpuk_player_name') || '';
    }
    return '';
  });

  const [hasJoined, setHasJoined] = useState(() => {
    if (typeof window !== 'undefined') {
      return Boolean(window.sessionStorage.getItem('tumpuk_player_name'));
    }
    return false;
  });

  const [selectedCardIdForWild, setSelectedCardIdForWild] = useState<string | null>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // Initialize identity if guest name was stored
  useEffect(() => {
    if (inputGuestName && !currentUserId) {
      const tempId = `usr_${Math.random().toString(36).substring(2, 9)}`;
      setIdentity(tempId, inputGuestName);
    }
  }, [inputGuestName, currentUserId, setIdentity]);

  // Initialize socket connection
  const {
    startGame,
    playCard,
    drawCard,
    callTumpuk,
    challengeTumpuk,
    leaveRoom,
  } = usePartySocket({
    roomCode,
    guestName: guestName || inputGuestName || 'Pemain Guest',
    onMessage: (event: ServerEvent) => {
      switch (event.type) {
        case 'room_update': {
          setRoomPlayers(event.payload.players);
          setHostId(event.payload.hostId);
          setRoomStatus(event.payload.status);
          setHouseRules(event.payload.houseRules);
          break;
        }
        case 'game_state': {
          setGameState(event.payload);
          setRoomStatus('playing');
          break;
        }
        case 'invalid_move': {
          alert(event.payload.reason);
          break;
        }
        case 'turn_timeout': {
          // Toast or notice handled by timer update
          break;
        }
        case 'game_over': {
          setGameOver(event.payload.winnerId, event.payload.scores);
          break;
        }
      }
    },
  });

  const handleJoin = () => {
    const finalName = inputGuestName.trim() || 'Pemain Guest';
    // Generate temporary user ID for session
    const tempId = `usr_${Math.random().toString(36).substring(2, 9)}`;
    setIdentity(tempId, finalName);
    setHasJoined(true);
  };

  const handlePlayCard = (cardId: string) => {
    const card = myHand.find((c) => c.id === cardId);
    if (card && (card.type === 'wild' || card.type === 'wild4')) {
      setSelectedCardIdForWild(cardId);
      setIsColorPickerOpen(true);
    } else {
      playCard(cardId);
    }
  };

  const handleSelectWildColor = (color: CardColor) => {
    if (selectedCardIdForWild) {
      playCard(selectedCardIdForWild, color);
      setSelectedCardIdForWild(null);
    }
    setIsColorPickerOpen(false);
  };

  const activePlayer = gameState
    ? gameState.opponents[gameState.currentPlayerIndex - 1]?.id || gameState.you.id
    : '';

  return (
    <div className="flex flex-col flex-1 w-full max-w-md bg-zinc-950 relative overflow-hidden">
      {!hasJoined ? (
        /* Landing / Join View */
        <div className="flex flex-col flex-1 bg-zinc-950 p-6 justify-center gap-8 w-full max-w-md mx-auto text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-3xl bg-red-500 flex items-center justify-center border-4 border-white shadow-xl rotate-12">
              <span className="text-white text-3xl font-black tracking-wider">T!</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase mt-2">
              Tumpuk!
            </h1>
            <p className="text-zinc-400 text-xs">
              Main kartu real-time super seru bareng teman-temanmu secara online.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">
                NAMA KAMU
              </label>
              <input
                type="text"
                placeholder="Masukkan namamu..."
                value={inputGuestName}
                onChange={(e) => setInputGuestName(e.target.value)}
                className="h-12 w-full bg-zinc-900 border-2 border-zinc-800 rounded-xl px-4 text-white text-sm font-extrabold focus:outline-none focus:border-indigo-600"
              />
            </div>

            <button
              onClick={handleJoin}
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all"
            >
              MASUK ROOM ({roomCode})
            </button>
          </div>
        </div>
      ) : roomStatus === 'waiting' ? (
        /* Lobby View */
        <LobbyView
          roomCode={roomCode}
          players={roomPlayers}
          hostId={hostId || ''}
          currentUserId={currentUserId}
          houseRules={houseRules}
          onToggleRule={() => {}}
          onStartGame={startGame}
          onLeaveRoom={() => {
            leaveRoom();
            setHasJoined(false);
          }}
        />
      ) : roomStatus === 'playing' ? (
        /* Active Game Table View */
        <GameTableView
          opponents={opponents}
          activePlayerId={activePlayer}
          discardTop={gameState?.discardTop || { id: 'default', color: 'red', type: 'number', value: 0 }}
          currentColor={currentColor}
          deckCount={64}
          drawStack={gameState?.drawStack || 0}
          turnDeadline={gameState?.turnDeadline || 0}
          hand={myHand}
          currentUserId={currentUserId}
          onPlayCard={handlePlayCard}
          onDrawCard={drawCard}
          onCallTumpuk={callTumpuk}
          onChallengeTumpuk={challengeTumpuk}
          showTumpukPulse={myHand.length <= 2}
        />
      ) : (
        /* End Screen View */
        <EndScreenView
          winnerId={winnerId || ''}
          scores={scores.map((s) => ({
            playerId: s.playerId,
            name: roomPlayers.find((p) => p.id === s.playerId)?.name || s.playerId,
            score: s.score,
          }))}
          currentUserId={currentUserId}
          onRematch={() => {
            resetGame();
            startGame();
          }}
          onLeave={() => {
            leaveRoom();
            setHasJoined(false);
          }}
        />
      )}

      {/* Wild color picker overlay */}
      <ColorPickerBottomSheet
        isOpen={isColorPickerOpen}
        onSelectColor={handleSelectWildColor}
        onClose={() => setIsColorPickerOpen(false)}
      />
    </div>
  );
}

export default function RoomPage({ params }: { params: { code: string } }) {
  return (
    <GameProvider>
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-start text-white">
        <RoomContainer roomCode={params.code || '123456'} />
      </div>
    </GameProvider>
  );
}
