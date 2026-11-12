import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DoctorService } from '../../core/services/doctor.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { DoctorProfile } from '../../core/models/doctor.model';
import { Appointment, AvailabilitySlot, ConsultationType } from '../../core/models/appointment.model';
import { PaymentModalComponent } from '../../shared/components/payment-modal/payment-modal.component';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaymentModalComponent],
  template: `
    <div class="container doctor-page">
      <div class="header-section">
        <span class="badge badge-info mb-1">
          <svg class="icon-svg" viewBox="0 0 24 24"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
          Professionnels de Santé Conventionnés en Tunisie
        </span>
        <h1 class="page-title">Annuaire Médical & Réservation de Créneaux</h1>
        <p class="subtitle">Trouvez un médecin agréé selon son gouvernorat et sa spécialité, consultez ses disponibilités et prenez rendez-vous.</p>
      </div>

      <!-- Barre de Recherche par Gouvernorat & Spécialité -->
      <div class="card search-card">
        <div class="search-filters-grid">
          <!-- Gouvernorat -->
          <div class="form-group mb-0">
            <label class="form-label">Gouvernorat</label>
            <select class="form-control" [(ngModel)]="selectedGovernorate" (change)="loadDoctors()">
              <option value="TOUS">Tous les gouvernorats (24)</option>
              <option *ngFor="let g of governorates" [value]="g">{{ g }}</option>
            </select>
          </div>

          <!-- Spécialité -->
          <div class="form-group mb-0">
            <label class="form-label">Spécialité Médicale</label>
            <select class="form-control" [(ngModel)]="selectedSpecialty" (change)="loadDoctors()">
              <option value="TOUTES">Toutes les spécialités</option>
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

          <!-- Actions -->
          <div class="search-btn-wrap">
            <button class="btn btn-primary w-100" (click)="loadDoctors()">
              <svg class="icon-svg" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span>Filtrer les médecins</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Messages de réservation -->
      <div *ngIf="bookingMessage()" class="alert-success mt-3">
        <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        <span>{{ bookingMessage() }}</span>
      </div>

      <div *ngIf="bookingError()" class="alert-error mt-3">
        <svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>{{ bookingError() }}</span>
      </div>

      <!-- État chargement & vide -->
      <div *ngIf="loading()" class="text-center py-5">
        <p class="text-muted">Recherche des praticiens disponibles en cours...</p>
      </div>

      <div *ngIf="!loading() && doctors().length === 0" class="text-center py-5 card">
        <p class="text-muted">Aucun praticien trouvé pour les critères sélectionnés.</p>
        <button class="btn btn-outline mt-2" (click)="resetFilters()">Réinitialiser les filtres</button>
      </div>

      <!-- Grille des Médecins -->
      <div class="doctors-grid mt-4">
        <div *ngFor="let doctor of doctors()" class="card doctor-card">
          <div class="doctor-top">
            <div class="doctor-avatar">
              <svg class="icon-svg icon-lg text-primary" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div class="doctor-meta">
              <div class="badge-row">
                <span class="badge badge-verified">
                  <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  Certifié #{{ doctor.medicalCouncilId }}
                </span>
                <span *ngIf="doctor.teleconsultationEnabled" class="badge badge-info">
                  <svg class="icon-svg" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                  Téléconsultation
                </span>
              </div>
              <h3 class="doctor-name">{{ doctor.fullName || ('Dr. ' + doctor.medicalCouncilId) }}</h3>
              <p class="doctor-specs">{{ doctor.specialties.join(' • ') }}</p>

              <!-- Localisation du cabinet (Google Maps) -->
              <div class="doctor-location-info">
                <a
                  [href]="getDirectionsUrl(doctor)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="doctor-location-pill"
                  title="Ouvrir l'adresse exacte et l'itinéraire GPS dans Google Maps"
                >
                  <svg class="icon-svg icon-pin text-primary" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span class="location-text">
                    <strong *ngIf="doctor.address.street">{{ doctor.address.street }}, </strong>
                    {{ doctor.address.city }} ({{ doctor.address.governorate }})
                  </span>
                  <span class="map-link-badge">
                    <span>Itinéraire GPS</span>
                    <svg class="icon-svg icon-xs" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </span>
                </a>
              </div>
            </div>
          </div>

          <p class="doctor-desc">{{ doctor.presentation || 'Praticien conventionné agréé par le Conseil National de l\\'Ordre des Médecins de Tunisie.' }}</p>

          <!-- Grille des Tarifs -->
          <div class="doctor-fees-grid">
            <div class="fee-card">
              <span class="fee-type">En Cabinet</span>
              <strong class="fee-amount">{{ doctor.consultationFee.inPerson }} {{ doctor.consultationFee.currency }}</strong>
            </div>
            <div *ngIf="doctor.teleconsultationEnabled" class="fee-card fee-card-tele">
              <span class="fee-type">Téléconsultation</span>
              <strong class="fee-amount text-accent">{{ doctor.consultationFee.teleconsultation }} {{ doctor.consultationFee.currency }}</strong>
            </div>
          </div>

          <!-- Section Disponibilités & Réservation (Réservée aux patients) -->
          <div class="slots-section mt-3">
            <ng-container *ngIf="!authService.isDoctor() && !authService.isAdmin(); else restrictedBooking">
              <button class="btn btn-outline w-100" (click)="toggleSlots(doctor.id)">
                <svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span>{{ selectedDoctorId() === doctor.id ? 'Masquer le planning' : 'Prendre Rendez-vous / Consulter créneaux' }}</span>
              </button>
            </ng-container>
            <ng-template #restrictedBooking>
              <div class="restricted-info-badge">
                <svg class="icon-svg text-muted" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{{ authService.isAdmin() ? 'Mode Supervision Admin' : 'Compte Praticien (Prise de RDV réservée aux patients)' }}</span>
              </div>
            </ng-template>

            <div *ngIf="selectedDoctorId() === doctor.id" class="slots-panel mt-3">
              <h4 class="slots-panel-title">Créneaux vérifiés pour les 7 prochains jours :</h4>

              <div *ngIf="slotsLoading()" class="text-sm text-muted py-2">Chargement du calendrier en temps réel...</div>

              <div *ngIf="!slotsLoading() && slots().length === 0" class="text-sm text-muted py-2">
                Aucune plage horaire disponible actuellement chez ce praticien.
              </div>

              <div class="slots-grid">
                <button
                  *ngFor="let slot of slots()"
                  class="slot-btn"
                  [class.slot-btn-selected]="selectedSlot()?.id === slot.id"
                  (click)="selectSlot(slot)"
                >
                  <span class="slot-time">{{ formatSlot(slot.startTime) }}</span>
                  <span class="slot-badge" [class.slot-badge-tele]="slot.consultationType === 'TELECONSULTATION'" [class.slot-badge-cab]="slot.consultationType === 'IN_PERSON'">{{ slot.consultationType === 'TELECONSULTATION' ? 'Vidéo' : (slot.consultationType === 'BOTH' ? 'Cabinet / Vidéo' : 'Cabinet') }}</span>
                </button>
              </div>

              <!-- Options du rendez-vous sélectionné adaptées au type exact du créneau -->
              <div *ngIf="selectedSlot()" class="booking-confirm-box mt-3">

                <!-- CAS 1 : Créneau EXCLUSIVEMENT Présentiel en Cabinet (Aucun bouton radio inutile) -->
                <div *ngIf="selectedSlot()?.consultationType === 'IN_PERSON'">
                  <div class="d-flex align-items-center gap-2 mb-2 text-success font-bold">
                    <svg class="icon-svg" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    <span>Consultation Présentielle en Cabinet</span>
                  </div>
                  <div class="payment-policy-box p-3 mb-3 rounded policy-cabinet">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <span class="text-sm text-muted">Honoraires :</span>
                      <strong class="text-base text-dark">{{ doctor.consultationFee.inPerson }} DT</strong>
                    </div>
                    <div class="text-xs text-success">
                      <strong>Règlement direct en espèces sur place au cabinet.</strong> Aucun paiement en ligne requis.
                    </div>
                  </div>
                  <button class="btn btn-primary w-100" (click)="bookSelectedSlot()">
                    Confirmer le Rendez-vous au Cabinet ({{ doctor.consultationFee.inPerson }} DT en espèces)
                  </button>
                </div>

                <!-- CAS 2 : Créneau EXCLUSIVEMENT Téléconsultation Vidéo -->
                <div *ngIf="selectedSlot()?.consultationType === 'TELECONSULTATION'">
                  <div class="d-flex align-items-center gap-2 mb-2 text-primary font-bold">
                    <svg class="icon-svg" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                    <span>Téléconsultation Médicale Vidéo</span>
                  </div>
                  <div class="payment-policy-box p-3 mb-3 rounded policy-tele">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <span class="text-sm text-muted">Honoraires :</span>
                      <strong class="text-base text-dark">{{ doctor.consultationFee.teleconsultation }} DT</strong>
                    </div>
                    <div class="text-xs text-primary">
                      <strong>Paiement en ligne obligatoire.</strong> Règlement sécurisé requis pour débloquer votre accès à la salle vidéo WebRTC.
                    </div>
                  </div>
                  <button class="btn btn-primary w-100" (click)="bookSelectedSlot()">
                    Payer en Ligne & Confirmer ({{ doctor.consultationFee.teleconsultation }} DT)
                  </button>
                </div>

                <!-- CAS 3 : Créneau mixte (BOTH) : Choix par boutons radio -->
                <div *ngIf="!selectedSlot()?.consultationType || selectedSlot()?.consultationType === 'BOTH'">
                  <div class="form-group mb-2">
                    <label class="form-label font-bold">Format de consultation au choix :</label>
                    <div class="type-selector">
                      <label class="radio-label" [class.active-type]="consultationType === 'IN_PERSON'">
                        <input type="radio" [(ngModel)]="consultationType" value="IN_PERSON" name="ctype" />
                        <div>
                          <strong>Présentiel en Cabinet</strong> ({{ doctor.consultationFee.inPerson }} DT)
                          <div class="text-xs text-muted">Paiement direct en espèces sur place</div>
                        </div>
                      </label>
                      <label *ngIf="doctor.teleconsultationEnabled" class="radio-label" [class.active-type]="consultationType === 'TELECONSULTATION'">
                        <input type="radio" [(ngModel)]="consultationType" value="TELECONSULTATION" name="ctype" />
                        <div>
                          <strong>Téléconsultation Vidéo</strong> ({{ doctor.consultationFee.teleconsultation }} DT)
                          <div class="text-xs text-muted">Paiement en ligne obligatoire</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div class="payment-policy-box p-2 mb-3 rounded" [class.policy-tele]="consultationType === 'TELECONSULTATION'" [class.policy-cabinet]="consultationType !== 'TELECONSULTATION'">
                    <div *ngIf="consultationType === 'TELECONSULTATION'" class="d-flex align-items-center gap-2 text-sm text-primary">
                      <svg class="icon-svg" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                      <span><strong>Téléconsultation :</strong> Le paiement de <strong>{{ doctor.consultationFee.teleconsultation }} DT</strong> s'effectue en ligne pour débloquer la vidéo.</span>
                    </div>
                    <div *ngIf="consultationType !== 'TELECONSULTATION'" class="d-flex align-items-center gap-2 text-sm text-success">
                      <svg class="icon-svg" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>
                      <span><strong>Consultation au cabinet :</strong> Aucun paiement en ligne. Vous réglerez <strong>{{ doctor.consultationFee.inPerson }} DT en espèces</strong> sur place.</span>
                    </div>
                  </div>

                  <button class="btn btn-primary w-100" (click)="bookSelectedSlot()">
                    <span *ngIf="consultationType === 'TELECONSULTATION'">Payer en Ligne & Confirmer ({{ doctor.consultationFee.teleconsultation }} DT)</span>
                    <span *ngIf="consultationType !== 'TELECONSULTATION'">Confirmer le RDV au Cabinet (Règlement {{ doctor.consultationFee.inPerson }} DT en espèces)</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de Paiement Sécurisé Téléconsultation -->
      <app-payment-modal
        *ngIf="pendingAppointmentForPayment()"
        [appointment]="pendingAppointmentForPayment()!"
        (paymentSuccess)="onPaymentSuccess($event)"
        (cancelled)="pendingAppointmentForPayment.set(null)"
      ></app-payment-modal>
    </div>
  `,
  styles: [`
    .doctor-page { padding: 2.5rem 1rem; }
    .header-section { margin-bottom: 2rem; }
    .page-title { font-size: 2rem; font-weight: 800; color: var(--color-dark); margin-bottom: 0.5rem; }
    .subtitle { color: var(--color-muted); font-size: 1rem; }
    
    .search-card { padding: 1.5rem; margin-bottom: 2rem; border-radius: var(--radius-lg); }
    .search-filters-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 200px;
      gap: 1rem;
      align-items: flex-end;
    }
    @media (max-width: 768px) {
      .search-filters-grid { grid-template-columns: 1fr; }
    }
    .search-btn-wrap { display: flex; align-items: flex-end; }

    .doctors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
      gap: 1.75rem;
    }
    .doctor-card {
      padding: 1.75rem;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      overflow: hidden;
      border: 1px solid var(--color-border);
      background: white;
      transition: all 0.25s ease;
    }
    .doctor-card:hover {
      box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.12), 0 8px 10px -6px rgba(2, 132, 199, 0.05);
      border-color: #93c5fd;
      transform: translateY(-2px);
    }
    .slots-section {
      width: 100%;
      margin-top: 1rem;
      box-sizing: border-box;
    }
    .slots-section .btn {
      width: 100%;
      box-sizing: border-box;
      white-space: normal;
      text-align: center;
      line-height: 1.35;
      padding: 0.75rem 1rem;
      font-size: 0.9rem;
      font-weight: 700;
    }
    .doctor-top { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .doctor-avatar {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #e0f2fe;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .doctor-meta { flex: 1; min-width: 0; overflow-wrap: anywhere; word-break: break-word; }
    .badge-row { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.4rem; }
    .badge-verified { background: #dcfce7; color: #166534; font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 4px; }
    .doctor-name { font-size: 1.15rem; font-weight: 700; margin: 0 0 0.2rem 0; color: var(--color-dark); overflow-wrap: anywhere; }
    .doctor-specs { font-size: 0.85rem; color: var(--color-primary); font-weight: 600; margin: 0 0 0.4rem 0; overflow-wrap: anywhere; }
    
    .doctor-location-info {
      margin: 0.4rem 0 0.75rem;
      min-width: 0;
      max-width: 100%;
    }
    .doctor-location-pill {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      flex-wrap: wrap;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 0.6rem 0.9rem;
      border-radius: var(--radius-md);
      color: var(--color-dark);
      text-decoration: none;
      font-size: 0.85rem;
      transition: all 0.2s ease;
      cursor: pointer;
      width: 100%;
      max-width: 100%;
      overflow: hidden;
      box-sizing: border-box;
    }
    .doctor-location-pill:hover {
      background: #dbeafe;
      border-color: var(--color-primary);
      box-shadow: 0 2px 8px rgba(2, 132, 199, 0.2);
      transform: translateY(-1px);
    }
    .icon-pin {
      width: 17px;
      height: 17px;
      flex-shrink: 0;
      color: var(--color-primary);
    }
    .location-text {
      color: var(--color-dark);
      line-height: 1.35;
      flex: 1 1 160px;
      min-width: 0;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .location-text strong {
      color: var(--color-dark);
      font-weight: 700;
    }
    .map-link-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: white;
      border: 1px solid #93c5fd;
      color: var(--color-primary);
      font-size: 0.74rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: var(--radius-full);
      flex-shrink: 0;
    }

    .doctor-desc {
      font-size: 0.85rem;
      color: var(--color-dark);
      line-height: 1.45;
      margin-bottom: 1rem;
    }

    .doctor-fees-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      background: var(--color-muted-light);
      padding: 0.75rem;
      border-radius: var(--radius-md);
      margin-bottom: 1rem;
    }
    .fee-card { display: flex; flex-direction: column; gap: 0.15rem; }
    .fee-type { font-size: 0.75rem; color: var(--color-muted); font-weight: 600; }
    .fee-amount { font-size: 1.05rem; font-weight: 800; color: var(--color-dark); }
    .text-accent { color: #0284c7; }

    .slots-panel {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-md);
      padding: 1rem;
    }
    .slots-panel-title { font-size: 0.85rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--color-dark); }
    .slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 0.5rem;
      max-height: 220px;
      overflow-y: auto;
    }
    .slot-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.5rem;
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .slot-btn:hover { border-color: var(--color-primary); background: #eff6ff; }
    .slot-btn-selected { border-color: var(--color-primary); background: #dbeafe; box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2); }
    .slot-time { font-size: 0.82rem; font-weight: 700; color: var(--color-dark); }
    .slot-badge { font-size: 0.7rem; color: var(--color-muted); }

    .booking-confirm-box {
      background: white;
      border: 1px solid #e2e8f0;
      padding: 0.9rem;
      border-radius: var(--radius-sm);
    }
    .type-selector { display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.3rem; }
    .radio-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer; }

    .restricted-info-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f1f5f9;
      padding: 0.6rem 0.8rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 600;
    }
    .alert { padding: 0.8rem 1rem; border-radius: var(--radius-md); font-size: 0.9rem; font-weight: 600; }
    .alert-success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fee2e2; }
    .policy-tele { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; }
    .policy-cabinet { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
    .slot-badge-tele { color: #2563eb !important; font-weight: 700 !important; }
    .slot-badge-cab { color: #16a34a !important; font-weight: 700 !important; }
    .font-bold { font-weight: 700; }
  `]
})
export class DoctorListComponent implements OnInit {
  private readonly doctorService = inject(DoctorService);
  private readonly appointmentService = inject(AppointmentService);
  public readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly governorates: string[] = [
    'Manouba', 'Tunis', 'Ariana', 'Ben Arous', 'Nabeul', 'Zaghouan',
    'Bizerte', 'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Sousse',
    'Monastir', 'Mahdia', 'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid',
    'Gabès', 'Médenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kébili'
  ];

