import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

const PURE_MATRIX: any = {
  EKSTERNAL: { TEPAT_WAKTU: 5, TERLAMBAT_SAH: 2, IZIN_SAKIT: 0, TERLAMBAT_NON_SAKTI: -2, PULANG_CEPAT: -3, ALPHA: -7 },
  INTERNAL: { TEPAT_WAKTU: 3, TERLAMBAT_SAH: 1, IZIN_SAKIT: 0, TERLAMBAT_NON_SAKTI: -1, PULANG_CEPAT: -2, ALPHA: -5 },
  KEPANITIAAN: { TEPAT_WAKTU: 2, TERLAMBAT_SAH: 1, IZIN_SAKIT: 0, TERLAMBAT_NON_SAKTI: -1, PULANG_CEPAT: -2, ALPHA: -3 }
};

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session || session.role !== 'PENGURUS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberId = session.memberId;
    if (!memberId) return NextResponse.json({ error: 'No member associated' }, { status: 400 });

    // Fetch system settings for rules
    const settings = await prisma.systemSetting.findMany();
    const sysSettings = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as any);
    const rules = sysSettings.POINT_RULES ? JSON.parse(sysSettings.POINT_RULES) : PURE_MATRIX;
    const alphaMultiplier = parseFloat(sysSettings.ALPHA_MULTIPLIER || '2');
    const maxAlphaPenalty = parseFloat(sysSettings.ALPHA_MAX_PENALTY || '50');

    // Fetch Point Logs
    const pointLogs = await prisma.pointLog.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch Attendances
    const attendances = await prisma.attendanceRecord.findMany({
      where: { memberId },
      include: { activity: true },
    });

    // Compute attendance points
    const sortedAttendances = [...attendances].sort((a, b) => new Date(a.activity.date).getTime() - new Date(b.activity.date).getTime());
    
    let consecutiveAlphas = 0;
    const computedAttendances = sortedAttendances.map(att => {
        const baseChange = rules[att.activity.scope]?.[att.status] ?? 0;
        let points = baseChange;
        
        if (att.status === 'ALPHA') {
            const rawPenalty = baseChange * Math.pow(alphaMultiplier, consecutiveAlphas);
            points = Math.max(rawPenalty, -Math.abs(maxAlphaPenalty)); 
            consecutiveAlphas++;
        } else {
            consecutiveAlphas = 0;
        }

        return {
            id: `att-${att.id}`,
            date: att.activity.date, // YYYY-MM-DD
            category: 'Kehadiran Kegiatan',
            subCategory: att.activity.name,
            points: points,
            description: `Status: ${att.status}`,
            type: points >= 0 ? 'REWARD' : 'PUNISHMENT'
        };
    });

    // Format Point Logs
    const formattedLogs = pointLogs.map(log => ({
        id: `log-${log.id}`,
        date: log.createdAt.toISOString(),
        category: 'Mutasi Manual/Klaim',
        subCategory: log.category,
        points: log.points,
        description: log.description,
        type: log.type
    }));

    // Combine and sort descending
    const combined = [...formattedLogs, ...computedAttendances].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(combined);
  } catch (error) {
    console.error('Error fetching point mutations:', error);
    return NextResponse.json({ error: 'Failed to fetch point mutations' }, { status: 500 });
  }
}
