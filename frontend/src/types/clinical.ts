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
  treatmentPlan?: string;
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
  treatmentPlan?: string;
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
  treatmentPlan?: string;
  temperature?: number;
  bloodPressure?: string;
  heartRate?: number;
  respiratoryRate?: number;
  weight?: number;
  height?: number;
}

