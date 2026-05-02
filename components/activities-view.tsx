'use client';

import { useState } from 'react';
import { Activity, Member, ActivityScope, AttendanceStatus } from '@/app/page';
import { CalendarDays, Plus, Download, Users, Trash2, FileSpreadsheet, FileText, Pencil } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AddActivityModal } from './add-activity-modal';
import { EditActivityModal } from './edit-activity-modal';
import { AttendanceModal } from './attendance-modal';

interface ActivitiesViewProps {
  activities: Activity[];
  members: Member[];
  onAddActivity: (data: { name: string; date: string; time: string; description: string; scope: ActivityScope }) => void;
  onUpdateActivity: (id: string, data: { name: string; date: string; time: string; description: string; scope: ActivityScope }) => void;
  onDeleteActivity: (activityId: string) => void;
  onUpdateAttendance: (
    activityId: string, 
    memberId: string, 
    status: AttendanceStatus | null,
    isEmergency?: boolean,
    emergencyReason?: string
  ) => Promise<void>;
}

export function ActivitiesView({
  activities,
  members: allMembers,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
  onUpdateAttendance,
}: ActivitiesViewProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [selectedActivityForAttendance, setSelectedActivityForAttendance] = useState<Activity | null>(null);

  // Filter only active members for attendance and exports
  const members = allMembers.filter(m => m.status === 'AKTIF');

  const handleExportActivityExcel = (activity: Activity) => {
    const exportData = members.map(member => {
      const attendance = activity.attendees.find(a => a.memberId === member.id);
      return {
        Nama: member.name,
        PRN: member.prn,
        Departemen: member.department,
        'Status Kehadiran': attendance ? attendance.status : 'BELUM_DIISI',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Presensi");
    XLSX.writeFile(workbook, `presensi-${activity.name.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
  };

  const handleExportActivityPDF = (activity: Activity) => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`Presensi Kegiatan: ${activity.name}`, 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Tanggal: ${new Date(activity.date).toLocaleDateString('id-ID')}`, 14, 30);
    doc.text(`Scope: ${activity.scope}`, 14, 36);

    const tableColumn = ["Nama", "PRN", "Departemen", "Status Kehadiran"];
    const tableRows = members.map(member => {
      const attendance = activity.attendees.find(a => a.memberId === member.id);
      return [
        member.name,
        member.prn,
        member.department,
        attendance ? attendance.status : 'BELUM_DIISI'
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
    });

    doc.save(`presensi-${activity.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manajemen Kegiatan</h1>
          <p className="text-slate-600 mt-1">
            Kelola kegiatan organisasi dan catat kehadiran anggota
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Buat Kegiatan
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Kegiatan</p>
            <p className="text-2xl font-bold text-slate-900">{activities.length}</p>
          </div>
        </div>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activities.map((activity) => (
          <div key={activity.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{activity.name}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {new Date(activity.date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} • {activity.time || '00:00'} WIB
                </p>
              </div>
              <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                <span className="text-sm font-bold text-indigo-700">{activity.scope}</span>
              </div>
            </div>

            <p className="mt-4 text-slate-700 text-sm line-clamp-2">
              {activity.description}
            </p>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-100 pt-4 gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="w-4 h-4 text-slate-400" />
                <span><strong className="text-slate-900">{activity.attendees.length}</strong> data tersimpan</span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedActivityForAttendance(activity)}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition-colors mr-2"
                >
                  Isi Presensi
                </button>
                <button
                  onClick={() => handleExportActivityExcel(activity)}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                  title="Export Excel"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleExportActivityPDF(activity)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                  title="Export PDF"
                >
                  <FileText className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setEditingActivity(activity)}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-200"
                  title="Edit Kegiatan"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Yakin ingin menghapus kegiatan ini?')) {
                      onDeleteActivity(activity.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Hapus Kegiatan"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">Belum Ada Kegiatan</h3>
            <p className="text-slate-500 mt-1">Klik tombol "Buat Kegiatan" untuk menambahkan.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddActivityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={onAddActivity}
      />

      <EditActivityModal
        isOpen={editingActivity !== null}
        onClose={() => setEditingActivity(null)}
        activity={editingActivity}
        onUpdate={onUpdateActivity}
      />

      <AttendanceModal
        isOpen={selectedActivityForAttendance !== null}
        onClose={() => setSelectedActivityForAttendance(null)}
        activity={selectedActivityForAttendance}
        members={members}
        onUpdateAttendance={async (activityId, memberId, status, isEmergency, emergencyReason) => {
          await onUpdateAttendance(activityId, memberId, status, isEmergency, emergencyReason);
          
          if (selectedActivityForAttendance && selectedActivityForAttendance.id === activityId) {
            const currentAttendees = selectedActivityForAttendance.attendees.filter(a => a.memberId !== memberId);
            if (status) {
              const newAttendee = { 
                memberId, 
                status, 
                isEmergencyIzin: isEmergency, 
                emergencyReason 
              };
              setSelectedActivityForAttendance({
                ...selectedActivityForAttendance,
                attendees: [...currentAttendees, newAttendee as any]
              });
            } else {
              setSelectedActivityForAttendance({
                ...selectedActivityForAttendance,
                attendees: currentAttendees
              });
            }
          }
        }}
      />
    </div>
  );
}
