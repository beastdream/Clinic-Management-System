import apiClient from '@/lib/axios';
import { ApiResponse } from '@/types/api';
import { LoginRequest, LoginResponse, User } from '@/types/auth';

export const authService = {
  login: async (request: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', request);
    if (response.data.success && response.data.data.accessToken) {
      localStorage.setItem('access_token', response.data.data.accessToken);
      const user: User = {
        userId: response.data.data.userId,
        username: response.data.data.username,
        email: response.data.data.email,
        roles: response.data.data.roles,
        permissions: response.data.data.permissions,
        staff: response.data.data.staff,
      };
      localStorage.setItem('user_info', JSON.stringify(user));
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
