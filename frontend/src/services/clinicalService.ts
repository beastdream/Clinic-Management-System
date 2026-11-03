import apiClient from '@/lib/axios';
import { ApiResponse, PageResponse } from '@/types/api';
import { DoctorQueueItem, Encounter, CreateEncounterData, UpdateEncounterData } from '@/types/clinical';

export interface EncounterQueryParams {
  patientId?: string;
  status?: string;
  search?: string;
  page?: number;
  size?: number;
}

export const clinicalService = {
  getDoctorQueue: async (): Promise<ApiResponse<DoctorQueueItem[]>> => {
    const res = await apiClient.get<ApiResponse<DoctorQueueItem[]>>('/clinical/encounters/doctor-queue');
    return res.data;
  },

  startEncounterFromAppointment: async (appointmentId: string): Promise<ApiResponse<Encounter>> => {
    const res = await apiClient.post<ApiResponse<Encounter>>(`/clinical/encounters/start-from-appointment/${appointmentId}`);
    return res.data;
  },

  createEncounter: async (data: CreateEncounterData): Promise<ApiResponse<Encounter>> => {
    const res = await apiClient.post<ApiResponse<Encounter>>('/clinical/encounters', data);
    return res.data;
  },

  updateEncounter: async (id: string, data: UpdateEncounterData): Promise<ApiResponse<Encounter>> => {
    const res = await apiClient.put<ApiResponse<Encounter>>(`/clinical/encounters/${id}`, data);
    return res.data;
  },

  completeEncounter: async (id: string): Promise<ApiResponse<Encounter>> => {
    const res = await apiClient.post<ApiResponse<Encounter>>(`/clinical/encounters/${id}/complete`);
    return res.data;
  },

  getEncounterById: async (id: string): Promise<ApiResponse<Encounter>> => {
    const res = await apiClient.get<ApiResponse<Encounter>>(`/clinical/encounters/${id}`);
    return res.data;
  },

  getPatientHistory: async (patientId: string): Promise<ApiResponse<Encounter[]>> => {
    const res = await apiClient.get<ApiResponse<Encounter[]>>(`/clinical/encounters/patient/${patientId}`);
    return res.data;
  },

  searchEncounters: async (params?: EncounterQueryParams): Promise<ApiResponse<PageResponse<Encounter>>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<Encounter>>>('/clinical/encounters', { params });
    return res.data;
  },
};

