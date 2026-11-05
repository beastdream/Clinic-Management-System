import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authService } from '@/services/authService';
import { ShieldAlert, ArrowLeft, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  deniedMessage?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  deniedMessage,
}) => {
  const location = useLocation();
  const currentUser = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();

  // If not authenticated, still allow demo viewing or redirect
  if (!isAuthenticated || !currentUser) {
    // User is visiting as guest; if route has restricted roles, show role access prompt
    if (allowedRoles && allowedRoles.length > 0) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-4 shadow-sm">
            <KeyRound className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Yêu Cầu Xác Thực Tài Khoản</h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Bạn cần đăng nhập với vai trò phù hợp ({allowedRoles.map(r => r.replace('ROLE_', '')).join(', ')}) để truy cập chức năng này.
          </p>
          <div className="mt-6 flex gap-3">
            <Link to="/login" state={{ from: location.pathname }}>
              <Button size="sm" className="gap-2">
                <KeyRound className="h-4 w-4" />
                Đăng nhập
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Về Bảng Điều Khiển
              </Button>
            </Link>
          </div>
        </div>
      );
    }
    return <>{children}</>;
  }

  // Check roles
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = currentUser.roles || [];
    const hasPermission = userRoles.some((role) =>
      allowedRoles.some(
        (allowed) =>
          role.toUpperCase() === allowed.toUpperCase() ||
          `ROLE_${role.toUpperCase()}` === allowed.toUpperCase() ||
          role.toUpperCase() === `ROLE_${allowed.toUpperCase()}`
      )
    );

    if (!hasPermission) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 mb-4 shadow-sm">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">403 - Quyền Truy Cập Bị Hạn Chế</h2>
          <p className="mt-2 max-w-lg text-sm text-slate-600">
            {deniedMessage ||
              `Tài khoản "${currentUser.username}" (vai trò: ${currentUser.roles?.join(', ')}) không có quyền truy cập vào phân hệ này. Chỉ các vai trò [${allowedRoles
                .map((r) => r.replace('ROLE_', ''))
                .join(', ')}] mới được phép thao tác.`}
          </p>
          <div className="mt-3 text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full inline-block font-mono">
            Hệ thống tuân thủ nguyên tắc Bảo mật Đa tầng (Defense-in-Depth) & Quyền riêng tư Hồ sơ Bệnh án
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Về Trang Chủ / Dashboard
              </Button>
            </Link>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
