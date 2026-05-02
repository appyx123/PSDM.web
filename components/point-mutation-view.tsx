'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Member } from '@/app/page';
import { Trash2, Loader2, ExternalLink } from 'lucide-react';

export interface PointCategory {
  id: string;
  name: string;
  type: 'REWARD' | 'PUNISHMENT';
  points: number;
}

export interface PointLog {
  id: string;
  memberId: string;
  type: string;
  category: string;
  points: number;
  description: string;
  createdAt: string;
  member?: {
    name: string;
    prn: string;
  };
}

interface PointMutationViewProps {
  members: Member[];
  onRefresh: () => void;
}

export function PointMutationView({ members, onRefresh }: PointMutationViewProps) {
  const [pointLogs, setPointLogs] = useState<PointLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<PointCategory[]>([]);
  const [isCatLoading, setIsCatLoading] = useState(true);

  const [claims, setClaims] = useState<any[]>([]);
  const [isClaimsLoading, setIsClaimsLoading] = useState(true);

  // Form State
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(''); // ID of category or 'OTHER'
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [points, setPoints] = useState<number>(0);
  const [mutationType, setMutationType] = useState<'REWARD' | 'PUNISHMENT'>('REWARD');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);



  const fetchPointLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/point-logs');
      if (res.ok) {
        const data = await res.json();
        setPointLogs(data);
      }
    } catch (error) {
      console.error('Failed to fetch point logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    setIsCatLoading(true);
    try {
      const res = await fetch('/api/admin/point-categories');
      if (res.ok) setCategories(await res.json());
    } finally {
      setIsCatLoading(false);
    }
  };

  const fetchClaims = async () => {
    setIsClaimsLoading(true);
    try {
      const res = await fetch('/api/claims?status=PENDING');
      if (res.ok) setClaims(await res.json());
    } finally {
      setIsClaimsLoading(false);
    }
  };

  useEffect(() => {
    fetchPointLogs();
    fetchCategories();
    fetchClaims();
  }, []);

  const handleVerifyClaim = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    let rejectionReason = '';
    if (status === 'REJECTED') {
      const reason = prompt('Alasan penolakan:');
      if (reason === null) return;
      rejectionReason = reason;
    }

    try {
      const res = await fetch(`/api/claims/${id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason })
      });

      if (res.ok) {
        fetchClaims();
        fetchPointLogs();
        onRefresh();
      } else {
        alert('Gagal memverifikasi klaim');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    if (val === 'OTHER') {
      setPoints(0);
      return;
    }
    const option = categories.find((opt) => opt.id === val);
    if (option) {
      setPoints(option.points);
      setMutationType(option.type);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !selectedCategory) {
      alert("Harap pilih Anggota dan Kategori.");
      return;
    }

    if (selectedCategory === 'OTHER' && !customCategoryName) {
      alert("Harap isi nama kategori lainnya.");
      return;
    }

    setIsSubmitting(true);
    try {
      const categoryObj = categories.find(c => c.id === selectedCategory);
      const categoryLabel = categoryObj ? categoryObj.name : customCategoryName;
      const type = categoryObj ? categoryObj.type : mutationType;

      const res = await fetch('/api/point-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMember,
          type: type,
          category: categoryLabel,
          points: points,
          description: description || '-',
        }),
      });

      if (res.ok) {
        setSelectedMember('');
        setSelectedCategory('');
        setCustomCategoryName('');
        setPoints(0);
        setDescription('');
        fetchPointLogs();
        onRefresh();
      } else {
        const err = await res.json();
        alert(`Gagal menyimpan: ${err.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan (undo) mutasi poin ini?')) return;

    try {
      const res = await fetch(`/api/point-logs/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchPointLogs();
        onRefresh();
      } else {
        alert('Gagal membatalkan mutasi poin.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Evaluasi & Apresiasi</h1>
        <p className="text-slate-600 mt-1">
          Modul untuk mencatat penambahan atau pengurangan poin di luar presensi kegiatan.
        </p>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="mb-4 bg-white border border-slate-200">
          <TabsTrigger value="manual" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Penilaian Manual</TabsTrigger>
          <TabsTrigger value="claims" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
            Verifikasi Klaim
            {claims.length > 0 && (
              <Badge variant="destructive" className="ml-2 bg-red-500 hover:bg-red-600">{claims.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-1">
              <Card className="border-indigo-100 shadow-md">
                <CardHeader className="bg-indigo-50/30">
                  <CardTitle>Eksekusi Penilaian</CardTitle>
                  <CardDescription>Pilih anggota dan kategori penilaian standar.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold">1. Pilih Anggota</Label>
                        <Select value={selectedMember} onValueChange={setSelectedMember}>
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="Pilih pengurus..." />
                          </SelectTrigger>
                          <SelectContent>
                            {members.filter(m => m.status === 'AKTIF').map(m => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name} ({m.prn})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold">2. Kategori Penilaian</Label>
                        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder="Pilih Kategori..." />
                          </SelectTrigger>
                          <SelectContent>
                            {isCatLoading ? (
                              <SelectItem value="loading" disabled>Memuat kategori...</SelectItem>
                            ) : (
                              <>
                                {categories.map(opt => (
                                  <SelectItem key={opt.id} value={opt.id}>
                                    <div className="flex items-center gap-2">
                                      <span>{opt.type === 'REWARD' ? '🟢' : '🔴'}</span>
                                      <span>{opt.name}</span>
                                      <span className="text-[10px] font-bold text-slate-400">
                                        ({opt.points > 0 ? `+${opt.points}` : opt.points})
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                                <SelectItem value="OTHER" className="font-bold text-indigo-600 border-t">✨ Lainnya (Input Bebas)</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedCategory === 'OTHER' && (
                        <div className="space-y-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-indigo-700 uppercase">Nama Kategori Kustom</Label>
                            <Input 
                              placeholder="Contoh: Panitia Terbaik Bulan Ini" 
                              value={customCategoryName}
                              onChange={e => setCustomCategoryName(e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-bold text-indigo-700 uppercase">Jenis</Label>
                              <Select value={mutationType} onValueChange={(v: any) => setMutationType(v)}>
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="REWARD">🟢 Reward</SelectItem>
                                  <SelectItem value="PUNISHMENT">🔴 Punishment</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-bold text-indigo-700 uppercase">Poin</Label>
                              <Input 
                                type="number" 
                                className="h-9"
                                placeholder="0"
                                value={points || ''}
                                onFocus={(e) => e.target.select()}
                                onChange={e => setPoints(e.target.value === '' ? 0 : parseInt(e.target.value))}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedCategory && selectedCategory !== 'OTHER' && (
                        <div className={`p-4 rounded-xl border flex items-center justify-between ${
                          mutationType === 'REWARD' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Poin Otomatis</p>
                            <p className={`text-2xl font-black ${mutationType === 'REWARD' ? 'text-green-700' : 'text-red-700'}`}>
                              {points > 0 ? `+${points}` : points}
                            </p>
                          </div>
                          <Badge className={mutationType === 'REWARD' ? 'bg-green-600' : 'bg-red-600'}>
                            {mutationType}
                          </Badge>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold">3. Catatan Tambahan (Opsional)</Label>
                        <Textarea 
                          placeholder="Detail alasan atau keterangan tambahan..." 
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="resize-none border-slate-300"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full h-12 text-white bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 shadow-lg font-bold text-lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Penilaian'}
                      </Button>
                    </form>
                </CardContent>
              </Card>
            </div>

            {/* History Section */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Riwayat Mutasi Poin</CardTitle>
                  <CardDescription>Log data penambahan dan pengurangan poin manual.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8 text-slate-500">Memuat riwayat...</div>
                  ) : pointLogs.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 border border-dashed rounded-lg bg-slate-50">
                      Belum ada catatan mutasi poin.
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Anggota</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead className="text-right">Poin</TableHead>
                            <TableHead className="text-center">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pointLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-slate-900">{log.member?.name}</div>
                                <div className="text-xs text-slate-500">{log.member?.prn}</div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={log.type === 'PUNISHMENT' ? 'text-red-700 bg-red-50 border-red-200' : 'text-green-700 bg-green-50 border-green-200'}>
                                    {log.type === 'PUNISHMENT' ? 'Punishment' : 'Reward'}
                                  </Badge>
                                  <span className="text-sm font-medium">{log.category}</span>
                                </div>
                                {log.description !== '-' && (
                                  <div className="text-xs text-slate-500 mt-1 max-w-[200px] truncate" title={log.description}>
                                    Catatan: {log.description}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className={`text-right font-bold ${log.points < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {log.points > 0 ? `+${log.points}` : log.points}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDelete(log.id)}
                                  className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                  title="Batalkan (Undo)"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="claims">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Klaim Prestasi (Menunggu Verifikasi)</CardTitle>
              <CardDescription>Verifikasi pengajuan poin reward dari pengurus.</CardDescription>
            </CardHeader>
            <CardContent>
              {isClaimsLoading ? (
                <div className="text-center py-8 text-slate-500">Memuat data klaim...</div>
              ) : claims.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg bg-slate-50">
                  <p className="text-slate-500">Tidak ada pengajuan klaim yang perlu diverifikasi.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {claims.map((claim) => (
                    <div key={claim.id} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-indigo-700 border-indigo-200 bg-indigo-50">
                            {claim.category}
                          </Badge>
                          <span className="text-xs text-slate-500">{new Date(claim.createdAt).toLocaleDateString('id-ID')}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg">
                          {claim.member?.name} <span className="text-slate-500 text-sm font-normal">({claim.member?.prn})</span>
                        </h4>
                        <div className="mt-2 text-sm text-slate-700">
                          <p><span className="font-medium">Sub-Kategori:</span> {claim.subCategory} <span className="font-bold text-green-600">(+{claim.claimedPoints} Poin)</span></p>
                          <p className="mt-1"><span className="font-medium">Deskripsi:</span> {claim.description}</p>
                        </div>
                        {claim.evidence && (
                          <div className="mt-3 text-sm">
                            <a href={claim.evidence} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> Lihat Bukti Lampiran
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="flex items-end gap-2 shrink-0">
                        <Button 
                          variant="outline" 
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleVerifyClaim(claim.id, 'REJECTED')}
                        >
                          Tolak
                        </Button>
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleVerifyClaim(claim.id, 'APPROVED')}
                        >
                          Setujui
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
