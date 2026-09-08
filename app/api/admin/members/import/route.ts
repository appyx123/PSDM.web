export const runtime = 'edge';

import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // 1. Auth Check (Admin Only)
    const token = (await cookies()).get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload || (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data } = await request.json();
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: any; prn: string; reason: string }[]
    };

    const defaultPasswordHash = await hashPassword('password');
    const today = new Date().toISOString().split('T')[0];

    // 1. Collect all PRNs from request data for batch lookup
    const cleanPrnList: string[] = [];
    for (const item of data) {
      if (item?.prn) {
        cleanPrnList.push(item.prn.toString().trim().toUpperCase());
      }
    }

    // 2. Fetch existing Members and Users in bulk (single round-trip each)
    const [existingMembers, existingUsers] = await Promise.all([
      prisma.member.findMany({
        where: { prn: { in: cleanPrnList } },
        select: { id: true, prn: true, name: true, user: { select: { id: true } } }
      }),
      prisma.user.findMany({
        where: { prn: { in: cleanPrnList } },
        select: { id: true, prn: true }
      })
    ]);

    const existingMemberMap = new Map<string, (typeof existingMembers)[0]>();
    for (const m of existingMembers) {
      existingMemberMap.set(m.prn, m);
    }

    const existingUserPrnSet = new Set<string>();
    for (const u of existingUsers) {
      existingUserPrnSet.add(u.prn);
    }

    // In-memory data structures for batch creation
    const membersToCreate: Prisma.MemberCreateManyInput[] = [];
    const usersToCreate: Prisma.UserCreateManyInput[] = [];
    const seenPrnsInFile = new Set<string>();

    // 3. In-memory validation & filtering
    for (const item of data) {
      try {
        const { name, prn, position, department, status } = item || {};

        // Basic Validation
        if (!name || !prn || !position) {
          throw new Error('Missing required fields: Name, PRN, or Position');
        }

        const cleanPrn = prn.toString().trim().toUpperCase();

        // Check duplicate within the uploaded file
        if (seenPrnsInFile.has(cleanPrn)) {
          throw new Error(`Duplikat PRN ${cleanPrn} di dalam file import.`);
        }
        seenPrnsInFile.add(cleanPrn);

        // Check if member already exists in DB
        const existingMember = existingMemberMap.get(cleanPrn);
        if (existingMember) {
          if (existingMember.user || existingUserPrnSet.has(cleanPrn)) {
            throw new Error(`PRN ${cleanPrn} sudah terdaftar dan memiliki akun.`);
          }
          // If member exists without user account, schedule user account creation
          usersToCreate.push({
            id: crypto.randomUUID(),
            role: 'PENGURUS',
            prn: cleanPrn,
            name: existingMember.name || name,
            password: defaultPasswordHash,
            memberId: existingMember.id
          });
          results.success++;
          continue;
        }

        // Check if user already exists
        if (existingUserPrnSet.has(cleanPrn)) {
          throw new Error(`User dengan PRN ${cleanPrn} sudah terdaftar.`);
        }

        // Validate Department for Kadep/Staff
        const isTrisula = ['Ketua Umum', 'Bendahara Umum', 'Sekretaris Umum'].includes(position);
        const finalDept = isTrisula ? 'Trisula' : (department || '');
        
        if (!isTrisula && !finalDept) {
          throw new Error('Departemen wajib diisi untuk jabatan ini.');
        }

        // Validate Status
        const validStatus = ['AKTIF', 'ALUMNI', 'NONAKTIF'];
        const finalStatus = validStatus.includes(status?.toUpperCase()) ? status.toUpperCase() : 'AKTIF';

        const memberId = crypto.randomUUID();
        const userId = crypto.randomUUID();

        membersToCreate.push({
          id: memberId,
          name,
          prn: cleanPrn,
          position,
          department: finalDept,
          status: finalStatus,
          joinDate: today,
          basePoints: 100
        });

        usersToCreate.push({
          id: userId,
          role: 'PENGURUS',
          prn: cleanPrn,
          name,
          password: defaultPasswordHash,
          memberId: memberId
        });

        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({
          row: item,
          prn: item?.prn || 'Unknown',
          reason: err.message
        });
      }
    }

    // 4. Bulk database insertion using createMany inside a single transaction
    if (membersToCreate.length > 0 || usersToCreate.length > 0) {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        if (membersToCreate.length > 0) {
          await tx.member.createMany({
            data: membersToCreate
          });
        }
        if (usersToCreate.length > 0) {
          await tx.user.createMany({
            data: usersToCreate
          });
        }
      });
    }

    return NextResponse.json({
      message: 'Proses import selesai',
      ...results
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
