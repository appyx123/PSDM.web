'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
  onSubmit: (data: any) => void;
  editingMember: Member | null;
  onUpdate: (id: string, data: any) => void;
}

const DEPARTMENTS = [
  'PSDM',
  'Media',
  'Penalaran',
  'Kompres',
  'Ristek',
  'Humas',
];

const POSITIONS = [
  'Ketua Umum',
  'Bendahara Umum',
  'Sekretaris Umum',
  'Kepala Departemen',
  'Staf Ahli',
];

const TRISULA_POSITIONS = ['Ketua Umum', 'Bendahara Umum', 'Sekretaris Umum'];

export function AddMemberModal({
  open,
  onOpenChange,
  onSubmit,
  editingMember,
  onUpdate,
}: AddMemberModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    prn: '',
    department: '',
    position: 'Staf Ahli',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (editingMember) {
      setFormData({
        name: editingMember.name,
        prn: editingMember.prn,
        department: editingMember.department === 'Trisula' ? '' : editingMember.department,
        position: editingMember.position,
        status: editingMember.status,
      });
    } else {
      setFormData({
        name: '',
        prn: '',
        department: '',
        position: 'Staf Ahli',
        status: 'active',
      });
    }
  }, [editingMember, open]);

  const isTrisula = TRISULA_POSITIONS.includes(formData.position);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Preparation data
    const submissionData = {
      ...formData,
      // If Trisula, set department to "Trisula" or null in DB
      department: isTrisula ? 'Trisula' : formData.department,
    };

    if (!isTrisula && !formData.department) {
      alert("Departemen wajib dipilih untuk jabatan Kadep atau Staf Ahli.");
      return;
    }

    if (editingMember) {
      onUpdate(editingMember.id, submissionData);
    } else {
      onSubmit(submissionData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingMember ? 'Edit Data Pengurus' : 'Tambah Pengurus Baru'}
          </DialogTitle>
          <DialogDescription>
            {editingMember 
              ? 'Perbarui informasi jabatan dan departemen pengurus.' 
              : 'Akun user akan dibuat otomatis dengan password default SALAMINOVATOR.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              placeholder="Masukkan nama lengkap"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prn">PRN (ID Anggota)</Label>
            <Input
              id="prn"
              placeholder="Contoh: PRN0252"
              value={formData.prn}
              onChange={(e) => setFormData({ ...formData, prn: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Jabatan</Label>
            <Select
              value={formData.position}
              onValueChange={(v) => {
                const newIsTrisula = TRISULA_POSITIONS.includes(v);
                setFormData({ 
                  ...formData, 
                  position: v,
                  department: newIsTrisula ? '' : formData.department 
                });
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Jabatan" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className={cn(isTrisula && "opacity-50")}>
              Departemen {isTrisula && "(Tidak berlaku untuk Trisula)"}
            </Label>
            <Select
              value={formData.department}
              onValueChange={(v) => setFormData({ ...formData, department: v })}
              disabled={isTrisula}
              required={!isTrisula}
            >
              <SelectTrigger>
                <SelectValue placeholder={isTrisula ? "Trisula" : "Pilih Departemen"} />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status Keanggotaan</Label>
            <Select
              value={formData.status}
              onValueChange={(v: 'active' | 'inactive') => setFormData({ ...formData, status: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Non-Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              {editingMember ? 'Simpan Perubahan' : 'Tambah Pengurus'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Add cn utility if not present or just use standard template literal
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
