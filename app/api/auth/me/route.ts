export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, hashPassword, comparePassword, signToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { supabaseAdmin, SUPABASE_BUCKET, deleteSupabaseStorageFile } from '@/lib/supabase';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Tidak terautentikasi.' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Sesi tidak valid.' }, { status: 401 });
    }

    // Fetch full user profile from DB
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        role: true,
        name: true,
        fullName: true,
        email: true,
        prn: true,
        memberId: true,
        image: true,
        gender: true,
        originCity: true,
        originCityOther: true,
        domicileCity: true,
        domicileCityOther: true,
        angkatan: true,
        nim: true,
        faculty: true,
        majorProgram: true,
        phoneNumber: true,
        instagram: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({
      userId: user.id,
      role: user.role,
      name: user.name,
      fullName: user.fullName || user.name,
      email: user.email,
      memberId: user.memberId,
      prn: user.prn,
      image: user.image,
      gender: user.gender,
      originCity: user.originCity,
      originCityOther: user.originCityOther,
      domicileCity: user.domicileCity,
      domicileCityOther: user.domicileCityOther,
      angkatan: user.angkatan,
      nim: user.nim,
      faculty: user.faculty,
      majorProgram: user.majorProgram,
      phoneNumber: user.phoneNumber,
      instagram: user.instagram,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Tidak terautentikasi.' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Sesi tidak valid.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      fullName,
      email,
      gender,
      originCity,
      originCityOther,
      domicileCity,
      domicileCityOther,
      angkatan,
      nim,
      faculty,
      majorProgram,
      phoneNumber,
      instagram,
      image,
      currentPassword,
      newPassword
    } = body;

    // Build update data
    const updateData: Record<string, any> = {};

    if (typeof name === 'string' && name.trim()) {
      updateData.name = name.trim();
    }

    if (typeof fullName === 'string') {
      updateData.fullName = fullName.trim();
      if (!updateData.name && fullName.trim()) {
        updateData.name = fullName.trim();
      }
    }

    if (typeof gender === 'string') updateData.gender = gender;
    if (typeof originCity === 'string') updateData.originCity = originCity;
    if (typeof originCityOther === 'string') updateData.originCityOther = originCityOther;
    if (typeof domicileCity === 'string') updateData.domicileCity = domicileCity;
    if (typeof domicileCityOther === 'string') updateData.domicileCityOther = domicileCityOther;
    if (typeof angkatan === 'string') updateData.angkatan = angkatan;
    if (typeof nim === 'string') updateData.nim = nim;
    if (typeof faculty === 'string') updateData.faculty = faculty;
    if (typeof majorProgram === 'string') updateData.majorProgram = majorProgram;
    if (typeof phoneNumber === 'string') updateData.phoneNumber = phoneNumber;
    if (typeof instagram === 'string') updateData.instagram = instagram;

    if (email && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await prisma.user.findFirst({
        where: { email: normalizedEmail, NOT: { id: payload.userId } }
      });
      if (existing) {
        return NextResponse.json({ error: 'Email sudah digunakan oleh akun lain.' }, { status: 400 });
      }
      updateData.email = normalizedEmail;
    }

    // Handle base64 image upload to Supabase Storage
    if (image && typeof image === 'string' && image.startsWith('data:image/')) {
      try {
        const matches = image.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeSubtype = matches[1];
          const base64Data = matches[2];

          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const MAX_FILE_SIZE = 1024 * 1024; // 1 MB
          if (bytes.length > MAX_FILE_SIZE) {
            return NextResponse.json(
              { error: 'Ukuran file terlalu besar. Maksimal 1 MB' },
              { status: 400 }
            );
          }

          const ext = mimeSubtype === 'jpeg' ? 'jpg' : mimeSubtype;
          const contentType = `image/${mimeSubtype}`;
          const filePath = `avatars/avatar-${payload.userId}-${Date.now()}.${ext}`;

          const { error: uploadError } = await supabaseAdmin.storage
            .from(SUPABASE_BUCKET)
            .upload(filePath, bytes, {
              contentType,
              upsert: true,
            });

          if (uploadError) {
            console.error('[Supabase Storage] Avatar upload error:', uploadError);
            return NextResponse.json({ error: 'Gagal mengupload foto ke Supabase Storage' }, { status: 500 });
          }

          const { data: publicData } = supabaseAdmin.storage
            .from(SUPABASE_BUCKET)
            .getPublicUrl(filePath);

          if (publicData?.publicUrl) {
            updateData.image = publicData.publicUrl;

            // Clean up previous avatar from Supabase Storage
            const existingUser = await prisma.user.findUnique({
              where: { id: payload.userId },
              select: { image: true },
            });
            if (existingUser?.image && existingUser.image !== publicData.publicUrl) {
              await deleteSupabaseStorageFile(existingUser.image);
            }
          }
        }
      } catch (uploadErr) {
        console.error('Error processing avatar image:', uploadErr);
        return NextResponse.json({ error: 'Gagal memproses gambar foto profil.' }, { status: 500 });
      }
    } else if (image === '') {
      // Allow clearing avatar
      updateData.image = null;
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Password lama diperlukan untuk mengubah password.' }, { status: 400 });
      }
      const currentUser = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { password: true }
      });
      if (!currentUser) {
        return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 });
      }
      const isValid = await comparePassword(currentPassword, currentUser.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Password lama tidak sesuai.' }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Password baru minimal 6 karakter.' }, { status: 400 });
      }
      updateData.password = await hashPassword(newPassword);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang diubah.' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        fullName: true,
        email: true,
        role: true,
        memberId: true,
        prn: true,
        image: true,
        gender: true,
        originCity: true,
        originCityOther: true,
        domicileCity: true,
        domicileCityOther: true,
        angkatan: true,
        nim: true,
        faculty: true,
        majorProgram: true,
        phoneNumber: true,
        instagram: true,
      }
    });

    // Re-issue token after successful update to keep session fresh
    const newToken = await signToken({
      userId: updatedUser.id,
      role: updatedUser.role as any,
      name: updatedUser.name,
      memberId: updatedUser.memberId ?? undefined,
      prn: updatedUser.prn ?? undefined,
    });

    const response = NextResponse.json({ success: true, user: updatedUser });
    response.cookies.set('session', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('PATCH /api/auth/me error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat memperbarui profil.' }, { status: 500 });
  }
}
