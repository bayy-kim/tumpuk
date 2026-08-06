import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import LandingActions from '@/components/landing/LandingActions';

export default async function RoomManagementPage() {
  const session = await auth();

  // Enforce mandatory Google login redirection
  if (!session?.user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans select-none relative overflow-x-hidden">
      {/* Navbar */}
      <header className="w-full bg-zinc-900/60 backdrop-blur-md border-b border-zinc-800/80 sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center border-2 border-white shadow rotate-6 group-hover:rotate-0 transition-transform duration-300">
            <span className="text-white text-base font-black">T!</span>
          </div>
          <span className="text-xl font-black uppercase tracking-tight text-white group-hover:text-red-400 transition-colors">
            Tumpuk!
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs font-black text-zinc-400 hover:text-white uppercase tracking-wider transition-colors"
        >
          &larr; KEMBALI
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Floating background blur blobs */}
        <div className="absolute top-10 left-10 w-48 h-48 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <LandingActions />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-zinc-600 text-[10px] font-bold uppercase tracking-wider border-t border-zinc-900/60 bg-zinc-950">
        &copy; {new Date().getFullYear()} Tumpuk! Card Game. All rights reserved.
      </footer>
    </div>
  );
}
