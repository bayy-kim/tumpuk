import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { auth, signIn, signOut } from '@/lib/auth';

export default async function LandingPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans select-none relative overflow-x-hidden">
      {/* 1. Header / Navbar */}
      <header className="w-full bg-zinc-900/60 backdrop-blur-md border-b border-zinc-800/80 sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center border-2 border-white shadow rotate-6 group-hover:rotate-0 transition-transform duration-300">
            <span className="text-white text-base font-black">T!</span>
          </div>
          <span className="text-xl font-black uppercase tracking-tight text-white group-hover:text-red-400 transition-colors">
            Tumpuk!
          </span>
        </Link>

        {/* Auth Action on Navbar */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-black text-white">{user.name}</span>
                <span className="text-[9px] text-zinc-400 font-extrabold uppercase">Pemain</span>
              </div>
              {user.image && (
                <div className="w-8 h-8 rounded-full border border-zinc-700 overflow-hidden relative">
                  <Image
                    src={user.image}
                    alt={user.name || 'User Profile'}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <form
                action={async () => {
                  'use server';
                  await signOut();
                }}
              >
                <button
                  type="submit"
                  className="h-10 px-4 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-black rounded-xl border border-zinc-700 transition active:scale-95 cursor-pointer"
                >
                  LOGOUT
                </button>
              </form>
            </div>
          ) : (
            <form
              action={async () => {
                'use server';
                await signIn('google');
              }}
              className="flex gap-2"
            >
              <button
                type="submit"
                className="h-10 px-4 bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-black rounded-xl transition active:scale-95 cursor-pointer"
              >
                MASUK
              </button>
              <button
                type="submit"
                className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition active:scale-95 cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                DAFTAR
              </button>
            </form>
          )}
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative">
        {/* Floating background blobs */}
        <div className="absolute top-10 left-10 w-48 h-48 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        <div className="w-full max-w-4xl flex flex-col items-center text-center gap-8 relative z-10">
          {/* Card teaser fan graphic */}
          <div className="flex gap-4 justify-center items-center h-40">
            <div className="w-16 h-24 rounded-xl border-2 border-white shadow-2xl overflow-hidden relative rotate-[-12deg] translate-y-3">
              <Image src="/cards/red_base.png" alt="Red Card" fill className="object-cover" sizes="96px" />
            </div>
            <div className="w-18 h-28 rounded-xl border-2 border-white shadow-2xl overflow-hidden relative z-10 rotate-[-2deg] scale-105">
              <Image src="/cards/wild_base.png" alt="Wild Card" fill className="object-cover" sizes="100px" />
            </div>
            <div className="w-16 h-24 rounded-xl border-2 border-white shadow-2xl overflow-hidden relative rotate-[10deg] translate-y-3">
              <Image src="/cards/blue_base.png" alt="Blue Card" fill className="object-cover" sizes="96px" />
            </div>
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-3">
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase leading-none">
              TUMPUK KARTUNYA, <br />
              <span className="text-yellow-400">REBUT KEMENANGAN!</span>
            </h2>
            <p className="max-w-2xl mx-auto text-zinc-400 text-sm sm:text-base leading-relaxed px-4">
              Main game kartu online real-time multiplayer bergaya UNO bersama teman. Nikmati desain kartu unik lucu slime monster dan aturan kustomisasi seru!
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-md">
            {user ? (
              <Link
                href="/room/123456"
                className="w-full sm:w-auto h-14 px-8 bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl flex items-center justify-center transition transform active:scale-95"
              >
                BUAT / GABUNG ROOM
              </Link>
            ) : (
              <form
                action={async () => {
                  'use server';
                  await signIn('google');
                }}
                className="w-full flex flex-col sm:flex-row gap-4 justify-center"
              >
                <button
                  type="submit"
                  className="w-full sm:w-56 h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition transform active:scale-95 cursor-pointer"
                >
                  MAIN SEKARANG
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-56 h-14 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg transition transform active:scale-95 cursor-pointer"
                >
                  DAFTAR AKUN
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* 3. Feature Showcase */}
      <section className="w-full bg-zinc-900/40 border-t border-zinc-900 py-16 px-6 shrink-0">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-2 p-5 bg-zinc-900 border border-zinc-800/80 rounded-2xl">
            <span className="text-2xl">⚡</span>
            <h4 className="text-white text-sm font-black uppercase tracking-tight">Real-Time WebSocket</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Didukung oleh arsitektur PartyKit yang menyinkronkan setiap giliran dan kartu dengan kencang di bawah 100ms.
            </p>
          </div>
          <div className="flex flex-col gap-2 p-5 bg-zinc-900 border border-zinc-800/80 rounded-2xl">
            <span className="text-2xl">👾</span>
            <h4 className="text-white text-sm font-black uppercase tracking-tight">Slime Card Art</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Visual slime monster lucu dengan ekspresi unik untuk setiap warna kartu yang membuat permainan jadi menggemaskan.
            </p>
          </div>
          <div className="flex flex-col gap-2 p-5 bg-zinc-900 border border-zinc-800/80 rounded-2xl">
            <span className="text-2xl">🛡️</span>
            <h4 className="text-white text-sm font-black uppercase tracking-tight">Zero Hand Leak</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Keamanan tingkat tinggi di mana server mengaburkan isi kartu lawan dari devtools Anda, mencegah kecurangan apa pun.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="w-full py-8 text-center text-zinc-600 text-[10px] font-bold uppercase tracking-wider border-t border-zinc-900/60 bg-zinc-950">
        &copy; {new Date().getFullYear()} Tumpuk! Card Game. All rights reserved.
      </footer>
    </div>
  );
}
