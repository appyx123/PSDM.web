'use client';

import { BarChart3, TrendingUp, Users, Award, Calendar } from 'lucide-react';
import { MetricCard } from '@/components/metric-card';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Member } from '@/app/page';

interface ReportsViewProps {
  members?: Member[];
}

export function ReportsView({ members = [] }: ReportsViewProps) {
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

  const handleExportPDF = () => {
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

  const handleExportExcel = () => {
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

  const handleExportCSV = () => {
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
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Laporan & Analitik</h1>
        <p className="text-slate-600 mt-1">
          Analisis data komprehensif dan performa sistem
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="flex gap-3">
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
    </div>
  );
}
