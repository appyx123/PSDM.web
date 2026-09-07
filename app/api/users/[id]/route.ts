export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, hashPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { id } = await params;
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });
    }

    // 1. Proteksi Mutlak Super Admin: Akun Super Admin tidak boleh dihapus
    if (targetUser.role === 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'Akses ditolak: Akun Super Admin dilindungi dan tidak dapat dihapus.' 
      }, { status: 403 });
    }

    // 2. Cegah hapus diri sendiri
    if (targetUser.id === session.userId) {
      return NextResponse.json({ 
        error: 'Anda tidak dapat menghapus akun Anda sendiri.' 
      }, { status: 400 });
    }

    // 3. Admin biasa hanya boleh menghapus akun PENGURUS
    if (session.role === 'ADMIN' && targetUser.role !== 'PENGURUS') {
      return NextResponse.json({ 
        error: 'Akses ditolak: Admin hanya dapat menghapus akun Pengurus.' 
      }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE User error:', error);
    return NextResponse.json({ error: 'Gagal menghapus akun.' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { id } = await params;
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });
    }

    // 1. Proteksi Mutlak Super Admin:
    // Jika target akun adalah SUPER_ADMIN, HANYA pemilik akun Super Admin itu sendiri yang boleh mengubah kata sandinya!
    if (targetUser.role === 'SUPER_ADMIN' && session.userId !== targetUser.id) {
      return NextResponse.json({ 
        error: 'Akses ditolak: Akun Super Admin dilindungi. Hanya pemilik akun Super Admin yang dapat mengubah kata sandinya.' 
      }, { status: 403 });
    }

    // 2. Admin biasa hanya boleh mereset kata sandi akun PENGURUS
    if (session.role === 'ADMIN' && targetUser.role !== 'PENGURUS') {
      return NextResponse.json({ 
        error: 'Akses ditolak: Admin hanya berhak mereset kata sandi Pengurus.' 
      }, { status: 403 });
    }

    const { password } = await request.json();
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter.' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    await prisma.user.update({ where: { id }, data: { password: hashedPassword } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT User error:', error);
    return NextResponse.json({ error: 'Gagal mereset password.' }, { status: 500 });
  }
}
