'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, Users, BarChart3, ShieldAlert, Save, 
  RotateCcw, Trash2, Plus, Check, AlertCircle, Loader2, Lock, Upload, ImageIcon
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
import { getImageUrl } from '@/lib/utils';

export interface PointCategory {
  id: string;
  name: string;
  type: 'REWARD' | 'PUNISHMENT';
  points: number;
}

export function SettingsView() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [isCustomAlpha, setIsCustomAlpha] = useState(false);
  const [isCustomSP, setIsCustomSP] = useState(false);
  
  const isReadOnly = currentUser?.role === 'ADMIN';

  // State
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<PointCategory[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', type: 'REWARD' as const, points: 0 });
  const [editingCategory, setEditingCategory] = useState<PointCategory | null>(null);
  const [isCatLoading, setIsCatLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sRes, meRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/auth/me')
      ]);
      
      if (sRes.ok) {
        const data = await sRes.json();
        setSettings(data);
        setIsCustomAlpha(data.ALPHA_MULTIPLIER !== DEFAULT_SETTINGS.ALPHA_MULTIPLIER || data.ALPHA_MAX_PENALTY !== DEFAULT_SETTINGS.ALPHA_MAX_PENALTY);
        setIsCustomSP(data.SP_THRESHOLDS !== DEFAULT_SETTINGS.SP_THRESHOLDS);
      }
      if (meRes.ok) setCurrentUser(await meRes.json());
      
      const cRes = await fetch('/api/admin/point-categories');
      if (cRes.ok) setCategories(await cRes.json());
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) {
        setSettings(prev => ({ ...prev, [key]: value }));
        setMsg({ type: 'success', text: `Pengaturan ${key} diperbarui.` });
        if (key === 'APP_NAME' || key === 'APP_LOGO') window.location.reload();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = (key: SettingKey) => handleUpdateSetting(key, DEFAULT_SETTINGS[key]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/admin/settings/upload-logo', { method: 'POST', body: formData });
      if (res.ok) {
        const { url } = await res.json();
        setSettings(prev => ({ ...prev, APP_LOGO: url }));
        setMsg({ type: 'success', text: 'Logo diunggah.' });
      }
    } finally {
      setIsUploading(false);
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
      }
    } finally {
      setIsCatLoading(false);
    }
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  const pointRules = settings.POINT_RULES ? JSON.parse(settings.POINT_RULES) : {};
  const spThresholds = settings.SP_THRESHOLDS ? JSON.parse(settings.SP_THRESHOLDS) : [50, 30, 15];

  const renderMatrix = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Aturan Poin Presensi</CardTitle>
        <CardDescription>Matriks nilai poin resmi untuk setiap status kehadiran.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2 font-semibold text-slate-600 uppercase text-[10px]">Status</th>
                <th className="py-2 text-center text-indigo-600 uppercase text-[10px]">Eksternal</th>
                <th className="py-2 text-center text-indigo-600 uppercase text-[10px]">Internal</th>
                <th className="py-2 text-center text-indigo-600 uppercase text-[10px]">Kepanitiaan</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {['TEPAT_WAKTU', 'TERLAMBAT_SAH', 'IZIN_SAKIT', 'TERLAMBAT_NON_SAKTI', 'PULANG_CEPAT', 'ALPHA'].map(status => (
                <tr key={status}>
                  <td className="py-3 font-medium text-slate-600">{status.replace(/_/g, ' ')}</td>
                  {['EKSTERNAL', 'INTERNAL', 'KEPANITIAAN'].map(scope => (
                    <td key={scope} className="py-3 px-2 text-center">
                      {isReadOnly ? (
                        <div className="font-bold text-slate-900">{pointRules[scope]?.[status] ?? 0}</div>
                      ) : (
                        <Input 
                          type="number" 
                          className="w-16 h-8 mx-auto text-center"
                          value={pointRules[scope]?.[status] ?? 0}
                          onChange={(e) => {
                            const newRules = { ...pointRules };
                            if (!newRules[scope]) newRules[scope] = {};
                            newRules[scope][status] = parseInt(e.target.value) || 0;
                            setSettings(prev => ({ ...prev, POINT_RULES: JSON.stringify(newRules) }));
                          }}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isReadOnly && (
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => handleReset('POINT_RULES')}><RotateCcw className="w-4 h-4 mr-1" /> Reset</Button>
            <Button size="sm" onClick={() => handleUpdateSetting('POINT_RULES', settings.POINT_RULES)}><Save className="w-4 h-4 mr-1" /> Simpan</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderAlpha = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Penalti Alpha</CardTitle>
          <CardDescription>Multiplikator untuk alpha beruntun.</CardDescription>
        </div>
        {!isReadOnly && (
          <Switch checked={isCustomAlpha} onCheckedChange={setIsCustomAlpha} />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Multiplier</Label>
            {isReadOnly ? <div className="font-bold">{settings.ALPHA_MULTIPLIER}x</div> : 
              <Input type="number" step="0.1" disabled={!isCustomAlpha} value={settings.ALPHA_MULTIPLIER} onChange={e => setSettings(s => ({ ...s, ALPHA_MULTIPLIER: e.target.value }))} />}
          </div>
          <div>
            <Label className="text-xs">Maksimal Poin</Label>
            {isReadOnly ? <div className="font-bold">{settings.ALPHA_MAX_PENALTY}</div> : 
              <Input type="number" disabled={!isCustomAlpha} value={settings.ALPHA_MAX_PENALTY} onChange={e => setSettings(s => ({ ...s, ALPHA_MAX_PENALTY: e.target.value }))} />}
          </div>
        </div>
        {!isReadOnly && isCustomAlpha && <Button size="sm" onClick={() => { handleUpdateSetting('ALPHA_MULTIPLIER', settings.ALPHA_MULTIPLIER); handleUpdateSetting('ALPHA_MAX_PENALTY', settings.ALPHA_MAX_PENALTY); }}>Simpan</Button>}
      </CardContent>
    </Card>
  );

  const renderSP = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Threshold SP</CardTitle>
        {!isReadOnly && <Switch checked={isCustomSP} onCheckedChange={setIsCustomSP} />}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((num, i) => (
            <div key={num}>
              <Label className="text-xs">SP {num}</Label>
              {isReadOnly ? <div className="font-bold text-center">{spThresholds[i]}</div> : 
                <Input type="number" disabled={!isCustomSP} value={spThresholds[i]} onChange={e => {
                  const nt = [...spThresholds]; nt[i] = parseInt(e.target.value) || 0;
                  setSettings(s => ({ ...s, SP_THRESHOLDS: JSON.stringify(nt) }));
                }} />}
            </div>
          ))}
        </div>
        {!isReadOnly && isCustomSP && <Button size="sm" onClick={() => handleUpdateSetting('SP_THRESHOLDS', settings.SP_THRESHOLDS)}>Simpan</Button>}
      </CardContent>
    </Card>
  );

  const renderCategories = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Kategori Poin</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isReadOnly && (
          <form onSubmit={handleAddCategory} className="space-y-4 border-b pb-6">
            <Input placeholder="Nama Kategori" value={newCategory.name} onChange={e => setNewCategory(n => ({ ...n, name: e.target.value }))} required />
            <div className="flex gap-4">
              <Select value={newCategory.type} onValueChange={(v: any) => setNewCategory(n => ({ ...n, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="REWARD">Reward</SelectItem><SelectItem value="PUNISHMENT">Punishment</SelectItem></SelectContent>
              </Select>
              <Input type="number" value={newCategory.points} onChange={e => setNewCategory(n => ({ ...n, points: parseInt(e.target.value) || 0 }))} />
              <Button type="submit">Tambah</Button>
            </div>
          </form>
        )}
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex justify-between items-center p-2 border rounded">
              <div className="text-sm font-medium">{cat.name} <span className={cat.type === 'REWARD' ? 'text-green-600' : 'text-red-600'}>({cat.points})</span></div>
              {!isReadOnly && <Button variant="ghost" size="sm" onClick={async () => { if(confirm('Hapus?')) { await fetch(`/api/admin/point-categories/${cat.id}`, { method: 'DELETE' }); fetchData(); } }}><Trash2 className="w-4 h-4 text-red-500" /></Button>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderUmum = () => (
    <Card>
      <CardHeader><CardTitle className="text-lg">Identitas Aplikasi</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs">Nama Aplikasi</Label>
          {isReadOnly ? <div className="font-bold">{settings.APP_NAME}</div> : <Input value={settings.APP_NAME} onChange={e => setSettings(s => ({ ...s, APP_NAME: e.target.value }))} />}
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 border rounded bg-slate-50 flex items-center justify-center">
            {settings.APP_LOGO ? <img src={getImageUrl(settings.APP_LOGO) || ''} className="w-12 h-12 object-contain" /> : <ImageIcon className="text-slate-300" />}
          </div>
          {!isReadOnly && (
            <div className="flex-1 space-y-2">
              <Input value={settings.APP_LOGO} onChange={e => setSettings(s => ({ ...s, APP_LOGO: e.target.value }))} placeholder="URL Logo" />
              <Button size="sm" onClick={() => document.getElementById('l-up')?.click()}>{isUploading ? 'Uploading...' : 'Upload'}</Button>
              <input type="file" id="l-up" hidden onChange={handleLogoUpload} />
            </div>
          )}
        </div>
        {!isReadOnly && <Button size="sm" onClick={() => { handleUpdateSetting('APP_NAME', settings.APP_NAME); handleUpdateSetting('APP_LOGO', settings.APP_LOGO); }}>Simpan</Button>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengaturan Sistem</h1>
          <p className="text-slate-500 text-sm">Konfigurasi parameter operasional PSDM.</p>
        </div>
        {isReadOnly && <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100"><Lock className="w-3 h-3" /> Read-Only Mode</div>}
      </div>

      {msg && <div className={`p-4 rounded-lg text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg.text}</div>}

      {isReadOnly ? (
        <div className="space-y-8">
          {renderMatrix()}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {renderAlpha()}
            {renderSP()}
          </div>
          {renderCategories()}
        </div>
      ) : (
        <Tabs defaultValue="kalkulasi" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border">
            <TabsTrigger value="kalkulasi">Kalkulasi</TabsTrigger>
            <TabsTrigger value="threshold">SP</TabsTrigger>
            <TabsTrigger value="categories">Kategori</TabsTrigger>
            <TabsTrigger value="umum">Umum</TabsTrigger>
          </TabsList>
          <TabsContent value="kalkulasi" className="space-y-6">{renderMatrix()}{renderAlpha()}</TabsContent>
          <TabsContent value="threshold" className="space-y-6">{renderSP()}</TabsContent>
          <TabsContent value="categories" className="space-y-6">{renderCategories()}</TabsContent>
          <TabsContent value="umum" className="space-y-6">{renderUmum()}</TabsContent>
        </Tabs>
      )}
    </div>
  );
}
