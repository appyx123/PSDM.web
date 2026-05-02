import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    const { id } = await context.params;
    const data = await request.json();
    const { status, rejectionReason } = data; // status: APPROVED or REJECTED

    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminId = session.userId;

    const claim = await prisma.pointClaim.findUnique({
      where: { id },
      include: { member: true }
    });

    if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    if (claim.status !== 'PENDING') return NextResponse.json({ error: 'Claim already verified' }, { status: 400 });

    const updatedClaim = await prisma.pointClaim.update({
      where: { id },
      data: {
        status,
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
            message = `Klaim Anda untuk "${claim.subCategory}" telah disetujui. (+${claim.claimedPoints} Poin)`;
        } else {
            message = `Klaim Anda untuk "${claim.subCategory}" ditolak. Alasan: ${rejectionReason}`;
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
          category: claim.subCategory,
          points: claim.claimedPoints,
          description: `Dari Klaim Prestasi: ${claim.description}`
        }
      });
    }

    return NextResponse.json(updatedClaim);
  } catch (error) {
    console.error('Error verifying claim:', error);
    return NextResponse.json({ error: 'Failed to verify claim' }, { status: 500 });
  }
}
