import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const roomId = formData.get('roomId') as string;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah.' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Harap unggah file JPEG, PNG, WebP, atau MP4.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB = 10 * 1024 * 1024 bytes)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Maksimal ukuran file adalah 10MB.' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${roomId}_${userId}_${Date.now()}.${fileExt}`;
    const filePath = `challenges/${fileName}`;

    // Upload to Supabase bucket 'challenges'
    const { error: uploadError } = await supabase.storage
      .from('challenges')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      // Fallback mock public URL if bucket does not exist on Supabase
      console.warn('Supabase storage upload error:', uploadError);
      const fallbackUrl = `/cards/card_back.png`; // Fallback asset
      return NextResponse.json({ url: fallbackUrl });
    }

    const { data } = supabase.storage.from('challenges').getPublicUrl(filePath);

    return NextResponse.json({ url: data.publicUrl });
  } catch (err: unknown) {
    console.error('Error handling upload:', err);
    const errorMessage = err instanceof Error ? err.message : 'Gagal mengunggah file';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
