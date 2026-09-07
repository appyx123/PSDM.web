export const runtime = 'experimental-edge';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'psdm-super-secret-key-change-in-production'
);

interface SessionPayload {
  userId: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'PENGURUS';
  name: string;
  memberId?: string;
  prn?: string;
}

async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('session')?.value;

  // Paths that require authorization
  const protectedApiPaths = [
    '/api/admin',
    '/api/permissions',
    '/api/claims',
    '/api/members',
    '/api/activities',
    '/api/point-logs',
    '/api/users'
  ];

  const isProtectedPath = protectedApiPaths.some(path => pathname.startsWith(path));

  if (isProtectedPath) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role-Based Access Control (RBAC)
    
    // 1. User Management, SP, & Departments: SUPER_ADMIN only
    if (
      pathname.startsWith('/api/admin/users') || 
      pathname.startsWith('/api/admin/sp') ||
      pathname.startsWith('/api/admin/departments')
    ) {
      if (session.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden: Super Admin only' }, { status: 403 });
      }
    }

    // 2. Sensitive Admin/Operations: SUPER_ADMIN or ADMIN
    const adminOnlyPaths = [
      '/api/admin',
      '/api/point-logs',
      '/api/permissions/verify', 
      '/api/claims/verify'
    ];

    const isAdminOnly = adminOnlyPaths.some(path => pathname.includes(path));
    
    if (isAdminOnly) {
      if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }

    // 3. Members & Activities: 
    if (pathname.startsWith('/api/members') || pathname.startsWith('/api/activities')) {
      if (request.method !== 'GET' && session.role === 'PENGURUS') {
        return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
