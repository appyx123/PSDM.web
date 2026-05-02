'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, FileText, Loader2, Upload } from 'lucide-react';
import { Member, Activity } from '@/app/page';

interface FormPengajuanIzinProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member;
  activity: Activity | null;
  onSuccess: () => void;
}

export function FormPengajuanIzin({ open, onOpenChange, member, activity, onSuccess }: FormPengajuanIzinProps) {
  const [type, setType] = useState('sick');
  const [reason, setReason] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if < 3 hours
  const isCloseToEvent = () => {
    if (!activity) return false;
    const eventDateStr = activity.date.split('T')[0];
    const eventTimeStr = activity.time || '00:00';
    const eventTime = new Date(`${eventDateStr}T${eventTimeStr}:00`).getTime();
    const now = new Date().getTime();
    const diffHours = (eventTime - now) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours < 3;
  };

  const isEmergencyRequired = isCloseToEvent();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.size > 2 * 1024 * 1024) {
      alert('File terlalu besar. Maksimal 2MB.');
      return;
    }
    setFile(selected || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity) return;
    if (!reason) {
      alert('Alasan wajib diisi.');
      return;
    }
    if (isEmergencyRequired && !isEmergency) {
      alert('Anda harus mencentang kotak Keadaan Darurat karena kegiatan segera dimulai.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Handle file upload here if needed (e.g. to /api/uploads), assuming returning a URL string.
      // For simplicity, we just pass the file name or skip it if no upload server is configured.
      let evidenceUrl = null;
      if (file) {
        // Implement your actual file upload logic here
        evidenceUrl = file.name; // Dummy
      }

      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: activity.id,
          type,
          reason,
          evidence: evidenceUrl,
          isEmergency: isEmergencyRequired || isEmergency
        })
      });

      if (res.ok) {
        onSuccess();
        onOpenChange(false);
      } else {
        const err = await res.json();
        alert(`Gagal mengajukan izin: ${err.error}`);
      }
    } catch (error) {
      alert('Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setType('sick');
    setReason('');
    setIsEmergency(false);
    setFile(null);
  };

  if (!activity) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isSubmitting) onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-700">
            <FileText className="w-5 h-5" /> Form Pengajuan Izin
          </DialogTitle>
          <DialogDescription>
            Isi formulir untuk mengajukan izin ketidakhadiran pada kegiatan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Nama</Label>
              <div className="font-medium text-sm p-2 bg-slate-50 border rounded-md">{member.name}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Departemen</Label>
              <div className="font-medium text-sm p-2 bg-slate-50 border rounded-md">{member.department}</div>
            </div>
          </div>
          
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Kegiatan</Label>
            <div className="font-medium text-sm p-2 bg-indigo-50 text-indigo-800 border border-indigo-100 rounded-md">
              {activity.name} - {new Date(activity.date).toLocaleDateString('id-ID')}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Jenis Izin <span className="text-red-500">*</span></Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sick">Sakit</SelectItem>
                <SelectItem value="academic">Akademik</SelectItem>
                <SelectItem value="emergency">Darurat Keluarga</SelectItem>
                <SelectItem value="late">Terlambat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Alasan Detail <span className="text-red-500">*</span></Label>
            <Textarea 
              placeholder="Jelaskan secara rinci..." 
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="resize-none h-20"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex justify-between items-center">
              <span>Lampiran Bukti (Opsional)</span>
              <span className="text-[10px] text-slate-400">Max 2MB (PDF/JPG)</span>
            </Label>
            <div className="border border-dashed p-3 rounded-lg flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors">
              <input type="file" id="evidence" className="hidden" onChange={handleFileChange} />
              <label htmlFor="evidence" className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
                <Upload className="w-4 h-4" /> {file ? file.name : 'Pilih file...'}
              </label>
            </div>
          </div>

          {isEmergencyRequired && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 mt-4">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800 mb-1">Peringatan: Kegiatan Hampir Dimulai</p>
                <p className="text-[11px] text-amber-700 mb-2">Waktu kegiatan kurang dari 3 jam. Izin Anda akan ditandai sebagai Darurat (Mendesak).</p>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="isEmergency" 
                    checked={isEmergency} 
                    onCheckedChange={(c) => setIsEmergency(c as boolean)} 
                  />
                  <label htmlFor="isEmergency" className="text-xs font-bold text-amber-900 cursor-pointer">
                    Ya, ini adalah keadaan darurat mendesak.
                  </label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Ajukan Izin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
