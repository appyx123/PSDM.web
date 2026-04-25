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

    // Auto-seed admin if no users exist
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const hashedPw = await hashPassword('admin123');
      await prisma.user.create({
        data: {
          role: 'ADMIN',
          email: 'admin@psdm.id',
          name: 'Administrator',
          password: hashedPw,
        }
      });
    }

    return NextResponse.json({
      userId: payload.userId,
      role: payload.role,
      name: payload.name,
      memberId: payload.memberId,
      prn: payload.prn,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan.' }, { status: 500 });
  }
}
