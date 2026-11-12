export type SlotStatus = 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'BLOCKED';

export type ConsultationType = 'IN_PERSON' | 'TELECONSULTATION' | 'BOTH';

export type AppointmentStatus =
  | 'REQUESTED'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'REFUNDED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'NOT_APPLICABLE';

export type PaymentMethod = 'CARTE_BANCAIRE' | 'KONNECT' | 'FLOUCI' | 'ONLINE_PAYMENT' | 'CASH_AT_CABINET';

export interface AvailabilitySlot {
  id: string;
  doctorId: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  status: SlotStatus;
  consultationType: ConsultationType;
}

export interface Appointment {
  id: string;
  slotId: string;
  doctorId: string;
  patientId: string;
  type: ConsultationType;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  amountPaid?: number;
  paymentMethod?: PaymentMethod;
  cancellationReason?: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  doctorSnapshot?: {
    fullName: string;
    specialty: string;
    cabinetAddress: string;
    fee: number;
    latitude?: number;
    longitude?: number;
  };
  patientSnapshot?: {
    fullName: string;
    phoneNumber: string;
    email: string;
  };
  teleconsultationSession?: {
    roomName: string;
  };
}

export interface BookAppointmentPayload {
  slotId: string;
  type: ConsultationType;
}
