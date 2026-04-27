import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

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

    // Fetch latest user data from DB to get image
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        role: true,
        name: true,
        prn: true,
        memberId: true,
        image: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({
      userId: user.id,
      role: user.role,
      name: user.name,
      memberId: user.memberId,
      prn: user.prn,
      image: user.image,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan.' }, { status: 500 });
  }
}
