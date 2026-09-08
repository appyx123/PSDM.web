export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const data = await request.json();
    const { status, points, rejectionReason } = data; // status: APPROVED or REJECTED

    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminId = session.userId;

    const claim = await prisma.pointClaim.findUnique({
      where: { id },
      include: { member: true }
    });

    if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    if (claim.status !== 'PENDING') return NextResponse.json({ error: 'Claim already verified' }, { status: 400 });

    // Role-Based Security: Standard Admins can only verify claims for their assigned departments
    if (session.role === 'ADMIN') {
      const setting = await prisma.systemSetting.findUnique({ where: { key: 'PJ_MAPPING' } });
      if (setting && setting.value) {
        const mapping = JSON.parse(setting.value);
        if (mapping[claim.member.department] !== session.userId) {
          return NextResponse.json({ 
            error: `Forbidden: Anda tidak memiliki otoritas untuk memverifikasi klaim dari departemen ${claim.member.department}.` 
          }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Forbidden: Konfigurasi PJ Mapping tidak ditemukan.' }, { status: 403 });
      }
    }

    const updatedClaim = await prisma.pointClaim.update({
      where: { id },
      data: {
        status,
        pointsAwarded: status === 'APPROVED' ? Number(points) : null,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        verifiedById: adminId,
        verifiedAt: new Date()
      }
    });

    // Notify user
    const userToNotify = await prisma.user.findFirst({
        where: { memberId: claim.memberId, role: 'PENGURUS' }
    });

    if (userToNotify) {
        let message = '';
        if (status === 'APPROVED') {
            message = `Klaim Anda untuk "${claim.activityName}" telah disetujui. (+${points} Poin)`;
        } else {
            message = `Klaim Anda untuk "${claim.activityName}" ditolak. Alasan: ${rejectionReason}`;
        }

        await prisma.notification.create({
            data: {
                userId: userToNotify.id,
                memberId: claim.memberId,
                title: status === 'APPROVED' ? 'Klaim Disetujui' : 'Klaim Ditolak',
                message,
                link: '/?tab=pelaporan'
            }
        });
    }

    // If approved, create point mutation log
    if (status === 'APPROVED') {
      await prisma.pointLog.create({
        data: {
          memberId: claim.memberId,
          type: 'REWARD',
          category: 'Klaim Prestasi',
          points: Number(points),
          description: claim.activityName
        }
      });
    }

    return NextResponse.json(updatedClaim);
  } catch (error) {
    console.error('Error verifying claim:', error);
    return NextResponse.json({ error: 'Failed to verify claim' }, { status: 500 });
  }
}
