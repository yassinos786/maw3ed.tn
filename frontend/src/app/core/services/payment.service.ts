import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  FinancialStats,
  InitiatePaymentPayload,
  PaymentReceipt,
  PaymentTransaction,
  ProcessPaymentPayload
} from '../models/payment.model';
import { PageResponse } from './doctor.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/v1/payments';

  public initiatePayment(payload: InitiatePaymentPayload): Observable<PaymentTransaction> {
    return this.http.post<PaymentTransaction>(`${this.API_URL}/initiate`, payload);
  }

  public processPayment(paymentId: string, payload: ProcessPaymentPayload): Observable<PaymentTransaction> {
    return this.http.post<PaymentTransaction>(`${this.API_URL}/${paymentId}/process`, payload);
  }

  public getPaymentForAppointment(appointmentId: string): Observable<PaymentTransaction> {
    return this.http.get<PaymentTransaction>(`${this.API_URL}/appointment/${appointmentId}`);
  }

  public getReceipt(paymentId: string): Observable<PaymentReceipt> {
    return this.http.get<PaymentReceipt>(`${this.API_URL}/${paymentId}/receipt`);
  }

  public openPrintableReceipt(paymentId: string): void {
    window.open(`${this.API_URL}/${paymentId}/receipt/html`, '_blank');
  }

  public getFinancialStats(): Observable<FinancialStats> {
    return this.http.get<FinancialStats>(`${this.API_URL}/admin/financial-stats`);
  }

  public getAllTransactions(page: number = 0, size: number = 15): Observable<PageResponse<PaymentTransaction>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<PaymentTransaction>>(`${this.API_URL}/admin/all`, { params });
  }
}
