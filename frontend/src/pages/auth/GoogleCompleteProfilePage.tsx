import React from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { FormField, inputClassName } from '@/components/ui/FormField';
import { authService, getApiErrorCode, getApiErrorMessage } from '@/services/authService';
import { googleProfileSchema, GoogleProfileFormValues } from '@/types/authSchemas';
import type { GoogleProfileState } from '@/hooks/useGoogleAuth';

/** Lần đầu đăng nhập Google: bổ sung thông tin bắt buộc của hồ sơ bệnh nhân. */
export const GoogleCompleteProfilePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const google = location.state as GoogleProfileState | null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GoogleProfileFormValues>({
    resolver: zodResolver(googleProfileSchema),
    defaultValues: { fullName: google?.fullName ?? '', dateOfBirth: '', phone: '' },
  });

  const complete = useMutation({
    mutationFn: (v: GoogleProfileFormValues) =>
      authService.googleRegister({
        credential: google!.credential,
        fullName: v.fullName.trim(),
        dateOfBirth: v.dateOfBirth,
        gender: v.gender,
        phone: v.phone.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      navigate('/', { replace: true });
    },
  });

  if (!google?.credential) {
    return <Navigate to="/register" replace />;
  }

  const tokenExpired = getApiErrorCode(complete.error) === 'AUTH_GOOGLE_TOKEN_INVALID';
  const maxDob = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Hoàn tất hồ sơ bệnh nhân</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Bạn đang đăng ký bằng tài khoản Google <strong className="text-slate-800">{google.email}</strong>. Vui lòng bổ sung một số thông
        tin để phòng khám lập hồ sơ cho bạn.
      </p>

      {complete.isError && (
        <Alert variant="destructive" className="mt-6">
          {tokenExpired
            ? 'Phiên đăng nhập Google đã hết hạn. Vui lòng quay lại và chọn "Tiếp tục với Google" lần nữa.'
            : getApiErrorMessage(complete.error, 'Không hoàn tất được đăng ký. Vui lòng thử lại.')}
        </Alert>
      )}

      <form onSubmit={handleSubmit((v) => complete.mutate(v))} className="mt-6 space-y-4" noValidate>
        <FormField label="Họ và tên" htmlFor="fullName" required error={errors.fullName?.message}>
          <input id="fullName" autoComplete="name" className={inputClassName(!!errors.fullName)} {...register('fullName')} />
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

        <FormField label="Số điện thoại" htmlFor="phone" required error={errors.phone?.message}>
          <input id="phone" type="tel" autoComplete="tel" placeholder="0912345678" className={inputClassName(!!errors.phone)} {...register('phone')} />
        </FormField>

        <div>
          <label className="flex items-start gap-2.5 text-sm text-slate-600">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-teal-600" {...register('acceptTerms')} />
            <span>Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật thông tin y tế của phòng khám.</span>
          </label>
          {errors.acceptTerms && <p className="mt-1 text-xs text-rose-600">{errors.acceptTerms.message}</p>}
        </div>

        <Button type="submit" className="w-full gap-2" isLoading={complete.isPending}>
          {!complete.isPending && <UserPlus className="h-4 w-4" />}
          {complete.isPending ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký'}
        </Button>
      </form>

      <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
        Không phải bạn?{' '}
        <Link to="/register" className="font-semibold text-teal-700 hover:text-teal-800 hover:underline">
          Đăng ký bằng cách khác
        </Link>
      </div>
    </div>
  );
};

export default GoogleCompleteProfilePage;
