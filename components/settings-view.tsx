'use client';

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Lock, Users, Save, AlertCircle, Check, Star, Trash2, Plus, UserPlus, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PointCategory {
  id: string;
  type: string;
  label: string;
  value: string;
  points: number;
}

interface PengurusUser {
  id: string;
  name: string;
  prn: string;
  createdAt: string;
  member?: { name: string; department: string };
}

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'departments' | 'security' | 'point-categories' | 'accounts'>('general');
  const [saveMessage, setSaveMessage] = useState('');
  
  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    systemName: 'PERISAI Admin Dashboard',
    organizationName: 'PERISAI Organization',
    maintenanceMode: false,
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newMemberAlert: true,
    pointsUpdateAlert: true,
    weeklyReport: true,
    systemNotifications: true,
  });

  // Departments state
  const [departments, setDepartments] = useState([
    { id: 1, name: 'PSDM', color: 'bg-blue-100', textColor: 'text-blue-900' },
    { id: 2, name: 'Acara', color: 'bg-purple-100', textColor: 'text-purple-900' },
    { id: 3, name: 'Humas', color: 'bg-green-100', textColor: 'text-green-900' },
    { id: 4, name: 'Logistik', color: 'bg-orange-100', textColor: 'text-orange-900' },
    { id: 5, name: 'Medkom', color: 'bg-pink-100', textColor: 'text-pink-900' },
  ]);

  const [newDepartment, setNewDepartment] = useState('');

  // Point Categories State
  const [pointCategories, setPointCategories] = useState<PointCategory[]>([]);
  const [isCatLoading, setIsCatLoading] = useState(false);
  const [newCatType, setNewCatType] = useState<'PUNISHMENT' | 'REWARD'>('PUNISHMENT');
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatPoints, setNewCatPoints] = useState<number>(0);
  const [catMessage, setCatMessage] = useState('');

  // Account Management State
  const [pengurusUsers, setPengurusUsers] = useState<PengurusUser[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [newUserPrn, setNewUserPrn] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserDept, setNewUserDept] = useState('');
  const [newUserJoinDate, setNewUserJoinDate] = useState('');
  const [newUserStatus, setNewUserStatus] = useState('active');
  const [newUserBasePoints, setNewUserBasePoints] = useState(0);
  const [userMessage, setUserMessage] = useState('');
  const [resetPasswordId, setResetPasswordId] = useState('');
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  const fetchPengurusUsers = async () => {
    setIsUsersLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) setPengurusUsers(await res.json());
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleAddPengurus = async () => {
    if (!newUserPrn || !newUserName || !newUserPassword || !newUserDept) {
      setUserMessage('❌ PRN, nama, departemen, dan password wajib diisi.');
      return;
    }
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prn: newUserPrn,
        name: newUserName,
        password: newUserPassword,
        department: newUserDept,
        joinDate: newUserJoinDate || new Date().toISOString().split('T')[0],
        status: newUserStatus,
        basePoints: newUserBasePoints,
      })
    });
    if (res.ok) {
      setNewUserPrn(''); setNewUserName(''); setNewUserPassword('');
      setNewUserDept(''); setNewUserJoinDate(''); setNewUserStatus('active'); setNewUserBasePoints(0);
      fetchPengurusUsers();
      setUserMessage('✓ Akun pengurus & data anggota berhasil ditambahkan.');
    } else {
      const err = await res.json();
      setUserMessage(`❌ ${err.error}`);
    }
    setTimeout(() => setUserMessage(''), 5000);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Hapus akun pengurus ini?')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) fetchPengurusUsers();
  };

  const handleResetPassword = async (id: string) => {
    if (!resetPasswordValue) return;
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: resetPasswordValue })
    });
    if (res.ok) {
      setResetPasswordId('');
      setResetPasswordValue('');
      setUserMessage('✓ Password berhasil direset.');
      setTimeout(() => setUserMessage(''), 3000);
    }
  };

  const fetchCategories = async () => {
    setIsCatLoading(true);
    try {
      const res = await fetch('/api/point-categories');
      if (res.ok) setPointCategories(await res.json());
    } finally {
      setIsCatLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'point-categories') fetchCategories();
    if (activeTab === 'accounts') fetchPengurusUsers();
  }, [activeTab]);

  const handleAddCategory = async () => {
    if (!newCatLabel.trim()) { alert('Harap isi nama kategori.'); return; }
    const res = await fetch('/api/point-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: newCatType, label: newCatLabel, points: newCatPoints })
    });
    if (res.ok) {
      setNewCatLabel('');
      setNewCatPoints(0);
      fetchCategories();
      setCatMessage('✓ Kategori baru berhasil ditambahkan');
      setTimeout(() => setCatMessage(''), 3000);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Hapus kategori ini?')) return;
    const res = await fetch(`/api/point-categories/${id}`, { method: 'DELETE' });
    if (res.ok) fetchCategories();
  };

  const handleSaveSettings = (section: string) => {
    setSaveMessage(`✓ ${section} settings saved successfully`);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleAddDepartment = () => {
    if (newDepartment.trim()) {
      const colors = [
        { color: 'bg-indigo-100', textColor: 'text-indigo-900' },
        { color: 'bg-cyan-100', textColor: 'text-cyan-900' },
        { color: 'bg-teal-100', textColor: 'text-teal-900' },
        { color: 'bg-fuchsia-100', textColor: 'text-fuchsia-900' },
        { color: 'bg-amber-100', textColor: 'text-amber-900' },
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setDepartments([
        ...departments,
        {
          id: Math.max(...departments.map((d) => d.id), 0) + 1,
          name: newDepartment,
          ...randomColor,
        },
      ]);
      setNewDepartment('');
    }
  };

  const handleDeleteDepartment = (id: number) => {
    setDepartments(departments.filter((d) => d.id !== id));
  };

  const tabs = [
    { id: 'general', label: 'Umum', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'departments', label: 'Departemen', icon: Users },
    { id: 'point-categories', label: 'Kategori Poin', icon: Star },
    { id: 'accounts', label: 'Akun Pengurus', icon: UserPlus },
    { id: 'security', label: 'Keamanan', icon: Lock },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Pengaturan Sistem</h1>
        <p className="text-slate-600 mt-1">
          Kelola konfigurasi, preferensi, dan pengaturan keamanan sistem
        </p>
      </div>

      {/* Success Message */}
      {saveMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-green-800">{saveMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-8">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 px-2 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Umum Sistem</CardTitle>
                <CardDescription>
                  Kelola nama sistem dan pengaturan dasar organisasi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Nama Sistem
                  </label>
                  <input
                    type="text"
                    value={generalSettings.systemName}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, systemName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Nama Organisasi
                  </label>
                  <input
                    type="text"
                    value={generalSettings.organizationName}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, organizationName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">Mode Pemeliharaan</p>
                    <p className="text-sm text-slate-600">Nonaktifkan akses pengguna untuk pemeliharaan</p>
                  </div>
                  <Switch
                    checked={generalSettings.maintenanceMode}
                    onCheckedChange={(checked) =>
                      setGeneralSettings({ ...generalSettings, maintenanceMode: checked })
                    }
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleSaveSettings('General')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Pengaturan
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preferensi Notifikasi</CardTitle>
                <CardDescription>
                  Atur jenis notifikasi yang ingin Anda terima
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">Notifikasi Email</p>
                    <p className="text-sm text-slate-600">Terima notifikasi melalui email</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">Alert Anggota Baru</p>
                    <p className="text-sm text-slate-600">Notifikasi saat ada anggota baru</p>
                  </div>
                  <Switch
                    checked={notificationSettings.newMemberAlert}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, newMemberAlert: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">Alert Update Poin</p>
                    <p className="text-sm text-slate-600">Notifikasi saat poin anggota diperbarui</p>
                  </div>
                  <Switch
                    checked={notificationSettings.pointsUpdateAlert}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, pointsUpdateAlert: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">Laporan Mingguan</p>
                    <p className="text-sm text-slate-600">Terima laporan ringkas setiap minggu</p>
                  </div>
                  <Switch
                    checked={notificationSettings.weeklyReport}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, weeklyReport: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">Notifikasi Sistem</p>
                    <p className="text-sm text-slate-600">Notifikasi penting dari sistem</p>
                  </div>
                  <Switch
                    checked={notificationSettings.systemNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, systemNotifications: checked })
                    }
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleSaveSettings('Notification')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Preferensi
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Department Settings */}
        {activeTab === 'departments' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Kelola Departemen</CardTitle>
                <CardDescription>
                  Tambah, edit, atau hapus departemen dalam organisasi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Masukkan nama departemen baru"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddDepartment()}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button
                    onClick={handleAddDepartment}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Tambah
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {departments.map((dept) => (
                    <div
                      key={dept.id}
                      className={`p-4 rounded-lg border border-slate-200 flex items-center justify-between ${dept.color}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: 'currentColor' }}
                        ></div>
                        <span className={`font-medium ${dept.textColor}`}>{dept.name}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteDepartment(dept.id)}
                        className={`text-xs px-2 py-1 rounded ${dept.textColor} bg-white/50 hover:bg-white transition-colors`}
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleSaveSettings('Department')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Departemen
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Point Categories */}
        {activeTab === 'point-categories' && (
          <div className="space-y-4">
            {/* Add Category Form */}
            <Card>
              <CardHeader>
                <CardTitle>Tambah Kategori Poin Baru</CardTitle>
                <CardDescription>Buat kategori Reward atau Punishment sesuai SOP terbaru organisasi.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Tipe</Label>
                    <Select value={newCatType} onValueChange={(v: any) => { setNewCatType(v); setNewCatPoints(v === 'PUNISHMENT' ? -5 : 5); }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUNISHMENT">🔴 Punishment</SelectItem>
                        <SelectItem value="REWARD">🟢 Reward</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nama Kategori</Label>
                    <Input
                      placeholder="Contoh: Juara Lomba Internal"
                      value={newCatLabel}
                      onChange={(e) => setNewCatLabel(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nilai Poin</Label>
                    <Input
                      type="number"
                      placeholder="Contoh: 20 atau -10"
                      value={newCatPoints}
                      onChange={(e) => setNewCatPoints(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                {catMessage && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">{catMessage}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={handleAddCategory} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Tambah Kategori
                </Button>
              </CardFooter>
            </Card>

            {/* Categories List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Punishment List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    🔴 <span>Punishment</span>
                  </CardTitle>
                  <CardDescription>Kategori pengurangan poin akibat pelanggaran.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isCatLoading ? (
                    <p className="text-sm text-slate-500">Memuat...</p>
                  ) : (
                    <div className="space-y-2">
                      {pointCategories.filter(c => c.type === 'PUNISHMENT').map(cat => (
                        <div key={cat.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{cat.label}</p>
                            <Badge variant="outline" className="text-red-700 border-red-200 text-xs mt-1">{cat.points} poin</Badge>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-100">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {pointCategories.filter(c => c.type === 'PUNISHMENT').length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4 border border-dashed rounded-lg">Belum ada kategori Punishment.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reward List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    🟢 <span>Reward / Apresiasi</span>
                  </CardTitle>
                  <CardDescription>Kategori penambahan poin atas prestasi.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isCatLoading ? (
                    <p className="text-sm text-slate-500">Memuat...</p>
                  ) : (
                    <div className="space-y-2">
                      {pointCategories.filter(c => c.type === 'REWARD').map(cat => (
                        <div key={cat.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg">
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{cat.label}</p>
                            <Badge variant="outline" className="text-green-700 border-green-200 text-xs mt-1">+{cat.points} poin</Badge>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-100">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {pointCategories.filter(c => c.type === 'REWARD').length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4 border border-dashed rounded-lg">Belum ada kategori Reward.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Account Management */}
        {activeTab === 'accounts' && (
          <div className="space-y-4">
            {userMessage && (
              <div className={`p-3 rounded-lg flex items-center gap-2 border ${userMessage.startsWith('❌') ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                <span className="text-sm font-medium">{userMessage}</span>
              </div>
            )}

            {/* Form Pendaftaran */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" /> Daftarkan Akun Pengurus Baru</CardTitle>
                <CardDescription>
                  Data yang diisi akan otomatis membuat <strong>akun login</strong> dan <strong>data anggota</strong> sekaligus. Hanya Admin yang bisa melakukan pendaftaran ini.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Row 1: Identity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>PRN <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Contoh: PRN0252"
                      value={newUserPrn}
                      onChange={e => setNewUserPrn(e.target.value.toUpperCase())}
                      className="uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
                    <Input placeholder="Sesuai data resmi" value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                  </div>
                </div>

                {/* Row 2: Org info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Departemen <span className="text-red-500">*</span></Label>
                    <Select value={newUserDept} onValueChange={setNewUserDept}>
                      <SelectTrigger><SelectValue placeholder="Pilih departemen..." /></SelectTrigger>
                      <SelectContent>
                        {departments.map(d => (
                          <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Bergabung</Label>
                    <Input type="date" value={newUserJoinDate} onChange={e => setNewUserJoinDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={newUserStatus} onValueChange={setNewUserStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="inactive">Tidak Aktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 3: Points & Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Poin Awal</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={newUserBasePoints}
                      onChange={e => setNewUserBasePoints(parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-slate-400">Poin awal yang dimiliki pengurus saat pertama kali bergabung.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Password Awal <span className="text-red-500">*</span></Label>
                    <Input
                      type="password"
                      placeholder="Min. 6 karakter"
                      value={newUserPassword}
                      onChange={e => setNewUserPassword(e.target.value)}
                    />
                    <p className="text-xs text-slate-400">Pengurus dapat mengganti password setelah login pertama.</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Field bertanda <span className="text-red-500">*</span> wajib diisi.</p>
                <Button onClick={handleAddPengurus} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <UserPlus className="w-4 h-4 mr-2" /> Daftarkan Pengurus
                </Button>
              </CardFooter>
            </Card>

            {/* Daftar Akun */}
            <Card>
              <CardHeader>
                <CardTitle>Daftar Akun Pengurus Terdaftar</CardTitle>
                <CardDescription>Kelola akun login pengurus dan reset password jika diperlukan.</CardDescription>
              </CardHeader>
              <CardContent>
                {isUsersLoading ? (
                  <p className="text-sm text-slate-500">Memuat data akun...</p>
                ) : pengurusUsers.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 border border-dashed rounded-lg">
                    Belum ada akun pengurus yang terdaftar.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pengurusUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <div>
                          <p className="font-semibold text-slate-900">{user.name}</p>
                          <p className="text-sm text-slate-500">{user.prn}{user.member ? ` · ${user.member.department}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {resetPasswordId === user.id ? (
                            <div className="flex items-center gap-2">
                              <Input type="password" placeholder="Password baru" value={resetPasswordValue} onChange={e => setResetPasswordValue(e.target.value)} className="h-8 w-36 text-sm" />
                              <Button size="sm" onClick={() => handleResetPassword(user.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white h-8">Simpan</Button>
                              <Button size="sm" variant="ghost" onClick={() => { setResetPasswordId(''); setResetPasswordValue(''); }} className="h-8">Batal</Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setResetPasswordId(user.id)} className="gap-1 h-8">
                              <KeyRound className="w-3 h-3" /> Reset
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <CardTitle>Pengaturan Keamanan</CardTitle>
                    <CardDescription>
                      Kelola akses, izin, dan keamanan sistem
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-amber-200">
                  <h3 className="font-medium text-slate-900 mb-3">Password Admin</h3>
                  <Button variant="outline" className="border-amber-300">
                    Ubah Password
                  </Button>
                </div>

                <div className="p-4 bg-white rounded-lg border border-amber-200">
                  <h3 className="font-medium text-slate-900 mb-3">Two-Factor Authentication</h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Tingkatkan keamanan akun dengan autentikasi dua faktor
                  </p>
                  <Button variant="outline" className="border-amber-300">
                    Aktifkan 2FA
                  </Button>
                </div>

                <div className="p-4 bg-white rounded-lg border border-amber-200">
                  <h3 className="font-medium text-slate-900 mb-2">Log Aktivitas Terakhir</h3>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p>• Login terakhir: Hari ini 14:32 WIB dari 192.168.1.1</p>
                    <p>• Perubahan data: 2 jam yang lalu</p>
                    <p>• Export data: Kemarin 10:15 WIB</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleSaveSettings('Security')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Pengaturan Keamanan
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
