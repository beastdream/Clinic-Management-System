export interface InvoiceItem {
  id?: string;
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface PaymentItem {
  id: string;
  paymentCode: string;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  transactionReference?: string;
  cashierId?: string;
  cashierName?: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceCode: string;
  patientId: string;
  patientCode?: string;
  patientName?: string;
  patientPhone?: string;
  patientGender?: string;
  patientDateOfBirth?: string;
  patientAddress?: string;
  encounterId?: string;
  encounterCode?: string;
  appointmentId?: string;
  appointmentCode?: string;
  totalAmount: number;
  paidAmount: number;
  status: 'UNPAID' | 'PAID' | 'CANCELLED';
  paymentMethod?: 'CASH' | 'BANK_TRANSFER';
  paidAt?: string;
  cashierId?: string;
  cashierName?: string;
  notes?: string;
  cancellationReason?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItem[];
  payments: PaymentItem[];
}

export interface ServiceWithPrice {
  id: string;
  code: string;
  name: string;
  serviceType: string;
  price: number;
  description?: string;
}

export interface BillingSummary {
  totalPaidRevenue: number;
  totalUnpaidAmount: number;
  totalInvoices: number;
  paidInvoicesCount: number;
  unpaidInvoicesCount: number;
  cancelledInvoicesCount: number;
}

export interface CreateInvoicePayload {
  patientId: string;
  encounterId?: string;
  appointmentId?: string;
  notes?: string;
  items: {
    serviceId: string;
    quantity: number;
  }[];
}

export interface PayInvoicePayload {
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  transactionReference?: string;
  notes?: string;
}

export interface CancelInvoicePayload {
  cancellationReason: string;
}

