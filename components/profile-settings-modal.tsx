'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { UniversalProfileForm } from '@/components/universal-profile-form';

interface ProfileSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName?: string;
  userEmail?: string;
  userRole?: string;
}

export function ProfileSettingsModal({
  open,
  onOpenChange,
}: ProfileSettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-6 bg-slate-50/50">
        <DialogTitle className="sr-only">Manajemen Profil Akun</DialogTitle>
        <DialogDescription className="sr-only">
          Formulir universal untuk pembaruan profil dan keamanan akun.
        </DialogDescription>
        <UniversalProfileForm
          isModal={true}
          onCancel={() => onOpenChange(false)}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
