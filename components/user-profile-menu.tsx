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

interface UserProfileMenuProps {
  userName?: string;
  userEmail?: string;
  userRole?: string;
  onProfileClick?: () => void;
  onEditProfileClick?: () => void;
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
}

export function UserProfileMenu({
  userName = 'Admin User',
  userEmail = 'admin@perisai.com',
  userRole = 'ADMIN',
  onProfileClick,
  onEditProfileClick,
  onSettingsClick,
  onLogoutClick,
}: UserProfileMenuProps) {
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
            {initials}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-slate-900">{userName}</span>
            <span className="text-xs text-slate-500">{userEmail}</span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{userName}</span>
            <span className="text-xs text-slate-500 font-normal">{userEmail}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {userRole === 'PENGURUS' && (
          <>
            <DropdownMenuItem onClick={onEditProfileClick} className="cursor-pointer">
              <User className="w-4 h-4 mr-2" />
              <span>Edit Profil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={onSettingsClick} className="cursor-pointer">
          <Settings className="w-4 h-4 mr-2" />
          <span>Pengaturan Akun</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogoutClick} className="cursor-pointer text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
