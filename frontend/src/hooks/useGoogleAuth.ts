import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';

export interface GoogleProfileState {
  credential: string;
  email: string;
  fullName: string | null;
}

/**
 * Xử lý credential Google: đã có tài khoản -> vào hệ thống; chưa có -> sang trang bổ sung hồ sơ.
 * Credential chỉ truyền qua state điều hướng (không đưa lên URL).
 */
export const useGoogleAuth = (redirectTo = '/') => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credential: string) => ({ credential, result: await authService.googleLogin(credential) }),
    onSuccess: ({ credential, result }) => {
      if (result.profileRequired) {
        const state: GoogleProfileState = { credential, email: result.email, fullName: result.fullName };
        navigate('/register/google', { state });
        return;
      }
      queryClient.invalidateQueries();
      navigate(redirectTo, { replace: true });
    },
  });
};
