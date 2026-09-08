export const runtime = 'edge';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

const DEFAULT_DEPARTMENTS = [
  'PSDM',
  'Media',
  'Penalaran',
  'Kompres',
  'Ristek',
  'Humas'
];

async function getSuperAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'SUPER_ADMIN') return null;
  return payload;
}

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

    const memberDepts = members
      .map(m => m.department)
      .filter(d => Boolean(d) && d !== 'Trisula');

    const merged = Array.from(new Set([...depts, ...memberDepts])).sort();

    // Hitung juga jumlah anggota per departemen
    const counts: Record<string, number> = {};
    merged.forEach(d => {
      counts[d] = members.filter(m => m.department === d).length;
    });

    return NextResponse.json({ departments: merged, counts });
  } catch (error) {
    console.error('Admin GET departments error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data departemen' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Akses khusus Super Admin' }, { status: 403 });
  }

  try {
    const { name } = await request.json();
    const trimmed = (name || '').trim();

    if (!trimmed) {
      return NextResponse.json({ error: 'Nama departemen tidak boleh kosong' }, { status: 400 });
    }

    if (trimmed.toLowerCase() === 'trisula') {
      return NextResponse.json({ error: 'Trisula adalah struktur pimpinan khusus' }, { status: 400 });
    }

    const setting = await prisma.systemSetting.findUnique({ where: { key: 'DEPARTMENTS' } });
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

    // Cek duplikasi
    const exists = depts.some(d => d.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      return NextResponse.json({ error: `Departemen "${trimmed}" sudah ada` }, { status: 400 });
    }

    depts.push(trimmed);
    depts.sort();

    await prisma.systemSetting.upsert({
      where: { key: 'DEPARTMENTS' },
      update: { value: JSON.stringify(depts) },
      create: { key: 'DEPARTMENTS', value: JSON.stringify(depts) }
    });

    return NextResponse.json({ success: true, departments: depts });
  } catch (error) {
    console.error('Admin POST department error:', error);
    return NextResponse.json({ error: 'Gagal menambahkan departemen' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Akses khusus Super Admin' }, { status: 403 });
  }

  try {
    const { name } = await request.json();
    const trimmed = (name || '').trim();

    if (!trimmed) {
      return NextResponse.json({ error: 'Nama departemen tidak valid' }, { status: 400 });
    }

    // Cek apakah masih ada anggota di departemen ini
    const memberCount = await prisma.member.count({ where: { department: trimmed } });
    if (memberCount > 0) {
      return NextResponse.json({ 
        error: `Tidak dapat menghapus: masih ada ${memberCount} anggota di departemen "${trimmed}". Pindahkan anggotanya terlebih dahulu.` 
      }, { status: 400 });
    }

    const setting = await prisma.systemSetting.findUnique({ where: { key: 'DEPARTMENTS' } });
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

    depts = depts.filter(d => d.toLowerCase() !== trimmed.toLowerCase());

    await prisma.systemSetting.upsert({
      where: { key: 'DEPARTMENTS' },
      update: { value: JSON.stringify(depts) },
      create: { key: 'DEPARTMENTS', value: JSON.stringify(depts) }
    });

    // Bersihkan juga dari PJ Mapping jika ada
    const pjSetting = await prisma.systemSetting.findUnique({ where: { key: 'PJ_MAPPING' } });
    if (pjSetting?.value) {
      try {
        const mapping = JSON.parse(pjSetting.value);
        delete mapping[trimmed];
        await prisma.systemSetting.update({
          where: { key: 'PJ_MAPPING' },
          data: { value: JSON.stringify(mapping) }
        });
      } catch {}
    }

    return NextResponse.json({ success: true, departments: depts });
  } catch (error) {
    console.error('Admin DELETE department error:', error);
    return NextResponse.json({ error: 'Gagal menghapus departemen' }, { status: 500 });
  }
}
