import apiClient from '@/lib/axios';
import { ApiResponse, PageResponse } from '@/types/api';

export interface AppointmentItem {
  id: string;
  appointmentCode: string;
  patientId: string;
  patientName?: string;
  patientPhone?: string;
  doctorId?: string;
  doctorName?: string;
  specialtyId: string;
  specialtyName?: string;
  roomId?: string;
  roomName?: string;
  appointmentDate: string;
  appointmentTime: string;
  shift: string;
  reason?: string;
  appointmentType: string;
  status: string; // PENDING, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED
  cancellationReason?: string;
  createdAt: string;
}

export interface CreateAppointmentInput {
  patientId: string;
  doctorId?: string;
  specialtyId: string;
  roomId?: string;
  appointmentDate: string;
  appointmentTime: string;
  shift?: string;
  reason?: string;
  appointmentType?: string;
}

export interface AppointmentQueryParams {
  status?: string;
  date?: string;
  doctorId?: string;
  patientId?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: string;
}

export const appointmentService = {
  getRecentAppointments: async (): Promise<ApiResponse<AppointmentItem[]>> => {
    const res = await apiClient.get<ApiResponse<AppointmentItem[]>>('/appointments/recent');
    return res.data;
  },

  getAppointments: async (
    params?: AppointmentQueryParams
  ): Promise<ApiResponse<PageResponse<AppointmentItem>>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<AppointmentItem>>>('/appointments', {
      params,
    });
    return res.data;
  },

  getAppointmentById: async (id: string): Promise<ApiResponse<AppointmentItem>> => {
    const res = await apiClient.get<ApiResponse<AppointmentItem>>(`/appointments/${id}`);
    return res.data;
  },

  createAppointment: async (data: CreateAppointmentInput): Promise<ApiResponse<AppointmentItem>> => {
    const res = await apiClient.post<ApiResponse<AppointmentItem>>('/appointments', data);
    return res.data;
  },

  checkInAppointment: async (id: string): Promise<ApiResponse<AppointmentItem>> => {
    const res = await apiClient.patch<ApiResponse<AppointmentItem>>(`/appointments/${id}/check-in`);
    return res.data;
  },

  completeAppointment: async (id: string): Promise<ApiResponse<AppointmentItem>> => {
    const res = await apiClient.patch<ApiResponse<AppointmentItem>>(`/appointments/${id}/complete`);
    return res.data;
  },

  cancelAppointment: async (id: string, cancellationReason?: string): Promise<ApiResponse<AppointmentItem>> => {
    const res = await apiClient.patch<ApiResponse<AppointmentItem>>(`/appointments/${id}/cancel`, {
      cancellationReason,
    });
    return res.data;
  },
};
