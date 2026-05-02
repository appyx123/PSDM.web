'use client';

import { useState, useMemo, useEffect } from 'react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardView } from '@/components/dashboard-view';
import { MembersView } from '@/components/members-view';
import { ReportsView } from '@/components/reports-view';
import { SettingsView } from '@/components/settings-view';
import { ActivitiesView } from '@/components/activities-view';
import { GovernanceView } from '@/components/governance-view';
import { PointMutationView } from '@/components/point-mutation-view';
import { MemberProfileView } from '@/components/member-profile-view';
import { PermissionsView } from '@/components/permissions-view';
import { UserProfileMenuPengurus } from '@/components/user-profile-menu-pengurus';
import { NotificationBell } from '@/components/notification-bell';
import { PengurusPelaporanView } from '@/components/pengurus-pelaporan-view';
import { getImageUrl } from '@/lib/utils';

export type TreatmentPath = 'REDEMPTION' | 'FULL_ATTENDANCE';

export interface TreatmentInfo {
  isActive: boolean;
  level?: string;
  path?: TreatmentPath;
  phase?: string;
  startDate: string;
  startPoints: number;
  targetPoints: number;
  durationDays: number;
}

export interface Member {
  id: string;
  name: string;
  prn: string;
  department: string;
  position: string;
  basePoints: number;
  points?: number; // Derived
  status: 'AKTIF' | 'ALUMNI' | 'NONAKTIF';
  joinDate: string;
  treatment?: TreatmentInfo;
  pointLogs?: any[];
  user?: any;
  attendances?: any[];
}

export type ActivityScope = 'EKSTERNAL' | 'INTERNAL' | 'KEPANITIAAN';
export type AttendanceStatus = 
  | 'TEPAT_WAKTU' 
  | 'TERLAMBAT_SAH' 
  | 'IZIN_SAKIT' 
  | 'TERLAMBAT_NON_SAKTI' 
  | 'PULANG_CEPAT' 
  | 'ALPHA';

export interface AttendanceRecord {
  memberId: string;
  status: AttendanceStatus;
  isEmergencyIzin?: boolean;
  emergencyReason?: string;
}

export interface Activity {
  id: string;
  name: string;
  date: string;
  time?: string;
  description: string;
  scope: ActivityScope;
  attendees: AttendanceRecord[];
}

export const PURE_MATRIX: Record<ActivityScope, Record<AttendanceStatus, number>> = {
  EKSTERNAL: {
    TEPAT_WAKTU: 5,
    TERLAMBAT_SAH: 2,
    IZIN_SAKIT: 0,
    TERLAMBAT_NON_SAKTI: -2,
    PULANG_CEPAT: -3,
    ALPHA: -7
  },
  INTERNAL: {
    TEPAT_WAKTU: 3,
    TERLAMBAT_SAH: 1,
    IZIN_SAKIT: 0,
    TERLAMBAT_NON_SAKTI: -1,
    PULANG_CEPAT: -2,
    ALPHA: -5
  },
  KEPANITIAAN: {
    TEPAT_WAKTU: 2,
    TERLAMBAT_SAH: 1,
    IZIN_SAKIT: 0,
    TERLAMBAT_NON_SAKTI: -1,
    PULANG_CEPAT: -2,
    ALPHA: -3
  }
};

interface SessionUser {
  userId: string;
  role: 'ADMIN' | 'PENGURUS';
  name: string;
  memberId?: string;
  prn?: string;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'reports' | 'settings' | 'activities' | 'governance' | 'evaluasi' | 'perizinan' | 'pelaporan'>('dashboard');
  
  // Sync tab with URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['dashboard', 'members', 'reports', 'settings', 'activities', 'governance', 'evaluasi', 'pelaporan', 'perizinan'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, []);

