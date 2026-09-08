export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Sesi tidak valid' }, { status: 401 });
    }
    const session = await verifyToken(token);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Hanya Admin yang dapat memperbarui data anggota' }, { status: 403 });
    }

    const data = await request.json();
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // Handle nested treatment object if present
    let treatmentData = {};
    if (data.treatment !== undefined) {
      if (data.treatment) {
        treatmentData = {
          treatmentActive: data.treatment.isActive,
          treatmentStartDate: data.treatment.startDate,
          treatmentStartPoints: data.treatment.startPoints,
          treatmentTargetPoints: data.treatment.targetPoints,
          treatmentDurationDays: data.treatment.durationDays,
          treatmentPath: data.treatment.path,
        };
      } else {
        treatmentData = {
          treatmentActive: false,
          treatmentStartDate: null,
          treatmentStartPoints: null,
          treatmentTargetPoints: null,
          treatmentDurationDays: null,
          treatmentPath: null,
        };
      }
    }

    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        name: data.name,
        prn: data.prn,
        department: data.department,
        position: data.position,
        basePoints: data.basePoints,
        status: data.status,
        ...treatmentData
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT Member error:", error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Sesi tidak valid' }, { status: 401 });
    }
    const session = await verifyToken(token);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Hanya Admin yang dapat menghapus anggota' }, { status: 403 });
    }

    const resolvedParams = await params;
    await prisma.member.delete({
      where: { id: resolvedParams.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Member error:", error);
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
