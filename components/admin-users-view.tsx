'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Trash2, Plus, Check, AlertCircle, Loader2, ShieldCheck, 
  Mail, Key, Save, Building2, X, Network, CalendarDays 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface AdminUsersViewProps {
  defaultTab?: 'admins' | 'departments' | 'pj_mapping';
  onTabChange?: (tab: 'admin_users' | 'departments' | 'pj_mapping') => void;
}

export function AdminUsersView({ defaultTab = 'admins', onTabChange }: AdminUsersViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'admins' | 'departments' | 'pj_mapping'>(defaultTab);

  useEffect(() => {
    if (defaultTab && ['admins', 'departments', 'pj_mapping'].includes(defaultTab)) {
      setActiveSubTab(defaultTab);
    }
  }, [defaultTab]);

  const handleSubTabChange = (val: 'admins' | 'departments' | 'pj_mapping') => {
    setActiveSubTab(val);
    onTabChange?.(val === 'admins' ? 'admin_users' : val);
  };
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // PJ Mapping & Department State
  const [pjMapping, setPjMapping] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<string[]>([]);
  const [departmentCounts, setDepartmentCounts] = useState<Record<string, number>>({});
  const [newDeptName, setNewDeptName] = useState('');
  const [isDeptSubmitting, setIsDeptSubmitting] = useState(false);
  const [isDeletingDept, setIsDeletingDept] = useState<string | null>(null);
  const [isPjLoading, setIsPjLoading] = useState(false);
  const [isSavingPj, setIsSavingPj] = useState(false);

  // New Admin Form
  const [newAdmin, setNewAdmin] = useState({ 
    name: '', 
    email: '', 
    password: '',
    role: 'ADMIN' as 'SUPER_ADMIN' | 'ADMIN'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [aRes, meRes, dRes, pRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/auth/me'),
        fetch('/api/admin/departments'),
        fetch('/api/admin/settings/pj-mapping')
      ]);
      
      if (aRes.ok) setAdmins(await aRes.json());
      if (meRes.ok) setCurrentUser(await meRes.json());
      
      if (dRes.ok) {
        const dData = await dRes.json();
        setDepartments(dData.departments || []);
        setDepartmentCounts(dData.counts || {});
      }
      
      if (pRes.ok) setPjMapping(await pRes.json());
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setIsDeptSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDeptName.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setNewDeptName('');
        setMsg({ type: 'success', text: `Departemen "${newDeptName.trim()}" berhasil ditambahkan.` });
        fetchData();
      } else {
        setMsg({ type: 'error', text: data.error || 'Gagal menambahkan departemen.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Terjadi kesalahan sistem.' });
    } finally {
      setIsDeptSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (deptName: string) => {
    if (!confirm(`Hapus departemen "${deptName}"? Pastikan tidak ada anggota yang terdaftar di departemen ini.`)) return;
    setIsDeletingDept(deptName);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: deptName })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: `Departemen "${deptName}" berhasil dihapus.` });
        fetchData();
      } else {
        setMsg({ type: 'error', text: data.error || 'Gagal menghapus departemen.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Terjadi kesalahan sistem.' });
    } finally {
      setIsDeletingDept(null);
    }
  };

  const handleSavePjMapping = async () => {
    setIsSavingPj(true);
    try {
      const res = await fetch('/api/admin/settings/pj-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pjMapping)
      });
      if (res.ok) {
        setMsg({ type: 'success', text: 'Pemetaan PJ Departemen berhasil disimpan.' });
      } else {
        setMsg({ type: 'error', text: 'Gagal menyimpan pemetaan PJ.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Terjadi kesalahan sistem.' });
    } finally {
      setIsSavingPj(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin)
      });
      if (res.ok) {
        setNewAdmin({ name: '', email: '', password: '', role: 'ADMIN' });
        fetchData();
        setMsg({ type: 'success', text: 'Akun admin baru berhasil ditambahkan.' });
      } else {
        const err = await res.json();
        setMsg({ type: 'error', text: err.error || 'Gagal menambah admin.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Terjadi kesalahan sistem.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Hapus akun admin ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        setMsg({ type: 'success', text: 'Akun admin berhasil dihapus.' });
      } else {
        const err = await res.json();
        setMsg({ type: 'error', text: err.error || 'Gagal menghapus admin.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Terjadi kesalahan sistem.' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const getHeaderInfo = () => {
    switch (activeSubTab) {
      case 'departments':
        return {
          title: 'Kelola Departemen Organisasi',
          desc: 'Tambah atau hapus struktur departemen resmi yang berlaku di sistem.'
        };
      case 'pj_mapping':
        return {
          title: 'Pemetaan PJ Departemen',
          desc: 'Tentukan Admin yang bertanggung jawab (PJ) untuk memverifikasi perizinan & klaim tiap departemen.'
        };
      default:
        return {
          title: 'Kelola Akun Admin',
          desc: 'Manajemen hak akses khusus untuk jajaran pengurus PSDM (Super Admin & Admin).'
        };
    }
  };

  const header = getHeaderInfo();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{header.title}</h1>
          <p className="text-slate-500 mt-1">{header.desc}</p>
        </div>
        <Badge className="bg-indigo-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider w-fit">
          <ShieldCheck className="w-3 h-3 mr-1" /> Super Admin Only
        </Badge>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 p-4 rounded-xl border text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 ${
          msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {msg.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {msg.text}
        </div>
      )}

      <Tabs value={activeSubTab} onValueChange={(val) => handleSubTabChange(val as any)} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-auto border border-slate-200">
          <TabsTrigger 
            value="admins" 
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            Kelola Akun Admin
          </TabsTrigger>
          <TabsTrigger 
            value="departments" 
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
          >
            <Building2 className="w-4 h-4" />
            Kelola Departemen
          </TabsTrigger>
          <TabsTrigger 
            value="pj_mapping" 
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
          >
            <Network className="w-4 h-4" />
            Pemetaan PJ
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Akun Admin */}
        <TabsContent value="admins" className="mt-6 focus-visible:outline-none space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List Admin */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b">
                  <CardTitle className="text-lg">Daftar Administrator</CardTitle>
                  <CardDescription>Seluruh akun yang memiliki akses ke dashboard manajemen.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {admins.map(admin => (
                      <div key={admin.id} className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-inner",
                            admin.role === 'SUPER_ADMIN' ? "bg-indigo-600" : "bg-slate-400"
                          )}>
                            {admin.name[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900">{admin.name}</p>
                              <Badge variant={admin.role === 'SUPER_ADMIN' ? 'default' : 'secondary'} className="text-[9px] h-4">
                                {admin.role}
                              </Badge>
                              {admin.id === currentUser?.userId && (
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase font-black">SAYA</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {admin.email}</p>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" /> Dibuat: {new Date(admin.createdAt).toLocaleDateString('id-ID')}
                              </p>
                            </div>
                          </div>
                        </div>
                        {admin.id !== currentUser?.userId && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteAdmin(admin.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form Tambah Admin */}
            <div>
              <Card className="border-slate-200 shadow-sm sticky top-6">
                <CardHeader className="bg-slate-50/50 border-b">
                  <CardTitle className="text-lg">Tambah Admin Baru</CardTitle>
                  <CardDescription>Buat akun baru untuk jajaran pengurus PSDM.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleAddAdmin} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nama Lengkap</Label>
                      <Input 
                        placeholder="Contoh: Budi Santoso" 
                        value={newAdmin.name} 
                        onChange={e => setNewAdmin(p => ({ ...p, name: e.target.value }))} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Alamat Email</Label>
                      <Input 
                        type="email" 
                        placeholder="nama@email.com" 
                        value={newAdmin.email} 
                        onChange={e => setNewAdmin(p => ({ ...p, email: e.target.value }))} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <PasswordInput 
                        placeholder="Minimal 8 karakter" 
                        value={newAdmin.password} 
                        onChange={e => setNewAdmin(p => ({ ...p, password: e.target.value }))} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Level Hak Akses</Label>
                      <Select 
                        value={newAdmin.role} 
                        onValueChange={(v: any) => setNewAdmin(p => ({ ...p, role: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                          <SelectItem value="SUPER_ADMIN">SUPER ADMIN</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-500 italic mt-1 leading-relaxed">
                        * Admin tidak dapat mengubah pengaturan sistem atau mengelola akun lain.
                      </p>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 font-bold shadow-lg shadow-indigo-200"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buat Akun Admin'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Kelola Departemen */}
        <TabsContent value="departments" className="mt-6 focus-visible:outline-none space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-lg">Kelola Departemen Organisasi</CardTitle>
              </div>
              <CardDescription>
                Tambah atau hapus struktur departemen resmi. Setiap departemen di sini otomatis tersedia pada form input pengurus, filter data, dan pemetaan PJ.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Form Tambah Departemen */}
              <form onSubmit={handleAddDepartment} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="Ketik nama departemen baru (contoh: Kewirausahaan)..."
                    value={newDeptName}
                    onChange={e => setNewDeptName(e.target.value)}
                    required
                    className="h-10"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isDeptSubmitting || !newDeptName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 h-10 px-5 text-white font-semibold flex-shrink-0"
                >
                  {isDeptSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Tambah Departemen
                </Button>
              </form>

              {/* Daftar Departemen */}
              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Daftar Departemen Aktif ({departments.length})
                </Label>
                {departments.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">Belum ada departemen yang terdaftar.</p>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {departments.map(dept => {
                      const count = departmentCounts[dept] || 0;
                      const isTrisula = dept.toLowerCase() === 'trisula';
                      return (
                        <div
                          key={dept}
                          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-indigo-300 transition-all text-sm font-medium text-slate-800"
                        >
                          <span className="font-semibold text-slate-700">{dept}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            {count} pengurus
                          </span>
                          {!isTrisula && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDepartment(dept)}
                              disabled={isDeletingDept === dept}
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-md transition-colors ml-0.5"
                              title={count > 0 ? `Masih ada ${count} anggota di departemen ini` : `Hapus departemen ${dept}`}
                            >
                              {isDeletingDept === dept ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <X className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Pemetaan PJ Departemen */}
        <TabsContent value="pj_mapping" className="mt-6 focus-visible:outline-none space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Pemetaan PJ Departemen</CardTitle>
                <CardDescription>Tentukan Admin yang bertanggung jawab (PJ) untuk memverifikasi perizinan tiap departemen.</CardDescription>
              </div>
              <Button 
                onClick={handleSavePjMapping} 
                disabled={isSavingPj}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isSavingPj ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Simpan Pemetaan
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50/30">
                      <th className="text-left p-4 font-semibold text-slate-600">Departemen</th>
                      <th className="text-left p-4 font-semibold text-slate-600">Admin Penanggung Jawab (PJ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {departments.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="p-8 text-center text-slate-400 italic">Tidak ada data departemen ditemukan.</td>
                      </tr>
                    ) : (
                      departments.map(dept => (
                        <tr key={dept} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-4 font-bold text-slate-700">{dept}</td>
                          <td className="p-4">
                            <Select 
                              value={pjMapping[dept] || 'NONE'} 
                              onValueChange={(v) => setPjMapping(prev => ({ ...prev, [dept]: v === 'NONE' ? '' : v }))}
                            >
                              <SelectTrigger className="w-full max-w-xs bg-white">
                                <SelectValue placeholder="Pilih Admin PJ..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="NONE">-- Belum Ditentukan --</SelectItem>
                                {admins.map(admin => (
                                  <SelectItem key={admin.id} value={admin.id}>
                                    {admin.name} ({admin.role})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
