import apiClient from '@/lib/axios';
import { ApiResponse } from '@/types/api';
import {
  AuthProviders,
  GoogleAuthResult,
  GoogleRegisterRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegistrationResult,
  User,
} from '@/types/auth';

const saveSession = (data: LoginResponse) => {
  localStorage.setItem('access_token', data.accessToken);
  const user: User = {
    userId: data.userId,
    username: data.username,
    email: data.email,
    roles: data.roles,
    permissions: data.permissions,
    staff: data.staff,
  };
  localStorage.setItem('user_info', JSON.stringify(user));
};

export const authService = {
  login: async (request: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', request);
    if (response.data.success && response.data.data.accessToken) {
      saveSession(response.data.data);
    }
    return response.data;
  },

  /** Đăng ký bằng mật khẩu: chưa đăng nhập ngay, phải xác thực email trước. */
  register: async (request: RegisterRequest): Promise<ApiResponse<RegistrationResult>> => {
    const response = await apiClient.post<ApiResponse<RegistrationResult>>('/auth/register', request);
    return response.data;
  },

  verifyEmail: async (token: string): Promise<ApiResponse<{ email: string }>> => {
    const response = await apiClient.post<ApiResponse<{ email: string }>>('/auth/verify-email', { token });
    return response.data;
  },

  resendVerification: async (email: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.post<ApiResponse<null>>('/auth/resend-verification', { email });
    return response.data;
  },

  getProviders: async (): Promise<AuthProviders> => {
    const response = await apiClient.get<ApiResponse<AuthProviders>>('/auth/providers');
    return response.data.data;
  },

  /** Đăng nhập Google: nếu đã có tài khoản thì lưu phiên; nếu chưa thì trả về profileRequired. */
  googleLogin: async (credential: string): Promise<GoogleAuthResult> => {
    const response = await apiClient.post<ApiResponse<GoogleAuthResult>>('/auth/google', { credential });
    const result = response.data.data;
    if (!result.profileRequired && result.auth?.accessToken) {
      saveSession(result.auth);
    }
    return result;
  },

  googleRegister: async (request: GoogleRegisterRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/google/register', request);
    if (response.data.success && response.data.data.accessToken) {
      saveSession(response.data.data);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user_info');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },
};

/** Lấy thông báo lỗi tiếng Việt từ lỗi API (ApiResponse lỗi, lỗi validation hoặc lỗi mạng). */
export const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object') {
    const e = err as { message?: string; details?: unknown };
    if (Array.isArray(e.details) && e.details.length > 0) {
      const first = e.details[0] as { issue?: string; message?: string };
      if (first?.issue || first?.message) return (first.issue || first.message) as string;
    }
    if (e.message) return e.message;
  }
  return fallback;
};

/** Mã lỗi nghiệp vụ từ backend (VD: AUTH_EMAIL_NOT_VERIFIED). */
export const getApiErrorCode = (err: unknown): string | undefined => {
  if (err && typeof err === 'object' && 'code' in err) {
    return String((err as { code?: string }).code);
  }
  return undefined;
};
