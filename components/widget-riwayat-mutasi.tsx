'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Member } from '@/app/page';

interface WidgetRiwayatMutasiProps {
  member: Member;
}

export function WidgetRiwayatMutasi({ member }: WidgetRiwayatMutasiProps) {
  const [mutations, setMutations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMutations = async () => {
      try {
        const res = await fetch('/api/point-mutations/my');
        if (res.ok) {
          setMutations(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch mutations', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMutations();
  }, [member.id]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Riwayat Poin Anda</CardTitle>
            <CardDescription>Catatan perubahan poin Anda (Otomatis & Klaim).</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : mutations.length === 0 ? (
          <div className="text-center py-6 border border-dashed rounded-lg bg-slate-50 text-sm">
            <p className="text-slate-500">Belum ada riwayat mutasi poin.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {mutations.map((mut) => (
              <div key={mut.id} className="flex justify-between items-start p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] bg-slate-50">
                      {mut.category}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {new Date(mut.date).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-800">{mut.subCategory}</h4>
                  {mut.description && mut.description !== '-' && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2" title={mut.description}>{mut.description}</p>
                  )}
                </div>
                <div className={`font-bold text-sm whitespace-nowrap mt-1 ${mut.type === 'REWARD' ? 'text-green-600' : 'text-red-600'}`}>
                  {mut.points > 0 ? `+${mut.points}` : mut.points}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
