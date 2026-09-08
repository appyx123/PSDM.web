'use client';

import { ArrowLeft, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UniversalProfileForm } from '@/components/universal-profile-form';

export function PengurusSettingsView() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    window.location.href = '/login';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            className="rounded-full hover:bg-slate-100"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Pengaturan Profil</h1>
            <p className="text-slate-500 text-xs">Kelola data biodata, akademik, dan keamanan akun</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 font-medium text-xs"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          Keluar (Logout)
        </Button>
      </div>

      {/* Universal Profile Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <UniversalProfileForm
          isModal={false}
          onSuccess={() => {
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
