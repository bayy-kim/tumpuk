'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card as CardType } from '@/lib/events';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  isPlayable?: boolean;
  style?: React.CSSProperties;
  className?: string;
  isBack?: boolean;
  angle?: number;
}

const colorMap = {
  red: 'bg-red-500 border-red-700 text-white',
  yellow: 'bg-yellow-400 border-yellow-600 text-zinc-900',
  green: 'bg-green-500 border-green-700 text-white',
  blue: 'bg-blue-500 border-blue-700 text-white',
  wild: 'bg-zinc-800 border-zinc-950 text-white',
};

const textColors = {
  red: 'text-red-100',
  yellow: 'text-yellow-900',
  green: 'text-green-100',
  blue: 'text-blue-100',
  wild: 'text-zinc-300',
};

export default function Card({
  card,
  onClick,
  isPlayable = true,
  style,
  className = '',
  isBack = false,
  angle = 0,
}: CardProps) {
  const handleDragStart = (e: any) => {
    if (!isPlayable) return;
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', card.id);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  if (isBack) {
    return (
      <div
        className={`w-16 h-24 rounded-xl border-4 border-white shadow-lg bg-zinc-800 flex items-center justify-center relative overflow-hidden select-none shrink-0 ${className}`}
        style={{
          transform: `rotate(${angle}deg)`,
          ...style,
        }}
      >
        <div className="absolute inset-2 border-2 border-dashed border-zinc-600 rounded-lg flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center font-bold text-white tracking-widest text-xs border border-white rotate-12">
            T!
          </div>
        </div>
      </div>
    );
  }

  const colorClass = colorMap[card.color];
  const valueDisplay = () => {
    switch (card.type) {
      case 'number':
        return card.value !== undefined ? card.value.toString() : '';
      case 'skip':
        return '∅';
      case 'reverse':
        return '⇆';
      case 'draw2':
        return '+2';
      case 'wild':
        return 'W';
      case 'wild4':
        return '+4';
      default:
        return '';
    }
  };

  const isWild = card.type === 'wild' || card.type === 'wild4';

  return (
    <motion.div
      whileHover={isPlayable && onClick ? { y: -12, scale: 1.05 } : {}}
      whileTap={isPlayable && onClick ? { scale: 0.95 } : {}}
      onClick={isPlayable ? onClick : undefined}
      draggable={isPlayable}
      onDragStart={handleDragStart}
      className={`w-16 h-24 rounded-xl border-4 border-white shadow-lg flex flex-col items-center justify-between p-2 relative overflow-hidden select-none shrink-0 cursor-pointer ${colorClass} ${
        !isPlayable ? 'opacity-60 cursor-not-allowed' : ''
      } ${className}`}
      style={{
        transform: `rotate(${angle}deg)`,
        ...style,
      }}
    >
      {/* Background graphic styling for wild cards */}
      {isWild && (
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-40">
          <div className="bg-red-500"></div>
          <div className="bg-blue-500"></div>
          <div className="bg-yellow-400"></div>
          <div className="bg-green-500"></div>
        </div>
      )}

      {/* Top Left Value */}
      <span className="self-start text-[10px] font-extrabold leading-none z-10">
        {valueDisplay()}
      </span>

      {/* Center Display */}
      <div className="flex items-center justify-center flex-1 z-10">
        {isWild ? (
          <div className="w-7 h-7 rounded-full bg-white border-2 border-zinc-950 flex items-center justify-center font-black text-zinc-900 text-xs shadow">
            {card.type === 'wild4' ? '+4' : 'W'}
          </div>
        ) : (
          <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-2xl shadow border border-zinc-200 text-zinc-900`}>
            {valueDisplay()}
          </div>
        )}
      </div>

      {/* Bottom Right Value */}
      <span className="self-end text-[10px] font-extrabold leading-none rotate-180 z-10">
        {valueDisplay()}
      </span>
    </motion.div>
  );
}
