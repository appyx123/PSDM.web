'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, AlertCircle, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { FormPengajuanIzin } from './form-pengajuan-izin';
import { Member, Activity } from '@/app/page';

interface WidgetIzinSayaProps {
  member: Member;
}

export function WidgetIzinSaya({ member }: WidgetIzinSayaProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/permissions/dashboard');
      if (res.ok) {
         setData(await res.json());
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAjukanIzin = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1"/> Disetujui</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1"/> Ditolak</Badge>;
      case 'cancelled': return <Badge variant="outline" className="text-slate-500">Dibatalkan</Badge>;
      case 'emergency_pending': return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"><AlertCircle className="w-3 h-3 mr-1"/> Pending (Mendesak)</Badge>;
      case 'emergency_quota_full': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200"><AlertCircle className="w-3 h-3 mr-1"/> Pending (Kuota Penuh)</Badge>;
      case 'pending': 
      default: return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Clock className="w-3 h-3 mr-1"/> Menunggu</Badge>;
    }
  };

  const CountdownTimer = ({ date, time }: { date: string, time?: string }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isEmergencyPhase, setIsEmergencyPhase] = useState(false);
    const [isClosed, setIsClosed] = useState(false);

    useEffect(() => {
      const calculateTime = () => {
        // Build valid ISO string for event time
        const eventDateStr = date.split('T')[0];
        const eventTimeStr = time || '00:00';
        const eventDateTime = new Date(`${eventDateStr}T${eventTimeStr}:00`);
        
        // H-3 jam limit (Penutupan normal)
        const normalDeadline = new Date(eventDateTime.getTime() - (3 * 60 * 60 * 1000));
        const now = new Date();

        if (now > eventDateTime) {
          setIsClosed(true);
          setTimeLeft('Berakhir');
          return;
        }

        let target = normalDeadline;
        let isEmerg = false;
        if (now > normalDeadline) {
          isEmerg = true;
          target = eventDateTime; // After H-3 hours, the hard deadline is the event itself
        }
        
        setIsEmergencyPhase(isEmerg);

        const diff = target.getTime() - now.getTime();
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        let timeStr = '';
        if (d > 0) timeStr += `${d}h `;
        timeStr += `${h}j ${m}m ${s}d`;
        setTimeLeft(timeStr);
      };

      calculateTime(); // initial call
      const timer = setInterval(calculateTime, 1000);
      return () => clearInterval(timer);
    }, [date, time]);

    if (isClosed) {
      return <div className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1"><XCircle className="w-3 h-3" /> Waktu Habis</div>;
    }

    if (isEmergencyPhase) {
      return <div className="text-[11px] font-medium text-amber-600 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Sisa Darurat: {timeLeft}</div>;
    }

    return <div className="text-[11px] font-medium text-indigo-600 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Sisa Waktu (H-3 Jam): {timeLeft}</div>;
  };

  return (
    <>
      <Card className="border-indigo-100 shadow-sm">
        <CardHeader className="bg-indigo-50/30 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Izin Saya
          </CardTitle>
          <CardDescription>Kegiatan mendatang dan status izin</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="text-center py-4 text-sm text-slate-500">Memuat data...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-6 text-slate-400 border border-dashed rounded-lg">
              <CalendarDays className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">Tidak ada kegiatan mendatang.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((item, idx) => {
                const eventDate = new Date(`${item.activity.date.split('T')[0]}T${item.activity.time || '00:00'}:00`);
                const isPast = new Date() > eventDate;
                
                return (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="mb-2 sm:mb-0">
                      <p className="font-semibold text-sm text-slate-800">{item.activity.name}</p>
                      <p className="text-xs text-slate-500">{new Date(item.activity.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })} • {item.activity.time || '00:00'} WIB • {item.activity.scope}</p>
                      {!item.permission && !isPast && (
                        <CountdownTimer date={item.activity.date} time={item.activity.time} />
                      )}
                      {item.permission?.cancellationReason && item.permission.status === 'rejected' && (
                        <p className="text-[10px] text-red-600 mt-1 italic">Alasan tolak: {item.permission.cancellationReason}</p>
                      )}
                    </div>
                    <div>
                      {item.permission ? (
                        getStatusBadge(item.permission.status)
                      ) : isPast ? (
                        <Badge variant="outline" className="text-slate-500 bg-slate-50">Selesai</Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs h-8 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                          onClick={() => handleAjukanIzin(item.activity)}
                        >
                          Ajukan Izin
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <FormPengajuanIzin 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        member={member}
        activity={selectedActivity}
        onSuccess={fetchDashboardData}
      />
    </>
  );
}
