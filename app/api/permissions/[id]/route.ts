import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { type, reason, evidence } = data;

    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session || !session.memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const memberId = session.memberId;

    // Fetch existing permission
    const existing = await prisma.permission.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Izin tidak ditemukan.' }, { status: 404 });
    }

    // Check ownership
    if (existing.memberId !== memberId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if verified: pending status are 'pending', 'emergency_pending', 'emergency_quota_full'
    const pendingStatuses = ['pending', 'emergency_pending', 'emergency_quota_full'];
    if (!pendingStatuses.includes(existing.status)) {
      return NextResponse.json({
        error: 'Izin yang sudah diverifikasi tidak dapat diubah.'
      }, { status: 400 });
    }

    // Update the permission
    const updatedPermission = await prisma.permission.update({
      where: { id },
      data: {
        type,
        reason,
        evidence: evidence !== undefined ? evidence : existing.evidence
      }
    });

    return NextResponse.json(updatedPermission);
  } catch (error) {
    console.error('Error updating permission:', error);
    return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await verifyToken(token);
    if (!session || !session.memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const memberId = session.memberId;

    // Fetch existing permission
    const existing = await prisma.permission.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Izin tidak ditemukan.' }, { status: 404 });
    }

    // Check ownership
    if (existing.memberId !== memberId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if verified
    const pendingStatuses = ['pending', 'emergency_pending', 'emergency_quota_full'];
    if (!pendingStatuses.includes(existing.status)) {
      return NextResponse.json({
        error: 'Izin yang sudah diverifikasi tidak dapat dihapus.'
      }, { status: 400 });
    }

    // Delete permission
    await prisma.permission.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Izin berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleting permission:', error);
    return NextResponse.json({ error: 'Failed to delete permission' }, { status: 500 });
  }
}
