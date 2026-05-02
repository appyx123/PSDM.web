'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Member } from '@/app/page';

interface FormKlaimPrestasiProps {
  member: Member;
  onSuccess: () => void;
  onCancel: () => void;
}

const KATEGORI_OPTIONS = [
  { value: 'Prestasi Riset/Akademik', label: 'Prestasi Riset/Akademik' },
  { value: 'Apresiasi Internal', label: 'Apresiasi Internal' }
];

const SUB_KATEGORI_OPTIONS: Record<string, { label: string; points: number }[]> = {
  'Prestasi Riset/Akademik': [
    { label: 'Juara PIMNAS', points: 50 },
    { label: 'Publikasi Jurnal Terakreditasi', points: 40 },
    { label: 'Juara 1 Tingkat Nasional', points: 30 },
    { label: 'Lainnya (Riset/Akademik)', points: 10 }
  ],
  'Apresiasi Internal': [
    { label: 'Mentor Internal', points: 15 },
    { label: 'Asisten Praktikum', points: 10 },
    { label: 'Kepanitiaan Ekstra', points: 5 },
    { label: 'Lainnya (Apresiasi Internal)', points: 5 }
  ]
};

export function FormKlaimPrestasi({ member, onSuccess, onCancel }: FormKlaimPrestasiProps) {
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const claimedPoints = subCategory ? SUB_KATEGORI_OPTIONS[category]?.find(s => s.label === subCategory)?.points || 0 : 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 2 * 1024 * 1024) {
        alert('Ukuran file maksimal 2MB');
        e.target.value = '';
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !subCategory || !description || !file) {
      alert('Harap lengkapi semua field wajib');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload file first
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/uploads', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error('Gagal mengupload bukti');
      const uploadData = await uploadRes.json();
      const evidenceUrl = uploadData.url;

      // Submit claim
      const claimRes = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subCategory,
          description,
          evidence: evidenceUrl,
          claimedPoints
        })
      });

      if (!claimRes.ok) throw new Error('Gagal mengirim klaim');

      onSuccess();
    } catch (error: any) {
      alert(error.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div>
        <h3 className="text-lg font-bold text-slate-800">Form Pengajuan Klaim Prestasi</h3>
        <p className="text-sm text-slate-500 mb-4">Ajukan klaim poin reward berdasarkan SOP. Poin akan divalidasi oleh Admin.</p>
      </div>

      <div className="space-y-2">
        <Label>Kategori Klaim</Label>
        <Select value={category} onValueChange={(val) => { setCategory(val); setSubCategory(''); }}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih kategori..." />
          </SelectTrigger>
          <SelectContent>
            {KATEGORI_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Sub-Kategori (Jenis Prestasi)</Label>
        <Select value={subCategory} onValueChange={setSubCategory} disabled={!category}>
          <SelectTrigger>
            <SelectValue placeholder={category ? "Pilih spesifikasi..." : "Pilih kategori dahulu"} />
          </SelectTrigger>
          <SelectContent>
            {category && SUB_KATEGORI_OPTIONS[category]?.map(opt => (
              <SelectItem key={opt.label} value={opt.label}>
                {opt.label} (+{opt.points} Poin)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Deskripsi Singkat</Label>
        <Textarea 
          placeholder="Jelaskan prestasi/kegiatan yang Anda lakukan..." 
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Bukti Pendukung (Max 2MB)</Label>
        <Input 
          type="file" 
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          required
        />
        <p className="text-xs text-slate-500">Format yang didukung: JPG, PNG, PDF</p>
      </div>

      {subCategory && (
        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex justify-between items-center">
          <span className="text-sm font-medium text-indigo-800">Estimasi Poin Reward:</span>
          <span className="font-bold text-indigo-700">+{claimedPoints}</span>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Kirim Pengajuan
        </Button>
      </div>
    </form>
  );
}
