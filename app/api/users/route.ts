import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, hashPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: { role: 'PENGURUS' },
      select: {
        id: true,
        name: true,
        prn: true,
        role: true,
        createdAt: true,
        member: { select: { name: true, department: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('GET Users error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data user.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { prn, password, name, department, joinDate, status, basePoints } = await request.json();

    if (!prn || !password || !name || !department) {
      return NextResponse.json({ error: 'PRN, nama, departemen, dan password wajib diisi.' }, { status: 400 });
    }

    // Check uniqueness
    const existingMember = await prisma.member.findFirst({ where: { prn: prn.toUpperCase() } });
    if (existingMember) {
      return NextResponse.json({ error: 'PRN ini sudah terdaftar sebagai anggota.' }, { status: 400 });
    }
    const existingUser = await prisma.user.findFirst({ where: { prn: prn.toUpperCase() } });
    if (existingUser) {
      return NextResponse.json({ error: 'PRN ini sudah memiliki akun.' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    // Use a transaction to create Member and User atomically
    const result = await prisma.$transaction(async (tx) => {
      const newMember = await tx.member.create({
        data: {
          name,
          prn: prn.toUpperCase(),
          department,
          basePoints: basePoints || 0,
          status: status || 'active',
          joinDate: joinDate || new Date().toISOString().split('T')[0],
        }
      });

      const newUser = await tx.user.create({
        data: {
          role: 'PENGURUS',
          prn: prn.toUpperCase(),
          name,
          password: hashedPassword,
          memberId: newMember.id,
        }
      });

      return { user: newUser, member: newMember };
    });

    return NextResponse.json({
      id: result.user.id,
      name: result.user.name,
      prn: result.user.prn,
      memberId: result.member.id,
    }, { status: 201 });
  } catch (error) {
    console.error('POST User error:', error);
    return NextResponse.json({ error: 'Gagal membuat akun.' }, { status: 500 });
  }
}

