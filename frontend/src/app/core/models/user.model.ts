export type Role = 'ROLE_PATIENT' | 'ROLE_DOCTOR' | 'ROLE_ADMIN';

export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roles: Role[];
  status: UserStatus;
}

export interface AuthResponse {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  expiresInMs: number;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPatientPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
}

export interface RegisterDoctorPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  medicalCouncilId: string;
  specialties: string[];
  street?: string;
  city: string;
  governorate: string;
  latitude?: number;
  longitude?: number;
  consultationFee?: number;
}

export interface RegisterAdminPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  adminSecurityKey: string;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  roles: Role[];
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
}

export interface AdminCreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: Role;
  status?: UserStatus;
  medicalCouncilId?: string;
  specialty?: string;
  governorate?: string;
  city?: string;
  street?: string;
  consultationFee?: number;
}

export interface AdminUpdateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  newPassword?: string;
}

export interface PendingDoctorDetail {
  id: string;
  userId: string;
  doctorName: string;
  email: string;
  phoneNumber: string;
  medicalCouncilId: string;
  specialties: string[];
  address?: {
    street?: string;
    city?: string;
    governorate?: string;
    postalCode?: string;
  };
  consultationFee?: {
    inPerson?: number;
    teleconsultation?: number;
    currency?: string;
  };
  verificationStatus: string;
  createdAt: string;
}
