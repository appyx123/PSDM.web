import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const pointLogs = await prisma.pointLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        member: {
          select: { name: true, prn: true }
        }
      }
    });
    return NextResponse.json(pointLogs);
  } catch (error) {
    console.error("GET PointLogs error:", error);
    return NextResponse.json({ error: 'Failed to fetch point logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const newPointLog = await prisma.pointLog.create({
      data: {
        memberId: data.memberId,
        type: data.type,
        category: data.category,
        points: data.points,
        description: data.description,
      }
    });

    return NextResponse.json(newPointLog, { status: 201 });
  } catch (error) {
    console.error("POST PointLog error:", error);
    return NextResponse.json({ error: 'Failed to create point log' }, { status: 500 });
  }
}
