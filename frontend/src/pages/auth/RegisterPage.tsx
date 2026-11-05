import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { FormField, inputClassName } from '@/components/ui/FormField';
import { authService, getApiErrorMessage } from '@/services/authService';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { registerSchema, RegisterFormValues } from '@/types/authSchemas';

const PASSWORD_RULES: { test: (v: string) => boolean; label: string }[] = [
  { test: (v) => v.length >= 8, label: 'Ít nhất 8 ký tự' },
  { test: (v) => /[A-Z]/.test(v) && /[a-z]/.test(v), label: 'Chữ hoa và chữ thường' },
  { test: (v) => /\d/.test(v), label: 'Ít nhất 1 chữ số' },
  { test: (v) => /[^A-Za-z0-9]/.test(v), label: 'Ít nhất 1 ký tự đặc biệt' },
];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      dateOfBirth: '',
      phone: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password') || '';

  const registerMutation = useMutation({
    mutationFn: (v: RegisterFormValues) =>
      authService.register({
        username: v.username.trim(),
        password: v.password,
        fullName: v.fullName.trim(),
        dateOfBirth: v.dateOfBirth,
        gender: v.gender,
        phone: v.phone.trim(),
        email: v.email.trim(),
      }),
    onSuccess: (res) => {
      // Chưa đăng nhập: chuyển sang trang hướng dẫn mở email xác thực
      navigate('/register/check-email', { replace: true, state: { email: res.data.email } });
    },
  });
  const googleMutation = useGoogleAuth('/');

  const maxDob = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Đăng ký tài khoản bệnh nhân</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Tạo tài khoản để đặt lịch khám và xem hồ sơ sức khỏe của bạn. Nhân viên phòng khám vui lòng liên hệ quản trị viên để được cấp tài khoản.
      </p>

      <GoogleSignInButton
        text="signup_with"
        disabled={googleMutation.isPending}
        onCredential={(credential) => {
          registerMutation.reset();
          googleMutation.mutate(credential);
        }}
      />

      {googleMutation.isError && (
        <Alert variant="destructive" className="mt-6">
          {getApiErrorMessage(googleMutation.error, 'Đăng ký bằng Google thất bại. Vui lòng thử lại.')}
        </Alert>
      )}

      {registerMutation.isError && (
        <Alert variant="destructive" className="mt-6">
          {getApiErrorMessage(registerMutation.error, 'Đăng ký thất bại. Vui lòng thử lại.')}
        </Alert>
      )}

      <form onSubmit={handleSubmit((v) => registerMutation.mutate(v))} className="mt-6 space-y-5" noValidate>
        <fieldset className="space-y-4">
          <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-teal-700">Thông tin cá nhân</legend>

          <FormField label="Họ và tên" htmlFor="fullName" required error={errors.fullName?.message}>
            <input id="fullName" autoComplete="name" placeholder="VD: Nguyễn Văn An" className={inputClassName(!!errors.fullName)} {...register('fullName')} />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Ngày sinh" htmlFor="dateOfBirth" required error={errors.dateOfBirth?.message}>
              <input id="dateOfBirth" type="date" max={maxDob} autoComplete="bday" className={inputClassName(!!errors.dateOfBirth)} {...register('dateOfBirth')} />
            </FormField>
            <FormField label="Giới tính" htmlFor="gender" required error={errors.gender?.message}>
              <select id="gender" defaultValue="" className={inputClassName(!!errors.gender)} {...register('gender')}>
                <option value="" disabled>
                  Chọn giới tính
                </option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Số điện thoại" htmlFor="phone" required error={errors.phone?.message}>
              <input id="phone" type="tel" autoComplete="tel" placeholder="0912345678" className={inputClassName(!!errors.phone)} {...register('phone')} />
            </FormField>
            <FormField label="Email" htmlFor="email" required error={errors.email?.message} hint="Dùng để nhận liên kết xác thực tài khoản">
              <input id="email" type="email" autoComplete="email" placeholder="ban@example.com" className={inputClassName(!!errors.email)} {...register('email')} />
            </FormField>
          </div>
        </fieldset>

        <fieldset className="space-y-4 border-t border-slate-200 pt-5">
          <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-teal-700">Thông tin đăng nhập</legend>

          <FormField label="Tên đăng nhập" htmlFor="username" required error={errors.username?.message}>
            <input id="username" autoComplete="username" placeholder="VD: nguyenvanan" className={inputClassName(!!errors.username)} {...register('username')} />
          </FormField>

          <FormField label="Mật khẩu" htmlFor="password" required error={errors.password?.message}>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {PASSWORD_RULES.map((rule) => {
              const ok = rule.test(password);
              return (
                <li key={rule.label} className={ok ? 'text-teal-700' : 'text-slate-500'}>
                  {ok ? '✓' : '•'} {rule.label}
                </li>
              );
            })}
          </ul>

          <FormField label="Nhập lại mật khẩu" htmlFor="confirmPassword" required error={errors.confirmPassword?.message}>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={inputClassName(!!errors.confirmPassword)}
              {...register('confirmPassword')}
            />
          </FormField>
        </fieldset>

        <div>
          <label className="flex items-start gap-2.5 text-sm text-slate-600">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-teal-600" {...register('acceptTerms')} />
            <span>Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật thông tin y tế của phòng khám.</span>
          </label>
          {errors.acceptTerms && <p className="mt-1 text-xs text-rose-600">{errors.acceptTerms.message}</p>}
        </div>

        <Button type="submit" className="w-full gap-2" isLoading={registerMutation.isPending}>
          {!registerMutation.isPending && <UserPlus className="h-4 w-4" />}
          {registerMutation.isPending ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </Button>
      </form>

      <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-semibold text-teal-700 hover:text-teal-800 hover:underline">
          Đăng nhập
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
