'use client';

import React, { useState, useEffect } from 'react';

interface ScoreItem {
  playerId: string;
  name: string;
  score: number;
}

interface EndScreenViewProps {
  winnerId: string;
  scores: ScoreItem[];
  currentUserId: string;
  loserId?: string | null;
  loserName?: string | null;
  pollDeadline?: number;
  winningChallenge?: string | null;
  proofUrl?: string | null;
  onVoteChallenge?: (option: string) => void;
  onUploadProof?: (file: File) => void;
  onRematch: () => void;
  onLeave: () => void;
}

export default function EndScreenView({
  winnerId,
  scores,
  currentUserId,
  loserId,
  loserName,
  pollDeadline = 0,
  winningChallenge,
  proofUrl,
  onVoteChallenge,
  onUploadProof,
  onRematch,
  onLeave,
}: EndScreenViewProps) {
  const isWinner = currentUserId === winnerId;
  const isLoser = currentUserId === loserId;
  const winnerName = scores.find((s) => s.playerId === winnerId)?.name || 'Pemain';

  const [pollTimeLeft, setPollTimeLeft] = useState(() => 
    pollDeadline ? Math.max(0, Math.ceil((pollDeadline - Date.now()) / 1000)) : 0
  );
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');
  const [uploading, setUploading] = useState(false);

  // Poll 10s timer
  useEffect(() => {
    if (!pollDeadline) return;
    const calc = () => Math.max(0, Math.ceil((pollDeadline - Date.now()) / 1000));
    const interval = setInterval(() => {
      const remaining = calc();
      setPollTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [pollDeadline]);

  const presetOptions = [
    '🌾 Coret muka pakai terigu',
    '🧂 Makan garam tanpa ekspresi',
    '💃 Joget kocak 15 detik',
  ];

  const handleVoteSubmit = (option: string) => {
    setSelectedOption(option);
    if (onVoteChallenge) onVoteChallenge(option);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    handleVoteSubmit(`✍️ ${customText.trim()}`);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadProof) {
      setUploading(true);
      try {
        await onUploadProof(file);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-zinc-950 p-6 gap-6 w-full max-w-md mx-auto justify-between select-none overflow-y-auto">
      {/* Winner Banner */}
      <div className="flex flex-col items-center gap-3 text-center mt-4">
        <div className="w-20 h-20 rounded-full bg-yellow-400 border-4 border-white flex items-center justify-center text-3xl shadow-2xl animate-bounce">
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
      <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shrink-0">
        <h3 className="text-zinc-400 text-xs font-black tracking-wider uppercase text-left">
          HASIL SKOR MATCH
        </h3>
        <div className="flex flex-col gap-2">
          {scores.map((scoreItem, index) => {
            const isMe = scoreItem.playerId === currentUserId;
            const isMatchWinner = scoreItem.playerId === winnerId;
            const isMatchLoser = scoreItem.playerId === loserId;

            return (
              <div
                key={scoreItem.playerId}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  isMatchWinner
                    ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300'
                    : isMatchLoser
                    ? 'bg-red-950/40 border-red-700/50 text-red-300'
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
                    {isMatchLoser && (
                      <span className="text-[10px] font-black text-red-400 uppercase tracking-wide">
                        PECUNDANG (SKOR TERENDAH)
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

      {/* 10-SECOND CHALLENGE POLL SECTION */}
      {loserId && (
        <div className="flex flex-col gap-4 bg-zinc-900 border-2 border-red-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <div className="flex flex-col text-left">
              <span className="text-red-400 text-[10px] font-black uppercase tracking-wider">HUKUMAN PECUNDANG</span>
              <span className="text-white text-base font-black uppercase">
                {loserName ? `${loserName.toUpperCase()}` : 'PECUNDANG'}
              </span>
            </div>
            {pollTimeLeft > 0 && (
              <div className="flex items-center gap-1 bg-red-950/80 border border-red-800 text-red-300 text-xs px-3 py-1.5 rounded-full font-black animate-pulse">
                <span>⏱️</span>
                <span>{pollTimeLeft}s</span>
              </div>
            )}
          </div>

          {/* Polling Stage (Active Timer) */}
          {pollTimeLeft > 0 && !winningChallenge ? (
            <div className="flex flex-col gap-3 text-left">
              <span className="text-zinc-300 text-xs font-bold">
                Pilih hukuman untuk {loserName} (Sisa {pollTimeLeft}s):
              </span>
              <div className="flex flex-col gap-2">
                {presetOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleVoteSubmit(opt)}
                    className={`p-3 rounded-xl border text-xs font-black text-left transition-all ${
                      selectedOption === opt
                        ? 'bg-yellow-400 text-zinc-950 border-yellow-300 scale-102 shadow-lg'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* Custom challenge form */}
              <form onSubmit={handleCustomSubmit} className="flex gap-2 mt-1">
                <input
                  type="text"
                  placeholder="Ketik hukuman kustom..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-xs text-white font-extrabold focus:outline-none focus:border-yellow-400"
                />
                <button
                  type="submit"
                  className="px-4 bg-zinc-800 text-yellow-400 border border-zinc-700 rounded-xl text-xs font-black hover:bg-zinc-700"
                >
                  KIRIM
                </button>
              </form>
            </div>
          ) : (
            /* Result & Upload / Download Stage */
            <div className="flex flex-col gap-4 text-left">
              <div className="bg-zinc-950 border border-yellow-500/30 rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">HUKUMAN TERPILIH</span>
                <span className="text-yellow-400 text-sm font-black uppercase">{winningChallenge || 'Coret muka pakai terigu'}</span>
              </div>

              {/* Loser Upload Action */}
              {isLoser && !proofUrl && (
                <div className="flex flex-col gap-2 bg-red-950/30 border border-red-800/40 p-4 rounded-2xl">
                  <span className="text-red-300 text-xs font-black uppercase">UNGGAH BUKTI HUKUMAN KAMU!</span>
                  <p className="text-zinc-400 text-[11px]">Ambil foto/video pendek saat menjalankan hukuman di atas.</p>
                  <label className="h-12 w-full bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center cursor-pointer shadow-lg active:scale-95 transition-all">
                    {uploading ? 'MENGUNGGAH...' : 'PILIH FOTO / VIDEO BUKTI'}
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Download Proof Link */}
              {proofUrl && (
                <div className="flex flex-col gap-3 bg-green-950/30 border border-green-800/40 p-4 rounded-2xl">
                  <span className="text-green-400 text-xs font-black uppercase">BUKTI HUKUMAN SUDAH DIUNGGAH!</span>
                  <a
                    href={proofUrl}
                    target="_blank"
                    download
                    rel="noopener noreferrer"
                    className="h-12 w-full bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
                  >
                    UNDUH DOKUMENTASI HUKUMAN
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
