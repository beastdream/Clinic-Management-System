import React, { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheckBig, CircleX, Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField, inputClassName } from '@/components/ui/FormField';
import { authService, getApiErrorMessage } from '@/services/authService';
import { resendEmailSchema, ResendEmailFormValues } from '@/types/authSchemas';

/** Trang mở từ liên kết trong email: /verify-email?token=... */
export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const startedRef = useRef(false);

  const verify = useMutation({ mutationFn: (t: string) => authService.verifyEmail(t) });

  useEffect(() => {
    // Chỉ gọi một lần (React StrictMode chạy effect 2 lần ở môi trường dev)
    if (token && !startedRef.current) {
      startedRef.current = true;
      verify.mutate(token);
    }
  }, [token, verify]);

  const resend = useMutation({ mutationFn: (email: string) => authService.resendVerification(email) });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResendEmailFormValues>({ resolver: zodResolver(resendEmailSchema), defaultValues: { email: '' } });

  if (token && (verify.isPending || verify.isIdle)) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
        <p className="mt-4 text-sm text-slate-600">Đang xác thực email của bạn...</p>
      </div>
    );
  }

  if (verify.isSuccess) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600">
          <CircleCheckBig className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Xác thực email thành công</h1>
        <p className="mt-3 text-sm text-slate-600">
          Email <strong className="text-slate-900">{verify.data.data.email}</strong> đã được xác thực. Bạn có thể đăng nhập ngay bây giờ.
        </p>
        <Link to="/login" className="mt-6 block">
          <Button className="w-full gap-2">
            <LogIn className="h-4 w-4" />
            Đăng nhập
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {token ? (
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
            <CircleX className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">Không thể xác thực email</h1>
          <p className="mt-3 text-sm text-slate-600">
            {getApiErrorMessage(verify.error, 'Không xác thực được email. Vui lòng thử lại.')}
          </p>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Xác thực email</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Nhập email bạn đã dùng để đăng ký, chúng tôi sẽ gửi lại liên kết xác thực tài khoản.
          </p>
        </div>
      )}

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-800">Nhận liên kết xác thực mới</h2>
        {resend.isSuccess ? (
          <p className="mt-2 text-sm text-teal-700">
            Nếu email đã đăng ký và chưa được xác thực, chúng tôi đã gửi liên kết mới. Vui lòng kiểm tra hộp thư (kể cả Spam).
          </p>
        ) : (
          <form onSubmit={handleSubmit((v) => resend.mutate(v.email))} className="mt-3 space-y-3" noValidate>
            <FormField label="Email đã đăng ký" htmlFor="email" error={errors.email?.message}>
              <input id="email" type="email" autoComplete="email" className={inputClassName(!!errors.email)} {...register('email')} />
            </FormField>
            {resend.isError && (
              <p className="text-xs text-rose-600">{getApiErrorMessage(resend.error, 'Không gửi được email, vui lòng thử lại.')}</p>
            )}
            <Button type="submit" variant="outline" className="w-full" isLoading={resend.isPending}>
              Gửi lại email xác thực
            </Button>
          </form>
        )}
      </div>

      <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
        <Link to="/login" className="font-semibold text-teal-700 hover:text-teal-800 hover:underline">
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
