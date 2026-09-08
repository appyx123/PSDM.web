'use client';

import { User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/lib/utils';

interface UserProfileMenuPengurusProps {
  userName?: string;
  userPrn?: string;
  userImage?: string;
  onLogoutClick?: () => void;
}

export function UserProfileMenuPengurus({
  userName = 'Pengurus',
  userPrn,
  userImage,
  onLogoutClick,
}: UserProfileMenuPengurusProps) {
  const router = useRouter();
  const initials = userName.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';

  const handleLogout = async () => {
    if (onLogoutClick) {
      onLogoutClick();
      return;
    }

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout request error:', err);
    }

    // Hard redirect to clear all client states and trigger server re-authentication
    window.location.href = '/login';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
          <Avatar className="h-9 w-9">
            {userImage && <AvatarImage src={getImageUrl(userImage) || ''} alt={userName} className="object-cover" />}
            <AvatarFallback className="bg-indigo-600 text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-medium text-slate-900">{userName}</p>
            {userPrn && <p className="text-xs text-slate-500">{userPrn}</p>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/pengurus-profile')} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Pengaturan</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
