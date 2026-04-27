import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, comparePassword, hashPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Password lama dan baru wajib diisi.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password baru minimal 6 karakter.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 });
    }

    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Password lama tidak sesuai.' },
        { status: 400 }
      );
    }

    const hashedNewPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: session.userId },
      data: { password: hashedNewPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/pengurus/change-password error:', error);
    return NextResponse.json(
      { error: 'Gagal mengubah password.' },
      { status: 500 }
    );
  }
}
