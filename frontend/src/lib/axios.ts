import axios, { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error formatting
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      if (status === 401) {
        // Clear token if unauthorized
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
      }
      return Promise.reject(data || new Error(`Lỗi máy chủ (${status})`));
    } else if (error.request) {
      // Request made but no response received (Backend down or network error)
      return Promise.reject(
        new Error('Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra cổng 8080.')
      );
    } else {
      return Promise.reject(error);
    }
  }
);

export default apiClient;
