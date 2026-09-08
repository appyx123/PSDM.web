'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Camera,
  Mail,
  Lock,
  Save,
  Check,
  AlertCircle,
  Loader2,
  User,
  Shield,
  Phone,
  Instagram,
  Linkedin,
  GraduationCap,
  MapPin,
  Calendar,
  Hash,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { facultiesData, faculties, indonesianCities, genders } from '@/lib/profile-data';
import { getImageUrl } from '@/lib/utils';
import { profileFormSchema, type ProfileFormValues } from '@/lib/validations/profile';
import type { CroppedImageResult } from '@/components/profile-cropper-modal';

// Lazy-load cropper modal so react-easy-crop is only fetched client-side on demand
const ProfileCropperModal = dynamic(
  () => import('@/components/profile-cropper-modal'),
  { ssr: false }
);

export interface UniversalProfileFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export function UniversalProfileForm({
  onSuccess,
  onCancel,
  isModal = false,
}: UniversalProfileFormProps) {
  const [activeTab, setActiveTab] = useState<'biodata' | 'keamanan'>('biodata');

  // Form State
  const [formData, setFormData] = useState<{
    prn: string;
    fullName: string;
    email: string;
    role: string;
    gender: string;
    generation: string;
    birthPlace: string;
    birthDate: string;
    faculty: string;
    majorProgram: string;
    nim: string;
    angkatan: string;
    domicileAddress: string;
    originCity: string;
    originCityOther: string;
    phoneNumber: string;
    linkedin: string;
    instagram: string;
    avatarPreview: string;
  }>({
    prn: '',
    fullName: '',
    email: '',
    role: '',
    gender: '',
    generation: '',
    birthPlace: '',
    birthDate: '',
    faculty: '',
    majorProgram: '',
    nim: '',
    angkatan: '',
    domicileAddress: '',
    originCity: '',
    originCityOther: '',
    phoneNumber: '',
    linkedin: '',
    instagram: '',
    avatarPreview: '',
  });

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [globalMsg, setGlobalMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cropper states
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableMajors = formData.faculty
    ? (facultiesData as Record<string, string[]>)[formData.faculty] ?? []
    : [];

  // Fetch current user profile
  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
      setIsLoadingUser(true);
      setGlobalMsg(null);
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const user = await res.json();
          if (isMounted) {
            setFormData({
              prn: user.prn || '',
              fullName: user.fullName || user.name || '',
              email: user.email || '',
              role: user.role || 'PENGURUS',
              gender: user.gender || '',
              generation: user.generation !== null && user.generation !== undefined ? String(user.generation) : '',
              birthPlace: user.birthPlace || '',
              birthDate: user.birthDate || '',
              faculty: user.faculty || '',
              majorProgram: user.majorProgram || '',
              nim: user.nim || '',
              angkatan: user.angkatan || '',
              domicileAddress: user.domicileAddress || '',
              originCity: user.originCity || '',
              originCityOther: user.originCityOther || '',
              phoneNumber: user.phoneNumber || '',
              linkedin: user.linkedin || '',
              instagram: user.instagram || '',
              avatarPreview: user.image || '',
            });
          }
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
        if (isMounted) {
          setGlobalMsg({ type: 'error', text: 'Gagal memuat profil pengguna dari server.' });
        }
      } finally {
        if (isMounted) setIsLoadingUser(false);
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const setFieldValue = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when user types
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleFacultyChange = (value: string) => {
    setFormData((prev) => ({ ...prev, faculty: value, majorProgram: '' }));
    if (fieldErrors.faculty) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.faculty;
        return next;
      });
    }
  };

  // Image Cropper Trigger
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setGlobalMsg({ type: 'error', text: 'File harus berupa gambar (JPG, PNG, atau WebP).' });
      e.target.value = '';
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setGlobalMsg({ type: 'error', text: 'Ukuran file mentah maksimal 15 MB.' });
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
      setGlobalMsg({ type: 'error', text: 'Gagal membaca file gambar.' });
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (result: CroppedImageResult) => {
    setFormData((prev) => ({ ...prev, avatarPreview: result.dataUrl }));
    setGlobalMsg({
      type: 'success',
      text: `Foto profil berhasil dipotong (${Math.round(result.file.size / 1024)} KB). Simpan profil untuk menerapkan.`,
    });
  };

  const handleSave = async () => {
    setGlobalMsg(null);
    setFieldErrors({});

    // 1. Validate Profile Fields using Zod
    const validationResult = profileFormSchema.safeParse({
      prn: formData.prn,
      fullName: formData.fullName,
      email: formData.email,
      gender: formData.gender,
      generation: formData.generation,
      birthPlace: formData.birthPlace,
      birthDate: formData.birthDate,
      faculty: formData.faculty,
      majorProgram: formData.majorProgram,
      nim: formData.nim,
      angkatan: formData.angkatan,
      phoneNumber: formData.phoneNumber,
      domicileAddress: formData.domicileAddress,
      originCity: formData.originCity,
      originCityOther: formData.originCityOther,
      linkedin: formData.linkedin,
      instagram: formData.instagram,
    });

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        const fieldName = String(issue.path[0]);
        if (!errors[fieldName]) {
          errors[fieldName] = issue.message;
        }
      }
      setFieldErrors(errors);
      setGlobalMsg({
        type: 'error',
        text: 'Mohon lengkapi semua field wajib dengan benar sebelum menyimpan.',
      });
      // Switch back to biodata tab if errors are there
      setActiveTab('biodata');
      return;
    }

    // 2. Validate Password if user wants to change
    const wantsPasswordChange = !!passwordData.newPassword;
    if (wantsPasswordChange) {
      if (!passwordData.currentPassword) {
        setFieldErrors((prev) => ({ ...prev, currentPassword: 'Password lama wajib diisi.' }));
        setActiveTab('keamanan');
        setGlobalMsg({ type: 'error', text: 'Password lama wajib diisi untuk mengganti password.' });
        return;
      }
      if (passwordData.newPassword.length < 6) {
        setFieldErrors((prev) => ({ ...prev, newPassword: 'Password baru minimal 6 karakter.' }));
        setActiveTab('keamanan');
        setGlobalMsg({ type: 'error', text: 'Password baru minimal 6 karakter.' });
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Konfirmasi password baru tidak cocok.' }));
        setActiveTab('keamanan');
        setGlobalMsg({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' });
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload: Record<string, any> = {
        name: formData.fullName.trim(),
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        gender: formData.gender,
        generation: parseInt(formData.generation.trim(), 10),
        birthPlace: formData.birthPlace.trim(),
        birthDate: formData.birthDate.trim(),
        faculty: formData.faculty,
        majorProgram: formData.majorProgram,
        nim: formData.nim.trim(),
        angkatan: formData.angkatan.trim(),
        domicileAddress: formData.domicileAddress.trim(),
        originCity: formData.originCity || undefined,
        originCityOther: formData.originCity === 'Lainnya' ? formData.originCityOther : undefined,
        phoneNumber: formData.phoneNumber.trim(),
        linkedin: formData.linkedin?.trim() || undefined,
        instagram: formData.instagram?.trim() || undefined,
      };

      // Only send image data if newly cropped base64
      if (formData.avatarPreview && formData.avatarPreview.startsWith('data:image/')) {
        payload.image = formData.avatarPreview;
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
        setGlobalMsg({ type: 'error', text: data.error || 'Gagal menyimpan profil.' });
        return;
      }

      setGlobalMsg({ type: 'success', text: 'Profil berhasil diperbarui dengan sukses!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

      if (data.user?.image) {
        setFormData((prev) => ({ ...prev, avatarPreview: data.user.image }));
      }

      if (onSuccess) {
        onSuccess();
      }

      // Small delay then trigger page refresh to sync header/navbar avatar & name
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.error('Save profile error:', err);
      setGlobalMsg({ type: 'error', text: 'Terjadi kesalahan jaringan saat menyimpan profil.' });
    } finally {
      setIsSaving(false);
    }
  };

  const initials = (formData.fullName || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  const roleLabel =
    formData.role === 'SUPER_ADMIN'
      ? 'Super Admin'
      : formData.role === 'ADMIN'
      ? 'Admin'
      : 'Pengurus';

  const roleBadgeStyle =
    formData.role === 'SUPER_ADMIN'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      : formData.role === 'ADMIN'
      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

  return (
    <div className="space-y-6">
      {/* ── HEADER & AVATAR BANNER ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar with Cropper Trigger */}
          <div className="relative group flex-shrink-0">
            {formData.avatarPreview ? (
              <img
                src={getImageUrl(formData.avatarPreview) || ''}
                alt="Foto Profil"
                className="w-24 h-24 rounded-full object-cover ring-4 ring-white/20 shadow-xl transition-all duration-300 group-hover:brightness-90"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white/20 shadow-xl">
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all duration-200 transform hover:scale-110 shadow-lg border-2 border-slate-900"
              title="Ubah Foto Profil (Crop & Pan)"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarSelect}
            />
          </div>

          {/* User Info Overview */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                {formData.fullName || 'Nama Lengkap'}
              </h2>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${roleBadgeStyle}`}
              >
                {roleLabel}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-indigo-200/80 mt-1 truncate">
              {formData.email || 'Email belum diisi'}
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-md font-mono text-indigo-100 border border-white/10">
                <Lock className="w-3 h-3 text-indigo-300" />
                PRN: {formData.prn || '-'}
              </span>
              {formData.generation && (
                <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-md text-indigo-100 border border-white/10">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Gen {formData.generation}
                </span>
              )}
              {formData.angkatan && (
                <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-md text-indigo-100 border border-white/10">
                  <GraduationCap className="w-3 h-3 text-indigo-300" />
                  Angkatan {formData.angkatan}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS NAVIGATION ── */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('biodata')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'biodata'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          Biodata & Informasi Profil
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('keamanan')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'keamanan'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          Keamanan & Password
        </button>
      </div>

      {/* ── GLOBAL MESSAGE ── */}
      {globalMsg && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-medium ${
            globalMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {globalMsg.type === 'success' ? (
            <Check className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          )}
          <div className="flex-1">{globalMsg.text}</div>
        </div>
      )}

      {isLoadingUser ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium">Memuat biodata dan profil lengkap...</p>
        </div>
      ) : (
        <>
          {/* ════════ TAB 1: BIODATA & PROFIL ════════ */}
          {activeTab === 'biodata' && (
            <div className="space-y-6">
              {/* CARD 1: IDENTITAS UTAMA */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    Identitas Utama & Akun
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Identitas pokok pengurus dan akun PERISAI.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* PRN / ID PERISAI (Read-only) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="prof-prn" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                        <span>
                          ID PERISAI / PRN <span className="text-rose-500">*</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-400" /> Read-only
                        </span>
                      </Label>
                      <Input
                        id="prof-prn"
                        value={formData.prn}
                        readOnly
                        disabled
                        className="bg-slate-100 text-slate-600 font-mono cursor-not-allowed border-slate-200 font-semibold"
                      />
                    </div>

                    {/* Nama Lengkap */}
                    <div className="space-y-1.5">
                      <Label htmlFor="prof-fullname" className="text-xs font-semibold text-slate-700">
                        Nama Lengkap (Sesuai KTM) <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="prof-fullname"
                        value={formData.fullName}
                        onChange={(e) => setFieldValue('fullName', e.target.value)}
                        placeholder="Contoh: Muhammad Rayhan"
                        className={fieldErrors.fullName ? 'border-rose-400 focus-visible:ring-rose-400' : ''}
                      />
                      {fieldErrors.fullName && (
                        <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.fullName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Email */}
                    <div className="space-y-1.5">
                      <Label htmlFor="prof-email" className="text-xs font-semibold text-slate-700">
                        Alamat Email <span className="text-rose-500">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          id="prof-email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFieldValue('email', e.target.value)}
                          placeholder="nama@domain.org"
                          className={`pl-9 ${fieldErrors.email ? 'border-rose-400 focus-visible:ring-rose-400' : ''}`}
                        />
                      </div>
                      {fieldErrors.email && (
                        <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.email}</p>
                      )}
                    </div>

                    {/* Jenis Kelamin */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Jenis Kelamin <span className="text-rose-500">*</span>
                      </Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(val) => setFieldValue('gender', val)}
                      >
                        <SelectTrigger className={fieldErrors.gender ? 'border-rose-400' : ''}>
                          <SelectValue placeholder="Pilih Jenis Kelamin" />
                        </SelectTrigger>
                        <SelectContent>
                          {genders.map((g) => (
                            <SelectItem key={g} value={g}>
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.gender && (
                        <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.gender}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 2: KELAHIRAN & GENERASI */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Kelahiran & Generasi
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Informasi generasi kepengurusan dan tanggal kelahiran.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Generasi (Wajib Angka) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="prof-gen" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5 text-slate-400" />
                        Generasi (Angka) <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="prof-gen"
                        type="number"
                        min="1"
                        step="1"
                        value={formData.generation}
                        onChange={(e) => setFieldValue('generation', e.target.value)}
                        placeholder="Contoh: 10, 20, 23"
                        className={fieldErrors.generation ? 'border-rose-400 focus-visible:ring-rose-400' : ''}
                      />
                      {fieldErrors.generation ? (
                        <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.generation}</p>
                      ) : (
                        <p className="text-[10px] text-slate-500">Hanya angka (misal: 23)</p>
                      )}
                    </div>

                    {/* Tempat Lahir */}
                    <div className="space-y-1.5">
                      <Label htmlFor="prof-birthplace" className="text-xs font-semibold text-slate-700">
                        Tempat Lahir <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="prof-birthplace"
                        value={formData.birthPlace}
                        onChange={(e) => setFieldValue('birthPlace', e.target.value)}
                        placeholder="Kota tempat lahir"
                        className={fieldErrors.birthPlace ? 'border-rose-400 focus-visible:ring-rose-400' : ''}
                      />
                      {fieldErrors.birthPlace && (
                        <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.birthPlace}</p>
                      )}
                    </div>

                    {/* Tanggal Lahir */}
                    <div className="space-y-1.5">
                      <Label htmlFor="prof-birthdate" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Tanggal Lahir <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="prof-birthdate"
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFieldValue('birthDate', e.target.value)}
                        className={fieldErrors.birthDate ? 'border-rose-400 focus-visible:ring-rose-400' : ''}
                      />
                      {fieldErrors.birthDate && (
                        <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.birthDate}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 3: DATA AKADEMIK */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    Informasi Akademik
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Fakultas, program studi, NIM, dan tahun angkatan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Fakultas */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Fakultas <span className="text-rose-500">*</span>
                      </Label>
                      <Select
                        value={formData.faculty}
                        onValueChange={handleFacultyChange}
                      >
                        <SelectTrigger className={fieldErrors.faculty ? 'border-rose-400' : ''}>
                          <SelectValue placeholder="Pilih Fakultas" />
                        </SelectTrigger>
                        <SelectContent>
                          {faculties.map((f) => (
                            <SelectItem key={f} value={f}>
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.faculty && (
                        <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.faculty}</p>
                      )}
                    </div>

                    {/* Program Studi */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Program Studi <span className="text-rose-500">*</span>
                      </Label>
                      <Select
                        value={formData.majorProgram}
                        onValueChange={(val) => setFieldValue('majorProgram', val)}
                        disabled={!formData.faculty}
                      >
                        <SelectTrigger className={fieldErrors.majorProgram ? 'border-rose-400' : ''}>
                          <SelectValue placeholder={formData.faculty ? 'Pilih Program Studi' : 'Pilih Fakultas terlebih dahulu'} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMajors.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.majorProgram && (
                        <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.majorProgram}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* NIM */}
                    <div className="space-y-1.5">
                      <Label htmlFor="prof-nim" className="text-xs font-semibold text-slate-700">
                        NIM (Nomor Induk Mahasiswa) <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="prof-nim"
                        value={formData.nim}
                        onChange={(e) => setFieldValue('nim', e.target.value)}
                        placeholder="Contoh: 2108561001"
                        className={fieldErrors.nim ? 'border-rose-400 focus-visible:ring-rose-400' : ''}
                      />
                      {fieldErrors.nim && (
                        <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.nim}</p>
                      )}
                    </div>

                    {/* Tahun Angkatan */}
                    <div className="space-y-1.5">
                      <Label htmlFor="prof-angkatan" className="text-xs font-semibold text-slate-700">
                        Tahun Angkatan <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="prof-angkatan"
                        value={formData.angkatan}
                        onChange={(e) => setFieldValue('angkatan', e.target.value)}
                        placeholder="Contoh: 2022"
                        className={fieldErrors.angkatan ? 'border-rose-400 focus-visible:ring-rose-400' : ''}
                      />
                      {fieldErrors.angkatan && (
                        <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.angkatan}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 4: DOMISILI & KONTAK */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    Domisili & Kontak
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Alamat domisili lengkap dan kontak yang dapat dihubungi.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Alamat Domisili Lengkap (Wajib) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-domicile" className="text-xs font-semibold text-slate-700">
                      Alamat Domisili Lengkap <span className="text-rose-500">*</span>
                    </Label>
                    <Textarea
                      id="prof-domicile"
                      rows={3}
                      value={formData.domicileAddress}
                      onChange={(e) => setFieldValue('domicileAddress', e.target.value)}
                      placeholder="Tuliskan alamat domisili lengkap saat ini (Nama Jalan, No. Rumah / Kost, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten)"
                      className={fieldErrors.domicileAddress ? 'border-rose-400 focus-visible:ring-rose-400' : ''}
                    />
                    {fieldErrors.domicileAddress && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.domicileAddress}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nomor Telepon / WA */}
                    <div className="space-y-1.5">
                      <Label htmlFor="prof-phone" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        No. WhatsApp / Telepon <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="prof-phone"
                        value={formData.phoneNumber}
                        onChange={(e) => setFieldValue('phoneNumber', e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className={fieldErrors.phoneNumber ? 'border-rose-400 focus-visible:ring-rose-400' : ''}
                      />
                      {fieldErrors.phoneNumber && (
                        <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.phoneNumber}</p>
                      )}
                    </div>

                    {/* Asal Kota/Daerah (Opsional) */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Asal Daerah / Kota Asal <span className="text-slate-400 font-normal">(Opsional)</span>
                      </Label>
                      <Select
                        value={formData.originCity}
                        onValueChange={(val) => setFieldValue('originCity', val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kota asal (opsional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {indonesianCities.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.originCity === 'Lainnya' && (
                        <Input
                          className="mt-1.5"
                          placeholder="Ketik nama kota asal"
                          value={formData.originCityOther}
                          onChange={(e) => setFieldValue('originCityOther', e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Media Sosial (LinkedIn & Instagram) - Keduanya Opsional */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="prof-linkedin" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Linkedin className="w-3.5 h-3.5 text-indigo-600" />
                        LinkedIn <span className="text-slate-400 font-normal">(Opsional)</span>
                      </Label>
                      <Input
                        id="prof-linkedin"
                        value={formData.linkedin}
                        onChange={(e) => setFieldValue('linkedin', e.target.value)}
                        placeholder="URL atau username LinkedIn"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="prof-instagram" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Instagram className="w-3.5 h-3.5 text-pink-600" />
                        Instagram <span className="text-slate-400 font-normal">(Opsional)</span>
                      </Label>
                      <Input
                        id="prof-instagram"
                        value={formData.instagram}
                        onChange={(e) => setFieldValue('instagram', e.target.value)}
                        placeholder="@username"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ════════ TAB 2: KEAMANAN & PASSWORD ════════ */}
          {activeTab === 'keamanan' && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  Keamanan & Ganti Password
                </CardTitle>
                <CardDescription className="text-xs">
                  Kosongkan kolom di bawah jika Anda tidak ingin mengganti kata sandi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-700" />
                    Ketentuan Kata Sandi
                  </p>
                  <p className="text-amber-800/90">
                    Kata sandi baru minimal harus terdiri dari 6 karakter. Pastikan Anda mengingat atau mencatat kata sandi baru ini.
                  </p>
                </div>

                <div className="space-y-1.5 max-w-md">
                  <Label htmlFor="prof-pw-cur" className="text-xs font-semibold text-slate-700">
                    Password Saat Ini
                  </Label>
                  <PasswordInput
                    id="prof-pw-cur"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                    }
                    placeholder="Masukkan password saat ini"
                    className={fieldErrors.currentPassword ? 'border-rose-400' : ''}
                  />
                  {fieldErrors.currentPassword && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.currentPassword}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-pw-new" className="text-xs font-semibold text-slate-700">
                      Password Baru
                    </Label>
                    <PasswordInput
                      id="prof-pw-new"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                      }
                      placeholder="Minimal 6 karakter"
                      className={fieldErrors.newPassword ? 'border-rose-400' : ''}
                    />
                    {fieldErrors.newPassword && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.newPassword}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="prof-pw-conf" className="text-xs font-semibold text-slate-700">
                      Konfirmasi Password Baru
                    </Label>
                    <PasswordInput
                      id="prof-pw-conf"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                      }
                      placeholder="Ketik ulang password baru"
                      className={fieldErrors.confirmPassword ? 'border-rose-400' : ''}
                    />
                    {fieldErrors.confirmPassword && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── ACTION FOOTER ── */}
          <div className="pt-3 flex items-center justify-end gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSaving}
                className="text-sm border-slate-300 hover:bg-slate-100"
              >
                Batal
              </Button>
            )}
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoadingUser}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md px-6"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan Profil...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {/* ── LIGHTWEIGHT CLIENT-SIDE IMAGE CROPPER MODAL ── */}
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
    </div>
  );
}
