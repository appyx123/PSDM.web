import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SOP_PUNISHMENTS, SOP_REWARDS } from '@/lib/sop-constants';

export async function GET() {
  try {
    const categories = await prisma.pointCategory.findMany();
    
    // Auto-seed if empty
    if (categories.length === 0) {
      const defaultCategories = [
        ...SOP_PUNISHMENTS.map(p => ({ type: 'PUNISHMENT', name: p.label, points: p.points })),
        ...SOP_REWARDS.map(r => ({ type: 'REWARD', name: r.label, points: r.points }))
      ];
      
      await prisma.pointCategory.createMany({
        data: defaultCategories
      });
      
      const newCategories = await prisma.pointCategory.findMany();
      return NextResponse.json(newCategories);
    }
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET PointCategories error:", error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newCategory = await prisma.pointCategory.create({
      data: {
        type: data.type,
        name: data.name || data.label,
        points: parseInt(data.points)
      }
    });
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("POST PointCategory error:", error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
