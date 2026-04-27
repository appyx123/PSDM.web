import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { PURE_MATRIX } from '@/lib/constants';

async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { memberId, level, reason, notes, path } = body;

    if (!memberId || !level || !reason) {
      return NextResponse.json({ error: 'Member, level, and reason are required' }, { status: 400 });
    }

    const member = await prisma.member.findUnique({ 
      where: { id: memberId },
      include: {
        pointLogs: true,
        attendances: { include: { activity: true } }
      }
    });
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const sysSettings = await getSettings();
    const rules = sysSettings?.POINT_RULES ? JSON.parse(sysSettings.POINT_RULES) : PURE_MATRIX;
    const alphaMultiplier = parseFloat(sysSettings?.ALPHA_MULTIPLIER || '2');
    const maxAlphaPenalty = parseFloat(sysSettings?.ALPHA_MAX_PENALTY || '50');

    // Calculate current total points accurately
    const sortedActivities = [...member.attendances].sort((a, b) => new Date(a.activity.date).getTime() - new Date(b.activity.date).getTime());
    
    let activityPoints = 0;
    let consecutiveAlphas = 0;

    for (const att of sortedActivities) {
      const baseChange = rules[att.activity.scope]?.[att.status] ?? 0;
      if (att.status === 'ALPHA') {
        const rawPenalty = baseChange * Math.pow(alphaMultiplier, consecutiveAlphas);
        const finalPenalty = Math.max(rawPenalty, -Math.abs(maxAlphaPenalty)); 
        activityPoints += finalPenalty;
        consecutiveAlphas++;
      } else {
        activityPoints += baseChange;
        consecutiveAlphas = 0; 
      }
    }

    const totalCurrentPoints = member.basePoints + activityPoints + (member.pointLogs?.reduce((sum: number, log: any) => sum + log.points, 0) || 0);

    // 1. Create SP Log
    await prisma.sPLog.create({
      data: {
        memberId,
        level,
        reason,
        notes
      }
    });

    let treatmentData: any = {
      treatmentActive: true,
      treatmentStartDate: new Date().toISOString(),
      treatmentStartPoints: totalCurrentPoints, 
    };

    if (level === 'SP1') {
      treatmentData.treatmentLevel = 'SP1';
      treatmentData.treatmentPhase = 'REDEMPTION';
      treatmentData.treatmentTargetPoints = 30;
      treatmentData.treatmentDurationDays = 60;
    } else if (level === 'SP2') {
      treatmentData.treatmentLevel = 'SP2';
      treatmentData.treatmentPhase = 'FULL_ATTENDANCE';
      treatmentData.treatmentDurationDays = 30;
    } else if (level === 'SP3') {
      treatmentData.treatmentActive = false;
      treatmentData.status = 'inactive'; 
    }

    await prisma.member.update({
      where: { id: memberId },
      data: treatmentData
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SP Issue error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
