import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signToken, comparePassword, hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, prn, password } = await request.json();

    let user;

    if (email) {
      // Admin login flow
      user = await prisma.user.findFirst({
        where: { email: email.toLowerCase(), role: 'ADMIN' }
      });
      if (!user) {
        return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
      }
    } else if (prn) {
      // Pengurus login flow
      user = await prisma.user.findFirst({
        where: { prn: prn.toUpperCase(), role: 'PENGURUS' }
      });
      if (!user) {
        return NextResponse.json({ error: 'PRN atau password salah.' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: 'Email atau PRN harus diisi.' }, { status: 400 });
    }

    // Auto-create admin if no users exist yet (first-time setup)
    // This is handled separately in the seed check below

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: email ? 'Email atau password salah.' : 'PRN atau password salah.' }, { status: 401 });
    }

    const token = await signToken({
      userId: user.id,
      role: user.role as 'ADMIN' | 'PENGURUS',
      name: user.name,
      memberId: user.memberId || undefined,
      prn: user.prn || undefined,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, role: user.role }
    });

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
