'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Member, Activity, PURE_MATRIX } from '@/app/page';

interface MemberProfileViewProps {
  member: Member;
  activities: Activity[];
  sessionName: string;
}

export function MemberProfileView({ member, activities, sessionName }: MemberProfileViewProps) {
  const attendedActivities = useMemo(() => {
    return activities
      .filter(a => a.attendees.some(att => att.memberId === member.id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activities, member.id]);

  const manualPoints = member.pointLogs?.reduce((sum, log) => sum + log.points, 0) || 0;
  const activityPoints = (member.points || 0) - member.basePoints - manualPoints;
  const totalPoints = member.points || 0;

  const statusColor = totalPoints >= 50
    ? 'bg-green-100 text-green-800 border-green-200'
    : totalPoints >= 20
    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
    : 'bg-red-100 text-red-800 border-red-200';

  const statusLabel = totalPoints >= 50 ? 'Baik' : totalPoints >= 20 ? 'Perhatian' : 'Kritis';

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-indigo-200 text-sm mb-1">Selamat datang,</p>
        <h1 className="text-2xl font-bold">{sessionName}</h1>
        <p className="text-indigo-300 text-sm mt-1">{member.department} · {member.prn}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6 pb-4">
            <div className="text-3xl font-bold text-indigo-700">{totalPoints}</div>
            <div className="text-xs text-slate-500 mt-1">Total Poin</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6 pb-4">
            <div className="text-3xl font-bold text-slate-700">{member.basePoints}</div>
            <div className="text-xs text-slate-500 mt-1">Poin Awal</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6 pb-4">
            <div className={`text-3xl font-bold ${activityPoints >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {activityPoints >= 0 ? `+${activityPoints}` : activityPoints}
            </div>
            <div className="text-xs text-slate-500 mt-1">Poin Kegiatan</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6 pb-4">
            <div className={`text-3xl font-bold ${manualPoints >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {manualPoints >= 0 ? `+${manualPoints}` : manualPoints}
            </div>
            <div className="text-xs text-slate-500 mt-1">Bonus/Sanksi</div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Info + Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Nama</span>
              <span className="font-medium text-slate-800">{member.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">PRN</span>
              <span className="font-medium text-slate-800">{member.prn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Departemen</span>
              <span className="font-medium text-slate-800">{member.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bergabung</span>
              <span className="font-medium text-slate-800">{member.joinDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Status</span>
              <Badge variant="outline" className={member.status === 'active' ? 'text-green-700 border-green-200 bg-green-50' : 'text-slate-500'}>
                {member.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Keanggotaan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-4 space-y-3">
            <div className={`text-5xl font-black ${totalPoints >= 50 ? 'text-green-600' : totalPoints >= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
              {totalPoints}
            </div>
            <Badge variant="outline" className={`text-sm px-4 py-1 ${statusColor}`}>
              {statusLabel}
            </Badge>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all ${totalPoints >= 50 ? 'bg-green-500' : totalPoints >= 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min((totalPoints / 100) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">Target: 100 poin</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Kehadiran Kegiatan</CardTitle>
          <CardDescription>Kegiatan yang pernah Anda ikuti</CardDescription>
        </CardHeader>
        <CardContent>
          {attendedActivities.length === 0 ? (
            <div className="text-center py-8 text-slate-400 border border-dashed rounded-lg">
              Belum ada riwayat kehadiran.
            </div>
          ) : (
            <div className="space-y-2">
              {attendedActivities.map(activity => {
                const att = activity.attendees.find(a => a.memberId === member.id);
                const pointChange = att ? PURE_MATRIX[activity.scope][att.status] : 0;
                const statusLabels: Record<string, string> = {
                  TEPAT_WAKTU: 'Tepat Waktu', TERLAMBAT_SAH: 'Terlambat Sah',
                  IZIN_SAKIT: 'Izin/Sakit', TERLAMBAT_NON_SAKTI: 'Terlambat Non-Sah',
                  PULANG_CEPAT: 'Pulang Cepat', ALPHA: 'Alpha'
                };
                return (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{activity.name}</p>
                      <p className="text-xs text-slate-500">{activity.date} · {activity.scope}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs mb-1">
                        {att ? statusLabels[att.status] || att.status : '-'}
                      </Badge>
                      <div className={`text-sm font-bold ${pointChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pointChange >= 0 ? `+${pointChange}` : pointChange}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
