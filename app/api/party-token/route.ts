import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secretKey = process.env.AUTH_SECRET;
    if (!secretKey) {
      console.error('AUTH_SECRET is not configured in environment variables');
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const secret = new TextEncoder().encode(secretKey);

    const token = await new SignJWT({ 
      userId: session.user.id, 
      userName: session.user.name || 'Pemain' 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('60s')
      .sign(secret);

    return NextResponse.json({ token });
  } catch (err: unknown) {
    console.error('Error generating party token:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
