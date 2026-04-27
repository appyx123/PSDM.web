'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MembersTable } from '@/components/members-table';
import { AddMemberModal } from '@/components/add-member-modal';
import { MemberDetailPanel } from '@/components/member-detail-panel';
import { Member } from '@/app/page';
import { 
  Plus, FileDown, Download, Table as TableIcon, 
  Search, Users, UserPlus 
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface MembersViewProps {
  members: Member[];
  searchQuery: string;
  onAddMember: (data: any) => void;
  onUpdateMember: (memberId: string, data: any) => void;
  onDeleteMember: (memberId: string) => void;
  filteredMembers: Member[];
}

export function MembersView({
  members,
  searchQuery,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  filteredMembers,
}: MembersViewProps) {
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<Member | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);

  const handleEditClick = (member: Member) => {
    setEditingMember(member);
    setAddMemberOpen(true);
  };

  const handleViewDetail = (member: Member) => {
    setSelectedMemberDetail(member);
    setDetailPanelOpen(true);
  };

  const handleExportXLSX = () => {
    const exportData = members.map(m => ({
      'Nama Lengkap': m.name,
      'PRN': m.prn,
      'Jabatan': m.position,
      'Departemen': m.department === 'Trisula' ? '-' : m.department,
      'Status': m.status === 'active' ? 'Aktif' : 'Non-Aktif',
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
    
    const rows = members.map(m => [
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
        <div className="flex flex-wrap gap-2">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Pengurus</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{members.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Aktif</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{members.filter(m => m.status === 'active').length}</p>
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
        {filteredMembers.length > 0 ? (
          <MembersTable
            members={filteredMembers}
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
                 : 'Daftar pengurus kosong.'}
             </p>
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
      
      <MemberDetailPanel
        member={selectedMemberDetail}
        open={detailPanelOpen}
        onOpenChange={setDetailPanelOpen}
      />
    </div>
  );
}
