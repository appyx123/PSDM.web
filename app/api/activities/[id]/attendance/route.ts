import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const data = await request.json();
    const resolvedParams = await params;
    const activityId = resolvedParams.id;
    const { memberId, status } = data;

    if (status === null) {
      // Remove attendance record
      await prisma.attendanceRecord.deleteMany({
        where: {
          activityId,
          memberId
        }
      });
    } else {
      // Upsert attendance record
      await prisma.attendanceRecord.upsert({
        where: {
          memberId_activityId: {
            memberId,
            activityId
          }
        },
        update: {
          status
        },
        create: {
          memberId,
          activityId,
          status
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT Attendance error:", error);
    return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 });
  }
}
