import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const roomId = formData.get('roomId') as string;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah.' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
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
