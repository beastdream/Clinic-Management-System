import apiClient from '@/lib/axios';
import { ApiResponse } from '@/types/api';
import { HealthCheckData } from '@/types/health';

export const healthService = {
  checkHealth: async (): Promise<ApiResponse<HealthCheckData>> => {
    const response = await apiClient.get<ApiResponse<HealthCheckData>>('/health');
    return response.data;
  },

  ping: async (): Promise<boolean> => {
    try {
      const res = await apiClient.get('/health');
      return res.status === 200;
    } catch {
      return false;
    }
  },
};
