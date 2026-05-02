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

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    await prisma.member.update({
      where: { id: memberId },
      data: {
        treatmentActive: false,
        treatmentLevel: null,
        treatmentPhase: null,
        treatmentStartDate: null,
        treatmentStartPoints: null,
        treatmentTargetPoints: null,
        treatmentDurationDays: null,
        status: 'active' // Ensure they are active
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel SP error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
