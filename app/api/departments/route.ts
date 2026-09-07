export const runtime = 'edge';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const DEFAULT_DEPARTMENTS = [
  'PSDM',
  'Media',
  'Penalaran',
  'Kompres',
  'Ristek',
  'Humas'
];

export async function GET() {
  try {
    const [setting, members] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: 'DEPARTMENTS' } }),
      prisma.member.findMany({ select: { department: true } })
    ]);

    let depts: string[] = [];

    if (setting?.value) {
      try {
        depts = JSON.parse(setting.value);
      } catch {
        depts = [...DEFAULT_DEPARTMENTS];
      }
    } else {
      depts = [...DEFAULT_DEPARTMENTS];
    }

    // Gabungkan juga dengan departemen yang sudah ada pada data anggota agar tidak hilang
    const memberDepts = members
      .map(m => m.department)
      .filter(d => Boolean(d) && d !== 'Trisula');

    const merged = Array.from(new Set([...depts, ...memberDepts])).sort();

    return NextResponse.json(merged);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(DEFAULT_DEPARTMENTS);
  }
}
