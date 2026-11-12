import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'triage',
    loadComponent: () => import('./features/triage/triage.component').then(m => m.TriageComponent)
  },
  {
    path: 'doctors',
    loadComponent: () => import('./features/doctors/doctor-list.component').then(m => m.DoctorListComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'appointments',
    loadComponent: () => import('./features/appointments/appointment-list.component').then(m => m.AppointmentListComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
