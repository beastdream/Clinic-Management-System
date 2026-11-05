import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { FormField, inputClassName } from '@/components/ui/FormField';
import { authService, getApiErrorCode, getApiErrorMessage } from '@/services/authService';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { ResendVerificationButton } from '@/components/auth/ResendVerificationButton';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { loginSchema, LoginFormValues } from '@/types/authSchemas';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = (location.state as { from?: string } | null)?.from || '/';

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) => authService.login(values),
    onSuccess: () => {
      queryClient.invalidateQueries();
      navigate(redirectTo, { replace: true });
    },
  });
  const googleMutation = useGoogleAuth(redirectTo);

  const loginIdentifier = getValues('username')?.trim() ?? '';
  const emailNotVerified = getApiErrorCode(loginMutation.error) === 'AUTH_EMAIL_NOT_VERIFIED';

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Đăng nhập</h1>
      <p className="mt-1.5 text-sm text-slate-500">Dành cho nhân viên phòng khám và bệnh nhân đã có tài khoản.</p>

      <GoogleSignInButton
        text="signin_with"
        disabled={googleMutation.isPending}
        onCredential={(credential) => {
          loginMutation.reset();
          googleMutation.mutate(credential);
        }}
      />

      {googleMutation.isError && (
        <Alert variant="destructive" className="mt-6">
          {getApiErrorMessage(googleMutation.error, 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.')}
        </Alert>
      )}

      {loginMutation.isError && (
        <Alert variant={emailNotVerified ? 'warning' : 'destructive'} className="mt-6">
          {getApiErrorMessage(loginMutation.error, 'Đăng nhập thất bại. Vui lòng thử lại.')}
          {emailNotVerified && loginIdentifier.includes('@') && (
            <ResendVerificationButton email={loginIdentifier} variant="outline" className="mt-3" />
          )}
          {emailNotVerified && !loginIdentifier.includes('@') && (
            <p className="mt-2 text-xs">
              Không tìm thấy email?{' '}
              <Link to="/verify-email" className="font-semibold underline">
                Yêu cầu gửi lại liên kết xác thực
              </Link>
            </p>
          )}
        </Alert>
      )}

      <form
        onSubmit={handleSubmit((v) => {
          googleMutation.reset();
          loginMutation.mutate(v);
        })}
        className="mt-6 space-y-4"
        noValidate
      >
        <FormField label="Tên đăng nhập hoặc email" htmlFor="username" error={errors.username?.message}>
          <input
            id="username"
            type="text"
            autoComplete="username"
            autoFocus
            placeholder="VD: benhnhan_an"
            aria-invalid={!!errors.username}
            className={inputClassName(!!errors.username)}
            {...register('username')}
          />
        </FormField>

        <FormField label="Mật khẩu" htmlFor="password" error={errors.password?.message}>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              aria-invalid={!!errors.password}
              className={inputClassName(!!errors.password) + ' pr-10'}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        <Button type="submit" className="w-full gap-2" isLoading={loginMutation.isPending}>
          {!loginMutation.isPending && <LogIn className="h-4 w-4" />}
          {loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>

      <p className="mt-4 text-xs text-slate-500">
        Tài khoản sẽ bị tạm khóa 15 phút nếu nhập sai mật khẩu 5 lần liên tiếp.
      </p>

      <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
        Bạn là bệnh nhân và chưa có tài khoản?{' '}
        <Link to="/register" state={location.state} className="font-semibold text-teal-700 hover:text-teal-800 hover:underline">
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
