import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  AuthResponse,
  LoginPayload,
  RegisterAdminPayload,
  RegisterDoctorPayload,
  RegisterPatientPayload,
  User
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/v1/auth';

  private readonly tokenSignal = signal<string | null>(this.getStoredToken());
  public readonly currentUser = signal<User | null>(this.getStoredUser());

  public readonly isAuthenticated = computed(() => !!this.tokenSignal());
  public readonly isDoctor = computed(() => this.currentUser()?.roles.includes('ROLE_DOCTOR') ?? false);
  public readonly isAdmin = computed(() => this.currentUser()?.roles.includes('ROLE_ADMIN') ?? false);
  public readonly isPatient = computed(() => this.currentUser()?.roles.includes('ROLE_PATIENT') ?? false);

  public login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, payload).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  public registerPatient(payload: RegisterPatientPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register/patient`, payload).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  public registerDoctor(payload: RegisterDoctorPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register/doctor`, payload);
  }

  public registerAdmin(payload: RegisterAdminPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register/admin`, payload).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  public getToken(): string | null {
    return this.tokenSignal();
  }

  public logout(): void {
    localStorage.removeItem('maw3ed_token');
    localStorage.removeItem('maw3ed_user');
    this.tokenSignal.set(null);
    this.currentUser.set(null);
  }

  private handleAuthSuccess(res: AuthResponse): void {
    if (!res || !res.accessToken) {
      return;
    }
    localStorage.setItem('maw3ed_token', res.accessToken);
    localStorage.setItem('maw3ed_user', JSON.stringify(res.user));
    this.tokenSignal.set(res.accessToken);
    this.currentUser.set(res.user);
  }

  private getStoredToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('maw3ed_token') : null;
  }

  private getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('maw3ed_user');
    return raw ? JSON.parse(raw) : null;
  }
}
