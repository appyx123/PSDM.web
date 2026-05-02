'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Award, TrendingUp, Activity, Search as SearchIcon, 
  FileText, PlusCircle, CheckCircle2, AlertCircle, Clock, ArrowRight
} from 'lucide-react';
import { MetricCard } from '@/components/metric-card';
import { MembersTable } from '@/components/members-table';
import { Member } from '@/app/page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DashboardViewProps {
  members: Member[];
  searchQuery?: string;
  filteredMembers?: Member[];
  onTabChange?: (tab: any) => void;
}

export function DashboardView({ members, searchQuery = '', filteredMembers = [], onTabChange }: DashboardViewProps) {
  const [recentPermissions, setRecentPermissions] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  useEffect(() => {
    const fetchRecentData = async () => {
      try {
        const [pRes, lRes] = await Promise.all([
          fetch('/api/permissions?status=pending_all'),
          fetch('/api/point-logs')
        ]);
        
        if (pRes.ok) {
          const pData = await pRes.json();
          setRecentPermissions(pData.slice(0, 5));
        }
        
        if (lRes.ok) {
          const lData = await lRes.json();
          setRecentLogs(lData.slice(0, 5));
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoadingLogs(false);
      }
    };

    fetchRecentData();
  }, []);

  // Calculate metrics
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === 'AKTIF').length;
  const totalPoints = members.reduce((sum, m) => sum + (m.points ?? 0), 0);
  const avgPoints = totalMembers > 0 ? Math.round(totalPoints / totalMembers) : 0;

  // If search is active, show search results
  if (searchQuery.trim()) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Hasil Pencarian</h1>
          <p className="text-slate-600 mt-1">
            Menampilkan hasil pencarian untuk: <span className="font-semibold">"{searchQuery}"</span>
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Hasil Ditemukan" value={filteredMembers.length} change={0} icon={<SearchIcon className="w-6 h-6" />} color="blue" />
          <MetricCard title="Total Anggota" value={totalMembers} change={12} icon={<Users className="w-6 h-6" />} color="blue" />
          <MetricCard title="Anggota Aktif" value={activeMembers} change={8} icon={<Activity className="w-6 h-6" />} color="green" />
          <MetricCard title="Rata-rata Poin" value={avgPoints} change={5} icon={<TrendingUp className="w-6 h-6" />} color="orange" />
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Daftar Anggota</h2>
            <p className="text-sm text-slate-600 mt-1">Ditemukan {filteredMembers.length} dari {totalMembers} anggota</p>
          </div>
          {filteredMembers.length > 0 ? <MembersTable members={filteredMembers} /> : (
            <div className="text-center py-12 border border-slate-200 rounded-lg bg-slate-50">
              <SearchIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Tidak ada anggota yang ditemukan</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Ringkasan</h1>
          <p className="text-slate-500 mt-1">Pantau aktifitas dan performa anggota departemen Anda.</p>
        </div>
        <div className="hidden md:block">
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 px-3 py-1 font-semibold">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Badge>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Anggota" value={totalMembers} change={0} icon={<Users className="w-6 h-6" />} color="blue" />
        <MetricCard title="Anggota Aktif" value={activeMembers} change={0} icon={<Activity className="w-6 h-6" />} color="green" />
        <MetricCard title="Total Poin" value={totalPoints} change={0} icon={<Award className="w-6 h-6" />} color="purple" />
        <MetricCard title="Rata-rata Poin" value={avgPoints} change={0} icon={<TrendingUp className="w-6 h-6" />} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PERMISSIONS SECTION */}
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Antrean Perizinan
                </CardTitle>
                <CardDescription>Pengajuan terbaru yang membutuhkan verifikasi.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onTabChange?.('perizinan')} className="text-indigo-600 hover:text-indigo-700 font-bold">
                Lihat Semua <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentPermissions.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium italic">Tidak ada antrean perizinan</p>
              </div>
            ) : (
              <div className="divide-y">
                {recentPermissions.map(p => (
                  <div key={p.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 leading-none">{p.member.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{p.activity.name} • <span className="capitalize">{p.type}</span></p>
                    </div>
                    <Badge className={p.status.includes('emergency') ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}>
                      {p.status.includes('emergency') ? 'Urgent' : 'Reguler'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* LOGS SECTION */}
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-green-600" />
                  Log Apresiasi
                </CardTitle>
                <CardDescription>Aktifitas mutasi poin terbaru.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onTabChange?.('evaluasi')} className="text-green-600 hover:text-green-700 font-bold">
                Lihat Semua <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingLogs ? (
              <div className="py-12 text-center"><Clock className="w-8 h-8 animate-spin mx-auto text-slate-300" /></div>
            ) : recentLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 italic">Belum ada aktifitas poin</div>
            ) : (
              <div className="divide-y">
                {recentLogs.map(log => (
                  <div key={log.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 leading-none">{log.member.name}</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">{log.category}: {log.description}</p>
                    </div>
                    <div className={`font-bold text-sm ${log.type === 'REWARD' ? 'text-green-600' : 'text-red-600'}`}>
                      {log.type === 'REWARD' ? '+' : '-'}{log.points}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl font-bold mb-3 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-indigo-400" />
            Optimasi Performa PSDM
          </h2>
          <p className="text-indigo-100/80 leading-relaxed">
            Sistem ini dirancang untuk memberikan transparansi penuh atas performa pengurus. Pastikan setiap verifikasi dilakukan secara objektif berdasarkan matriks poin yang telah ditetapkan.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4 scale-150">
          <Award className="w-64 h-64" />
        </div>
      </div>
    </div>
  );
}
