import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function ProfileUserPage() {
  const session = await auth();

  if (!session?.user || !session.user.id) {
    redirect('/');
  }

  const { user } = session;

  // Fetch real match histories and scores from Neon/Postgres via Prisma
  const userMatches = await prisma.matchPlayer.findMany({
    where: { userId: user.id },
    include: {
      match: {
        include: {
          room: true,
        },
      },
    },
    orderBy: {
      id: 'desc',
    },
  });

  const totalMatches = userMatches.length;
  const wins = userMatches.filter((m) => m.match.winnerId === user.id).length;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

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

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 flex flex-col gap-8">
        {/* User Info Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* Avatar */}
          <div className="w-24 h-24 rounded-full border-4 border-yellow-400 overflow-hidden relative shrink-0 shadow-xl">
            {user.image ? (
              <Image src={user.image} alt={user.name || 'User Avatar'} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-indigo-600 flex items-center justify-center font-black text-2xl text-white">
                {(user.name || 'U').slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">{user.name}</h1>
              <span className="bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                VERIFIED
              </span>
            </div>
            <p className="text-zinc-400 text-xs font-medium">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">PROVIDER:</span>
              <span className="bg-zinc-800 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border border-zinc-700">
                GOOGLE OAUTH
              </span>
            </div>
          </div>

          {/* Sign Out Action */}
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}
          >
            <button
              type="submit"
              className="h-11 px-5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-black rounded-xl transition active:scale-95 cursor-pointer"
            >
              LOGOUT
            </button>
          </form>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-1 text-center sm:text-left">
            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">TOTAL MATCH</span>
            <span className="text-3xl font-black text-white">{totalMatches}</span>
            <span className="text-[10px] text-zinc-400 font-bold">Ronde Dimainkan</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-1 text-center sm:text-left">
            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">KEMENANGAN</span>
            <span className="text-3xl font-black text-yellow-400">{wins}</span>
            <span className="text-[10px] text-zinc-400 font-bold">Juara 1 Ronde</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-1 text-center sm:text-left">
            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">WIN RATE</span>
            <span className="text-3xl font-black text-green-400">{winRate}%</span>
            <span className="text-[10px] text-zinc-400 font-bold">Persentase Menang</span>
          </div>
        </div>

        {/* Recent Match History */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-4">
          <h3 className="text-white text-xs font-black tracking-wider uppercase text-left">
            RIWAYAT MATCH TERAKHIR
          </h3>
          {userMatches.length === 0 ? (
            <div className="text-zinc-500 text-xs py-8 text-center uppercase font-black">
              Belum ada riwayat pertandingan
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {userMatches.map((m) => {
                const isWinner = m.match.winnerId === user.id;

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-xl"
                  >
                    <div className="flex flex-col text-left">
                      <span className="text-white text-xs font-black">
                        Room 6 Digit (#{m.match.room.code})
                      </span>
                      <span className="text-[10px] text-zinc-500 font-bold">
                        {new Date(m.match.startedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          isWinner
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {isWinner ? 'MENANG' : 'KALAH'}
                      </span>
                      <span className="text-xs font-black text-white w-12 text-right">
                        {isWinner ? `+${m.scoreDelta}` : '0'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-zinc-600 text-[10px] font-bold uppercase tracking-wider border-t border-zinc-900/60 bg-zinc-950">
        &copy; {new Date().getFullYear()} Tumpuk! Card Game. All rights reserved.
      </footer>
    </div>
  );
}
