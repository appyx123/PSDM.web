import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const data = await request.json();
    const resolvedParams = await params;
    const permissionId = resolvedParams.id;
    const { cancellationReason, fallbackStatus } = data; // fallbackStatus is AttendanceStatus

    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: { activity: true, member: true }
    });

    if (!permission) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Update permission status to cancelled
    const updated = await prisma.permission.update({
      where: { id: permissionId },
      data: {
        status: 'cancelled',
        cancellationReason
      }
    });

    // Update AttendanceRecord to fallbackStatus or delete it
    if (fallbackStatus) {
      await prisma.attendanceRecord.upsert({
        where: {
          memberId_activityId: { memberId: permission.memberId, activityId: permission.activityId }
        },
        update: {
          status: fallbackStatus,
          isEmergencyIzin: false,
          emergencyReason: null
        },
        create: {
          memberId: permission.memberId,
          activityId: permission.activityId,
          status: fallbackStatus
        }
      });
    } else {
      // Just delete attendance record so it's empty again
      await prisma.attendanceRecord.deleteMany({
        where: {
          memberId: permission.memberId,
          activityId: permission.activityId
        }
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error cancelling permission:', error);
    return NextResponse.json({ error: 'Failed to cancel permission' }, { status: 500 });
  }
}
