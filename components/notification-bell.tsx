'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.isRead).length);
      }
    } catch(e) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Polling every minute
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id?: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { id } : {})
      });
      fetchNotifications();
    } catch(e) {}
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none">
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifikasi</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead()} className="text-xs h-6 text-indigo-600 px-2">
              Tandai semua dibaca
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">Tidak ada notifikasi</div>
        ) : (
          notifications.map(n => (
            <DropdownMenuItem 
              key={n.id} 
              className={`flex flex-col items-start p-3 gap-1 cursor-pointer ${!n.isRead ? 'bg-indigo-50/50' : ''}`}
              onClick={() => {
                 if (!n.isRead) handleMarkAsRead(n.id);
                 if (n.link) window.location.href = n.link;
              }}
            >
              <div className="flex items-center justify-between w-full">
                 <span className={`font-semibold text-sm ${!n.isRead ? 'text-indigo-900' : 'text-slate-700'}`}>{n.title}</span>
                 {!n.isRead && <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />}
              </div>
              <span className="text-xs text-slate-500">{n.message}</span>
              <span className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
