'use client';

import { 
  X, User, Mail, Phone, Instagram, Linkedin, MapPin, 
  GraduationCap, Calendar, Award, ShieldAlert, 
  History, UserCircle, Briefcase, Info 
} from 'lucide-react';
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription 
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Member } from '@/app/page';
import { cn, getImageUrl } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MemberDetailPanelProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberDetailPanel({ member, open, onOpenChange }: MemberDetailPanelProps) {
  if (!member) return null;

  const user = member.user || {};
  const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const formatBirthInfo = (place?: string | null, dateStr?: string | null) => {
    let formattedDate = '';
    if (dateStr) {
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          });
        } else {
          formattedDate = dateStr;
        }
      } catch {
        formattedDate = dateStr;
      }
    }

    if (place && formattedDate) {
      return `${place}, ${formattedDate}`;
    }
    if (place) return place;
    if (formattedDate) return formattedDate;
    return '-';
  };

  const formatJoinDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatCity = (city?: string | null, other?: string | null) => {
    if (!city) return null;
    return city === 'Lainnya' ? (other || 'Lainnya') : city;
  };

  const formatDomicile = () => {
    const address = user.domicileAddress?.trim();
    const city = formatCity(user.domicileCity, user.domicileCityOther);
    if (address && city) return `${address}, ${city}`;
    if (address) return address;
    if (city) return city;
    return '-';
  };

  const formatOrigin = () => {
    const city = formatCity(user.originCity, user.originCityOther);
    return city || '-';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl p-0 flex flex-col h-full border-l shadow-2xl">
        <div className="p-6 border-b bg-white sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              {user.image ? (
                <img src={getImageUrl(user.image) || ''} alt={member.name} className="w-20 h-20 rounded-2xl object-cover border-4 border-indigo-50 shadow-sm" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-2xl font-bold text-white shadow-md">
                  {initials}
                </div>
              )}
              <div>
                <SheetTitle className="text-2xl font-black text-slate-900 tracking-tight">{member.name}</SheetTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-indigo-600 hover:bg-indigo-600 px-3 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    {member.position}
                  </Badge>
                  {member.department !== 'Trisula' && (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 px-3 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {member.department}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8 space-y-9">
            {/* 1. Informasi Keanggotaan */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Informasi Keanggotaan</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 group hover:border-indigo-200 transition-colors">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">PRN / ID Login</p>
                  <p className="font-mono font-bold text-slate-900 text-sm">{member.prn || '-'}</p>
                </div>
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 group hover:border-indigo-200 transition-colors">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Generasi</p>
                  <p className="font-bold text-slate-900 text-sm">
                    {user.generation !== null && user.generation !== undefined ? `Gen ${user.generation}` : '-'}
                  </p>
                </div>
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 group hover:border-indigo-200 transition-colors">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal Bergabung</p>
                  <p className="font-bold text-slate-900 text-sm">{formatJoinDate(member.joinDate)}</p>
                </div>
              </div>
            </section>

            {/* 2. Performa & Status */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-500">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Performa & Status</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden group">
                  <Award className="absolute -right-2 -bottom-2 w-12 h-12 text-indigo-500/10 group-hover:scale-110 transition-transform" />
                  <p className="text-[10px] font-bold text-indigo-600 uppercase">Total Poin</p>
                  <p className="text-4xl font-black text-indigo-700 mt-1">{member.points ?? 100}</p>
                </div>
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Status Keanggotaan</p>
                  <Badge className={cn(
                    "w-fit font-bold px-4 py-1", 
                    member.status === 'AKTIF' ? 'bg-green-500' : member.status === 'ALUMNI' ? 'bg-indigo-400' : 'bg-slate-400'
                  )}>
                    {member.status}
                  </Badge>
                </div>
              </div>
              
              {member.treatment?.isActive && (
                <div className="mt-4 p-5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="p-2 bg-amber-200/50 rounded-xl text-amber-700">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-amber-900 uppercase">Masa Pembinaan Aktif</p>
                    <p className="text-xs text-amber-700 font-medium mt-0.5">
                      Jalur: <span className="font-bold">{member.treatment.path}</span> • Sisa <span className="font-bold">{member.treatment.durationDays} hari</span>
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* 3. Informasi Pribadi */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                  <UserCircle className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Informasi Pribadi</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 sm:col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Lengkap</p>
                  <p className="font-bold text-slate-900 text-sm">{user.fullName || member.name || '-'}</p>
                </div>
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tempat & Tanggal Lahir</p>
                  <p className="font-bold text-slate-900 text-sm">{formatBirthInfo(user.birthPlace, user.birthDate)}</p>
                </div>
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jenis Kelamin</p>
                  <p className="font-bold text-slate-900 text-sm">{user.gender || '-'}</p>
                </div>
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 sm:col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kota Asal</p>
                  <p className="font-bold text-slate-900 text-sm">{formatOrigin()}</p>
                </div>
              </div>
            </section>

            {/* 4. Data Akademik */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Data Akademik</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fakultas</p>
                  <p className="font-bold text-slate-900 text-sm">{user.faculty || '-'}</p>
                </div>
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Program Studi</p>
                  <p className="font-bold text-slate-900 text-sm">{user.majorProgram || '-'}</p>
                </div>
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">NIM</p>
                  <p className="font-mono font-bold text-slate-900 text-sm">{user.nim || '-'}</p>
                </div>
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Angkatan</p>
                  <p className="font-bold text-slate-900 text-sm">{user.angkatan || '-'}</p>
                </div>
              </div>
            </section>

            {/* 5. Kontak & Sosial Media */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600">
                  <Phone className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Kontak & Sosial Media</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                  {user.email ? (
                    <a href={`mailto:${user.email}`} className="text-indigo-600 hover:underline font-bold text-sm truncate block">
                      {user.email}
                    </a>
                  ) : (
                    <p className="font-bold text-slate-900 text-sm">-</p>
                  )}
                </div>
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">No. WhatsApp / Telepon</p>
                  {user.phoneNumber ? (
                    <a 
                      href={`https://wa.me/${user.phoneNumber.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-emerald-600 hover:underline font-bold text-sm block"
                    >
                      {user.phoneNumber}
                    </a>
                  ) : (
                    <p className="font-bold text-slate-900 text-sm">-</p>
                  )}
                </div>
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 sm:col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Alamat Domisili Lengkap</p>
                  <p className="font-bold text-slate-900 text-sm leading-relaxed">{formatDomicile()}</p>
                </div>
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">LinkedIn</p>
                  {user.linkedin ? (
                    <a 
                      href={user.linkedin.startsWith('http') ? user.linkedin : `https://${user.linkedin}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-600 hover:underline font-bold text-sm truncate block"
                    >
                      {user.linkedin}
                    </a>
                  ) : (
                    <p className="font-bold text-slate-900 text-sm">-</p>
                  )}
                </div>
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Instagram</p>
                  {user.instagram ? (
                    <a 
                      href={`https://instagram.com/${user.instagram.replace('@', '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-pink-600 hover:underline font-bold text-sm block"
                    >
                      @{user.instagram.replace('@', '')}
                    </a>
                  ) : (
                    <p className="font-bold text-slate-900 text-sm">-</p>
                  )}
                </div>
              </div>
            </section>

            {/* Riwayat Kehadiran */}
            <section className="pb-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                    <History className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Riwayat Kehadiran</h3>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold text-slate-400 border-slate-100">
                  {member.attendances?.length || 0} Total
                </Badge>
              </div>
              
              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                 <div className="overflow-x-auto">
                   <table className="w-full text-xs text-left">
                     <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-tighter">
                       <tr>
                         <th className="px-5 py-3 border-b border-slate-100">Nama Kegiatan</th>
                         <th className="px-5 py-3 border-b border-slate-100">Scope</th>
                         <th className="px-5 py-3 border-b border-slate-100">Waktu</th>
                         <th className="px-5 py-3 border-b border-slate-100 text-right">Status</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                       {member.attendances?.slice(0, 10).map((att: any, i: number) => (
                         <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-5 py-4">
                             <p className="font-bold text-slate-900">{att.activity?.name || 'Kegiatan Tanpa Nama'}</p>
                             <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{att.activity?.description || '-'}</p>
                           </td>
                           <td className="px-5 py-4">
                             <Badge variant="secondary" className="text-[9px] font-black uppercase px-2 py-0">
                               {att.activity?.scope || '-'}
                             </Badge>
                           </td>
                           <td className="px-5 py-4 text-slate-500 font-medium">
                             {att.activity?.date ? new Date(att.activity.date).toLocaleDateString('id-ID', {
                               day: 'numeric', month: 'short', year: 'numeric'
                             }) : '-'}
                           </td>
                           <td className="px-5 py-4 text-right">
                             <span className={cn(
                               "px-2 py-1 rounded-md font-black text-[9px] uppercase tracking-wider",
                               att.status === 'TEPAT_WAKTU' ? "bg-green-100 text-green-700" : 
                               att.status === 'ALPHA' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                             )}>
                               {att.status.replace('_', ' ')}
                             </span>
                           </td>
                         </tr>
                       ))}
                       {(!member.attendances || member.attendances.length === 0) && (
                         <tr>
                           <td colSpan={4} className="px-5 py-10 text-center">
                             <div className="flex flex-col items-center gap-2">
                               <Info className="w-8 h-8 text-slate-200" />
                               <p className="text-slate-400 font-medium italic">Belum ada riwayat kehadiran tercatat.</p>
                             </div>
                           </td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 </div>
              </div>
              {member.attendances && member.attendances.length > 10 && (
                <p className="text-[10px] text-center text-slate-400 mt-4 font-bold uppercase tracking-widest">
                  Hanya menampilkan 10 data terakhir
                </p>
              )}
            </section>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
