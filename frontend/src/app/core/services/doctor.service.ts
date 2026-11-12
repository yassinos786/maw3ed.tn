import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DoctorProfile } from '../models/doctor.model';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/v1/doctors';

  public searchDoctors(
    governorate?: string,
    specialty?: string,
    page: number = 0,
    size: number = 12
  ): Observable<PageResponse<DoctorProfile>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (governorate && governorate !== 'TOUS') {
      params = params.set('governorate', governorate);
    }

    if (specialty && specialty !== 'TOUTES') {
      params = params.set('specialty', specialty);
    }

    return this.http.get<PageResponse<DoctorProfile>>(`${this.API_URL}/search`, { params });
  }

  public getDoctorById(id: string): Observable<DoctorProfile> {
    return this.http.get<DoctorProfile>(`${this.API_URL}/${id}`);
  }

  public getMyProfile(): Observable<DoctorProfile> {
    return this.http.get<DoctorProfile>(`${this.API_URL}/me/profile`);
  }

  public updateMyProfile(payload: Partial<DoctorProfile>): Observable<DoctorProfile> {
    return this.http.put<DoctorProfile>(`${this.API_URL}/me/profile`, payload);
  }
}
