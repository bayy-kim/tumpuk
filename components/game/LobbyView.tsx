'use client';

import React from 'react';
import { HouseRules } from '@/lib/events';

interface PlayerLobbyItem {
  id: string;
  name: string;
  connected: boolean;
  isHost: boolean;
}

interface LobbyViewProps {
  roomCode: string;
  players: PlayerLobbyItem[];
  hostId: string;
  currentUserId: string;
  houseRules: HouseRules;
  onToggleRule: (ruleKey: keyof HouseRules) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export default function LobbyView({
  roomCode,
  players,
  hostId,
  currentUserId,
  houseRules,
  onToggleRule,
  onStartGame,
  onLeaveRoom,
}: LobbyViewProps) {
  const isHost = currentUserId === hostId;

  return (
    <div className="flex flex-col flex-1 bg-zinc-950 p-6 gap-6 w-full max-w-md mx-auto relative overflow-y-auto">
      {/* Lobby Header */}
      <div className="flex justify-between items-center bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 shrink-0 shadow-lg">
        <div className="flex flex-col text-left">
          <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">KODE ROOM</span>
          <span className="text-white text-3xl font-black tracking-widest">{roomCode}</span>
        </div>
        <button
          onClick={onLeaveRoom}
          className="h-10 px-4 bg-zinc-800 text-zinc-300 font-extrabold text-xs tracking-wider rounded-xl border border-zinc-700 active:bg-zinc-800/85"
        >
          KELUAR
        </button>
      </div>

      {/* Players List */}
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto bg-zinc-900/40 border border-zinc-900 rounded-2xl p-4">
        <h3 className="text-zinc-400 text-xs font-black tracking-wider uppercase mb-1">
          PEMAIN ({players.length}/6)
        </h3>
        <div className="flex flex-col gap-2">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                  {player.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-white text-xs font-black">
                    {player.name} {player.id === currentUserId && '(Kamu)'}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-bold">
                    {player.isHost ? 'Host' : 'Pemain'}
                  </span>
                </div>
              </div>

              {/* Status Dot */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    player.connected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-[10px] text-zinc-400 font-bold">
                  {player.connected ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* House Rules Config */}
      <div className="flex flex-col gap-3 shrink-0 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
        <h3 className="text-zinc-400 text-xs font-black tracking-wider uppercase text-left">
          ATURAN RUMAH (HOUSE RULES)
        </h3>
        <div className="flex flex-col gap-3">
          {(Object.keys(houseRules) as Array<keyof HouseRules>).map((key) => {
            const labelMap = {
              stacking: 'Stacking Penalti (+2/+4)',
              jumpIn: 'Potong Giliran (Jump-In)',
              sevenZero: 'Efek 7-0 (Tukar Kartu)',
              drawToMatch: 'Draw Sampai Cocok',
            };

            return (
              <div key={key} className="flex items-center justify-between">
                <span className="text-zinc-300 text-xs font-extrabold">{labelMap[key]}</span>
                <button
                  disabled={!isHost}
                  onClick={() => onToggleRule(key)}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                    houseRules[key] ? 'bg-indigo-600' : 'bg-zinc-700'
                  } ${!isHost ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      houseRules[key] ? 'left-6.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Start Button Area (min target 44px) */}
      <div className="shrink-0">
        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={players.length < 2}
            className="w-full h-14 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-zinc-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            MULAI GAME
          </button>
        ) : (
          <div className="w-full h-14 bg-zinc-900 border border-zinc-800 text-zinc-400 font-extrabold text-xs flex items-center justify-center rounded-2xl">
            MENUNGGU HOST MEMULAI GAME...
          </div>
        )}
      </div>
    </div>
  );
}
