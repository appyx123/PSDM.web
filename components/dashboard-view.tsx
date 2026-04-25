'use client';

import { Users, Award, TrendingUp, Activity, Search as SearchIcon } from 'lucide-react';
import { MetricCard } from '@/components/metric-card';
import { MembersTable } from '@/components/members-table';
import { Member } from '@/app/page';

interface DashboardViewProps {
  members: Member[];
  searchQuery?: string;
  filteredMembers?: Member[];
}

export function DashboardView({ members, searchQuery = '', filteredMembers = [] }: DashboardViewProps) {
  // Calculate metrics
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === 'active').length;
  const totalPoints = members.reduce((sum, m) => sum + (m.points ?? 0), 0);
  const avgPoints = totalMembers > 0 ? Math.round(totalPoints / totalMembers) : 0;

  // If search is active, show search results
  if (searchQuery.trim()) {
    return (
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Hasil Pencarian</h1>
          <p className="text-slate-600 mt-1">
            Menampilkan hasil pencarian untuk: <span className="font-semibold">"{searchQuery}"</span>
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Hasil Ditemukan"
            value={filteredMembers.length}
            change={0}
            icon={<SearchIcon className="w-6 h-6" />}
            color="blue"
          />
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
            icon={<Activity className="w-6 h-6" />}
            color="green"
          />
          <MetricCard
            title="Rata-rata Poin"
            value={avgPoints}
            change={5}
            icon={<TrendingUp className="w-6 h-6" />}
            color="orange"
          />
        </div>

        {/* Search Results Table */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Daftar Anggota</h2>
            <p className="text-sm text-slate-600 mt-1">
              Ditemukan {filteredMembers.length} dari {totalMembers} anggota
            </p>
          </div>

          {filteredMembers.length > 0 ? (
            <MembersTable members={filteredMembers} />
          ) : (
            <div className="text-center py-12 border border-slate-200 rounded-lg bg-slate-50">
              <SearchIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Tidak ada anggota yang ditemukan</p>
              <p className="text-sm text-slate-500 mt-1">
                Coba gunakan kata kunci lain atau hapus filter pencarian
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default dashboard view
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">
          Kelola anggota dan pantau performa sistem
        </p>
      </div>

      {/* Metrics */}
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
          icon={<Activity className="w-6 h-6" />}
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
          icon={<TrendingUp className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-indigo-900 mb-2">Selamat datang di Dashboard</h2>
        <p className="text-indigo-700">
          Gunakan navigasi di sebelah kiri untuk mengelola anggota, melihat laporan, atau mengatur pengaturan sistem.
        </p>
      </div>
    </div>
  );
}
