'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingActions() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');

  const handleCreateRoom = () => {
    // Generate a random 6-digit room code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    router.push(`/room/${code}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = roomCode.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      alert('Kode room harus 6 digit angka!');
      return;
    }
    router.push(`/room/${cleanCode}`);
  };

  return (
    <div className="w-full flex flex-col gap-5 items-center justify-center max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
      <div className="flex flex-col gap-1 w-full text-center sm:text-left">
        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">SIAP BERMAIN?</span>
        <h3 className="text-white text-base font-black uppercase">Buat atau Gabung Room</h3>
      </div>

      {/* 1. Create Room Button */}
      <button
        onClick={handleCreateRoom}
        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all cursor-pointer"
      >
        Buat Room Baru
      </button>

      {/* Divider */}
      <div className="flex items-center gap-2 my-1 w-full">
        <div className="flex-1 h-[1px] bg-zinc-800" />
        <span className="text-[10px] text-zinc-600 font-bold uppercase shrink-0">ATAU GABUNG KODE</span>
        <div className="flex-1 h-[1px] bg-zinc-800" />
      </div>

      {/* 2. Join Room Form */}
      <form onSubmit={handleJoinRoom} className="flex gap-2 w-full">
        <input
          type="text"
          pattern="[0-9]*"
          inputMode="numeric"
          maxLength={6}
          placeholder="KODE"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))}
          className="h-14 w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl text-center text-2xl font-black tracking-widest uppercase focus:outline-none focus:border-yellow-400 text-yellow-400 transition-colors"
        />
        <button
          type="submit"
          className="h-14 px-6 bg-yellow-400 hover:bg-yellow-500 active:scale-95 text-zinc-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shrink-0 transition-colors cursor-pointer"
        >
          GABUNG
        </button>
      </form>
    </div>
  );
}
