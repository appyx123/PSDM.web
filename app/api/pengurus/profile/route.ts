import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

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
      image, // This could be base64 or a path
    } = body;

    if (!fullName || !gender || !originCity || !domicileCity || !angkatan || !nim || !faculty || !majorProgram || !phoneNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let imagePath = image;

    // Handle base64 image upload
    if (image && image.startsWith('data:image/')) {
      try {
        const matches = image.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const type = matches[1]; // e.g., png, jpeg, webp
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          
          const fileName = `avatar-${session.userId}-${Date.now()}.${type === 'jpeg' ? 'jpg' : type}`;
          const absolutePath = path.join(process.cwd(), 'public', 'uploads', fileName);

          // Save file to public/uploads
          await fs.writeFile(absolutePath, buffer);
          
          // Only store the filename in DB
          imagePath = fileName;

          // Cleanup old image if exists
          const oldUser = await prisma.user.findUnique({ where: { id: session.userId }, select: { image: true } });
          if (oldUser?.image) {
            try {
              // Extract filename if it was stored with /uploads/ prefix
              const oldFileName = oldUser.image.replace('/uploads/', '');
              const oldAbsolutePath = path.join(process.cwd(), 'public', 'uploads', oldFileName);
              await fs.unlink(oldAbsolutePath);
            } catch (err) {
              console.warn('Could not delete old image:', err);
            }
          }
        }
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        // Fallback to existing path or null if upload fails
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
