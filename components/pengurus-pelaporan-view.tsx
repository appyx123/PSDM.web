'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Member } from '@/app/page';
import { FormKlaimPrestasi } from './form-klaim-prestasi';
import { PlusCircle, ExternalLink, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { EvidencePreview } from './evidence-preview';

interface PengurusPelaporanViewProps {
  member: Member;
}

export function PengurusPelaporanView({ member }: PengurusPelaporanViewProps) {
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchClaims = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/claims');
      if (res.ok) {
        setClaims(await res.json());
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleSuccess = () => {
    setShowForm(false);
    fetchClaims();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pelaporan Kegiatan Positif</h1>
          <p className="text-slate-500 text-sm mt-1">Laporkan kegiatan atau prestasi Anda untuk mendapatkan apresiasi poin.</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
            <PlusCircle className="w-4 h-4 mr-2" />
            Buat Laporan Baru
          </Button>
        )}
      </div>

      {showForm ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <FormKlaimPrestasi member={member} onSuccess={handleSuccess} onCancel={() => setShowForm(false)} />
        </div>
      ) : (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Riwayat Pengajuan</CardTitle>
            <CardDescription>Daftar kegiatan yang pernah Anda laporkan beserta status verifikasinya.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : claims.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg bg-slate-50/50">
                <p className="text-slate-500">Belum ada laporan kegiatan.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {claims.map((claim) => (
                  <div key={claim.id} className="group p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1 w-full space-y-4">
                        {/* Header Section */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1.5">
                            <h4 className="font-bold text-slate-900 text-lg group-hover:text-indigo-700 transition-colors leading-tight">
                              {claim.activityName}
                            </h4>
                            <div className="flex items-center gap-3 text-slate-500 text-xs font-medium">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                <span>{new Date(claim.activityDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                              </div>
                              <div className="w-1 h-1 rounded-full bg-slate-300" />
                              <span>Diajukan {new Date(claim.createdAt).toLocaleDateString('id-ID')}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            {claim.status === 'APPROVED' && claim.pointsAwarded !== null && (
                              <Badge className="bg-green-600 text-white font-bold px-2.5 py-0.5">
                                +{claim.pointsAwarded} Poin
                              </Badge>
                            )}
                            <Badge className={
                              claim.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                              claim.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            } variant="outline">
                              {claim.status === 'APPROVED' ? 'Disetujui' : claim.status === 'REJECTED' ? 'Ditolak' : 'Menunggu Verifikasi'}
                            </Badge>
                          </div>
                        </div>

                        {/* Description Box */}
                        <div className="relative bg-slate-50/80 p-4 rounded-xl border border-slate-100 group-hover:bg-slate-50 transition-colors">
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {claim.description}
                          </p>
                        </div>
                        
                        {/* Footer / Documentation Link */}
                        <div className="flex items-center justify-between pt-1">
                          {claim.evidence ? (
                            <button 
                              onClick={() => setPreviewUrl(claim.evidence)}
                              className="text-xs text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1.5 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-all active:scale-95"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Lihat Dokumentasi
                            </button>
                          ) : (
                            <div />
                          )}
                          
                          {claim.verifiedAt && (
                            <span className="text-[10px] text-slate-400 italic">
                              Diverifikasi pada {new Date(claim.verifiedAt).toLocaleDateString('id-ID')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Rejection Reason Alert */}
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <EvidencePreview 
        url={previewUrl || ''} 
        isOpen={!!previewUrl} 
        onClose={() => setPreviewUrl(null)} 
      />
    </div>
  );
}
