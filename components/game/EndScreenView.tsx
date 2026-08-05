'use client';

import React from 'react';

interface ScoreItem {
  playerId: string;
  name: string;
  score: number;
}

interface EndScreenViewProps {
  winnerId: string;
  scores: ScoreItem[];
  currentUserId: string;
  onRematch: () => void;
  onLeave: () => void;
}

export default function EndScreenView({
  winnerId,
  scores,
  currentUserId,
  onRematch,
  onLeave,
}: EndScreenViewProps) {
  const isWinner = currentUserId === winnerId;
  const winnerName = scores.find((s) => s.playerId === winnerId)?.name || 'Pemain';

  return (
    <div className="flex flex-col flex-1 bg-zinc-950 p-6 gap-6 w-full max-w-md mx-auto justify-between select-none overflow-y-auto">
      {/* Winner Banner */}
      <div className="flex flex-col items-center gap-4 text-center mt-6">
        <div className="w-24 h-24 rounded-full bg-yellow-400 border-4 border-white flex items-center justify-center text-4xl shadow-2xl animate-bounce">
          🏆
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">
            {isWinner ? 'KAMU MENANG!' : `${winnerName.toUpperCase()} MENANG!`}
          </h1>
          <p className="text-zinc-400 text-xs font-bold">
            Match ronde ini telah berakhir. Berikut adalah rangkuman perolehan skor!
          </p>
        </div>
      </div>

      {/* Leaderboard/Score Board */}
      <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex-1 my-4">
        <h3 className="text-zinc-400 text-xs font-black tracking-wider uppercase text-left mb-1">
          HASIL SKOR MATCH
        </h3>
        <div className="flex flex-col gap-2">
          {scores.map((scoreItem, index) => {
            const isMe = scoreItem.playerId === currentUserId;
            const isMatchWinner = scoreItem.playerId === winnerId;

            return (
              <div
                key={scoreItem.playerId}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  isMatchWinner
                    ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300'
                    : isMe
                    ? 'bg-indigo-950/40 border-indigo-700/50 text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-black text-sm w-5 text-left text-zinc-500">
                    #{index + 1}
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="font-extrabold text-xs">
                      {scoreItem.name} {isMe && '(Kamu)'}
                    </span>
                    {isMatchWinner && (
                      <span className="text-[10px] font-black text-yellow-400 uppercase tracking-wide">
                        JUARA 1
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 font-black text-sm">
                  <span>+{scoreItem.score}</span>
                  <span className="text-[10px] text-zinc-500 font-bold">Poin</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Action Buttons (min target 44px) */}
      <div className="flex flex-col gap-3 shrink-0">
        <button
          onClick={onRematch}
          className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all"
        >
          MAIN LAGI (REMATCH)
        </button>
        <button
          onClick={onLeave}
          className="w-full h-12 bg-zinc-800 text-zinc-300 font-extrabold text-xs tracking-wider rounded-xl border border-zinc-700 active:bg-zinc-800/85"
        >
          KELUAR KE LANDING
        </button>
      </div>
    </div>
  );
}
