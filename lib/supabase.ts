import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fallback resolver to guarantee a valid HTTP/HTTPS URL during build (e.g. Cloudflare Pages secret omission)
function resolveUrl(url?: string): string {
  if (!url || typeof url !== 'string') return 'https://placeholder.supabase.co';
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return 'https://placeholder.supabase.co';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function resolveKey(key?: string): string {
  if (!key || typeof key !== 'string') return 'placeholder-key';
  const trimmed = key.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return 'placeholder-key';
  return trimmed;
}

const supabaseUrl = resolveUrl(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseKey = resolveKey(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY);
export const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET_NAME || process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME || 'psdm-storage';

// Export canonical supabase client with fallback
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Backward-compatible alias for admin operations
export const supabaseAdmin = supabase;

let clientInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!clientInstance) {
    clientInstance = supabase;
  }
  return clientInstance;
}

/**
 * Extract storage relative path from a full Supabase URL or relative string
 */
export function extractStoragePath(urlOrPath: string | null | undefined, bucket: string = SUPABASE_BUCKET): string | null {
  if (!urlOrPath) return null;
  if (urlOrPath.startsWith('data:')) return null;

  // Handle public url: /storage/v1/object/public/<bucket>/<filePath>
  const publicMarker = `/storage/v1/object/public/${bucket}/`;
  if (urlOrPath.includes(publicMarker)) {
    return decodeURIComponent(urlOrPath.split(publicMarker)[1] || '');
  }

  // Handle signed url: /storage/v1/object/sign/<bucket>/<filePath>?...
  const signMarker = `/storage/v1/object/sign/${bucket}/`;
  if (urlOrPath.includes(signMarker)) {
    const rawPath = urlOrPath.split(signMarker)[1]?.split('?')[0] || '';
    return decodeURIComponent(rawPath);
  }

  // If already relative path in storage (e.g. avatars/..., logos/..., evidences/...)
  if (urlOrPath.startsWith('avatars/') || urlOrPath.startsWith('logos/') || urlOrPath.startsWith('evidences/')) {
    return urlOrPath;
  }

  return null;
}

/**
 * Delete a file from Supabase Storage by URL or storage path
 */
export async function deleteSupabaseStorageFile(urlOrPath: string | null | undefined, bucket: string = SUPABASE_BUCKET): Promise<boolean> {
  const filePath = extractStoragePath(urlOrPath, bucket);
  if (!filePath) return false;

  try {
    const { error } = await supabaseAdmin.storage.from(bucket).remove([filePath]);
    if (error) {
      console.warn(`[Supabase Storage] Failed to delete old file (${filePath}):`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Supabase Storage] Error deleting old file (${filePath}):`, err);
    return false;
  }
}

