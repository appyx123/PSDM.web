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
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const fileName = `${uniqueId}-${file.name.replace(/\s+/g, '-')}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, fileName);

    // Ensure directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, buffer);
    
    // Return the URL to the file
    const fileUrl = `/api/uploads?file=${fileName}`;
    
    return NextResponse.json({ url: fileUrl, fileName });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
