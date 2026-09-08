export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN')) return null;
  return payload;
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden: Hanya Admin yang dapat menghapus kegiatan' }, { status: 403 });
  }

  try {
    const resolvedParams = await params;
    await prisma.activity.delete({
      where: { id: resolvedParams.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Activity error:", error);
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden: Hanya Admin yang dapat mengedit kegiatan' }, { status: 403 });
  }

  try {
    const resolvedParams = await params;
    const body = await request.json();
    
    const updated = await prisma.activity.update({
      where: { id: resolvedParams.id },
      data: {
        name: body.name,
        date: body.date,
        time: body.time || "00:00",
        description: body.description,
        scope: body.scope,
      }
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT Activity error:", error);
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
  }
}
