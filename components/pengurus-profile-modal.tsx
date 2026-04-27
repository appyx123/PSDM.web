'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  PengurusProfileForm,
  type PengurusProfileData,
} from './pengurus-profile-form';

interface PengurusProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<PengurusProfileData>;
  onSave?: (data: PengurusProfileData) => Promise<void>;
}

export function PengurusProfileModal({
  open,
  onOpenChange,
  initialData,
  onSave,
}: PengurusProfileModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: PengurusProfileData) => {
    setIsLoading(true);
    try {
      if (onSave) {
        await onSave(data);
      }
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      onOpenChange(false);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 bg-white border-b border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">Pengaturan Profil Pengurus</DialogTitle>
              <DialogDescription className="mt-1">
                Kelola informasi profil dan pengaturan akun Anda
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6">
          <PengurusProfileForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isLoading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
