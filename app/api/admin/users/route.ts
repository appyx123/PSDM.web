import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, hashPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function getSuperAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'SUPER_ADMIN') return null;
  return payload;
}

export async function GET() {
  const session = await getSuperAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized: Super Admin only' }, { status: 401 });

  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(admins);
}

export async function POST(request: Request) {
  const session = await getSuperAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, email, password, role } = await request.json();
    
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const newAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'ADMIN'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'CREATE_ADMIN',
        details: `Created new ${newAdmin.role}: ${newAdmin.name} (${newAdmin.email})`
      }
    });

    return NextResponse.json({ success: true, id: newAdmin.id });
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json({ error: 'Gagal membuat akun admin' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSuperAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });

    if (id === session.userId) {
      return NextResponse.json({ error: 'Anda tidak bisa menghapus akun sendiri' }, { status: 400 });
    }

    const adminToDelete = await prisma.user.findUnique({ where: { id } });
    if (!adminToDelete) return NextResponse.json({ error: 'Admin tidak ditemukan' }, { status: 404 });

    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'DELETE_ADMIN',
        details: `Deleted ${adminToDelete.role}: ${adminToDelete.name} (${adminToDelete.email})`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete admin error:', error);
    return NextResponse.json({ error: 'Gagal menghapus akun admin' }, { status: 500 });
  }
}
