export const runtime = 'edge';

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
    const activities = await prisma.activity.findMany({
      include: {
        attendees: true
      }
    });
    
    // Transform Prisma data to match our frontend Activity interface
    const formattedActivities = activities.map(a => ({
      id: a.id,
      name: a.name,
      date: a.date,
      time: a.time,
      description: a.description,
      scope: a.scope as 'EKSTERNAL' | 'INTERNAL' | 'KEPANITIAAN',
      attendees: a.attendees.map(att => ({
        memberId: att.memberId,
        status: att.status as any
      }))
    }));

    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error("GET Activities error:", error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden: Hanya Admin yang dapat membuat kegiatan' }, { status: 403 });
  }

  try {
    const data = await request.json();
    
    if (!data.name || !data.date || !data.scope) {
      return NextResponse.json({ error: 'Nama, tanggal, dan lingkup kegiatan wajib diisi' }, { status: 400 });
    }

    const newActivity = await prisma.activity.create({
      data: {
        name: data.name,
        date: data.date,
        time: data.time || "00:00",
        description: data.description || '',
        scope: data.scope,
      }
    });

    return NextResponse.json({ id: newActivity.id }, { status: 201 });
  } catch (error) {
    console.error("POST Activity error:", error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
