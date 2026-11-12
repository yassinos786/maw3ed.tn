export interface Address {
  street?: string;
  city: string;
  governorate: string;
  postalCode?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}

export interface ConsultationFee {
  inPerson: number;
  teleconsultation: number;
  currency: string;
}

export type VerificationStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';

export interface DoctorProfile {
  id: string;
  userId: string;
  fullName?: string;
  medicalCouncilId: string;
  specialties: string[];
  presentation?: string;
  spokenLanguages: string[];
  consultationFee: ConsultationFee;
  address: Address;
  verificationStatus: VerificationStatus;
  teleconsultationEnabled: boolean;
}
