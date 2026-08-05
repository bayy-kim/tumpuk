'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');

  const handleCreateRoom = () => {
    // Generate a random 6-digit room code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store player name in session storage so it can be picked up by the room page
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('tumpuk_player_name', name.trim() || 'Pemain Guest');
    }
    
    router.push(`/room/${code}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = roomCodeInput.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      alert('Kode room harus 6 digit angka!');
      return;
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('tumpuk_player_name', name.trim() || 'Pemain Guest');
    }

    router.push(`/room/${cleanCode}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white select-none">
      <div className="w-full max-w-md flex flex-col gap-8 text-center">
        {/* Playful brand logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-3xl bg-red-500 flex items-center justify-center border-4 border-white shadow-xl rotate-12 transition transform hover:rotate-0 duration-300">
            <span className="text-white text-4xl font-black tracking-wider">T!</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase mt-2">
            Tumpuk!
          </h1>
          <p className="text-zinc-400 text-xs px-6">
            Main game kartu real-time multiplayer bergaya UNO yang seru bareng teman-temanmu secara online.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-6 shadow-2xl">
          {/* Player Name Input */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">
              NAMA GUEST KAMU
            </label>
            <input
              type="text"
              placeholder="Masukkan namamu..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl px-4 text-white text-sm font-extrabold focus:outline-none focus:border-indigo-600 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-4">
            {/* Create Room Button */}
            <button
              onClick={handleCreateRoom}
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all"
            >
              Buat Room Baru
            </button>

            {/* Divider */}
            <div className="flex items-center gap-2 my-1">
              <div className="flex-1 h-[1px] bg-zinc-800" />
              <span className="text-[10px] text-zinc-600 font-bold uppercase">ATAU GABUNG KODE</span>
              <div className="flex-1 h-[1px] bg-zinc-800" />
            </div>

            {/* Join Room Form */}
            <form onSubmit={handleJoinRoom} className="flex gap-2 justify-center">
              <input
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={6}
                placeholder="KODE"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, ''))}
                className="h-14 w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl text-center text-2xl font-black tracking-widest uppercase focus:outline-none focus:border-yellow-400 text-yellow-400 transition-colors"
              />
              <button
                type="submit"
                className="h-14 px-6 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-zinc-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shrink-0 transition-colors"
              >
                GABUNG
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
