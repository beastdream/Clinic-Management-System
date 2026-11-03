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
