import apiClient from '@/lib/axios';
import { ApiResponse } from '@/types/api';
import { DashboardStats } from '@/types/dashboard';

export const dashboardService = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const res = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return res.data;
  },
};

