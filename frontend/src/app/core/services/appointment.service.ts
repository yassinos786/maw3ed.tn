import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment, AvailabilitySlot, BookAppointmentPayload } from '../models/appointment.model';
import { PageResponse } from './doctor.service';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/v1/appointments';

  public getDoctorSlots(doctorId: string, start: string, end: string): Observable<AvailabilitySlot[]> {
    const params = new HttpParams()
      .set('start', start)
      .set('end', end);
    return this.http.get<AvailabilitySlot[]>(`${this.API_URL}/doctors/${doctorId}/slots`, { params });
  }

  public bookSlot(payload: BookAppointmentPayload): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.API_URL}/book`, payload);
  }

  public getMyAppointments(page: number = 0, size: number = 10): Observable<PageResponse<Appointment>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Appointment>>(`${this.API_URL}/me`, { params });
  }

  public cancelAppointment(id: string, reason?: string): Observable<Appointment> {
    let params = new HttpParams();
    if (reason) {
      params = params.set('reason', reason);
    }
    return this.http.patch<Appointment>(`${this.API_URL}/${id}/cancel`, {}, { params });
  }

  public completeAppointment(id: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.API_URL}/${id}/complete`, {});
  }

  public getMySlots(start?: string, end?: string): Observable<AvailabilitySlot[]> {
    let params = new HttpParams();
    if (start) params = params.set('start', start);
    if (end) params = params.set('end', end);
    return this.http.get<AvailabilitySlot[]>(`${this.API_URL}/doctors/me/slots`, { params });
  }

  public generateSlotsBulk(payload: {
    startDateTime: string;
    endDateTime: string;
    durationMinutes: number;
    consultationType: string;
  }): Observable<AvailabilitySlot[]> {
    return this.http.post<AvailabilitySlot[]>(`${this.API_URL}/doctors/me/slots/bulk`, payload);
  }

  public updateSlot(slotId: string, payload: {
    startTime: string;
    endTime: string;
    consultationType: string;
  }): Observable<AvailabilitySlot> {
    return this.http.put<AvailabilitySlot>(`${this.API_URL}/doctors/me/slots/${slotId}`, payload);
  }

  public deleteSlot(slotId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/doctors/me/slots/${slotId}`);
  }
}
