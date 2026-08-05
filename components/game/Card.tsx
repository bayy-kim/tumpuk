'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
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

const baseImageMap = {
  red: '/cards/red_base.png',
  yellow: '/cards/yellow_base.png',
  green: '/cards/green_base.png',
  blue: '/cards/blue_base.png',
  wild: '/cards/wild_base.png',
};

const badgeBgMap = {
  red: 'bg-red-600 text-white border-red-800',
  yellow: 'bg-yellow-400 text-zinc-950 border-yellow-600',
  green: 'bg-green-600 text-white border-green-800',
  blue: 'bg-blue-600 text-white border-blue-800',
  wild: 'bg-zinc-900 text-white border-zinc-950',
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
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isPlayable) return;
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', card.id);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  if (isBack) {
    return (
      <div
        className={`w-16 h-24 rounded-xl border-2 border-white shadow-xl flex items-center justify-center relative overflow-hidden select-none shrink-0 ${className}`}
        style={{
          transform: `rotate(${angle}deg)`,
          ...style,
        }}
      >
        <Image
          src="/cards/card_back.png"
          alt="Card Back"
          fill
          className="object-cover"
          sizes="96px"
        />
      </div>
    );
  }

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
  const bgImage = baseImageMap[card.color] || '/cards/wild_base.png';
  const badgeStyle = badgeBgMap[card.color];

  return (
    <motion.div
      whileHover={isPlayable && onClick ? { y: -12, scale: 1.05 } : {}}
      whileTap={isPlayable && onClick ? { scale: 0.95 } : {}}
      onClick={isPlayable ? onClick : undefined}
      draggable={isPlayable}
      onDragStartCapture={handleDragStart}
      className={`w-16 h-24 rounded-xl border-2 border-white shadow-xl flex flex-col items-center justify-between p-1.5 relative overflow-hidden select-none shrink-0 cursor-pointer ${
        !isPlayable ? 'opacity-60 cursor-not-allowed' : ''
      } ${className}`}
      style={{
        transform: `rotate(${angle}deg)`,
        ...style,
      }}
    >
      {/* Background Slime Monster Image */}
      <Image
        src={bgImage}
        alt={`${card.color} card art`}
        fill
        className="object-cover pointer-events-none"
        sizes="96px"
        priority
      />

      {/* Top Left Value Badge */}
      <div className={`self-start min-w-5 h-5 px-1 rounded-md border flex items-center justify-center font-black text-[11px] leading-none shadow-md z-10 ${badgeStyle}`}>
        {valueDisplay()}
      </div>

      {/* Center Action Overlay Badge (for skip, reverse, +2, wild, +4) */}
      {card.type !== 'number' && (
        <div className="flex items-center justify-center flex-1 z-10">
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-black text-xs shadow-lg ${badgeStyle}`}>
            {isWild ? (card.type === 'wild4' ? '+4' : 'W') : valueDisplay()}
          </div>
        </div>
      )}

      {/* Bottom Right Value Badge */}
      <div className={`self-end min-w-5 h-5 px-1 rounded-md border flex items-center justify-center font-black text-[11px] leading-none shadow-md rotate-180 z-10 ${badgeStyle}`}>
        {valueDisplay()}
      </div>
    </motion.div>
  );
}
