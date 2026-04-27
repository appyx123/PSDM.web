'use client';

import { X, Search, CheckCircle2, Circle, AlertCircle, Loader2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useState, useMemo } from 'react';
import { Activity, Member, AttendanceStatus } from '@/app/page';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity | null;
  members: Member[];
  onUpdateAttendance: (
    activityId: string, 
    memberId: string, 
    status: AttendanceStatus | null,
    isEmergency?: boolean,
    emergencyReason?: string
  ) => Promise<void>;
}

export function AttendanceModal({
  isOpen,
  onClose,
  activity,
  members,
  onUpdateAttendance,
}: AttendanceModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // memberId being updated
  
  // Emergency State
  const [emergencyModalMember, setEmergencyModalMember] = useState<Member | null>(null);
  const [emergencyReason, setEmergencyReason] = useState('');

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.prn.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  if (!activity) return null;

  const handleStatusChange = async (member: Member, newStatus: string, isEmergency = false, reason = '') => {
    setIsUpdating(member.id);
    try {
      await onUpdateAttendance(
        activity.id, 
        member.id, 
        newStatus === '' ? null : newStatus as AttendanceStatus,
        isEmergency,
        reason
      );
    } catch (error: any) {
      if (error.message.includes('QUOTA_EXCEEDED')) {
        setEmergencyModalMember(member);
      } else {
        alert('Gagal memperbarui presensi.');
      }
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex flex-col gap-2 p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex items-start justify-between">
                <div>
                  <Dialog.Title className="text-xl font-bold text-slate-900">
                    Presensi: {activity.name}
                  </Dialog.Title>
                  <p className="text-sm text-slate-500 mt-1">
                    Tanggal: {new Date(activity.date).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                  </p>
                </div>
                <Dialog.Close className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-full shadow-sm">
                  <X className="w-5 h-5" />
                </Dialog.Close>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari nama atau PRN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                  Scope: {activity.scope}
                </div>
              </div>
              
              <div className="mt-3 flex gap-4 text-xs font-medium">
                <div className="text-slate-600">
                  Total Hadir: <span className="text-slate-900">{activity.attendees.filter(a => ['TEPAT_WAKTU', 'TERLAMBAT_SAH', 'TERLAMBAT_NON_SAKTI'].includes(a.status)).length}</span>
                </div>
                <div className="text-slate-600">
                  Izin/Sakit: <span className={cn(activity.attendees.filter(a => a.status === 'IZIN_SAKIT').length >= 7 ? "text-red-600 font-bold" : "text-slate-900")}>
                    {activity.attendees.filter(a => a.status === 'IZIN_SAKIT').length} / 7
                  </span>
                </div>
                <div className="text-slate-600">
                  Alpha: <span className="text-slate-900">{activity.attendees.filter(a => a.status === 'ALPHA').length}</span>
                </div>
              </div>
            </div>

            {/* Member List */}
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-1">
                {filteredMembers.map((member) => {
                  const attendance = activity.attendees.find(a => a.memberId === member.id);
                  const currentStatus = attendance?.status || '';

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {isUpdating === member.id ? (
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                          ) : currentStatus ? (
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{member.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                            <span>{member.prn}</span>
                            <span>•</span>
                            <span>{member.department}</span>
                            {attendance?.isEmergencyIzin && (
                              <span className="bg-red-100 text-red-600 px-1 rounded text-[10px] font-bold">DARURAT</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <select
                        disabled={isUpdating === member.id}
                        value={currentStatus}
                        onChange={(e) => handleStatusChange(member, e.target.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500",
                          currentStatus === '' ? "border-slate-300 text-slate-500" :
                          currentStatus === 'TEPAT_WAKTU' ? "border-green-300 bg-green-50 text-green-700" :
                          currentStatus === 'ALPHA' ? "border-red-300 bg-red-50 text-red-700" :
                          "border-amber-300 bg-amber-50 text-amber-700"
                        )}
                      >
                        <option value="">-- Pilih Status --</option>
                        <option value="TEPAT_WAKTU">Tepat Waktu</option>
                        <option value="TERLAMBAT_SAH">Terlambat (Sah)</option>
                        <option value="IZIN_SAKIT">Izin / Sakit</option>
                        <option value="TERLAMBAT_NON_SAKTI">Terlambat (Non-Sakti)</option>
                        <option value="PULANG_CEPAT">Pulang Cepat</option>
                        <option value="ALPHA">Alpha</option>
                      </select>
                    </div>
                  );
                })}

                {filteredMembers.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    Tidak ada anggota yang cocok dengan pencarian.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <p className="text-sm font-medium text-slate-600">
                Total Data Tersimpan: <span className="text-indigo-600 font-bold">{activity.attendees.length}</span> / {members.length}
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Selesai
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Emergency Override Modal */}
      <Dialog.Root open={!!emergencyModalMember} onOpenChange={(open) => !open && setEmergencyModalMember(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl z-[60] p-6">
            <Dialog.Title className="text-lg font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Kuota Izin Terpenuhi
            </Dialog.Title>
            <Dialog.Description className="text-sm text-slate-600 mt-2">
              Kuota izin (7) untuk <strong>{activity.name}</strong> sudah penuh. Untuk menambahkan izin lagi bagi <strong>{emergencyModalMember?.name}</strong>, Anda harus menggunakan status **Izin Darurat**.
            </Dialog.Description>
            
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Alasan Izin Darurat</Label>
                <Input 
                  placeholder="Contoh: Kecelakaan, Duka Cita, dll" 
                  value={emergencyReason}
                  onChange={e => setEmergencyReason(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Tindakan ini akan dicatat dalam log sistem sebagai penyimpangan kuota.
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setEmergencyModalMember(null)}>Batal</Button>
              <Button 
                disabled={!emergencyReason}
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  if (emergencyModalMember) {
                    handleStatusChange(emergencyModalMember, 'IZIN_SAKIT', true, emergencyReason);
                    setEmergencyModalMember(null);
                    setEmergencyReason('');
                  }
                }}
              >
                Simpan Sebagai Darurat
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
