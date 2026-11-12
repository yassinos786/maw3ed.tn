import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home-wrapper">
      <!-- Hero Section -->
      <section class="hero">
        <div class="container hero-content">
          <div class="trust-badge-pill">
            <svg class="icon-svg icon-trust" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Plateforme Médicale en Tunisie - Données de Santé Sécurisées</span>
          </div>

          <h1 class="hero-title">
            <ng-container *ngIf="!authService.isDoctor() && !authService.isAdmin()">
              Prenez rendez-vous médical en ligne, consultez en vidéo ou
              <span class="gradient-text">obtenez une orientation rapide</span>
            </ng-container>

            <ng-container *ngIf="authService.isDoctor()">
              Bienvenue sur votre
              <span class="gradient-text">Espace Praticien maw3ed.tn</span>
            </ng-container>

            <ng-container *ngIf="authService.isAdmin()">
              Console de Contrôle &
              <span class="gradient-text">Supervision Administrateur</span>
            </ng-container>
          </h1>

          <p class="hero-subtitle">
            <ng-container *ngIf="!authService.isDoctor() && !authService.isAdmin()">
              Trouvez les meilleurs praticiens conventionnés en Tunisie. Décrivez vos symptômes pour obtenir un conseil d'orientation médical immédiat ou une alerte d'urgence vitale SAMU 198.
            </ng-container>

            <ng-container *ngIf="authService.isDoctor()">
              Gérez vos créneaux de consultation, consultez votre planning en temps réel et assurez vos téléconsultations chiffrées en toute sérénité.
            </ng-container>

            <ng-container *ngIf="authService.isAdmin()">
              Validez les dossiers des médecins inscrits avec contrôle anti-fraude auprès de l'Ordre des Médecins et suivez les flux financiers.
            </ng-container>
          </p>

          <!-- Boutons d'Action Distincts par Rôle -->
          <div class="hero-actions">
            <!-- Patient / Visiteur -->
            <ng-container *ngIf="!authService.isDoctor() && !authService.isAdmin()">
              <a routerLink="/doctors" class="btn btn-primary btn-lg">
                <svg class="icon-svg" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span>Trouver un Médecin</span>
              </a>
              <a routerLink="/triage" class="btn btn-triage btn-lg">
                <svg class="icon-svg" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                <span>Orientation & Triage</span>
              </a>
            </ng-container>

            <!-- Médecin Connecté -->
            <ng-container *ngIf="authService.isDoctor()">
              <a routerLink="/appointments" class="btn btn-primary btn-lg">
                <svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
                <span>Accéder à mon Agenda & Consultations</span>
              </a>
            </ng-container>

            <!-- Administrateur Connecté -->
            <ng-container *ngIf="authService.isAdmin()">
              <a routerLink="/admin" class="btn btn-primary btn-lg">
                <svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>Console d'Administration & Validation Médecins</span>
              </a>
            </ng-container>
          </div>

          <!-- Trust Badges de réassurance -->
          <div class="trust-bar">
            <div class="trust-item">
              <svg class="icon-svg text-accent" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>Médecins Certifiés Conseil de l'Ordre</span>
            </div>
            <div class="trust-item">
              <svg class="icon-svg text-primary" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>Paiement Sécurisé Konnect / CIB</span>
            </div>
            <div class="trust-item">
              <svg class="icon-svg text-accent" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>98.6% de Satisfaction Patients</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Services Principaux -->
      <section class="container features-section">
        <div class="section-title-wrap text-center">
          <span class="badge badge-info">Services de Santé</span>
          <h2 class="section-heading">Une prise en charge médicale complète à 360°</h2>
          <p class="section-sub">Conçue pour simplifier le parcours de soins des patients et l'activité des praticiens</p>
        </div>

        <div class="feature-grid">
          <div class="card feature-card">
            <div class="feature-icon-box bg-blue">
              <svg class="icon-svg icon-lg text-primary" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <h3>Annuaire & Accréditation</h3>
            <p>Contrôle rigoureux anti-fraude de chaque numéro de Conseil de l'Ordre. Seuls les praticiens authentifiés et validés apparaissent sur l'annuaire national.</p>
            <a routerLink="/doctors" class="feature-link">
              <span>Consulter l'annuaire</span>
              <svg class="icon-svg" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
          </div>

          <div class="card feature-card border-triage">
            <div class="feature-icon-box bg-purple">
              <svg class="icon-svg icon-lg text-triage" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <h3>Triage Médical & Urgences</h3>
            <p>Évaluez vos symptômes avant votre rendez-vous pour obtenir une orientation vers la spécialité adéquate ou alerter le SAMU 198 en cas d'urgence.</p>
            <a routerLink="/triage" class="feature-link link-triage">
              <span>Tester le triage de symptômes</span>
              <svg class="icon-svg" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
          </div>

          <div class="card feature-card">
            <div class="feature-icon-box bg-green">
              <svg class="icon-svg icon-lg text-accent" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            </div>
            <h3>Téléconsultation Sécurisée</h3>
            <p>Consultez votre médecin depuis chez vous avec transmission audio/vidéo chiffrée WebRTC / Jitsi Meet. Paiement en ligne sécurisé et reçu certifié en téléchargement direct.</p>
            <a routerLink="/appointments" class="feature-link">
              <span>Espace Consultations</span>
              <svg class="icon-svg" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .hero {
      background: linear-gradient(180deg, #f0fdfa 0%, #f8fafc 100%);
      padding: 4.5rem 0 3rem;
      text-align: center;
      position: relative;
    }
    .hero-content {
      max-width: 880px;
    }
    .trust-badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #ffffff;
      border: 1px solid var(--color-border);
      padding: 0.35rem 0.95rem;
      border-radius: var(--radius-full);
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--color-primary-dark);
      margin-bottom: 1.75rem;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    }
    .icon-trust {
      color: var(--color-accent);
      width: 16px;
      height: 16px;
    }
    .hero-title {
      font-size: 3.1rem;
      font-weight: 800;
      line-height: 1.15;
      color: var(--color-dark);
      letter-spacing: -0.03em;
      margin-bottom: 1.25rem;
    }
    .gradient-text {
      background: linear-gradient(135deg, #0284c7 0%, #7c3aed 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: inline;
    }
    .hero-subtitle {
      font-size: 1.15rem;
      line-height: 1.65;
      color: var(--color-muted);
      margin: 0 auto 2.5rem;
      max-width: 680px;
    }
    .hero-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 3.5rem;
      flex-wrap: wrap;
    }
    .btn-triage {
      background: #7c3aed;
      color: white;
      border: 1px solid #6d28d9;
      box-shadow: 0 4px 14px rgba(124, 58, 237, 0.25);
    }
    .btn-triage:hover {
      background: #6d28d9;
      transform: translateY(-2px);
    }
    .trust-bar {
      display: flex;
      justify-content: center;
      gap: 2.5rem;
      border-top: 1px solid var(--color-border);
      padding-top: 2rem;
      flex-wrap: wrap;
    }
    .trust-item {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-foreground);
    }
    .features-section {
      padding: 4.5rem 1.5rem;
    }
    .section-title-wrap {
      margin-bottom: 3rem;
    }
    .section-heading {
      font-size: 2.2rem;
      font-weight: 800;
      color: var(--color-dark);
      letter-spacing: -0.02em;
      margin: 0.5rem 0;
    }
    .section-sub {
      color: var(--color-muted);
      font-size: 1.05rem;
    }
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.75rem;
    }
    .feature-card {
      padding: 2.25rem 2rem;
      border-radius: var(--radius-lg);
      transition: all var(--transition-normal);
      display: flex;
      flex-direction: column;
    }
    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
    }
    .border-triage {
      border-color: #ede9fe;
    }
    .feature-icon-box {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
    }
    .bg-blue { background: #e0f2fe; }
    .bg-purple { background: #f5f3ff; }
    .bg-green { background: #ecfdf5; }
    .text-triage { color: #7c3aed; }
    .feature-card h3 {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--color-dark);
      margin-bottom: 0.75rem;
    }
    .feature-card p {
      color: var(--color-muted);
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 1.5rem;
      flex-grow: 1;
    }
    .feature-link {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--color-primary);
      transition: gap var(--transition-fast);
      margin-top: auto;
    }
    .feature-link:hover {
      gap: 0.75rem;
    }
    .link-triage {
      color: #7c3aed;
    }
    @media (max-width: 900px) {
      .feature-grid { grid-template-columns: 1fr; }
      .hero-title { font-size: 2.2rem; }
    }
  `]
})
export class HomeComponent {
  protected readonly authService = inject(AuthService);
}
