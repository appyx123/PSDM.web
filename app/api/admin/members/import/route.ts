import { NextResponse } from 'next/server';
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

    const defaultPasswordHash = await hashPassword('SALAMINOVATOR');
    const today = new Date().toISOString().split('T')[0];

    // Process records
    for (const item of data) {
      try {
        const { name, prn, position, department, status } = item;

        // Basic Validation
        if (!name || !prn || !position) {
          throw new Error('Missing required fields: Name, PRN, or Position');
        }

        // Validate PRN uniqueness in DB
        const existingMember = await prisma.member.findUnique({ where: { prn: prn.toString().toUpperCase() } });
        if (existingMember) {
          throw new Error(`PRN ${prn} sudah terdaftar.`);
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

        // Database Creation in Transaction (per record)
        await prisma.$transaction(async (tx) => {
          const member = await tx.member.create({
            data: {
              name,
              prn: prn.toString().toUpperCase(),
              position,
              department: finalDept,
              status: finalStatus,
              joinDate: today,
              basePoints: 100
            }
          });

          await tx.user.create({
            data: {
              role: 'PENGURUS',
              prn: prn.toString().toUpperCase(),
              name,
              password: defaultPasswordHash,
              memberId: member.id
            }
          });
        });

        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({
          row: item,
          prn: item.prn || 'Unknown',
          reason: err.message
        });
      }
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
