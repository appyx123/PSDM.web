'use client';

import { useMemo, useState } from 'react';
import { Member, TreatmentPath } from '@/app/page';
import { ShieldAlert, Timer, UserX, GanttChart, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StartTreatmentModal } from './start-treatment-modal';

interface GovernanceViewProps {
  members: Member[];
  onStartTreatment: (memberId: string, durationDays: number, path: TreatmentPath) => void;
}

export function GovernanceView({ members, onStartTreatment }: GovernanceViewProps) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Derived state for data integrity
  const { flaggedMembers, treatmentMembers } = useMemo(() => {
    const flagged: Member[] = [];
    const treatment: Member[] = [];

    members.forEach((member) => {
      const currentPoints = member.points ?? 0;
      if (member.treatment?.isActive) {
        treatment.push(member);
      } else if (currentPoints <= 50) {
        flagged.push(member);
      }
    });

    // Sort flagged by points ascending (most critical first)
    flagged.sort((a, b) => (a.points ?? 0) - (b.points ?? 0));

    return { flaggedMembers: flagged, treatmentMembers: treatment };
  }, [members]);

  const getSPBadge = (points: number) => {
    if (points <= 15) return { label: 'SP 3 (Terminated)', color: 'bg-red-100 text-red-700 border-red-200' };
    if (points <= 30) return { label: 'SP 2 (Warning)', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    return { label: 'SP 1 (Notice)', color: 'bg-amber-100 text-amber-700 border-amber-200' };
  };

  const calculateDaysRemaining = (startDate: string, duration: number) => {
    const start = new Date(startDate).getTime();
    const now = new Date().getTime();
    const daysPassed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.max(0, duration - daysPassed);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-indigo-600" />
          Tata Kelola & EWS
        </h1>
        <p className="text-slate-600 mt-1">
          Early Warning System (EWS) untuk deteksi otomatis SP dan pembinaan anggota.
        </p>
      </div>

      {/* Auto-Flagging Section */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h2 className="font-bold text-slate-800">Auto-Flagging (Daftar SP Aktif)</h2>
        </div>
        
        {flaggedMembers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-medium">Nama Anggota</th>
                  <th className="px-4 py-3 font-medium">Departemen</th>
                  <th className="px-4 py-3 font-medium text-center">Poin Terkini</th>
                  <th className="px-4 py-3 font-medium text-center">Status Peringatan</th>
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {flaggedMembers.map((member) => {
                  const points = member.points ?? 0;
                  const badge = getSPBadge(points);
                  
                  return (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.prn}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{member.department}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-900">{points}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn("px-3 py-1 rounded-full text-xs font-bold border", badge.color)}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedMember(member)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          Mulai Pembinaan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            <UserX className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium">Tidak ada anggota yang terkena flag peringatan.</p>
          </div>
        )}
      </div>

      {/* Treatment Tracker Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <GanttChart className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-900">Treatment Tracker (Masa Pembinaan)</h2>
        </div>

        {treatmentMembers.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {treatmentMembers.map((member) => {
              const treatment = member.treatment!;
              const currentPoints = member.points ?? 0;
              const daysRemaining = calculateDaysRemaining(treatment.startDate, treatment.durationDays);
              
              // Progress Logic for Redemption
              let progressPercentage = 0;
              if (treatment.path === 'REDEMPTION') {
                const pointsGained = currentPoints - treatment.startPoints;
                progressPercentage = Math.min(100, Math.max(0, (pointsGained / treatment.targetPoints) * 100));
              }

              return (
                <div key={member.id} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900">{member.name}</h3>
                      <p className="text-xs text-slate-500">{member.prn} • {member.department}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                      <Timer className="w-3.5 h-3.5" />
                      Sisa {daysRemaining} Hari
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      Jalur: {treatment.path === 'REDEMPTION' ? 'Penebusan Poin' : 'Full Attendance'}
                    </span>
                  </div>

                  {treatment.path === 'REDEMPTION' ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Progres Poin: <strong className="text-slate-900">{currentPoints - treatment.startPoints}</strong> / {treatment.targetPoints}</span>
                        <span className="font-bold text-indigo-600">{Math.round(progressPercentage)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all", progressPercentage >= 100 ? "bg-green-500" : "bg-indigo-600")}
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-600">
                      <p>Syarat: Tidak boleh Alpha / Izin Sakit selama masa pembinaan aktif.</p>
                      <p className="mt-1">Status saat ini: <strong className="text-emerald-600">Memenuhi Syarat</strong></p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 border-dashed rounded-xl p-8 text-center text-slate-500">
            <p>Belum ada anggota yang masuk dalam masa pembinaan.</p>
          </div>
        )}
      </div>

      <StartTreatmentModal
        isOpen={selectedMember !== null}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
        onStart={onStartTreatment}
      />
    </div>
  );
}
