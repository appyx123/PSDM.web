import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { category, subCategory, description, evidence, claimedPoints } = data;

    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session || !session.memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const memberId = session.memberId;

    if (!evidence) {
      return NextResponse.json({ error: 'Bukti wajib dilampirkan' }, { status: 400 });
    }

    const claim = await prisma.pointClaim.create({
      data: {
        memberId,
        category,
        subCategory,
        description,
        evidence,
        claimedPoints,
        status: 'PENDING'
      }
    });

    // Create notification for admin
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    if (admins.length > 0) {
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: 'Pengajuan Klaim Baru',
            message: `${session.name} mengajukan klaim prestasi: ${subCategory}`,
            link: '/?tab=evaluasi'
          }
        });
      }
    }

    return NextResponse.json(claim);
  } catch (error) {
    console.error('Error creating claim:', error);
    return NextResponse.json({ error: 'Failed to create claim' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'PENGURUS')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const statusParam = url.searchParams.get('status');

    const where: any = {};
    if (statusParam) {
      where.status = statusParam;
    }

    // If Pengurus, only get their own
    if (session.role === 'PENGURUS') {
      where.memberId = session.memberId;
    }

    const claims = await prisma.pointClaim.findMany({
      where,
      include: {
        member: true,
        verifiedBy: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    return NextResponse.json({ error: 'Failed to fetch claims' }, { status: 500 });
  }
}
