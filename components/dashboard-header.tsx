'use client';

import { useState } from 'react';
import { Search, Bell, X } from 'lucide-react';
import { UserProfileMenu } from '@/components/user-profile-menu';
import { ProfileSettingsModal } from '@/components/profile-settings-modal';

interface DashboardHeaderProps {
  userName?: string;
  userEmail?: string;
  userRole?: string;
  onSearch?: (query: string) => void;
  searchResultCount?: number;
  totalCount?: number;
  onLogout?: () => void;
  showSearch?: boolean;
}

export function DashboardHeader({ 
  userName = 'Admin User',
  userEmail = 'admin@perisai.com',
  userRole = 'ADMIN',
  onSearch,
  searchResultCount = 0,
  totalCount = 0,
  onLogout,
  showSearch = true,
}: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onSearch?.('');
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Search Bar */}
          <div className="flex-1 max-w-lg">
            {showSearch && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari anggota berdasarkan nama atau PRN..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-10 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {searchQuery && totalCount > 0 && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Ditemukan <span className="font-semibold text-indigo-600">{searchResultCount}</span> dari <span className="font-semibold">{totalCount}</span> anggota
                  </p>
                )}
              </>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4 ml-6">
            {/* Notifications */}
            <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Profile Menu */}
            <UserProfileMenu
              userName={userName}
              userEmail={userEmail}
              userRole={userRole}
              onSettingsClick={() => setProfileSettingsOpen(true)}
              onLogoutClick={onLogout}
            />
          </div>
        </div>
      </header>

      {/* Profile Settings Modal (Admin only) */}
      <ProfileSettingsModal
        open={profileSettingsOpen}
        onOpenChange={setProfileSettingsOpen}
        userName={userName}
        userEmail={userEmail}
      />
    </>
  );
}
