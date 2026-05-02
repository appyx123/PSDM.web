import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session || session.role !== 'PENGURUS' || !session.memberId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberId = session.memberId;
    const now = new Date();

    // Get upcoming activities (date >= today or near future).
    // The activity.date is stored as string YYYY-MM-DD usually, so we'll just get all and filter/sort in JS, 
    // or we can sort by date desc and filter. Let's just fetch recent/future ones.
    const activities = await prisma.activity.findMany({
      orderBy: { date: 'desc' },
      take: 20
    });

    const futureActivities = activities
      .filter(a => new Date(a.date).getTime() >= now.getTime() - (24 * 60 * 60 * 1000)) // From today onwards roughly
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);

    const activityIds = futureActivities.map(a => a.id);

    // Get permissions for this member in these activities
    const permissions = await prisma.permission.findMany({
      where: {
        memberId,
        activityId: { in: activityIds }
      }
    });

    const result = futureActivities.map(activity => {
      const perm = permissions.find(p => p.activityId === activity.id);
      return {
        activity,
        permission: perm || null
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching dashboard permissions:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard permissions' }, { status: 500 });
  }
}
