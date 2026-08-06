'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LandingNavbarProps {
  user?: {
    name?: string | null;
    image?: string | null;
  } | null;
  signOutAction: () => Promise<void>;
  signInAction: () => Promise<void>;
}

export default function LandingNavbar({ user, signOutAction, signInAction }: LandingNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`w-full sticky top-0 z-50 px-6 py-4 flex items-center justify-between transition-all duration-300 ${
        isScrolled
          ? 'bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 shadow-lg shadow-black/20'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
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

            <form action={signOutAction}>
              <button
                type="submit"
                className="h-10 px-4 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-black rounded-xl border border-zinc-700 transition active:scale-95 cursor-pointer"
              >
                LOGOUT
              </button>
            </form>
          </div>
        ) : (
          <form action={signInAction} className="flex gap-2">
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
  );
}
