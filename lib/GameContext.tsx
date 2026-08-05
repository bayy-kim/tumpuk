'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PublicGameState, Card, PlayerPublicState, CardColor, HouseRules } from './events';

interface GameContextType {
  // States
  gameState: PublicGameState | null;
  roomPlayers: { id: string; name: string; connected: boolean; isHost: boolean }[];
  roomStatus: 'waiting' | 'playing' | 'finished';
  hostId: string | null;
  houseRules: HouseRules;
  winnerId: string | null;
  scores: { playerId: string; score: number }[];
  currentUserId: string;
  guestName: string;

  // Actions
  setGameState: (state: PublicGameState | null) => void;
  setRoomPlayers: (players: { id: string; name: string; connected: boolean; isHost: boolean }[]) => void;
  setRoomStatus: (status: 'waiting' | 'playing' | 'finished') => void;
  setHostId: (hostId: string | null) => void;
  setHouseRules: (rules: HouseRules) => void;
  setGameOver: (winnerId: string, scores: { playerId: string; score: number }[]) => void;
  setIdentity: (userId: string, name: string) => void;
  resetGame: () => void;

  // Selectors
  myHand: Card[];
  opponents: PlayerPublicState[];
  currentColor: CardColor;
  isMyTurn: boolean;
  turnSecondsLeft: number;
}

const defaultHouseRules: HouseRules = {
  stacking: false,
  jumpIn: false,
  sevenZero: false,
  drawToMatch: false,
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<PublicGameState | null>(null);
  const [roomPlayers, setRoomPlayers] = useState<{ id: string; name: string; connected: boolean; isHost: boolean }[]>([]);
  const [roomStatus, setRoomStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [hostId, setHostId] = useState<string | null>(null);
  const [houseRules, setHouseRules] = useState<HouseRules>(defaultHouseRules);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [scores, setScores] = useState<{ playerId: string; score: number }[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [turnSecondsLeft, setTurnSecondsLeft] = useState<number>(0);

  // Auto-calculate seconds remaining from turnDeadline
  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!gameState || !gameState.turnDeadline || roomStatus !== 'playing') {
        return 0;
      }
      const msLeft = gameState.turnDeadline - Date.now();
      return Math.max(0, Math.ceil(msLeft / 1000));
    };

    const interval = setInterval(() => {
      setTurnSecondsLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, roomStatus]);

  const setGameOver = (wId: string, matchScores: { playerId: string; score: number }[]) => {
    setWinnerId(wId);
    setScores(matchScores);
    setRoomStatus('finished');
  };

  const setIdentity = (userId: string, name: string) => {
    setCurrentUserId(userId);
    setGuestName(name);
  };

  const resetGame = () => {
    setGameState(null);
    setWinnerId(null);
    setScores([]);
    setRoomStatus('waiting');
  };

  // Selectors
  const myHand = gameState?.you.hand || [];
  const opponents = gameState?.opponents || [];
  const currentColor = gameState?.currentColor || 'wild';

  // Let's refine isMyTurn selection to correctly match player ID
  const resolvedIsMyTurn = gameState
    ? gameState.opponents.findIndex(op => op.id === currentUserId) === gameState.currentPlayerIndex - 1 || 
      (gameState.currentPlayerIndex === 0 && gameState.you.id === currentUserId)
    : false;

  return (
    <GameContext.Provider
      value={{
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
        isMyTurn: resolvedIsMyTurn,
        turnSecondsLeft,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGameStore() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameStore must be used within a GameProvider');
  }
  return context;
}
