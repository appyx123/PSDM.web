'use client';

import React, { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Loader2 } from 'lucide-react';

export interface CroppedImageResult {
  blob: Blob;
  file: File;
  dataUrl: string;
}

interface ProfileCropperModalProps {
  open: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropCompleteResult: (result: CroppedImageResult) => void;
  cropShape?: 'round' | 'rect';
  targetSize?: number;
}

/**
 * Pure client-side HTML5 Canvas crop helper
 * Crops the image according to the specified pixel bounds and converts it to WebP Blob.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  targetSize = 512,
  quality = 0.85
): Promise<CroppedImageResult> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Gagal memuat gambar untuk di-crop'));
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context tidak tersedia');
  }

  // Set standard dimensions for output
  canvas.width = targetSize;
  canvas.height = targetSize;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw the selected crop region to canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetSize,
    targetSize
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Gagal mengonversi hasil potongan gambar'));
          return;
        }

        const fileName = `avatar-${Date.now()}.webp`;
        const file = new File([blob], fileName, {
          type: 'image/webp',
          lastModified: Date.now(),
        });
        const dataUrl = canvas.toDataURL('image/webp', quality);

        resolve({ blob, file, dataUrl });
      },
      'image/webp',
      quality
    );
  });
}

export default function ProfileCropperModal({
  open,
  imageSrc,
  onClose,
  onCropCompleteResult,
  cropShape = 'round',
  targetSize = 512,
}: ProfileCropperModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const onCropChange = useCallback((newCrop: Point) => {
    setCrop(newCrop);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropCompleteHandler = useCallback((_croppedArea: Area, currentCroppedAreaPixels: Area) => {
    setCroppedAreaPixels(currentCroppedAreaPixels);
  }, []);

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      const result = await getCroppedImg(imageSrc, croppedAreaPixels, targetSize, 0.85);
      onCropCompleteResult(result);
      onClose();
    } catch (err: any) {
      console.error('Crop error:', err);
      alert(err.message || 'Gagal memotong gambar.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md max-w-[95vw] p-0 overflow-hidden bg-slate-900 text-white border-slate-800">
        <DialogHeader className="p-4 pb-2 text-left">
          <DialogTitle className="text-lg font-semibold text-white">
            Sesuaikan Foto Profil
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Geser untuk memindahkan posisi dan atur zoom agar pas di bingkai bulat.
          </DialogDescription>
        </DialogHeader>

        {/* Cropper Container */}
        <div className="relative w-full h-[320px] sm:h-[360px] bg-slate-950 select-none">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape={cropShape}
              showGrid={false}
              onCropChange={onCropChange}
              onCropComplete={onCropCompleteHandler}
              onZoomChange={onZoomChange}
              classes={{
                containerClassName: 'relative w-full h-full',
                cropAreaClassName: 'border-2 border-indigo-400 shadow-2xl',
              }}
            />
          )}
        </div>

        {/* Zoom Controls & Slider */}
        <div className="p-4 space-y-4 bg-slate-900 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(1, prev - 0.2))}
              disabled={zoom <= 1 || isProcessing}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded transition-colors"
              title="Perkecil"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.05}
              disabled={isProcessing}
              onValueChange={(vals) => setZoom(vals[0])}
              className="flex-1 cursor-pointer"
            />

            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3, prev + 0.2))}
              disabled={zoom >= 3 || isProcessing}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded transition-colors"
              title="Perbesar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={isProcessing || (zoom === 1 && crop.x === 0 && crop.y === 0)}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded transition-colors ml-1"
              title="Reset Posisi & Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Ukuran: 1:1 (Persegi / Bulat)</span>
            <span>Zoom: {Math.round(zoom * 100)}%</span>
          </div>
        </div>

        {/* Modal Actions */}
        <DialogFooter className="p-4 pt-2 bg-slate-900 flex flex-row justify-end gap-2 border-t border-slate-800/60">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-300 hover:text-white hover:bg-slate-800 text-sm"
          >
            <X className="w-4 h-4 mr-1.5" />
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={isProcessing || !imageSrc}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-md"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-1.5" />
                ACC Foto
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
