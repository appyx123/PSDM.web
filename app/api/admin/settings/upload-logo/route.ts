export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin, SUPABASE_BUCKET, deleteSupabaseStorageFile } from '@/lib/supabase';

async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN')) return null;
  return payload;
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
    const sanitizedName = file.name.replace(/\s+/g, '-');
    const filePath = `logos/logo-${Date.now()}-${sanitizedName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .upload(filePath, bytes, {
        contentType: file.type || 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase logo upload error:', uploadError);
      return NextResponse.json({ error: 'Gagal mengupload logo ke Supabase' }, { status: 500 });
    }

    const { data: publicData } = supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(filePath);

    // Clean up old logo file from Supabase Storage
    try {
      const existingLogo = await prisma.systemSetting.findUnique({
        where: { key: 'APP_LOGO' },
      });
      if (existingLogo?.value && existingLogo.value !== publicData.publicUrl) {
        await deleteSupabaseStorageFile(existingLogo.value);
      }
    } catch (cleanErr) {
      console.warn('Failed to cleanup old logo:', cleanErr);
    }

    return NextResponse.json({ url: publicData.publicUrl });
  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 });
  }
}
