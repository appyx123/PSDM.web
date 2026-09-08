export const runtime = 'edge';

import { NextResponse } from 'next/server';

function clearSessionCookie(response: NextResponse) {
  const isProd = process.env.NODE_ENV === 'production';
  
  // Set empty cookie with maxAge 0 and expired date to ensure all browsers clear it
  response.cookies.set('session', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  });
  
  // Also call delete for Next.js internal cookie jar removal
  response.cookies.delete('session');
}

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  clearSessionCookie(response);
  return response;
}

export async function GET(request: Request) {
  const url = new URL('/login', request.url);
  const response = NextResponse.redirect(url);
  clearSessionCookie(response);
  return response;
}
