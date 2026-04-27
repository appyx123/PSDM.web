'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, Users, BarChart3, ShieldAlert, Save, 
  RotateCcw, Trash2, Plus, Check, AlertCircle, Loader2, Lock, Unlock, Upload, ImageIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { DEFAULT_SETTINGS, SettingKey } from '@/lib/defaultSettings';

export interface PointCategory {
  id: string;
  name: string;
  type: 'REWARD' | 'PUNISHMENT';
  points: number;
}

export function SettingsView() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Custom Toggle States
  const [isCustomAlpha, setIsCustomAlpha] = useState(false);
  const [isCustomSP, setIsCustomSP] = useState(false);

  // Admin Form
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [isUploading, setIsUploading] = useState(false);

  // Point Category State
  const [categories, setCategories] = useState<PointCategory[]>([]);
  const [newCategory, setNewCategory] = useState<{ name: string; type: 'REWARD' | 'PUNISHMENT'; points: number }>({
    name: '',
    type: 'REWARD',
    points: 0
  });
  const [editingCategory, setEditingCategory] = useState<PointCategory | null>(null);
  const [isCatLoading, setIsCatLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sRes, aRes, meRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/admin/users'),
        fetch('/api/auth/me')
      ]);
      
      if (sRes.ok) {
        const data = await sRes.json();
        setSettings(data);
        if (data.ALPHA_MULTIPLIER !== DEFAULT_SETTINGS.ALPHA_MULTIPLIER || data.ALPHA_MAX_PENALTY !== DEFAULT_SETTINGS.ALPHA_MAX_PENALTY) {
          setIsCustomAlpha(true);
        }
        if (data.SP_THRESHOLDS !== DEFAULT_SETTINGS.SP_THRESHOLDS) {
          setIsCustomSP(true);
        }
      }
      if (aRes.ok) setAdmins(await aRes.json());
      if (meRes.ok) setCurrentUser(await meRes.json());
      
      // Fetch categories
      const cRes = await fetch('/api/admin/point-categories');
      if (cRes.ok) setCategories(await cRes.json());
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/settings/upload-logo', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        setSettings(prev => ({ ...prev, APP_LOGO: url }));
        setMsg({ type: 'success', text: 'Logo berhasil diunggah.' });
      } else {
        setMsg({ type: 'error', text: 'Gagal mengunggah logo.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Terjadi kesalahan saat mengunggah.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    setIsSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      
      if (res.ok) {
        setSettings(prev => ({ ...prev, [key]: value }));
        setMsg({ type: 'success', text: `Pengaturan ${key} berhasil diperbarui.` });
        if (key === 'APP_NAME' || key === 'APP_LOGO') {
           window.location.reload();
        }
      } else {
        const err = await res.json();
        setMsg({ type: 'error', text: err.error || 'Gagal memperbarui pengaturan.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async (key: SettingKey) => {
    await handleUpdateSetting(key, DEFAULT_SETTINGS[key]);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin)
      });
      if (res.ok) {
        setNewAdmin({ name: '', email: '', password: '' });
        fetchData();
        setMsg({ type: 'success', text: 'Admin baru berhasil ditambahkan.' });
      } else {
        const err = await res.json();
        setMsg({ type: 'error', text: err.error || 'Gagal menambah admin.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Gagal menambah admin.' });
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Yakin ingin menghapus admin ini?')) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        setMsg({ type: 'success', text: 'Admin berhasil dihapus.' });
      } else {
        const err = await res.json();
        setMsg({ type: 'error', text: err.error || 'Gagal menghapus admin.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Gagal menghapus admin.' });
    }
  };
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCatLoading(true);
    try {
      const res = await fetch('/api/admin/point-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      });
      if (res.ok) {
        setNewCategory({ name: '', type: 'REWARD', points: 0 });
        const cRes = await fetch('/api/admin/point-categories');
        if (cRes.ok) setCategories(await cRes.json());
        setMsg({ type: 'success', text: 'Kategori poin berhasil ditambahkan.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Gagal menambah kategori.' });
    } finally {
      setIsCatLoading(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setIsCatLoading(true);
    try {
      const res = await fetch(`/api/admin/point-categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCategory)
      });
      if (res.ok) {
        setEditingCategory(null);
        const cRes = await fetch('/api/admin/point-categories');
        if (cRes.ok) setCategories(await cRes.json());
        setMsg({ type: 'success', text: 'Kategori poin berhasil diperbarui.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Gagal memperbarui kategori.' });
    } finally {
      setIsCatLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return;
    try {
      const res = await fetch(`/api/admin/point-categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const cRes = await fetch('/api/admin/point-categories');
        if (cRes.ok) setCategories(await cRes.json());
        setMsg({ type: 'success', text: 'Kategori berhasil dihapus.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Gagal menghapus kategori.' });
    }
  };
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const pointRules = settings.POINT_RULES ? JSON.parse(settings.POINT_RULES) : {};
  const spThresholds = settings.SP_THRESHOLDS ? JSON.parse(settings.SP_THRESHOLDS) : [50, 30, 15];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan Sistem</h1>
        <p className="text-slate-500 text-sm mt-1">Konfigurasi parameter kalkulasi, SP, dan manajemen admin</p>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium ${
          msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {msg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      <Tabs defaultValue="kalkulasi" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 h-auto gap-2">
          <TabsTrigger value="kalkulasi" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 px-4 py-2">
            <BarChart3 className="w-4 h-4 mr-2" /> Kalkulasi Poin
          </TabsTrigger>
          <TabsTrigger value="threshold" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 px-4 py-2">
            <ShieldAlert className="w-4 h-4 mr-2" /> Ambang Batas SP
          </TabsTrigger>
          <TabsTrigger value="admin" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 px-4 py-2">
            <Users className="w-4 h-4 mr-2" /> Manajemen Admin
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 px-4 py-2">
            <Plus className="w-4 h-4 mr-2" /> Kategori Poin
          </TabsTrigger>
          <TabsTrigger value="umum" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 px-4 py-2">
            <Settings className="w-4 h-4 mr-2" /> Umum
          </TabsTrigger>
        </TabsList>

        {/* TAB KALKULASI POIN */}
        <TabsContent value="kalkulasi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aturan Poin Presensi</CardTitle>
              <CardDescription>Sesuaikan nilai poin yang didapat anggota untuk setiap status kehadiran.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 font-semibold">Status / Kategori</th>
                      <th className="py-2 text-center text-indigo-600">Eksternal</th>
                      <th className="py-2 text-center text-indigo-600">Internal</th>
                      <th className="py-2 text-center text-indigo-600">Kepanitiaan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {['TEPAT_WAKTU', 'TERLAMBAT_SAH', 'IZIN_SAKIT', 'TERLAMBAT_NON_SAKTI', 'PULANG_CEPAT', 'ALPHA'].map(status => (
                      <tr key={status}>
                        <td className="py-3 font-medium text-slate-600">{status.replace(/_/g, ' ')}</td>
                        {['EKSTERNAL', 'INTERNAL', 'KEPANITIAAN'].map(scope => (
                          <td key={scope} className="py-3 px-2">
                            <Input 
                              type="number" 
                              className="w-20 mx-auto text-center h-8"
                              value={pointRules[scope]?.[status] ?? 0}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const newRules = { ...pointRules };
                                if (!newRules[scope]) newRules[scope] = {};
                                newRules[scope][status] = e.target.value === '' ? 0 : parseInt(e.target.value);
                                setSettings(prev => ({ ...prev, POINT_RULES: JSON.stringify(newRules) }));
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="outline" size="sm" onClick={() => handleReset('POINT_RULES')}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Reset Default
                </Button>
                <Button size="sm" onClick={() => handleUpdateSetting('POINT_RULES', settings.POINT_RULES)}>
                  <Save className="w-4 h-4 mr-2" /> Simpan Matriks
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Konfigurasi Penalti Alpha</CardTitle>
                <CardDescription>Aturan penggandaan penalti untuk Alpha beruntun.</CardDescription>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border">
                <Label htmlFor="custom-alpha" className="text-xs font-bold text-slate-600">CUSTOM</Label>
                <Switch 
                  id="custom-alpha" 
                  checked={isCustomAlpha} 
                  onCheckedChange={(checked) => {
                    if (checked && !confirm('PERINGATAN: Mengubah nilai multiplier Alpha menyimpang dari SOP standar. Lanjutkan?')) return;
                    setIsCustomAlpha(checked);
                    if (!checked) handleReset('ALPHA_MULTIPLIER');
                  }} 
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCustomAlpha && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <p className="text-xs text-amber-800">Mode Custom Aktif. Perubahan akan dicatat dalam Audit Log sebagai penyimpangan SOP.</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Multiplikator Alpha {!isCustomAlpha && <Lock className="w-3 h-3 text-slate-400" />}
                  </Label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    disabled={!isCustomAlpha}
                    value={settings.ALPHA_MULTIPLIER} 
                    onFocus={(e) => e.target.select()}
                    onChange={e => setSettings(s => ({ ...s, ALPHA_MULTIPLIER: e.target.value }))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Maksimal Penalti Alpha {!isCustomAlpha && <Lock className="w-3 h-3 text-slate-400" />}
                  </Label>
                  <Input 
                    type="number" 
                    disabled={!isCustomAlpha}
                    value={settings.ALPHA_MAX_PENALTY} 
                    onFocus={(e) => e.target.select()}
                    onChange={e => setSettings(s => ({ ...s, ALPHA_MAX_PENALTY: e.target.value }))} 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                 <Button size="sm" disabled={!isCustomAlpha} onClick={async () => { 
                   await handleUpdateSetting('ALPHA_MULTIPLIER', settings.ALPHA_MULTIPLIER);
                   await handleUpdateSetting('ALPHA_MAX_PENALTY', settings.ALPHA_MAX_PENALTY);
                 }}>Simpan Penalti</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB THRESHOLD SP */}
        <TabsContent value="threshold" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Ambang Batas Surat Peringatan (SP)</CardTitle>
                <CardDescription>Batas poin minimal untuk penjatuhan SP otomatis.</CardDescription>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border">
                <Label htmlFor="custom-sp" className="text-xs font-bold text-slate-600">CUSTOM</Label>
                <Switch 
                  id="custom-sp" 
                  checked={isCustomSP} 
                  onCheckedChange={(checked) => {
                    if (checked && !confirm('PERINGATAN: Mengubah ambang batas SP sangat berisiko dan menyimpang dari SOP. Lanjutkan?')) return;
                    setIsCustomSP(checked);
                    if (!checked) handleReset('SP_THRESHOLDS');
                  }} 
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isCustomSP && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <p className="text-xs text-amber-800">Ambang batas kustom aktif. Sistem akan menggunakan nilai ini untuk auto-flagging SP.</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-amber-600 font-bold flex items-center gap-2">
                    Threshold SP 1 {!isCustomSP && <Lock className="w-3 h-3 text-slate-400" />}
                  </Label>
                  <Input 
                    type="number" 
                    disabled={!isCustomSP}
                    value={spThresholds[0]} 
                    onFocus={(e) => e.target.select()}
                    onChange={e => {
                      const newT = [...spThresholds];
                      newT[0] = e.target.value === '' ? 0 : parseInt(e.target.value);
                      setSettings(s => ({ ...s, SP_THRESHOLDS: JSON.stringify(newT) }));
                    }} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-orange-600 font-bold flex items-center gap-2">
                    Threshold SP 2 {!isCustomSP && <Lock className="w-3 h-3 text-slate-400" />}
                  </Label>
                  <Input 
                    type="number" 
                    disabled={!isCustomSP}
                    value={spThresholds[1]} 
                    onFocus={(e) => e.target.select()}
                    onChange={e => {
                      const newT = [...spThresholds];
                      newT[1] = e.target.value === '' ? 0 : parseInt(e.target.value);
                      setSettings(s => ({ ...s, SP_THRESHOLDS: JSON.stringify(newT) }));
                    }} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-red-600 font-bold flex items-center gap-2">
                    Threshold SP 3 {!isCustomSP && <Lock className="w-3 h-3 text-slate-400" />}
                  </Label>
                  <Input 
                    type="number" 
                    disabled={!isCustomSP}
                    value={spThresholds[2]} 
                    onFocus={(e) => e.target.select()}
                    onChange={e => {
                      const newT = [...spThresholds];
                      newT[2] = e.target.value === '' ? 0 : parseInt(e.target.value);
                      setSettings(s => ({ ...s, SP_THRESHOLDS: JSON.stringify(newT) }));
                    }} 
                  />
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg space-y-2 border border-slate-200">
                <p className="text-sm font-semibold text-slate-700">Preview Logika SP Otomatis:</p>
                <ul className="text-xs space-y-2 text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    Poin ≤ <strong>{spThresholds[0]}</strong> → Muncul di daftar kandidat <strong className="text-amber-600">SP 1</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    Poin ≤ <strong>{spThresholds[1]}</strong> → Muncul di daftar kandidat <strong className="text-orange-600">SP 2</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Poin ≤ <strong>{spThresholds[2]}</strong> → Muncul di daftar kandidat <strong className="text-red-600">SP 3 (Terminasi)</strong>
                  </li>
                </ul>
              </div>

              <div className="flex justify-end gap-3">
                <Button size="sm" disabled={!isCustomSP} onClick={async () => {
                   await handleUpdateSetting('SP_THRESHOLDS', settings.SP_THRESHOLDS);
                }}>Simpan Threshold SP</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Target Poin Keanggotaan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-xs">
                <Label>Target Poin Minimum</Label>
                <Input 
                  type="number" 
                  value={settings.TARGET_POINTS} 
                  onFocus={(e) => e.target.select()}
                  onChange={e => setSettings(s => ({ ...s, TARGET_POINTS: e.target.value === '' ? '0' : e.target.value }))} 
                />
              </div>
              <div className="flex justify-end mt-4">
                <Button size="sm" onClick={() => handleUpdateSetting('TARGET_POINTS', settings.TARGET_POINTS)}>Simpan Target</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB MANAJEMEN ADMIN */}
        <TabsContent value="admin" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Akun Administrator</CardTitle>
              <CardDescription>Manajemen akses admin ke sistem.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {admins.map(admin => (
                  <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800">{admin.name}</p>
                        {admin.id === currentUser?.userId && (
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold">You</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{admin.email}</p>
                    </div>
                    {admin.id !== currentUser?.userId && (
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAdmin(admin.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <div className="pt-6 border-t">
                  <h3 className="font-semibold text-sm mb-4">Tambah Admin Baru</h3>
                  <form onSubmit={handleAddAdmin} className="grid grid-cols-3 gap-3">
                    <Input placeholder="Nama" value={newAdmin.name} onChange={e => setNewAdmin(p => ({ ...p, name: e.target.value }))} required />
                    <Input placeholder="Email" type="email" value={newAdmin.email} onChange={e => setNewAdmin(p => ({ ...p, email: e.target.value }))} required />
                    <div className="flex gap-2">
                      <Input placeholder="Password" type="password" value={newAdmin.password} onChange={e => setNewAdmin(p => ({ ...p, password: e.target.value }))} required />
                      <Button type="submit"><Plus className="w-4 h-4" /></Button>
                    </div>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daftar Kategori Reward & Punishment</CardTitle>
              <CardDescription>Definisikan kategori penilaian poin untuk digunakan di menu Evaluasi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">{editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h3>
                  <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nama Kategori</Label>
                      <Input 
                        placeholder="Contoh: Juara Lomba Internasional" 
                        value={editingCategory ? editingCategory.name : newCategory.name}
                        onChange={e => editingCategory 
                          ? setEditingCategory({...editingCategory, name: e.target.value})
                          : setNewCategory({...newCategory, name: e.target.value})
                        }
                        required 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Jenis</Label>
                        <Select 
                          value={editingCategory ? editingCategory.type : newCategory.type}
                          onValueChange={(v: any) => editingCategory
                            ? setEditingCategory({...editingCategory, type: v})
                            : setNewCategory({...newCategory, type: v})
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="REWARD">🟢 Reward</SelectItem>
                            <SelectItem value="PUNISHMENT">🔴 Punishment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Poin Default</Label>
                        <Input 
                          type="number" 
                          placeholder="0"
                          value={(editingCategory ? editingCategory.points : newCategory.points) || ''}
                          onFocus={(e) => e.target.select()}
                          onChange={e => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                            editingCategory
                              ? setEditingCategory({...editingCategory, points: val})
                              : setNewCategory({...newCategory, points: val})
                          }}
                          required 
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {editingCategory && (
                        <Button type="button" variant="ghost" onClick={() => setEditingCategory(null)} className="flex-1">Batal</Button>
                      )}
                      <Button type="submit" disabled={isCatLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                        {isCatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingCategory ? 'Perbarui' : 'Tambah Kategori'}
                      </Button>
                    </div>
                  </form>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Eksisting ({categories.length})</h3>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar border rounded-lg p-2 bg-slate-50/50">
                    {categories.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8 italic">Belum ada kategori.</p>
                    ) : (
                      categories.map(cat => (
                        <div key={cat.id} className="flex items-center justify-between p-3 border bg-white rounded-lg hover:bg-slate-50 group shadow-sm transition-all">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={cat.type === 'REWARD' ? 'text-green-600' : 'text-red-600'}>
                                {cat.type === 'REWARD' ? '🟢' : '🔴'}
                              </span>
                              <p className="font-medium text-slate-800 text-sm">{cat.name}</p>
                            </div>
                            <p className={`text-xs font-bold ${cat.type === 'REWARD' ? 'text-green-600' : 'text-red-600'}`}>
                              {cat.points > 0 ? `+${cat.points}` : cat.points} Poin
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => setEditingCategory(cat)} className="h-8 w-8">
                              <Settings className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)} className="h-8 w-8 text-red-500 hover:text-red-700">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB UMUM */}
        <TabsContent value="umum" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Identitas Aplikasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Aplikasi / Instansi</Label>
                <Input value={settings.APP_NAME} onChange={e => setSettings(s => ({ ...s, APP_NAME: e.target.value }))} />
              </div>
              <div className="space-y-4">
                <Label>Logo Aplikasi</Label>
                <div className="flex flex-col md:flex-row items-center gap-6 p-4 border rounded-xl bg-slate-50/50">
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0">
                    {settings.APP_LOGO ? (
                      <img src={settings.APP_LOGO} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="https://path-to-logo.png atau /uploads/..." 
                        value={settings.APP_LOGO} 
                        onChange={e => setSettings(s => ({ ...s, APP_LOGO: e.target.value }))} 
                      />
                      <div className="relative">
                        <input
                          type="file"
                          id="logo-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={handleLogoUpload}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="bg-white"
                          disabled={isUploading}
                          onClick={() => document.getElementById('logo-upload')?.click()}
                        >
                          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                          Upload
                        </Button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 italic">Disarankan gambar PNG/SVG dengan latar transparan.</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                 <Button variant="ghost" size="sm" onClick={() => { handleReset('APP_NAME'); handleReset('APP_LOGO'); }}>Reset</Button>
                 <Button size="sm" onClick={async () => {
                   await handleUpdateSetting('APP_NAME', settings.APP_NAME);
                   await handleUpdateSetting('APP_LOGO', settings.APP_LOGO);
                 }}>Simpan Identitas</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
