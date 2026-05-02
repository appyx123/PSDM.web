'use client';

import { useState } from 'react';
import { Search, X, Menu } from 'lucide-react';
import { UserProfileMenu } from '@/components/user-profile-menu';
import { ProfileSettingsModal } from '@/components/profile-settings-modal';
import { NotificationBell } from '@/components/notification-bell';

interface DashboardHeaderProps {
  userName?: string;
  userEmail?: string;
  userRole?: string;
  onSearch?: (query: string) => void;
  searchResultCount?: number;
  totalCount?: number;
  onLogout?: () => void;
  showSearch?: boolean;
  onMenuClick?: () => void;
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
  onMenuClick,
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
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-2 md:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          <button 
            onClick={onMenuClick}
            className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg hidden sm:block">
            {showSearch && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari anggota..."
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
              </>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 md:gap-4 ml-auto">
            {/* Mobile Search Trigger (Alternative for small screens) */}
            {showSearch && (
              <button className="sm:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Notifications */}
            <NotificationBell />

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

        {/* Search status summary for mobile/tablet */}
        {showSearch && searchQuery && totalCount > 0 && (
          <p className="text-[10px] text-slate-500 mt-2 sm:mt-1.5 px-1">
            Ditemukan <span className="font-semibold text-indigo-600">{searchResultCount}</span> dari <span className="font-semibold">{totalCount}</span> anggota
          </p>
        )}
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
