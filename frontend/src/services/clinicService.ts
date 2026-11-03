import apiClient from '@/lib/axios';
import { ApiResponse } from '@/types/api';

export interface SpecialtyItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface DoctorItem {
  id: string;
  staffCode: string;
  fullName: string;
  gender: string;
  phone: string;
  qualification?: string;
  licenseNumber?: string;
  status?: string;
  specialtyId?: string;
  specialtyName?: string;
  specialtyCode?: string;
  roomId?: string;
  roomName?: string;
}

export interface RoomItem {
  id: string;
  code: string;
  name: string;
  roomType: string;
  active: boolean;
}

export interface MedicineItem {
  id: string;
  code: string;
  name: string;
  genericName: string;
  registrationNumber?: string;
  unit: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  prescriptionRequired: boolean;
  active: boolean;
}

export const clinicService = {
  getSpecialties: async (): Promise<ApiResponse<SpecialtyItem[]>> => {
    const res = await apiClient.get<ApiResponse<SpecialtyItem[]>>('/specialties');
    return res.data;
  },

  getRooms: async (): Promise<ApiResponse<RoomItem[]>> => {
    const res = await apiClient.get<ApiResponse<RoomItem[]>>('/rooms');
    return res.data;
  },

  getDoctors: async (specialtyId?: string, search?: string): Promise<ApiResponse<DoctorItem[]>> => {
    const res = await apiClient.get<ApiResponse<DoctorItem[]>>('/doctors', {
      params: {
        ...(specialtyId && specialtyId.trim() ? { specialtyId: specialtyId.trim() } : {}),
        ...(search && search.trim() ? { search: search.trim() } : {}),
      },
    });
    return res.data;
  },

  getMedicines: async (): Promise<ApiResponse<MedicineItem[]>> => {
    const res = await apiClient.get<ApiResponse<MedicineItem[]>>('/medicines');
    return res.data;
  },
};
