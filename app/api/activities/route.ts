import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      include: {
        attendees: true
      }
    });
    
    // Transform Prisma data to match our frontend Activity interface
    const formattedActivities = activities.map(a => ({
      id: a.id,
      name: a.name,
      date: a.date,
      time: a.time,
      description: a.description,
      scope: a.scope as 'EKSTERNAL' | 'INTERNAL' | 'KEPANITIAAN',
      attendees: a.attendees.map(att => ({
        memberId: att.memberId,
        status: att.status as any
      }))
    }));

    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error("GET Activities error:", error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const newActivity = await prisma.activity.create({
      data: {
        name: data.name,
        date: data.date,
        time: data.time || "00:00",
        description: data.description,
        scope: data.scope,
      }
    });

    return NextResponse.json({ id: newActivity.id }, { status: 201 });
  } catch (error) {
    console.error("POST Activity error:", error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
