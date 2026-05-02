import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const data = await request.json();
    const resolvedParams = await params;
    const permissionId = resolvedParams.id;
    const { status, cancellationReason } = data; // status is 'approved' or 'rejected'

    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: { activity: true, member: { include: { user: true } } }
    });

    if (!permission) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Update permission status
    const updated = await prisma.permission.update({
      where: { id: permissionId },
      data: {
        status,
        verifiedById: session.userId,
        verifiedAt: new Date(),
        cancellationReason: status === 'rejected' ? cancellationReason : null
      }
    });

    // If approved, upsert AttendanceRecord to IZIN_SAKIT
    if (status === 'approved') {
      await prisma.attendanceRecord.upsert({
        where: {
          memberId_activityId: { memberId: permission.memberId, activityId: permission.activityId }
        },
        update: {
          status: 'IZIN_SAKIT',
          isEmergencyIzin: ['emergency', 'emergency_pending', 'emergency_quota_full'].includes(permission.type) || permission.status.includes('emergency'),
          emergencyReason: permission.reason
        },
        create: {
          memberId: permission.memberId,
          activityId: permission.activityId,
          status: 'IZIN_SAKIT',
          isEmergencyIzin: ['emergency', 'emergency_pending', 'emergency_quota_full'].includes(permission.type) || permission.status.includes('emergency'),
          emergencyReason: permission.reason
        }
      });

      // EWS Check: 3 consecutive leaves
      // Get all activities sorted by date asc up to this activity
      const allActivities = await prisma.activity.findMany({
        orderBy: { date: 'asc' }
      });
      
      const currentIndex = allActivities.findIndex(a => a.id === permission.activityId);
      if (currentIndex >= 2) {
        // Check this one and the previous two
        const last3ActivityIds = [
          allActivities[currentIndex].id,
          allActivities[currentIndex - 1].id,
          allActivities[currentIndex - 2].id
        ];

        const attendanceRecords = await prisma.attendanceRecord.findMany({
          where: {
            memberId: permission.memberId,
            activityId: { in: last3ActivityIds },
            status: 'IZIN_SAKIT'
          }
        });

        if (attendanceRecords.length === 3) {
          // Flag EWS / apply -10 points
          await prisma.pointLog.create({
            data: {
              memberId: permission.memberId,
              type: 'PUNISHMENT',
              category: 'Izin Beruntun (3x)',
              points: -10,
              description: 'Otomatis: Mengajukan izin 3 kali berturut-turut pada kegiatan berbeda.'
            }
          });

          // Also notify admin
          await prisma.notification.create({
            data: {
              userId: session.userId,
              memberId: permission.memberId,
              title: 'EWS Peringatan: Izin Beruntun',
              message: `${permission.member.name} telah izin 3x berturut-turut. Poin dikurangi 10.`,
              link: '/?tab=evaluasi'
            }
          });
        }
      }
    }

    // Send notification to member
    if (permission.member.user?.id) {
       await prisma.notification.create({
         data: {
           userId: permission.member.user.id,
           title: `Pengajuan Izin ${status === 'approved' ? 'Disetujui' : 'Ditolak'}`,
           message: `Izin untuk ${permission.activity.name} telah ${status === 'approved' ? 'disetujui' : 'ditolak'}.`,
         }
       });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error verifying permission:', error);
    return NextResponse.json({ error: 'Failed to verify permission' }, { status: 500 });
  }
}
