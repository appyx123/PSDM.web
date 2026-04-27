'use client';

import { useMemo, useState } from 'react';
import { Member, TreatmentPath } from '@/app/page';
import { 
  ShieldAlert, Timer, UserX, GanttChart, AlertTriangle, 
  FileWarning, Plus, Check, Loader2, X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';

interface GovernanceViewProps {
  members: Member[];
  onStartTreatment: (memberId: string, durationDays: number, path: TreatmentPath) => void;
  sysSettings?: any;
}

export function GovernanceView({ members, onStartTreatment, sysSettings }: GovernanceViewProps) {
  const spThresholds = sysSettings?.SP_THRESHOLDS ? JSON.parse(sysSettings.SP_THRESHOLDS) : [50, 30, 15];
  
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isSPModalOpen, setIsSPModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // SP Form State
  const [spForm, setSpForm] = useState({
    memberId: '',
    level: 'SP1',
    reason: '',
    notes: '',
  });

  // Derived state for data integrity
  const { flaggedMembers, treatmentMembers } = useMemo(() => {
    const flagged: Member[] = [];
    const treatment: Member[] = [];

    members.forEach((member) => {
      const currentPoints = member.points ?? 0;
      if (member.treatment?.isActive) {
        treatment.push(member);
      } else if (currentPoints <= spThresholds[0]) {
        flagged.push(member);
      }
    });

    // Sort flagged by points ascending (most critical first)
    flagged.sort((a, b) => (a.points ?? 0) - (b.points ?? 0));

    return { flaggedMembers: flagged, treatmentMembers: treatment };
  }, [members, spThresholds]);

  const getSPCandidateLevel = (points: number) => {
    if (points <= spThresholds[2]) return { label: 'Kandidat SP 3', color: 'bg-red-100 text-red-700 border-red-200' };
    if (points <= spThresholds[1]) return { label: 'Kandidat SP 2', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    return { label: 'Kandidat SP 1', color: 'bg-amber-100 text-amber-700 border-amber-200' };
  };

  const calculateDaysRemaining = (startDate: string, duration: number) => {
    const start = new Date(startDate).getTime();
    const now = new Date().getTime();
    const daysPassed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.max(0, duration - daysPassed);
  };

  const handleIssueSP = async () => {
    if (!spForm.memberId || !spForm.reason) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/sp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spForm)
      });
      if (res.ok) {
        setIsSPModalOpen(false);
        setSpForm({ memberId: '', level: 'SP1', reason: '', notes: '' });
        window.location.reload(); 
      }
    } catch (error) {
      console.error('Issue SP error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelTreatment = async (memberId: string) => {
    if (!confirm('Yakin ingin membatalkan masa pembinaan ini? Status pengurus akan kembali Aktif.')) return;
    try {
      const res = await fetch('/api/admin/sp/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId })
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Cancel treatment error:', error);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-indigo-600" />
            Tata Kelola & EWS
          </h1>
          <p className="text-slate-600 mt-1">
            Monitoring ambang batas SP otomatis dan penjatuhan sanksi sesuai SOP.
          </p>
        </div>
        <Button 
          onClick={() => {
            setSpForm({ ...spForm, memberId: '' });
            setIsSPModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <FileWarning className="w-4 h-4 mr-2" />
          Jatuhkan SP Manual
        </Button>
      </div>

      {/* Auto-Flagging Section */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h2 className="font-bold text-slate-800">Auto-Flagging (Kandidat SP)</h2>
        </div>
        
        {flaggedMembers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-medium">Nama Anggota</th>
                  <th className="px-4 py-3 font-medium">Departemen</th>
                  <th className="px-4 py-3 font-medium text-center">Poin Terkini</th>
                  <th className="px-4 py-3 font-medium text-center">Rekomendasi Sanksi</th>
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {flaggedMembers.map((member) => {
                  const points = member.points ?? 0;
                  const candidate = getSPCandidateLevel(points);
                  
                  return (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.prn}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{member.department}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-900">{points}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider", candidate.color)}>
                          {candidate.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSpForm({ 
                              ...spForm, 
                              memberId: member.id, 
                              level: points <= spThresholds[2] ? 'SP3' : points <= spThresholds[1] ? 'SP2' : 'SP1' 
                            });
                            setIsSPModalOpen(true);
                          }}
                          className="h-8 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                        >
                          Proses Sanksi
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="font-medium text-slate-700">Tidak ada anggota yang melanggar threshold.</p>
            <p className="text-sm text-slate-400 mt-1">Seluruh pengurus saat ini memiliki poin di atas batas minimal SOP.</p>
          </div>
        )}
      </div>

      {/* Treatment Tracker Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <GanttChart className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-900">Treatment Tracker (Masa Pembinaan Aktif)</h2>
        </div>

        {treatmentMembers.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {treatmentMembers.map((member) => {
              const treatment = member.treatment!;
              const currentPoints = member.points ?? 0;
              const daysRemaining = calculateDaysRemaining(treatment.startDate, treatment.durationDays);
              
              const progressPercentage = treatment.phase === 'REDEMPTION' 
                ? Math.min(100, Math.max(0, ((currentPoints - treatment.startPoints) / (treatment.targetPoints || 30)) * 100))
                : 0;

              return (
                <div key={member.id} className={cn(
                  "bg-white border border-slate-200 p-5 rounded-xl shadow-sm border-l-4 transition-all hover:shadow-md",
                  treatment.level === 'SP2' ? "border-l-red-500" : "border-l-indigo-600"
                )}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900">{member.name}</h3>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-bold border",
                          treatment.level === 'SP2' ? "bg-red-50 text-red-600 border-red-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                        )}>
                          {treatment.level}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{member.prn} • {member.department}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-700 border border-slate-200">
                        <Timer className="w-3.5 h-3.5" />
                        {daysRemaining} Hari Lagi
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleCancelTreatment(member.id)}
                        className="h-7 text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50 font-bold"
                      >
                        BATALKAN SP
                      </Button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border",
                      treatment.phase === 'REDEMPTION' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                    )}>
                      Fase: {treatment.phase === 'REDEMPTION' ? 'Penebusan Poin' : 'Full Attendance 100%'}
                    </span>
                  </div>

                  {treatment.phase === 'REDEMPTION' ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 text-xs">Target: <strong className="text-slate-900">+{treatment.targetPoints || 30} Poin</strong> (Progres: {currentPoints - treatment.startPoints})</span>
                        <span className="font-bold text-indigo-600">{Math.round(progressPercentage)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all", progressPercentage >= 100 ? "bg-emerald-500" : "bg-indigo-600")}
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 italic mt-1">*Jika gagal dalam 2 bulan, otomatis masuk fase Full Attendance.</p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                      <p className="font-semibold text-indigo-700 mb-1">SYARAT {treatment.level}:</p>
                      <p>Wajib hadir 100% (Tanpa Alpha) selama {treatment.durationDays} hari.</p>
                      <div className="mt-2 flex items-center gap-1.5 text-red-600 font-bold uppercase">
                        <AlertTriangle className="w-3 h-3" /> Pelanggaran 1x Alpha = {treatment.level === 'SP1' ? 'Naik ke SP2' : 'SP3/Pemecatan'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 border-dashed rounded-xl p-12 text-center text-slate-400">
            <p className="text-sm">Tidak ada anggota dalam masa pembinaan aktif.</p>
          </div>
        )}
      </div>

      {/* MANUAL SP MODAL */}
      <Dialog open={isSPModalOpen} onOpenChange={setIsSPModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <FileWarning className="w-5 h-5" />
              Penjatuhan Sanksi (SP)
            </DialogTitle>
            <DialogDescription>
              Isi detail pelanggaran untuk menjatuhkan SP. Sistem akan otomatis memicu masa pembinaan (Treatment) sesuai SOP.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Anggota</Label>
              <Select 
                value={spForm.memberId} 
                onValueChange={(v) => setSpForm({ ...spForm, memberId: v })}
                disabled={!!spForm.memberId && isSPModalOpen} // Lock if already set from candidate list
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih anggota..." />
                </SelectTrigger>
                <SelectContent>
                  {members.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name} ({m.prn})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

              <div className="space-y-2">
                <Label>Level Sanksi</Label>
                <Select value={spForm.level} onValueChange={(v) => setSpForm({ ...spForm, level: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SP1">SP 1</SelectItem>
                    <SelectItem value="SP2">SP 2</SelectItem>
                    <SelectItem value="SP3">SP 3 (Terminasi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            <div className="space-y-2">
              <Label>Alasan (Berdasarkan SOP)</Label>
              <Input 
                placeholder="Contoh: Alpha 3x berturut-turut" 
                value={spForm.reason}
                onChange={e => setSpForm({ ...spForm, reason: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan Tambahan (Opsional)</Label>
              <Textarea 
                placeholder="Detail kronologi..." 
                className="resize-none"
                value={spForm.notes}
                onChange={e => setSpForm({ ...spForm, notes: e.target.value })}
              />
            </div>

            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
              <p className="text-[10px] font-bold text-indigo-700 uppercase mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Otomatisasi SOP:
              </p>
              <p className="text-[11px] text-indigo-600">
                {spForm.level === 'SP1' 
                  ? `Tahap 1: Penebusan (+30 Poin dalam 60 hari). Jika gagal → Fallback Full Attendance.`
                  : spForm.level === 'SP2'
                  ? 'Masa pembinaan 30 hari (Wajib Hadir 100%). Alpha = SP3.'
                  : 'Status anggota akan dinonaktifkan (Terminasi).'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSPModalOpen(false)}>Batal</Button>
            <Button 
              disabled={!spForm.memberId || !spForm.reason || isSubmitting}
              onClick={handleIssueSP}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Jatuhkan Sanksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
