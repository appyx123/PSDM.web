import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('file');

  if (!fileName) {
    return new NextResponse('File name is required', { status: 400 });
  }

  // Security check: prevent directory traversal
  const safeFileName = path.basename(fileName);
  const filePath = path.join(process.cwd(), 'public', 'uploads', safeFileName);

  try {
    const fileBuffer = await fs.readFile(filePath);
    
    // Determine mime type based on extension
    const ext = path.extname(safeFileName).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.svg') contentType = 'image/svg+xml';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error(`Error serving file ${safeFileName}:`, error);
    return new NextResponse('File not found', { status: 404 });
  }
}
