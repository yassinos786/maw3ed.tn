import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="header">
      <div class="container nav-wrapper">
        <a routerLink="/" class="brand">
          <div class="brand-logo">
            <svg class="icon-svg icon-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v6m-3-3h6"/>
            </svg>
          </div>
          <div class="brand-text-group">
            <span class="brand-text">maw3ed<span class="brand-accent">.tn</span></span>
            <span class="brand-sub">SANTÉ CONNECTÉE</span>
          </div>
        </a>

        <!-- Liens de Navigation Strictement Filtrés par Rôle -->
        <nav class="nav-links">
          <!-- 1. Liens réservés aux Patients ou Visiteurs anonymes (Cachés pour Médecin & Admin) -->
          <ng-container *ngIf="!authService.isDoctor() && !authService.isAdmin()">
            <a routerLink="/doctors" routerLinkActive="active" class="nav-link">
              <svg class="icon-svg" viewBox="0 0 24 24"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
              <span>Trouver un Médecin</span>
            </a>

            <a routerLink="/triage" routerLinkActive="active" class="nav-link nav-link-triage">
              <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              <span>Triage & Urgence</span>
            </a>

            <a *ngIf="authService.isAuthenticated()" routerLink="/appointments" routerLinkActive="active" class="nav-link">
              <svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>Mes Rendez-vous</span>
            </a>
          </ng-container>

          <!-- 2. Liens réservés au Médecin -->
          <ng-container *ngIf="authService.isDoctor()">
            <a routerLink="/appointments" routerLinkActive="active" class="nav-link nav-link-doc">
              <svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>Mon Agenda & Consultations</span>
            </a>
          </ng-container>

          <!-- 3. Liens réservés à l'Administrateur -->
          <ng-container *ngIf="authService.isAdmin()">
            <a routerLink="/admin" routerLinkActive="active" class="nav-link nav-link-admin">
              <svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>Validation Médecins & Supervision</span>
            </a>
          </ng-container>
        </nav>

        <div class="nav-actions">
          <ng-container *ngIf="!authService.isAuthenticated(); else userMenu">
            <a routerLink="/login" class="btn btn-outline btn-sm">Se connecter</a>
            <a routerLink="/register" class="btn btn-primary btn-sm">Créer un compte</a>
          </ng-container>

          <ng-template #userMenu>
            <div class="user-pill">
              <div class="user-avatar" [class.avatar-doc]="authService.isDoctor()" [class.avatar-admin]="authService.isAdmin()">
                {{ authService.currentUser()?.firstName?.charAt(0) }}{{ authService.currentUser()?.lastName?.charAt(0) }}
              </div>
              <div class="user-meta">
                <span class="user-name">
                  {{ authService.isDoctor() ? 'Dr. ' : '' }}{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}
                </span>
                <span class="user-role-badge">
                  {{ authService.isAdmin() ? 'Administrateur' : (authService.isDoctor() ? 'Médecin' : 'Patient') }}
                </span>
              </div>
              <button (click)="logout()" class="btn-logout" title="Déconnexion">
                <svg class="icon-svg" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          </ng-template>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      z-index: 100;
      transition: all var(--transition-normal);
    }
    .nav-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 74px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .brand-logo {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #0284c7 0%, #0891b2 100%);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25);
    }
    .icon-brand { width: 24px; height: 24px; }
    .brand-text-group { display: flex; flex-direction: column; }
    .brand-text { font-size: 1.35rem; font-weight: 800; color: var(--color-dark); letter-spacing: -0.02em; line-height: 1.1; }
    .brand-accent { color: var(--color-primary); }
    .brand-sub { font-size: 0.65rem; font-weight: 700; color: var(--color-muted); letter-spacing: 0.12em; }
    .nav-links { display: flex; align-items: center; gap: 0.5rem; }
    .nav-link {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--color-muted);
      padding: 0.55rem 0.9rem;
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
    }
    .nav-link:hover { color: var(--color-primary); background: var(--color-primary-surface); }
    .nav-link.active { color: var(--color-primary); background: var(--color-primary-light); font-weight: 700; }
    .nav-link-triage { color: #7c3aed; }
    .nav-link-triage:hover { color: #6d28d9; background: #f5f3ff; }
    .nav-link-triage.active { color: #6d28d9; background: #ede9fe; }
    .nav-link-doc { color: #0284c7; }
    .nav-link-doc:hover, .nav-link-doc.active { color: #0369a1; background: #e0f2fe; }
    .nav-link-admin { color: #059669; }
    .nav-link-admin:hover, .nav-link-admin.active { color: #047857; background: #ecfdf5; }
    .nav-actions { display: flex; align-items: center; gap: 0.75rem; }
    .user-pill {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: var(--color-muted-light);
      padding: 0.35rem 0.5rem 0.35rem 0.75rem;
      border-radius: var(--radius-full);
      border: 1px solid var(--color-border);
    }
    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--color-primary);
      color: white;
      font-weight: 700;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .avatar-doc { background: #0284c7; }
    .avatar-admin { background: #b91c1c; }
    .user-meta { display: flex; flex-direction: column; }
    .user-name { font-weight: 700; font-size: 0.85rem; color: var(--color-dark); line-height: 1.1; }
    .user-role-badge { font-size: 0.7rem; color: var(--color-muted); font-weight: 500; }
    .btn-logout {
      background: none;
      border: none;
      color: var(--color-muted);
      padding: 0.4rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);
      cursor: pointer;
    }
    .btn-logout:hover { background: #fee2e2; color: var(--color-destructive); }
  `]
})
export class NavbarComponent {
  protected readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
