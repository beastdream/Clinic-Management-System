import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { MailOpen } from 'lucide-react';
import { ResendVerificationButton } from '@/components/auth/ResendVerificationButton';

/** Hiển thị sau khi đăng ký: hướng dẫn mở email để xác thực. */
export const CheckEmailPage: React.FC = () => {
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;

  if (!email) {
    return <Navigate to="/register" replace />;
  }

  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-200 bg-teal-50 text-teal-700">
        <MailOpen className="h-8 w-8" />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-slate-900">Kiểm tra hộp thư của bạn</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Chúng tôi đã gửi liên kết xác thực tới
        <br />
        <strong className="text-slate-900">{email}</strong>
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate-500">
        Bấm vào liên kết trong email để kích hoạt tài khoản, sau đó đăng nhập. Liên kết có hiệu lực trong 24 giờ.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left text-xs text-slate-600">
        <p className="font-semibold text-slate-700">Không thấy email?</p>
        <ul className="mt-1.5 list-disc space-y-1 pl-4">
          <li>Kiểm tra thư mục Spam hoặc Quảng cáo.</li>
          <li>Đợi 1-2 phút rồi bấm "Gửi lại email xác thực".</li>
          <li>Nếu nhập sai email, hãy đăng ký lại với email đúng.</li>
        </ul>
      </div>

      <ResendVerificationButton email={email} startWithCooldown className="mt-6" />

      <div className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-600">
        Đã xác thực xong?{' '}
        <Link to="/login" className="font-semibold text-teal-700 hover:text-teal-800 hover:underline">
          Đăng nhập
        </Link>
      </div>
    </div>
  );
};

export default CheckEmailPage;
