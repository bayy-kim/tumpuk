'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import LobbyView from '@/components/game/LobbyView';
import GameTableView from '@/components/game/GameTableView';
import EndScreenView from '@/components/game/EndScreenView';
import ColorPickerBottomSheet from '@/components/game/ColorPickerBottomSheet';
import { useGameStore } from '@/lib/GameContext';
import usePartySocket from '@/lib/usePartySocket';
import { CardColor, HouseRules, ServerEvent } from '@/lib/events';

interface RoomContainerProps {
  roomCode: string;
  userId: string;
  userName: string;
}

export default function RoomContainer({ roomCode, userId, userName }: RoomContainerProps) {
  const router = useRouter();
  const {
    gameState,
    roomPlayers,
    roomStatus,
    hostId,
    houseRules,
    winnerId,
    scores,
    currentUserId,
    loserId,
    loserName,
    pollDeadline,
    winningChallenge,
    proofUrl,
    setGameState,
    setRoomPlayers,
    setRoomStatus,
    setHostId,
    setHouseRules,
    setGameOver,
    setIdentity,
    setChallengePollStart,
    setChallengeResult,
    setChallengeProof,
    resetGame,
    myHand,
    opponents,
    currentColor,
  } = useGameStore();

  const [selectedCardIdForWild, setSelectedCardIdForWild] = React.useState<string | null>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = React.useState(false);
  const [isSpectator] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.sessionStorage.getItem('tumpuk_is_spectator') === 'true';
    }
    return false;
  });

  // Bind server authenticated user identity directly to game store
  React.useEffect(() => {
    setIdentity(userId, userName);
  }, [userId, userName, setIdentity]);

  // Initialize socket connection
  const {
    startGame,
    playCard,
    drawCard,
    callTumpuk,
    challengeTumpuk,
    leaveRoom,
    updateHouseRules,
    submitChallengeVote,
    notifyProofUploaded,
  } = usePartySocket({
    roomCode,
    userId,
    guestName: userName,
    isSpectator,
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
        case 'game_over': {
          setGameOver(event.payload.winnerId, event.payload.scores);
          break;
        }
        case 'challenge_poll_start': {
          setChallengePollStart(
            event.payload.loserId,
            event.payload.loserName,
            event.payload.pollDeadline
          );
          break;
        }
        case 'challenge_result': {
          setChallengeResult(
            event.payload.loserId,
            event.payload.loserName,
            event.payload.winningChallenge
          );
          break;
        }
        case 'challenge_uploaded': {
          setChallengeProof(event.payload.fileUrl);
          break;
        }
      }
    },
  });

  const handleToggleRule = (key: keyof HouseRules) => {
    const updatedRules = { ...houseRules, [key]: !houseRules[key] };
    setHouseRules(updatedRules);
    updateHouseRules(updatedRules);
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

  const handleUploadProof = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', roomCode);
      formData.append('userId', currentUserId);

      const res = await fetch('/api/challenge/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        notifyProofUploaded(data.url);
      } else {
        alert(data.error || 'Gagal mengunggah file.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah bukti.';
      alert(msg);
    }
  };

  const activePlayer = gameState
    ? gameState.opponents[gameState.currentPlayerIndex - 1]?.id || gameState.you.id
    : '';

  return (
    <div className="flex flex-col flex-1 w-full max-w-md bg-zinc-950 relative overflow-hidden">
      {roomStatus === 'waiting' ? (
        /* Lobby View */
        <LobbyView
          roomCode={roomCode}
          players={roomPlayers}
          hostId={hostId || ''}
          currentUserId={currentUserId}
          houseRules={houseRules}
          onToggleRule={handleToggleRule}
          onStartGame={startGame}
          onLeaveRoom={() => {
            leaveRoom();
            router.push('/');
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
          isSpectator={isSpectator}
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
          loserId={loserId}
          loserName={loserName}
          pollDeadline={pollDeadline}
          winningChallenge={winningChallenge}
          proofUrl={proofUrl}
          onVoteChallenge={submitChallengeVote}
          onUploadProof={handleUploadProof}
          onRematch={() => {
            resetGame();
            startGame();
          }}
          onLeave={() => {
            leaveRoom();
            router.push('/');
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
