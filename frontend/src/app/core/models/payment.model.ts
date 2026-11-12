import type { ConsultationType, PaymentMethod, PaymentStatus } from './appointment.model';

export type { PaymentMethod, PaymentStatus, ConsultationType };

export interface PaymentTransaction {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  amount: number;
  currency: string;
  platformCommission: number;
  doctorNetRevenue: number;
  paymentMethod?: PaymentMethod | null;
  status: PaymentStatus;
  transactionReference: string;
  cardLast4?: string;
  paidAt?: string;
  createdAt: string;
}

export interface InitiatePaymentPayload {
  appointmentId: string;
  paymentMethod?: PaymentMethod;
}

export interface ProcessPaymentPayload {
  paymentMethod: PaymentMethod;
  cardHolderName?: string;
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
}

export interface PaymentReceipt {
  paymentId: string;
  transactionReference: string;
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  doctorSpecialty: string;
  cabinetAddress: string;
  consultationType: ConsultationType;
  scheduledStartTime: string;
  amount: number;
  currency: string;
  paymentMethod?: PaymentMethod | null;
  status: PaymentStatus;
  paidAt: string;
  issuedBy: string;
}

export interface FinancialStats {
  totalVolumeTND: number;
  platformCommissionsTND: number;
  doctorPayoutsTND: number;
  totalPaidTransactions: number;
  totalPendingTransactions: number;
}
