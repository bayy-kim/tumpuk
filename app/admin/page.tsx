import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default async function AdminPage() {
  const session = await auth();

  // Guard: Only muhamadaibayu@gmail.com is allowed to access
  if (!session?.user || session.user.email !== 'muhamadaibayu@gmail.com') {
    redirect('/');
  }

  // Fetch stats and lists for the dashboard
  const totalUsers = await prisma.user.count();
  const totalMatches = await prisma.match.count();
  const totalRooms = await prisma.room.count();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      matches: true,
    },
  });

  const recentMatches = await prisma.match.findMany({
    orderBy: { startedAt: 'desc' },
    include: {
      room: true,
      winner: true,
      players: {
        include: {
          user: true,
        },
      },
    },
  });

  const serializeDate = (date: Date | null) => (date ? date.toISOString() : null);

  const serializedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl,
    provider: u.provider,
    createdAt: serializeDate(u.createdAt),
    matchCount: u.matches.length,
  }));

  const serializedMatches = recentMatches.map((m) => ({
    id: m.id,
    roomCode: m.room.code,
    winnerName: m.winner?.name || 'Tidak Ada (Draw)',
    winnerEmail: m.winner?.email || null,
    startedAt: serializeDate(m.startedAt),
    endedAt: serializeDate(m.endedAt),
    playerCount: m.players.length,
    players: m.players.map((p) => ({
      name: p.user?.name || p.guestName || 'Pemain',
      scoreDelta: p.scoreDelta,
    })),
    houseRules: m.room.houseRules as any,
  }));

  return (
    <AdminDashboard
      adminName={session.user.name || 'Admin'}
      adminImage={session.user.image || null}
      stats={{
        totalUsers,
        totalMatches,
        totalRooms,
      }}
      users={serializedUsers}
      matches={serializedMatches}
    />
  );
}
