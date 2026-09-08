export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin, SUPABASE_BUCKET, deleteSupabaseStorageFile } from '@/lib/supabase';

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      fullName: user.fullName,
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
      image: user.image, 
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('GET /api/pengurus/profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      fullName,
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
      image, // base64 data-url or existing public URL
    } = body;

    if (!fullName || !gender || !originCity || !domicileCity || !angkatan || !nim || !faculty || !majorProgram || !phoneNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let imagePath = image;

    // Handle base64 image upload to Supabase Storage
    if (image && image.startsWith('data:image/')) {
      try {
        const matches = image.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeSubtype = matches[1];
          const base64Data = matches[2];
          
          // Decode base64 to binary buffer/Uint8Array for Edge compatibility
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Validasi ukuran maksimal 1 MB
          const MAX_FILE_SIZE = 1024 * 1024; // 1 MB
          if (bytes.length > MAX_FILE_SIZE) {
            return NextResponse.json(
              { error: 'Ukuran file terlalu besar. Maksimal 1 MB' },
              { status: 400 }
            );
          }

          const ext = mimeSubtype === 'jpeg' ? 'jpg' : mimeSubtype;
          const contentType = `image/${mimeSubtype}`;
          const filePath = `avatars/avatar-${session.userId}-${Date.now()}.${ext}`;

          const { error: uploadError } = await supabaseAdmin.storage
            .from(SUPABASE_BUCKET)
            .upload(filePath, bytes, {
              contentType,
              upsert: true,
            });

          if (uploadError) {
            console.error('Supabase profile avatar upload error:', uploadError);
          } else {
            const { data: publicData } = supabaseAdmin.storage
              .from(SUPABASE_BUCKET)
              .getPublicUrl(filePath);

            if (publicData?.publicUrl) {
              imagePath = publicData.publicUrl;

              // Clean up previous avatar from Supabase Storage to prevent orphan files
              const existingUser = await prisma.user.findUnique({
                where: { id: session.userId },
                select: { image: true },
              });
              if (existingUser?.image && existingUser.image !== imagePath) {
                await deleteSupabaseStorageFile(existingUser.image);
              }
            }
          }
        }
      } catch (uploadError) {
        console.error('File upload conversion error:', uploadError);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: fullName,
        fullName,
        gender,
        originCity: originCity === 'Lainnya' ? originCityOther : originCity,
        originCityOther: originCity === 'Lainnya' ? originCityOther : null,
        domicileCity: domicileCity === 'Lainnya' ? domicileCityOther : domicileCity,
        domicileCityOther: domicileCity === 'Lainnya' ? domicileCityOther : null,
        angkatan,
        nim,
        faculty,
        majorProgram,
        phoneNumber,
        instagram,
        image: imagePath,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        fullName: updatedUser.fullName,
        gender: updatedUser.gender,
        originCity: updatedUser.originCity,
        originCityOther: updatedUser.originCityOther,
        domicileCity: updatedUser.domicileCity,
        domicileCityOther: updatedUser.domicileCityOther,
        angkatan: updatedUser.angkatan,
        nim: updatedUser.nim,
        faculty: updatedUser.faculty,
        majorProgram: updatedUser.majorProgram,
        phoneNumber: updatedUser.phoneNumber,
        instagram: updatedUser.instagram,
        image: updatedUser.image,
      },
    });
  } catch (error) {
    console.error('POST /api/pengurus/profile error:', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}
