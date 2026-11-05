export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface User {
  userId: string;
  username: string;
  email?: string;
  fullName?: string;
  roles: string[];
  permissions: string[];
  staff?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface RegisterRequest {
  username: string;
  password: string;
  fullName: string;
  dateOfBirth: string; // yyyy-MM-dd
  gender: Gender;
  phone: string;
  email?: string;
}

export interface RegistrationResult {
  email: string;
  emailVerificationRequired: boolean;
}

export interface AuthProviders {
  googleEnabled: boolean;
  googleClientId: string | null;
}

export interface GoogleAuthResult {
  profileRequired: boolean;
  email: string;
  fullName: string | null;
  auth: LoginResponse | null;
}

export interface GoogleRegisterRequest {
  credential: string;
  fullName: string;
  dateOfBirth: string; // yyyy-MM-dd
  gender: Gender;
  phone: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresInMs: number;
  userId: string;
  username: string;
  email?: string;
  roles: string[];
  permissions: string[];
  staff?: boolean;
}
