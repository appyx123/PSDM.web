export const runtime = 'edge';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signToken, comparePassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const loginId = (body.prn || body.identifier || '').trim();
    const password = body.password;

    if (!loginId || !password) {
      return NextResponse.json({ error: 'PRN / ID Anggota dan password wajib diisi.' }, { status: 400 });
    }

    const cleanPrn = loginId.toUpperCase();

    // Universal authentication based on PRN / ID for all roles (SUPER_ADMIN, ADMIN, PENGURUS)
    const user = await prisma.user.findUnique({
      where: { prn: cleanPrn }
    });

    if (!user) {
      return NextResponse.json({ error: 'PRN / ID Anggota atau password salah.' }, { status: 401 });
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'PRN / ID Anggota atau password salah.' }, { status: 401 });
    }

    // Check Member status for PENGURUS if memberId exists
    if (user.role === 'PENGURUS' && user.memberId) {
      const member = await prisma.member.findUnique({
        where: { id: user.memberId }
      });
      if (member && member.status !== 'AKTIF') {
        return NextResponse.json({ error: 'Akun tidak aktif. Silakan hubungi admin.' }, { status: 403 });
      }
    }

    const token = await signToken({
      userId: user.id,
      role: user.role as 'SUPER_ADMIN' | 'ADMIN' | 'PENGURUS',
      name: user.name,
      memberId: user.memberId || undefined,
      prn: user.prn,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        prn: user.prn,
      }
    });

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
