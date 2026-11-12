import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TriageService } from '../../core/services/triage.service';
import { TriageHealthStatus, TriageResponse } from '../../core/models/triage.model';

@Component({
  selector: 'app-triage',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container triage-container">
      <div class="triage-header text-center mb-4">
        <span class="badge badge-info mb-2">
          <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Orientation Médicale & Triage
        </span>
        <h1 class="page-title">Orientation Médicale & Triage d'Urgence</h1>
        <p class="subtitle text-muted">Analyse clinique pré-consultation pour vous orienter vers la bonne spécialité</p>
      </div>

      <!-- Formulaire de saisie des symptômes -->
      <div class="card triage-card">
        <form (ngSubmit)="analyze()">
          <div class="form-group">
            <label class="form-label" for="symptoms">
              Description de vos symptômes (douleur, localisation, durée, intensité) :
            </label>
            <textarea
              id="symptoms"
              name="symptoms"
              rows="4"
              class="form-control triage-textarea"
              placeholder="Décrivez précisément vos symptômes cliniques (ex: oppression thoracique, palpitations, essoufflement, éruption cutanée, céphalées persistantes...)"
              [(ngModel)]="symptoms"
              [disabled]="loading()"
              required
            ></textarea>
          </div>

          <div class="triage-helper-note">
            <svg class="helper-icon icon-svg text-primary" viewBox="0 0 24 24" style="width:16px;height:16px;flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <div class="helper-text">
              <strong>Conseil clinique :</strong> Décrivez la localisation de la douleur, son intensité et son évolution temporelle pour une orientation optimale.
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-submit w-100" [disabled]="loading() || !symptoms.trim()">
            <svg *ngIf="!loading()" class="icon-svg" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span *ngIf="loading()">Analyse des symptômes en cours...</span>
            <span *ngIf="!loading()">Analyser mes symptômes</span>
          </button>
        </form>

        <div *ngIf="errorMessage()" class="alert-error mt-3">
          <svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{{ errorMessage() }}</span>
        </div>
      </div>

      <!-- Résultat : Alerte d'URGENCE VITALE -->
      <div *ngIf="result()?.emergency" class="emergency-container mt-4">
        <div class="emergency-card">
          <div class="emergency-header">
            <div class="emergency-icon-wrap">
              <svg class="icon-svg icon-xl text-white" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <span class="emergency-badge">PROTOCOLE D'URGENCE ACTIVÉ</span>
              <h2 class="emergency-title">URGENCE VITALE DÉTECTÉE</h2>
            </div>
          </div>

          <!-- Télémétrie de l'alerte -->
          <div class="triage-audit-pill">
            <svg class="icon-svg text-white" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Évaluation clinique | Temps de réponse : {{ result()?.processingTimeMs }} ms</span>
          </div>

          <p class="emergency-text">{{ result()?.advice }}</p>

          <div class="red-flags-card">
            <span class="red-flags-title">Signes de gravité clinique identifiés :</span>
            <ul class="red-flags-list">
              <li *ngFor="let flag of result()?.redFlagsDetected">
                <svg class="icon-svg text-white" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                <span>{{ flag }}</span>
              </li>
            </ul>
          </div>

          <div class="emergency-action-box">
            <p class="emergency-sub">Ne prenez pas le volant vous-même. Composez immédiatement :</p>
            <div class="emergency-buttons-row">
              <a href="tel:198" class="btn btn-emergency btn-call">
                <svg class="icon-svg" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span>Appeler le SAMU (198)</span>
              </a>
              <a href="tel:198" class="btn btn-outline-white btn-call">
                <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                <span>Protection Civile (198)</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Résultat : Orientation Médicale Standard -->
      <div *ngIf="result() && !result()?.emergency" class="card result-card mt-4">
        <div class="result-header">
          <div>
            <span class="badge badge-verified mb-1">
              <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              Orientation Clinique Validée
            </span>
            <h2 class="specialty-title">{{ result()?.recommendedSpecialty }}</h2>
          </div>
          <div class="confidence-box">
            <span class="confidence-label">Score de correspondance</span>
            <div class="confidence-val">{{ ((result()?.confidenceScore || 0) * 100).toFixed(0) }}%</div>
          </div>
        </div>

        <div class="triage-audit-pill-light mb-3">
          <svg class="icon-svg text-muted" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>Analyse médicale | Temps de réponse : {{ result()?.processingTimeMs }} ms</span>
        </div>

        <p class="advice-text">{{ result()?.advice }}</p>

        <div class="result-footer">
          <a routerLink="/doctors" class="btn btn-primary">
            <svg class="icon-svg" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span>Prendre rendez-vous en {{ result()?.recommendedSpecialty }}</span>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .triage-container {
      max-width: 820px;
      padding: 3.5rem 1.5rem;
    }
    .text-center { text-align: center; }
    .triage-status-wrapper {
      display: flex;
      justify-content: center;
    }
    .triage-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.4rem 1rem;
      border-radius: var(--radius-full);
      font-size: 0.85rem;
    }
    .triage-status-online {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .triage-status-fallback {
      background: #fffbeb;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .status-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      display: inline-block;
    }
    .ping-green {
      background-color: #10b981;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse-green 2s infinite;
    }
    .ping-amber {
      background-color: #f59e0b;
      box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
      animation: pulse-amber 2s infinite;
    }
    @keyframes pulse-green {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    @keyframes pulse-amber {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
    }
    .badge-tech {
      background: rgba(0, 0, 0, 0.08);
      padding: 0.15rem 0.45rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 700;
    }
    .page-title {
      font-size: 2.3rem;
      font-weight: 800;
      color: var(--color-dark);
      letter-spacing: -0.02em;
      margin: 0.5rem 0 0.75rem;
    }
    .subtitle {
      color: var(--color-muted);
      font-size: 1.05rem;
      line-height: 1.6;
      margin-bottom: 2.25rem;
    }
    .triage-card {
      padding: 2.25rem;
      border-radius: var(--radius-lg);
    }
    .triage-textarea {
      resize: vertical;
      min-height: 110px;
      line-height: 1.6;
    }
    .quick-examples {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.65rem;
      margin-bottom: 1.75rem;
    }
    .examples-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--color-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      background: var(--color-muted-light);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      padding: 0.4rem 0.85rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-foreground);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .chip:hover {
      background: #e2e8f0;
      transform: translateY(-1px);
    }
    .chip-danger {
      background: #fef2f2;
      border-color: #fee2e2;
      color: #b91c1c;
    }
    .triage-helper-note {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 0.85rem 1.15rem;
      border-radius: var(--radius-md);
      margin-top: 0.75rem;
      margin-bottom: 1.5rem;
      color: var(--color-muted);
      font-size: 0.85rem;
      line-height: 1.45;
    }
    .helper-icon { font-size: 1.15rem; line-height: 1; flex-shrink: 0; }
    .helper-text strong { color: var(--color-dark); }
    .btn-submit {
      width: 100%;
      padding: 0.95rem 1.5rem;
      font-size: 1.05rem;
      font-weight: 700;
      border-radius: var(--radius-md);
    }
    .alert-error {
      background: #fef2f2;
      border: 1px solid #fee2e2;
      color: #991b1b;
      padding: 0.85rem 1.25rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.9rem;
      font-weight: 500;
    }
    .emergency-container {
      animation: slideInUp 0.4s ease-out;
    }
    @keyframes slideInUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .emergency-card {
      background: linear-gradient(145deg, #b91c1c, #991b1b);
      color: white;
      border-radius: var(--radius-lg);
      padding: 2.25rem;
      box-shadow: 0 12px 30px rgba(185, 28, 28, 0.35);
      border: 2px solid #ef4444;
    }
    .emergency-header {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 1.25rem;
    }
    .emergency-icon-wrap {
      background: rgba(255, 255, 255, 0.2);
      border-radius: var(--radius-full);
      padding: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .emergency-badge {
      display: inline-block;
      background: white;
      color: #991b1b;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 0.25rem 0.65rem;
      border-radius: var(--radius-full);
      letter-spacing: 0.05em;
      margin-bottom: 0.35rem;
    }
    .emergency-title {
      font-size: 1.85rem;
      font-weight: 800;
      color: white;
      letter-spacing: -0.01em;
      margin: 0;
    }
    .triage-audit-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(0, 0, 0, 0.25);
      padding: 0.35rem 0.85rem;
      border-radius: var(--radius-md);
      font-size: 0.8rem;
      margin-bottom: 1.25rem;
    }
    .triage-audit-pill-light {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--color-muted-light);
      border: 1px solid var(--color-border);
      padding: 0.35rem 0.85rem;
      border-radius: var(--radius-md);
      font-size: 0.8rem;
      color: var(--color-muted);
    }
    .emergency-text {
      font-size: 1.15rem;
      line-height: 1.6;
      font-weight: 500;
      margin-bottom: 1.75rem;
      color: rgba(255, 255, 255, 0.95);
    }
    .red-flags-card {
      background: rgba(0, 0, 0, 0.18);
      border-radius: var(--radius-md);
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.75rem;
    }
    .red-flags-title {
      font-size: 0.9rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 0.75rem;
      color: #fca5a5;
    }
    .red-flags-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .red-flags-list li {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 0.95rem;
      font-weight: 600;
    }
    .emergency-action-box {
      border-top: 1px solid rgba(255, 255, 255, 0.25);
      padding-top: 1.5rem;
    }
    .emergency-sub {
      font-weight: 600;
      font-size: 1rem;
      margin-bottom: 1rem;
    }
    .emergency-buttons-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .btn-emergency {
      background: white;
      color: #991b1b;
      font-weight: 800;
      font-size: 1.05rem;
      padding: 0.85rem 1.75rem;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
    }
    .btn-emergency:hover {
      background: #f8fafc;
      transform: translateY(-2px);
    }
    .btn-outline-white {
      background: transparent;
      border: 2px solid white;
      color: white;
      font-weight: 700;
      padding: 0.85rem 1.75rem;
    }
    .btn-outline-white:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }
    .result-card {
      padding: 2.25rem;
      border-radius: var(--radius-lg);
      border-top: 4px solid var(--color-primary);
    }
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    .badge-verified {
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
    }
    .specialty-title {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--color-dark);
      margin: 0.25rem 0 0;
    }
    .confidence-box {
      text-align: right;
      background: #f5f3ff;
      border: 1px solid #ede9fe;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-md);
    }
    .confidence-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #7c3aed;
      text-transform: uppercase;
    }
    .confidence-val {
      font-size: 1.25rem;
      font-weight: 800;
      color: #6d28d9;
    }
    .advice-text {
      font-size: 1.1rem;
      color: var(--color-foreground);
      line-height: 1.7;
      margin-bottom: 2rem;
    }
    .result-footer {
      border-top: 1px solid var(--color-border);
      padding-top: 1.5rem;
    }
  `]
})
export class TriageComponent implements OnInit {
  private readonly triageService = inject(TriageService);

  symptoms = '';
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  result = signal<TriageResponse | null>(null);
  triageHealth = signal<TriageHealthStatus | null>(null);

  ngOnInit(): void {
    this.checkHealth();
  }

  checkHealth(): void {
    this.triageService.getHealth().subscribe({
      next: (status) => this.triageHealth.set(status),
      error: () => this.triageHealth.set({ status: 'DOWN', engine: 'Moteur local' })
    });
  }

  analyze(): void {
    if (!this.symptoms.trim()) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.result.set(null);

    this.triageService.analyzeSymptoms({ symptoms: this.symptoms }).subscribe({
      next: (res) => {
        this.result.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Une erreur est survenue lors de l\'analyse clinique. Veuillez réessayer.');
        this.loading.set(false);
      }
    });
  }
}
