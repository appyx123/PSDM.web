'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Member } from '@/app/page';

interface FormKlaimPrestasiProps {
  member: Member;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FormKlaimPrestasi({ member, onSuccess, onCancel }: FormKlaimPrestasiProps) {
  const [activityName, setActivityName] = useState('');
  const [activityDate, setActivityDate] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!activityName || !activityDate || !description || !file) {
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
          activityName,
          activityDate,
          description,
          evidence: evidenceUrl
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
        <h3 className="text-lg font-bold text-slate-800">Form Pelaporan Kegiatan Positif</h3>
        <p className="text-sm text-slate-500 mb-4">Laporkan kegiatan positif/prestasi Anda. Admin akan meninjau dan memberikan poin apresiasi.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="activityName">Nama Kegiatan / Prestasi</Label>
        <Input 
          id="activityName"
          placeholder="Contoh: Juara 1 Lomba Karya Tulis Ilmiah" 
          value={activityName}
          onChange={e => setActivityName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="activityDate">Waktu Pelaksanaan</Label>
        <Input 
          id="activityDate"
          type="date"
          value={activityDate}
          onChange={e => setActivityDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Keterangan / Deskripsi Tambahan</Label>
        <Textarea 
          id="description"
          placeholder="Jelaskan detail kegiatan atau peran Anda..." 
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">Bukti Pendukung / Dokumentasi (Max 2MB)</Label>
        <Input 
          id="file"
          type="file" 
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          required
        />
        <p className="text-xs text-slate-500">Format: JPG, PNG, PDF. Lampirkan sertifikat atau foto kegiatan.</p>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Kirim Laporan
        </Button>
      </div>
    </form>
  );
}
