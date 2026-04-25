'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Member } from '@/app/page';

interface AddPointsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Member | null;
  onSubmit: (data: { memberId: string; activity: string; points: number }) => void;
}

const activityTypes = [
  'Workshop',
  'Seminar',
  'Komunitas',
  'Kepengurusan',
  'Lainnya',
];

export function AddPointsModal({
  open,
  onOpenChange,
  member,
  onSubmit,
}: AddPointsModalProps) {
  const [formData, setFormData] = useState({
    activity: '',
    points: '',
  });

  useEffect(() => {
    setFormData({ activity: '', points: '' });
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    onSubmit({
      memberId: member.id,
      activity: formData.activity,
      points: parseInt(formData.points, 10),
    });
    setFormData({ activity: '', points: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Poin</DialogTitle>
          <DialogDescription>
            {member && `Tambahkan poin untuk ${member.name}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {member && (
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <p className="text-sm text-slate-600">Member:</p>
              <p className="font-semibold text-slate-900">{member.name}</p>
              <p className="text-xs text-slate-600 mt-1">
                Poin saat ini: <span className="font-semibold">{member.points ?? 0}</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="activity" className="text-sm font-medium">
              Jenis Kegiatan
            </Label>
            <Select value={formData.activity} onValueChange={(value) => setFormData({ ...formData, activity: value })}>
              <SelectTrigger id="activity">
                <SelectValue placeholder="Pilih jenis kegiatan" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((activity) => (
                  <SelectItem key={activity} value={activity}>
                    {activity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="points" className="text-sm font-medium">
              Jumlah Poin
            </Label>
            <Input
              id="points"
              type="number"
              placeholder="Masukkan jumlah poin"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: e.target.value })}
              required
              min="1"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              Tambah Poin
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
