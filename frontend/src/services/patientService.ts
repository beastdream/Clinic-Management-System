import apiClient from '@/lib/axios';
import { ApiResponse, PageResponse } from '@/types/api';

export interface PatientItem {
  id: string;
  patientCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: string; // NAM, NU, KHAC or MALE, FEMALE, OTHER
  phone: string;
  identityCardNo?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: string;
  allergies?: string;
  medicalHistorySummary?: string;
  status: string;
  createdAt: string;
}

export interface CreatePatientInput {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  identityCardNo?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: string;
  allergies?: string;
  medicalHistorySummary?: string;
}

export interface UpdatePatientInput {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  identityCardNo?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: string;
  allergies?: string;
  medicalHistorySummary?: string;
  status?: string;
}

export const patientService = {
  getTopPatients: async (search?: string): Promise<ApiResponse<PatientItem[]>> => {
    const res = await apiClient.get<ApiResponse<PatientItem[]>>('/patients/top', {
      params: search ? { search } : undefined,
    });
    return res.data;
  },

  getPatients: async (
    page = 0,
    size = 10,
    search?: string
  ): Promise<ApiResponse<PageResponse<PatientItem>>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<PatientItem>>>('/patients', {
      params: {
        page,
        size,
        ...(search && search.trim() ? { search: search.trim() } : {}),
      },
    });
    return res.data;
  },

  createPatient: async (data: CreatePatientInput): Promise<ApiResponse<PatientItem>> => {
    const res = await apiClient.post<ApiResponse<PatientItem>>('/patients', data);
    return res.data;
  },

  updatePatient: async (id: string, data: UpdatePatientInput): Promise<ApiResponse<PatientItem>> => {
    const res = await apiClient.put<ApiResponse<PatientItem>>(`/patients/${id}`, data);
    return res.data;
  },

  deletePatient: async (id: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<ApiResponse<void>>(`/patients/${id}`);
    return res.data;
  },

  getPatientById: async (id: string): Promise<ApiResponse<PatientItem>> => {
    const res = await apiClient.get<ApiResponse<PatientItem>>(`/patients/${id}`);
    return res.data;
  },
};
