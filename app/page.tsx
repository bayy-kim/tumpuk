import React from 'react';
import Link from 'next/link';
import { auth, signIn, signOut } from '@/lib/auth';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingHero from '@/components/landing/LandingHero';
import LandingFeatures from '@/components/landing/LandingFeatures';
import FaqAccordion from '@/components/game/FaqAccordion';

export default async function LandingPage() {
  const session = await auth();
  const user = session?.user;

  // Wrapped Server Actions
  const signInAction = async () => {
    'use server';
    await signIn('google');
  };

  const signOutAction = async () => {
    'use server';
    await signOut();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans select-none relative overflow-x-hidden">
      {/* 1. Header / Navbar with scroll glass effect */}
      <LandingNavbar
        user={user}
        signInAction={signInAction}
        signOutAction={signOutAction}
      />

      {/* 2. Hero Section */}
      <LandingHero
        actionForm={
          user ? (
            <Link
              href="/room"
              className="w-full sm:w-64 h-14 bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl flex items-center justify-center transition transform active:scale-95 cursor-pointer"
            >
              MASUK ROOM
            </Link>
          ) : (
            <form
              action={signInAction}
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
