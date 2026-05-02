import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await (params as any);
    const data = await request.json();
    const { status, pointsAwarded, rejectionReason } = data;

    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const claim = await prisma.pointClaim.findUnique({
      where: { id },
      include: { member: true }
    }) as any;

    if (!claim) {
      return NextResponse.json({ error: 'Klaim tidak ditemukan' }, { status: 404 });
    }

    // Role-Based Security: Standard Admins can only process claims for their assigned departments
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
        pointsAwarded: status === 'APPROVED' ? pointsAwarded : null,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        verifiedById: session.userId,
        verifiedAt: new Date()
      } as any
    });

    // If approved, create point log
    if (status === 'APPROVED') {
      await prisma.pointLog.create({
        data: {
          memberId: claim.memberId,
          type: 'REWARD',
          category: 'Klaim Prestasi',
          points: pointsAwarded,
          description: `Klaim: ${claim.activityName}`
        }
      });

      // Find the user associated with this member to send notification
      const targetUser = await prisma.user.findFirst({ where: { memberId: claim.memberId } });
      
      if (targetUser) {
        await prisma.notification.create({
          data: {
            userId: targetUser.id,
            memberId: claim.memberId,
            title: 'Klaim Disetujui',
            message: `Klaim kegiatan "${claim.activityName}" telah disetujui. +${pointsAwarded} poin.`,
            link: '/?tab=pelaporan'
          }
        });
      }
    } else if (status === 'REJECTED') {
      const targetUser = await prisma.user.findFirst({ where: { memberId: claim.memberId } });
      
      if (targetUser) {
        await prisma.notification.create({
          data: {
            userId: targetUser.id,
            memberId: claim.memberId,
            title: 'Klaim Ditolak',
            message: `Klaim kegiatan "${claim.activityName}" ditolak: ${rejectionReason}`,
            link: '/?tab=pelaporan'
          }
        });
      }
    }

    return NextResponse.json(updatedClaim);
  } catch (error) {
    console.error('Error updating claim:', error);
    return NextResponse.json({ error: 'Failed to update claim' }, { status: 500 });
  }
}
