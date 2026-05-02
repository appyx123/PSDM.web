'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  Calendar, 
  User, 
  Award,
  AlertCircle,
  History,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EvidencePreview } from './evidence-preview';

interface AdminClaimsViewProps {
  userRole?: string;
  userId?: string;
}

export function AdminClaimsView({ userRole, userId }: AdminClaimsViewProps) {
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [points, setPoints] = useState<string>('0');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const [pjMapping, setPjMapping] = useState<any>({});

  const fetchPjMapping = async () => {
    try {
      const res = await fetch('/api/admin/settings/pj-mapping');
      if (res.ok) setPjMapping(await res.json());
    } catch(e) {}
  };

  const fetchClaims = async () => {
    setIsLoading(true);
    try {
      const url = filter === 'PENDING' ? '/api/claims?status=PENDING' : '/api/claims';
      const res = await fetch(url);
      if (res.ok) {
        setClaims(await res.json());
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
    fetchPjMapping();
  }, [filter]);

  const handleAction = async () => {
    if (!selectedClaim || !actionType) return;
    
    if (actionType === 'APPROVE' && (parseInt(points) <= 0 || isNaN(parseInt(points)))) {
      alert('Masukkan jumlah poin yang valid');
      return;
    }
    
    if (actionType === 'REJECT' && !reason.trim()) {
      alert('Masukkan alasan penolakan');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/claims/${selectedClaim.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: actionType === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          pointsAwarded: actionType === 'APPROVE' ? parseInt(points) : null,
          rejectionReason: actionType === 'REJECT' ? reason : null
        })
      });

      if (res.ok) {
        toast({
          title: actionType === 'APPROVE' ? 'Klaim Disetujui' : 'Klaim Ditolak',
          description: `Klaim dari ${selectedClaim.member.name} telah diproses.`
        });
        setSelectedClaim(null);
        setActionType(null);
        setPoints('0');
        setReason('');
        fetchClaims();
      } else {
        throw new Error('Gagal memproses klaim');
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Verifikasi Klaim Kegiatan</h1>
          <p className="text-slate-500 text-sm mt-1">Tinjau dan berikan poin apresiasi untuk laporan kegiatan positif pengurus.</p>
        </div>

        <Tabs value={filter} onValueChange={(val: any) => setFilter(val)} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-2 w-full md:w-[300px] bg-slate-100 p-1">
            <TabsTrigger value="PENDING" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Clock className="w-4 h-4 mr-2" />
              Pending
            </TabsTrigger>
            <TabsTrigger value="HISTORY" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <History className="w-4 h-4 mr-2" />
              Riwayat
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {userRole === 'ADMIN' && (
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-indigo-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-indigo-900">Filter PJ Aktif</p>
            <p className="text-xs text-indigo-700">
              Anda hanya melihat klaim dari departemen: {' '}
              <span className="font-bold">
                {Object.entries(pjMapping)
                  .filter(([_, uid]) => uid === userId)
                  .map(([dept]) => dept)
                  .join(', ') || 'Tidak ada (Hubungi Super Admin)'}
              </span>
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : claims.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              {filter === 'PENDING' ? <CheckCircle2 className="w-8 h-8 text-slate-300" /> : <History className="w-8 h-8 text-slate-300" />}
            </div>
            <p className="text-slate-500 font-medium text-lg">
              {filter === 'PENDING' ? 'Tidak ada klaim pending' : 'Belum ada riwayat klaim'}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {filter === 'PENDING' ? 'Semua pengajuan telah diproses.' : 'Riwayat pengajuan akan muncul di sini.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {claims.map((claim) => (
            <Card key={claim.id} className="group overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors leading-tight">
                            {claim.activityName}
                          </h3>
                          {claim.status === 'APPROVED' && claim.pointsAwarded !== null && (
                            <Badge className="bg-green-600 text-white font-bold">+{claim.pointsAwarded} Poin</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 items-center text-sm text-slate-500 font-medium">
                          <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4 text-indigo-500" />
                            <span>{claim.member.name} <span className="text-slate-400 font-normal">({claim.member.prn})</span></span>
                          </div>
                          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            <span>{new Date(claim.activityDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${
                          claim.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                          claim.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        } shrink-0`}
                      >
                        {claim.status === 'APPROVED' ? 'Disetujui' : claim.status === 'REJECTED' ? 'Ditolak' : 'Menunggu Verifikasi'}
                      </Badge>
                    </div>

                    <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-100 group-hover:bg-slate-50 transition-colors">
                      <p className="text-sm text-slate-700 leading-relaxed italic">"{claim.description}"</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      {claim.evidence && (
                        <button 
                          onClick={() => setPreviewUrl(claim.evidence)}
                          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 transition-all active:scale-95"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Lihat Bukti Dokumentasi
                        </button>
                      )}
                      {claim.verifiedAt && (
                        <p className="text-[10px] text-slate-400 font-medium italic">
                          Diverifikasi pada {new Date(claim.verifiedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>

                    {claim.status === 'REJECTED' && claim.rejectionReason && (
                      <div className="mt-4 p-4 bg-red-50/50 text-red-800 text-xs rounded-xl border border-red-100 flex gap-3 items-center">
                        <div className="w-8 h-8 rounded-lg bg-red-100/50 flex items-center justify-center shrink-0 border border-red-200/50">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <span className="font-bold text-red-900 block mb-0.5 uppercase tracking-wider text-[10px]">Alasan Penolakan</span>
                          <p className="leading-relaxed opacity-90">{claim.rejectionReason}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {claim.status === 'PENDING' && (
                    <div className="md:w-56 bg-slate-50/50 border-t md:border-t-0 md:border-l border-slate-100 p-6 flex flex-col justify-center gap-3">
                      <Button 
                        onClick={() => { setSelectedClaim(claim); setActionType('APPROVE'); }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md transition-all active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Setujui
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => { setSelectedClaim(claim); setActionType('REJECT'); }}
                        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all active:scale-95"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Tolak
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approve/Reject Dialog */}
      <Dialog open={!!selectedClaim} onOpenChange={(open) => !open && setSelectedClaim(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'APPROVE' ? (
                <>
                  <Award className="w-5 h-5 text-green-600" />
                  <span>Setujui Pengajuan Klaim</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span>Tolak Pengajuan Klaim</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedClaim ? (
                <>Kegiatan: <span className="font-semibold text-slate-900">{selectedClaim.activityName}</span> oleh {selectedClaim.member.name}</>
              ) : (
                "Memuat detail pengajuan..."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {actionType === 'APPROVE' ? (
              <div className="space-y-2">
                <Label htmlFor="points">Jumlah Poin Apresiasi</Label>
                <div className="relative">
                  <Input 
                    id="points" 
                    type="number" 
                    value={points} 
                    onChange={e => setPoints(e.target.value)}
                    className="pl-8"
                  />
                  <Award className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
                <p className="text-[10px] text-slate-500">Poin ini akan ditambahkan ke saldo anggota secara otomatis.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="reason">Alasan Penolakan</Label>
                <Textarea 
                  id="reason" 
                  placeholder="Berikan alasan mengapa klaim ditolak..." 
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={4}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedClaim(null)}>Batal</Button>
            <Button 
              onClick={handleAction} 
              disabled={isSubmitting}
              className={actionType === 'APPROVE' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Konfirmasi {actionType === 'APPROVE' ? 'Persetujuan' : 'Penolakan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EvidencePreview 
        url={previewUrl || ''} 
        isOpen={!!previewUrl} 
        onClose={() => setPreviewUrl(null)} 
      />
    </div>
  );
}
