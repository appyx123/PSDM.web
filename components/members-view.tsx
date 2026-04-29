import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MembersTable } from '@/components/members-table';
import { AddMemberModal } from '@/components/add-member-modal';
import { MemberDetailPanel } from '@/components/member-detail-panel';
import { Member } from '@/app/page';
import { Label } from '@/components/ui/label';
import { 
  Plus, FileDown, Download, Table as TableIcon, 
  Search, Users, UserPlus, Upload, Filter, ArrowUpDown
} from 'lucide-react';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import * as XLSX from 'xlsx';

import { ImportMemberModal } from '@/components/import-member-modal';

interface MembersViewProps {
  members: Member[];
  searchQuery: string;
  onAddMember: (data: any) => void;
  onUpdateMember: (memberId: string, data: any) => void;
  onDeleteMember: (memberId: string) => void;
  onRefresh: () => void;
}

export function MembersView({
  members,
  searchQuery,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onRefresh,
}: MembersViewProps) {
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<Member | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);

  // Filter & Sort State
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterPos, setFilterPos] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('name-asc');

  const processedMembers = useMemo(() => {
    let result = [...members];

    // 1. Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.name.toLowerCase().includes(q) || 
        m.prn.toLowerCase().includes(q)
      );
    }

    // 2. Filters
    if (filterDept !== 'ALL') {
      result = result.filter(m => m.department === filterDept);
    }
    if (filterPos !== 'ALL') {
      result = result.filter(m => m.position === filterPos);
    }
    if (filterStatus !== 'ALL') {
      result = result.filter(m => m.status === filterStatus);
    }

    // 3. Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'prn-asc': return a.prn.localeCompare(b.prn);
        case 'prn-desc': return b.prn.localeCompare(a.prn);
        case 'points-desc': return (b.points ?? 0) - (a.points ?? 0);
        case 'points-asc': return (a.points ?? 0) - (b.points ?? 0);
        case 'date-desc': return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
        default: return 0;
      }
    });

    return result;
  }, [members, searchQuery, filterDept, filterPos, filterStatus, sortBy]);

  const handleEditClick = (member: Member) => {
    setEditingMember(member);
    setAddMemberOpen(true);
  };

  const handleViewDetail = (member: Member) => {
    setSelectedMemberDetail(member);
    setDetailPanelOpen(true);
  };

  const handleExportXLSX = () => {
    const exportData = processedMembers.map(m => ({
      'Nama Lengkap': m.name,
      'PRN': m.prn,
      'Jabatan': m.position,
      'Departemen': m.department === 'Trisula' ? '-' : m.department,
      'Status': m.status === 'AKTIF' ? 'Aktif' : m.status === 'ALUMNI' ? 'Alumni' : 'Non-Aktif',
      'Total Poin': m.points ?? 100,
      'Jenis Kelamin': m.user?.gender || '-',
      'Asal Kota': m.user?.originCity || '-',
      'Domisili': m.user?.domicileCity || '-',
      'Angkatan': m.user?.angkatan || '-',
      'NIM': m.user?.nim || '-',
      'Fakultas': m.user?.faculty || '-',
      'Prodi': m.user?.majorProgram || '-',
      'Kontak': m.user?.phoneNumber || '-',
      'Instagram': m.user?.instagram || '-',
      'Tanggal Gabung': m.joinDate
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pengurus");
    XLSX.writeFile(workbook, `data-pengurus-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportCSV = () => {
    const headers = [
      'Nama Lengkap', 'PRN', 'Jabatan', 'Departemen', 'Status', 'Total Poin', 
      'Jenis Kelamin', 'Asal Kota', 'Domisili', 'Angkatan', 'NIM', 'Fakultas', 
      'Prodi', 'Kontak', 'Instagram', 'Tanggal Gabung'
    ];
    
    const rows = processedMembers.map(m => [
      m.name, m.prn, m.position, m.department === 'Trisula' ? '-' : m.department, m.status, m.points ?? 100,
      m.user?.gender || '-', m.user?.originCity || '-', m.user?.domicileCity || '-',
      m.user?.angkatan || '-', m.user?.nim || '-', m.user?.faculty || '-',
      m.user?.majorProgram || '-', m.user?.phoneNumber || '-', m.user?.instagram || '-',
      m.joinDate
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `data-pengurus-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-600" />
            Manajemen Pengurus
          </h1>
          <p className="text-slate-600 mt-1">
            Kelola data keanggotaan, jabatan, dan pantau profil pengurus.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:mt-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setImportOpen(true)}
            className="border-green-200 text-green-700 hover:bg-green-50 shadow-sm"
          >
            <Upload className="w-4 h-4 mr-2" /> Import Pengurus
          </Button>
          <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm mr-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleExportCSV}
              className="rounded-none border-r border-slate-100 hover:bg-slate-50 text-slate-600"
            >
              <FileDown className="w-4 h-4 mr-2" /> CSV
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleExportXLSX}
              className="rounded-none hover:bg-slate-50 text-slate-600"
            >
              <TableIcon className="w-4 h-4 mr-2" /> XLSX
            </Button>
          </div>
          <Button
            onClick={() => {
              setEditingMember(null);
              setAddMemberOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Tambah Pengurus
          </Button>
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-2 lg:flex lg:flex-wrap gap-4 items-end">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
            <Filter className="w-3 h-3" /> Departemen
          </Label>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              <SelectItem value="PSDM">PSDM</SelectItem>
              <SelectItem value="Media">Media</SelectItem>
              <SelectItem value="Penalaran">Penalaran</SelectItem>
              <SelectItem value="Kompres">Kompres</SelectItem>
              <SelectItem value="Ristek">Ristek</SelectItem>
              <SelectItem value="Humas">Humas</SelectItem>
              <SelectItem value="Trisula">Trisula</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
             Jabatan
          </Label>
          <Select value={filterPos} onValueChange={setFilterPos}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              <SelectItem value="Ketua Umum">Ketua Umum</SelectItem>
              <SelectItem value="Bendahara Umum">Bendahara Umum</SelectItem>
              <SelectItem value="Sekretaris Umum">Sekretaris Umum</SelectItem>
              <SelectItem value="Kepala Departemen">Kepala Departemen</SelectItem>
              <SelectItem value="Staf Ahli">Staf Ahli</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
             Status
          </Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              <SelectItem value="AKTIF">AKTIF</SelectItem>
              <SelectItem value="ALUMNI">ALUMNI</SelectItem>
              <SelectItem value="NONAKTIF">NON-AKTIF</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 col-span-2 lg:ml-auto">
          <Label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
            <ArrowUpDown className="w-3 h-3" /> Urutkan Berdasarkan
          </Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Nama (A-Z)</SelectItem>
              <SelectItem value="name-desc">Nama (Z-A)</SelectItem>
              <SelectItem value="prn-asc">PRN (Kecil ke Besar)</SelectItem>
              <SelectItem value="prn-desc">PRN (Besar ke Kecil)</SelectItem>
              <SelectItem value="points-desc">Poin Tertinggi</SelectItem>
              <SelectItem value="points-asc">Poin Terendah</SelectItem>
              <SelectItem value="date-desc">Terbaru Bergabung</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Pengurus</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{members.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Aktif</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{members.filter(m => m.status === 'AKTIF').length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Departemen</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{new Set(members.map(m => m.department)).size}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Rata-rata Poin</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {members.length > 0 ? Math.round(members.reduce((acc, m) => acc + (m.points ?? 100), 0) / members.length) : 0}
          </p>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="space-y-4">
        {processedMembers.length > 0 ? (
          <MembersTable
            members={processedMembers}
            onEdit={handleEditClick}
            onDelete={onDeleteMember}
            onView={handleViewDetail}
          />
        ) : (
          <div className="text-center py-20 border border-slate-200 border-dashed rounded-xl bg-slate-50/50">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <Search className="w-8 h-8 text-slate-300" />
             </div>
             <p className="text-slate-500 font-medium">
               {searchQuery
                 ? `Tidak ada pengurus yang cocok dengan "${searchQuery}"`
                 : 'Tidak ada data pengurus yang sesuai dengan filter.'}
             </p>
             {(filterDept !== 'ALL' || filterPos !== 'ALL' || filterStatus !== 'ALL') && (
               <Button 
                variant="link" 
                onClick={() => { setFilterDept('ALL'); setFilterPos('ALL'); setFilterStatus('ALL'); }}
                className="text-indigo-600 mt-2"
               >
                 Reset Semua Filter
               </Button>
             )}
          </div>
        )}
      </div>

      {/* Modals & Panels */}
      <AddMemberModal
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        onSubmit={onAddMember}
        editingMember={editingMember}
        onUpdate={onUpdateMember}
      />
      
      <ImportMemberModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={onRefresh}
      />
      
      <MemberDetailPanel
        member={selectedMemberDetail}
        open={detailPanelOpen}
        onOpenChange={setDetailPanelOpen}
      />
    </div>
  );
}

