'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Trash2, Plus, Check, AlertCircle, Loader2, ShieldCheck, 
  Mail, Key, Save, Building2, X, Network, CalendarDays, RefreshCw 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import { cn, getImageUrl } from '@/lib/utils';

export interface AdminUsersViewProps {
  defaultTab?: 'admins' | 'departments' | 'pj_mapping';
  onTabChange?: (tab: 'admin_users' | 'departments' | 'pj_mapping') => void;
}

// Helper to calculate the next recommended PRN ID for new admins
function calculateNextPrn(adminList: Array<{ prn?: string }>) {
  let maxNum = 0;
  if (Array.isArray(adminList)) {
    adminList.forEach(a => {
      if (!a.prn) return;
      const match = a.prn.match(/(?:PRN|ADM)?0*(\d+)/i);
      if (match && match[1]) {
        const val = parseInt(match[1], 10);
        if (!isNaN(val) && val > maxNum) {
          maxNum = val;
        }
      }
    });
  }
  const nextNum = maxNum > 0 ? maxNum + 1 : 1;
  return `PRN${String(nextNum).padStart(3, '0')}`;
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
    prn: '',
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
      
      if (aRes.ok) {
        const adminData = await aRes.json();
        setAdmins(adminData);
        setNewAdmin(prev => {
          if (!prev.prn) {
            return { ...prev, prn: calculateNextPrn(adminData) };
          }
          return prev;
        });
      }

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
        const nextPrn = calculateNextPrn([...admins, { prn: newAdmin.prn }]);
        setNewAdmin({ name: '', prn: nextPrn, email: '', password: '', role: 'ADMIN' });
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

  const suggestedPrn = calculateNextPrn(admins);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {msg && (
        <div className={`flex items-center gap-2 p-3.5 rounded-xl border text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 ${
          msg.type === 'success' ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800' : 'bg-rose-50/80 border-rose-200 text-rose-800'
        }`}>
          {msg.type === 'success' ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      <Tabs value={activeSubTab} onValueChange={(val) => handleSubTabChange(val as any)} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <TabsList className="bg-slate-100/90 p-1 rounded-xl h-auto border border-gray-200 shadow-xs">
            <TabsTrigger 
              value="admins" 
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              Akun Admin
            </TabsTrigger>
            <TabsTrigger 
              value="departments" 
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs transition-all"
            >
              <Building2 className="w-4 h-4" />
              Departemen
            </TabsTrigger>
            <TabsTrigger 
              value="pj_mapping" 
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs transition-all"
            >
              <Network className="w-4 h-4" />
              PJ Mapping
            </TabsTrigger>
          </TabsList>
          <Badge className="bg-indigo-600 text-white px-3 py-1 text-xs font-semibold uppercase tracking-wider w-fit self-start sm:self-auto shadow-xs">
            <ShieldCheck className="w-3 h-3 mr-1" /> Super Admin
          </Badge>
        </div>

        {/* Tab 1: Akun Admin */}
        <TabsContent value="admins" className="mt-6 focus-visible:outline-none space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* List Admin - Modern Data Table (7 of 12 columns on large screens) */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="border border-gray-200 shadow-sm overflow-hidden bg-white rounded-xl">
                <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Daftar Administrator</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Seluruh akun yang memiliki hak akses dashboard manajemen.</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
                    {admins.length} Admin
                  </span>
                </div>

                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          <th scope="col" className="py-3 px-4 sm:px-5">Profil</th>
                          <th scope="col" className="py-3 px-4 sm:px-5">Role & ID</th>
                          <th scope="col" className="py-3 px-4 sm:px-5">Dibuat Pada</th>
                          <th scope="col" className="py-3 px-4 sm:px-5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {admins.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-12 text-center text-slate-400 text-sm italic">
                              Belum ada akun administrator yang terdaftar.
                            </td>
                          </tr>
                        ) : (
                          admins.map(admin => {
                            const avatarUrl = getImageUrl(admin.image);
                            const isMe = admin.id === currentUser?.userId;

                            return (
                              <tr key={admin.id} className="hover:bg-slate-50/70 transition-colors">
                                {/* Kolom 1 (Profil): Foto Profil asli, Nama Lengkap, Email */}
                                <td className="py-3.5 px-4 sm:px-5">
                                  <div className="flex items-center gap-3">
                                    <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 bg-slate-100 border border-slate-200/80 flex items-center justify-center">
                                      {avatarUrl ? (
                                        <img 
                                          src={avatarUrl} 
                                          alt={admin.name} 
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                            const fallback = (e.target as HTMLElement).nextElementSibling;
                                            if (fallback) fallback.classList.remove('hidden');
                                          }}
                                        />
                                      ) : null}
                                      <span className={cn(
                                        "font-semibold text-xs text-slate-600 uppercase select-none",
                                        avatarUrl ? "hidden" : ""
                                      )}>
                                        {admin.name?.charAt(0) || 'A'}
                                      </span>
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-semibold text-slate-900 text-sm truncate max-w-[150px] sm:max-w-xs">
                                          {admin.name}
                                        </span>
                                        {isMe && (
                                          <span className="text-[9px] font-bold tracking-wider uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/70 px-1.5 py-0.5 rounded leading-none">
                                            SAYA
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-500 truncate max-w-[170px] sm:max-w-xs mt-0.5">
                                        {admin.email || '-'}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                {/* Kolom 2 (Role & ID): Badge Role berdampingan dengan badge PRN */}
                                <td className="py-3.5 px-4 sm:px-5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {admin.role === 'SUPER_ADMIN' ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
                                        SUPER_ADMIN
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                                        ADMIN
                                      </span>
                                    )}
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200/70">
                                      {admin.prn || 'NO-PRN'}
                                    </span>
                                  </div>
                                </td>

                                {/* Kolom 3 (Tanggal): Tanggal pembuatan akun dengan teks abu-abu yang rapi */}
                                <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                                  <span className="text-xs text-slate-500 font-normal">
                                    {admin.createdAt 
                                      ? new Date(admin.createdAt).toLocaleDateString('id-ID', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric'
                                        }) 
                                      : '-'}
                                  </span>
                                </td>

                                {/* Kolom 4 (Aksi): Ikon tempat sampah di ujung kanan */}
                                <td className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">
                                  {!isMe && admin.role !== 'SUPER_ADMIN' ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAdmin(admin.id)}
                                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
                                      title={`Hapus admin ${admin.name}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <span className="inline-block w-8 text-center text-xs text-slate-300 select-none mr-1">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form Tambah Admin (5 of 12 columns on large screens) */}
            <div className="lg:col-span-5">
              <Card className="border border-gray-200 shadow-sm sticky top-6 bg-white rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Tambah Admin Baru
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Buat akun kredensial untuk administrator PSDM baru.</p>
                </div>

                <CardContent className="p-5">
                  <form onSubmit={handleAddAdmin} className="space-y-4" autoComplete="off">
                    {/* Hidden decoy fields to defeat browser autofill / password manager heuristics */}
                    <input 
                      type="text" 
                      name="fake_user_autofill_shield" 
                      tabIndex={-1} 
                      className="sr-only" 
                      aria-hidden="true" 
                      autoComplete="off" 
                    />
                    <input 
                      type="password" 
                      name="fake_pass_autofill_shield" 
                      tabIndex={-1} 
                      className="sr-only" 
                      aria-hidden="true" 
                      autoComplete="new-password" 
                    />

                    {/* Nama Lengkap */}
                    <div className="space-y-1.5">
                      <Label htmlFor="admin_name_field" className="text-xs font-semibold text-slate-700">
                        Nama Lengkap
                      </Label>
                      <Input 
                        id="admin_name_field"
                        name="admin_account_fullname"
                        placeholder="Contoh: Budi Santoso" 
                        value={newAdmin.name} 
                        onChange={e => setNewAdmin(p => ({ ...p, name: e.target.value }))} 
                        required 
                        autoComplete="off"
                        className="bg-gray-50 border-gray-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg text-sm h-9 transition-all"
                      />
                    </div>

                    {/* PRN / ID Admin (Login) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="admin_prn_field" className="text-xs font-semibold text-slate-700">
                          PRN / ID Admin <span className="text-[11px] font-normal text-slate-400">(Wajib Login)</span>
                        </Label>
                        <button
                          type="button"
                          onClick={() => setNewAdmin(p => ({ ...p, prn: suggestedPrn }))}
                          className="text-[10px] font-medium text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 focus:outline-none"
                          title="Generate ulang ID PRN standar otomatis"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          Auto: {suggestedPrn}
                        </button>
                      </div>
                      <div className="relative">
                        <Input 
                          id="admin_prn_field"
                          name="admin_login_prn_code"
                          type="text"
                          placeholder={suggestedPrn || "PRN001"}
                          value={newAdmin.prn} 
                          onChange={e => {
                            // Strict validation: Uppercase alphanumeric and dashes only, strictly disallow @, dots, spaces
                            const sanitized = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
                            setNewAdmin(p => ({ ...p, prn: sanitized }));
                          }} 
                          required 
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck={false}
                          data-1p-ignore="true"
                          data-lpignore="true"
                          className="bg-gray-50 border-gray-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg uppercase font-mono text-sm tracking-wide h-9 transition-all"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Format login resmi (contoh: <span className="font-mono text-slate-600 font-medium">{suggestedPrn}</span>). Bukan alamat email.
                      </p>
                    </div>

                    {/* Alamat Email (Opsional) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="admin_email_field" className="text-xs font-semibold text-slate-700">
                        Alamat Email <span className="text-slate-400 font-normal text-[11px]">(Opsional)</span>
                      </Label>
                      <Input 
                        id="admin_email_field"
                        name="admin_contact_mail_addr"
                        type="email" 
                        placeholder="nama@email.com" 
                        value={newAdmin.email} 
                        onChange={e => setNewAdmin(p => ({ ...p, email: e.target.value }))} 
                        autoComplete="off"
                        className="bg-gray-50 border-gray-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg text-sm h-9 transition-all"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="admin_pass_field" className="text-xs font-semibold text-slate-700">
                        Password
                      </Label>
                      <PasswordInput 
                        id="admin_pass_field"
                        name="admin_secret_auth_key"
                        placeholder="Minimal 8 karakter" 
                        value={newAdmin.password} 
                        onChange={e => setNewAdmin(p => ({ ...p, password: e.target.value }))} 
                        required 
                        autoComplete="new-password"
                        className="bg-gray-50 border-gray-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg text-sm h-9 transition-all"
                      />
                    </div>

                    {/* Level Hak Akses */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Level Hak Akses
                      </Label>
                      <Select 
                        value={newAdmin.role} 
                        onValueChange={(v: 'SUPER_ADMIN' | 'ADMIN') => setNewAdmin(p => ({ ...p, role: v }))}
                      >
                        <SelectTrigger className="bg-gray-50 border-gray-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg text-sm h-9 transition-all">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                          <SelectItem value="SUPER_ADMIN">SUPER ADMIN</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-slate-400 italic mt-1 leading-relaxed">
                        * Admin tidak dapat mengubah pengaturan sistem atau mengelola akun lain.
                      </p>
                    </div>

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-9 rounded-lg font-medium text-xs shadow-xs transition-all active:scale-[0.99] mt-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5" /> Buat Akun Admin
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Kelola Departemen */}
        <TabsContent value="departments" className="mt-6 focus-visible:outline-none space-y-6">
          <Card className="border border-gray-200 shadow-sm bg-white rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-900">Kelola Departemen Organisasi</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tambah atau hapus struktur departemen resmi. Setiap departemen di sini otomatis tersedia pada form input pengurus, filter data, dan pemetaan PJ.
              </p>
            </div>
            <CardContent className="p-5 space-y-6">
              {/* Form Tambah Departemen */}
              <form onSubmit={handleAddDepartment} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="Ketik nama departemen baru (contoh: Kewirausahaan)..."
                    value={newDeptName}
                    onChange={e => setNewDeptName(e.target.value)}
                    required
                    className="bg-gray-50 border-gray-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg text-sm h-9 transition-all"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isDeptSubmitting || !newDeptName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 h-9 px-4 text-white font-medium text-xs rounded-lg shadow-xs flex-shrink-0"
                >
                  {isDeptSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Tambah Departemen
                </Button>
              </form>

              {/* Daftar Departemen */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Daftar Departemen Aktif ({departments.length})
                </Label>
                {departments.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">Belum ada departemen yang terdaftar.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {departments.map(dept => {
                      const count = departmentCounts[dept] || 0;
                      const isTrisula = dept.toLowerCase() === 'trisula';
                      return (
                        <div
                          key={dept}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white shadow-xs hover:border-indigo-300 transition-all text-xs font-medium text-slate-800"
                        >
                          <span className="font-semibold text-slate-800">{dept}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
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
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <X className="w-3 h-3" />
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
          <Card className="border border-gray-200 shadow-sm bg-white rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-row items-center justify-between space-y-0">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Pemetaan PJ Departemen</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tentukan Admin yang bertanggung jawab (PJ) untuk memverifikasi perizinan tiap departemen.</p>
              </div>
              <Button 
                onClick={handleSavePjMapping} 
                disabled={isSavingPj}
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 px-3 text-xs font-medium rounded-lg shadow-xs"
              >
                {isSavingPj ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                Simpan Pemetaan
              </Button>
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="text-left py-3 px-5">Departemen</th>
                      <th className="text-left py-3 px-5">Admin Penanggung Jawab (PJ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {departments.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="p-8 text-center text-slate-400 italic">Tidak ada data departemen ditemukan.</td>
                      </tr>
                    ) : (
                      departments.map(dept => (
                        <tr key={dept} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-5 font-semibold text-slate-800 text-sm">{dept}</td>
                          <td className="py-3.5 px-5">
                            <Select 
                              value={pjMapping[dept] || 'NONE'} 
                              onValueChange={(v) => setPjMapping(prev => ({ ...prev, [dept]: v === 'NONE' ? '' : v }))}
                            >
                              <SelectTrigger className="w-full max-w-xs bg-gray-50 border-gray-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg text-xs h-8">
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
