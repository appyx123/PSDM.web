'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, Users, BarChart3, ShieldAlert, Save, 
  RotateCcw, Trash2, Plus, Check, AlertCircle, Loader2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DEFAULT_SETTINGS, SettingKey } from '@/lib/defaultSettings';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Admin Form
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });

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
      
      if (sRes.ok) setSettings(await sRes.json());
      if (aRes.ok) setAdmins(await aRes.json());
      if (meRes.ok) setCurrentUser(await meRes.json());
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const pointRules = settings.POINT_RULES ? JSON.parse(settings.POINT_RULES) : {};

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan Sistem</h1>
        <p className="text-slate-500 text-sm mt-1">Konfigurasi parameter kalkulasi, EWS, dan manajemen admin</p>
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
            <ShieldAlert className="w-4 h-4 mr-2" /> EWS & Target
          </TabsTrigger>
          <TabsTrigger value="admin" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 px-4 py-2">
            <Users className="w-4 h-4 mr-2" /> Manajemen Admin
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
                              onChange={(e) => {
                                const newRules = { ...pointRules };
                                if (!newRules[scope]) newRules[scope] = {};
                                newRules[scope][status] = parseInt(e.target.value);
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
            <CardHeader>
              <CardTitle className="text-lg">Konfigurasi Penalti Alpha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Multiplikator Alpha Berturut-turut</Label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    value={settings.ALPHA_MULTIPLIER} 
                    onChange={e => setSettings(s => ({ ...s, ALPHA_MULTIPLIER: e.target.value }))} 
                  />
                  <p className="text-[10px] text-slate-400 italic">Poin negatif akan dikali angka ini jika anggota Alpha berkali-kali.</p>
                </div>
                <div className="space-y-2">
                  <Label>Maksimal Penalti Alpha (Poin Negatif)</Label>
                  <Input 
                    type="number" 
                    value={settings.ALPHA_MAX_PENALTY} 
                    onChange={e => setSettings(s => ({ ...s, ALPHA_MAX_PENALTY: e.target.value }))} 
                  />
                  <p className="text-[10px] text-slate-400 italic">Contoh: 50 (penalti tidak akan lebih parah dari angka ini).</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                 <Button variant="ghost" size="sm" onClick={() => { handleReset('ALPHA_MULTIPLIER'); handleReset('ALPHA_MAX_PENALTY'); }}>Reset</Button>
                 <Button size="sm" onClick={async () => { 
                   await handleUpdateSetting('ALPHA_MULTIPLIER', settings.ALPHA_MULTIPLIER);
                   await handleUpdateSetting('ALPHA_MAX_PENALTY', settings.ALPHA_MAX_PENALTY);
                 }}>Simpan Penalti</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB THRESHOLD & TARGET */}
        <TabsContent value="threshold" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Parameter Status EWS</CardTitle>
              <CardDescription>Atur target poin keanggotaan dan ambang batas status evaluasi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-indigo-700 font-bold">Target Poin Minimum</Label>
                  <Input 
                    type="number" 
                    value={settings.TARGET_POINTS} 
                    onChange={e => setSettings(s => ({ ...s, TARGET_POINTS: e.target.value }))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-green-600 font-bold">Batas Status "Baik" (≥)</Label>
                  <Input 
                    type="number" 
                    value={settings.THRESHOLD_BAIK} 
                    onChange={e => setSettings(s => ({ ...s, THRESHOLD_BAIK: e.target.value }))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-yellow-600 font-bold">Batas "Perhatian" (≥)</Label>
                  <Input 
                    type="number" 
                    value={settings.THRESHOLD_PERHATIAN} 
                    onChange={e => setSettings(s => ({ ...s, THRESHOLD_PERHATIAN: e.target.value }))} 
                  />
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg space-y-2 border border-slate-200">
                <p className="text-sm font-semibold text-slate-700">Preview Logika Status:</p>
                <ul className="text-xs space-y-1 text-slate-600 list-disc pl-4">
                  <li>Poin <strong>{settings.THRESHOLD_BAIK}</strong> ke atas = <span className="text-green-600 font-bold">Baik</span></li>
                  <li>Poin <strong>{settings.THRESHOLD_PERHATIAN}</strong> s/d <strong>{parseInt(settings.THRESHOLD_BAIK)-1}</strong> = <span className="text-yellow-600 font-bold">Perhatian</span></li>
                  <li>Poin di bawah <strong>{settings.THRESHOLD_PERHATIAN}</strong> = <span className="text-red-600 font-bold">Kritis</span></li>
                </ul>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" size="sm" onClick={async () => {
                   await handleReset('TARGET_POINTS');
                   await handleReset('THRESHOLD_BAIK');
                   await handleReset('THRESHOLD_PERHATIAN');
                }}>Reset Default</Button>
                <Button size="sm" onClick={async () => {
                   await handleUpdateSetting('TARGET_POINTS', settings.TARGET_POINTS);
                   await handleUpdateSetting('THRESHOLD_BAIK', settings.THRESHOLD_BAIK);
                   await handleUpdateSetting('THRESHOLD_PERHATIAN', settings.THRESHOLD_PERHATIAN);
                }}>Simpan Threshold</Button>
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
                      <PasswordInput placeholder="Password" value={newAdmin.password} onChange={e => setNewAdmin(p => ({ ...p, password: e.target.value }))} required />
                      <Button type="submit"><Plus className="w-4 h-4" /></Button>
                    </div>
                  </form>
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
              <div className="space-y-2">
                <Label>URL Logo (Opsional)</Label>
                <Input placeholder="https://path-to-logo.png" value={settings.APP_LOGO} onChange={e => setSettings(s => ({ ...s, APP_LOGO: e.target.value }))} />
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
