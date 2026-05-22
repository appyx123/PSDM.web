'use client';

import { useState, useEffect } from 'react';
import { Camera, Mail, Lock, Save, Eye, EyeOff, Check, AlertCircle, Loader2 } from 'lucide-react';
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
  userEmail = '',
}: ProfileSettingsModalProps) {
  const [profileData, setProfileData] = useState({
    name: userName,
    email: userEmail,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load latest user data when modal opens
  useEffect(() => {
    if (!open) return;
    const fetchUser = async () => {
      setIsLoadingUser(true);
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const user = await res.json();
          setProfileData({ name: user.name || '', email: user.email || '' });
        }
      } catch {
        // silently fail, use props as fallback
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUser();
    setMsg(null);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  }, [open]);

  const handleSave = async () => {
    setMsg(null);

    if (!profileData.name.trim()) {
      setMsg({ type: 'error', text: 'Nama tidak boleh kosong.' });
      return;
    }

    // Only validate password fields if user actually wants to change password
    const wantsPasswordChange = !!passwordData.newPassword;
    if (wantsPasswordChange) {
      if (!passwordData.currentPassword) {
        setMsg({ type: 'error', text: 'Masukkan password lama untuk mengubah password.' });
        return;
      }
      if (passwordData.newPassword.length < 6) {
        setMsg({ type: 'error', text: 'Password baru minimal 6 karakter.' });
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setMsg({ type: 'error', text: 'Konfirmasi password tidak cocok.' });
        return;
      }
    }

    setIsSaving(true);
    try {
      const body: any = {
        name: profileData.name.trim(),
        email: profileData.email.trim() || undefined,
      };
      if (passwordData.newPassword) {
        body.currentPassword = passwordData.currentPassword;
        body.newPassword = passwordData.newPassword;
      }

      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: data.error || 'Gagal menyimpan perubahan.' });
        return;
      }

      setMsg({ type: 'success', text: 'Profil berhasil diperbarui!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

      // Reload page after short delay so session name updates
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch {
      setMsg({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    } finally {
      setIsSaving(false);
    }
  };

  const initials = profileData.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pengaturan Akun</DialogTitle>
          <DialogDescription>
            Kelola informasi profil dan keamanan akun Anda
          </DialogDescription>
        </DialogHeader>

        {isLoadingUser ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {initials}
                </div>
              </div>
            </div>

            {/* Status Message */}
            {msg && (
              <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium ${
                msg.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {msg.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                {msg.text}
              </div>
            )}

            {/* Profile Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="prof-name" className="text-sm font-medium">Nama Lengkap</Label>
                <Input
                  id="prof-name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="mt-1"
                  placeholder="Nama lengkap"
                />
              </div>

              <div>
                <Label htmlFor="prof-email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </Label>
                <Input
                  id="prof-email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="mt-1"
                  placeholder="email@contoh.com (opsional)"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4" /> Ubah Password
              </p>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="cur-pw" className="text-xs text-slate-500">Password Saat Ini</Label>
                  <div className="relative mt-1">
                    <Input
                      id="cur-pw"
                      type={showCurrentPw ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Kosongkan jika tidak mengubah password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="new-pw" className="text-xs text-slate-500">Password Baru</Label>
                  <div className="relative mt-1">
                    <Input
                      id="new-pw"
                      type={showNewPw ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Minimal 6 karakter"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="conf-pw" className="text-xs text-slate-500">Konfirmasi Password Baru</Label>
                  <div className="relative mt-1">
                    <Input
                      id="conf-pw"
                      type={showConfirmPw ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Ulangi password baru"
                      className={`pr-10 ${
                        passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                          ? 'border-red-400 focus-visible:ring-red-400'
                          : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Password tidak cocok</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={isSaving}
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
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
        )}
      </DialogContent>
    </Dialog>
  );
}
