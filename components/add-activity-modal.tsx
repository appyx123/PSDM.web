'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

import { ActivityScope } from '@/app/page';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; date: string; description: string; scope: ActivityScope }) => void;
}

export function AddActivityModal({ isOpen, onClose, onAdd }: AddActivityModalProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<ActivityScope>('INTERNAL');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name,
      date,
      description,
      scope
    });
    // Reset
    setName('');
    setDate('');
    setDescription('');
    setScope('INTERNAL');
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <Dialog.Title className="text-lg font-bold text-slate-900">
              Buat Kegiatan Baru
            </Dialog.Title>
            <Dialog.Close className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Nama Kegiatan</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Contoh: Rapat Koordinasi"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tanggal</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Deskripsi</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Deskripsi singkat mengenai kegiatan"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Ruang Lingkup (Scope)</label>
              <select
                required
                value={scope}
                onChange={(e) => setScope(e.target.value as ActivityScope)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="INTERNAL">Internal</option>
                <option value="EKSTERNAL">Eksternal</option>
                <option value="KEPANITIAAN">Kepanitiaan</option>
              </select>
              <p className="text-xs text-slate-500">Menentukan perhitungan denda dan reward PURE.</p>
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
                Simpan
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
