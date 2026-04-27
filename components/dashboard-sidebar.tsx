'use client';

import { Home, Users, BarChart3, Settings, CalendarDays, ShieldAlert, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardSidebarProps {
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
  appName?: string;
  appLogo?: string;
}

export function DashboardSidebar({ 
  activeItem = 'dashboard', 
  onItemClick,
  appName = 'Admin',
  appLogo
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
    <aside className="w-64 bg-indigo-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-indigo-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-700 flex items-center justify-center overflow-hidden border border-indigo-600 flex-shrink-0">
          {appLogo ? (
            <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-bold">{appName[0]}</span>
          )}
        </div>
        <div className="overflow-hidden">
          <h1 className="text-lg font-bold truncate leading-tight">{appName}</h1>
          <p className="text-[10px] text-indigo-300 uppercase tracking-wider font-semibold mt-0.5">Management System</p>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onItemClick?.(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer',
                isActive
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-100 hover:bg-indigo-800'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-indigo-800">
        <p className="text-xs text-indigo-300">© 2024 Admin Dashboard</p>
      </div>
    </aside>
  );
}
