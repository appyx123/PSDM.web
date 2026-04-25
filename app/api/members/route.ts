import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const members = await prisma.member.findMany({
      include: {
        pointLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    // Transform Prisma data to match our frontend Member interface
    const formattedMembers = members.map(m => {
      let treatmentInfo;
      if (m.treatmentActive) {
        treatmentInfo = {
          isActive: true,
          startDate: m.treatmentStartDate!,
          startPoints: m.treatmentStartPoints!,
          targetPoints: m.treatmentTargetPoints!,
          durationDays: m.treatmentDurationDays!,
          path: m.treatmentPath as 'REDEMPTION' | 'FULL_ATTENDANCE'
        };
      }

      return {
        id: m.id,
        name: m.name,
        prn: m.prn,
        department: m.department,
        basePoints: m.basePoints,
        status: m.status as 'active' | 'inactive',
        joinDate: m.joinDate,
        treatment: treatmentInfo,
        pointLogs: m.pointLogs
      };
    });

    return NextResponse.json(formattedMembers);
  } catch (error) {
    console.error("GET Members error:", error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const newMember = await prisma.member.create({
      data: {
        name: data.name,
        prn: data.prn,
        department: data.department,
        basePoints: data.basePoints || 0,
        status: data.status || 'active',
        joinDate: data.joinDate || new Date().toISOString().split('T')[0],
      }
    });

    return NextResponse.json({ id: newMember.id }, { status: 201 });
  } catch (error: any) {
    console.error("POST Member error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'PRN (ID Anggota) sudah terdaftar di sistem. Gunakan PRN lain.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
}
