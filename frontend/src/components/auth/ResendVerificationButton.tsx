import React, { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MailCheck, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { authService, getApiErrorMessage } from '@/services/authService';

const COOLDOWN_SECONDS = 60;

interface ResendVerificationButtonProps {
  email: string;
  /** Bắt đầu đếm ngược ngay (VD: vừa đăng ký xong, email vừa được gửi). */
  startWithCooldown?: boolean;
  variant?: 'outline' | 'default' | 'link';
  className?: string;
}

export const ResendVerificationButton: React.FC<ResendVerificationButtonProps> = ({
  email,
  startWithCooldown = false,
  variant = 'outline',
  className,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(startWithCooldown ? COOLDOWN_SECONDS : 0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const resend = useMutation({
    mutationFn: () => authService.resendVerification(email),
    onSuccess: () => setSecondsLeft(COOLDOWN_SECONDS),
  });

  return (
    <div className={className}>
      <Button
        type="button"
        variant={variant}
        className="w-full gap-2"
        disabled={secondsLeft > 0 || !email}
        isLoading={resend.isPending}
        onClick={() => resend.mutate()}
      >
        {!resend.isPending && <RotateCw className="h-4 w-4" />}
        {secondsLeft > 0 ? `Gửi lại email sau ${secondsLeft}s` : 'Gửi lại email xác thực'}
      </Button>
      {resend.isSuccess && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-teal-700">
          <MailCheck className="h-3.5 w-3.5" />
          Đã gửi lại. Vui lòng kiểm tra cả hộp thư Spam/Quảng cáo.
        </p>
      )}
      {resend.isError && (
        <p className="mt-2 text-center text-xs text-rose-600">
          {getApiErrorMessage(resend.error, 'Không gửi lại được email, vui lòng thử lại sau.')}
        </p>
      )}
    </div>
  );
};
