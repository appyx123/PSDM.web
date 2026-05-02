import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await prisma.activity.delete({
      where: { id: resolvedParams.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Activity error:", error);
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    
    const updated = await prisma.activity.update({
      where: { id: resolvedParams.id },
      data: {
        name: body.name,
        date: body.date,
        time: body.time || "00:00",
        description: body.description,
        scope: body.scope,
      }
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT Activity error:", error);
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
  }
}
