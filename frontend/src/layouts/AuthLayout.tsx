import React from 'react';
import { Link, Navigate, Outlet } from 'react-router-dom';
import { HeartPulse, ShieldCheck, CalendarCheck, FileText } from 'lucide-react';
import { authService } from '@/services/authService';

const HIGHLIGHTS = [
  { icon: CalendarCheck, text: 'Đặt lịch và theo dõi lịch hẹn khám' },
  { icon: FileText, text: 'Xem lại kết quả khám và hóa đơn viện phí của bạn' },
  { icon: ShieldCheck, text: 'Hồ sơ y tế được bảo mật, chỉ bạn và bác sĩ phụ trách được xem' },
];

interface AuthLayoutProps {
  /** Đã đăng nhập thì chuyển về trang chủ (mặc định). Tắt cho trang xác thực email. */
  redirectIfAuthenticated?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ redirectIfAuthenticated = true }) => {
  // Đã đăng nhập thì không cần vào trang đăng nhập / đăng ký nữa
  if (redirectIfAuthenticated && authService.isAuthenticated() && authService.getCurrentUser()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 p-10 text-white">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-bold leading-tight">MediCare Clinic System</div>
            <div className="text-xs text-teal-100">Hệ Thống Quản Lý Phòng Khám Đa Khoa</div>
          </div>
        </Link>

        <div className="space-y-6">
          <h2 className="text-3xl font-bold leading-snug">
            Chăm sóc sức khỏe
            <br />
            thuận tiện hơn mỗi ngày
          </h2>
          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-teal-50">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-teal-200/80">
          &copy; {new Date().getFullYear()} MediCare Clinic. Dữ liệu trong môi trường demo là dữ liệu giả lập.
        </p>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white">
              <HeartPulse className="h-6 w-6" />
            </div>
            <span className="text-base font-bold text-slate-900">MediCare Clinic System</span>
          </Link>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
