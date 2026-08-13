import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default async function AdminPage() {
  const session = await auth();

  // Guard: Only ADMIN role is allowed to access
  if (!session?.user || session.user.role !== 'ADMIN') {
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

  const rooms = await prisma.room.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      host: true,
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

  const serializedRooms = rooms.map((r) => ({
    id: r.id,
    code: r.code,
    hostName: r.host.name,
    status: r.status,
    createdAt: serializeDate(r.createdAt),
  }));

  const broadcastAction = async (formData: FormData) => {
    'use server';
    const message = formData.get('message') as string;
    const roomCode = formData.get('roomCode') as string;
    
    if (!message) return;

    const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'tumpuk-party-bayy.bayy-kim.partykit.dev';
    const partyUrl = host.startsWith('localhost') ? `http://${host}` : `https://${host}`;
    const adminSecret = process.env.ADMIN_BROADCAST_SECRET || '';

    if (roomCode && roomCode !== 'all') {
      try {
        await fetch(`${partyUrl}/parties/tumpuk-party-bayy/${roomCode}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-secret': adminSecret,
          },
          body: JSON.stringify({ type: 'broadcast', message }),
        });
      } catch (err) {
        console.error(`Failed to send broadcast to room ${roomCode}:`, err);
      }
    } else {
      const activeRooms = await prisma.room.findMany({
        where: {
          status: { in: ['WAITING', 'PLAYING'] },
        },
      });

      await Promise.all(
        activeRooms.map(async (r) => {
          try {
            await fetch(`${partyUrl}/parties/tumpuk-party-bayy/${r.code}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-admin-secret': adminSecret,
              },
              body: JSON.stringify({ type: 'broadcast', message }),
            });
          } catch (err) {
            console.error(`Failed to send broadcast to room ${r.code}:`, err);
          }
        })
      );
    }
  };

  const renameUserAction = async (userId: string, newName: string) => {
    'use server';
    if (!userId || !newName) return;
    await prisma.user.update({
      where: { id: userId },
      data: { name: newName },
    });
  };

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
      rooms={serializedRooms}
      broadcastAction={broadcastAction}
      renameUserAction={renameUserAction}
    />
  );
}
