import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const session = await verifyToken(token);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const setting = await prisma.systemSetting.findUnique({ where: { key: 'PJ_MAPPING' } });
    const mapping = setting && setting.value ? JSON.parse(setting.value) : {};

    return NextResponse.json(mapping);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch PJ mapping' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json(); // Object mapping { 'Media': 'userId', ... }
    
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const session = await verifyToken(token);
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const jsonString = JSON.stringify(data);

    await prisma.systemSetting.upsert({
      where: { key: 'PJ_MAPPING' },
      update: { value: jsonString },
      create: { key: 'PJ_MAPPING', value: jsonString }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save PJ mapping' }, { status: 500 });
  }
}