  selectedGovernorate = 'TOUS';
  selectedSpecialty = 'TOUTES';

  doctors = signal<DoctorProfile[]>([]);
  loading = signal(false);

  selectedDoctorId = signal<string | null>(null);
  slots = signal<AvailabilitySlot[]>([]);
  slotsLoading = signal(false);
  selectedSlot = signal<AvailabilitySlot | null>(null);
  consultationType: ConsultationType = 'IN_PERSON';

  bookingMessage = signal<string | null>(null);
  bookingError = signal<string | null>(null);
  pendingAppointmentForPayment = signal<Appointment | null>(null);

  ngOnInit(): void {
    this.loadDoctors();
  }

  loadDoctors(): void {
    this.loading.set(true);
    const gov = this.selectedGovernorate !== 'TOUS' ? this.selectedGovernorate : undefined;
    const spec = this.selectedSpecialty !== 'TOUTES' ? this.selectedSpecialty : undefined;

    this.doctorService.searchDoctors(gov, spec).subscribe({
      next: (res) => {
        this.doctors.set(res.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  resetFilters(): void {
    this.selectedGovernorate = 'TOUS';
    this.selectedSpecialty = 'TOUTES';
    this.loadDoctors();
  }

  getDirectionsUrl(doctor: DoctorProfile): string {
    const street = (doctor.address?.street || '').trim();
    const city = (doctor.address?.city || '').trim();
    const gov = (doctor.address?.governorate || '').trim();

    // Pour Bardo Center : cibler directement le bâtiment sur l'Avenue Habib Bourguiba
    // pour éviter que Google Maps ne confonde avec d'autres praticiens ou commerces enregistrés dans le même centre (ex: Dr Fedra Bennour)
    if (/bardo\s*cent(re|er)/i.test(street)) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('Bardo Center, Avenue Habib Bourguiba, Le Bardo, Tunisie')}`;
    }

    const parts: string[] = [];
    if (street) parts.push(street);
    if (city && !parts.some(p => p.toLowerCase().includes(city.toLowerCase()))) parts.push(city);
    if (gov && !parts.some(p => p.toLowerCase().includes(gov.toLowerCase()))) parts.push(gov);
    parts.push('Tunisie');

    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(parts.join(', '))}`;
  }

  toggleSlots(doctorId: string): void {
    if (this.selectedDoctorId() === doctorId) {
      this.selectedDoctorId.set(null);
      return;
    }
    this.selectedDoctorId.set(doctorId);
    this.selectedSlot.set(null);
    this.slotsLoading.set(true);

    const now = new Date().toISOString();
    const future = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    this.appointmentService.getDoctorSlots(doctorId, now, future).subscribe({
      next: (res) => {
        this.slots.set(res);
        this.slotsLoading.set(false);
      },
      error: () => this.slotsLoading.set(false)
    });
  }

  selectSlot(slot: AvailabilitySlot): void {
    this.selectedSlot.set(slot);
    if (slot.consultationType === 'IN_PERSON') {
      this.consultationType = 'IN_PERSON';
    } else if (slot.consultationType === 'TELECONSULTATION') {
      this.consultationType = 'TELECONSULTATION';
    } else {
      this.consultationType = 'IN_PERSON';
    }
  }

  formatSlot(iso: string): string {
    const d = new Date(iso);
    return `${d.toLocaleDateString('fr-TN', { weekday: 'short', day: 'numeric', month: 'short' })} ${d.getHours()}h${d.getMinutes().toString().padStart(2, '0')}`;
  }

  bookSelectedSlot(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.authService.isDoctor() || this.authService.isAdmin()) {
      this.bookingError.set('La prise de rendez-vous est exclusivement réservée aux comptes Patients.');
      return;
    }

    const slot = this.selectedSlot();
    if (!slot) return;

    this.bookingMessage.set(null);
    this.bookingError.set(null);

    this.appointmentService.bookSlot({
      slotId: slot.id,
      type: this.consultationType
    }).subscribe({
      next: (apt) => {
        if (this.consultationType === 'TELECONSULTATION') {
          this.pendingAppointmentForPayment.set(apt);
        } else {
          this.bookingMessage.set(`Votre rendez-vous au cabinet a été confirmé avec succès ! Règlement de ${apt.doctorSnapshot?.fee || 50} DT en espèces directement sur place au cabinet.`);
          this.selectedDoctorId.set(null);
          this.selectedSlot.set(null);
        }
      },
      error: (err) => {
        this.bookingError.set(err.error?.message || 'Ce créneau vient d\'être réservé par un autre patient.');
      }
    });
  }

  onPaymentSuccess(tx: any): void {
    this.pendingAppointmentForPayment.set(null);
    this.bookingMessage.set(`Téléconsultation réglée avec succès (${tx.amount} DT - Réf: ${tx.transactionReference}) ! Votre rendez-vous est confirmé et votre accès vidéo est débloqué.`);
    this.selectedDoctorId.set(null);
    this.selectedSlot.set(null);
  }
}
