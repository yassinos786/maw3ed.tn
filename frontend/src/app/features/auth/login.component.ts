import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container auth-container">
      <div class="card auth-card">
        <h2 class="auth-title">Connexion à maw3ed.tn</h2>
        <p class="auth-subtitle">Accédez à votre espace santé et vos rendez-vous</p>

        <form (ngSubmit)="onSubmit()">
          <div class="form-group mb-3">
            <label class="form-label" for="login-email">Adresse Email</label>
            <input
              id="login-email"
              type="email"
              class="form-control"
              [(ngModel)]="email"
              name="email"
              placeholder="votre.email@exemple.tn"
              required
            />
          </div>

          <div class="form-group mb-4">
            <label class="form-label" for="login-pwd">Mot de passe</label>
            <input
              id="login-pwd"
              type="password"
              class="form-control"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" class="btn btn-primary w-100" [disabled]="loading()">
            {{ loading() ? 'Connexion en cours...' : 'Se connecter' }}
          </button>
        </form>

        <div *ngIf="error()" class="alert-error mt-3">
          <svg class="icon-svg icon-xs" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{{ error() }}</span>
        </div>

        <p class="auth-switch mt-4 text-center">
          Pas encore de compte ? <a routerLink="/register" class="link-primary">Créer un compte</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { max-width: 440px; padding: 4rem 1.5rem; }
    .auth-card { padding: 2.5rem 2rem; }
    .auth-title { font-size: 1.6rem; font-weight: 800; margin-bottom: 0.35rem; }
    .auth-subtitle { color: var(--muted); font-size: 0.9rem; margin-bottom: 1.75rem; }
    .w-100 { width: 100%; }
    .text-center { text-align: center; }
    .mt-3 { margin-top: 1rem; }
    .mt-4 { margin-top: 1.5rem; }
    .mb-3 { margin-bottom: 1rem; }
    .mb-4 { margin-bottom: 1.5rem; }
    .alert-error {
      background: #fef2f2; color: #991b1b; padding: 0.75rem; border-radius: var(--radius);
      border: 1px solid #fecaca; font-size: 0.85rem;
    }
    .link-primary { color: var(--primary); font-weight: 600; }
  `]
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  onSubmit(): void {
    if (!this.email || !this.password) return;

    this.loading.set(true);
    this.error.set(null);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        const roles = res.user?.roles || [];
        if (roles.includes('ROLE_ADMIN')) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/appointments']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Identifiants incorrects (email ou mot de passe invalide)');
      }
    });
  }
}
