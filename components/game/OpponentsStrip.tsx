'use client';

import React from 'react';
import { PlayerPublicState } from '@/lib/events';

interface OpponentsProps {
  opponents: PlayerPublicState[];
  activePlayerId: string;
}

export default function OpponentsStrip({ opponents, activePlayerId }: OpponentsProps) {
  return (
    <div className="w-full flex items-center justify-start gap-4 px-4 py-2 overflow-x-auto bg-zinc-900 border-b border-zinc-800 scrollbar-none shrink-0">
      {opponents.map((opponent) => {
        const isActive = opponent.id === activePlayerId;
        const isOffline = !opponent.connected;

        return (
          <div
            key={opponent.id}
            className={`flex items-center gap-2 p-2 rounded-lg border-2 shrink-0 select-none ${
              isActive
                ? 'border-yellow-400 bg-zinc-800 shadow'
                : 'border-zinc-700 bg-zinc-950'
            } ${isOffline ? 'opacity-50' : ''}`}
          >
            {/* Avatar block with status */}
            <div className="relative">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                  isActive ? 'bg-yellow-500 text-zinc-950' : 'bg-indigo-600'
                }`}
              >
                {opponent.name.slice(0, 2).toUpperCase()}
              </div>
              <div
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-zinc-950 ${
                  isOffline ? 'bg-red-500' : 'bg-green-500'
                }`}
              />
            </div>

            {/* Profile info */}
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-white text-xs font-bold truncate max-w-[80px]">
                  {opponent.name}
                </span>
                {opponent.calledTumpuk && (
                  <span className="bg-red-500 text-white text-[9px] px-1 font-extrabold rounded-sm uppercase tracking-wide">
                    T!
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Visual miniature cards */}
                <div className="w-3 h-4 rounded-sm bg-zinc-700 border border-zinc-500 shrink-0 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                </div>
                <span className="text-[10px] text-zinc-400 font-extrabold">
                  {opponent.handCount} kartu
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
