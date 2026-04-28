import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(imagePath: string | null | undefined) {
  if (!imagePath) return null;
  
  // If it's already an absolute URL or data URL, return as is
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
  
  // If it starts with /api/uploads, it's already using the new system
  if (imagePath.startsWith('/api/uploads')) return imagePath;
  
  // Clean up old path format if it exists in DB
  const fileName = imagePath.replace('/uploads/', '');
  
  // If it's just a filename or relative path from /uploads/
  return `/api/uploads?file=${fileName}`;
}
