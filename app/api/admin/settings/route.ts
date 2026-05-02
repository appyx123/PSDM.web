import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getSettings, updateSetting } from '@/lib/settings';
import { SettingKey } from '@/lib/defaultSettings';

async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN')) return null;
  return payload;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    // Validation for SP_THRESHOLDS
    if (key === 'SP_THRESHOLDS') {
      try {
        const thresholds = JSON.parse(value);
        if (!Array.isArray(thresholds) || thresholds.length !== 3) {
          return NextResponse.json({ error: 'SP Thresholds must be an array of 3 numbers' }, { status: 400 });
        }
        if (thresholds[0] <= thresholds[1] || thresholds[1] <= thresholds[2]) {
          return NextResponse.json({ error: 'Thresholds must be in descending order (SP1 > SP2 > SP3)' }, { status: 400 });
        }
      } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON for SP Thresholds' }, { status: 400 });
      }
    }

    if (session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Hanya Super Admin yang dapat mengubah pengaturan.' }, { status: 403 });
    }

    await updateSetting(key as SettingKey, value, session.userId);

    // Create a general audit log for Super Admin actions
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'UPDATE_SETTING',
        details: `Updated ${key} to ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
