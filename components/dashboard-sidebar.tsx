'use client';

import { 
  Home, Users, BarChart3, Settings, CalendarDays, ShieldAlert, 
  Star, X, CheckCircle2, ShieldCheck, Building2, Network 
} from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  section?: string;
  badge?: string;
}

interface DashboardSidebarProps {
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
  appName?: string;
  appLogo?: string;
  isOpen?: boolean;
  onClose?: () => void;
  userRole?: string;
}

export function DashboardSidebar({ 
  activeItem = 'dashboard', 
  onItemClick,
  appName = 'Admin',
  appLogo,
  isOpen = false,
  onClose,
  userRole = 'PENGURUS'
}: DashboardSidebarProps) {
  const normalizedRole = (userRole || '').toUpperCase();
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN';

  const menuItems: MenuItem[] = isSuperAdmin ? [
    { id: 'dashboard', label: 'Dashboard', icon: Home, section: 'MENU UTAMA' },
    { id: 'members', label: 'Anggota', icon: Users },
    { id: 'admin_users', label: 'Organisasi', icon: Building2, section: 'OTORITAS SUPER ADMIN', badge: 'SUPER' },
    { id: 'governance', label: 'Sanksi / SP', icon: ShieldAlert, badge: 'SUPER' },
    { id: 'activities', label: 'Kegiatan', icon: CalendarDays, section: 'OPERASIONAL' },
    { id: 'verification', label: 'Verifikasi', icon: CheckCircle2 },
    { id: 'evaluasi', label: 'Poin', icon: Star },
    { id: 'reports', label: 'Laporan', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan', icon: Settings, section: 'PENGATURAN' },
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: Home, section: 'MENU UTAMA' },
    { id: 'members', label: 'Anggota', icon: Users },
    { id: 'activities', label: 'Kegiatan', icon: CalendarDays, section: 'OPERASIONAL' },
    { id: 'verification', label: 'Verifikasi', icon: CheckCircle2 },
    { id: 'evaluasi', label: 'Poin', icon: Star },
    { id: 'reports', label: 'Laporan', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan', icon: Settings, section: 'PENGATURAN' },
  ];

  const isItemActive = (itemId: string) => {
    if (activeItem === itemId) return true;
    if (itemId === 'verification' && (activeItem === 'perizinan' || activeItem === 'claims')) return true;
    if (itemId === 'admin_users' && (activeItem === 'organization' || activeItem === 'admins' || activeItem === 'departments' || activeItem === 'pj_mapping')) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-indigo-950 text-white flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo & Close Button */}
        <div className="p-6 border-b border-indigo-800 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-indigo-700 flex items-center justify-center overflow-hidden border border-indigo-600 flex-shrink-0">
              {appLogo ? (
                <img src={getImageUrl(appLogo) || ''} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold">{appName[0]}</span>
              )}
            </div>
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold truncate leading-tight">{appName}</h1>
              <p className="text-[10px] text-indigo-300 uppercase tracking-wider font-semibold mt-0.5">Management System</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden p-2 hover:bg-indigo-800 rounded-lg text-indigo-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.id);
            return (
              <div key={item.id}>
                {item.section && (
                  <p className="text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest px-3 pt-3 pb-1">
                    {item.section}
                  </p>
                )}
                <button
                  onClick={() => {
                    onItemClick?.(item.id);
                    if (window.innerWidth < 768) onClose?.();
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors cursor-pointer text-left',
                    isActive
                      ? 'bg-indigo-700 text-white shadow-sm font-semibold'
                      : 'text-indigo-100 hover:bg-indigo-800/80 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/40 flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-indigo-800">
          <p className="text-[10px] text-indigo-400 text-center uppercase tracking-widest">© 2024 PSDM Project</p>
        </div>
      </aside>
    </>
  );
}
