import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { auth, signIn, signOut } from '@/lib/auth';
import LandingHero from '@/components/landing/LandingHero';
import LandingFeatures from '@/components/landing/LandingFeatures';
import FaqAccordion from '@/components/game/FaqAccordion';

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
              {/* Profile Link target */}
              <Link
                href="/profileuser"
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
              >
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-black text-white">{user.name}</span>
                  <span className="text-[9px] text-zinc-400 font-extrabold uppercase">Pemain</span>
                </div>
                {user.image ? (
                  <div className="w-8 h-8 rounded-full border border-zinc-700 overflow-hidden relative shadow">
                    <Image
                      src={user.image}
                      alt={user.name || 'User Profile'}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                    {(user.name || 'U').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </Link>

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
      <LandingHero
        actionForm={
          user ? (
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
              className="w-full flex flex-col sm:flex-row gap-4 justify-center max-w-md"
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
          )
        }
      />

      {/* 3. Feature Showcase */}
      <LandingFeatures />

      {/* 4. FAQ Section (Above Footer) */}
      <section className="w-full bg-zinc-950 py-16 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto flex flex-col gap-6 text-center">
          <div className="flex flex-col gap-1">
            <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              PERTANYAAN UMUM (FAQ)
            </h3>
            <p className="text-zinc-400 text-xs">
              Temukan jawaban atas pertanyaan yang sering diajukan mengenai game Tumpuk!
            </p>
          </div>

          <FaqAccordion />
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="w-full py-10 px-6 border-t border-zinc-900/80 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center text-white text-xs font-black">
            T!
          </div>
          <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
            Tumpuk! Card Game
          </span>
        </div>

        {/* Links including Panduan */}
        <div className="flex items-center gap-6 text-xs font-black text-zinc-400">
          <Link href="/panduan" className="hover:text-yellow-400 transition-colors uppercase tracking-wider">
            PANDUAN
          </Link>
          {user && (
            <Link href="/profileuser" className="hover:text-yellow-400 transition-colors uppercase tracking-wider">
              PROFIL
            </Link>
          )}
          <a
            href="https://github.com/bayy-kim/tumpuk"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-yellow-400 transition-colors uppercase tracking-wider"
          >
            GITHUB
          </a>
        </div>

        <span className="text-zinc-600 text-[10px] font-extrabold uppercase tracking-wider">
          &copy; {new Date().getFullYear()} Tumpuk! All rights reserved.
        </span>
      </footer>
    </div>
  );
}
