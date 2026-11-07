import apiClient from '@/lib/axios';
import { ApiResponse, PageResponse } from '@/types/api';
import {
  DoctorQueueItem,
  Encounter,
  CreateEncounterData,
  UpdateEncounterData,
  Icd10Disease,
  Prescription,
  CreatePrescriptionPayload,
  AllergyAlert,
  ServiceOrder,
  CreateServiceOrderPayload,
  UpdateServiceOrderResultPayload,
  PatientEmrTimeline
} from '@/types/clinical';

export interface EncounterQueryParams {
  patientId?: string;
  status?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface AvailableMedicine {
  id: string;
  code: string;
  name: string;
  genericName: string;
  unit: string;
  unitPrice: number;
  currentStock: number;
}

export interface AvailableServiceItem {
  id: string;
  code: string;
  name: string;
  serviceType: string;
  description?: string;
}

export const clinicalService = {
  // ==================== ENCOUNTERS CORE ====================
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

  // ==================== 1. ICD-10 CODES ====================
  searchIcd10: async (keyword?: string): Promise<ApiResponse<Icd10Disease[]>> => {
    const res = await apiClient.get<ApiResponse<Icd10Disease[]>>('/clinical/icd10', {
      params: { keyword: keyword || undefined },
    });
    return res.data;
  },

  // ==================== 2. E-PRESCRIPTIONS ====================
  getPrescriptionByEncounter: async (encounterId: string): Promise<ApiResponse<Prescription | null>> => {
    const res = await apiClient.get<ApiResponse<Prescription | null>>(`/clinical/prescriptions/encounter/${encounterId}`);
    return res.data;
  },

  savePrescription: async (payload: CreatePrescriptionPayload): Promise<ApiResponse<Prescription>> => {
    const res = await apiClient.post<ApiResponse<Prescription>>('/clinical/prescriptions', payload);
    return res.data;
  },

  getPastPrescriptions: async (patientId: string): Promise<ApiResponse<Prescription[]>> => {
    const res = await apiClient.get<ApiResponse<Prescription[]>>(`/clinical/prescriptions/patient/${patientId}/past`);
    return res.data;
  },

  checkAllergy: async (patientId: string, medicineIds: string[]): Promise<ApiResponse<AllergyAlert>> => {
    const res = await apiClient.post<ApiResponse<AllergyAlert>>('/clinical/prescriptions/check-allergy', medicineIds, {
      params: { patientId },
    });
    return res.data;
  },

  getActiveMedicines: async (): Promise<ApiResponse<AvailableMedicine[]>> => {
    const res = await apiClient.get<ApiResponse<AvailableMedicine[]>>('/medicines');
    return res.data;
  },

  // ==================== 3. SERVICE ORDERS (CHỈ ĐỊNH CLS) ====================
  getServiceOrdersByEncounter: async (encounterId: string): Promise<ApiResponse<ServiceOrder[]>> => {
    const res = await apiClient.get<ApiResponse<ServiceOrder[]>>(`/clinical/service-orders/encounter/${encounterId}`);
    return res.data;
  },

  createServiceOrder: async (payload: CreateServiceOrderPayload): Promise<ApiResponse<ServiceOrder>> => {
    const res = await apiClient.post<ApiResponse<ServiceOrder>>('/clinical/service-orders', payload);
    return res.data;
  },

  updateServiceOrderResult: async (
    orderId: string,
    payload: UpdateServiceOrderResultPayload
  ): Promise<ApiResponse<ServiceOrder>> => {
    const res = await apiClient.put<ApiResponse<ServiceOrder>>(`/clinical/service-orders/${orderId}/results`, payload);
    return res.data;
  },

  deleteServiceOrder: async (orderId: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<ApiResponse<void>>(`/clinical/service-orders/${orderId}`);
    return res.data;
  },

  getActiveServices: async (): Promise<ApiResponse<AvailableServiceItem[]>> => {
    const res = await apiClient.get<ApiResponse<AvailableServiceItem[]>>('/services');
    return res.data;
  },

  // ==================== 4. LONGITUDINAL EMR TIMELINE ====================
  getPatientEmrTimeline: async (patientId: string): Promise<ApiResponse<PatientEmrTimeline>> => {
    const res = await apiClient.get<ApiResponse<PatientEmrTimeline>>(`/clinical/emr/patients/${patientId}`);
    return res.data;
  },
};
