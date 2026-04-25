'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MembersTable } from '@/components/members-table';
import { AddMemberModal } from '@/components/add-member-modal';
import { AddPointsModal } from '@/components/add-points-modal';
import { Member } from '@/app/page';

interface MembersViewProps {
  members: Member[];
  searchQuery: string;
  onAddMember: (data: { name: string; prn: string; department: string; status: 'active' | 'inactive'; basePoints?: number }) => void;
  onUpdateMember: (memberId: string, data: { name: string; prn: string; department: string; status: 'active' | 'inactive'; basePoints?: number }) => void;
  onAddPoints: (data: { memberId: string; activity: string; points: number }) => void;
  onDeleteMember: (memberId: string) => void;
  filteredMembers: Member[];
}

export function MembersView({
  members,
  searchQuery,
  onAddMember,
  onUpdateMember,
  onAddPoints,
  onDeleteMember,
  filteredMembers,
}: MembersViewProps) {
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addPointsOpen, setAddPointsOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedMemberForPoints, setSelectedMemberForPoints] = useState<Member | null>(null);

  const handleEditClick = (member: Member) => {
    setEditingMember(member);
    setAddMemberOpen(true);
  };

  const handleAddPointsClick = (member: Member) => {
    setSelectedMemberForPoints(member);
    setAddPointsOpen(true);
  };

  const handleCloseAddMember = () => {
    setAddMemberOpen(false);
    setEditingMember(null);
  };

  const handleCloseAddPoints = () => {
    setAddPointsOpen(false);
    setSelectedMemberForPoints(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Data Anggota</h1>
        <p className="text-slate-600 mt-1">
          Kelola informasi dan poin anggota PERISAI
        </p>
      </div>

      {/* Data Table Section */}
      <div className="space-y-4">
        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Daftar Anggota</h2>
            {searchQuery && (
              <p className="text-sm text-slate-600 mt-1">
                Menampilkan {filteredMembers.length} dari {members.length} anggota
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setEditingMember(null);
                setAddMemberOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              + Tambah Anggota Baru
            </Button>
            <Button variant="outline">Export Report</Button>
          </div>
        </div>

        {/* Table */}
        {filteredMembers.length > 0 ? (
          <MembersTable
            members={filteredMembers}
            onEdit={handleEditClick}
            onAddPoints={handleAddPointsClick}
            onDelete={onDeleteMember}
          />
        ) : (
          <div className="text-center py-12 border border-slate-200 rounded-lg bg-slate-50">
            <p className="text-slate-600">
              {searchQuery
                ? `Tidak ada anggota yang cocok dengan "${searchQuery}"`
                : 'Tidak ada data anggota'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddMemberModal
        open={addMemberOpen}
        onOpenChange={handleCloseAddMember}
        onSubmit={onAddMember}
        editingMember={editingMember}
        onUpdate={onUpdateMember}
      />
      <AddPointsModal
        open={addPointsOpen}
        onOpenChange={handleCloseAddPoints}
        member={selectedMemberForPoints}
        onSubmit={onAddPoints}
      />
    </div>
  );
}
