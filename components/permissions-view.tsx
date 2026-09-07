'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, CheckCircle, XCircle, AlertTriangle, AlertCircle, Loader2, ShieldAlert, Maximize2 } from 'lucide-react';
import { Member } from '@/app/page';
import { getImageUrl } from '@/lib/utils';

interface PermissionsViewProps {
  sysSettings?: any;
  userRole?: string;
  userId?: string;
}

export function PermissionsView({ sysSettings, userRole, userId }: PermissionsViewProps) {
  const [activeTab, setActiveTab] = useState('masuk');
  const [permissions, setPermissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const typeLabels: Record<string, string> = {
    'sick': 'Sakit',
    'academic': 'Akademik',
    'emergency': 'Darurat',
    'late': 'Terlambat'
  };
  
  // Modals state
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  
  // Form states
  const [verifyStatus, setVerifyStatus] = useState('approved');
  const [verifyReason, setVerifyReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [fallbackStatus, setFallbackStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PJ Mapping
  const [pjMapping, setPjMapping] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/permissions?status=${activeTab === 'masuk' ? 'pending_all' : 'history'}`);
      if (res.ok) setPermissions(await res.json());
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.filter((u: any) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'));
      }
    } catch(e) {}
  };

  const fetchPjMapping = async () => {
    try {
      const res = await fetch('/api/admin/settings/pj-mapping');
      if (res.ok) setPjMapping(await res.json());
    } catch(e) {}
  };

  useEffect(() => {
    fetchPermissions();
  }, [activeTab]);

  useEffect(() => {
    fetchUsers();
    fetchPjMapping();
  }, []);

  const handleVerify = async () => {
    if (verifyStatus === 'rejected' && !verifyReason) {
      alert('Alasan penolakan wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/permissions/${selectedItem.id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: verifyStatus, cancellationReason: verifyReason })
      });
      if (res.ok) {
        setVerifyModalOpen(false);
        fetchPermissions();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason) {
      alert('Alasan pembatalan wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/permissions/${selectedItem.id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationReason: cancelReason, fallbackStatus })
      });
      if (res.ok) {
        setCancelModalOpen(false);
        fetchPermissions();
      } else {
        alert('Gagal membatalkan izin.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePj = async (dept: string, userId: string) => {
    const newMapping = { ...pjMapping, [dept]: userId };
    setPjMapping(newMapping);
    await fetch('/api/admin/settings/pj-mapping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMapping)
    });
  };

  const departments = ['PSDM', 'Media', 'Penalaran', 'Kompres', 'Ristek', 'Humas', 'Trisula'];

  return (
    <div className="space-y-6 pb-12">

      {userRole === 'ADMIN' && (
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-indigo-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-indigo-900">Filter PJ Aktif</p>
            <p className="text-xs text-indigo-700">
              Anda hanya melihat pengajuan dari departemen: {' '}
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border p-1 rounded-lg">
          <TabsTrigger value="masuk">Pengajuan Masuk</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat</TabsTrigger>
        </TabsList>

        <TabsContent value="masuk" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Menunggu Persetujuan</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-slate-500">Memuat...</div>
              ) : permissions.length === 0 ? (
                <div className="py-8 text-center border-dashed border rounded-xl text-slate-400">
                  Tidak ada pengajuan izin masuk.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pengurus</TableHead>
                      <TableHead>Kegiatan</TableHead>
                      <TableHead>Jenis / Status</TableHead>
                      <TableHead>PJ Verifikator</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-bold">{p.member.name}</div>
                          <div className="text-xs text-slate-500">{p.member.department}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{p.activity.name}</div>
                          <div className="text-xs text-slate-500">{new Date(p.activity.date).toLocaleDateString('id-ID')}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium mb-1">{
                            typeLabels[p.type.toLowerCase()] || p.type
                          }</div>
                          {p.status === 'emergency_pending' && <Badge className="bg-amber-100 text-amber-800"><AlertTriangle className="w-3 h-3 mr-1"/> Darurat H-3 Jam</Badge>}
                          {p.status === 'emergency_quota_full' && <Badge className="bg-orange-100 text-orange-800"><AlertCircle className="w-3 h-3 mr-1"/> Kuota Penuh ({'>'}7)</Badge>}
                          {p.status === 'pending' && <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Reguler</Badge>}
                        </TableCell>
                        <TableCell>{p.pj?.name || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => { setSelectedItem(p); setVerifyStatus('approved'); setVerifyReason(''); setVerifyModalOpen(true); }} className="bg-indigo-600">Verifikasi</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="riwayat" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Perizinan</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-slate-500">Memuat...</div>
              ) : permissions.length === 0 ? (
                <div className="py-8 text-center border-dashed border rounded-xl text-slate-400">
                  Belum ada riwayat.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pengurus</TableHead>
                      <TableHead>Kegiatan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Diverifikasi Oleh</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-bold">{p.member.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{p.activity.name}</div>
                        </TableCell>
                        <TableCell>
                          {p.status === 'approved' && <Badge className="bg-green-100 text-green-800">Disetujui</Badge>}
                          {p.status === 'rejected' && <Badge className="bg-red-100 text-red-800">Ditolak</Badge>}
                          {p.status === 'cancelled' && <Badge variant="outline">Dibatalkan</Badge>}
                        </TableCell>
                        <TableCell>{p.verifiedBy?.name || '-'}</TableCell>
                        <TableCell className="text-right">
                          {p.status === 'approved' && (
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { setSelectedItem(p); setCancelReason(''); setFallbackStatus(''); setCancelModalOpen(true); }}>
                              Batalkan
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>

      {/* VERIFY MODAL */}
      <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
        <DialogContent>
          <DialogHeader>
             <DialogTitle>Verifikasi Izin</DialogTitle>
             <DialogDescription>Tinjau alasan dan bukti pengajuan izin sebelum memberikan keputusan.</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
               <div className="p-3 bg-slate-50 border rounded-md text-sm space-y-1">
                 <p><strong>Nama:</strong> {selectedItem.member.name}</p>
                 <p><strong>Kegiatan:</strong> {selectedItem.activity.name}</p>
                 <p><strong>Alasan:</strong> {selectedItem.reason}</p>
                 {selectedItem.evidence && (
                   <div className="mt-3">
                     <p className="font-bold mb-1">Bukti Dokumentasi:</p>
                     {selectedItem.evidence.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) ? (
                       <div className="relative group rounded-lg overflow-hidden border bg-white shadow-sm max-h-[300px] overflow-y-auto">
                         <img 
                           src={getImageUrl(selectedItem.evidence) || ''} 
                           alt="Evidence Preview" 
                           className="w-full object-contain cursor-pointer hover:scale-[1.02] transition-transform" 
                           onClick={() => window.open(getImageUrl(selectedItem.evidence) || '', '_blank')}
                           onError={(e) => {
                             (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Bukti+Tidak+Ditemukan';
                           }}
                         />
                         <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => window.open(getImageUrl(selectedItem.evidence) || '', '_blank')}>
                             <Maximize2 className="h-4 w-4" />
                           </Button>
                         </div>
                       </div>
                     ) : (
                       <a href={getImageUrl(selectedItem.evidence) || '#'} target="_blank" className="text-indigo-600 underline flex items-center gap-1">
                         <FileText className="h-4 w-4" /> {selectedItem.evidence}
                       </a>
                     )}
                   </div>
                 )}
               </div>
               
               <div className="space-y-2">
                 <Label>Keputusan</Label>
                 <Select value={verifyStatus} onValueChange={setVerifyStatus}>
                   <SelectTrigger><SelectValue/></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="approved">Setujui (Absen jadi Izin/Sakit, Poin 0)</SelectItem>
                     <SelectItem value="rejected">Tolak</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

               {verifyStatus === 'rejected' && (
                 <div className="space-y-2">
                   <Label>Alasan Penolakan <span className="text-red-500">*</span></Label>
                   <Textarea value={verifyReason} onChange={e => setVerifyReason(e.target.value)} />
                 </div>
               )}
            </div>
          )}
          <DialogFooter>
             <Button variant="ghost" onClick={() => setVerifyModalOpen(false)}>Batal</Button>
             <Button onClick={handleVerify} disabled={isSubmitting} className="bg-indigo-600">{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Simpan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CANCEL MODAL */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
             <DialogTitle className="text-red-600">Batalkan Izin Disetujui</DialogTitle>
             <DialogDescription>Membatalkan izin akan mengatur ulang status kehadiran pengurus.</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
               <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-800">
                 Membatalkan izin akan me-reset status kehadiran pengurus pada kegiatan tersebut. Anda bisa langsung menentukan status kehadiran yang baru.
               </div>
               
               <div className="space-y-2">
                 <Label>Status Kehadiran Baru (Opsional)</Label>
                 <Select value={fallbackStatus} onValueChange={setFallbackStatus}>
                   <SelectTrigger><SelectValue placeholder="Kosongkan (Belum Diisi)"/></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="ALPHA">Alpha</SelectItem>
                     <SelectItem value="TERLAMBAT_SAH">Terlambat Sah</SelectItem>
                     <SelectItem value="TERLAMBAT_NON_SAKTI">Terlambat Non-Sakti</SelectItem>
                     <SelectItem value="PULANG_CEPAT">Pulang Cepat</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

               <div className="space-y-2">
                 <Label>Alasan Pembatalan <span className="text-red-500">*</span></Label>
                 <Textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Contoh: Ternyata terlihat hadir di tempat lain..." />
               </div>
            </div>
          )}
          <DialogFooter>
             <Button variant="ghost" onClick={() => setCancelModalOpen(false)}>Kembali</Button>
             <Button onClick={handleCancel} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Batalkan Izin'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
