'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Shield, Camera, Check, AlertCircle, Save, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { facultiesData, faculties, indonesianCities, genders } from '@/lib/profile-data';

interface ProfileFormData {
  fullName: string;
  gender: string;
  originCity: string;
  originCityOther: string;
  domicileCity: string;
  domicileCityOther: string;
  angkatan: string;
  nim: string;
  faculty: string;
  majorProgram: string;
  phoneNumber: string;
  instagram: string;
  avatarPreview: string;
}

const EMPTY_PROFILE: ProfileFormData = {
  fullName: '', gender: '', originCity: '', originCityOther: '',
  domicileCity: '', domicileCityOther: '', angkatan: '', nim: '',
  faculty: '', majorProgram: '', phoneNumber: '', instagram: '', avatarPreview: '',
};

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
}

export function PengurusSettingsView() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profil' | 'keamanan'>('profil');
  const [profileData, setProfileData] = useState<ProfileFormData>(EMPTY_PROFILE);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [isSavingPw, setIsSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableMajors = profileData.faculty
    ? (facultiesData as Record<string, string[]>)[profileData.faculty] ?? []
    : [];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/pengurus/profile');
        if (res.ok) {
          const data = await res.json();
          setProfileData({
            fullName: data.fullName || data.name || '',
            gender: data.gender || '',
            originCity: data.originCity || '',
            originCityOther: data.originCityOther || '',
            domicileCity: data.domicileCity || '',
            domicileCityOther: data.domicileCityOther || '',
            angkatan: data.angkatan || '',
            nim: data.nim || '',
            faculty: data.faculty || '',
            majorProgram: data.majorProgram || '',
            phoneNumber: data.phoneNumber || '',
            instagram: data.instagram || '',
            avatarPreview: data.image || '',
          });
        }
      } catch (error) { /* silent */ } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const setField = (field: keyof ProfileFormData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (profileErrors[field]) setProfileErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  };

  const handleFacultyChange = (value: string) => {
    setProfileData(prev => ({ ...prev, faculty: value, majorProgram: '' }));
    if (profileErrors.faculty) setProfileErrors(prev => { const e = { ...prev }; delete e.faculty; return e; });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ type: 'error', text: 'Ukuran foto maksimal 5MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => setField('avatarPreview', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const validateProfile = () => {
    const e: Record<string, string> = {};
    if (!profileData.fullName.trim()) e.fullName = 'Nama lengkap wajib diisi';
    if (!profileData.gender) e.gender = 'Jenis kelamin wajib dipilih';
    if (!profileData.originCity) e.originCity = 'Asal kota wajib dipilih';
    if (profileData.originCity === 'Lainnya' && !profileData.originCityOther.trim()) e.originCityOther = 'Asal kota harus diisi';
    if (!profileData.domicileCity) e.domicileCity = 'Kota domisili wajib dipilih';
    if (profileData.domicileCity === 'Lainnya' && !profileData.domicileCityOther.trim()) e.domicileCityOther = 'Kota domisili harus diisi';
    if (!profileData.angkatan.trim()) e.angkatan = 'Angkatan wajib diisi';
    if (!profileData.nim.trim()) e.nim = 'NIM wajib diisi';
    if (!profileData.faculty) e.faculty = 'Fakultas wajib dipilih';
    if (!profileData.majorProgram) e.majorProgram = 'Program studi wajib dipilih';
    if (!profileData.phoneNumber.trim()) e.phoneNumber = 'Nomor WA/telepon wajib diisi';
    if (profileData.phoneNumber && !/^\+?[0-9\s\-()+]*$/.test(profileData.phoneNumber)) e.phoneNumber = 'Format nomor telepon tidak valid';
    if (profileData.instagram && !profileData.instagram.startsWith('@')) e.instagram = 'Username Instagram harus dimulai dengan @';
    setProfileErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;
    setIsSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch('/api/pengurus/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: profileData.fullName,
          gender: profileData.gender,
          originCity: profileData.originCity,
          originCityOther: profileData.originCityOther,
          domicileCity: profileData.domicileCity,
          domicileCityOther: profileData.domicileCityOther,
          angkatan: profileData.angkatan,
          nim: profileData.nim,
          faculty: profileData.faculty,
          majorProgram: profileData.majorProgram,
          phoneNumber: profileData.phoneNumber,
          instagram: profileData.instagram,
          image: profileData.avatarPreview,
        }),
      });
      if (res.ok) {
        setProfileMsg({ type: 'success', text: 'Profil berhasil disimpan.' });
      } else {
        const d = await res.json();
        setProfileMsg({ type: 'error', text: d.error || 'Gagal menyimpan profil.' });
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const validatePassword = () => {
    const e: Record<string, string> = {};
    if (!pwForm.current) e.current = 'Password lama wajib diisi';
    if (!pwForm.next) e.next = 'Password baru wajib diisi';
    else if (pwForm.next.length < 6) e.next = 'Password baru minimal 6 karakter';
    if (!pwForm.confirm) e.confirm = 'Konfirmasi password wajib diisi';
    else if (pwForm.next !== pwForm.confirm) e.confirm = 'Konfirmasi password tidak cocok';
    setPwErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;
    setIsSavingPw(true);
    setPwMsg(null);
    try {
      const res = await fetch('/api/pengurus/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      if (res.ok) {
        setPwMsg({ type: 'success', text: 'Password berhasil diubah.' });
        setPwForm({ current: '', next: '', confirm: '' });
      } else {
        const d = await res.json();
        setPwMsg({ type: 'error', text: d.error || 'Gagal mengubah password.' });
      }
    } catch {
      setPwMsg({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    } finally {
      setIsSavingPw(false);
    }
  };

  const tabs = [
    { id: 'profil' as const, label: 'Profil', icon: User },
    { id: 'keamanan' as const, label: 'Keamanan', icon: Shield },
  ];

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push('/')}
          className="rounded-full hover:bg-slate-200"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengaturan</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola profil dan keamanan akun Anda</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB PROFIL ── */}
      {activeTab === 'profil' && (
        <div className="space-y-6">
          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat data profil...
            </div>
          ) : (
            <>
              {/* Avatar */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-5">
                    <div className="relative flex-shrink-0">
                      {profileData.avatarPreview ? (
                        <img src={profileData.avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover ring-2 ring-indigo-200" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold ring-2 ring-indigo-200">
                          {getInitials(profileData.fullName)}
                        </div>
                      )}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors shadow"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{profileData.fullName || 'Nama Belum Diisi'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Klik ikon kamera untuk mengubah foto</p>
                      <p className="text-xs text-slate-400">JPG, PNG, atau WebP · Maks 5MB</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Toast */}
              {profileMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium ${
                  profileMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {profileMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {profileMsg.text}
                </div>
              )}

              {/* Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informasi Pribadi</CardTitle>
                  <CardDescription>Field bertanda <span className="text-red-500">*</span> wajib diisi.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Nama Lengkap */}
                  <div>
                    <Label htmlFor="fullName">Nama Lengkap <span className="text-red-500">*</span></Label>
                    <Input id="fullName" className={`mt-1 ${profileErrors.fullName ? 'border-red-500' : ''}`} placeholder="Masukkan nama lengkap" value={profileData.fullName} onChange={e => setField('fullName', e.target.value)} />
                    <FieldError msg={profileErrors.fullName} />
                  </div>

                  {/* Jenis Kelamin */}
                  <div>
                    <Label>Jenis Kelamin <span className="text-red-500">*</span></Label>
                    <Select value={profileData.gender} onValueChange={v => setField('gender', v)}>
                      <SelectTrigger className={`mt-1 ${profileErrors.gender ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>
                      <SelectContent>
                        {genders.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FieldError msg={profileErrors.gender} />
                  </div>

                  {/* Asal Kota */}
                  <div>
                    <Label>Asal Kota <span className="text-red-500">*</span></Label>
                    <Select value={profileData.originCity} onValueChange={v => setField('originCity', v)}>
                      <SelectTrigger className={`mt-1 ${profileErrors.originCity ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Pilih asal kota" />
                      </SelectTrigger>
                      <SelectContent>
                        {indonesianCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FieldError msg={profileErrors.originCity} />
                    {profileData.originCity === 'Lainnya' && (
                      <Input className={`mt-2 ${profileErrors.originCityOther ? 'border-red-500' : ''}`} placeholder="Tulis asal kota Anda" value={profileData.originCityOther} onChange={e => setField('originCityOther', e.target.value)} />
                    )}
                    <FieldError msg={profileErrors.originCityOther} />
                  </div>

                  {/* Kota Domisili */}
                  <div>
                    <Label>Kota Domisili <span className="text-red-500">*</span></Label>
                    <Select value={profileData.domicileCity} onValueChange={v => setField('domicileCity', v)}>
                      <SelectTrigger className={`mt-1 ${profileErrors.domicileCity ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Pilih kota domisili" />
                      </SelectTrigger>
                      <SelectContent>
                        {indonesianCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FieldError msg={profileErrors.domicileCity} />
                    {profileData.domicileCity === 'Lainnya' && (
                      <Input className={`mt-2 ${profileErrors.domicileCityOther ? 'border-red-500' : ''}`} placeholder="Tulis kota domisili Anda" value={profileData.domicileCityOther} onChange={e => setField('domicileCityOther', e.target.value)} />
                    )}
                    <FieldError msg={profileErrors.domicileCityOther} />
                  </div>

                  {/* Angkatan & NIM */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="angkatan">Angkatan <span className="text-red-500">*</span></Label>
                      <Input id="angkatan" className={`mt-1 ${profileErrors.angkatan ? 'border-red-500' : ''}`} placeholder="Contoh: 2022" value={profileData.angkatan} onChange={e => setField('angkatan', e.target.value)} />
                      <FieldError msg={profileErrors.angkatan} />
                    </div>
                    <div>
                      <Label htmlFor="nim">NIM <span className="text-red-500">*</span></Label>
                      <Input id="nim" className={`mt-1 ${profileErrors.nim ? 'border-red-500' : ''}`} placeholder="Nomor Induk Mahasiswa" value={profileData.nim} onChange={e => setField('nim', e.target.value)} />
                      <FieldError msg={profileErrors.nim} />
                    </div>
                  </div>

                  {/* Fakultas & Prodi */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Fakultas <span className="text-red-500">*</span></Label>
                      <Select value={profileData.faculty} onValueChange={handleFacultyChange}>
                        <SelectTrigger className={`mt-1 ${profileErrors.faculty ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Pilih fakultas" />
                        </SelectTrigger>
                        <SelectContent>
                          {faculties.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FieldError msg={profileErrors.faculty} />
                    </div>
                    <div>
                      <Label>Program Studi <span className="text-red-500">*</span></Label>
                      <Select value={profileData.majorProgram} onValueChange={v => setField('majorProgram', v)} disabled={!profileData.faculty}>
                        <SelectTrigger className={`mt-1 ${profileErrors.majorProgram ? 'border-red-500' : ''} ${!profileData.faculty ? 'opacity-50' : ''}`}>
                          <SelectValue placeholder={profileData.faculty ? 'Pilih prodi' : 'Pilih fakultas dulu'} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMajors.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FieldError msg={profileErrors.majorProgram} />
                    </div>
                  </div>

                  {/* Kontak & Instagram */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phoneNumber">Nomor WA/Telepon <span className="text-red-500">*</span></Label>
                      <Input id="phoneNumber" type="tel" className={`mt-1 ${profileErrors.phoneNumber ? 'border-red-500' : ''}`} placeholder="+62812..." value={profileData.phoneNumber} onChange={e => setField('phoneNumber', e.target.value)} />
                      <FieldError msg={profileErrors.phoneNumber} />
                    </div>
                    <div>
                      <Label htmlFor="instagram">Akun Instagram</Label>
                      <Input id="instagram" className={`mt-1 ${profileErrors.instagram ? 'border-red-500' : ''}`} placeholder="@username" value={profileData.instagram} onChange={e => setField('instagram', e.target.value)} />
                      <FieldError msg={profileErrors.instagram} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Save button */}
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
                  {isSavingProfile ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : <><Save className="w-4 h-4 mr-2" />Simpan Profil</>}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB KEAMANAN ── */}
      {activeTab === 'keamanan' && (
        <div className="space-y-6">
          {pwMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium ${
              pwMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {pwMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {pwMsg.text}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ganti Password</CardTitle>
              <CardDescription>Gunakan password yang kuat dan tidak mudah ditebak.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Password Lama */}
              <div>
                <Label htmlFor="currentPw">Password Lama <span className="text-red-500">*</span></Label>
                <div className="relative mt-1">
                  <Input
                    id="currentPw"
                    type={showPw.current ? 'text' : 'password'}
                    className={`pr-10 ${pwErrors.current ? 'border-red-500' : ''}`}
                    placeholder="Masukkan password lama"
                    value={pwForm.current}
                    onChange={e => { setPwForm(p => ({ ...p, current: e.target.value })); if (pwErrors.current) setPwErrors(p => { const x = { ...p }; delete x.current; return x; }); }}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowPw(p => ({ ...p, current: !p.current }))}>
                    {showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError msg={pwErrors.current} />
              </div>

              {/* Password Baru */}
              <div>
                <Label htmlFor="newPw">Password Baru <span className="text-red-500">*</span></Label>
                <div className="relative mt-1">
                  <Input
                    id="newPw"
                    type={showPw.next ? 'text' : 'password'}
                    className={`pr-10 ${pwErrors.next ? 'border-red-500' : ''}`}
                    placeholder="Min. 6 karakter"
                    value={pwForm.next}
                    onChange={e => { setPwForm(p => ({ ...p, next: e.target.value })); if (pwErrors.next) setPwErrors(p => { const x = { ...p }; delete x.next; return x; }); }}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowPw(p => ({ ...p, next: !p.next }))}>
                    {showPw.next ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError msg={pwErrors.next} />
              </div>

              {/* Konfirmasi */}
              <div>
                <Label htmlFor="confirmPw">Konfirmasi Password Baru <span className="text-red-500">*</span></Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPw"
                    type={showPw.confirm ? 'text' : 'password'}
                    className={`pr-10 ${pwErrors.confirm ? 'border-red-500' : ''}`}
                    placeholder="Ulangi password baru"
                    value={pwForm.confirm}
                    onChange={e => { setPwForm(p => ({ ...p, confirm: e.target.value })); if (pwErrors.confirm) setPwErrors(p => { const x = { ...p }; delete x.confirm; return x; }); }}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}>
                    {showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError msg={pwErrors.confirm} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleChangePassword} disabled={isSavingPw} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
              {isSavingPw ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : <><Shield className="w-4 h-4 mr-2" />Ubah Password</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
