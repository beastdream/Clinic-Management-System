export interface SystemSettings {
  maxFailedLoginAttempts: number;
  lockoutDurationMinutes: number;
  passwordMinLength: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowPatientRegistration: boolean;
}

export interface UpdateSystemSettingsPayload {
  maxFailedLoginAttempts?: number;
  lockoutDurationMinutes?: number;
  passwordMinLength?: number;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  allowPatientRegistration?: boolean;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  phone?: string;
  status: 'ACTIVE' | 'LOCKED' | 'SUSPENDED';
  failedLoginAttempts: number;
  lockedUntil?: string;
  isStaff: boolean;
  authProvider: string;
  roles: string[];
  fullName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserStatusPayload {
  status: 'ACTIVE' | 'LOCKED' | 'SUSPENDED';
  reason?: string;
}

export interface ResetPasswordPayload {
  newPassword: string;
}

// ==================== 1. MASTER DATA TYPES ====================
export interface Specialty {
  id: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSpecialtyPayload {
  code: string;
  name: string;
  description?: string;
  active?: boolean;
}

export interface UpdateSpecialtyPayload {
  name: string;
  description?: string;
  active?: boolean;
}

export interface RoomItem {
  id: string;
  code: string;
  name: string;
  roomType: string;
  active: boolean;
  specialtyId?: string;
  specialtyName?: string;
  createdAt?: string;
}

export interface CreateRoomPayload {
  code: string;
  name: string;
  roomType: string;
  specialtyId?: string;
  active?: boolean;
}

export interface UpdateRoomPayload {
  name: string;
  roomType: string;
  specialtyId?: string;
  active?: boolean;
}

export interface AdminServiceItem {
  id: string;
  code: string;
  name: string;
  serviceType: string;
  description?: string;
  active: boolean;
  specialtyId?: string;
  specialtyName?: string;
  currentPrice: number;
}

export interface CreateServiceItemPayload {
  code: string;
  name: string;
  serviceType: string;
  specialtyId?: string;
  description?: string;
  price: number;
  active?: boolean;
}

export interface UpdateServiceItemPayload {
  name: string;
  serviceType: string;
  specialtyId?: string;
  description?: string;
  price: number;
  active?: boolean;
}

// ==================== 2. STAFF TYPES ====================
export interface AdminStaff {
  id: string;
  userId: string;
  username: string;
  staffCode: string;
  fullName: string;
  gender: string;
  dateOfBirth?: string;
  phone: string;
  email?: string;
  specialtyId?: string;
  specialtyName?: string;
  roomId?: string;
  roomName?: string;
  licenseNumber?: string;
  qualification?: string;
  status: string; // ACTIVE, ON_LEAVE, TERMINATED
  roles: string[];
  createdAt: string;
}

export interface CreateStaffPayload {
  username: string;
  password: string;
  staffCode: string;
  fullName: string;
  gender: string;
  dateOfBirth?: string;
  phone: string;
  email?: string;
  specialtyId?: string;
  roomId?: string;
  licenseNumber?: string;
  qualification?: string;
  roles: string[];
}

export interface UpdateStaffPayload {
  fullName: string;
  gender: string;
  dateOfBirth?: string;
  phone: string;
  email?: string;
  specialtyId?: string;
  roomId?: string;
  licenseNumber?: string;
  qualification?: string;
  status?: string;
  roles: string[];
}

// ==================== 3. AUDIT LOG TYPES ====================
export interface AdminAuditLog {
  id: string;
  userId?: string;
  username: string;
  roleName: string;
  action: string;
  entityName: string;
  entityId?: string;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ==================== 4. REPORT TYPES ====================
export interface AdminReportSummary {
  totalDoctors: number;
  totalStaff: number;
  totalSpecialties: number;
  totalRooms: number;
  totalServices: number;
  totalPatients: number;
  totalEncounters: number;
  staffByRole: Record<string, number>;
}

export interface SpecialtyReport {
  specialtyId: string;
  specialtyCode: string;
  specialtyName: string;
  doctorCount: number;
  encounterCount: number;
}

export interface DoctorWorkload {
  doctorId: string;
  staffCode: string;
  fullName: string;
  specialtyName: string;
  phone: string;
  completedEncounters: number;
}
