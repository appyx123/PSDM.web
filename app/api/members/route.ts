import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getSettings } from '@/lib/settings';
import { PURE_MATRIX } from '@/lib/constants';

export async function GET() {
  try {
    const members = await prisma.member.findMany({
      include: {
        pointLogs: { orderBy: { createdAt: 'desc' } },
        attendances: {
          include: { activity: true },
          orderBy: { activity: { date: 'desc' } }
        },
        user: true,
      }
    });
    
    const sysSettings = await getSettings();
    const rules = sysSettings?.POINT_RULES ? JSON.parse(sysSettings.POINT_RULES) : PURE_MATRIX;
    const alphaMultiplier = parseFloat(sysSettings?.ALPHA_MULTIPLIER || '2');
    const maxAlphaPenalty = parseFloat(sysSettings?.ALPHA_MAX_PENALTY || '50');

    const processedMembers = await Promise.all(members.map(async (m) => {
      let treatmentInfo;
      let currentMember = m;

      if (m.treatmentActive) {
        // Calculate current total points accurately
        const sortedActivities = [...m.attendances].sort((a, b) => new Date(a.activity.date).getTime() - new Date(b.activity.date).getTime());
        
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

        const manualPoints = m.pointLogs?.reduce((sum, log) => sum + log.points, 0) || 0;
        const currentTotalPoints = m.basePoints + activityPoints + manualPoints;
        
        const daysPassed = Math.floor((new Date().getTime() - new Date(m.treatmentStartDate!).getTime()) / (1000 * 60 * 60 * 24));
        
        let shouldUpdate = false;
        let updateData: any = {};

        // Parallel Monitoring: Check for any ALPHA since treatmentStartDate
        const hasAlpha = m.attendances?.some((att: any) => 
          att.status === 'ALPHA' && new Date(att.activity?.date) > new Date(m.treatmentStartDate!)
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
          } else if (m.treatmentLevel === 'SP2') {
            updateData = {
              treatmentActive: false,
              treatmentLevel: 'SP3',
              status: 'inactive'
            };
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
          } else if (daysPassed > 60) {
            shouldUpdate = true;
            updateData = {
              treatmentPhase: 'FALLBACK_ATTENDANCE',
              treatmentStartDate: new Date().toISOString(), 
              treatmentDurationDays: 30
            };
          }
        } else if (m.treatmentPhase === 'FALLBACK_ATTENDANCE') {
          // No Alpha (already checked above), just check if duration completed
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
          }
        }

        if (shouldUpdate) {
          // Add SP Log for the transition
          let logReason = "";
          if (updateData.treatmentPhase === 'FALLBACK_ATTENDANCE') logReason = `Gagal target poin SP1 (+30) setelah 60 hari. Masuk fase Full Attendance.`;
          if (updateData.treatmentLevel === 'SP2') logReason = `Melanggar aturan Full Attendance (Alpha). Naik ke SP2.`;
          if (updateData.status === 'inactive') logReason = `Melanggar aturan Full Attendance SP2. Terminasi (SP3).`;
          if (updateData.treatmentActive === false && !updateData.status) logReason = `Bebas dari masa pembinaan (Target tercapai/Selesai).`;

          if (logReason) {
            await prisma.sPLog.create({
              data: {
                memberId: m.id,
                level: updateData.treatmentLevel || m.treatmentLevel || 'INFO',
                reason: logReason,
                notes: 'Otomatis oleh Sistem'
              }
            });
          }

          currentMember = await prisma.member.update({
            where: { id: m.id },
            data: updateData,
            include: {
              pointLogs: { orderBy: { createdAt: 'desc' } },
              attendances: { include: { activity: true }, orderBy: { activity: { date: 'desc' } } },
              user: true,
            }
          }) as any;
        }
      }

      const m2 = currentMember;
      if (m2.treatmentActive) {
        treatmentInfo = {
          isActive: true,
          level: m2.treatmentLevel,
          phase: m2.treatmentPhase,
          startDate: m2.treatmentStartDate!,
          startPoints: m2.treatmentStartPoints!,
          targetPoints: m2.treatmentTargetPoints!,
          durationDays: m2.treatmentDurationDays!,
        };
      }

      return {
        ...m2,
        status: m2.status as 'active' | 'inactive',
        treatment: treatmentInfo,
        user: m2.user ? {
          email: m2.user.email,
          image: m2.user.image,
          phoneNumber: m2.user.phoneNumber,
          instagram: m2.user.instagram,
          originCity: m2.user.originCity,
          domicileCity: m2.user.domicileCity,
          angkatan: m2.user.angkatan,
          nim: m2.user.nim,
          faculty: m2.user.faculty,
          majorProgram: m2.user.majorProgram,
          gender: m2.user.gender
        } : null
      };
    }));

    return NextResponse.json(processedMembers);
  } catch (error) {
    console.error("GET Members error:", error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, prn, department, position, status } = data;

    if (!name || !prn || !department || !position) {
      return NextResponse.json({ error: 'Nama, PRN, Departemen, dan Jabatan wajib diisi.' }, { status: 400 });
    }

    // Hash default password
    const hashedPassword = await bcrypt.hash('SALAMINOVATOR', 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Member
      const member = await tx.member.create({
        data: {
          name,
          prn,
          department,
          position,
          status: status || 'active',
          joinDate: new Date().toISOString().split('T')[0],
        }
      });

      // 2. Create User Account
      await tx.user.create({
        data: {
          name,
          prn,
          password: hashedPassword,
          role: 'PENGURUS',
          memberId: member.id
        }
      });

      return member;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST Member error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'PRN sudah terdaftar.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal membuat pengurus.' }, { status: 500 });
  }
}
