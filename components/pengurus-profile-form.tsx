'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { facultiesData, faculties, indonesianCities, genders } from '@/lib/profile-data';
import { AlertCircle, Check } from 'lucide-react';

export interface PengurusProfileData {
  fullName: string;
  gender: string;
  originCity: string;
  originCityOther?: string;
  domicileCity: string;
  domicileCityOther?: string;
  angkatan: string;
  nim: string;
  faculty: string;
  majorProgram: string;
  phoneNumber: string;
  instagram: string;
}

interface PengurusProfileFormProps {
  initialData?: Partial<PengurusProfileData>;
  onSubmit: (data: PengurusProfileData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function PengurusProfileForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: PengurusProfileFormProps) {
  const [formData, setFormData] = useState<PengurusProfileData>({
    fullName: initialData?.fullName || '',
    gender: initialData?.gender || '',
    originCity: initialData?.originCity || '',
    originCityOther: initialData?.originCityOther || '',
    domicileCity: initialData?.domicileCity || '',
    domicileCityOther: initialData?.domicileCityOther || '',
    angkatan: initialData?.angkatan || '',
    nim: initialData?.nim || '',
    faculty: initialData?.faculty || '',
    majorProgram: initialData?.majorProgram || '',
    phoneNumber: initialData?.phoneNumber || '',
    instagram: initialData?.instagram || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Get major programs based on selected faculty
  const availableMajors = formData.faculty
    ? facultiesData[formData.faculty as keyof typeof facultiesData] || []
    : [];

  // Reset major program when faculty changes
  const handleFacultyChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      faculty: value,
      majorProgram: '',
    }));
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nama lengkap wajib diisi';
    }
    if (!formData.gender) {
      newErrors.gender = 'Jenis kelamin wajib dipilih';
    }
    if (!formData.originCity) {
      newErrors.originCity = 'Asal kota wajib dipilih';
    }
    if (formData.originCity === 'Lainnya' && !formData.originCityOther?.trim()) {
      newErrors.originCityOther = 'Asal kota harus diisi';
    }
    if (!formData.domicileCity) {
      newErrors.domicileCity = 'Kota domisili wajib dipilih';
    }
    if (formData.domicileCity === 'Lainnya' && !formData.domicileCityOther?.trim()) {
      newErrors.domicileCityOther = 'Kota domisili harus diisi';
    }
    if (!formData.angkatan.trim()) {
      newErrors.angkatan = 'Angkatan wajib diisi';
    }
    if (!formData.nim.trim()) {
      newErrors.nim = 'NIM wajib diisi';
    }
    if (!formData.faculty) {
      newErrors.faculty = 'Fakultas wajib dipilih';
    }
    if (!formData.majorProgram) {
      newErrors.majorProgram = 'Program studi wajib dipilih';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Nomor WA/telepon wajib diisi';
    }
    if (formData.phoneNumber && !/^\+?[0-9\s\-()]*$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Format nomor telepon tidak valid';
    }
    if (formData.instagram && !formData.instagram.startsWith('@')) {
      newErrors.instagram = 'Username Instagram harus dimulai dengan @';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      setSuccessMessage('✓ Profil berhasil disimpan');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Gagal menyimpan profil');
    }
  };

  const handleInputChange = (
    field: keyof PengurusProfileData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 bg-slate-50/50">
          <CardTitle className="text-2xl text-slate-900">Pengaturan Profil Pengurus</CardTitle>
          <CardDescription>
            Kelola informasi profil dan pengaturan akun Anda
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success Message */}
            {successMessage && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Check className="w-4 h-4 text-green-600" />
                <p className="text-sm text-green-700 font-medium">{successMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {submitError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-700 font-medium">{submitError}</p>
              </div>
            )}

            {/* Row 1: Nama Lengkap */}
            <div>
              <Label htmlFor="fullName" className="text-sm font-medium text-slate-900">
                Nama Lengkap <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Masukkan nama lengkap Anda"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className={`mt-1 ${errors.fullName ? 'border-red-500' : ''}`}
              />
              {errors.fullName && (
                <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Row 2: Jenis Kelamin */}
            <div>
              <Label htmlFor="gender" className="text-sm font-medium text-slate-900">
                Jenis Kelamin <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger id="gender" className={errors.gender ? 'border-red-500' : ''}>
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
              {errors.gender && (
                <p className="text-xs text-red-500 mt-1">{errors.gender}</p>
              )}
            </div>

            {/* Row 3: Asal Kota */}
            <div>
              <Label htmlFor="originCity" className="text-sm font-medium text-slate-900">
                Asal Kota <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.originCity}
                onValueChange={(value) => handleInputChange('originCity', value)}
              >
                <SelectTrigger id="originCity" className={errors.originCity ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Pilih asal kota" />
                </SelectTrigger>
                <SelectContent>
                  {indonesianCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.originCity && (
                <p className="text-xs text-red-500 mt-1">{errors.originCity}</p>
              )}

              {/* Conditional input for "Lainnya" */}
              {formData.originCity === 'Lainnya' && (
                <Input
                  type="text"
                  placeholder="Masukkan asal kota Anda"
                  value={formData.originCityOther || ''}
                  onChange={(e) => handleInputChange('originCityOther', e.target.value)}
                  className={`mt-2 ${errors.originCityOther ? 'border-red-500' : ''}`}
                />
              )}
              {errors.originCityOther && (
                <p className="text-xs text-red-500 mt-1">{errors.originCityOther}</p>
              )}
            </div>

            {/* Row 4: Kota Domisili */}
            <div>
              <Label htmlFor="domicileCity" className="text-sm font-medium text-slate-900">
                Kota Domisili <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.domicileCity}
                onValueChange={(value) => handleInputChange('domicileCity', value)}
              >
                <SelectTrigger id="domicileCity" className={errors.domicileCity ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Pilih kota domisili" />
                </SelectTrigger>
                <SelectContent>
                  {indonesianCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.domicileCity && (
                <p className="text-xs text-red-500 mt-1">{errors.domicileCity}</p>
              )}

              {/* Conditional input for "Lainnya" */}
              {formData.domicileCity === 'Lainnya' && (
                <Input
                  type="text"
                  placeholder="Masukkan kota domisili Anda"
                  value={formData.domicileCityOther || ''}
                  onChange={(e) => handleInputChange('domicileCityOther', e.target.value)}
                  className={`mt-2 ${errors.domicileCityOther ? 'border-red-500' : ''}`}
                />
              )}
              {errors.domicileCityOther && (
                <p className="text-xs text-red-500 mt-1">{errors.domicileCityOther}</p>
              )}
            </div>

            {/* Row 5: Angkatan & NIM */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="angkatan" className="text-sm font-medium text-slate-900">
                  Angkatan <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="angkatan"
                  type="text"
                  placeholder="Contoh: 2021"
                  value={formData.angkatan}
                  onChange={(e) => handleInputChange('angkatan', e.target.value)}
                  className={`mt-1 ${errors.angkatan ? 'border-red-500' : ''}`}
                />
                {errors.angkatan && (
                  <p className="text-xs text-red-500 mt-1">{errors.angkatan}</p>
                )}
              </div>

              <div>
                <Label htmlFor="nim" className="text-sm font-medium text-slate-900">
                  NIM <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nim"
                  type="text"
                  placeholder="Nomor Induk Mahasiswa"
                  value={formData.nim}
                  onChange={(e) => handleInputChange('nim', e.target.value)}
                  className={`mt-1 ${errors.nim ? 'border-red-500' : ''}`}
                />
                {errors.nim && (
                  <p className="text-xs text-red-500 mt-1">{errors.nim}</p>
                )}
              </div>
            </div>

            {/* Row 6: Fakultas & Program Studi */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="faculty" className="text-sm font-medium text-slate-900">
                  Fakultas <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.faculty} onValueChange={handleFacultyChange}>
                  <SelectTrigger id="faculty" className={errors.faculty ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Pilih fakultas" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map((fac) => (
                      <SelectItem key={fac} value={fac}>
                        {fac}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.faculty && (
                  <p className="text-xs text-red-500 mt-1">{errors.faculty}</p>
                )}
              </div>

              <div>
                <Label htmlFor="majorProgram" className="text-sm font-medium text-slate-900">
                  Program Studi <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.majorProgram}
                  onValueChange={(value) => handleInputChange('majorProgram', value)}
                  disabled={!formData.faculty}
                >
                  <SelectTrigger
                    id="majorProgram"
                    className={`${errors.majorProgram ? 'border-red-500' : ''} ${
                      !formData.faculty ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <SelectValue placeholder={formData.faculty ? 'Pilih program studi' : 'Pilih fakultas dulu'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMajors.map((major) => (
                      <SelectItem key={major} value={major}>
                        {major}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.majorProgram && (
                  <p className="text-xs text-red-500 mt-1">{errors.majorProgram}</p>
                )}
              </div>
            </div>

            {/* Row 7: Kontak & Instagram */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phoneNumber" className="text-sm font-medium text-slate-900">
                  Nomor WA/Telepon <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Contoh: +62812345678"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className={`mt-1 ${errors.phoneNumber ? 'border-red-500' : ''}`}
                />
                {errors.phoneNumber && (
                  <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>
                )}
              </div>

              <div>
                <Label htmlFor="instagram" className="text-sm font-medium text-slate-900">
                  Akun Instagram
                </Label>
                <Input
                  id="instagram"
                  type="text"
                  placeholder="Contoh: @username_anda"
                  value={formData.instagram}
                  onChange={(e) => handleInputChange('instagram', e.target.value)}
                  className={`mt-1 ${errors.instagram ? 'border-red-500' : ''}`}
                />
                {errors.instagram && (
                  <p className="text-xs text-red-500 mt-1">{errors.instagram}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="px-6"
                >
                  Batal
                </Button>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
