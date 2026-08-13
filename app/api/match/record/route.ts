import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { roomId, winnerId, scores, houseRules } = await request.json();

    if (!roomId) {
      return NextResponse.json({ error: 'roomId wajib diisi' }, { status: 400 });
    }

    // 1. Create or upsert room record
    const room = await prisma.room.upsert({
      where: { code: roomId },
      update: { status: 'FINISHED' },
      create: {
        code: roomId,
        hostUserId: winnerId || 'system',
        status: 'FINISHED',
        houseRules: houseRules || {},
      },
    });

    // 2. Create Match
    const match = await prisma.match.create({
      data: {
        roomId: room.id,
        winnerId: winnerId || null,
      },
    });

    // 3. Create Match Players records
    if (scores && Array.isArray(scores)) {
      await prisma.matchPlayer.createMany({
        data: scores.map((scoreItem: { playerId: string; score: number }, index: number) => ({
          matchId: match.id,
          userId: scoreItem.playerId !== 'system' ? scoreItem.playerId : null,
          guestName: null,
          finalHandSize: scoreItem.score > 0 ? 0 : 7, // Placeholder logic
          scoreDelta: scoreItem.score,
          seatIndex: index,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Error recording match:', err);
    const msg = err instanceof Error ? err.message : 'Gagal mencatat data pertandingan';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
