export interface VitalSigns {
  temperature?: number;
  bloodPressure?: string;
  heartRate?: number;
  respiratoryRate?: number;
  weight?: number;
  height?: number;
}

export interface DoctorQueueItem {
  appointmentId: string;
  appointmentCode: string;
  patientId: string;
  patientCode: string;
  patientName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  appointmentReason?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentStatus: string;
  specialtyName?: string;
  roomName?: string;
  encounterId?: string;
  encounterStatus?: string;
}

export interface Encounter {
  id: string;
  encounterCode: string;
  appointmentId?: string;
  appointmentCode?: string;
  patientId: string;
  patientCode?: string;
  patientName?: string;
  patientPhone?: string;
  patientGender?: string;
  patientDateOfBirth?: string;
  patientAllergies?: string;
  patientMedicalHistory?: string;
  doctorId: string;
  doctorCode?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  roomId?: string;
  roomName?: string;
  encounterDateTime: string;
  chiefComplaint: string;
  examinationNotes?: string;
  diagnosis: string;
  icd10Code?: string;
  secondaryDiagnoses?: string;
  treatmentPlan?: string;
  followUpDate?: string;
  followUpNotes?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  temperature?: number;
  bloodPressure?: string;
  heartRate?: number;
  respiratoryRate?: number;
  weight?: number;
  height?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEncounterData {
  appointmentId?: string;
  patientId: string;
  roomId?: string;
  chiefComplaint: string;
  examinationNotes?: string;
  diagnosis: string;
  icd10Code?: string;
  secondaryDiagnoses?: string;
  treatmentPlan?: string;
  followUpDate?: string;
  followUpNotes?: string;
  temperature?: number;
  bloodPressure?: string;
  heartRate?: number;
  respiratoryRate?: number;
  weight?: number;
  height?: number;
}

export interface UpdateEncounterData {
  chiefComplaint?: string;
  examinationNotes?: string;
  diagnosis?: string;
  icd10Code?: string;
  secondaryDiagnoses?: string;
  treatmentPlan?: string;
  followUpDate?: string;
  followUpNotes?: string;
  temperature?: number;
  bloodPressure?: string;
  heartRate?: number;
  respiratoryRate?: number;
  weight?: number;
  height?: number;
}

// ==================== 1. ICD-10 ====================
export interface Icd10Disease {
  id: string;
  code: string;
  nameVi: string;
  nameEn?: string;
  chapter?: string;
  isCommon: boolean;
}

// ==================== 2. E-PRESCRIPTION ====================
export interface PrescriptionItem {
  id?: string;
  medicineId: string;
  medicineName: string;
  unit: string;
  quantity: number;
  morningDose?: string;
  noonDose?: string;
  eveningDose?: string;
  nightDose?: string;
  usageTiming?: string;
  usageRoute?: string;
  daysCount?: number;
  instructions?: string;
}

export interface Prescription {
  id: string;
  prescriptionCode: string;
  encounterId: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  patientPhone: string;
  patientGender: string;
  patientDateOfBirth?: string;
  doctorId: string;
  doctorName: string;
  doctorCode: string;
  diagnosis?: string;
  advice?: string;
  status: string;
  createdAt: string;
  items: PrescriptionItem[];
}

export interface CreatePrescriptionPayload {
  encounterId: string;
  diagnosis?: string;
  advice?: string;
  items: {
    medicineId: string;
    quantity: number;
    morningDose?: string;
    noonDose?: string;
    eveningDose?: string;
    nightDose?: string;
    usageTiming?: string;
    usageRoute?: string;
    daysCount?: number;
    instructions?: string;
  }[];
}

export interface AllergyAlert {
  hasAllergyRisk: boolean;
  warningMessage: string;
  matchedAllergens: string[];
}

// ==================== 3. SERVICE ORDERS (CHỈ ĐỊNH CLS) ====================
export interface ServiceOrder {
  id: string;
  orderCode: string;
  encounterId: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  doctorId: string;
  doctorName: string;
  serviceId: string;
  serviceName: string;
  price: number;
  priority: 'ROUTINE' | 'URGENT';
  notes?: string;
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  results?: string;
  conclusion?: string;
  performedBy?: string;
  performedAt?: string;
  createdAt: string;
}

export interface CreateServiceOrderPayload {
  encounterId: string;
  serviceId: string;
  priority?: 'ROUTINE' | 'URGENT';
  notes?: string;
}

export interface UpdateServiceOrderResultPayload {
  results?: string;
  conclusion?: string;
  status?: 'COMPLETED' | 'PROCESSING' | 'CANCELLED';
}

// ==================== 4. LONGITUDINAL EMR & VITAL TRENDS ====================
export interface VitalTrendPoint {
  encounterId: string;
  encounterCode: string;
  encounterDateTime: string;
  temperature?: number;
  bloodPressure?: string;
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  respiratoryRate?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}

export interface PastVisitSummary {
  encounterId: string;
  encounterCode: string;
  encounterDateTime: string;
  doctorName: string;
  doctorSpecialty?: string;
  chiefComplaint: string;
  diagnosis: string;
  icd10Code?: string;
  treatmentPlan?: string;
  status: string;
  prescription?: Prescription;
  serviceOrders?: ServiceOrder[];
}

export interface PatientEmrTimeline {
  patientId: string;
  patientCode: string;
  fullName: string;
  gender: string;
  dateOfBirth?: string;
  phone: string;
  allergies?: string;
  medicalHistorySummary?: string;
  vitalTrends: VitalTrendPoint[];
  visits: PastVisitSummary[];
}
