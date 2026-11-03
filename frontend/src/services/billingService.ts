import apiClient from '@/lib/axios';
import { ApiResponse, PageResponse } from '@/types/api';
import {
  Invoice,
  ServiceWithPrice,
  BillingSummary,
  CreateInvoicePayload,
  PayInvoicePayload,
  CancelInvoicePayload,
} from '@/types/billing';

export interface InvoiceQueryParams {
  status?: string;
  patientId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  size?: number;
}

export const billingService = {
  getInvoices: async (
    params?: InvoiceQueryParams
  ): Promise<ApiResponse<PageResponse<Invoice>>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<Invoice>>>('/billing/invoices', {
      params,
    });
    return res.data;
  },

  getInvoiceById: async (id: string): Promise<ApiResponse<Invoice>> => {
    const res = await apiClient.get<ApiResponse<Invoice>>(`/billing/invoices/${id}`);
    return res.data;
  },

  getBillingSummary: async (): Promise<ApiResponse<BillingSummary>> => {
    const res = await apiClient.get<ApiResponse<BillingSummary>>('/billing/invoices/summary');
    return res.data;
  },

  getAvailableServices: async (): Promise<ApiResponse<ServiceWithPrice[]>> => {
    const res = await apiClient.get<ApiResponse<ServiceWithPrice[]>>('/billing/invoices/services');
    return res.data;
  },

  createInvoice: async (data: CreateInvoicePayload): Promise<ApiResponse<Invoice>> => {
    const res = await apiClient.post<ApiResponse<Invoice>>('/billing/invoices', data);
    return res.data;
  },

  payInvoice: async (id: string, data: PayInvoicePayload): Promise<ApiResponse<Invoice>> => {
    const res = await apiClient.post<ApiResponse<Invoice>>(`/billing/invoices/${id}/pay`, data);
    return res.data;
  },

  cancelInvoice: async (id: string, data: CancelInvoicePayload): Promise<ApiResponse<Invoice>> => {
    const res = await apiClient.post<ApiResponse<Invoice>>(`/billing/invoices/${id}/cancel`, data);
    return res.data;
  },
};

