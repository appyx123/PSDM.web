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

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; prn: string; department: string; status: 'active' | 'inactive'; basePoints?: number }) => void;
  editingMember?: Member | null;
  onUpdate?: (memberId: string, data: { name: string; prn: string; department: string; status: 'active' | 'inactive'; basePoints?: number }) => void;
}

const departments = ['PSDM', 'Acara', 'Humas', 'Logistik', 'Medkom'];

export function AddMemberModal({
  open,
  onOpenChange,
  onSubmit,
  editingMember,
  onUpdate,
}: AddMemberModalProps) {
  const [formData, setFormData] = useState<{
    name: string;
    prn: string;
    department: string;
    status: 'active' | 'inactive';
    basePoints: number;
  }>({
    name: '',
    prn: '',
    department: '',
    status: 'active',
    basePoints: 0,
  });

  useEffect(() => {
    if (editingMember) {
      setFormData({
        name: editingMember.name,
        prn: editingMember.prn,
        department: editingMember.department,
        status: editingMember.status,
        basePoints: editingMember.basePoints ?? 0,
      });
    } else {
      setFormData({ name: '', prn: '', department: '', status: 'active', basePoints: 0 });
    }
  }, [editingMember, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember && onUpdate) {
      onUpdate(editingMember.id, formData);
    } else {
      onSubmit(formData);
    }
    setFormData({ name: '', prn: '', department: '', status: 'active', basePoints: 0 });
    onOpenChange(false);
  };

  const isEditing = !!editingMember;
  const title = isEditing ? 'Edit Data Anggota' : 'Tambah Anggota Baru PERISAI';
  const submitText = isEditing ? 'Update Data' : 'Simpan Anggota';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Perbarui informasi anggota di bawah ini'
              : 'Masukkan informasi anggota baru ke dalam sistem'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Nama Lengkap
            </Label>
            <Input
              id="name"
              placeholder="Masukkan nama lengkap"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prn" className="text-sm font-medium">
              PRN
            </Label>
            <Input
              id="prn"
              placeholder="Masukkan PRN"
              value={formData.prn}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                setFormData({ ...formData, prn: value });
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department" className="text-sm font-medium">
              Departemen
            </Label>
            <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
              <SelectTrigger id="department">
                <SelectValue placeholder="Pilih departemen" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">
              Status Anggota
            </Label>
            <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="basePoints" className="text-sm font-medium">
              Poin Awal (Base Points)
            </Label>
            <Input
              id="basePoints"
              type="number"
              placeholder="Masukkan poin awal"
              value={formData.basePoints}
              onChange={(e) => setFormData({ ...formData, basePoints: parseInt(e.target.value) || 0 })}
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
              {submitText}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
