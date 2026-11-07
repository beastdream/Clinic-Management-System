import apiClient from '@/lib/axios';
import { ApiResponse } from '@/types/api';
import {
  SystemSettings,
  UpdateSystemSettingsPayload,
  AdminUser,
  UpdateUserStatusPayload,
  ResetPasswordPayload,
  Specialty,
  CreateSpecialtyPayload,
  UpdateSpecialtyPayload,
  RoomItem,
  CreateRoomPayload,
  UpdateRoomPayload,
  AdminServiceItem,
  CreateServiceItemPayload,
  UpdateServiceItemPayload,
  AdminStaff,
  CreateStaffPayload,
  UpdateStaffPayload,
  AdminAuditLog,
  AdminReportSummary,
  SpecialtyReport,
  DoctorWorkload,
} from '@/types/admin';

export const adminService = {
  // ==================== SYSTEM SETTINGS & USERS ====================
  getSettings: async (): Promise<ApiResponse<SystemSettings>> => {
    const res = await apiClient.get<ApiResponse<SystemSettings>>('/admin/settings');
    return res.data;
  },

  updateSettings: async (payload: UpdateSystemSettingsPayload): Promise<ApiResponse<SystemSettings>> => {
    const res = await apiClient.put<ApiResponse<SystemSettings>>('/admin/settings', payload);
    return res.data;
  },

  getUsers: async (params?: { search?: string; status?: string; role?: string }): Promise<ApiResponse<AdminUser[]>> => {
    const res = await apiClient.get<ApiResponse<AdminUser[]>>('/admin/users', { params });
    return res.data;
  },

  unlockUser: async (userId: string): Promise<ApiResponse<AdminUser>> => {
    const res = await apiClient.post<ApiResponse<AdminUser>>(`/admin/users/${userId}/unlock`);
    return res.data;
  },

  updateUserStatus: async (userId: string, payload: UpdateUserStatusPayload): Promise<ApiResponse<AdminUser>> => {
    const res = await apiClient.put<ApiResponse<AdminUser>>(`/admin/users/${userId}/status`, payload);
    return res.data;
  },

  resetUserPassword: async (userId: string, payload: ResetPasswordPayload): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>(`/admin/users/${userId}/reset-password`, payload);
    return res.data;
  },

  // ==================== 1. MASTER DATA MANAGEMENT ====================
  getAllSpecialties: async (): Promise<ApiResponse<Specialty[]>> => {
    const res = await apiClient.get<ApiResponse<Specialty[]>>('/admin/master/specialties');
    return res.data;
  },

  createSpecialty: async (payload: CreateSpecialtyPayload): Promise<ApiResponse<Specialty>> => {
    const res = await apiClient.post<ApiResponse<Specialty>>('/admin/master/specialties', payload);
    return res.data;
  },

  updateSpecialty: async (id: string, payload: UpdateSpecialtyPayload): Promise<ApiResponse<Specialty>> => {
    const res = await apiClient.put<ApiResponse<Specialty>>(`/admin/master/specialties/${id}`, payload);
    return res.data;
  },

  toggleSpecialty: async (id: string): Promise<ApiResponse<Specialty>> => {
    const res = await apiClient.put<ApiResponse<Specialty>>(`/admin/master/specialties/${id}/toggle`);
    return res.data;
  },

  getAllRooms: async (): Promise<ApiResponse<RoomItem[]>> => {
    const res = await apiClient.get<ApiResponse<RoomItem[]>>('/admin/master/rooms');
    return res.data;
  },

  createRoom: async (payload: CreateRoomPayload): Promise<ApiResponse<RoomItem>> => {
    const res = await apiClient.post<ApiResponse<RoomItem>>('/admin/master/rooms', payload);
    return res.data;
  },

  updateRoom: async (id: string, payload: UpdateRoomPayload): Promise<ApiResponse<RoomItem>> => {
    const res = await apiClient.put<ApiResponse<RoomItem>>(`/admin/master/rooms/${id}`, payload);
    return res.data;
  },

  toggleRoom: async (id: string): Promise<ApiResponse<RoomItem>> => {
    const res = await apiClient.put<ApiResponse<RoomItem>>(`/admin/master/rooms/${id}/toggle`);
    return res.data;
  },

  getAllServices: async (): Promise<ApiResponse<AdminServiceItem[]>> => {
    const res = await apiClient.get<ApiResponse<AdminServiceItem[]>>('/admin/master/services');
    return res.data;
  },

  createService: async (payload: CreateServiceItemPayload): Promise<ApiResponse<AdminServiceItem>> => {
    const res = await apiClient.post<ApiResponse<AdminServiceItem>>('/admin/master/services', payload);
    return res.data;
  },

  updateService: async (id: string, payload: UpdateServiceItemPayload): Promise<ApiResponse<AdminServiceItem>> => {
    const res = await apiClient.put<ApiResponse<AdminServiceItem>>(`/admin/master/services/${id}`, payload);
    return res.data;
  },

  // ==================== 2. STAFF & ROLE MANAGEMENT ====================
  getAllStaff: async (): Promise<ApiResponse<AdminStaff[]>> => {
    const res = await apiClient.get<ApiResponse<AdminStaff[]>>('/admin/staff');
    return res.data;
  },

  createStaff: async (payload: CreateStaffPayload): Promise<ApiResponse<AdminStaff>> => {
    const res = await apiClient.post<ApiResponse<AdminStaff>>('/admin/staff', payload);
    return res.data;
  },

  updateStaff: async (id: string, payload: UpdateStaffPayload): Promise<ApiResponse<AdminStaff>> => {
    const res = await apiClient.put<ApiResponse<AdminStaff>>(`/admin/staff/${id}`, payload);
    return res.data;
  },

  updateStaffStatus: async (id: string, status: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.put<ApiResponse<void>>(`/admin/staff/${id}/status`, null, {
      params: { status },
    });
    return res.data;
  },

  // ==================== 3. AUDIT LOGS ====================
  getAuditLogs: async (params?: { action?: string; search?: string; limit?: number }): Promise<ApiResponse<AdminAuditLog[]>> => {
    const res = await apiClient.get<ApiResponse<AdminAuditLog[]>>('/admin/audit-logs', { params });
    return res.data;
  },

  getAuditLogById: async (id: string): Promise<ApiResponse<AdminAuditLog>> => {
    const res = await apiClient.get<ApiResponse<AdminAuditLog>>(`/admin/audit-logs/${id}`);
    return res.data;
  },

  // ==================== 4. EXECUTIVE REPORTS ====================
  getReportSummary: async (): Promise<ApiResponse<AdminReportSummary>> => {
    const res = await apiClient.get<ApiResponse<AdminReportSummary>>('/admin/reports/summary');
    return res.data;
  },

  getSpecialtyReports: async (): Promise<ApiResponse<SpecialtyReport[]>> => {
    const res = await apiClient.get<ApiResponse<SpecialtyReport[]>>('/admin/reports/specialty-stats');
    return res.data;
  },

  getDoctorWorkloadReports: async (): Promise<ApiResponse<DoctorWorkload[]>> => {
    const res = await apiClient.get<ApiResponse<DoctorWorkload[]>>('/admin/reports/doctor-workload');
    return res.data;
  },
};
