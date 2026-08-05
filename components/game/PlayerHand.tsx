'use client';

import React from 'react';
import Card from './Card';
import { Card as CardType } from '@/lib/events';

interface PlayerHandProps {
  hand: CardType[];
  onPlayCard: (cardId: string) => void;
  isMyTurn: boolean;
}

export default function PlayerHand({ hand, onPlayCard, isMyTurn }: PlayerHandProps) {
  // Generate random angles to simulate a hand fan layout
  const getCardAngle = (index: number, total: number) => {
    if (total <= 1) return 0;
    const maxSpread = Math.min(25, (total - 1) * 3); // Cap max spread angle
    const step = maxSpread / (total - 1);
    return -maxSpread / 2 + index * step;
  };

  return (
    <div className="w-full bg-zinc-950/90 border-t border-zinc-800 p-4 shrink-0 flex flex-col gap-2 relative">
      <div className="flex justify-between items-center px-1">
        <span className="text-zinc-400 text-xs font-bold">Kartumu ({hand.length})</span>
        {isMyTurn && (
          <span className="text-yellow-400 text-xs font-black animate-pulse">
            Giliranmu! Pilih kartu untuk dimainkan
          </span>
        )}
      </div>

      <div className="w-full overflow-x-auto lg:overflow-x-visible lg:flex-wrap lg:justify-center flex gap-3 py-3 px-1 scrollbar-none items-end min-h-[120px]">
        {hand.map((card, idx) => {
          const angle = getCardAngle(idx, hand.length);
          return (
            <Card
              key={card.id}
              card={card}
              onClick={() => onPlayCard(card.id)}
              isPlayable={isMyTurn}
              angle={angle}
              className="transform-gpu transition-all"
            />
          );
        })}
      </div>
    </div>
  );
}
