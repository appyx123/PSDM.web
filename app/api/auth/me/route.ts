import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, hashPassword, comparePassword, signToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
        email: true,
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
      email: user.email,
      memberId: user.memberId,
      prn: user.prn,
      image: user.image,
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

    const { name, email, currentPassword, newPassword } = await request.json();

    // Build update data
    const updateData: any = {};

    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    if (email && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      // Check if email already used by another user
      const existing = await prisma.user.findFirst({
        where: { email: normalizedEmail, NOT: { id: payload.userId } }
      });
      if (existing) {
        return NextResponse.json({ error: 'Email sudah digunakan oleh akun lain.' }, { status: 400 });
      }
      updateData.email = normalizedEmail;
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Password lama diperlukan untuk mengubah password.' }, { status: 400 });
      }
      // Verify current password
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
      select: { id: true, name: true, email: true, role: true, memberId: true, prn: true, image: true }
    });

    // Always re-issue token after any successful update to keep session fresh
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
