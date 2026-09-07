import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(imagePath: string | null | undefined) {
  if (!imagePath) return null;
  
  // If it's already an absolute URL (e.g. Supabase Storage URL) or data URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  // If it's a relative path from old system or starts with /api/uploads
  if (imagePath.startsWith('/api/uploads')) return imagePath;
  
  const cleanName = imagePath.replace('/uploads/', '');

  // If Supabase URL is available, build public URL from bucket
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME || process.env.SUPABASE_BUCKET_NAME || 'psdm-storage';
  if (supabaseUrl && !cleanName.startsWith('http')) {
    return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${cleanName}`;
  }
  
  return cleanName;
}
