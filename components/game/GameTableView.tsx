'use client';

import React, { useState } from 'react';
import Card from './Card';
import OpponentsStrip from './OpponentsStrip';
import PlayerHand from './PlayerHand';
import { Card as CardType, PlayerPublicState } from '@/lib/events';

interface GameTableViewProps {
  opponents: PlayerPublicState[];
  activePlayerId: string;
  discardTop: CardType;
  currentColor: 'red' | 'yellow' | 'green' | 'blue' | 'wild';
  deckCount: number;
  drawStack: number;
  turnDeadline: number;
  hand: CardType[];
  currentUserId: string;
  onPlayCard: (cardId: string) => void;
  onDrawCard: () => void;
  onCallTumpuk: () => void;
  onChallengeTumpuk: (targetPlayerId: string) => void;
  showTumpukPulse: boolean;
}

export default function GameTableView({
  opponents,
  activePlayerId,
  discardTop,
  currentColor,
  deckCount = 64,
  drawStack,
  turnDeadline,
  hand,
  currentUserId,
  onPlayCard,
  onDrawCard,
  onCallTumpuk,
  onChallengeTumpuk,
  showTumpukPulse,
}: GameTableViewProps) {
  const isMyTurn = currentUserId === activePlayerId;
  const [timeRemaining, setTimeRemaining] = useState(() => 
    Math.max(0, Math.ceil((turnDeadline - Date.now()) / 1000))
  );
  const [isDragOverDiscard, setIsDragOverDiscard] = useState(false);

  React.useEffect(() => {
    const calc = () => Math.max(0, Math.ceil((turnDeadline - Date.now()) / 1000));
    const interval = setInterval(() => {
      setTimeRemaining(calc());
    }, 1000);
    return () => clearInterval(interval);
  }, [turnDeadline]);

  const colorTextMap = {
    red: 'text-red-500',
    yellow: 'text-yellow-400',
    green: 'text-green-500',
    blue: 'text-blue-500',
    wild: 'text-zinc-400',
  };

  // Drag and Drop handlers for discard zone
  const handleDragOver = (e: React.DragEvent) => {
    if (!isMyTurn) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOverDiscard(true);
  };

  const handleDragLeave = () => {
    setIsDragOverDiscard(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isMyTurn) return;
    e.preventDefault();
    setIsDragOverDiscard(false);
    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId) {
      onPlayCard(cardId);
    }
  };

  // Helper positions for circular opponent layout on desktop (lg:)
  const getOpponentPositionStyle = (index: number, total: number) => {
    if (total === 1) return { top: '5%', left: '50%', transform: 'translate(-50%, 0)' };
    const angle = (index / total) * Math.PI - Math.PI; // Arrange along top arch
    const radiusX = 35; // percentage
    const radiusY = 30; // percentage
    const left = 50 + radiusX * Math.cos(angle + Math.PI / 2);
    const top = 35 + radiusY * Math.sin(angle + Math.PI / 2);
    return {
      left: `${left}%`,
      top: `${top}%`,
      transform: 'translate(-50%, -50%)',
    };
  };

  return (
    <div className="flex flex-col flex-1 bg-zinc-950 w-full max-w-md lg:max-w-5xl mx-auto relative overflow-hidden select-none">
      {/* 1. Mobile Top Opponents strip (hidden on lg) */}
      <div className="block lg:hidden">
        <OpponentsStrip opponents={opponents} activePlayerId={activePlayerId} />
      </div>

      {/* 2. Middle Game Table Grid (Circular on lg) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 gap-6 relative">
        {/* Desktop Circular Opponents Layout */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none">
          {opponents.map((opponent, index) => {
            const isActive = opponent.id === activePlayerId;
            const isOffline = !opponent.connected;

            return (
              <div
                key={opponent.id}
                style={getOpponentPositionStyle(index, opponents.length)}
                className={`absolute pointer-events-auto flex items-center gap-2 p-2.5 rounded-xl border-2 shadow-xl bg-zinc-900 transition-all ${
                  isActive ? 'border-yellow-400 scale-110 shadow-yellow-500/20' : 'border-zinc-800'
                } ${isOffline ? 'opacity-50' : ''}`}
              >
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                      isActive ? 'bg-yellow-500 text-zinc-950' : 'bg-indigo-600'
                    }`}
                  >
                    {opponent.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-950 ${
                      isOffline ? 'bg-red-500' : 'bg-green-500'
                    }`}
                  />
                </div>

                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-xs font-black truncate max-w-[90px]">
                      {opponent.name}
                    </span>
                    {opponent.calledTumpuk && (
                      <span className="bg-red-500 text-white text-[9px] px-1 font-extrabold rounded-sm uppercase tracking-wide">
                        T!
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-extrabold">
                    {opponent.handCount} kartu
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Color Indicator */}
        <div className="absolute top-4 flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800 rounded-full px-4 py-1.5 shadow-lg z-10">
          <span className="text-zinc-400 text-[10px] font-black uppercase tracking-wider">WARNA AKTIF:</span>
          <span className={`text-xs font-black uppercase tracking-widest ${colorTextMap[currentColor]}`}>
            {currentColor === 'wild' ? 'BEBAS' : currentColor}
          </span>
        </div>

        {/* Action / Penalti Banner */}
        {drawStack > 0 && (
          <div className="bg-red-950 border border-red-800/60 text-red-200 text-xs px-4 py-2 rounded-xl animate-bounce shadow-lg flex items-center gap-2 z-10">
            <span className="font-extrabold uppercase">AKUMULASI PENALTI:</span>
            <span className="font-black text-sm text-red-400 bg-red-900/40 px-2 py-0.5 rounded-md">+{drawStack}</span>
          </div>
        )}

        {/* Center Deck & Discard pile Drop Zone */}
        <div className="flex gap-8 items-center justify-center my-4 z-10">
          {/* Deck (Tap to draw) */}
          <div className="flex flex-col items-center gap-2">
            <div
              onClick={isMyTurn ? onDrawCard : undefined}
              className={`w-16 h-24 lg:w-20 lg:h-30 rounded-xl border-4 border-white shadow-xl bg-zinc-800 flex items-center justify-center relative overflow-hidden select-none shrink-0 cursor-pointer ${
                isMyTurn ? 'hover:scale-105 active:scale-95 transition-all' : 'opacity-70 cursor-not-allowed'
              }`}
            >
              <div className="absolute inset-2 border-2 border-dashed border-zinc-600 rounded-lg flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center font-bold text-white tracking-widest text-xs border border-white rotate-12 shadow-md">
                  T!
                </div>
              </div>
            </div>
            <span className="text-zinc-500 text-[10px] font-black tracking-wider uppercase">DECK ({deckCount})</span>
          </div>

          {/* Discard Pile Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center gap-2 rounded-2xl p-2 transition-all ${
              isDragOverDiscard ? 'bg-indigo-600/30 scale-110 ring-4 ring-indigo-500' : ''
            }`}
          >
            <Card card={discardTop} isPlayable={false} className="shadow-xl lg:w-20 lg:h-30" />
            <span className="text-zinc-500 text-[10px] font-black tracking-wider uppercase">
              {isDragOverDiscard ? 'LEPAS KARTU!' : 'BUANGAN'}
            </span>
          </div>
        </div>

        {/* Floating actions (TUMPUK! / challenge) */}
        <div className="flex gap-4 w-full justify-center mt-2 px-4 z-10">
          {opponents.some(op => op.handCount === 1 && !op.calledTumpuk) && (
            <button
              onClick={() => {
                const target = opponents.find(op => op.handCount === 1 && !op.calledTumpuk);
                if (target) onChallengeTumpuk(target.id);
              }}
              className="h-12 flex-1 max-w-[140px] bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border border-red-500"
            >
              CHALLENGE!
            </button>
          )}

          <button
            onClick={onCallTumpuk}
            className={`h-12 flex-1 max-w-[140px] text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border-2 border-white/10 ${
              showTumpukPulse
                ? 'bg-yellow-400 animate-pulse border-yellow-300'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700'
            }`}
          >
            TUMPUK!
          </button>
        </div>

        {/* Timer Bar */}
        {isMyTurn && (
          <div className="w-full max-w-[200px] flex flex-col items-center gap-1 mt-4 z-10">
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  timeRemaining <= 5 ? 'bg-red-500' : 'bg-yellow-400'
                }`}
                style={{ width: `${(timeRemaining / 20) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-400 font-extrabold">SISA WAKTU: {timeRemaining} Detik</span>
          </div>
        )}
      </div>

      {/* 3. Bottom Player Hand strip */}
      <PlayerHand hand={hand} onPlayCard={onPlayCard} isMyTurn={isMyTurn} />
    </div>
  );
}
