'use client';

import { useState } from 'react';
import { Camera, Mail, Phone, MapPin, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName?: string;
  userEmail?: string;
}

export function ProfileSettingsModal({
  open,
  onOpenChange,
  userName = 'Admin User',
  userEmail = 'admin@perisai.com',
}: ProfileSettingsModalProps) {
  const [profileData, setProfileData] = useState({
    fullName: userName,
    email: userEmail,
    phone: '+62812345678',
    location: 'Jakarta, Indonesia',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pengaturan Profil</DialogTitle>
          <DialogDescription>
            Kelola informasi profil dan pengaturan akun Anda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                {profileData.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Ukuran file maksimal: 5MB (JPG, PNG)
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="text-sm font-medium">
                Nama Lengkap
              </Label>
              <Input
                id="fullName"
                value={profileData.fullName}
                onChange={(e) =>
                  setProfileData({ ...profileData, fullName: e.target.value })
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) =>
                  setProfileData({ ...profileData, email: e.target.value })
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Nomor Telepon
              </Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) =>
                  setProfileData({ ...profileData, phone: e.target.value })
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Lokasi
              </Label>
              <Input
                id="location"
                value={profileData.location}
                onChange={(e) =>
                  setProfileData({ ...profileData, location: e.target.value })
                }
                className="mt-1"
              />
            </div>
          </div>

          {/* Success Message */}
          {saveSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span className="text-sm text-green-700 font-medium">
                Profil berhasil diperbarui
              </span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
