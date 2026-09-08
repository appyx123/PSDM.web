export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken, hashPassword } from '@/lib/auth';

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

    const processedMembers = members.map((m: any) => {
      let treatmentInfo;
      if (m.treatmentActive) {
        treatmentInfo = {
          isActive: true,
          level: m.treatmentLevel,
          phase: m.treatmentPhase,
          startDate: m.treatmentStartDate!,
          startPoints: m.treatmentStartPoints!,
          targetPoints: m.treatmentTargetPoints!,
          durationDays: m.treatmentDurationDays!,
        };
      }

      return {
        ...m,
        status: m.status as 'active' | 'inactive',
        treatment: treatmentInfo,
        user: m.user ? {
          email: m.user.email,
          image: m.user.image,
          fullName: m.user.fullName,
          gender: m.user.gender,
          birthPlace: m.user.birthPlace,
          birthDate: m.user.birthDate,
          originCity: m.user.originCity,
          originCityOther: m.user.originCityOther,
          domicileAddress: m.user.domicileAddress,
          domicileCity: m.user.domicileCity,
          domicileCityOther: m.user.domicileCityOther,
          generation: m.user.generation,
          angkatan: m.user.angkatan,
          nim: m.user.nim,
          faculty: m.user.faculty,
          majorProgram: m.user.majorProgram,
          phoneNumber: m.user.phoneNumber,
          instagram: m.user.instagram,
          linkedin: m.user.linkedin,
        } : null
      };
    });

    return NextResponse.json(processedMembers);
  } catch (error) {
    console.error("GET Members error:", error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Hanya Admin yang dapat menambah pengurus' }, { status: 403 });
    }

    const data = await request.json();
    const { name, prn, department, position, status } = data;

    if (!name || !prn || !department || !position) {
      return NextResponse.json({ error: 'Nama, PRN, Departemen, dan Jabatan wajib diisi.' }, { status: 400 });
    }

    // Hash default password
    const hashedPassword = await hashPassword('password');

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
