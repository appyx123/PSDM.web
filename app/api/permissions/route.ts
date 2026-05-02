import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { activityId, type, reason, evidence, isEmergency } = data;

    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session || !session.memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const memberId = session.memberId;

    // Check if permission already exists
    const existing = await prisma.permission.findFirst({
      where: { memberId, activityId }
    });
    if (existing) {
      return NextResponse.json({ error: 'Anda sudah mengajukan izin untuk kegiatan ini.' }, { status: 400 });
    }

    // Check activity
    const activity = await prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 });

    // Check quota for this activity
    const approvedOrPendingCount = await prisma.permission.count({
      where: {
        activityId,
        status: { in: ['pending', 'approved', 'emergency_pending'] }
      }
    });

    let finalStatus = 'pending';
    if (isEmergency) {
      finalStatus = 'emergency_pending';
    } else if (approvedOrPendingCount >= 7) {
      finalStatus = 'emergency_quota_full';
    }

    // Assign PJ based on department
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    let pjId = null;
    if (member) {
      const setting = await prisma.systemSetting.findUnique({ where: { key: 'PJ_MAPPING' } });
      if (setting && setting.value) {
        const mapping = JSON.parse(setting.value);
        pjId = mapping[member.department] || null;
      }
    }

    const permission = await prisma.permission.create({
      data: {
        memberId,
        activityId,
        type,
        reason,
        evidence,
        status: finalStatus,
        pjId
      }
    });

    // Create notification for admin/PJ
    if (pjId) {
      await prisma.notification.create({
        data: {
          userId: pjId,
          title: 'Pengajuan Izin Baru',
          message: `${member?.name} mengajukan izin untuk kegiatan ${activity.name}`,
          link: '/?tab=perizinan'
        }
      });
    }

    return NextResponse.json(permission);
  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json({ error: 'Failed to create permission' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'PENGURUS'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const statusParam = url.searchParams.get('status');
    const activityId = url.searchParams.get('activityId');
    const department = url.searchParams.get('department');
    let pjId = url.searchParams.get('pjId');

    const where: any = {};

    // For standard ADMIN, restrict to their CURRENTLY assigned departments in PJ_MAPPING
    if (session.role === 'ADMIN') {
      const setting = await prisma.systemSetting.findUnique({ where: { key: 'PJ_MAPPING' } });
      if (setting && setting.value) {
        const mapping = JSON.parse(setting.value);
        const myDepts = Object.entries(mapping)
          .filter(([_, uid]) => uid === session.userId)
          .map(([dept]) => dept);
        
        where.member = { department: { in: myDepts } };
      } else {
        where.id = 'NONE'; // Show nothing if no mapping exists
      }
    } else if (session.role === 'SUPER_ADMIN' && pjId) {
      where.pjId = pjId;
    }

    if (statusParam) {
      if (statusParam === 'pending_all') {
        where.status = { in: ['pending', 'emergency_pending', 'emergency_quota_full'] };
      } else if (statusParam === 'history') {
        where.status = { in: ['approved', 'rejected', 'cancelled'] };
      } else {
        where.status = statusParam;
      }
    }
    if (activityId) where.activityId = activityId;
    
    // Merge department filter with Admin restrictions if applicable
    if (department) {
      if (session.role === 'ADMIN') {
        // If Admin is filtering, they can only filter within their allowed departments
        const allowedDepts = where.member?.department?.in || [];
        if (allowedDepts.includes(department)) {
          where.member = { department };
        } else {
          where.id = 'NONE';
        }
      } else {
        where.member = { department };
      }
    }

    if (pjId) where.pjId = pjId;

    // If Pengurus, only get their own
    if (session.role === 'PENGURUS') {
      where.memberId = session.memberId;
    }

    const permissions = await prisma.permission.findMany({
      where,
      include: {
        member: true,
        activity: true,
        pj: true,
        verifiedBy: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}
