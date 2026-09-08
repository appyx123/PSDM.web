'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';

export default function LoginPage() {
  const router = useRouter();
  const [prn, setPrn] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const cleanPrn = prn.trim().toUpperCase();
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prn: cleanPrn, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Login gagal.');
      }
    } catch {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 flex items-center justify-center p-6 md:p-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-indigo-600 rounded-2xl mb-4 shadow-xl shadow-indigo-900/50 transition-all duration-300">
            <svg className="w-8 h-8 md:w-9 md:h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">PSDM System</h1>
          <p className="text-indigo-200/80 mt-1 text-xs md:text-sm">Sistem Manajemen Terpadu Pengembangan SDM</p>
        </div>

        <Card className="border-0 shadow-2xl shadow-black/50 bg-white/95 backdrop-blur transition-all duration-300">
          <CardContent className="p-6 md:p-8">
            <div className="mb-6 text-center">
              <h2 className="text-lg font-semibold text-slate-900">Masuk ke Akun Anda</h2>
              <p className="text-xs text-slate-500 mt-1">Gunakan PRN atau ID resmi Anda untuk masuk</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
              <input type="text" name="fakeusernameremembered" autoComplete="off" className="hidden" />
              <input type="password" name="fakepasswordremembered" autoComplete="off" className="hidden" />

              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">PRN / ID</Label>
                <Input
                  type="text"
                  name="prn"
                  placeholder="Contoh: PRN001"
                  autoComplete="off"
                  value={prn}
                  onChange={e => setPrn(e.target.value)}
                  required
                  className="h-11 uppercase font-mono text-sm tracking-wide placeholder:font-sans placeholder:tracking-normal"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Password</Label>
                <PasswordInput
                  name="password"
                  placeholder="Masukkan password akun"
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-[0.99]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Memverifikasi...
                  </span>
                ) : 'Masuk ke Sistem'}
              </Button>

              <div className="pt-2 text-center">
                <p className="text-xs text-slate-400">
                  Autentikasi terpusat untuk Super Admin, Admin, dan Pengurus.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
