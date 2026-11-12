import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../core/services/payment.service';
import { Appointment } from '../../../core/models/appointment.model';
import { PaymentMethod, PaymentTransaction } from '../../../core/models/payment.model';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-card">
        <!-- En-tête de la Modale -->
        <div class="modal-header">
          <div>
            <span class="badge badge-secure">
              <svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Paiement Sécurisé • maw3ed.tn
            </span>
            <h2 class="modal-title mt-1">Règlement de la Téléconsultation</h2>
            <p class="modal-sub">Réglez vos honoraires en ligne pour débloquer la consultation vidéo</p>
          </div>
          <button type="button" class="close-btn" (click)="close()" title="Fermer">
            <svg class="icon-svg" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- État : Paiement Réussi -->
        <div *ngIf="paymentDone()" class="success-screen text-center py-3">
          <div class="success-icon-wrap mb-3">
            <svg class="icon-svg icon-xxl text-success" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h3 class="success-title mb-2">Paiement Validé avec Succès !</h3>
          <p class="success-desc mb-3">
            La transaction de <strong>{{ getAmount() }} DT</strong> a été confirmée (Réf: <code>{{ completedTx()?.transactionReference }}</code>).
          </p>
          <div class="alert-info text-start mb-4">
            <p class="mb-0 text-sm">
              Votre rendez-vous est maintenant <strong>CONFIRMÉ</strong>. L'accès à la salle vidéo WebRTC a été débloqué dans votre espace.
            </p>
          </div>
          <button type="button" class="btn btn-primary w-100" (click)="finish()">
            Accéder à la Consultation Vidéo
          </button>
        </div>

        <!-- État : Formulaire de Paiement -->
        <div *ngIf="!paymentDone()">
          <!-- Récapitulatif Consultation -->
          <div class="recap-box mb-3">
            <div class="recap-row">
              <span class="text-muted">Praticien :</span>
              <strong>{{ appointment.doctorSnapshot?.fullName || 'Médecin' }}</strong>
            </div>
            <div class="recap-row">
              <span class="text-muted">Spécialité :</span>
              <span>{{ appointment.doctorSnapshot?.specialty || 'Généraliste' }}</span>
            </div>
            <div class="recap-row">
              <span class="text-muted">Date & Heure :</span>
              <span>{{ formatDateTime(appointment.scheduledStartTime) }}</span>
            </div>
            <div class="recap-row price-row">
              <span>Montant à régler :</span>
              <strong class="total-price">{{ getAmount() }} DT</strong>
            </div>
          </div>

          <!-- Choix du Mode de Paiement (Passerelles Tunisiennes) -->
          <div class="methods-section mb-3">
            <label class="section-label">Sélectionnez le mode de paiement en ligne :</label>
            <div class="methods-grid">
              <div
                class="method-card"
                [class.active]="selectedMethod === 'CARTE_BANCAIRE'"
                (click)="selectedMethod = 'CARTE_BANCAIRE'"
              >
                <div class="method-icon-box">
                  <svg class="icon-svg text-primary" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <div class="method-info">
                  <strong>Carte Bancaire</strong>
                  <span class="method-sub">CIB • Visa • Mastercard</span>
                </div>
              </div>

              <div
                class="method-card"
                [class.active]="selectedMethod === 'KONNECT'"
                (click)="selectedMethod = 'KONNECT'"
              >
                <div class="method-icon-box bg-konnect">
                  <svg class="icon-svg text-konnect" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </div>
                <div class="method-info">
                  <strong>Konnect</strong>
                  <span class="method-sub">Passerelle Tunisienne</span>
                </div>
              </div>

              <div
                class="method-card"
                [class.active]="selectedMethod === 'FLOUCI'"
                (click)="selectedMethod = 'FLOUCI'"
              >
                <div class="method-icon-box bg-flouci">
                  <svg class="icon-svg text-flouci" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                </div>
                <div class="method-info">
                  <strong>Flouci</strong>
                  <span class="method-sub">Wallet & QR Code</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Informations de paiement -->
          <div class="security-banner mb-4">
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge badge-info-sm">Paiement Chiffré</span>
              <strong class="text-xs text-dark">Validation Instantanée</strong>
            </div>
            <p class="text-xs text-muted mb-0">
              Transaction protégée via les passerelles tunisiennes agréées (CIB, Konnect et Flouci). Confirmez votre règlement pour activer votre accès à la salle vidéo.
            </p>
          </div>

          <!-- Bouton d'action principal -->
          <div class="action-section">
            <button
              type="button"
              class="btn btn-primary btn-pay w-100"
              [disabled]="processing()"
              (click)="processPayment()"
            >
              <svg *ngIf="!processing()" class="icon-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              <span *ngIf="processing()">Validation de la transaction en cours...</span>
              <span *ngIf="!processing()">Confirmer et Payer ({{ getAmount() }} DT)</span>
            </button>

            <button type="button" class="btn btn-outline btn-cancel w-100 mt-2" [disabled]="processing()" (click)="close()">
              Annuler
            </button>
          </div>

          <div *ngIf="errorMessage()" class="alert-error mt-3">
            <svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{{ errorMessage() }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1.25rem;
    }
    .modal-card {
      background: #ffffff; border-radius: 20px; width: 100%; max-width: 520px;
      padding: 2.25rem; box-shadow: var(--shadow-modal);
      animation: modal-pop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid var(--color-border);
    }
    @keyframes modal-pop {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
    .badge-secure {
      background: #eff6ff; color: #1d4ed8; font-size: 0.75rem; padding: 0.25rem 0.65rem;
      border-radius: var(--radius-full); font-weight: 700; border: 1px solid #bfdbfe;
      display: inline-flex; align-items: center; gap: 0.35rem;
    }
    .modal-title { font-size: 1.35rem; font-weight: 800; color: var(--color-dark); letter-spacing: -0.01em; }
    .modal-sub { color: var(--color-muted); font-size: 0.85rem; margin-top: 0.15rem; margin-bottom: 0; }
    .close-btn {
      background: var(--color-muted-light); border: none; width: 34px; height: 34px;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: var(--color-muted); transition: all var(--transition-fast);
    }
    .close-btn:hover { background: #e2e8f0; color: var(--color-dark); }
    .recap-box {
      background: var(--color-primary-surface); border: 1px solid #bae6fd; border-radius: var(--radius-md);
      padding: 1rem 1.25rem;
    }
    .recap-row { display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.35rem; }
    .price-row {
      border-top: 1px solid #bae6fd; padding-top: 0.55rem; margin-top: 0.55rem;
      margin-bottom: 0; font-size: 1rem; font-weight: 700;
    }
    .total-price { color: var(--color-primary); font-size: 1.3rem; }
    .section-label { display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--color-dark); }
    .methods-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.6rem; }
    .method-card {
      border: 2px solid var(--color-border); border-radius: var(--radius-md); padding: 0.75rem 0.6rem;
      cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.4rem;
      transition: all var(--transition-fast); background: #ffffff;
    }
    .method-card:hover { border-color: var(--color-primary); background: var(--color-primary-surface); }
    .method-card.active { border-color: var(--color-primary); background: var(--color-primary-surface); box-shadow: 0 0 0 1px var(--color-primary); }
    .method-icon-box {
      width: 36px; height: 36px; border-radius: 8px; background: var(--color-primary-light);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .bg-konnect { background: #ede9fe; }
    .text-konnect { color: #7c3aed; }
    .bg-flouci { background: #ffedd5; }
    .text-flouci { color: #ea580c; }
    .method-info strong { display: block; font-size: 0.8rem; line-height: 1.2; color: var(--color-dark); }
    .method-sub { font-size: 0.7rem; color: var(--color-muted); }
    .security-banner {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: var(--radius-md); padding: 0.85rem 1rem;
    }
    .badge-info-sm {
      background: #e0f2fe; color: #0284c7; font-size: 0.7rem; padding: 0.15rem 0.45rem;
      border-radius: var(--radius-sm); font-weight: 700;
    }
    .btn-pay { padding: 0.85rem; font-size: 1rem; font-weight: 700; border-radius: var(--radius-md); }
    .btn-cancel { padding: 0.5rem; font-size: 0.88rem; }
    .w-100 { width: 100%; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mb-0 { margin-bottom: 0; }
    .mb-1 { margin-bottom: 0.25rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-4 { margin-bottom: 1rem; }
    .text-xs { font-size: 0.78rem; line-height: 1.4; }
    .text-sm { font-size: 0.85rem; }
    .success-icon-wrap {
      width: 64px; height: 64px; border-radius: 50%; background: #dcfce7;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .icon-xxl { width: 38px; height: 38px; stroke-width: 2.2; }
    .success-title { font-size: 1.3rem; font-weight: 800; color: #166534; }
    .success-desc { font-size: 0.9rem; color: #334155; }
    .alert-info { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: var(--radius-md); padding: 0.75rem 1rem; color: #1e40af; }
  `]
})
export class PaymentModalComponent implements OnInit {
  @Input({ required: true }) appointment!: Appointment;
  @Output() paymentSuccess = new EventEmitter<PaymentTransaction>();
  @Output() paymentCompleted = new EventEmitter<PaymentTransaction>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  private readonly paymentService = inject(PaymentService);

  selectedMethod: PaymentMethod = 'CARTE_BANCAIRE';
  processing = signal(false);
  paymentDone = signal(false);
  completedTx = signal<PaymentTransaction | null>(null);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    if (this.appointment.paymentMethod && this.appointment.paymentMethod !== 'CASH_AT_CABINET') {
      this.selectedMethod = this.appointment.paymentMethod;
    }
  }

  getAmount(): number {
    return this.appointment.doctorSnapshot?.fee || 50;
  }

  formatDateTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('fr-TN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  processPayment(): void {
    this.processing.set(true);
    this.errorMessage.set(null);

    this.paymentService.initiatePayment({
      appointmentId: this.appointment.id,
      paymentMethod: this.selectedMethod
    }).subscribe({
      next: (tx) => {
        this.paymentService.processPayment(tx.id, {
          paymentMethod: this.selectedMethod,
          cardHolderName: 'CLIENT MAW3ED',
          cardNumber: '4242 4242 4242 4242',
          expiryMonth: '12',
          expiryYear: '28',
          cvv: '123'
        }).subscribe({
          next: (paidTx) => {
            this.processing.set(false);
            this.completedTx.set(paidTx);
            this.paymentDone.set(true);
          },
          error: (err) => {
            this.processing.set(false);
            this.errorMessage.set(err.error?.message || 'Échec de la validation de paiement.');
          }
        });
      },
      error: (err) => {
        this.processing.set(false);
        this.errorMessage.set(err.error?.message || 'Impossible d\'initier le paiement en ligne.');
      }
    });
  }

  finish(): void {
    const tx = this.completedTx();
    if (tx) {
      this.paymentSuccess.emit(tx);
      this.paymentCompleted.emit(tx);
    }
    this.close();
  }

  close(): void {
    this.cancelled.emit();
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      if (this.paymentDone()) {
        this.finish();
      } else {
        this.close();
      }
    }
  }
}
