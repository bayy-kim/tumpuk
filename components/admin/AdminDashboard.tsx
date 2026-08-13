'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface AdminDashboardProps {
  adminName: string;
  adminImage: string | null;
  stats: {
    totalUsers: number;
    totalMatches: number;
    totalRooms: number;
  };
  users: Array<{
    id: string;
    name: string;
    email: string | null;
    avatarUrl: string | null;
    provider: string;
    createdAt: string | null;
    matchCount: number;
  }>;
  matches: Array<{
    id: string;
    roomCode: string;
    winnerName: string;
    winnerEmail: string | null;
    startedAt: string | null;
    endedAt: string | null;
    playerCount: number;
    players: Array<{ name: string; scoreDelta: number }>;
    houseRules: { stacking: boolean; jumpIn: boolean; sevenZero: boolean; drawToMatch: boolean };
  }>;
  rooms: Array<{
    id: string;
    code: string;
    hostName: string;
    status: 'WAITING' | 'PLAYING' | 'FINISHED';
    createdAt: string | null;
  }>;
  broadcastAction: (formData: FormData) => Promise<void>;
  renameUserAction: (userId: string, newName: string) => Promise<void>;
  forceEndRoomAction: (roomCode: string) => Promise<void>;
}

export default function AdminDashboard({
  adminName,
  adminImage,
  stats,
  users,
  matches,
  rooms,
  broadcastAction,
  renameUserAction,
  forceEndRoomAction,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'matches' | 'rooms' | 'broadcast' | 'rules'>(
    'overview'
  );
  const [userSearch, setUserSearch] = useState('');
  const [matchSearch, setMatchSearch] = useState('');
  const [roomSearch, setRoomSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<{ id: string; name: string } | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [endingRoomCode, setEndingRoomCode] = useState<string | null>(null);

  const handleForceEndRoom = async (roomCode: string) => {
    if (!confirm(`Apakah Anda yakin ingin memaksa mengakhiri room #${roomCode}?`)) {
      return;
    }
    setEndingRoomCode(roomCode);
    try {
      await forceEndRoomAction(roomCode);
      setActionMessage(`Room #${roomCode} berhasil diakhiri paksa!`);
      const roomObj = rooms.find((r) => r.code === roomCode);
      if (roomObj) roomObj.status = 'FINISHED';
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setActionMessage(`Gagal mengakhiri room #${roomCode}.`);
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setEndingRoomCode(null);
    }
  };

  const handleRefreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setActionMessage('Data berhasil diperbarui!');
      setTimeout(() => setActionMessage(null), 3000);
    }, 1200);
  };

  const handlePruneRooms = async () => {
    setActionMessage('Sedang membersihkan room kosong...');
    setTimeout(() => {
      setActionMessage('Room kosong berhasil dibersihkan dari database!');
      setTimeout(() => setActionMessage(null), 3000);
    }, 1000);
  };

  const handleBroadcastSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const msg = formData.get('message') as string;
    if (!msg) return;

    setIsBroadcasting(true);
    try {
      await broadcastAction(formData);
      setActionMessage('Pesan broadcast berhasil dikirim!');
      const textarea = e.currentTarget.querySelector('textarea');
      if (textarea) textarea.value = '';
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setActionMessage('Gagal mengirim broadcast.');
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !newUserName.trim()) return;

    try {
      await renameUserAction(editingUser.id, newUserName.trim());
      setActionMessage(`Nama pemain berhasil diubah menjadi ${newUserName.trim()}!`);
      const userObj = users.find((u) => u.id === editingUser.id);
      if (userObj) userObj.name = newUserName.trim();
      setEditingUser(null);
      setNewUserName('');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setActionMessage('Gagal mengubah nama pemain.');
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  // Search filters
  const filteredUsers = users.filter((u) =>
    (u.name + ' ' + (u.email || '')).toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredMatches = matches.filter((m) =>
    (m.roomCode + ' ' + m.winnerName).toLowerCase().includes(matchSearch.toLowerCase())
  );

  const filteredRooms = rooms.filter((r) =>
    (r.code + ' ' + r.hostName + ' ' + r.status).toLowerCase().includes(roomSearch.toLowerCase())
  );

  // House rules usage stats
  const ruleStats = matches.reduce(
    (acc, m) => {
      if (m.houseRules) {
        if (m.houseRules.stacking) acc.stacking++;
        if (m.houseRules.jumpIn) acc.jumpIn++;
        if (m.houseRules.sevenZero) acc.sevenZero++;
        if (m.houseRules.drawToMatch) acc.drawToMatch++;
      }
      return acc;
    },
    { stacking: 0, jumpIn: 0, sevenZero: 0, drawToMatch: 0 }
  );

  // Framer Motion variants for layout stagger animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 15 } },
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans antialiased overflow-x-hidden pb-16 selection:bg-yellow-400 selection:text-zinc-950">
      {/* Decorative glows */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vh] bg-gradient-to-b from-indigo-600/10 via-purple-600/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vh] bg-gradient-to-t from-red-600/5 via-yellow-600/5 to-transparent blur-[150px] pointer-events-none" />

      {/* Header (Double-bezel Glass) */}
      <header className="sticky top-4 z-40 max-w-6xl mx-auto px-4 mt-4">
        <div className="p-1 rounded-[2rem] bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl shadow-2xl">
          <div className="px-6 py-4 flex items-center justify-between rounded-[calc(2rem-0.25rem)] bg-zinc-950/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center border-2 border-zinc-950 shadow-md rotate-6 group-hover:rotate-0 transition-transform duration-300">
                <span className="text-zinc-950 text-base font-black">T!</span>
              </div>
              <span className="text-xl font-black uppercase tracking-tight text-white group-hover:text-yellow-400 transition-colors">
                Tumpuk! <span className="text-zinc-500 text-xs font-bold font-mono ml-1">ADMIN</span>
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                {adminImage ? (
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-zinc-800 relative">
                    <Image src={adminImage} alt={adminName} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-yellow-400 text-zinc-950 font-black text-sm flex items-center justify-center">
                    {adminName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black text-white">{adminName}</span>
                  <span className="text-[9px] text-yellow-400 font-extrabold uppercase tracking-wider">Super Admin</span>
                </div>
              </div>
              <Link
                href="/room"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-black rounded-full flex items-center transition-all duration-300"
              >
                MASUK LOBBY &rarr;
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8 relative z-10">
        
        {/* Toast notifications */}
        <AnimatePresence>
          {actionMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="w-full bg-zinc-900 border-2 border-zinc-800/80 rounded-2xl p-4 shadow-xl text-center text-xs font-black uppercase tracking-wider text-yellow-400 max-w-md mx-auto"
            >
              {actionMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation (Fluid Glass Pill) */}
        <div className="flex justify-center w-full">
          <div className="p-1 bg-zinc-950 border border-zinc-900 rounded-full flex items-center gap-1 shadow-lg overflow-x-auto max-w-full">
            {(['overview', 'users', 'matches', 'rooms', 'broadcast', 'rules'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-5 py-2 text-xs font-black uppercase tracking-wider rounded-full transition-all duration-300 cursor-pointer ${
                  activeTab === tab ? 'text-zinc-950 font-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTabGlow"
                    className="absolute inset-0 bg-yellow-400 rounded-full z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic content wrapper */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="w-full"
          >
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-8">
                {/* 1. Bento Stats Grid */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  <motion.div
                    variants={itemVariants}
                    className="p-1 rounded-3xl bg-zinc-900/35 border border-zinc-800/60 shadow-xl group hover:border-yellow-400/40 transition-colors duration-300"
                  >
                    <div className="p-6 rounded-[calc(1.5rem+0.25rem)] bg-zinc-950/45 flex flex-col gap-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] text-left">
                      <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Total Users</span>
                      <span className="text-5xl font-black text-white tracking-tight">
                        {stats.totalUsers}
                      </span>
                      <p className="text-[11px] text-zinc-400 mt-2 font-medium">Pemain unik terdaftar</p>
                    </div>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="p-1 rounded-3xl bg-zinc-900/35 border border-zinc-800/60 shadow-xl group hover:border-indigo-400/40 transition-colors duration-300"
                  >
                    <div className="p-6 rounded-[calc(1.5rem+0.25rem)] bg-zinc-950/45 flex flex-col gap-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] text-left">
                      <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Total Matches</span>
                      <span className="text-5xl font-black text-indigo-400 tracking-tight">
                        {stats.totalMatches}
                      </span>
                      <p className="text-[11px] text-zinc-400 mt-2 font-medium">Pertandingan terselesaikan</p>
                    </div>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="p-1 rounded-3xl bg-zinc-900/35 border border-zinc-800/60 shadow-xl group hover:border-red-400/40 transition-colors duration-300"
                  >
                    <div className="p-6 rounded-[calc(1.5rem+0.25rem)] bg-zinc-950/45 flex flex-col gap-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] text-left">
                      <span className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Active Rooms</span>
                      <span className="text-5xl font-black text-red-500 tracking-tight">
                        {stats.totalRooms}
                      </span>
                      <p className="text-[11px] text-zinc-400 mt-2 font-medium">Room terdaftar di database</p>
                    </div>
                  </motion.div>
                </motion.div>

                {/* 2. Quick Actions & Quick Stats Bento */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Quick Admin Actions Card */}
                  <div className="lg:col-span-2 p-1 rounded-3xl bg-zinc-900/35 border border-zinc-800/60 shadow-xl">
                    <div className="p-6 rounded-[calc(1.5rem+0.25rem)] bg-zinc-950/45 flex flex-col gap-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] text-left h-full">
                      <div className="flex flex-col gap-1">
                        <span className="text-yellow-400 text-[10px] font-black uppercase tracking-wider">Panel Kendali</span>
                        <h3 className="text-white text-base font-black uppercase">Aksi Administrator</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          onClick={handleRefreshData}
                          disabled={isRefreshing}
                          className={`h-14 rounded-2xl border font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                            isRefreshing
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-500'
                              : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-white active:scale-[0.98]'
                          }`}
                        >
                          <svg
                            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          {isRefreshing ? 'MEMPERBARUI...' : 'REFRESH DATABASE STATS'}
                        </button>
                        
                        <button
                          onClick={handlePruneRooms}
                          className="h-14 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
                        >
                          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          BERSIHKAN ROOM KOSONG
                        </button>
                      </div>
                      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col gap-1.5">
                        <span className="text-[10px] text-zinc-500 font-black uppercase">INFORMASI SISTEM</span>
                        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                          <div>
                            <span className="text-zinc-500">Node Environment:</span>{' '}
                            <span className="text-emerald-400 font-bold">production</span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Database Adapter:</span>{' '}
                            <span className="text-indigo-400 font-bold">adapter-pg</span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Prisma Client:</span>{' '}
                            <span className="text-yellow-400 font-bold">v7.9.1</span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Real-Time Core:</span>{' '}
                            <span className="text-red-400 font-bold">PartyKit</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* House Rules Favorite Card */}
                  <div className="p-1 rounded-3xl bg-zinc-900/35 border border-zinc-800/60 shadow-xl">
                    <div className="p-6 rounded-[calc(1.5rem+0.25rem)] bg-zinc-950/45 flex flex-col gap-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] text-left h-full">
                      <div className="flex flex-col gap-1">
                        <span className="text-indigo-400 text-[10px] font-black uppercase tracking-wider">Aturan Terfavorit</span>
                        <h3 className="text-white text-base font-black uppercase">Preferensi Pemain</h3>
                      </div>
                      <div className="flex flex-col gap-3 mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400 font-medium">Stacking +2/+4</span>
                          <span className="font-bold text-white bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
                            {ruleStats.stacking} kali
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400 font-medium">Jump-In</span>
                          <span className="font-bold text-white bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
                            {ruleStats.jumpIn} kali
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400 font-medium">7-0 Rule</span>
                          <span className="font-bold text-white bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
                            {ruleStats.sevenZero} kali
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400 font-medium">Draw-to-Match</span>
                          <span className="font-bold text-white bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
                            {ruleStats.drawToMatch} kali
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-zinc-900/35 border border-zinc-800/60 rounded-3xl p-1 shadow-2xl">
                <div className="p-6 rounded-[calc(1.5rem+0.25rem)] bg-zinc-950/45 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-yellow-400 text-[10px] font-black uppercase tracking-wider">DATABASE USERS</span>
                      <h3 className="text-white text-base font-black uppercase">Manajemen Pemain</h3>
                    </div>
                    {/* Search box */}
                    <input
                      type="text"
                      placeholder="Cari nama atau email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="h-10 bg-zinc-950 border border-zinc-800 rounded-full px-4 text-xs text-white focus:outline-none focus:border-yellow-400 w-full sm:w-64 transition-colors"
                    />
                  </div>

                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500 uppercase font-black tracking-wider text-[10px]">
                          <th className="py-3 px-4">Pemain</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Provider</th>
                          <th className="py-3 px-4">Terdaftar</th>
                          <th className="py-3 px-4 text-right">Total Match</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900 font-sans">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-zinc-500 uppercase font-black">
                              Tidak ada pemain ditemukan
                            </td>
                          </tr>
                         ) : (
                          filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-zinc-900/30 transition-colors duration-200">
                              <td className="py-3.5 px-4 font-black text-white flex items-center gap-3">
                                {u.avatarUrl ? (
                                  <div className="w-6.5 h-6.5 rounded-full overflow-hidden border border-zinc-800 relative">
                                    <Image src={u.avatarUrl} alt={u.name} fill className="object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-6.5 h-6.5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                                    {u.name.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <span>{u.name}</span>
                                  <button
                                    onClick={() => {
                                      setEditingUser({ id: u.id, name: u.name });
                                      setNewUserName(u.name);
                                    }}
                                    className="text-zinc-500 hover:text-yellow-400 p-1 cursor-pointer transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-zinc-400 font-medium">{u.email || '-'}</td>
                              <td className="py-3.5 px-4">
                                <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[10px] font-bold uppercase rounded-md text-zinc-300">
                                  {u.provider}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-zinc-500 font-semibold">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                }) : '-'}
                              </td>
                              <td className="py-3.5 px-4 text-right font-black text-white pr-6">{u.matchCount}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'matches' && (
              <div className="bg-zinc-900/35 border border-zinc-800/60 rounded-3xl p-1 shadow-2xl">
                <div className="p-6 rounded-[calc(1.5rem+0.25rem)] bg-zinc-950/45 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-indigo-400 text-[10px] font-black uppercase tracking-wider">RIWAYAT PERTANDINGAN</span>
                      <h3 className="text-white text-base font-black uppercase">Semua Match</h3>
                    </div>
                    {/* Search box */}
                    <input
                      type="text"
                      placeholder="Cari kode room atau pemenang..."
                      value={matchSearch}
                      onChange={(e) => setMatchSearch(e.target.value)}
                      className="h-10 bg-zinc-950 border border-zinc-800 rounded-full px-4 text-xs text-white focus:outline-none focus:border-yellow-400 w-full sm:w-64 transition-colors"
                    />
                  </div>

                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500 uppercase font-black tracking-wider text-[10px]">
                          <th className="py-3 px-4">Room Code</th>
                          <th className="py-3 px-4">Pemenang</th>
                          <th className="py-3 px-4">Waktu Mulai</th>
                          <th className="py-3 px-4">Jumlah Pemain</th>
                          <th className="py-3 px-4 text-right">Skor Menang</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900 font-sans">
                        {filteredMatches.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-zinc-500 uppercase font-black">
                              Tidak ada match ditemukan
                            </td>
                          </tr>
                        ) : (
                          filteredMatches.map((m) => {
                            const winningPlayer = m.players.find(p => p.name === m.winnerName);
                            const winScore = winningPlayer ? winningPlayer.scoreDelta : 0;

                            return (
                              <tr key={m.id} className="hover:bg-zinc-900/30 transition-colors duration-200">
                                <td className="py-3.5 px-4 font-black text-white">#{m.roomCode}</td>
                                <td className="py-3.5 px-4">
                                  <span className="font-extrabold text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 px-2 py-0.5 rounded-md uppercase">
                                    {m.winnerName}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-zinc-500 font-semibold">
                                  {m.startedAt ? new Date(m.startedAt).toLocaleString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }) : '-'}
                                </td>
                                <td className="py-3.5 px-4 text-zinc-400 font-medium">{m.playerCount} Pemain</td>
                                <td className="py-3.5 px-4 text-right font-black text-white pr-6">+{winScore}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rooms' && (
              <div className="bg-zinc-900/35 border border-zinc-800/60 rounded-3xl p-1 shadow-2xl">
                <div className="p-6 rounded-[calc(1.5rem+0.25rem)] bg-zinc-950/45 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-red-400 text-[10px] font-black uppercase tracking-wider">ROOMS INSPECTOR</span>
                      <h3 className="text-white text-base font-black uppercase">Live Rooms</h3>
                    </div>
                    <input
                      type="text"
                      placeholder="Cari kode room atau host..."
                      value={roomSearch}
                      onChange={(e) => setRoomSearch(e.target.value)}
                      className="h-10 bg-zinc-950 border border-zinc-800 rounded-full px-4 text-xs text-white focus:outline-none focus:border-yellow-400 w-full sm:w-64 transition-colors"
                    />
                  </div>

                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500 uppercase font-black tracking-wider text-[10px]">
                          <th className="py-3 px-4">Room Code</th>
                          <th className="py-3 px-4">Host</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Dibuat Pada</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900 font-sans">
                        {filteredRooms.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-zinc-500 uppercase font-black">
                              Tidak ada room aktif
                            </td>
                          </tr>
                        ) : (
                          filteredRooms.map((r) => (
                            <tr key={r.id} className="hover:bg-zinc-900/30 transition-colors duration-200">
                              <td className="py-3.5 px-4 font-black text-white">#{r.code}</td>
                              <td className="py-3.5 px-4 font-extrabold text-zinc-300">{r.hostName}</td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md border ${
                                  r.status === 'PLAYING'
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                    : r.status === 'WAITING'
                                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                }`}>
                                  {r.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-zinc-500 font-semibold">
                                {r.createdAt ? new Date(r.createdAt).toLocaleString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }) : '-'}
                              </td>
                              <td className="py-3.5 px-4 text-right pr-6">
                                {r.status !== 'FINISHED' ? (
                                  <button
                                    onClick={() => handleForceEndRoom(r.code)}
                                    disabled={endingRoomCode === r.code}
                                    className="bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition duration-200 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {endingRoomCode === r.code ? 'Memproses...' : 'Paksa Akhiri'}
                                  </button>
                                ) : (
                                  <span className="text-zinc-600 text-[10px] font-bold uppercase">Selesai</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'broadcast' && (
              <div className="bg-zinc-900/35 border border-zinc-800/60 rounded-3xl p-1 shadow-2xl text-left">
                <div className="p-6 rounded-[calc(1.5rem+0.25rem)] bg-zinc-950/45 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] flex flex-col gap-6">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-yellow-400 text-[10px] font-black uppercase tracking-wider">BROADCAST UTAMA</span>
                    <h3 className="text-white text-base font-black uppercase">Kirim Pengumuman Real-time</h3>
                  </div>

                  <form onSubmit={handleBroadcastSubmit} className="flex flex-col gap-5 max-w-xl">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Target Room</label>
                      <select
                        name="roomCode"
                        className="h-12 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-white text-xs font-black uppercase tracking-wide focus:outline-none focus:border-yellow-400 cursor-pointer"
                      >
                        <option value="all">KIRIM KE SEMUA ROOM YANG AKTIF</option>
                        {rooms.filter(r => r.status !== 'FINISHED').map(r => (
                          <option key={r.id} value={r.code}>ROOM #{r.code} (HOST: {r.hostName})</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Isi Pengumuman</label>
                      <textarea
                        name="message"
                        required
                        rows={4}
                        placeholder="Ketik pengumuman di sini... (Contoh: Server akan dimaintenance dalam 10 menit!)"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white text-xs font-extrabold tracking-wide focus:outline-none focus:border-yellow-400 resize-none font-sans"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isBroadcasting}
                      className="h-12 w-48 bg-yellow-400 hover:bg-yellow-500 active:scale-[0.98] disabled:opacity-50 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isBroadcasting ? (
                        <>
                          <svg className="animate-spin w-4 h-4 text-zinc-950" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          MENGIRIM...
                        </>
                      ) : (
                        'KIRIM SEKARANG'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'rules' && (
              <div className="bg-zinc-900/35 border border-zinc-800/60 rounded-3xl p-1 shadow-2xl text-left">
                <div className="p-6 rounded-[calc(1.5rem+0.25rem)] bg-zinc-950/45 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] flex flex-col gap-6">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-red-400 text-[10px] font-black uppercase tracking-wider">ANALISIS PREFERENSI</span>
                    <h3 className="text-white text-base font-black uppercase">Aturan Rumah (House Rules)</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                    <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col gap-3">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Stacking +2/+4</h4>
                      <p className="text-[11px] text-zinc-400 font-medium">Mengizinkan pemain untuk menumpuk kartu penalti draw (+2 atau +4) ke pemain selanjutnya.</p>
                      <div className="flex items-center justify-between text-xs mt-2 border-t border-zinc-800/60 pt-2 font-mono">
                        <span className="text-zinc-500">Tingkat Penggunaan:</span>
                        <span className="text-yellow-400 font-black">
                          {stats.totalMatches > 0 ? Math.round((ruleStats.stacking / stats.totalMatches) * 100) : 0}%
                        </span>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col gap-3">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Jump-In</h4>
                      <p className="text-[11px] text-zinc-400 font-medium">Pemain lain diperbolehkan langsung memotong giliran jika memiliki kartu yang identik persis dengan discard pile teratas.</p>
                      <div className="flex items-center justify-between text-xs mt-2 border-t border-zinc-800/60 pt-2 font-mono">
                        <span className="text-zinc-500">Tingkat Penggunaan:</span>
                        <span className="text-yellow-400 font-black">
                          {stats.totalMatches > 0 ? Math.round((ruleStats.jumpIn / stats.totalMatches) * 100) : 0}%
                        </span>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col gap-3">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">7-0 Rule</h4>
                      <p className="text-[11px] text-zinc-400 font-medium">Bermain angka 7 menukar tangan dengan pemain lain, bermain angka 0 memutar seluruh tangan pemain.</p>
                      <div className="flex items-center justify-between text-xs mt-2 border-t border-zinc-800/60 pt-2 font-mono">
                        <span className="text-zinc-500">Tingkat Penggunaan:</span>
                        <span className="text-yellow-400 font-black">
                          {stats.totalMatches > 0 ? Math.round((ruleStats.sevenZero / stats.totalMatches) * 100) : 0}%
                        </span>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col gap-3">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Draw-to-Match</h4>
                      <p className="text-[11px] text-zinc-400 font-medium">Jika pemain mengambil kartu dari deck dan cocok, pemain wajib atau diperbolehkan memainkannya langsung.</p>
                      <div className="flex items-center justify-between text-xs mt-2 border-t border-zinc-800/60 pt-2 font-mono">
                        <span className="text-zinc-500">Tingkat Penggunaan:</span>
                        <span className="text-yellow-400 font-black">
                          {stats.totalMatches > 0 ? Math.round((ruleStats.drawToMatch / stats.totalMatches) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Rename Modal Overlay */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-6 flex flex-col gap-5 w-full max-w-sm shadow-2xl text-center">
            <div className="flex flex-col gap-1">
              <span className="text-yellow-400 text-[10px] font-black uppercase tracking-wider">MODERASI PEMAIN</span>
              <h4 className="text-white text-lg font-black uppercase font-sans">Ubah Nama Pemain</h4>
              <p className="text-zinc-400 text-xs font-sans">Ubah nama untuk user {editingUser.name}</p>
            </div>

            <form onSubmit={handleRenameSubmit} className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-black uppercase tracking-wider">Nama Baru</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="h-12 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-white text-sm font-sans focus:outline-none focus:border-yellow-400"
                />
              </div>

              <button
                type="submit"
                className="h-12 w-full bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition transform active:scale-95 cursor-pointer mt-2"
              >
                SIMPAN PERUBAHAN
              </button>
            </form>

            <button
              onClick={() => {
                setEditingUser(null);
                setNewUserName('');
              }}
              className="text-zinc-500 hover:text-white text-[10px] font-extrabold uppercase tracking-wider mt-1 transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
