export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin, SUPABASE_BUCKET } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const MAX_FILE_SIZE = 1024 * 1024; // 1 MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Maksimal 1 MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const uniqueId = Math.random().toString(36).substring(2, 12);
    const sanitizedName = file.name.replace(/\s+/g, '-');
    const filePath = `evidences/${Date.now()}-${uniqueId}-${sanitizedName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .upload(filePath, bytes, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ error: 'Gagal mengupload file ke Supabase' }, { status: 500 });
    }

    const { data: publicData } = supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(filePath);

    const publicUrl = publicData.publicUrl;

    return NextResponse.json({ url: publicUrl, fileName: filePath });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
