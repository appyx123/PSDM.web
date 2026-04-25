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
import { Trash2 } from 'lucide-react';

export interface PointCategory {
  id: string;
  type: string;
  label: string;
  value: string;
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

  // Form State
  const [activeTab, setActiveTab] = useState<'PUNISHMENT' | 'REWARD'>('PUNISHMENT');
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [points, setPoints] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeOptions = categories.filter(c => c.type === activeTab);

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
      const res = await fetch('/api/point-categories');
      if (res.ok) setCategories(await res.json());
    } finally {
      setIsCatLoading(false);
    }
  };

  useEffect(() => {
    fetchPointLogs();
    fetchCategories();
  }, []);

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    const option = activeOptions.find((opt) => opt.id === val);
    if (option) {
      setPoints(option.points);
    }
  };

  const handleTabChange = (val: string) => {
    const tab = val as 'PUNISHMENT' | 'REWARD';
    setActiveTab(tab);
    setSelectedCategory('');
    setPoints(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !selectedCategory) {
      alert("Harap pilih Anggota dan Kategori SOP.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Resolve the category label from its id
      const categoryObj = activeOptions.find(c => c.id === selectedCategory);
      const categoryLabel = categoryObj?.label || selectedCategory;

      // Enforce correct sign: PUNISHMENT must always be negative, REWARD always positive
      const finalPoints = activeTab === 'PUNISHMENT'
        ? -Math.abs(points)
        : Math.abs(points);

      const res = await fetch('/api/point-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMember,
          type: activeTab,
          category: categoryLabel,
          points: finalPoints,
          description: description || '-',
        }),
      });

      if (res.ok) {
        // Reset form
        setSelectedMember('');
        setSelectedCategory('');
        setPoints(0);
        setDescription('');
        
        // Refresh data
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Mutasi Poin Manual</CardTitle>
              <CardDescription>Pilih anggota dan kategori evaluasi.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="PUNISHMENT" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                    🔴 Punishment
                  </TabsTrigger>
                  <TabsTrigger value="REWARD" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700">
                    🟢 Reward
                  </TabsTrigger>
                </TabsList>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Pilih Anggota</Label>
                    <Select value={selectedMember} onValueChange={setSelectedMember}>
                      <SelectTrigger>
                        <SelectValue placeholder="Cari Anggota..." />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map(m => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name} ({m.prn})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Kategori SOP</Label>
                    <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Kategori..." />
                      </SelectTrigger>
                      <SelectContent>
                        {isCatLoading ? (
                          <SelectItem value="loading" disabled>Memuat kategori...</SelectItem>
                        ) : activeOptions.length === 0 ? (
                          <SelectItem value="empty" disabled>Belum ada kategori. Tambah di Settings.</SelectItem>
                        ) : activeOptions.map(opt => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.label} ({opt.points > 0 ? `+${opt.points}` : opt.points})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Nilai Poin</Label>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold w-6 ${activeTab === 'PUNISHMENT' ? 'text-red-600' : 'text-green-600'}`}>
                        {activeTab === 'PUNISHMENT' ? '−' : '+'}
                      </span>
                      <Input 
                        type="number" 
                        min={0}
                        value={Math.abs(points)} 
                        onChange={(e) => {
                          const abs = parseInt(e.target.value) || 0;
                          setPoints(activeTab === 'PUNISHMENT' ? -abs : abs);
                        }} 
                        className="flex-1"
                      />
                    </div>
                    <p className={`text-xs font-medium ${activeTab === 'PUNISHMENT' ? 'text-red-500' : 'text-green-600'}`}>
                      {activeTab === 'PUNISHMENT'
                        ? `Akan mengurangi poin sebesar ${Math.abs(points)} poin.`
                        : `Akan menambah poin sebesar ${Math.abs(points)} poin.`}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Catatan (Opsional)</Label>
                    <Textarea 
                      placeholder="Tambahkan keterangan spesifik..." 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="resize-none"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className={`w-full text-white ${activeTab === 'PUNISHMENT' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Eksekusi Mutasi Poin'}
                  </Button>
                </form>
              </Tabs>
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
    </div>
  );
}
