import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminCreateUserPayload, AdminUpdateUserPayload, AdminUser, PendingDoctorDetail } from '../models/user.model';
import { AuditLogEntry, TriageMetricsData } from '../models/audit.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/v1/admin';

  public getPendingDoctors(): Observable<PendingDoctorDetail[]> {
    return this.http.get<PendingDoctorDetail[]>(`${this.API_URL}/doctors/pending`);
  }

  public verifyDoctor(doctorProfileId: string): Observable<any> {
    return this.http.patch(`${this.API_URL}/doctors/${doctorProfileId}/verify`, {});
  }

  public rejectDoctor(doctorProfileId: string, reason: string = 'Dossier non conforme'): Observable<any> {
    return this.http.patch(`${this.API_URL}/doctors/${doctorProfileId}/reject?reason=${encodeURIComponent(reason)}`, {});
  }

  // --- CRUD Utilisateurs ---

  public getAllUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.API_URL}/users`);
  }

  public getUserById(userId: string): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.API_URL}/users/${userId}`);
  }

  public createUser(payload: AdminCreateUserPayload): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.API_URL}/users`, payload);
  }

  public updateUser(userId: string, payload: AdminUpdateUserPayload): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.API_URL}/users/${userId}`, payload);
  }

  public updateUserStatus(userId: string, status: string): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.API_URL}/users/${userId}/status?status=${status}`, {});
  }

  public deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/users/${userId}`);
  }

  public getGlobalStats(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/stats`);
  }

  // --- Audit & Traçabilité ---

  public getAuditLogs(limit: number = 60): Observable<AuditLogEntry[]> {
    return this.http.get<AuditLogEntry[]>(`${this.API_URL}/audit-logs?limit=${limit}`);
  }

  // --- Supervision & Métriques Triage FastAPI ---

  public getTriageMetrics(): Observable<TriageMetricsData> {
    return this.http.get<TriageMetricsData>(`${this.API_URL}/triage-metrics`);
  }
}
