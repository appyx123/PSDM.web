export const runtime = 'edge';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies, headers } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { PURE_MATRIX } from '@/lib/constants';

async function isAuthorized(request: Request): Promise<boolean> {
  // 1. Check Cron secret header (for automated Cloudflare Cron Triggers or external workers)
  const reqHeaders = await headers();
  const cronSecret = reqHeaders.get('x-cron-secret') || reqHeaders.get('authorization')?.replace('Bearer ', '');
  const expectedSecret = process.env.CRON_SECRET || process.env.JWT_SECRET;
  if (expectedSecret && cronSecret && cronSecret === expectedSecret) {
    return true;
  }

  // 2. Check Admin Session Cookie (for manual trigger from Admin Dashboard)
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return false;

  const session = await verifyToken(token);
  return Boolean(session && (session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'));
}

export async function POST(request: Request) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized: Akses ditolak' }, { status: 401 });
    }

    // Only fetch members currently undergoing treatment
    const members = await prisma.member.findMany({
      where: { treatmentActive: true },
      include: {
        pointLogs: { orderBy: { createdAt: 'desc' } },
        attendances: {
          include: { activity: true },
          orderBy: { activity: { date: 'desc' } }
        }
      }
    });

    const sysSettings = await getSettings();
    const rules = sysSettings?.POINT_RULES ? JSON.parse(sysSettings.POINT_RULES) : PURE_MATRIX;
    const alphaMultiplier = parseFloat(sysSettings?.ALPHA_MULTIPLIER || '2');
    const maxAlphaPenalty = parseFloat(sysSettings?.ALPHA_MAX_PENALTY || '50');

    const updates: Array<{ id: string; name: string; prn: string; action: string; reason: string }> = [];

    for (const m of members) {
      try {
        const sortedActivities = [...m.attendances].sort(
          (a, b) => new Date(a.activity.date).getTime() - new Date(b.activity.date).getTime()
        );

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

        const manualPoints = m.pointLogs?.reduce((sum: number, log: any) => sum + log.points, 0) || 0;
        const currentTotalPoints = m.basePoints + activityPoints + manualPoints;

        const daysPassed = Math.floor(
          (new Date().getTime() - new Date(m.treatmentStartDate!).getTime()) / (1000 * 60 * 60 * 24)
        );

        let shouldUpdate = false;
        let updateData: any = {};
        let logReason = '';

        // Parallel Monitoring: Check for any ALPHA since treatmentStartDate
        const hasAlpha = m.attendances?.some(
          (att: any) => att.status === 'ALPHA' && new Date(att.activity?.date) > new Date(m.treatmentStartDate!)
        );

        if (hasAlpha) {
          shouldUpdate = true;
          if (m.treatmentLevel === 'SP1') {
            updateData = {
              treatmentLevel: 'SP2',
              treatmentPhase: 'FALLBACK_ATTENDANCE',
              treatmentStartDate: new Date().toISOString(),
              treatmentDurationDays: 30
            };
            logReason = 'Melanggar aturan Full Attendance (Alpha). Naik ke SP2.';
          } else if (m.treatmentLevel === 'SP2') {
            updateData = {
              treatmentActive: false,
              treatmentLevel: 'SP3',
              status: 'inactive'
            };
            logReason = 'Melanggar aturan Full Attendance SP2. Terminasi (SP3).';
          }
        } else if (m.treatmentLevel === 'SP1' && m.treatmentPhase === 'REDEMPTION') {
          // Check if +30 points target met compared to startPoints
          const pointsGained = currentTotalPoints - (m.treatmentStartPoints || 0);

          if (pointsGained >= (m.treatmentTargetPoints || 30)) {
            shouldUpdate = true;
            updateData = {
              treatmentActive: false,
              treatmentLevel: null,
              treatmentPhase: null,
              treatmentStartDate: null,
              treatmentStartPoints: null,
              treatmentTargetPoints: null,
              treatmentDurationDays: null
            };
            logReason = 'Target poin penebusan SP1 (+30) tercapai. Bebas dari masa pembinaan.';
          } else if (daysPassed > 60) {
            shouldUpdate = true;
            updateData = {
              treatmentPhase: 'FALLBACK_ATTENDANCE',
              treatmentStartDate: new Date().toISOString(),
              treatmentDurationDays: 30
            };
            logReason = 'Gagal target poin SP1 (+30) setelah 60 hari. Masuk fase Full Attendance.';
          }
        } else if (m.treatmentPhase === 'FALLBACK_ATTENDANCE') {
          // No Alpha, check if duration completed
          if (daysPassed > (m.treatmentDurationDays || 30)) {
            shouldUpdate = true;
            updateData = {
              treatmentActive: false,
              treatmentLevel: null,
              treatmentPhase: null,
              treatmentStartDate: null,
              treatmentStartPoints: null,
              treatmentTargetPoints: null,
              treatmentDurationDays: null
            };
            logReason = 'Selesai masa Full Attendance tanpa pelanggaran. Bebas dari pembinaan.';
          }
        }

        if (shouldUpdate) {
          if (logReason) {
            await prisma.sPLog.create({
              data: {
                memberId: m.id,
                level: updateData.treatmentLevel || m.treatmentLevel || 'INFO',
                reason: logReason,
                notes: 'Otomatis oleh Evaluasi Sistem'
              }
            });
          }

          await prisma.member.update({
            where: { id: m.id },
            data: updateData
          });

          updates.push({
            id: m.id,
            name: m.name,
            prn: m.prn,
            action: updateData.treatmentLevel || (updateData.treatmentActive === false ? 'GRADUATED' : 'PHASE_SHIFT'),
            reason: logReason
          });
        }
      } catch (memberErr: any) {
        console.error(`Error evaluating member ${m.prn}:`, memberErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Evaluasi pembinaan selesai',
      totalInTreatment: members.length,
      totalUpdated: updates.length,
      updates
    });
  } catch (error) {
    console.error('Evaluate treatment error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat mengevaluasi pembinaan' }, { status: 500 });
  }
}
