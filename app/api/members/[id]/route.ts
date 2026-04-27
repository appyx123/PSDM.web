import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
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
