'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Member, TreatmentPath } from '@/app/page';

interface StartTreatmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onStart: (memberId: string, durationDays: number, path: TreatmentPath) => void;
}

export function StartTreatmentModal({ isOpen, onClose, member, onStart }: StartTreatmentModalProps) {
  const [durationDays, setDurationDays] = useState(30);
  const [path, setPath] = useState<TreatmentPath>('REDEMPTION');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (member) {
      onStart(member.id, Number(durationDays), path);
    }
    onClose();
  };

  if (!member) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <Dialog.Title className="text-lg font-bold text-slate-900">
              Konfigurasi Pembinaan (EWS)
            </Dialog.Title>
            <Dialog.Close className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="bg-orange-50 text-orange-800 p-3 rounded-lg text-sm mb-2 border border-orange-200">
              Mulai masa pembinaan untuk <strong>{member.name}</strong> ({member.prn}). Poin saat ini: <strong>{member.points}</strong>.
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Durasi (Hari)</label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value={30}>30 Hari</option>
                <option value={60}>60 Hari</option>
                <option value={90}>90 Hari</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Jalur Pembinaan</label>
              <select
                value={path}
                onChange={(e) => setPath(e.target.value as TreatmentPath)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="REDEMPTION">Penebusan Poin (+30 Poin)</option>
                <option value="FULL_ATTENDANCE">Kehadiran Penuh (Tanpa Izin/Alpha)</option>
              </select>
            </div>

            <div className="pt-4 flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Mulai Pembinaan
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
