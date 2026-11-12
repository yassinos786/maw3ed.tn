import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppointmentService } from '../../core/services/appointment.service';
import { DoctorService } from '../../core/services/doctor.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { Appointment, AvailabilitySlot, ConsultationType } from '../../core/models/appointment.model';
import { DoctorProfile } from '../../core/models/doctor.model';
import { PaymentModalComponent } from '../../shared/components/payment-modal/payment-modal.component';

type DoctorTab = 'APPOINTMENTS' | 'SLOTS' | 'PROFILE';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PaymentModalComponent],
  template: `
    <div class="container appointments-container">
      <!-- En-tête Principal -->
      <div class="page-header">
        <div>
          <span class="badge badge-info mb-1">
            <svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {{ authService.isDoctor() ? 'Cabinet Virtuel & Agenda Praticien' : 'Espace Consultations' }}
          </span>
          <h1 class="page-title">{{ authService.isDoctor() ? 'Mon Agenda & Espace Praticien' : 'Mes Rendez-vous Médicaux' }}</h1>
          <p class="subtitle">
            {{ authService.isDoctor() ? 'Gestion de vos consultations, planification des disponibilités et configuration de vos honoraires' : 'Historique clinique, état des règlements et accès direct aux téléconsultations' }}
          </p>
        </div>

        <a *ngIf="!authService.isDoctor() && !authService.isAdmin()" routerLink="/doctors" class="btn btn-primary">
          <svg class="icon-svg" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Nouveau Rendez-vous</span>
        </a>
      </div>

      <!-- Navigation par Onglets Métier pour le Médecin -->
      <div class="doctor-tabs mb-4" *ngIf="authService.isDoctor()">
        <button
          class="doc-tab-btn"
          [class.active]="doctorActiveTab === 'APPOINTMENTS'"
          (click)="doctorActiveTab = 'APPOINTMENTS'"
        >
          <svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>Consultations Patients</span>
          <span class="tab-badge" *ngIf="appointments().length > 0">{{ appointments().length }}</span>
        </button>

        <button
          class="doc-tab-btn"
          [class.active]="doctorActiveTab === 'SLOTS'"
          (click)="selectSlotsTab()"
        >
          <svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>Gérer mes Plages Horaires & Disponibilités</span>
          <span class="tab-badge bg-primary-light" *ngIf="mySlots().length > 0">{{ mySlots().length }}</span>
        </button>

        <button
          class="doc-tab-btn"
          [class.active]="doctorActiveTab === 'PROFILE'"
          (click)="selectProfileTab()"
        >
          <svg class="icon-svg" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>Mon Profil, Honoraires & Tarifs</span>
        </button>
      </div>

      <!-- Messages de confirmation globaux -->
      <div *ngIf="successMessage()" class="alert-success mb-3">
        <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        <span>{{ successMessage() }}</span>
      </div>

      <div *ngIf="errorMessage()" class="alert-error mb-3">
        <svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>{{ errorMessage() }}</span>
      </div>

      <!-- SECTION 1 : LISTE DES RENDEZ-VOUS / CONSULTATIONS            -->
      <div *ngIf="!authService.isDoctor() || doctorActiveTab === 'APPOINTMENTS'">
        <!-- Chargement -->
        <div *ngIf="loading()" class="text-center py-5">
          <p class="text-muted">Récupération de vos consultations sécurisées...</p>
        </div>

        <!-- État vide -->
        <div *ngIf="!loading() && appointments().length === 0" class="card empty-card text-center py-5">
          <div class="empty-icon-wrap">
            <svg class="icon-svg icon-xl text-primary" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <h3 *ngIf="authService.isDoctor()">Aucune consultation planifiée</h3>
          <h3 *ngIf="!authService.isDoctor()">Aucun rendez-vous planifié</h3>

          <p *ngIf="authService.isDoctor()" class="text-muted">
            Vous n'avez aucun rendez-vous patient programmé dans votre agenda. Définissez vos plages horaires pour permettre aux patients de réserver en ligne.
          </p>
          <p *ngIf="!authService.isDoctor()" class="text-muted">Vous n'avez pas de consultation prévue dans votre calendrier.</p>

          <button *ngIf="authService.isDoctor()" class="btn btn-primary mt-3" (click)="selectSlotsTab()">
            <svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Configurer mes Plages Horaires</span>
          </button>
          <a *ngIf="!authService.isDoctor() && !authService.isAdmin()" routerLink="/doctors" class="btn btn-primary mt-3">Prendre un premier rendez-vous</a>
        </div>

        <!-- Liste des RDV -->
        <div class="appointments-list mt-3" *ngIf="!loading() && appointments().length > 0">
          <div *ngFor="let apt of appointments()" class="card appointment-card" [class.is-cancelled]="apt.status === 'CANCELLED'">
            <div class="card-left">
              <div class="badges-row">
                <span class="badge" [ngClass]="getStatusBadge(apt.status)">
                  {{ apt.status === 'CONFIRMED' ? 'Confirmé' : (apt.status === 'COMPLETED' ? 'Terminé' : (apt.status === 'CANCELLED' ? 'Annulé' : apt.status)) }}
                </span>

                <span *ngIf="apt.type === 'TELECONSULTATION'" class="badge badge-info">
                  <svg class="icon-svg" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                  Téléconsultation en Ligne
                </span>
                <span *ngIf="apt.type === 'IN_PERSON'" class="badge badge-outline">
                  <svg class="icon-svg" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  Présentiel au Cabinet
                </span>

                <!-- Badge Mode & Statut de Paiement (affiché uniquement si non annulé) -->
                <ng-container *ngIf="apt.status !== 'CANCELLED'">
                  <span *ngIf="apt.paymentStatus === 'PAID'" class="badge badge-paid">
                    <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    {{ apt.paymentMethod === 'CASH_AT_CABINET' ? 'Réglé en espèces au cabinet' : 'Payé en ligne' }} ({{ apt.amountPaid || apt.doctorSnapshot?.fee || 50 }} DT)
                  </span>
                  <span *ngIf="apt.type === 'TELECONSULTATION' && apt.paymentStatus === 'PENDING'" class="badge badge-pending">
                    <svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Paiement en ligne obligatoire ({{ apt.doctorSnapshot?.fee || 50 }} DT)
                  </span>
                  <span *ngIf="apt.type === 'IN_PERSON' && apt.paymentStatus !== 'PAID'" class="badge badge-cash">
                    <svg class="icon-svg" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>
                    Paiement en espèces au cabinet ({{ apt.doctorSnapshot?.fee || 50 }} DT)
                  </span>
                </ng-container>

                <span *ngIf="apt.status === 'CANCELLED' && apt.paymentStatus === 'PAID'" class="badge badge-paid">
                  <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  Payé ({{ apt.amountPaid || apt.doctorSnapshot?.fee || 50 }} DT)
                </span>
              </div>

              <h3 class="apt-title mt-2">
                <ng-container *ngIf="authService.isDoctor()">
                  Patient : {{ apt.patientSnapshot?.fullName || 'Patient' }}
                </ng-container>
                <ng-container *ngIf="!authService.isDoctor()">
                  {{ apt.doctorSnapshot?.fullName || 'Médecin' }}
                </ng-container>
              </h3>
              <p class="apt-specs">
                <ng-container *ngIf="authService.isDoctor()">
                  Tel : {{ apt.patientSnapshot?.phoneNumber || '-' }} | Email : {{ apt.patientSnapshot?.email || '-' }}
                </ng-container>
                <ng-container *ngIf="!authService.isDoctor()">
                  <span>{{ apt.doctorSnapshot?.specialty }}</span>
                  <span *ngIf="apt.doctorSnapshot?.cabinetAddress"> — </span>
                  <a
                    *ngIf="apt.doctorSnapshot?.cabinetAddress"
                    [href]="getMapsUrl(apt)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="apt-cabinet-link"
                    title="Lancer l'itinéraire GPS direct vers le cabinet sur Google Maps"
                  >
                    <svg class="icon-svg icon-xs text-primary flex-shrink-0" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span class="apt-addr-text">{{ apt.doctorSnapshot.cabinetAddress }}</span>
                    <span class="gps-badge-label">Itinéraire GPS</span>
                    <svg class="icon-svg icon-xs text-muted flex-shrink-0" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                </ng-container>
              </p>

              <div class="apt-date-box">
                <svg class="icon-svg text-primary" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span>{{ formatDate(apt.scheduledStartTime) }}</span>
              </div>
            </div>

            <div class="card-right">
              <!-- CAS 1 : Rendez-vous Annulé -> UNIQUEMENT badge Annulé, AUCUN bouton de paiement ou visio -->
              <div *ngIf="apt.status === 'CANCELLED'" class="cancelled-action-container">
                <span class="badge badge-CANCELLED">Rendez-vous annulé</span>
              </div>

              <!-- CAS 2 : Rendez-vous Actif (non annulé) -->
              <ng-container *ngIf="apt.status !== 'CANCELLED'">
                <!-- Téléconsultation Vidéo -->
                <ng-container *ngIf="apt.type === 'TELECONSULTATION'">
                  <button
                    *ngIf="apt.paymentStatus === 'PAID' && apt.status === 'CONFIRMED'"
                    class="btn btn-accent btn-action-main mb-2"
                    (click)="joinTeleconsultation(apt)"
                  >
                    <svg class="icon-svg" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                    <span>Rejoindre la consultation vidéo</span>
                  </button>

                  <button
                    *ngIf="apt.paymentStatus !== 'PAID' && apt.status !== 'COMPLETED'"
                    class="btn btn-locked mb-2"
                    disabled
                  >
                    <svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <span>Accès vidéo verrouillé (Paiement en attente)</span>
                  </button>

                  <button
                    *ngIf="apt.paymentStatus === 'PENDING' && authService.isPatient() && apt.status !== 'COMPLETED'"
                    class="btn btn-primary btn-sm mb-2"
                    (click)="openPaymentModal(apt)"
                  >
                    <span>Payer en ligne ({{ apt.doctorSnapshot?.fee || 50 }} DT)</span>
                  </button>
                </ng-container>

                <!-- Consultation Présentiel au Cabinet : Info Patient & Itinéraire GPS -->
                <ng-container *ngIf="apt.type === 'IN_PERSON'">
                  <a
                    *ngIf="authService.isPatient() && apt.status === 'CONFIRMED'"
                    [href]="getMapsUrl(apt)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-outline btn-sm mb-2 d-inline-flex align-items-center gap-1"
                    title="Ouvrir l'itinéraire GPS direct vers le cabinet sur Google Maps"
                  >
                    <svg class="icon-svg text-primary" viewBox="0 0 24 24"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                    <span>Itinéraire GPS Cabinet</span>
                  </a>

                  <div *ngIf="authService.isPatient() && apt.paymentStatus !== 'PAID' && apt.status === 'CONFIRMED'" class="cash-patient-notice mb-2">
                    <span class="badge badge-cash">
                      <svg class="icon-svg" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>
                      Espèces sur place : {{ apt.doctorSnapshot?.fee || 50 }} DT
                    </span>
                  </div>
                </ng-container>

                <!-- Actions Praticien : Encaissement & Clôture -->
                <button
                  *ngIf="authService.isDoctor() && apt.status === 'CONFIRMED'"
                  class="btn btn-outline-success btn-sm mb-2"
                  (click)="completeConsultation(apt.id)"
                >
                  <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>{{ apt.type === 'IN_PERSON' ? 'Encaisser en espèces & Clôturer' : 'Marquer comme Terminé' }}</span>
                </button>

                <!-- Reçu PDF -->
                <button
                  *ngIf="apt.paymentStatus === 'PAID' && apt.paymentId"
                  class="btn btn-outline btn-sm mb-2"
                  (click)="downloadReceipt(apt)"
                >
                  <svg class="icon-svg text-primary" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  <span>Reçu officiel (PDF)</span>
                </button>

                <!-- Annulation -->
                <button
                  *ngIf="apt.status === 'CONFIRMED' || apt.status === 'PENDING_PAYMENT'"
                  class="btn btn-outline btn-sm text-danger"
                  (click)="cancel(apt.id)"
                >
                  <span>Annuler le RDV</span>
                </button>
              </ng-container>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 2 : GESTION DES PLAGES HORAIRES (POUR LE MÉDECIN)     -->
      <div *ngIf="authService.isDoctor() && doctorActiveTab === 'SLOTS'">
        <!-- Générateur Automatique de Créneaux -->
        <div class="card slot-generator-card mb-4">
          <div class="generator-header">
            <div>
              <h3 class="generator-title">
                <svg class="icon-svg text-primary" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                <span>Générateur Automatique de Plages Horaires</span>
              </h3>
              <p class="generator-sub">Définissez une journée type pour générer automatiquement tous les créneaux de consultation</p>
            </div>
          </div>

          <form (ngSubmit)="generateBulkSlots()" class="mt-3">
            <div class="slots-inputs-grid">
              <div class="form-group mb-0">
                <label class="form-label">Date de consultation *</label>
                <input type="date" class="form-control" [(ngModel)]="slotGenDate" name="slotGenDate" required />
              </div>

              <div class="form-group mb-0">
                <label class="form-label">Heure Début *</label>
                <input type="time" class="form-control" [(ngModel)]="slotGenStartTime" name="slotGenStartTime" required />
              </div>

              <div class="form-group mb-0">
                <label class="form-label">Heure Fin *</label>
                <input type="time" class="form-control" [(ngModel)]="slotGenEndTime" name="slotGenEndTime" required />
              </div>

              <div class="form-group mb-0">
                <label class="form-label">Durée par Consultation</label>
                <select class="form-control" [(ngModel)]="slotGenDuration" name="slotGenDuration">
                  <option [value]="15">15 minutes</option>
                  <option [value]="20">20 minutes</option>
                  <option [value]="30">30 minutes (Standard)</option>
                  <option [value]="45">45 minutes</option>
                  <option [value]="60">60 minutes</option>
                </select>
              </div>

              <div class="form-group mb-0">
                <label class="form-label">Type de consultation</label>
                <select class="form-control" [(ngModel)]="slotGenType" name="slotGenType">
                  <option value="BOTH">Cabinet & Téléconsultation</option>
                  <option value="IN_PERSON">Cabinet uniquement</option>
                  <option value="TELECONSULTATION">Téléconsultation vidéo</option>
                </select>
              </div>
            </div>

            <div class="generator-footer mt-3">
              <span class="preview-text">
                <svg class="icon-svg icon-xs text-primary" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                Génère des créneaux de <strong>{{ slotGenDuration }} min</strong> entre {{ slotGenStartTime }} et {{ slotGenEndTime }}
              </span>

              <button type="submit" class="btn btn-primary" [disabled]="generatingSlots()">
                <svg class="icon-svg" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                <span>{{ generatingSlots() ? 'Génération en cours...' : 'Générer les Créneaux' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Planning des Créneaux du Médecin -->
        <div class="card table-card">
          <div class="table-header">
            <div>
              <h3 class="table-title">Vos Plages Horaires Ouvertes (30 prochains jours)</h3>
              <p class="table-sub">Total : {{ mySlots().length }} créneau(x) configuré(s) • {{ availableSlotsCount }} disponible(s) à la réservation</p>
            </div>
            <button class="btn btn-outline btn-sm" (click)="loadMySlots()">
              <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              <span>Actualiser le planning</span>
            </button>
          </div>

          
          <div class="slot-filters-toolbar mt-3 mb-3">
            <div class="slot-date-pills">
              <button
                type="button"
                class="slot-filter-pill"
                [class.active]="slotDateFilter === 'ALL'"
                (click)="slotDateFilter = 'ALL'"
              >
                Tous ({{ mySlots().length }})
              </button>
              <button
                type="button"
                class="slot-filter-pill"
                [class.active]="slotDateFilter === 'TODAY'"
                (click)="slotDateFilter = 'TODAY'"
              >
                Aujourd'hui
              </button>
              <button
                type="button"
                class="slot-filter-pill"
                [class.active]="slotDateFilter === 'TOMORROW'"
                (click)="slotDateFilter = 'TOMORROW'"
              >
                Demain
              </button>
              <button
                type="button"
                class="slot-filter-pill"
                [class.active]="slotDateFilter === 'WEEK'"
                (click)="slotDateFilter = 'WEEK'"
              >
                Cette semaine
              </button>
            </div>

            <div class="slot-status-select-wrap">
              <select class="form-control form-control-sm" [(ngModel)]="slotStatusFilter">
                <option value="ALL">Tous les statuts</option>
                <option value="AVAILABLE">Disponibles uniquement</option>
                <option value="BOOKED">Réservés uniquement</option>
              </select>
            </div>
          </div>

          <div *ngIf="loadingSlots()" class="text-center py-4">
            <p class="text-muted">Chargement de votre planning...</p>
          </div>

          <div *ngIf="!loadingSlots() && filteredSlots().length === 0" class="empty-state py-4 text-center">
            <p class="text-muted">Aucune plage horaire ne correspond aux critères sélectionnés.</p>
          </div>

          <!-- Grille des créneaux aérée et responsive -->
          <div class="slots-grid-view mt-3" *ngIf="!loadingSlots() && filteredSlots().length > 0">
            <div *ngFor="let slot of filteredSlots()" class="slot-item-card" [class.slot-booked]="slot.status === 'BOOKED'">
              <div class="slot-card-top">
                <div class="slot-date-badge">
                  <svg class="icon-svg icon-xs text-primary" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>{{ formatSlotDay(slot.startTime) }}</span>
                </div>

                <div class="slot-card-actions">
                  <button
                    *ngIf="slot.status === 'AVAILABLE'"
                    class="btn-edit-slot"
                    (click)="openEditSlotModal(slot)"
                    title="Modifier cette plage horaire"
                    aria-label="Modifier cette plage horaire"
                  >
                    <svg class="icon-svg icon-xs" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button
                    *ngIf="slot.status === 'AVAILABLE'"
                    class="btn-delete-slot"
                    (click)="deleteSlot(slot.id)"
                    title="Supprimer cette plage horaire"
                    aria-label="Supprimer cette plage horaire"
                  >
                    <svg class="icon-svg icon-xs" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                  <span *ngIf="slot.status === 'BOOKED'" class="badge badge-locked">
                    Réservé
                  </span>
                </div>
              </div>

              <div class="slot-card-middle">
                <div class="slot-time-range">
                  <svg class="icon-svg icon-xs text-muted" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span class="time-bold">{{ formatSlotHour(slot.startTime) }} - {{ formatSlotHour(slot.endTime) }}</span>
                </div>
              </div>

              <div class="slot-card-bottom">
                <span class="badge" [class.badge-success]="slot.status === 'AVAILABLE'" [class.badge-info]="slot.status === 'BOOKED'">
                  <span class="status-dot" [class.dot-available]="slot.status === 'AVAILABLE'" [class.dot-booked]="slot.status === 'BOOKED'"></span>
                  {{ slot.status === 'AVAILABLE' ? 'Disponible' : 'Réservé' }}
                </span>
                <span class="badge badge-outline slot-type-pill">
                  {{ slot.consultationType === 'TELECONSULTATION' ? 'Vidéo' : (slot.consultationType === 'IN_PERSON' ? 'Cabinet' : 'Cabinet & Vidéo') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 3 : PROFIL PRATICIEN & HONORAIRES                    -->
      <div *ngIf="authService.isDoctor() && doctorActiveTab === 'PROFILE'">
        <div class="card profile-card" *ngIf="doctorProfile()">
          <div class="table-header">
            <div>
              <h3 class="table-title">Paramètres Professionnels & Honoraires</h3>
              <p class="table-sub">Ajustez vos tarifs de consultation et votre présentation dans l'annuaire maw3ed.tn</p>
            </div>
          </div>

          <form (ngSubmit)="saveDoctorProfile()" class="mt-3">
            <div class="names-grid mb-3">
              <div class="form-group">
                <label class="form-label">Honoraires en Cabinet (DT) *</label>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="doctorFeeInPerson"
                  name="doctorFeeInPerson"
                  min="20"
                  max="300"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Honoraires Téléconsultation (DT) *</label>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="doctorFeeTele"
                  name="doctorFeeTele"
                  min="20"
                  max="300"
                  required
                />
              </div>
            </div>

            <!-- Adresse & Localisation Géographique (Tunisie) -->
            <div class="card-sub mb-3 mt-3">
              <div class="sub-header mb-2">
                <span class="sub-title d-inline-flex align-items-center gap-1.5">
                  <svg class="icon-svg icon-xs text-primary" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <strong>Adresse & Localisation du Cabinet / Hôpital</strong>
                </span>
                <span class="badge badge-info">Repérage GPS Précis</span>
              </div>
              <p class="text-xs text-muted mb-3">
                Renseignez le nom exact de votre établissement hospitalier, clinique privée ou cabinet (ex: <em>hopital lkassab, Hôpital Charles Nicolle, Clinique Pasteur, Cabinet 302...</em>). Les patients pourront cliquer sur votre adresse pour ouvrir directement l'itinéraire GPS sur Google Maps.
              </p>

              <div class="names-grid mb-3">
                <div class="form-group">
                  <label class="form-label">Gouvernorat *</label>
                  <select class="form-control" [(ngModel)]="doctorGovernorate" name="doctorGovernorate" required>
                    <option *ngFor="let g of governorates" [value]="g">{{ g }}</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Délégation / Ville / Quartier *</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="doctorCity"
                    name="doctorCity"
                    placeholder="Ex: Manouba, Centre Urbain Nord, Ennasr 2, Bardo..."
                    required
                  />
                </div>
              </div>

              <div class="form-group mb-2">
                <label class="form-label">Établissement / Hôpital / Clinique / Rue *</label>
                <div class="input-action-group">
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="doctorStreet"
                    name="doctorStreet"
                    placeholder="Ex: hopital lkassab, Clinique Pasteur, Av. Habib Bourguiba"
                    required
                  />
                  <a
                    [href]="getTestGoogleMapsUrl()"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-outline btn-sm test-gps-btn"
                    title="Vérifier le repère sur Google Maps dans un nouvel onglet"
                  >
                    <svg class="icon-svg icon-xs text-primary" viewBox="0 0 24 24"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                    <span>Tester repère GPS ↗</span>
                  </a>
                </div>
              </div>

              <div *ngIf="doctorProfile()?.address?.location?.coordinates" class="gps-coords-badge">
                <svg class="icon-svg icon-xs text-success" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Coordonnées GPS actives : <strong>[{{ doctorProfile()!.address.location!.coordinates[1] | number:'1.4-4' }}, {{ doctorProfile()!.address.location!.coordinates[0] | number:'1.4-4' }}]</strong></span>
              </div>
            </div>

            <div class="form-group mb-3">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="doctorTeleEnabled" name="doctorTeleEnabled" />
                <span><strong>Activer la Téléconsultation en ligne</strong> (permet aux patients de réserver des séances vidéo sécurisées)</span>
              </label>
            </div>

            <div class="form-group mb-3">
              <label class="form-label">Présentation / Bio professionnelle</label>
              <textarea
                class="form-control"
                rows="4"
                [(ngModel)]="doctorPresentation"
                name="doctorPresentation"
                placeholder="Décrivez votre expérience, diplômes et domaines de compétence..."
              ></textarea>
            </div>

            <div class="form-footer mt-4">
              <button type="submit" class="btn btn-primary" [disabled]="savingProfile()">
                <span>{{ savingProfile() ? 'Enregistrement...' : 'Enregistrer mon profil et mes honoraires' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modale de Paiement intégrée -->
      <app-payment-modal
        *ngIf="activePaymentAppointment()"
        [appointment]="activePaymentAppointment()!"
        (paymentSuccess)="onPaymentCompleted()"
        (cancelled)="activePaymentAppointment.set(null)"
      ></app-payment-modal>

      <!-- Modale de Modification de Plage Horaire -->
      <div *ngIf="showEditSlotModal" class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title d-flex align-items-center gap-2">
              <svg class="icon-svg text-primary" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>Modifier la Plage Horaire</span>
            </h3>
            <button class="btn-close" (click)="showEditSlotModal = false" aria-label="Fermer">
              <svg class="icon-svg icon-xs" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <form (ngSubmit)="submitEditSlot()">
            <div class="modal-body">
              <div *ngIf="editSlotError" class="alert-error mb-3">
                <svg class="icon-svg icon-xs" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{{ editSlotError }}</span>
              </div>

              <div class="form-group mb-3">
                <label class="form-label">Date du créneau *</label>
                <input type="date" class="form-control" [(ngModel)]="editSlotDate" name="editSlotDate" required />
              </div>

              <div class="names-grid mb-3">
                <div class="form-group mb-0">
                  <label class="form-label">Heure Début *</label>
                  <input type="time" class="form-control" [(ngModel)]="editSlotStartTime" name="editSlotStartTime" required />
                </div>
                <div class="form-group mb-0">
                  <label class="form-label">Heure Fin *</label>
                  <input type="time" class="form-control" [(ngModel)]="editSlotEndTime" name="editSlotEndTime" required />
                </div>
              </div>

              <div class="form-group mb-3">
                <label class="form-label">Type de consultation *</label>
                <select class="form-control" [(ngModel)]="editSlotType" name="editSlotType" required>
                  <option value="BOTH">Cabinet & Téléconsultation</option>
                  <option value="IN_PERSON">Cabinet uniquement</option>
                  <option value="TELECONSULTATION">Téléconsultation vidéo</option>
                </select>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" (click)="showEditSlotModal = false">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="submittingEditSlot()">
                <span>{{ submittingEditSlot() ? 'Enregistrement...' : 'Enregistrer les modifications' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .appointments-container { padding: 2rem 2.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-end;
      margin-bottom: 1.75rem; flex-wrap: wrap; gap: 1rem;
    }
    .page-title {
      font-size: 2rem; font-weight: 800; color: var(--color-dark);
      letter-spacing: -0.02em; margin: 0.25rem 0 0.25rem;
    }
    .subtitle { color: var(--color-muted); font-size: 0.95rem; }

    /* Onglets Praticien */
    .doctor-tabs {
      display: flex;
      gap: 0.75rem;
      border-bottom: 2px solid var(--color-border);
      padding-bottom: 0.5rem;
      flex-wrap: wrap;
    }
    .doc-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.7rem 1.25rem;
      border-radius: var(--radius-md);
      border: 1px solid transparent;
      background: transparent;
      color: var(--color-muted);
      font-weight: 700;
      font-size: 0.92rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .doc-tab-btn:hover { background: var(--color-muted-light); color: var(--color-dark); }
    .doc-tab-btn.active {
      background: white;
      color: var(--color-primary);
      border-color: var(--color-border);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }
    .tab-badge {
      background: #e2e8f0; color: #475569; font-size: 0.75rem; font-weight: 800;
      padding: 0.15rem 0.5rem; border-radius: var(--radius-full);
    }
    .bg-primary-light { background: #dbeafe; color: #1e40af; }

    /* Empty Card */
    .empty-card { max-width: 520px; margin: 2rem auto; padding: 2.5rem 2rem; border-radius: var(--radius-lg); }
    .empty-icon-wrap {
      width: 56px; height: 56px; border-radius: 50%; background: #e0f2fe;
      display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem;
    }

    /* Appointments Cards */
    .appointments-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      max-width: 1100px;
    }
    .appointment-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.65rem 1.85rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      background: white;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      flex-wrap: wrap;
      gap: 1.5rem;
      transition: all 0.2s ease;
    }
    .appointment-card:hover {
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
      border-color: #cbd5e1;
    }
    .card-left { flex: 1 1 280px; min-width: 0; max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
    .appointment-card.is-cancelled {
      opacity: 0.8;
      background: #fafafb;
    }
    .cancelled-action-container {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: center;
      padding: 0.5rem 0;
    }
    .card-right { display: flex; flex-direction: column; align-items: flex-end; max-width: 100%; }
    .badges-row { display: flex; align-items: center; flex-wrap: wrap; gap: 0.45rem; }
    .apt-title { font-size: 1.2rem; font-weight: 800; color: var(--color-dark); overflow-wrap: anywhere; }
    .apt-specs { color: var(--color-muted); font-size: 0.88rem; margin-top: 0.15rem; overflow-wrap: anywhere; word-break: break-word; }
    .apt-cabinet-link {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 600;
      padding: 0.25rem 0.65rem;
      border-radius: var(--radius-sm);
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      transition: all 0.2s ease;
      margin-top: 0.25rem;
      max-width: 100%;
      box-sizing: border-box;
      flex-wrap: wrap;
    }
    .apt-addr-text {
      min-width: 0;
      overflow-wrap: anywhere;
      word-break: break-word;
      margin-right: 0.25rem;
    }
    .gps-badge-label {
      font-size: 0.74rem;
      font-weight: 700;
      color: var(--color-primary);
      background: #e0f2fe;
      padding: 0.15rem 0.55rem;
      border-radius: var(--radius-sm);
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
    }
    .apt-cabinet-link:hover {
      background: #e0f2fe;
      border-color: var(--color-primary);
      text-decoration: underline;
    }
    .apt-date-box {
      display: inline-flex; align-items: center; gap: 0.45rem;
      font-weight: 700; color: var(--color-primary); font-size: 0.9rem; margin-top: 0.6rem;
      background: #eff6ff; padding: 0.35rem 0.75rem; border-radius: var(--radius-sm);
    }

    /* Slot Generator */
    .slot-generator-card { padding: 1.75rem; border-radius: var(--radius-lg); border-left: 4px solid var(--color-primary); }
    .generator-header { display: flex; justify-content: space-between; align-items: center; }
    .generator-title { font-size: 1.25rem; font-weight: 800; color: var(--color-dark); margin: 0; }
    .generator-sub { font-size: 0.88rem; color: var(--color-muted); margin: 0.25rem 0 0; }
    .slots-inputs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1.25rem;
    }
    .generator-footer {
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 1rem; padding-top: 0.75rem; border-top: 1px dashed #cbd5e1;
    }
    .preview-text { font-size: 0.85rem; color: var(--color-muted); }

    /* Toolbar Filtres Créneaux */
    .slot-filters-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 0.85rem 1.25rem;
      background: var(--color-muted-light);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
    }
    .slot-date-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .slot-filter-pill {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      padding: 0.45rem 1rem;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--color-muted);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .slot-filter-pill:hover { color: var(--color-dark); border-color: #cbd5e1; }
    .slot-filter-pill.active {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
      box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);
    }
    .slot-status-select-wrap { min-width: 200px; }

    /* Slots Grid View - Spacieux & Aéré */
    .slots-grid-view {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
      gap: 1.15rem;
    }
    .slot-item-card {
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-lg);
      padding: 1.1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .slot-item-card:hover {
      border-color: var(--color-primary);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }
    .slot-booked { background: #f8fafc; border-color: #bfdbfe; }

    .slot-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .slot-date-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--color-dark);
      background: #f1f5f9;
      padding: 0.25rem 0.65rem;
      border-radius: var(--radius-full);
    }
    .slot-card-actions { display: flex; align-items: center; gap: 0.45rem; }

    .slot-card-middle {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .slot-time-range {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .time-bold {
      font-size: 1.3rem;
      font-weight: 800;
      color: var(--color-dark);
      letter-spacing: -0.01em;
    }

    .slot-card-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.65rem;
      border-top: 1px dashed #e2e8f0;
    }
    .slot-type-pill {
      font-size: 0.76rem;
      font-weight: 600;
      padding: 0.2rem 0.55rem;
      border-radius: var(--radius-full);
    }
    .badge-locked {
      background: #e2e8f0;
      color: #475569;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border-radius: var(--radius-full);
    }

    .status-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; margin-right: 5px; }
    .dot-available { background-color: #059669; }
    .dot-booked { background-color: #0284c7; }

    .btn-edit-slot {
      background: #e0f2fe; color: #0284c7; border: none; width: 32px; height: 32px;
      border-radius: 50%; font-size: 0.85rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s ease;
    }
    .btn-edit-slot:hover { background: #0284c7; color: white; transform: scale(1.08); }

    .btn-delete-slot {
      background: #fee2e2; color: #dc2626; border: none; width: 32px; height: 32px;
      border-radius: 50%; font-size: 0.85rem; font-weight: 800; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s ease;
    }
    .btn-delete-slot:hover { background: #dc2626; color: white; transform: scale(1.08); }

    /* Profile Card */
    .profile-card { padding: 1.75rem; border-radius: var(--radius-lg); }
    .names-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer; }
    .form-footer { display: flex; justify-content: flex-end; }

    /* Utility Badges */
    .btn-action-main { padding: 0.65rem 1.25rem; font-size: 0.9rem; }
    .btn-locked { background: #f1f5f9; color: #94a3b8; border: 1px solid #cbd5e1; cursor: not-allowed; font-size: 0.82rem; }
    .btn-outline-success { border: 1px solid #10b981; color: #059669; background: transparent; }
    .btn-outline-success:hover { background: #ecfdf5; }
    .badge-paid { background: #dcfce7; color: #166534; font-weight: 700; }
    .badge-cash {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      font-weight: 600;
    }
    .badge-pending { background: #fef3c7; color: #92400e; font-weight: 700; }
    .badge-CONFIRMED { background: #d1fae5; color: #047857; }
    .badge-COMPLETED { background: #e0f2fe; color: #0369a1; }
    .badge-CANCELLED { background: #fee2e2; color: #b91c1c; }
    .text-danger { color: #dc2626; border-color: #fca5a5; }

    .alert-success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-weight: 600; font-size: 0.9rem; }
    .alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fee2e2; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-weight: 600; font-size: 0.85rem; }

    .card-sub { background: var(--color-muted-light); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1.25rem; }
    .sub-header { display: flex; justify-content: space-between; align-items: center; }
    .sub-title { font-weight: 700; color: var(--color-dark); font-size: 0.95rem; }
    .input-action-group { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .input-action-group .form-control { flex: 1 1 220px; min-width: 0; }
    .test-gps-btn { white-space: nowrap; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.5rem 0.85rem; font-size: 0.82rem; }
    .gps-coords-badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.65rem; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-sm); font-size: 0.8rem; color: #065f46; margin-top: 0.5rem; }
  `]
})
export class AppointmentListComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly doctorService = inject(DoctorService);
  private readonly paymentService = inject(PaymentService);
  protected readonly authService = inject(AuthService);

  doctorActiveTab: DoctorTab = 'APPOINTMENTS';

  appointments = signal<Appointment[]>([]);
  mySlots = signal<AvailabilitySlot[]>([]);
  doctorProfile = signal<DoctorProfile | null>(null);

  loading = signal(false);
  loadingSlots = signal(false);
  generatingSlots = signal(false);
  savingProfile = signal(false);

  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  activePaymentAppointment = signal<Appointment | null>(null);

  // Formulaire Générateur de Créneaux
  slotGenDate = '';
  slotGenStartTime = '09:00';
  slotGenEndTime = '16:00';
  slotGenDuration = 30;
  slotGenType: ConsultationType = 'BOTH';

  // Filtres Plages Horaires Ergonomiques
  slotDateFilter: 'ALL' | 'TODAY' | 'TOMORROW' | 'WEEK' = 'ALL';
  slotStatusFilter: 'ALL' | 'AVAILABLE' | 'BOOKED' = 'ALL';

  get availableSlotsCount(): number {
    return this.mySlots().filter(s => s.status === 'AVAILABLE').length;
  }

  filteredSlots(): AvailabilitySlot[] {
    let list = this.mySlots();

    if (this.slotStatusFilter !== 'ALL') {
      list = list.filter(s => s.status === this.slotStatusFilter);
    }

    if (this.slotDateFilter === 'ALL') {
      return list;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return list.filter(s => {
      const slotDate = new Date(s.startTime);
      if (this.slotDateFilter === 'TODAY') {
        return slotDate >= today && slotDate < tomorrow;
      } else if (this.slotDateFilter === 'TOMORROW') {
        return slotDate >= tomorrow && slotDate < dayAfterTomorrow;
      } else if (this.slotDateFilter === 'WEEK') {
        return slotDate >= today && slotDate < weekEnd;
      }
      return true;
    });
  }

  // Formulaire Modification d'un créneau
  showEditSlotModal = false;
  selectedSlotForEdit: AvailabilitySlot | null = null;
  editSlotDate = '';
  editSlotStartTime = '09:00';
  editSlotEndTime = '09:30';
  editSlotType: ConsultationType = 'BOTH';
  editSlotError = '';
  submittingEditSlot = signal(false);

  // Profil & Honoraires du Médecin
  readonly governorates: string[] = [
    'Manouba', 'Tunis', 'Ariana', 'Ben Arous', 'Nabeul', 'Zaghouan',
    'Bizerte', 'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Sousse',
    'Monastir', 'Mahdia', 'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid',
    'Gabès', 'Médenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kébili'
  ];
  doctorGovernorate = 'Manouba';
  doctorCity = 'Manouba Ville';
  doctorStreet = '';
  doctorFeeInPerson = 60;
  doctorFeeTele = 50;
  doctorTeleEnabled = true;
  doctorPresentation = '';

  ngOnInit(): void {
    // Initialiser la date par défaut du générateur à demain
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.slotGenDate = tomorrow.toISOString().split('T')[0];

    this.loadAppointments();

    if (this.authService.isDoctor()) {
      this.loadMySlots();
      this.loadDoctorProfile();
    }
  }

  loadAppointments(): void {
    this.loading.set(true);
    this.appointmentService.getMyAppointments().subscribe({
      next: (res) => {
        this.appointments.set(res.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadMySlots(): void {
    this.loadingSlots.set(true);
    this.appointmentService.getMySlots().subscribe({
      next: (slots) => {
        this.mySlots.set(slots);
        this.loadingSlots.set(false);
      },
      error: () => this.loadingSlots.set(false)
    });
  }

  loadDoctorProfile(): void {
    this.doctorService.getMyProfile().subscribe({
      next: (p) => {
        this.doctorProfile.set(p);
        this.doctorFeeInPerson = p.consultationFee?.inPerson || 60;
        this.doctorFeeTele = p.consultationFee?.teleconsultation || 50;
        this.doctorTeleEnabled = p.teleconsultationEnabled;
        this.doctorPresentation = p.presentation || '';
        if (p.address) {
          this.doctorGovernorate = p.address.governorate || 'Manouba';
          this.doctorCity = p.address.city || '';
          this.doctorStreet = p.address.street || '';
        }
      }
    });
  }

  selectSlotsTab(): void {
    this.doctorActiveTab = 'SLOTS';
    this.loadMySlots();
  }

  selectProfileTab(): void {
    this.doctorActiveTab = 'PROFILE';
    this.loadDoctorProfile();
  }

  // --- Actions Plages Horaires ---

  generateBulkSlots(): void {
    if (!this.slotGenDate || !this.slotGenStartTime || !this.slotGenEndTime) {
      this.errorMessage.set('Veuillez renseigner la date, l\'heure de début et l\'heure de fin.');
      return;
    }

    this.errorMessage.set(null);
    this.generatingSlots.set(true);

    const startIso = new Date(`${this.slotGenDate}T${this.slotGenStartTime}:00`).toISOString();
    const endIso = new Date(`${this.slotGenDate}T${this.slotGenEndTime}:00`).toISOString();

    this.appointmentService.generateSlotsBulk({
      startDateTime: startIso,
      endDateTime: endIso,
      durationMinutes: Number(this.slotGenDuration),
      consultationType: this.slotGenType
    }).subscribe({
      next: (created) => {
        this.generatingSlots.set(false);
        this.showSuccess(`${created.length} plage(s) horaire(s) générée(s) et publiée(s) avec succès !`);
        this.loadMySlots();
      },
      error: (err) => {
        this.generatingSlots.set(false);
        this.errorMessage.set(err.error?.message || 'Erreur lors de la génération des créneaux.');
      }
    });
  }

  openEditSlotModal(slot: AvailabilitySlot): void {
    this.selectedSlotForEdit = slot;
    this.editSlotError = '';

    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);

    const year = start.getFullYear();
    const month = String(start.getMonth() + 1).padStart(2, '0');
    const day = String(start.getDate()).padStart(2, '0');
    this.editSlotDate = `${year}-${month}-${day}`;

    const startH = String(start.getHours()).padStart(2, '0');
    const startM = String(start.getMinutes()).padStart(2, '0');
    this.editSlotStartTime = `${startH}:${startM}`;

    const endH = String(end.getHours()).padStart(2, '0');
    const endM = String(end.getMinutes()).padStart(2, '0');
    this.editSlotEndTime = `${endH}:${endM}`;

    this.editSlotType = slot.consultationType || 'BOTH';
    this.showEditSlotModal = true;
  }

  submitEditSlot(): void {
    if (!this.selectedSlotForEdit) return;

    if (!this.editSlotDate || !this.editSlotStartTime || !this.editSlotEndTime) {
      this.editSlotError = 'Veuillez renseigner la date et les heures.';
      return;
    }

    const startIso = new Date(`${this.editSlotDate}T${this.editSlotStartTime}:00`).toISOString();
    const endIso = new Date(`${this.editSlotDate}T${this.editSlotEndTime}:00`).toISOString();

    if (new Date(startIso) >= new Date(endIso)) {
      this.editSlotError = "L'heure de début doit être antérieure à l'heure de fin.";
      return;
    }

    this.submittingEditSlot.set(true);
    this.editSlotError = '';

    this.appointmentService.updateSlot(this.selectedSlotForEdit.id, {
      startTime: startIso,
      endTime: endIso,
      consultationType: this.editSlotType
    }).subscribe({
      next: () => {
        this.submittingEditSlot.set(false);
        this.showEditSlotModal = false;
        this.showSuccess('Plage horaire modifiée avec succès !');
        this.loadMySlots();
      },
      error: (err) => {
        this.submittingEditSlot.set(false);
        this.editSlotError = err.error?.message || 'Erreur lors de la modification de la plage horaire.';
      }
    });
  }

  deleteSlot(slotId: string): void {
    if (!confirm('Voulez-vous supprimer cette plage horaire ?')) {
      return;
    }

    this.appointmentService.deleteSlot(slotId).subscribe({
      next: () => {
        this.showSuccess('Plage horaire supprimée.');
        this.loadMySlots();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Impossible de supprimer cette plage horaire.');
      }
    });
  }

  // --- Actions Profil & Honoraires ---

  getTestGoogleMapsUrl(): string {
    const parts = [this.doctorStreet, this.doctorCity, this.doctorGovernorate, 'Tunisie']
      .map(s => (s || '').trim())
      .filter(Boolean);
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(parts.join(', '));
  }

  saveDoctorProfile(): void {
    this.savingProfile.set(true);
    this.errorMessage.set(null);

    this.doctorService.updateMyProfile({
      consultationFee: {
        inPerson: this.doctorFeeInPerson,
        teleconsultation: this.doctorFeeTele,
        currency: 'TND'
      },
      teleconsultationEnabled: this.doctorTeleEnabled,
      presentation: this.doctorPresentation,
      address: {
        governorate: this.doctorGovernorate.trim(),
        city: this.doctorCity.trim(),
        street: this.doctorStreet.trim()
      }
    }).subscribe({
      next: (updated) => {
        this.savingProfile.set(false);
        this.doctorProfile.set(updated);
        if (updated.address) {
          this.doctorGovernorate = updated.address.governorate || this.doctorGovernorate;
          this.doctorCity = updated.address.city || this.doctorCity;
          this.doctorStreet = updated.address.street || this.doctorStreet;
        }
        this.showSuccess('Profil et coordonnées géographiques mis à jour avec succès !');
      },
      error: (err) => {
        this.savingProfile.set(false);
        this.errorMessage.set(err.error?.message || 'Erreur lors de la mise à jour du profil.');
      }
    });
  }

  // --- Actions Consultations ---

  completeConsultation(appointmentId: string): void {
    if (!confirm('Confirmez-vous la clôture de cette consultation médicale ?')) {
      return;
    }

    this.appointmentService.completeAppointment(appointmentId).subscribe({
      next: () => {
        this.showSuccess('Consultation marquée comme terminée avec succès.');
        this.loadAppointments();
      }
    });
  }

  joinTeleconsultation(apt: Appointment): void {
    const roomName = apt.teleconsultationSession?.roomName || `maw3ed-${apt.id}`;
    window.open(`https://meet.jit.si/${roomName}`, '_blank');
  }

  openPaymentModal(apt: Appointment): void {
    this.activePaymentAppointment.set(apt);
  }

  onPaymentCompleted(): void {
    this.activePaymentAppointment.set(null);
    this.showSuccess('Téléconsultation réglée avec succès ! Votre accès vidéo WebRTC est débloqué.');
    this.loadAppointments();
  }

  downloadReceipt(apt: Appointment): void {
    if (apt.paymentId) {
      this.paymentService.openPrintableReceipt(apt.paymentId);
    }
  }

  cancel(id: string): void {
    if (confirm('Êtes-vous certain de vouloir annuler ce rendez-vous ?')) {
      this.appointmentService.cancelAppointment(id).subscribe({
        next: () => this.loadAppointments()
      });
    }
  }

  // --- Utilitaires Formatage ---

  getStatusBadge(status: string): string {
    return `badge-${status}`;
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('fr-TN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatSlotDay(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-TN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  formatSlotDayTime(iso: string): string {
    const d = new Date(iso);
    return `${d.toLocaleDateString('fr-TN', { weekday: 'short', day: 'numeric', month: 'short' })} à ${d.getHours().toString().padStart(2, '0')}h${d.getMinutes().toString().padStart(2, '0')}`;
  }

  formatSlotHour(iso: string): string {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}h${d.getMinutes().toString().padStart(2, '0')}`;
  }

  getMapsUrl(aptOrAddress: any): string {
    let address = '';
    if (aptOrAddress && typeof aptOrAddress === 'object') {
      const snap = aptOrAddress.doctorSnapshot || aptOrAddress;
      address = snap.cabinetAddress || '';
    } else if (typeof aptOrAddress === 'string') {
      address = aptOrAddress;
    }

    // Si Bardo Center, cibler le bâtiment directement pour éviter la confusion avec d'autres praticiens
    if (/bardo\s*cent(re|er)/i.test(address)) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('Bardo Center, Avenue Habib Bourguiba, Le Bardo, Tunisie')}`;
    }

    if (!address.trim()) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('Tunisie')}`;
    }

    const queryText = address.includes('Tunisie') ? address : `${address}, Tunisie`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(queryText)}`;
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 5000);
  }
}
