'use client';

import React from 'react';

export default function LandingFeatures() {
  return (
    <section className="w-full bg-zinc-900/40 border-t border-zinc-900 py-16 px-6 shrink-0">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Feature 1 */}
        <div className="flex flex-col gap-3 p-5 bg-zinc-900 border border-zinc-800/80 rounded-2xl text-left">
          {/* Icon (Lightning bolt) */}
          <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400 shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
            </svg>
          </div>
          <h4 className="text-white text-sm font-black uppercase tracking-tight">Real-Time WebSocket</h4>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Didukung oleh arsitektur PartyKit yang menyinkronkan setiap giliran dan kartu dengan kencang di bawah 100ms.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="flex flex-col gap-3 p-5 bg-zinc-900 border border-zinc-800/80 rounded-2xl text-left">
          {/* Icon (Ghost/Mascot shape) */}
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm6.75 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Z" />
            </svg>
          </div>
          <h4 className="text-white text-sm font-black uppercase tracking-tight">Slime Card Art</h4>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Visual slime monster lucu dengan ekspresi unik untuk setiap warna kartu yang membuat permainan jadi menggemaskan.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="flex flex-col gap-3 p-5 bg-zinc-900 border border-zinc-800/80 rounded-2xl text-left">
          {/* Icon (Shield) */}
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
          <h4 className="text-white text-sm font-black uppercase tracking-tight">Zero Hand Leak</h4>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Keamanan tingkat tinggi di mana server mengaburkan isi kartu lawan dari devtools Anda, mencegah kecurangan apa pun.
          </p>
        </div>

      </div>
    </section>
  );
}
