import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TriageHealthStatus, TriageRequestPayload, TriageResponse } from '../models/triage.model';

@Injectable({
  providedIn: 'root'
})
export class TriageService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/v1/triage';

  public analyzeSymptoms(payload: TriageRequestPayload): Observable<TriageResponse> {
    return this.http.post<TriageResponse>(`${this.API_URL}/analyze`, payload);
  }

  public getHealth(): Observable<TriageHealthStatus> {
    return this.http.get<TriageHealthStatus>(`${this.API_URL}/health`);
  }
}
