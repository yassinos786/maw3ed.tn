import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../core/services/payment.service';
import { AdminService } from '../../core/services/admin.service';
import { FinancialStats, PaymentTransaction } from '../../core/models/payment.model';
import { AdminUser, PendingDoctorDetail, Role, UserStatus } from '../../core/models/user.model';
import { AuditLogEntry } from '../../core/models/audit.model';

type AdminTab = 'VERIFICATION' | 'USERS' | 'FINANCE' | 'AUDIT';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container admin-container">
      <div class="page-header">
        <div>
          <span class="badge badge-info mb-1">
            <svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Console d'Administration & Supervision
          </span>
          <h1 class="page-title">Supervision maw3ed.tn</h1>
          <p class="subtitle">Gestion CRUD des utilisateurs, validation des médecins et métriques de la plateforme</p>
        </div>
        <button class="btn btn-outline" (click)="loadAllData()">
          <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          <span>Actualiser</span>
        </button>
      </div>

      <!-- Navigation par Onglets Principaux -->
      <div class="admin-tabs mb-4">
        <button
          class="admin-tab-btn"
          [class.active]="activeTab === 'USERS'"
          (click)="activeTab = 'USERS'"
        >
          <svg class="icon-svg" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span>Gérer les Comptes Utilisateurs (CRUD)</span>
          <span class="tab-badge">{{ users().length }}</span>
        </button>

        <button
          class="admin-tab-btn"
          [class.active]="activeTab === 'VERIFICATION'"
          (click)="activeTab = 'VERIFICATION'"
        >
          <svg class="icon-svg text-warning" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="12" r="3"/></svg>
          <span>Valider les Profils des Médecins</span>
          <span *ngIf="pendingDoctors().length > 0" class="tab-badge bg-warning">{{ pendingDoctors().length }}</span>
        </button>

        <button
          class="admin-tab-btn"
          [class.active]="activeTab === 'FINANCE'"
          (click)="activeTab = 'FINANCE'"
        >
          <svg class="icon-svg text-primary" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <span>Consulter les Statistiques</span>
        </button>

        <button
          class="admin-tab-btn"
          [class.active]="activeTab === 'AUDIT'"
          (click)="selectAuditTab()"
        >
          <svg class="icon-svg text-primary" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <span>Journal d'Audit & Sécurité</span>
          <span class="tab-badge" *ngIf="auditLogs().length > 0">{{ auditLogs().length }}</span>
        </button>
      </div>

      <!-- Notification de confirmation -->
      <div *ngIf="actionMessage()" class="alert-success mb-3">
        <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        <span>{{ actionMessage() }}</span>
      </div>

      <!-- ONGLET 1 : GESTION DES UTILISATEURS (CRUD COMPLET)           -->
      <div *ngIf="activeTab === 'USERS'">
        <div class="card table-card">
          <div class="table-header">
            <div>
              <h3 class="table-title">Gestion des Comptes Utilisateurs (CRUD)</h3>
              <p class="table-sub">Création, consultation, modification et suppression des comptes utilisateurs</p>
            </div>
            <button class="btn btn-primary" (click)="openCreateModal()">
              <svg class="icon-svg" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Créer un Utilisateur</span>
            </button>
          </div>

          <!-- Filtres de recherche -->
          <div class="filters-bar mb-3">
            <div class="search-wrap flex-1">
              <input
                type="text"
                class="form-control"
                placeholder="Rechercher par nom, email ou téléphone..."
                [(ngModel)]="userSearchTerm"
              />
            </div>
            <div class="filter-select-wrap">
              <select class="form-control" [(ngModel)]="roleFilter">
                <option value="ALL">Tous les rôles</option>
                <option value="ROLE_PATIENT">Patients</option>
                <option value="ROLE_DOCTOR">Médecins</option>
                <option value="ROLE_ADMIN">Administrateurs</option>
              </select>
            </div>
            <div class="filter-select-wrap">
              <select class="form-control" [(ngModel)]="statusFilter">
                <option value="ALL">Tous les statuts</option>
                <option value="ACTIVE">Actif</option>
                <option value="PENDING_VERIFICATION">En attente</option>
                <option value="SUSPENDED">Suspendu</option>
              </select>
            </div>
          </div>

          <div *ngIf="loadingUsers()" class="text-center py-4">
            <p class="text-muted">Chargement des utilisateurs...</p>
          </div>

          <div class="table-responsive" *ngIf="!loadingUsers()">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Actions CRUD</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of filteredUsers()">
                  <td>
                    <div class="user-row-info">
                      <span class="user-row-avatar">{{ u.firstName.charAt(0) }}{{ u.lastName.charAt(0) }}</span>
                      <div>
                        <strong>{{ u.firstName }} {{ u.lastName }}</strong>
                        <span *ngIf="u.emailVerified" class="text-success text-xs d-flex align-items-center gap-1">
                          <svg class="icon-svg icon-xs" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                          <span>Email vérifié</span>
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>{{ u.email }}</td>
                  <td>{{ u.phoneNumber || '-' }}</td>
                  <td>
                    <span
                      class="role-pill"
                      [class.role-admin]="u.roles.includes('ROLE_ADMIN')"
                      [class.role-doctor]="u.roles.includes('ROLE_DOCTOR')"
                      [class.role-patient]="u.roles.includes('ROLE_PATIENT')"
                    >
                      {{ u.roles.includes('ROLE_ADMIN') ? 'Administrateur' : (u.roles.includes('ROLE_DOCTOR') ? 'Médecin' : 'Patient') }}
                    </span>
                  </td>
                  <td>
                    <span
                      class="status-pill"
                      [class.status-active]="u.status === 'ACTIVE'"
                      [class.status-pending]="u.status === 'PENDING_VERIFICATION'"
                      [class.status-suspended]="u.status === 'SUSPENDED'"
                    >
                      {{ u.status === 'ACTIVE' ? 'Actif' : (u.status === 'PENDING_VERIFICATION' ? 'En attente' : 'Suspendu') }}
                    </span>
                  </td>
                  <td>
                    <div class="btn-group-actions">
                      <button
                        class="btn btn-outline btn-xs"
                        (click)="openEditModal(u)"
                        title="Modifier l'utilisateur"
                      >
                        <svg class="icon-svg icon-xs" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        <span>Modifier</span>
                      </button>

                      <button
                        *ngIf="u.status === 'ACTIVE'"
                        class="btn btn-outline-warning btn-xs"
                        (click)="toggleUserStatus(u.id, 'SUSPENDED')"
                        title="Suspendre le compte"
                      >
                        Suspendre
                      </button>

                      <button
                        *ngIf="u.status !== 'ACTIVE'"
                        class="btn btn-outline-success btn-xs"
                        (click)="toggleUserStatus(u.id, 'ACTIVE')"
                        title="Activer le compte"
                      >
                        Activer
                      </button>

                      <button
                        class="btn btn-outline-danger btn-xs"
                        (click)="deleteUser(u.id, u.firstName + ' ' + u.lastName)"
                        title="Supprimer définitivement"
                        aria-label="Supprimer cet utilisateur"
                      >
                        <svg class="icon-svg icon-xs" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ONGLET 2 : VALIDATION DES MÉDECINS (ANTI-FRAUDE)             -->
      <div *ngIf="activeTab === 'VERIFICATION'">
        <div class="verification-banner card-sub mb-4">
          <div class="banner-icon-wrap">
            <svg class="icon-svg icon-lg text-primary" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <h3 class="banner-title">Validation des Profils des Médecins</h3>
            <p class="banner-desc">
              Contrôle d'authenticité auprès de l'Ordre des Médecins de Tunisie pour chaque praticien inscrit. L'approbation active son compte et publie son profil dans l'annuaire.
            </p>
          </div>
        </div>

        <div *ngIf="loadingDoctors()" class="text-center py-4">
          <p class="text-muted">Chargement des dossiers praticiens en attente...</p>
        </div>

        <div *ngIf="!loadingDoctors() && pendingDoctors().length === 0" class="empty-state card">
          <div class="empty-icon-wrap">
            <svg class="icon-svg icon-xl text-accent" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h3>Aucun médecin en attente de validation</h3>
          <p class="text-muted">Tous les praticiens enregistrés sur la plateforme sont actuellement certifiés et conformes.</p>
        </div>

        <div class="pending-doctors-grid" *ngIf="!loadingDoctors() && pendingDoctors().length > 0">
          <div class="card doc-verify-card" *ngFor="let doc of pendingDoctors()">
            <div class="doc-verify-header">
              <div class="doc-info">
                <div class="doc-avatar">
                  {{ doc.doctorName.charAt(4) }}
                </div>
                <div>
                  <h3 class="doc-title">{{ doc.doctorName }}</h3>
                  <span class="badge badge-warning">En attente de vérification</span>
                </div>
              </div>
              <div class="doc-fee-badge">
                <span class="fee-val">{{ doc.consultationFee?.inPerson || 60 }} DT</span>
                <span class="fee-lbl">Honoraires</span>
              </div>
            </div>

            <div class="doc-verify-body">
              <div class="doc-meta-item highlight-box">
                <span class="meta-label">Matricule Ordre des Médecins (Contrôle Anti-Fraude) :</span>
                <span class="council-badge">
                  <svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <strong>{{ doc.medicalCouncilId }}</strong>
                </span>
              </div>

              <div class="doc-meta-grid">
                <div class="doc-meta-item">
                  <span class="meta-label">Spécialité(s) :</span>
                  <span class="meta-val font-semibold">{{ doc.specialties.join(', ') }}</span>
                </div>
                <div class="doc-meta-item">
                  <span class="meta-label">Cabinet :</span>
                  <span class="meta-val">{{ doc.address?.street || 'Cabinet médical' }}, {{ doc.address?.city }} ({{ doc.address?.governorate }})</span>
                </div>
                <div class="doc-meta-item">
                  <span class="meta-label">Email professionnel :</span>
                  <span class="meta-val">{{ doc.email }}</span>
                </div>
                <div class="doc-meta-item">
                  <span class="meta-label">Téléphone :</span>
                  <span class="meta-val">{{ doc.phoneNumber }}</span>
                </div>
              </div>
            </div>

            <div class="doc-verify-footer">
              <button class="btn btn-outline-danger" (click)="rejectDoctor(doc.id, doc.doctorName)">
                <span>Rejeter le profil</span>
              </button>

              <button class="btn btn-primary" (click)="verifyDoctor(doc.id, doc.doctorName)">
                <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Valider le médecin & Certifier</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ONGLET 3 : CONSULTER LES STATISTIQUES                        -->
      <div *ngIf="activeTab === 'FINANCE'">
        <div class="kpi-grid">
          <div class="card kpi-card kpi-primary">
            <div class="kpi-top">
              <span class="kpi-label">Volume d'Affaires Global</span>
              <div class="kpi-icon-wrap bg-blue">
                <svg class="icon-svg text-primary" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
            </div>
            <h2 class="kpi-val text-primary">{{ stats()?.totalVolumeTND || 0 }} DT</h2>
            <span class="kpi-sub">Total consultations réglées</span>
          </div>

          <div class="card kpi-card kpi-accent">
            <div class="kpi-top">
              <span class="kpi-label">Commissions maw3ed.tn (10%)</span>
              <div class="kpi-icon-wrap bg-green">
                <svg class="icon-svg text-accent" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
            </div>
            <h2 class="kpi-val text-accent">{{ stats()?.platformCommissionsTND || 0 }} DT</h2>
            <span class="kpi-sub">Marge nette de la plateforme</span>
          </div>

          <div class="card kpi-card kpi-dark">
            <div class="kpi-top">
              <span class="kpi-label">Reversé aux Médecins (90%)</span>
              <div class="kpi-icon-wrap bg-dark">
                <svg class="icon-svg text-dark" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
            </div>
            <h2 class="kpi-val text-dark">{{ stats()?.doctorPayoutsTND || 0 }} DT</h2>
            <span class="kpi-sub">Honoraires praticiens conventionnés</span>
          </div>

          <div class="card kpi-card kpi-neutral">
            <div class="kpi-top">
              <span class="kpi-label">Transactions Réglées</span>
              <div class="kpi-icon-wrap bg-neutral">
                <svg class="icon-svg text-accent" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>
            <h2 class="kpi-val text-success">{{ stats()?.totalPaidTransactions || 0 }}</h2>
            <span class="kpi-sub">{{ stats()?.totalPendingTransactions || 0 }} en attente de paiement</span>
          </div>
        </div>

        <!-- Tableau des Transactions -->
        <div class="card table-card mt-4">
          <div class="table-header">
            <div>
              <h3 class="table-title">Journal des Flux Financiers</h3>
              <p class="table-sub">Traçabilité des transactions et règlements en ligne</p>
            </div>
            <span class="badge badge-outline">{{ transactions().length }} transaction(s) enregistrée(s)</span>
          </div>

          <div *ngIf="loadingTransactions()" class="text-center py-4">
            <p class="text-muted">Chargement des transactions bancaires...</p>
          </div>

          <div class="table-responsive" *ngIf="!loadingTransactions()">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Date & Heure</th>
                  <th>Montant</th>
                  <th>Commission (10%)</th>
                  <th>Net Médecin</th>
                  <th>Mode Paiement</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="transactions().length === 0">
                  <td colspan="8" class="text-center text-muted py-4">
                    Aucune transaction financière enregistrée pour le moment.
                  </td>
                </tr>
                <tr *ngFor="let tx of transactions()">
                  <td><strong>{{ tx.transactionReference }}</strong></td>
                  <td>{{ tx.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td><span class="font-bold">{{ tx.amount }} DT</span></td>
                  <td>
                    <span *ngIf="tx.status === 'PAID'" class="badge badge-accent">+{{ tx.platformCommission }} DT</span>
                    <span *ngIf="tx.status !== 'PAID'" class="text-muted">—</span>
                  </td>
                  <td>
                    <span class="text-muted">{{ tx.status === 'PAID' ? (tx.doctorNetRevenue + ' DT') : '—' }}</span>
                  </td>
                  <td>{{ formatPaymentMethod(tx.paymentMethod, tx.status) }}</td>
                  <td>
                    <span class="badge" [ngClass]="getPaymentStatusBadge(tx.status)">
                      {{ formatPaymentStatus(tx.status) }}
                    </span>
                  </td>
                  <td>
                    <a
                      *ngIf="tx.status === 'PAID'"
                      [href]="'http://localhost:8080/api/v1/payments/' + tx.id + '/receipt/html'"
                      target="_blank"
                      class="btn btn-outline btn-xs"
                    >
                      Reçu PDF
                    </a>
                    <span *ngIf="tx.status !== 'PAID'" class="text-muted text-xs">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ONGLET 4 : JOURNAL D'AUDIT & SÉCURITÉ -->
      <div *ngIf="activeTab === 'AUDIT'">
        <div class="kpi-grid mb-4">
          <div class="card kpi-card kpi-primary">
            <div class="kpi-top">
              <span class="kpi-label">Total Événements Audit</span>
              <div class="kpi-icon-wrap bg-blue">
                <svg class="icon-svg text-primary" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
            </div>
            <h2 class="kpi-val text-primary">{{ auditLogs().length }}</h2>
            <span class="kpi-sub">Journalisé en base MongoDB</span>
          </div>

          <div class="card kpi-card kpi-accent">
            <div class="kpi-top">
              <span class="kpi-label">Alertes Sécurité / Warnings</span>
              <div class="kpi-icon-wrap bg-yellow">
                <svg class="icon-svg text-warning" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
            </div>
            <h2 class="kpi-val text-warning">{{ warningAuditCount }}</h2>
            <span class="kpi-sub">Actions nécessitant vigilance</span>
          </div>

          <div class="card kpi-card kpi-dark">
            <div class="kpi-top">
              <span class="kpi-label">Intégrité Système</span>
              <div class="kpi-icon-wrap bg-green">
                <svg class="icon-svg text-accent" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>
            <h2 class="kpi-val text-success">OPTIMAL</h2>
            <span class="kpi-sub">Traçabilité chiffrée active</span>
          </div>

          <div class="card kpi-card kpi-neutral">
            <div class="kpi-top">
              <span class="kpi-label">Statut Journal</span>
              <div class="kpi-icon-wrap bg-neutral">
                <svg class="icon-svg text-primary" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
            </div>
            <h2 class="kpi-val text-sm font-bold text-success">ACTIF & TEMPS RÉEL</h2>
            <span class="kpi-sub">Horodatage automatique</span>
          </div>
        </div>

        <div class="card table-card">
          <div class="table-header">
            <div>
              <h3 class="table-title">Journal d'Audit & Traçabilité des Actions</h3>
              <p class="table-sub">Historique infalsifiable des connexions, modifications de comptes et actions critiques</p>
            </div>
            <button class="btn btn-outline btn-sm" (click)="loadAuditLogs()">
              <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              <span>Actualiser l'audit</span>
            </button>
          </div>

          <!-- Filtres Audit -->
          <div class="filters-bar mb-3">
            <div class="search-wrap flex-1">
              <input
                type="text"
                class="form-control"
                placeholder="Filtrer par acteur, email, action ou mot-clé..."
                [(ngModel)]="auditSearchTerm"
              />
            </div>
            <div class="filter-select-wrap">
              <select class="form-control" [(ngModel)]="auditCategoryFilter">
                <option value="ALL">Toutes catégories</option>
                <option value="AUTHENTICATION">Authentification</option>
                <option value="USER_MANAGEMENT">Gestion Utilisateurs</option>
                <option value="DOCTOR_VERIFICATION">Vérification Praticiens</option>
                <option value="SCHEDULE">Planning & Créneaux</option>
                <option value="TRIAGE">Système de Triage</option>
                <option value="SECURITY">Sécurité & Système</option>
              </select>
            </div>
            <div class="filter-select-wrap">
              <select class="form-control" [(ngModel)]="auditSeverityFilter">
                <option value="ALL">Toutes sévérités</option>
                <option value="INFO">INFO (Normal)</option>
                <option value="WARNING">WARNING (Alerte)</option>
                <option value="CRITICAL">CRITICAL (Critique)</option>
              </select>
            </div>
          </div>

          <div *ngIf="loadingAudit()" class="text-center py-4">
            <p class="text-muted">Récupération des logs d'audit sécurisés...</p>
          </div>

          <div class="table-responsive" *ngIf="!loadingAudit()">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Horodatage</th>
                  <th>Acteur</th>
                  <th>Action</th>
                  <th>Catégorie</th>
                  <th>Sévérité</th>
                  <th>Détails de l'opération</th>
                  <th>Adresse IP</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let log of filteredAuditLogs()">
                  <td class="text-nowrap font-mono text-xs">{{ formatLogDate(log.timestamp) }}</td>
                  <td>
                    <strong>{{ log.userName || 'Système' }}</strong>
                    <div class="text-xs text-muted">{{ log.userEmail || '-' }}</div>
                  </td>
                  <td>
                    <span class="badge badge-outline action-badge">{{ log.action }}</span>
                  </td>
                  <td><span class="category-pill">{{ log.category }}</span></td>
                  <td>
                    <span class="badge" [ngClass]="getSeverityBadge(log.severity)">
                      {{ log.severity }}
                    </span>
                  </td>
                  <td class="text-sm max-w-desc">{{ log.details }}</td>
                  <td class="font-mono text-xs text-muted">{{ log.ipAddress }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div *ngIf="showCreateModal" class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">
              <svg class="icon-svg text-primary" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Créer un Nouveau Compte Utilisateur</span>
            </h3>
            <button class="btn-close" (click)="showCreateModal = false" aria-label="Fermer">
              <svg class="icon-svg icon-xs" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <form (ngSubmit)="submitCreateUser()">
            <div class="modal-body">
              <div *ngIf="modalError" class="alert-error mb-3">
                {{ modalError }}
              </div>

              <div class="names-grid mb-2">
                <div class="form-group">
                  <label class="form-label">Prénom *</label>
                  <input type="text" class="form-control" [(ngModel)]="newFirstName" name="newFirstName" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Nom *</label>
                  <input type="text" class="form-control" [(ngModel)]="newLastName" name="newLastName" required />
                </div>
              </div>

              <div class="names-grid mb-2">
                <div class="form-group">
                  <label class="form-label">Email *</label>
                  <input type="email" class="form-control" [(ngModel)]="newEmail" name="newEmail" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Téléphone *</label>
                  <input type="tel" class="form-control" [(ngModel)]="newPhone" name="newPhone" placeholder="+216 20 123 456" required />
                </div>
              </div>

              <div class="names-grid mb-2">
                <div class="form-group">
                  <label class="form-label">Rôle *</label>
                  <select class="form-control" [(ngModel)]="newRole" name="newRole" required>
                    <option value="ROLE_PATIENT">Patient</option>
                    <option value="ROLE_DOCTOR">Médecin (Praticien)</option>
                    <option value="ROLE_ADMIN">Administrateur</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Statut Initial *</label>
                  <select class="form-control" [(ngModel)]="newStatus" name="newStatus" required>
                    <option value="ACTIVE">Actif</option>
                    <option value="PENDING_VERIFICATION">En attente de vérification</option>
                    <option value="SUSPENDED">Suspendu</option>
                  </select>
                </div>
              </div>

              <div class="form-group mb-2">
                <label class="form-label">Mot de passe temporaire *</label>
                <input type="password" class="form-control" [(ngModel)]="newPassword" name="newPassword" placeholder="Minimum 6 caractères" required />
              </div>

              <!-- Champs supplémentaires pour Médecin -->
              <div *ngIf="newRole === 'ROLE_DOCTOR'" class="card-sub mt-2 mb-2">
                <span class="sub-title block mb-2">Informations Professionnelles Médecin</span>
                <div class="names-grid mb-2">
                  <div class="form-group">
                    <label class="form-label">Matricule Ordre des Médecins</label>
                    <input type="text" class="form-control" [(ngModel)]="newMedCouncilId" name="newMedCouncilId" placeholder="TN-MED-12345" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Spécialité</label>
                    <select class="form-control" [(ngModel)]="newSpecialty" name="newSpecialty">
                      <option value="Cardiologie">Cardiologie</option>
                      <option value="Dermatologie">Dermatologie</option>
                      <option value="Chirurgie Dentaire">Chirurgie Dentaire</option>
                      <option value="Ophtalmologie">Ophtalmologie</option>
                      <option value="ORL">ORL</option>
                      <option value="Pédiatrie">Pédiatrie</option>
                      <option value="Médecine Générale">Médecine Générale</option>
                    </select>
                  </div>
                </div>

                <div class="names-grid mb-2">
                  <div class="form-group">
                    <label class="form-label">Gouvernorat</label>
                    <select class="form-control" [(ngModel)]="newGovernorate" name="newGovernorate">
                      <option *ngFor="let g of governorates" [value]="g">{{ g }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Délégation / Ville</label>
                    <input type="text" class="form-control" [(ngModel)]="newCity" name="newCity" placeholder="Ex: Manouba, Centre Urbain Nord, Ennasr..." />
                  </div>
                </div>

                <div class="names-grid mb-2">
                  <div class="form-group">
                    <label class="form-label">Lieu / Hôpital / Clinique / Rue</label>
                    <input type="text" class="form-control" [(ngModel)]="newStreet" name="newStreet" placeholder="Ex: Institut Kassab, Clinique Pasteur..." />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Tarif consultation (DT)</label>
                    <input type="number" class="form-control" [(ngModel)]="newFee" name="newFee" min="20" max="300" />
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" (click)="showCreateModal = false">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="submittingUser()">
                {{ submittingUser() ? 'Création en cours...' : 'Créer l\\'utilisateur' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL 2 : MODIFICATION D'UTILISATEUR (UPDATE USER)           -->
      <div *ngIf="showEditModal" class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">
              <svg class="icon-svg text-primary" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>Modifier le Compte Utilisateur</span>
            </h3>
            <button class="btn-close" (click)="showEditModal = false" aria-label="Fermer">
              <svg class="icon-svg icon-xs" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <form (ngSubmit)="submitEditUser()">
            <div class="modal-body">
              <div *ngIf="modalError" class="alert-error mb-3">
                {{ modalError }}
              </div>

              <div class="names-grid mb-2">
                <div class="form-group">
                  <label class="form-label">Prénom *</label>
                  <input type="text" class="form-control" [(ngModel)]="editFirstName" name="editFirstName" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Nom *</label>
                  <input type="text" class="form-control" [(ngModel)]="editLastName" name="editLastName" required />
                </div>
              </div>

              <div class="names-grid mb-2">
                <div class="form-group">
                  <label class="form-label">Email *</label>
                  <input type="email" class="form-control" [(ngModel)]="editEmail" name="editEmail" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Téléphone *</label>
                  <input type="tel" class="form-control" [(ngModel)]="editPhone" name="editPhone" required />
                </div>
              </div>

              <div class="names-grid mb-2">
                <div class="form-group">
                  <label class="form-label">Rôle *</label>
                  <select class="form-control" [(ngModel)]="editRole" name="editRole" required>
                    <option value="ROLE_PATIENT">Patient</option>
                    <option value="ROLE_DOCTOR">Médecin (Praticien)</option>
                    <option value="ROLE_ADMIN">Administrateur</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Statut *</label>
                  <select class="form-control" [(ngModel)]="editStatus" name="editStatus" required>
                    <option value="ACTIVE">Actif</option>
                    <option value="PENDING_VERIFICATION">En attente de vérification</option>
                    <option value="SUSPENDED">Suspendu</option>
                  </select>
                </div>
              </div>

              <div class="form-group mb-2">
                <label class="form-label">Nouveau mot de passe (Laisser vide pour ne pas modifier)</label>
                <input type="password" class="form-control" [(ngModel)]="editNewPassword" name="editNewPassword" placeholder="Optionnel" />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" (click)="showEditModal = false">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="submittingUser()">
                {{ submittingUser() ? 'Enregistrement...' : 'Enregistrer les modifications' }}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .admin-container { max-width: 1200px; padding: 2.5rem 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-title { font-size: 2rem; font-weight: 800; color: var(--color-dark); margin: 0.25rem 0 0.5rem; }
    .subtitle { color: var(--color-muted); font-size: 0.95rem; }

    /* Onglets */
    .admin-tabs {
      display: flex;
      gap: 0.75rem;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 0.75rem;
      flex-wrap: wrap;
    }
    .admin-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.75rem 1.35rem;
      border-radius: var(--radius-md);
      border: 1px solid transparent;
      background: #f8fafc;
      color: var(--color-muted);
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .admin-tab-btn:hover {
      background: #f1f5f9;
      color: var(--color-dark);
    }
    .admin-tab-btn.active {
      background: white;
      color: var(--color-primary);
      border-color: #cbd5e1;
      box-shadow: 0 2px 8px rgba(2, 132, 199, 0.1);
    }
    .tab-badge { background: #e2e8f0; color: #475569; font-size: 0.75rem; font-weight: 800; padding: 0.15rem 0.5rem; border-radius: var(--radius-full); }
    .bg-warning { background: #fef3c7; color: #92400e; }

    /* Verification Banner & Empty State Styling */
    .verification-banner {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 1.25rem 1.5rem;
      border-radius: var(--radius-lg);
      margin-bottom: 1.5rem;
    }
    .banner-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #dbeafe;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .banner-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--color-primary);
      margin: 0 0 0.25rem;
    }
    .banner-desc {
      font-size: 0.88rem;
      color: #334155;
      margin: 0;
      line-height: 1.45;
    }
    .empty-state {
      text-align: center;
      padding: 3rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      border: 1px dashed #cbd5e1;
      background: white;
      border-radius: var(--radius-lg);
    }
    .empty-icon-wrap {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #f0fdf4;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;
    }

    .filters-bar { display: flex; gap: 1rem; align-items: center; }
    .filter-select-wrap { min-width: 170px; }

    .table-card { padding: 1.75rem; border-radius: var(--radius-lg); }
    .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .table-title { font-size: 1.2rem; font-weight: 800; margin: 0 0 0.25rem; }
    .table-sub { font-size: 0.85rem; color: var(--color-muted); margin: 0; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .data-table th { text-align: left; padding: 0.85rem 1rem; border-bottom: 2px solid var(--color-border); color: var(--color-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 700; }
    .data-table td { padding: 0.9rem 1rem; border-bottom: 1px solid var(--color-border); vertical-align: middle; }
    
    .user-row-info { display: flex; align-items: center; gap: 0.75rem; }
    .user-row-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--color-muted-light);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: var(--color-primary);
      font-size: 0.85rem;
    }
    .role-pill { font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 4px; display: inline-block; }
    .role-admin { background: #fee2e2; color: #991b1b; }
    .role-doctor { background: #e0f2fe; color: #0369a1; }
    .role-patient { background: #f1f5f9; color: #475569; }
    .status-pill { font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 4px; display: inline-block; }
    .status-active { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-suspended { background: #fee2e2; color: #991b1b; }

    .btn-group-actions { display: flex; gap: 0.4rem; align-items: center; }
    .btn-xs { padding: 0.3rem 0.6rem; font-size: 0.75rem; font-weight: 700; border-radius: var(--radius-sm); cursor: pointer; }
    .btn-outline-warning { border: 1px solid #f59e0b; color: #d97706; background: transparent; }
    .btn-outline-success { border: 1px solid #10b981; color: #059669; background: transparent; }
    .btn-outline-danger { border: 1px solid #ef4444; color: #dc2626; background: transparent; }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }
    .modal-card {
      background: white;
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 560px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--color-border);
    }
    .modal-title { font-size: 1.15rem; font-weight: 800; color: var(--color-dark); margin: 0; }
    .btn-close { background: none; border: none; font-size: 1.25rem; cursor: pointer; color: var(--color-muted); }
    .modal-body { padding: 1.5rem; }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--color-border);
      background: #f8fafc;
    }
    .names-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .card-sub { background: var(--color-muted-light); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--color-border); }
    .sub-title { font-size: 0.85rem; font-weight: 700; color: var(--color-dark); }
    .block { display: block; }
    .text-xs { font-size: 0.75rem; }

    /* KPIs */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1.25rem; }
    .kpi-card { padding: 1.5rem; border-radius: var(--radius-lg); }
    .kpi-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .kpi-label { font-size: 0.85rem; font-weight: 700; color: var(--color-muted); }
    .kpi-icon-wrap { width: 40px; height: 40px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; }
    .bg-blue { background: #eff6ff; }
    .bg-green { background: #f0fdf4; }
    .bg-dark { background: #f3f4f6; }
    .bg-neutral { background: #faf5ff; }
    .kpi-val { font-size: 1.85rem; font-weight: 800; margin: 0 0 0.25rem; }
    .kpi-sub { font-size: 0.8rem; color: var(--color-muted); }

    /* Validation card */
    .pending-doctors-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
    .doc-verify-card { padding: 1.5rem; border-radius: var(--radius-lg); }
    .doc-verify-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .doc-info { display: flex; align-items: center; gap: 1rem; }
    .doc-avatar { width: 48px; height: 48px; border-radius: 50%; background: #e0f2fe; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem; color: var(--color-primary); }
    .doc-title { font-size: 1.15rem; font-weight: 800; margin: 0 0 0.25rem; }
    .doc-fee-badge { text-align: right; }
    .fee-val { font-size: 1.2rem; font-weight: 800; color: var(--color-dark); display: block; }
    .fee-lbl { font-size: 0.75rem; color: var(--color-muted); }
    .highlight-box { background: #fffbeb; border: 1px solid #fde68a; padding: 0.75rem 1rem; border-radius: var(--radius-md); margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; }
    .council-badge { display: flex; align-items: center; gap: 0.4rem; color: #92400e; font-size: 1rem; }
    .doc-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .meta-label { font-size: 0.78rem; color: var(--color-muted); display: block; }
    .meta-val { font-size: 0.9rem; color: var(--color-dark); }
    .doc-verify-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; border-top: 1px solid var(--color-border); padding-top: 1rem; }

    /* Audit & Metrics Styles */
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .action-badge { font-size: 0.75rem; font-weight: 700; background: #f8fafc; border-color: #cbd5e1; color: var(--color-dark); }
    .category-pill { font-size: 0.72rem; font-weight: 700; color: #475569; background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: 4px; }
    .badge-INFO { background: #dcfce7; color: #166534; font-weight: 700; }
    .badge-WARNING { background: #fef3c7; color: #92400e; font-weight: 700; }
    .badge-CRITICAL { background: #fee2e2; color: #991b1b; font-weight: 700; }
    .max-w-desc { max-width: 380px; line-height: 1.4; color: var(--color-dark); }
    .bg-yellow { background: #fef3c7; }
    .bg-red { background: #fee2e2; }

    .alert-success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-weight: 600; font-size: 0.9rem; }
    .alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fee2e2; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-weight: 600; font-size: 0.85rem; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);
  private readonly adminService = inject(AdminService);

  readonly governorates: string[] = [
    'Manouba', 'Tunis', 'Ariana', 'Ben Arous', 'Nabeul', 'Zaghouan',
    'Bizerte', 'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Sousse',
    'Monastir', 'Mahdia', 'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid',
    'Gabès', 'Médenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kébili'
  ];

  activeTab: AdminTab = 'USERS';

  stats = signal<FinancialStats | null>(null);
  transactions = signal<PaymentTransaction[]>([]);
  pendingDoctors = signal<PendingDoctorDetail[]>([]);
  users = signal<AdminUser[]>([]);
  auditLogs = signal<AuditLogEntry[]>([]);

  loadingTransactions = signal(false);
  loadingDoctors = signal(false);
  loadingUsers = signal(false);
  loadingAudit = signal(false);
  actionMessage = signal<string | null>(null);

  // Filtres Utilisateurs
  userSearchTerm = '';
  roleFilter = 'ALL';
  statusFilter = 'ALL';

  // Filtres Journal d'Audit
  auditSearchTerm = '';
  auditCategoryFilter = 'ALL';
  auditSeverityFilter = 'ALL';

  // Modal Create
  showCreateModal = false;
  newFirstName = '';
  newLastName = '';
  newEmail = '';
  newPhone = '+216 ';
  newPassword = '';
  newRole: Role = 'ROLE_PATIENT';
  newStatus: UserStatus = 'ACTIVE';
  newMedCouncilId = '';
  newSpecialty = 'Médecine Générale';
  newGovernorate = 'Manouba';
  newCity = 'Manouba Ville';
  newStreet = '';
  newFee = 60;

  // Modal Edit
  showEditModal = false;
  editingUserId = '';
  editFirstName = '';
  editLastName = '';
  editEmail = '';
  editPhone = '';
  editRole: Role = 'ROLE_PATIENT';
  editStatus: UserStatus = 'ACTIVE';
  editEmailVerified = true;
  editNewPassword = '';

  submittingUser = signal(false);
  modalError: string | null = null;

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loadUsers();
    this.loadDoctors();
    this.loadFinancials();
    this.loadAuditLogs();
  }

  loadDoctors(): void {
    this.loadingDoctors.set(true);
    this.adminService.getPendingDoctors().subscribe({
      next: (docs) => {
        this.pendingDoctors.set(docs);
        this.loadingDoctors.set(false);
      },
      error: () => this.loadingDoctors.set(false)
    });
  }

  loadUsers(): void {
    this.loadingUsers.set(true);
    this.adminService.getAllUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.loadingUsers.set(false);
      },
      error: () => this.loadingUsers.set(false)
    });
  }

  loadFinancials(): void {
    this.loadingTransactions.set(true);
    this.paymentService.getFinancialStats().subscribe({
      next: (s) => this.stats.set(s)
    });

    this.paymentService.getAllTransactions().subscribe({
      next: (res) => {
        this.transactions.set(res.content);
        this.loadingTransactions.set(false);
      },
      error: () => this.loadingTransactions.set(false)
    });
  }

  formatPaymentMethod(method?: string | null, status?: string): string {
    switch (method) {
      case 'CARTE_BANCAIRE': return 'Carte bancaire';
      case 'KONNECT': return 'Konnect';
      case 'FLOUCI': return 'Flouci';
      case 'CASH_AT_CABINET': return 'Espèces au cabinet';
      case 'ONLINE_PAYMENT': return status === 'PAID' ? 'Paiement en ligne' : 'Non sélectionné';
      default: return 'Non sélectionné';
    }
  }

  formatPaymentStatus(status: string): string {
    switch (status) {
      case 'PAID': return 'PAYÉ';
      case 'PENDING': return 'EN ATTENTE';
      case 'FAILED': return 'ÉCHOUÉ';
      case 'REFUNDED': return 'REMBOURSÉ';
      default: return status;
    }
  }

  getPaymentStatusBadge(status: string): string {
    switch (status) {
      case 'PAID': return 'badge-success';
      case 'PENDING': return 'badge-pending';
      case 'FAILED': return 'badge-emergency';
      default: return 'badge-outline';
    }
  }

  // --- Audit & Métriques ---

  get warningAuditCount(): number {
    return this.auditLogs().filter(l => l.severity === 'WARNING' || l.severity === 'CRITICAL').length;
  }

  get lastAuditTime(): string {
    const logs = this.auditLogs();
    if (!logs.length) return 'Récemment';
    const d = new Date(logs[0].timestamp);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  filteredAuditLogs(): AuditLogEntry[] {
    let list = this.auditLogs();
    if (this.auditCategoryFilter !== 'ALL') {
      list = list.filter(l => l.category === this.auditCategoryFilter);
    }
    if (this.auditSeverityFilter !== 'ALL') {
      list = list.filter(l => l.severity === this.auditSeverityFilter);
    }
    if (this.auditSearchTerm.trim()) {
      const term = this.auditSearchTerm.toLowerCase();
      list = list.filter(l =>
        (l.userName && l.userName.toLowerCase().includes(term)) ||
        (l.userEmail && l.userEmail.toLowerCase().includes(term)) ||
        (l.action && l.action.toLowerCase().includes(term)) ||
        (l.details && l.details.toLowerCase().includes(term)) ||
        (l.ipAddress && l.ipAddress.includes(term))
      );
    }
    return list;
  }

  getSeverityBadge(sev: string): string {
    return `badge-${sev}`;
  }

  formatLogDate(iso: string): string {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${d.toLocaleDateString('fr-TN', { day: '2-digit', month: 'short' })} à ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  selectAuditTab(): void {
    this.activeTab = 'AUDIT';
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.loadingAudit.set(true);
    this.adminService.getAuditLogs(100).subscribe({
      next: (logs) => {
        this.auditLogs.set(logs);
        this.loadingAudit.set(false);
      },
      error: () => this.loadingAudit.set(false)
    });
  }

  // --- CRUD Actions ---

  openCreateModal(): void {
    this.modalError = null;
    this.newFirstName = '';
    this.newLastName = '';
    this.newEmail = '';
    this.newPhone = '+216 ';
    this.newPassword = '';
    this.newRole = 'ROLE_PATIENT';
    this.newStatus = 'ACTIVE';
    this.newMedCouncilId = `TN-MED-${Math.floor(10000 + Math.random() * 90000)}`;
    this.newSpecialty = 'Cardiologie';
    this.newGovernorate = 'Manouba';
    this.newCity = 'Manouba Ville';
    this.newStreet = '';
    this.newFee = 60;
    this.showCreateModal = true;
  }

  submitCreateUser(): void {
    this.modalError = null;
    this.submittingUser.set(true);

    this.adminService.createUser({
      firstName: this.newFirstName.trim(),
      lastName: this.newLastName.trim(),
      email: this.newEmail.trim(),
      phoneNumber: this.newPhone.trim().replace(/\s+/g, ''),
      password: this.newPassword,
      role: this.newRole,
      status: this.newStatus,
      medicalCouncilId: this.newRole === 'ROLE_DOCTOR' ? this.newMedCouncilId : undefined,
      specialty: this.newRole === 'ROLE_DOCTOR' ? this.newSpecialty : undefined,
      governorate: this.newRole === 'ROLE_DOCTOR' ? this.newGovernorate : undefined,
      city: this.newRole === 'ROLE_DOCTOR' ? this.newCity : undefined,
      street: this.newRole === 'ROLE_DOCTOR' ? this.newStreet : undefined,
      consultationFee: this.newRole === 'ROLE_DOCTOR' ? this.newFee : undefined
    }).subscribe({
      next: (created) => {
        this.submittingUser.set(false);
        this.showCreateModal = false;
        this.showSuccess(`Compte créé avec succès pour ${created.firstName} ${created.lastName} (${created.email}).`);
        this.loadUsers();
        if (this.newRole === 'ROLE_DOCTOR') {
          this.loadDoctors();
        }
      },
      error: (err) => {
        this.submittingUser.set(false);
        this.modalError = err.error?.message || 'Erreur lors de la création de l\'utilisateur.';
      }
    });
  }

  openEditModal(user: AdminUser): void {
    this.modalError = null;
    this.editingUserId = user.id;
    this.editFirstName = user.firstName;
    this.editLastName = user.lastName;
    this.editEmail = user.email;
    this.editPhone = user.phoneNumber || '';
    this.editRole = user.roles[0] || 'ROLE_PATIENT';
    this.editStatus = user.status;
    this.editEmailVerified = user.emailVerified;
    this.editNewPassword = '';
    this.showEditModal = true;
  }

  submitEditUser(): void {
    this.modalError = null;
    this.submittingUser.set(true);

    this.adminService.updateUser(this.editingUserId, {
      firstName: this.editFirstName.trim(),
      lastName: this.editLastName.trim(),
      email: this.editEmail.trim(),
      phoneNumber: this.editPhone.trim().replace(/\s+/g, ''),
      role: this.editRole,
      status: this.editStatus,
      emailVerified: this.editEmailVerified,
      newPassword: this.editNewPassword.trim() ? this.editNewPassword.trim() : undefined
    }).subscribe({
      next: (updated) => {
        this.submittingUser.set(false);
        this.showEditModal = false;
        this.showSuccess(`Utilisateur ${updated.firstName} ${updated.lastName} mis à jour avec succès.`);
        this.loadUsers();
      },
      error: (err) => {
        this.submittingUser.set(false);
        this.modalError = err.error?.message || 'Erreur lors de la mise à jour de l\'utilisateur.';
      }
    });
  }

  verifyDoctor(id: string, name: string): void {
    if (!confirm(`Confirmez-vous la certification de ${name} après vérification de son matricule auprès du Conseil de l'Ordre ?`)) {
      return;
    }

    this.adminService.verifyDoctor(id).subscribe({
      next: () => {
        this.showSuccess(`Le praticien ${name} a été certifié avec succès et son compte est désormais actif.`);
        this.loadDoctors();
        this.loadUsers();
      }
    });
  }

  rejectDoctor(id: string, name: string): void {
    const reason = prompt(`Motif du refus pour ${name} :`, 'Matricule non conforme ou faux profil');
    if (!reason) return;

    this.adminService.rejectDoctor(id, reason).subscribe({
      next: () => {
        this.showSuccess(`Le dossier de ${name} a été rejeté et le compte a été suspendu.`);
        this.loadDoctors();
        this.loadUsers();
      }
    });
  }

  toggleUserStatus(userId: string, newStatus: string): void {
    this.adminService.updateUserStatus(userId, newStatus).subscribe({
      next: (updated) => {
        this.showSuccess(`Statut mis à jour pour ${updated.email} : ${newStatus}`);
        this.loadUsers();
      }
    });
  }

  deleteUser(userId: string, name: string): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur ${name} ? Cette action est irréversible.`)) {
      return;
    }

    this.adminService.deleteUser(userId).subscribe({
      next: () => {
        this.showSuccess(`L'utilisateur ${name} a été supprimé de la plateforme.`);
        this.loadUsers();
        this.loadDoctors();
      }
    });
  }

  filteredUsers(): AdminUser[] {
    const term = this.userSearchTerm.toLowerCase().trim();
    return this.users().filter(u => {
      const matchTerm = !term ||
        u.firstName.toLowerCase().includes(term) ||
        u.lastName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.phoneNumber && u.phoneNumber.includes(term));

      const matchRole = this.roleFilter === 'ALL' || u.roles.includes(this.roleFilter as Role);
      const matchStatus = this.statusFilter === 'ALL' || u.status === this.statusFilter;

      return matchTerm && matchRole && matchStatus;
    });
  }

  private showSuccess(msg: string): void {
    this.actionMessage.set(msg);
    setTimeout(() => this.actionMessage.set(null), 5000);
  }
}
