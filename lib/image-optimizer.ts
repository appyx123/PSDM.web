/**
 * Client-Side Image Optimization Pipeline
 * 
 * Provides automated center-cropping, dimensional scaling, and WebP compression
 * using standard HTML5 Canvas APIs in the browser without server dependencies.
 */

export interface OptimizedImageResult {
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

/**
 * Load a File or Blob into an HTMLImageElement
 */
function loadImageFromFile(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal memuat file gambar'));
    };

    img.src = objectUrl;
  });
}

/**
 * Convert canvas to a File object with WebP format
 */
function canvasToFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  quality = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Gagal mengompres gambar'));
          return;
        }
        // Change extension to .webp
        const baseName = fileName.replace(/\.[^/.]+$/, '');
        const webpFile = new File([blob], `${baseName}.webp`, {
          type: 'image/webp',
          lastModified: Date.now(),
        });
        resolve(webpFile);
      },
      'image/webp',
      quality
    );
  });
}

/**
 * 1. Auto-Crop & Standardize Profile Avatar (Square 1:1)
 * - Center-crops the image to a perfect square (1:1)
 * - Scales to a maximum of 512x512 px
 * - Compresses to WebP (quality ~80%, target ~50-150 KB)
 */
export async function optimizeProfileAvatar(
  file: File,
  maxSize = 512,
  quality = 0.8
): Promise<OptimizedImageResult> {
  // Validate image type
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar (JPG, PNG, WebP)');
  }

  // Pre-validation: reject raw files greater than 15 MB
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Ukuran file mentah terlalu besar. Maksimal 15 MB');
  }

  const img = await loadImageFromFile(file);

  // Calculate center crop (Square 1:1)
  const minSide = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - minSide) / 2;
  const sy = (img.naturalHeight - minSide) / 2;

  // Final output dimensions capped at maxSize (default 512px)
  const outputDim = Math.min(maxSize, minSide);

  const canvas = document.createElement('canvas');
  canvas.width = outputDim;
  canvas.height = outputDim;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  // Enable high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw cropped center region scaled to output dimensions
  ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, outputDim, outputDim);

  const webpFile = await canvasToFile(canvas, file.name, quality);
  const dataUrl = canvas.toDataURL('image/webp', quality);

  // Hard limit 1 MB
  if (webpFile.size > 1024 * 1024) {
    throw new Error('Ukuran file hasil kompresi masih melebihi 1 MB');
  }

  return {
    file: webpFile,
    dataUrl,
    width: outputDim,
    height: outputDim,
    sizeBytes: webpFile.size,
  };
}

/**
 * 2. Optimize Documentation & Evidence Image (Lampiran Izin / Klaim / Logo)
 * - Maximum dimension 1920x1920 px (maintains aspect ratio)
 * - Converts to WebP format (quality ~80%, target ~300-800 KB)
 * - Enforces hard limit < 1 MB
 */
export async function optimizeDocumentationImage(
  file: File,
  maxDimension = 1920,
  quality = 0.8
): Promise<OptimizedImageResult> {
  // If not an image (e.g. PDF evidence), return original file if <= 1MB
  if (!file.type.startsWith('image/')) {
    if (file.size > 1024 * 1024) {
      throw new Error('Ukuran file dokumen melebihi 1 MB');
    }
    return {
      file,
      dataUrl: '',
      width: 0,
      height: 0,
      sizeBytes: file.size,
    };
  }

  // Pre-validation: reject raw files greater than 15 MB
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Ukuran file mentah terlalu besar. Maksimal 15 MB');
  }

  const img = await loadImageFromFile(file);

  let targetWidth = img.naturalWidth;
  let targetHeight = img.naturalHeight;

  // Scale down if exceeds maxDimension while preserving aspect ratio
  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    const scale = Math.min(maxDimension / targetWidth, maxDimension / targetHeight);
    targetWidth = Math.round(targetWidth * scale);
    targetHeight = Math.round(targetHeight * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  let currentQuality = quality;
  let webpFile = await canvasToFile(canvas, file.name, currentQuality);

  // If still above 1MB, try slightly lower quality
  if (webpFile.size > 1024 * 1024 && currentQuality > 0.6) {
    currentQuality = 0.65;
    webpFile = await canvasToFile(canvas, file.name, currentQuality);
  }

  if (webpFile.size > 1024 * 1024) {
    throw new Error('Ukuran file hasil optimasi melebihi 1 MB');
  }

  const dataUrl = canvas.toDataURL('image/webp', currentQuality);

  return {
    file: webpFile,
    dataUrl,
    width: targetWidth,
    height: targetHeight,
    sizeBytes: webpFile.size,
  };
}
