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
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }
    const { id } = await params;
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
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }
    const { id } = await params;
    const { password } = await request.json();
    if (!password) {
      return NextResponse.json({ error: 'Password baru wajib diisi.' }, { status: 400 });
    }
    const hashedPassword = await hashPassword(password);
    await prisma.user.update({ where: { id }, data: { password: hashedPassword } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT User error:', error);
    return NextResponse.json({ error: 'Gagal mereset password.' }, { status: 500 });
  }
}
