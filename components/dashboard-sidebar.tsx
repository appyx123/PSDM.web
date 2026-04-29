'use client';

import { Home, Users, BarChart3, Settings, CalendarDays, ShieldAlert, Star, X } from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';

interface DashboardSidebarProps {
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
  appName?: string;
  appLogo?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({ 
  activeItem = 'dashboard', 
  onItemClick,
  appName = 'Admin',
  appLogo,
  isOpen = false,
  onClose
}: DashboardSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'activities', label: 'Kegiatan', icon: CalendarDays },
    { id: 'governance', label: 'Tata Kelola', icon: ShieldAlert },
    { id: 'evaluasi', label: 'Evaluasi & Apresiasi', icon: Star },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

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
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onItemClick?.(item.id);
                  if (window.innerWidth < 768) onClose?.();
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer',
                  isActive
                    ? 'bg-indigo-700 text-white'
                    : 'text-indigo-100 hover:bg-indigo-800'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
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
