import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

type RegisterRole = 'PATIENT' | 'DOCTOR';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container auth-container">
      <div class="card auth-card">
        <!-- En-tête -->
        <div class="text-center mb-4">
          <span class="badge badge-info mb-2">
            <svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
            Plateforme Médicale maw3ed.tn
          </span>
          <h2 class="auth-title">Créer votre compte</h2>
          <p class="auth-subtitle">Sélectionnez votre profil d'utilisation pour continuer</p>
        </div>

        <!-- Message de Confirmation : Praticien en attente de validation -->
        <div *ngIf="doctorRegistered()" class="pending-approval-box text-center py-2 mb-3">
          <div class="approval-icon-wrap mb-3">
            <svg class="icon-svg icon-xxl text-primary" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
          <h3 class="approval-title mb-2">Dossier Praticien Transmis avec Succès</h3>
          <p class="approval-desc text-muted mb-3">
            Votre inscription a bien été enregistrée. Conformément aux dispositions de l'Ordre des Médecins, votre compte praticien est actuellement <strong>en attente d'approbation administrative</strong>.
          </p>
          <div class="approval-info-banner mb-4 text-start">
            <p class="mb-1"><strong>Procédure de validation réglementaire :</strong></p>
            <p class="mb-0 text-sm">L'accès à votre espace praticien sera débloqué après vérification de conformité de votre matricule par un administrateur. Vous ne pourrez pas vous connecter avant cette validation.</p>
          </div>
          <a routerLink="/login" class="btn btn-primary w-100">Aller à la page de connexion</a>
        </div>

        <!-- Sélecteur de Rôle par Onglets (Patient / Médecin) -->
        <div *ngIf="!doctorRegistered()" class="role-selector mb-4">
          <button
            type="button"
            class="role-btn"
            [class.active]="selectedRole === 'PATIENT'"
            (click)="selectRole('PATIENT')"
          >
            <svg class="icon-svg" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Patient</span>
          </button>

          <button
            type="button"
            class="role-btn"
            [class.active]="selectedRole === 'DOCTOR'"
            (click)="selectRole('DOCTOR')"
          >
            <svg class="icon-svg" viewBox="0 0 24 24"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
            <span>Médecin (Praticien)</span>
          </button>
        </div>

        <!-- Formulaire Inscription -->
        <form *ngIf="!doctorRegistered()" (ngSubmit)="onSubmit()">
          <!-- Identité commune -->
          <div class="names-grid">
            <div class="form-group">
              <label class="form-label">Prénom *</label>
              <input type="text" class="form-control" [(ngModel)]="firstName" name="firstName" placeholder="Votre prénom" required />
            </div>
            <div class="form-group">
              <label class="form-label">Nom *</label>
              <input type="text" class="form-control" [(ngModel)]="lastName" name="lastName" placeholder="Votre nom" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Adresse Email *</label>
            <input type="email" class="form-control" [(ngModel)]="email" name="email" placeholder="nom@exemple.tn" required />
          </div>

          <div class="form-group">
            <label class="form-label">Numéro de Téléphone *</label>
            <input type="tel" class="form-control" [(ngModel)]="phoneNumber" name="phoneNumber" placeholder="+216 20 123 456 ou 20123456" required />
            <span class="form-hint">Format tunisien (+216 ou 8 chiffres).</span>
          </div>

          <!-- Champs Spécifiques Médecin -->
          <div *ngIf="selectedRole === 'DOCTOR'" class="doctor-fields card-sub mb-3">
            <div class="sub-header">
              <span class="sub-title">Agrément & Données Professionnelles</span>
              <span class="badge badge-warning">Contrôle Anti-Fraude</span>
            </div>

            <div class="form-group">
              <div class="flex-between">
                <label class="form-label">Matricule Ordre des Médecins de Tunisie *</label>
              </div>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="medicalCouncilId"
                name="medicalCouncilId"
                placeholder="Ex: TN-MED-84920"
                required
              />
              <span class="form-hint">Vérifié par l'administrateur auprès de l'Ordre des Médecins avant activation du compte.</span>
            </div>

            <div class="names-grid">
              <div class="form-group">
                <label class="form-label">Spécialité Principale *</label>
                <select class="form-control" [(ngModel)]="specialty" name="specialty" required>
                  <option value="Cardiologie">Cardiologie</option>
                  <option value="Dermatologie">Dermatologie</option>
                  <option value="Chirurgie Dentaire">Chirurgie Dentaire</option>
                  <option value="Ophtalmologie">Ophtalmologie</option>
                  <option value="Oto-Rhino-Laryngologie (ORL)">ORL</option>
                  <option value="Pédiatrie">Pédiatrie</option>
                  <option value="Gastro-entérologie">Gastro-entérologie</option>
                  <option value="Neurologie">Neurologie</option>
                  <option value="Gynécologie-Obstétrique">Gynécologie</option>
                  <option value="Médecine Générale">Médecine Générale</option>
                  <option value="Orthopédie">Orthopédie</option>
                  <option value="Psychiatrie">Psychiatrie</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Tarif Consultation (DT) *</label>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="consultationFee"
                  name="consultationFee"
                  min="20"
                  max="300"
                  required
                />
              </div>
            </div>

            <!-- Localisation du Cabinet en Tunisie -->
            <div class="location-box mt-3 mb-2">
              <label class="form-label mb-2 d-inline-flex align-items-center gap-1.5">
                <svg class="icon-svg icon-xs text-primary" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <strong>Localisation du Cabinet Médical (Tunisie)</strong>
              </label>

              <div class="names-grid">
                <div class="form-group">
                  <label class="form-label">Gouvernorat *</label>
                  <select class="form-control" [(ngModel)]="governorate" name="governorate" required>
                    <option value="" disabled selected>Sélectionner un gouvernorat...</option>
                    <option *ngFor="let g of governorates" [value]="g">{{ g }}</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Délégation / Ville / Quartier *</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="city"
                    name="city"
                    placeholder="Ex: Manouba Ville, Denden, Ennasr 2, Centre Urbain Nord..."
                    required
                  />
                </div>
              </div>

              <div class="form-group mb-1">
                <label class="form-label">Adresse / Rue / Centre Médical</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="street"
                  name="street"
                  placeholder="Ex: Centre Médical Yassine, Rue Habib Bourguiba, Cabinet 204"
                />
              </div>
            </div>

            <div class="fraud-notice">
              <svg class="icon-svg text-warning" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span>Contrôle d'authenticité : Votre compte praticien restera en attente jusqu'à validation manuelle par l'administrateur afin de garantir aux patients des praticiens réels et diplômés.</span>
            </div>
          </div>

          <!-- Mot de passe -->
          <div class="form-group">
            <label class="form-label">Mot de passe *</label>
            <input
              type="password"
              class="form-control"
              [(ngModel)]="password"
              name="password"
              placeholder="Minimum 6 caractères"
              required
            />
          </div>

          <button type="submit" class="btn btn-primary w-100 btn-submit" [disabled]="loading()">
            <span *ngIf="loading()">Enregistrement en cours...</span>
            <span *ngIf="!loading()">
              {{ selectedRole === 'DOCTOR' ? 'Soumettre mon dossier praticien' : 'Créer mon compte Patient' }}
            </span>
          </button>
        </form>

        <div *ngIf="successMessage()" class="alert-success mt-3">
          <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          <span>{{ successMessage() }}</span>
        </div>

        <div *ngIf="error()" class="alert-error mt-3">
          <svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{{ error() }}</span>
        </div>

        <p *ngIf="!doctorRegistered()" class="auth-switch mt-4 text-center">
          Déjà un compte ? <a routerLink="/login" class="link-primary">Se connecter</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { max-width: 580px; padding: 2.5rem 1.5rem; margin: 0 auto; }
    .auth-card { padding: 2.5rem 2.25rem; border-radius: var(--radius-lg); box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06); }
    .btn-submit {
      width: 100%;
      margin-top: 1.5rem;
      padding: 0.95rem 1.5rem;
      font-size: 1.05rem;
      font-weight: 700;
      border-radius: var(--radius-md);
    }
    .auth-switch {
      text-align: center;
      margin-top: 1.25rem;
      font-size: 0.9rem;
    }
    .text-center { text-align: center; }
    .auth-title { font-size: 1.75rem; font-weight: 800; color: var(--color-dark); margin-bottom: 0.25rem; }
    .auth-subtitle { color: var(--color-muted); font-size: 0.95rem; margin-bottom: 1.5rem; }
    
    .role-selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      background: var(--color-muted-light);
      padding: 0.35rem;
      border-radius: var(--radius-full);
      border: 1px solid var(--color-border);
    }
    .role-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      border-radius: var(--radius-full);
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--color-muted);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .role-btn:hover { color: var(--color-dark); }
    .role-btn.active {
      background: white;
      color: var(--color-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    
    .names-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .card-sub {
      background: var(--color-muted-light);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 1.25rem;
    }
    .sub-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .sub-title { font-size: 0.9rem; font-weight: 700; color: var(--color-dark); }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .btn-link-xs {
      background: none;
      border: none;
      color: var(--color-primary);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
      padding: 0;
    }
    .form-hint { display: block; font-size: 0.75rem; color: var(--color-muted); margin-top: 0.25rem; }
    .location-box {
      background: white;
      border: 1px solid #e2e8f0;
      padding: 1rem;
      border-radius: var(--radius-md);
    }
    .fraud-notice {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
      padding: 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      line-height: 1.4;
      margin-top: 1rem;
    }
    .btn-submit {
      padding: 0.9rem;
      font-size: 1rem;
      font-weight: 700;
      margin-top: 0.75rem;
    }
    .alert-error {
      background: #fef2f2;
      border: 1px solid #fee2e2;
      color: #991b1b;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
    }
    .alert-success {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      padding: 0.85rem 1rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      font-weight: 600;
    }
    .link-primary { color: var(--color-primary); font-weight: 600; }
    .pending-approval-box { padding: 1.5rem 0.5rem; }
    .approval-icon-wrap { width: 72px; height: 72px; border-radius: 50%; background: #eff6ff; display: inline-flex; align-items: center; justify-content: center; }
    .icon-xxl { width: 44px; height: 44px; stroke-width: 1.8; }
    .approval-title { font-size: 1.4rem; font-weight: 800; color: #1e293b; }
    .approval-desc { font-size: 0.95rem; line-height: 1.5; }
    .approval-info-banner { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--radius); padding: 1rem 1.25rem; font-size: 0.88rem; color: #166534; }
  `]
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  selectedRole: RegisterRole = 'PATIENT';

  // Les 24 Gouvernorats de Tunisie
  readonly governorates: string[] = [
    'Manouba', 'Tunis', 'Ariana', 'Ben Arous', 'Nabeul', 'Zaghouan',
    'Bizerte', 'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Sousse',
    'Monastir', 'Mahdia', 'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid',
    'Gabès', 'Médenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kébili'
  ];

  // Champs communs
  firstName = '';
  lastName = '';
  email = '';
  phoneNumber = '+216 ';
  password = '';

  // Champs Médecin
  medicalCouncilId = '';
  specialty = 'Cardiologie';
  consultationFee = 60;
  city = '';
  governorate = '';
  street = '';

  loading = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  doctorRegistered = signal(false);

  selectRole(role: RegisterRole): void {
    this.selectedRole = role;
    this.error.set(null);
    this.successMessage.set(null);
  }



  onSubmit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    const cleanPhone = this.phoneNumber.trim().replace(/\s+/g, '');

    if (this.selectedRole === 'PATIENT') {
      this.authService.registerPatient({
        firstName: this.firstName.trim(),
        lastName: this.lastName.trim(),
        email: this.email.trim(),
        phoneNumber: cleanPhone,
        password: this.password
      }).subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/appointments']);
        },
        error: (err) => {
          this.loading.set(false);
          this.handleApiError(err, 'Erreur lors de la création du compte patient.');
        }
      });
    } else if (this.selectedRole === 'DOCTOR') {
      this.authService.registerDoctor({
        firstName: this.firstName.trim(),
        lastName: this.lastName.trim(),
        email: this.email.trim(),
        phoneNumber: cleanPhone,
        password: this.password,
        medicalCouncilId: this.medicalCouncilId.trim(),
        specialties: [this.specialty],
        street: this.street ? this.street.trim() : undefined,
        city: this.city.trim(),
        governorate: this.governorate.trim(),
        consultationFee: this.consultationFee
      }).subscribe({
        next: () => {
          this.loading.set(false);
          this.doctorRegistered.set(true);
        },
        error: (err) => {
          this.loading.set(false);
          this.handleApiError(err, 'Erreur lors de l\'enregistrement du dossier praticien.');
        }
      });
    }
  }

  private handleApiError(err: any, defaultMessage: string): void {
    if (err.error?.validationErrors && Object.keys(err.error.validationErrors).length > 0) {
      const msgs = Object.values(err.error.validationErrors);
      this.error.set(msgs.join(' • '));
    } else if (err.error?.message) {
      this.error.set(err.error.message);
    } else {
      this.error.set(defaultMessage);
    }
  }
}
