import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Activity, 
  HeartPulse, 
  Menu, 
  User, 
  KeyRound, 
  LogOut
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/authService';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    roles?: string[];
  } | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const reloadUser = () => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  };

  useEffect(() => {
    reloadUser();
    const handleStorageChange = () => reloadUser();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    authService.logout();
    queryClient.clear();
    navigate('/login', { replace: true });
  };

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

      <div className="flex items-center gap-2.5">
        {/* System status pill */}
        <Badge variant="success" className="gap-1.5 py-1 px-2.5 hidden md:inline-flex">
          <Activity className="h-3.5 w-3.5 animate-pulse text-teal-600" />
          <span>Hệ Thống Hoạt Động</span>
        </Badge>

        {/* User profile dropdown / info */}
        {currentUser ? (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3 text-xs">
            <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-200">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden lg:block text-left">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <span>{currentUser.username}</span>
                <Badge variant="default" className="text-[10px] py-0 px-1 font-mono">
                  {currentUser.roles?.[0]?.replace('ROLE_', '') || 'USER'}
                </Badge>
              </div>
              <div className="text-[10px] text-slate-500">
                {currentUser.roles?.map(r => r.replace('ROLE_', '')).join(', ')}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors ml-1"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3 text-xs">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/register')}
              className="h-8 text-xs hidden sm:inline-flex"
            >
              Đăng Ký
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => navigate('/login', { state: { from: location.pathname } })}
              className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Đăng Nhập
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
