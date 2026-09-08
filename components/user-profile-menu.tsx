'use client';

import { User, Settings, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getImageUrl } from '@/lib/utils';

interface UserProfileMenuProps {
  userName?: string;
  userEmail?: string;
  userRole?: string;
  userImage?: string;
  onProfileClick?: () => void;
  onEditProfileClick?: () => void;
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
}

export function UserProfileMenu({
  userName = 'Admin User',
  userEmail = 'admin@perisai.com',
  userRole = 'ADMIN',
  userImage,
  onProfileClick,
  onEditProfileClick,
  onSettingsClick,
  onLogoutClick,
}: UserProfileMenuProps) {
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'AD';

  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer border border-transparent hover:border-slate-200">
          <div className="relative flex-shrink-0">
            {userImage ? (
              <img
                src={getImageUrl(userImage) || ''}
                alt={userName}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                {initials}
              </div>
            )}
          </div>
          <div className="hidden md:flex flex-col items-start text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-slate-800 leading-tight">{userName}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                isSuperAdmin 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-indigo-100 text-indigo-700'
              }`}>
                {isSuperAdmin ? 'Super' : 'Admin'}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-normal leading-tight">{userEmail}</span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900">{userName}</span>
            <span className="text-xs text-slate-500 font-normal">{userEmail}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onSettingsClick} className="cursor-pointer">
          <User className="w-4 h-4 mr-2 text-indigo-600" />
          <span>Profil & Biodata</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogoutClick} className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50">
          <LogOut className="w-4 h-4 mr-2" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
