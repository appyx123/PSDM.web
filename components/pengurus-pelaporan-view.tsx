'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Member } from '@/app/page';
import { FormKlaimPrestasi } from './form-klaim-prestasi';
import { PlusCircle, ExternalLink, Loader2 } from 'lucide-react';

interface PengurusPelaporanViewProps {
  member: Member;
}

export function PengurusPelaporanView({ member }: PengurusPelaporanViewProps) {
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

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
          <h1 className="text-2xl font-bold text-slate-900">Pelaporan Klaim Prestasi</h1>
          <p className="text-slate-500 text-sm mt-1">Ajukan dan pantau status klaim poin reward Anda.</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <PlusCircle className="w-4 h-4 mr-2" />
            Buat Klaim Baru
          </Button>
        )}
      </div>

      {showForm ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <FormKlaimPrestasi member={member} onSuccess={handleSuccess} onCancel={() => setShowForm(false)} />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Riwayat Pengajuan</CardTitle>
            <CardDescription>Daftar klaim yang pernah Anda ajukan beserta statusnya.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : claims.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg bg-slate-50">
                <p className="text-slate-500">Belum ada pengajuan klaim.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {claims.map((claim) => (
                  <div key={claim.id} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Badge variant="outline" className="mb-2 text-indigo-700 border-indigo-200 bg-indigo-50">
                          {claim.category}
                        </Badge>
                        <h4 className="font-bold text-slate-800">{claim.subCategory} <span className="text-green-600 ml-1">(+{claim.claimedPoints})</span></h4>
                        <p className="text-sm text-slate-600 mt-1">{claim.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={
                          claim.status === 'APPROVED' ? 'bg-green-100 text-green-800 border-green-200' :
                          claim.status === 'REJECTED' ? 'bg-red-100 text-red-800 border-red-200' :
                          'bg-yellow-100 text-yellow-800 border-yellow-200'
                        } variant="outline">
                          {claim.status === 'APPROVED' ? 'Disetujui' : claim.status === 'REJECTED' ? 'Ditolak' : 'Menunggu Verifikasi'}
                        </Badge>
                        <p className="text-xs text-slate-400 mt-2">
                          {new Date(claim.createdAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                    {claim.evidence && (
                      <div className="mt-3 text-sm">
                        <a href={claim.evidence} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 inline-flex">
                          <ExternalLink className="w-3 h-3" />
                          Lihat Bukti Lampiran
                        </a>
                      </div>
                    )}
                    {claim.status === 'REJECTED' && claim.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 text-red-800 text-sm rounded-md border border-red-100">
                        <span className="font-semibold">Alasan Penolakan: </span>
                        {claim.rejectionReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
