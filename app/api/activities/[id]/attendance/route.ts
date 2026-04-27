import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const data = await request.json();
    const resolvedParams = await params;
    const activityId = resolvedParams.id;
    const { memberId, status, isEmergency, emergencyReason } = data;

    // Security check: Only ADMIN or PJ (assuming PJ is also handled)
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'PENGURUS')) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (status === null) {
      await prisma.attendanceRecord.deleteMany({
        where: { activityId, memberId }
      });
    } else {
      // 1. Quota Validation for "Izin"
      if (status === 'IZIN_SAKIT' && !isEmergency) {
        const izinCount = await prisma.attendanceRecord.count({
          where: {
            activityId,
            status: 'IZIN_SAKIT',
            memberId: { not: memberId } // Don't count self if updating
          }
        });

        if (izinCount >= 7) {
          return NextResponse.json({ 
            error: 'QUOTA_EXCEEDED', 
            message: 'Kuota izin untuk agenda ini sudah mencapai batas maksimal (7). Gunakan status Izin Darurat jika diperlukan.' 
          }, { status: 400 });
        }
      }

      // 2. Upsert record
      await prisma.attendanceRecord.upsert({
        where: {
          memberId_activityId: { memberId, activityId }
        },
        update: {
          status,
          isEmergencyIzin: !!isEmergency,
          emergencyReason: isEmergency ? emergencyReason : null
        },
        create: {
          memberId,
          activityId,
          status,
          isEmergencyIzin: !!isEmergency,
          emergencyReason: isEmergency ? emergencyReason : null
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT Attendance error:", error);
    return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 });
  }
}
