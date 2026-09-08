'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Camera,
  Mail,
  Lock,
  Save,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  User,
  Shield,
  Phone,
  Instagram,
  GraduationCap,
  MapPin,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { facultiesData, faculties, indonesianCities, genders } from '@/lib/profile-data';
import { getImageUrl } from '@/lib/utils';
import type { CroppedImageResult } from '@/components/profile-cropper-modal';

// Lazy load Cropper Modal so react-easy-crop is only downloaded when user clicks upload
const ProfileCropperModal = dynamic(
  () => import('@/components/profile-cropper-modal'),
  { ssr: false }
);

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
  userName = 'Admin User',
  userEmail = '',
  userRole = 'ADMIN',
}: ProfileSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'biodata' | 'keamanan'>('biodata');

  // Profile data states
  const [profileData, setProfileData] = useState({
    name: userName,
    fullName: userName,
    email: userEmail,
    role: userRole,
    prn: '',
    gender: '',
    originCity: '',
    originCityOther: '',
    domicileCity: '',
    domicileCityOther: '',
    angkatan: '',
    nim: '',
    faculty: '',
    majorProgram: '',
    phoneNumber: '',
    instagram: '',
    avatarPreview: '',
  });

  // Password data states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cropper states
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableMajors = profileData.faculty
    ? (facultiesData as Record<string, string[]>)[profileData.faculty] ?? []
    : [];

  // Load user data on open
  useEffect(() => {
    if (!open) return;

    const fetchUser = async () => {
      setIsLoadingUser(true);
      setMsg(null);
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const user = await res.json();
          setProfileData({
            name: user.name || '',
            fullName: user.fullName || user.name || '',
            email: user.email || '',
            role: user.role || userRole,
            prn: user.prn || '',
            gender: user.gender || '',
            originCity: user.originCity || '',
            originCityOther: user.originCityOther || '',
            domicileCity: user.domicileCity || '',
            domicileCityOther: user.domicileCityOther || '',
            angkatan: user.angkatan || '',
            nim: user.nim || '',
            faculty: user.faculty || '',
            majorProgram: user.majorProgram || '',
            phoneNumber: user.phoneNumber || '',
            instagram: user.instagram || '',
            avatarPreview: user.image || '',
          });
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUser();
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  }, [open, userRole]);

  const setField = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFacultyChange = (value: string) => {
    setProfileData((prev) => ({ ...prev, faculty: value, majorProgram: '' }));
  };

  // Image Selection & Cropper Trigger
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMsg({ type: 'error', text: 'File harus berupa gambar (JPG, PNG, atau WebP).' });
      e.target.value = '';
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setMsg({ type: 'error', text: 'Ukuran file mentah maksimal 15 MB.' });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setCropperOpen(true);
      e.target.value = '';
    };
    reader.onerror = () => {
      setMsg({ type: 'error', text: 'Gagal membaca file gambar.' });
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  // Callback from Canvas Cropper
  const handleCropComplete = (result: CroppedImageResult) => {
    setProfileData((prev) => ({ ...prev, avatarPreview: result.dataUrl }));
    setMsg({
      type: 'success',
      text: `Foto profil berhasil dipotong (${Math.round(result.file.size / 1024)} KB, WebP). Klik 'Simpan Perubahan' untuk menerapkan.`,
    });
  };

  const handleSave = async () => {
    setMsg(null);

    if (!profileData.name.trim()) {
      setMsg({ type: 'error', text: 'Nama tampilan tidak boleh kosong.' });
      return;
    }

    const wantsPasswordChange = !!passwordData.newPassword;
    if (wantsPasswordChange) {
      if (!passwordData.currentPassword) {
        setMsg({ type: 'error', text: 'Password lama wajib diisi untuk mengubah password.' });
        return;
      }
      if (passwordData.newPassword.length < 6) {
        setMsg({ type: 'error', text: 'Password baru minimal 6 karakter.' });
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setMsg({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' });
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload: Record<string, any> = {
        name: profileData.name.trim(),
        fullName: profileData.fullName.trim() || profileData.name.trim(),
        email: profileData.email.trim() || undefined,
        gender: profileData.gender || undefined,
        originCity: profileData.originCity || undefined,
        originCityOther: profileData.originCityOther || undefined,
        domicileCity: profileData.domicileCity || undefined,
        domicileCityOther: profileData.domicileCityOther || undefined,
        angkatan: profileData.angkatan || undefined,
        nim: profileData.nim || undefined,
        faculty: profileData.faculty || undefined,
        majorProgram: profileData.majorProgram || undefined,
        phoneNumber: profileData.phoneNumber || undefined,
        instagram: profileData.instagram || undefined,
      };

      // Only send image if it was changed to a base64 string
      if (profileData.avatarPreview && profileData.avatarPreview.startsWith('data:image/')) {
        payload.image = profileData.avatarPreview;
      }

      if (wantsPasswordChange) {
        payload.currentPassword = passwordData.currentPassword;
        payload.newPassword = passwordData.newPassword;
      }

      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: data.error || 'Gagal menyimpan perubahan profil.' });
        return;
      }

      setMsg({ type: 'success', text: 'Profil dan pengaturan berhasil diperbarui!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

      // Update avatar preview with the public URL returned by Supabase
      if (data.user?.image) {
        setProfileData((prev) => ({ ...prev, avatarPreview: data.user.image }));
      }

      // Reload window after short pause to reflect updated name/avatar across the app
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error('Save profile error:', err);
      setMsg({ type: 'error', text: 'Terjadi kesalahan jaringan saat menyimpan profil.' });
    } finally {
      setIsSaving(false);
    }
  };

  const initials = (profileData.fullName || profileData.name || 'A')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'AD';

  const isSuperAdmin = profileData.role === 'SUPER_ADMIN';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-400" />
                  Manajemen Profil Akun
                </DialogTitle>
                <DialogDescription className="text-slate-300 text-xs mt-1">
                  Kelola identitas, biodata, dan keamanan akun {isSuperAdmin ? 'Super Administrator' : 'Administrator'}
                </DialogDescription>
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  isSuperAdmin
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                }`}
              >
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </span>
            </div>

            {/* Avatar & Basic Info Banner */}
            <div className="mt-5 flex items-center gap-4">
              <div className="relative group flex-shrink-0">
                {profileData.avatarPreview ? (
                  <img
                    src={getImageUrl(profileData.avatarPreview) || ''}
                    alt="Foto Profil"
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-white/20 shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white/20 shadow-lg">
                    {initials}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-transform transform hover:scale-110 shadow-md border-2 border-slate-900"
                  title="Ubah Foto Profil"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarFileSelect}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white truncate">
                  {profileData.fullName || profileData.name || 'Nama Belum Diatur'}
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5 truncate">
                  {profileData.email || 'Email belum diatur'}
                </p>
                {profileData.prn && (
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    PRN: {profileData.prn}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-slate-200 bg-slate-50 px-6">
            <div className="flex gap-6">
              <button
                type="button"
                onClick={() => setActiveTab('biodata')}
                className={`py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === 'biodata'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-4 h-4" />
                Biodata & Profil
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('keamanan')}
                className={`py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === 'keamanan'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Shield className="w-4 h-4" />
                Keamanan & Password
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5">
            {/* Status Alert */}
            {msg && (
              <div
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs sm:text-sm font-medium ${
                  msg.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                {msg.type === 'success' ? (
                  <Check className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{msg.text}</span>
              </div>
            )}

            {isLoadingUser ? (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2 text-indigo-600" />
                <span>Memuat informasi profil...</span>
              </div>
            ) : (
              <>
                {/* ── TAB 1: BIODATA & PROFIL ── */}
                {activeTab === 'biodata' && (
                  <div className="space-y-4">
                    {/* Nama & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="prof-name" className="text-xs font-semibold text-slate-700">
                          Nama Panggilan / Display <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="prof-name"
                          value={profileData.name}
                          onChange={(e) => setField('name', e.target.value)}
                          placeholder="Nama di navbar"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="prof-fullname" className="text-xs font-semibold text-slate-700">
                          Nama Lengkap Sesuai KTM
                        </Label>
                        <Input
                          id="prof-fullname"
                          value={profileData.fullName}
                          onChange={(e) => setField('fullName', e.target.value)}
                          placeholder="Nama lengkap"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="prof-email" className="text-xs font-semibold text-slate-700">
                          Alamat Email
                        </Label>
                        <Input
                          id="prof-email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setField('email', e.target.value)}
                          placeholder="email@instansi.org"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">
                          Jenis Kelamin
                        </Label>
                        <Select
                          value={profileData.gender}
                          onValueChange={(val) => setField('gender', val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis kelamin" />
                          </SelectTrigger>
                          <SelectContent>
                            {genders.map((g) => (
                              <SelectItem key={g} value={g}>
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Akademik: Fakultas, Prodi, NIM, Angkatan */}
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-indigo-600" />
                        Informasi Akademik
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700">
                            Fakultas
                          </Label>
                          <Select
                            value={profileData.faculty}
                            onValueChange={handleFacultyChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih fakultas" />
                            </SelectTrigger>
                            <SelectContent>
                              {faculties.map((f) => (
                                <SelectItem key={f} value={f}>
                                  {f}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700">
                            Program Studi
                          </Label>
                          <Select
                            value={profileData.majorProgram}
                            onValueChange={(val) => setField('majorProgram', val)}
                            disabled={!profileData.faculty}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={profileData.faculty ? 'Pilih program studi' : 'Pilih fakultas terlebih dahulu'} />
                            </SelectTrigger>
                            <SelectContent>
                              {availableMajors.map((m) => (
                                <SelectItem key={m} value={m}>
                                  {m}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="prof-nim" className="text-xs font-semibold text-slate-700">
                            NIM / Nomor Induk
                          </Label>
                          <Input
                            id="prof-nim"
                            value={profileData.nim}
                            onChange={(e) => setField('nim', e.target.value)}
                            placeholder="Contoh: 210101..."
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="prof-angkatan" className="text-xs font-semibold text-slate-700">
                            Tahun Angkatan
                          </Label>
                          <Input
                            id="prof-angkatan"
                            value={profileData.angkatan}
                            onChange={(e) => setField('angkatan', e.target.value)}
                            placeholder="Contoh: 2022"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Domisili & Kontak */}
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        Domisili & Kontak
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700">
                            Asal Kota
                          </Label>
                          <Select
                            value={profileData.originCity}
                            onValueChange={(val) => setField('originCity', val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih kota asal" />
                            </SelectTrigger>
                            <SelectContent>
                              {indonesianCities.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {profileData.originCity === 'Lainnya' && (
                            <Input
                              className="mt-1.5"
                              placeholder="Ketik nama kota asal"
                              value={profileData.originCityOther}
                              onChange={(e) => setField('originCityOther', e.target.value)}
                            />
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700">
                            Kota Domisili Saat Ini
                          </Label>
                          <Select
                            value={profileData.domicileCity}
                            onValueChange={(val) => setField('domicileCity', val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih kota domisili" />
                            </SelectTrigger>
                            <SelectContent>
                              {indonesianCities.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {profileData.domicileCity === 'Lainnya' && (
                            <Input
                              className="mt-1.5"
                              placeholder="Ketik nama kota domisili"
                              value={profileData.domicileCityOther}
                              onChange={(e) => setField('domicileCityOther', e.target.value)}
                            />
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="prof-phone" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            Nomor WhatsApp / Telepon
                          </Label>
                          <Input
                            id="prof-phone"
                            value={profileData.phoneNumber}
                            onChange={(e) => setField('phoneNumber', e.target.value)}
                            placeholder="08xxxxxxxxxx"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="prof-ig" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <Instagram className="w-3.5 h-3.5 text-slate-500" />
                            Instagram
                          </Label>
                          <Input
                            id="prof-ig"
                            value={profileData.instagram}
                            onChange={(e) => setField('instagram', e.target.value)}
                            placeholder="@username"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: KEAMANAN & PASSWORD ── */}
                {activeTab === 'keamanan' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
                      <p className="font-semibold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-700" />
                        Petunjuk Ganti Password
                      </p>
                      <p className="text-slate-600">
                        Kosongkan kolom di bawah jika Anda tidak berniat mengganti password. Password baru minimal 6 karakter.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="pw-current" className="text-xs font-semibold text-slate-700">
                        Password Saat Ini
                      </Label>
                      <PasswordInput
                        id="pw-current"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                        }
                        placeholder="Masukkan password lama"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="pw-new" className="text-xs font-semibold text-slate-700">
                          Password Baru
                        </Label>
                        <PasswordInput
                          id="pw-new"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                          }
                          placeholder="Minimal 6 karakter"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="pw-confirm" className="text-xs font-semibold text-slate-700">
                          Konfirmasi Password Baru
                        </Label>
                        <PasswordInput
                          id="pw-confirm"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                          }
                          placeholder="Ketik ulang password baru"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="text-sm"
            >
              Tutup
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoadingUser}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow"
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
        </DialogContent>
      </Dialog>

      {/* Lightweight Client-Side Image Cropper Modal */}
      {cropperOpen && (
        <ProfileCropperModal
          open={cropperOpen}
          imageSrc={rawImageSrc}
          onClose={() => {
            setCropperOpen(false);
            setRawImageSrc(null);
          }}
          onCropCompleteResult={handleCropComplete}
          cropShape="round"
          targetSize={512}
        />
      )}
    </>
  );
}
