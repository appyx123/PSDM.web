'use client';

import { BarChart3, TrendingUp, Users, Award, Calendar, AlertTriangle, FileWarning, Check, Loader2, ShieldAlert } from 'lucide-react';
import { MetricCard } from '@/components/metric-card';
import { Member } from '@/app/page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ReportsViewProps {
  members?: Member[];
  onRefresh?: () => void;
  sysSettings?: any;
}

export function ReportsView({ members = [], onRefresh, sysSettings }: ReportsViewProps) {
  const spThresholds = sysSettings?.SP_THRESHOLDS ? JSON.parse(sysSettings.SP_THRESHOLDS) : [50, 30, 15];

  const [isSPModalOpen, setIsSPModalOpen] = useState(false);
  const [isSubmittingSP, setIsSubmittingSP] = useState(false);
  const [spForm, setSpForm] = useState({
    memberId: '',
    level: 'SP1',
    reason: '',
    notes: '',
  });

  const getSPCandidateLevel = (points: number) => {
    if (points <= spThresholds[2]) return { label: 'Kandidat SP 3', color: 'bg-red-100 text-red-700 border-red-200' };
    if (points <= spThresholds[1]) return { label: 'Kandidat SP 2', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    return { label: 'Kandidat SP 1', color: 'bg-amber-100 text-amber-700 border-amber-200' };
  };

  const handleOpenSPModal = (member: Member) => {
    const pts = member.points ?? 0;
    const initialLevel = pts <= spThresholds[2] ? 'SP3' : pts <= spThresholds[1] ? 'SP2' : 'SP1';
    setSpForm({
      memberId: member.id,
      level: initialLevel,
      reason: `Poin anggota (${pts}) di bawah ambang batas SOP.`,
      notes: '',
    });
    setIsSPModalOpen(true);
  };

  const handleIssueSP = async () => {
    if (!spForm.memberId || !spForm.reason) return;
    setIsSubmittingSP(true);
    try {
      const res = await fetch('/api/admin/sp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spForm)
      });
      if (res.ok) {
        setIsSPModalOpen(false);
        setSpForm({ memberId: '', level: 'SP1', reason: '', notes: '' });
        if (onRefresh) {
          onRefresh();
        } else {
          window.location.reload();
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menerbitkan SP.');
      }
    } catch (error) {
      console.error('Issue SP error:', error);
      alert('Terjadi kesalahan sistem saat menerbitkan SP.');
    } finally {
      setIsSubmittingSP(false);
    }
  };
  // Calculate report metrics
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === 'AKTIF').length;
  const inactiveMembers = totalMembers - activeMembers;
  const totalPoints = members.reduce((sum, m) => sum + (m.points ?? 0), 0);
  const avgPoints = totalMembers > 0 ? Math.round(totalPoints / totalMembers) : 0;

  // Department breakdown
  const departmentStats = members.reduce(
    (acc, member) => {
      const dept = member.department;
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Points by department (average)
  const departmentPointsAvg = members.reduce(
    (acc, member) => {
      const dept = member.department;
      if (!acc[dept]) acc[dept] = { total: 0, count: 0 };
      acc[dept].total += (member.points ?? 0);
      acc[dept].count += 1;
      return acc;
    },
    {} as Record<string, { total: number; count: number }>
  );

  const sortedDepartments = Object.entries(departmentStats).sort((a, b) => b[1] - a[1]);

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Laporan Anggota PSDM', 14, 22);
    
    // Add generation date
    doc.setFontSize(11);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 30);

    const tableColumn = ["ID", "Nama", "PRN", "Departemen", "Poin", "Status", "Tgl Gabung"];
    const tableRows = members.map(m => [
      m.id,
      m.name,
      m.prn,
      m.department,
      (m.points ?? 0).toString(),
      m.status === 'AKTIF' ? 'Aktif' : m.status === 'ALUMNI' ? 'Alumni' : 'Non-Aktif',
      new Date(m.joinDate).toLocaleDateString('id-ID')
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
    });

    doc.save('laporan-anggota.pdf');
  };

  const handleExportExcel = async () => {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(members.map(m => ({
      ID: m.id,
      Nama: m.name,
      PRN: m.prn,
      Departemen: m.department,
      Poin: m.points ?? 0,
      Status: m.status === 'AKTIF' ? 'Aktif' : m.status === 'ALUMNI' ? 'Alumni' : 'Non-Aktif',
      'Tanggal Bergabung': new Date(m.joinDate).toLocaleDateString('id-ID')
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Anggota");
    XLSX.writeFile(workbook, "laporan-anggota.xlsx");
  };

  const handleExportCSV = async () => {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(members.map(m => ({
      ID: m.id,
      Nama: m.name,
      PRN: m.prn,
      Departemen: m.department,
      Poin: m.points ?? 0,
      Status: m.status === 'AKTIF' ? 'Aktif' : m.status === 'ALUMNI' ? 'Alumni' : 'Non-Aktif',
      'Tanggal Bergabung': new Date(m.joinDate).toLocaleDateString('id-ID')
    })));
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'laporan-anggota.csv';
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Anggota"
          value={totalMembers}
          change={12}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <MetricCard
          title="Anggota Aktif"
          value={activeMembers}
          change={8}
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
        />
        <MetricCard
          title="Total Poin"
          value={totalPoints}
          change={15}
          icon={<Award className="w-6 h-6" />}
          color="purple"
        />
        <MetricCard
          title="Rata-rata Poin"
          value={avgPoints}
          change={5}
          icon={<BarChart3 className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* Evaluasi Poin & Peringatan (SP) Section */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Evaluasi Poin & Surat Peringatan (SP)</h2>
              <p className="text-xs text-slate-500">
                Peringkat poin seluruh anggota. Anggota di bawah batas SOP ({spThresholds[0]} poin) dapat langsung diterbitkan SP.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs bg-white text-slate-600 border-slate-300 w-fit">
            Ambang SOP: SP1 ({spThresholds[0]}), SP2 ({spThresholds[1]}), SP3 ({spThresholds[2]})
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold border-b">
              <tr>
                <th className="px-5 py-3">Peringkat & Anggota</th>
                <th className="px-5 py-3">Departemen</th>
                <th className="px-5 py-3 text-center">Total Poin</th>
                <th className="px-5 py-3 text-center">Status Evaluasi</th>
                <th className="px-5 py-3 text-right">Tindakan Disiplin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...members]
                .sort((a, b) => (a.points ?? 0) - (b.points ?? 0)) // Urutkan dari poin terendah agar yang butuh perhatian tampil di atas
                .map((member, index) => {
                  const pts = member.points ?? 0;
                  const isBelowStandard = pts <= spThresholds[0];
                  const candidate = getSPCandidateLevel(pts);
                  const isTreatmentActive = member.treatment?.isActive;

                  return (
                    <tr key={member.id} className={cn(
                      "hover:bg-slate-50/80 transition-colors",
                      isBelowStandard && !isTreatmentActive && "bg-amber-50/20"
                    )}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                            isBelowStandard ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                          )}>
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{member.name}</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{member.prn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-medium">
                        {member.department === 'Trisula' ? '-' : member.department}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={cn(
                          "text-base font-black",
                          pts < spThresholds[2] ? "text-red-600" : pts < spThresholds[0] ? "text-amber-600" : "text-slate-800"
                        )}>
                          {pts}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {isTreatmentActive ? (
                          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                            Masa Pembinaan ({member.treatment?.level || 'SP'})
                          </Badge>
                        ) : isBelowStandard ? (
                          <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider", candidate.color)}>
                            {candidate.label}
                          </span>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] font-bold">
                            Normal (Aman)
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isBelowStandard && !isTreatmentActive ? (
                          <Button
                            size="sm"
                            onClick={() => handleOpenSPModal(member)}
                            className="h-8 text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm"
                          >
                            <FileWarning className="w-3.5 h-3.5 mr-1.5" />
                            Terbitkan SP
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            {isTreatmentActive ? 'Sedang Dibina' : 'Sesuai Standar'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reports Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Distribusi Anggota per Departemen
          </h2>
          <div className="space-y-4">
            {sortedDepartments.length > 0 ? (
              sortedDepartments.map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{dept}</p>
                    <div className="mt-2 w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(count / totalMembers) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <span className="ml-3 text-sm font-semibold text-slate-900">
                    {count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600 text-center py-4">Belum ada data</p>
            )}
          </div>
        </div>

        {/* Member Status */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Status Keanggotaan
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <p className="text-sm font-medium text-green-900">Aktif</p>
                <p className="text-xs text-green-700 mt-1">Anggota yang sedang aktif</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{activeMembers}</p>
                <p className="text-xs text-green-600 mt-1">
                  {totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0}%
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <p className="text-sm font-medium text-slate-900">Tidak Aktif</p>
                <p className="text-xs text-slate-700 mt-1">Anggota yang tidak aktif</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-600">{inactiveMembers}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {totalMembers > 0 ? Math.round((inactiveMembers / totalMembers) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Departemen Poin Rata-rata */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            Rata-rata Poin per Departemen
          </h2>
          <div className="space-y-3">
            {sortedDepartments.length > 0 ? (
              sortedDepartments.map(([dept]) => {
                const stats = departmentPointsAvg[dept];
                const avgPointsDept = stats ? Math.round(stats.total / stats.count) : 0;
                return (
                  <div key={dept} className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">{dept}</p>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{avgPointsDept}</p>
                      </div>
                      <span className="text-xs text-slate-500">poin</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-600 text-center py-4">Belum ada data</p>
            )}
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Ringkasan Statistik
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
              <span className="text-sm text-slate-700">Total Departemen</span>
              <span className="font-bold text-slate-900">
                {Object.keys(departmentStats).length}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
              <span className="text-sm text-slate-700">Rata-rata Poin Global</span>
              <span className="font-bold text-slate-900">{avgPoints} poin</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
              <span className="text-sm text-slate-700">Total Poin Terkumpul</span>
              <span className="font-bold text-slate-900">{totalPoints}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
              <span className="text-sm text-slate-700">Tingkat Keaktifan</span>
              <span className="font-bold text-green-600">
                {totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-indigo-900 mb-3">Export Laporan</h2>
        <p className="text-sm text-indigo-700 mb-4">
          Unduh data laporan dalam format yang Anda butuhkan
        </p>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleExportPDF}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Export PDF
          </button>
          <button 
            onClick={handleExportExcel}
            className="px-4 py-2 bg-white border border-indigo-300 text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium transition-colors"
          >
            Export Excel
          </button>
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white border border-indigo-300 text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* MODAL PENERBITAN SP INTEGRASI */}
      <Dialog open={isSPModalOpen} onOpenChange={setIsSPModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <FileWarning className="w-5 h-5" />
              Penerbitan Sanksi (SP)
            </DialogTitle>
            <DialogDescription>
              Terbitkan Surat Peringatan untuk anggota dengan performa di bawah standar SOP.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Anggota Penerima</Label>
              <Select 
                value={spForm.memberId} 
                onValueChange={(v) => setSpForm({ ...spForm, memberId: v })}
                disabled={!!spForm.memberId && isSPModalOpen}
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
                  <SelectItem value="SP1">SP 1 (Tahap 1 Penebusan)</SelectItem>
                  <SelectItem value="SP2">SP 2 (Pembinaan 30 Hari)</SelectItem>
                  <SelectItem value="SP3">SP 3 (Terminasi / Nonaktif)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Alasan Penerbitan</Label>
              <Input 
                placeholder="Contoh: Akumulasi poin di bawah ambang batas minimal" 
                value={spForm.reason}
                onChange={e => setSpForm({ ...spForm, reason: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan Tambahan (Opsional)</Label>
              <Textarea 
                placeholder="Detail catatan atau pesan pembinaan..." 
                className="resize-none"
                value={spForm.notes}
                onChange={e => setSpForm({ ...spForm, notes: e.target.value })}
              />
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <p className="text-[10px] font-bold text-amber-800 uppercase mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-600" /> Aturan Pembinaan SOP:
              </p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                {spForm.level === 'SP1' 
                  ? 'Target: Mendapatkan +30 poin dalam 60 hari. Jika gagal, otomatis fallback ke full attendance.'
                  : spForm.level === 'SP2'
                  ? 'Masa pembinaan 30 hari (Wajib hadir kegiatan 100%). Alpha berikutnya = SP3.'
                  : 'Status anggota akan dinonaktifkan dari kepengurusan.'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSPModalOpen(false)}>Batal</Button>
            <Button 
              disabled={!spForm.memberId || !spForm.reason || isSubmittingSP}
              onClick={handleIssueSP}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isSubmittingSP ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Terbitkan SP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
