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

export async function GET() {
  try {
    const pointLogs = await prisma.pointLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        member: {
          select: { name: true, prn: true }
        }
      }
    });
    return NextResponse.json(pointLogs);
  } catch (error) {
    console.error("GET PointLogs error:", error);
    return NextResponse.json({ error: 'Failed to fetch point logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden: Hanya Admin yang berwenang menambah poin' }, { status: 403 });
  }

  try {
    const data = await request.json();
    
    if (!data.memberId || !data.type || data.points === undefined) {
      return NextResponse.json({ error: 'Member, jenis, dan poin wajib diisi' }, { status: 400 });
    }

    const newPointLog = await prisma.pointLog.create({
      data: {
        memberId: data.memberId,
        type: data.type,
        category: data.category || 'Manual',
        points: parseInt(data.points),
        description: data.description || '',
      }
    });

    return NextResponse.json(newPointLog, { status: 201 });
  } catch (error) {
    console.error("POST PointLog error:", error);
    return NextResponse.json({ error: 'Failed to create point log' }, { status: 500 });
  }
}
