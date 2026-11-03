import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, HeartPulse, Menu, User } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    roles?: string[];
  } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user_info');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {
      // Ignore parse error
    }
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            title="Mở menu điều hướng"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm">
          <HeartPulse className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 leading-tight">
            MediCare Clinic System
          </h1>
          <p className="hidden sm:block text-xs text-slate-500">
            Hệ Thống Quản Lý Phòng Khám Đa Khoa Toàn Diện
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="success" className="gap-1.5 py-1 px-2.5 hidden sm:inline-flex">
          <Activity className="h-3.5 w-3.5 animate-pulse text-teal-600" />
          <span>Hệ Thống Hoạt Động</span>
        </Badge>

        {currentUser ? (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3 text-xs">
            <div className="h-7 w-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden lg:block text-left">
              <div className="font-semibold text-slate-800">{currentUser.username}</div>
              <div className="text-[10px] text-teal-600 font-mono">
                {currentUser.roles?.join(', ') || 'USER'}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="hidden md:inline">Bảo mật RBAC & JWT</span>
          </div>
        )}
      </div>
    </header>
  );
};