  // Update URL when tab changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', activeTab);
    window.history.replaceState({}, '', url.toString());
  }, [activeTab]);
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sysSettings, setSysSettings] = useState<any>(null);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const fetchData = async () => {
    try {
      const [membersRes, activitiesRes, settingsRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/activities'),
        fetch('/api/admin/settings')
      ]);
      const membersData = await membersRes.json();
      const activitiesData = await activitiesRes.json();
      const settingsData = await settingsRes.json();
      
      if (Array.isArray(membersData)) setMembers(membersData);
      if (Array.isArray(activitiesData)) setActivities(activitiesData);
      if (settingsData && !settingsData.error) setSysSettings(settingsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          window.location.href = '/login';
          return;
        }
        const me = await meRes.json();
        setSession(me);
      } catch {
        window.location.href = '/login';
        return;
      } finally {
        setAuthChecked(true);
      }
      await fetchData();
    };
    init();
  }, []);

  // Derive member points dynamically based on activities
  const derivedMembers = useMemo(() => {
    const rules = sysSettings?.POINT_RULES ? JSON.parse(sysSettings.POINT_RULES) : PURE_MATRIX;
    const alphaMultiplier = parseFloat(sysSettings?.ALPHA_MULTIPLIER || '2');
    const maxAlphaPenalty = parseFloat(sysSettings?.ALPHA_MAX_PENALTY || '50');

    return members.map(member => {
      const sortedActivities = [...activities].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      let activityPoints = 0;
      let consecutiveAlphas = 0;

      for (const activity of sortedActivities) {
        const attendance = activity.attendees.find(att => att.memberId === member.id);
        if (attendance) {
          const baseChange = rules[activity.scope]?.[attendance.status] ?? 0;
          
          if (attendance.status === 'ALPHA') {
            const rawPenalty = baseChange * Math.pow(alphaMultiplier, consecutiveAlphas);
            // Apply Max Alpha Penalty limit (capped at negative value of maxAlphaPenalty)
            const finalPenalty = Math.max(rawPenalty, -Math.abs(maxAlphaPenalty)); 
            activityPoints += finalPenalty;
            consecutiveAlphas++;
          } else {
            activityPoints += baseChange;
            consecutiveAlphas = 0; 
          }
        }
      }

      const manualPoints = member.pointLogs?.reduce((sum, log) => sum + log.points, 0) || 0;

      return {
        ...member,
        points: member.basePoints + activityPoints + manualPoints
      };
    }) as Member[];
  }, [members, activities, sysSettings]);

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return derivedMembers;
    const query = searchQuery.toLowerCase();
    return derivedMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.prn.toLowerCase().includes(query)
    );
  }, [derivedMembers, searchQuery]);

  const handleAddMember = async (data: { name: string; prn: string; department: string; status: 'AKTIF' | 'ALUMNI' | 'NONAKTIF'; position: string; basePoints?: number }) => {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const { id } = await res.json();
      const newMember: Member = {
        id,
        ...data,
        basePoints: data.basePoints ?? 100,
        joinDate: new Date().toISOString().split('T')[0],
      };
      setMembers([...members, newMember]);
    } else {
      const errorData = await res.json();
      alert(`Gagal menambah anggota: ${errorData.error}`);
    }
  };

  const handleUpdateMember = async (memberId: string, data: { name: string; prn: string; department: string; status: 'AKTIF' | 'ALUMNI' | 'NONAKTIF'; position: string; basePoints?: number }) => {
    const res = await fetch(`/api/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      setMembers(members.map((m) => m.id === memberId ? { ...m, ...data } : m));
    }
  };

  const handleAddPoints = async (data: { memberId: string; activity: string; points: number }) => {
    const member = members.find(m => m.id === data.memberId);
    if (!member) return;
    
    const newBasePoints = member.basePoints + data.points;
    const res = await fetch(`/api/members/${data.memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...member, basePoints: newBasePoints })
    });
    
    if (res.ok) {
      setMembers(members.map((m) => m.id === data.memberId ? { ...m, basePoints: newBasePoints } : m));
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    const res = await fetch(`/api/members/${memberId}`, { method: 'DELETE' });
    if (res.ok) {
      setMembers(members.filter((m) => m.id !== memberId));
    }
  };

  const handleAddActivity = async (data: { name: string; date: string; time: string; description: string; scope: ActivityScope }) => {
    const res = await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const { id } = await res.json();
      const newActivity: Activity = {
        id,
        ...data,
        attendees: [],
      };
      setActivities([...activities, newActivity]);
    }
  };

  const handleUpdateActivity = async (activityId: string, data: { name: string; date: string; time: string; description: string; scope: ActivityScope }) => {
    const res = await fetch(`/api/activities/${activityId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const updatedData = await res.json();
      setActivities(activities.map(a => a.id === activityId ? { ...a, ...data } : a));
    } else {
      alert('Gagal menyimpan perubahan kegiatan');
    }
  };

  const handleUpdateAttendance = async (
    activityId: string, 
    memberId: string, 
    status: AttendanceStatus | null,
    isEmergency?: boolean,
    emergencyReason?: string
  ) => {
    const res = await fetch(`/api/activities/${activityId}/attendance`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, status, isEmergency, emergencyReason })
    });
    
    if (res.ok) {
      await fetchData(); 
    } else {
      const err = await res.json();
      if (err.error === 'QUOTA_EXCEEDED') {
        throw new Error('QUOTA_EXCEEDED: ' + err.message);
      }
      throw new Error(err.error || 'Terjadi kesalahan');
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    const res = await fetch(`/api/activities/${activityId}`, { method: 'DELETE' });
    if (res.ok) {
      setActivities(activities.filter(a => a.id !== activityId));
    }
  };

  const handleStartTreatment = async (memberId: string, durationDays: number, path: TreatmentPath) => {
    const targetMember = derivedMembers.find(m => m.id === memberId);
    if (!targetMember) return;

    const currentPoints = targetMember.points ?? 0;
    const treatmentInfo: TreatmentInfo = {
      isActive: true,
      startDate: new Date().toISOString(),
      startPoints: currentPoints,
      targetPoints: 30, // Redemption target
      durationDays,
      path
    };

    const res = await fetch(`/api/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...targetMember, treatment: treatmentInfo })
    });

    if (res.ok) {
      setMembers(currentMembers =>
        currentMembers.map(m => m.id === memberId ? { ...m, treatment: treatmentInfo } : m)
      );
    }
  };

  const handleTabChange = (tabId: any) => {
    setActiveTab(tabId);
    setSearchQuery(''); // Clear search when switching tabs
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView members={derivedMembers} searchQuery={searchQuery} filteredMembers={filteredMembers} />;
      case 'members':
        return (
          <MembersView
            members={derivedMembers}
            searchQuery={searchQuery}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            onRefresh={fetchData}
          />
        );
      case 'reports':
        return <ReportsView members={derivedMembers} />;
      case 'settings':
        return <SettingsView />;
      case 'activities':
        return (
          <ActivitiesView
            activities={activities}
            members={derivedMembers}
            onAddActivity={handleAddActivity}
            onUpdateActivity={handleUpdateActivity}
            onDeleteActivity={handleDeleteActivity}
            onUpdateAttendance={handleUpdateAttendance}
          />
        );
      case 'governance':
        return (
          <GovernanceView
            members={derivedMembers}
            onStartTreatment={handleStartTreatment}
            sysSettings={sysSettings}
          />
        );
      case 'evaluasi':
        return (
          <PointMutationView
            members={derivedMembers}
            onRefresh={fetchData}
          />
        );
      case 'perizinan':
        return <PermissionsView sysSettings={sysSettings} />;
      default:
        return <DashboardView members={derivedMembers} searchQuery={searchQuery} filteredMembers={filteredMembers} />;
    }
  };

  // Auth loading state
  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Memeriksa sesi...</p>
        </div>
      </div>
    );
  }

  // Pengurus view: show only their own profile
  if (session?.role === 'PENGURUS') {
    const myMember = derivedMembers.find(m => m.id === session.memberId);
    return (
      <div className="flex h-screen bg-slate-50">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header khusus Pengurus */}
          <header className="bg-white border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center overflow-hidden">
                  {sysSettings?.APP_LOGO ? (
                    <img src={getImageUrl(sysSettings.APP_LOGO) || ''} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-xs font-bold">{sysSettings?.APP_NAME?.[0] || 'P'}</span>
                  )}
                </div>
                <span className="text-sm font-semibold text-slate-700">{sysSettings?.APP_NAME || 'PSDM System'}</span>
              </div>
              
              <div className="hidden md:flex items-center gap-6 mx-8">
                <button 
                  onClick={() => handleTabChange('dashboard')}
                  className={`text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Profil & Dashboard
                </button>
                <button 
                  onClick={() => handleTabChange('pelaporan')}
                  className={`text-sm font-medium transition-colors ${activeTab === 'pelaporan' ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Pelaporan Klaim
                </button>
              </div>

              <div className="flex items-center gap-3">
                <NotificationBell />
                <UserProfileMenuPengurus
                  userName={session.name}
                  userPrn={session.prn}
                  userImage={(session as any).image}
                />
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-64 text-slate-500">Memuat profil...</div>
              ) : myMember ? (
                activeTab === 'pelaporan' ? (
                  <PengurusPelaporanView member={myMember} />
                ) : (
                  <MemberProfileView 
                    member={myMember} 
                    activities={activities} 
                    sessionName={session.name} 
                    sysSettings={sysSettings}
                  />
                )
              ) : (
                <div className="text-center py-16 text-slate-500">
                  <p className="text-lg font-medium">Profil tidak ditemukan.</p>
                  <p className="text-sm mt-2">Hubungi Admin untuk menghubungkan akun Anda ke data anggota.</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Admin full dashboard
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <DashboardSidebar 
        activeItem={activeTab} 
        onItemClick={handleTabChange} 
        appName={sysSettings?.APP_NAME}
        appLogo={sysSettings?.APP_LOGO}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <DashboardHeader
          userName={session?.name || 'Admin'}
          userEmail="admin@psdm.id"
          userRole={session?.role}
          onSearch={setSearchQuery}
          searchResultCount={filteredMembers.length}
          totalCount={members.length}
          showSearch={activeTab === 'members'}
          onLogout={handleLogout}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="flex-1 overflow-auto bg-slate-50/50">
          <div className="p-4 md:p-6 max-w-[1600px] mx-auto w-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-64 text-slate-500">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  <p className="text-sm font-medium">Memuat data...</p>
                </div>
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
