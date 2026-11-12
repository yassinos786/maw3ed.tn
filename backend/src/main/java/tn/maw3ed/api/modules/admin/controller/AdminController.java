package tn.maw3ed.api.modules.admin.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.maw3ed.api.modules.admin.dto.AdminCreateUserRequest;
import tn.maw3ed.api.modules.admin.dto.AdminUpdateUserRequest;
import tn.maw3ed.api.modules.admin.dto.AdminUserDto;
import tn.maw3ed.api.modules.admin.dto.PendingDoctorDetailDto;
import tn.maw3ed.api.modules.admin.service.AdminService;
import tn.maw3ed.api.modules.audit.model.AuditLog;
import tn.maw3ed.api.modules.doctor.model.DoctorProfile;
import tn.maw3ed.api.modules.iam.model.UserStatus;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Administration & Supervision", description = "Gestion CRUD des utilisateurs, validation des médecins et métriques globales")
public class AdminController {

    private final AdminService adminService;

    // --- 1. Validation des Praticiens ---

    @GetMapping("/doctors/pending")
    @Operation(summary = "Lister les praticiens en attente avec détails d'accréditation", description = "Fournit le matricule de l'Ordre des Médecins, les diplômes, spécialités et coordonnées pour contrôle anti-fraude")
    public ResponseEntity<List<PendingDoctorDetailDto>> getPendingDoctors() {
        return ResponseEntity.ok(adminService.getPendingDoctorsDetails());
    }

    @PatchMapping("/doctors/{id}/verify")
    @Operation(summary = "Valider et certifier un médecin", description = "Certifie le profil du praticien et active son compte sur la plateforme")
    public ResponseEntity<DoctorProfile> verifyDoctor(@PathVariable String id) {
        return ResponseEntity.ok(adminService.verifyDoctor(id));
    }

    @PatchMapping("/doctors/{id}/reject")
    @Operation(summary = "Rejeter le dossier d'un médecin", description = "Rejette la demande d'inscription et suspend le compte associé")
    public ResponseEntity<DoctorProfile> rejectDoctor(
            @PathVariable String id,
            @RequestParam(defaultValue = "Matricule ou profil non conforme") String reason) {
        return ResponseEntity.ok(adminService.rejectDoctor(id, reason));
    }

    // --- 2. CRUD des Utilisateurs ---

    @GetMapping("/users")
    @Operation(summary = "Lister tous les utilisateurs de la plateforme (Read All)", description = "Retourne la liste complète des patients, praticiens et administrateurs")
    public ResponseEntity<List<AdminUserDto>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/users/{userId}")
    @Operation(summary = "Consulter un compte utilisateur par son identifiant (Read One)")
    public ResponseEntity<AdminUserDto> getUserById(@PathVariable String userId) {
        return ResponseEntity.ok(adminService.getUserById(userId));
    }

    @PostMapping("/users")
    @Operation(summary = "Créer un nouvel utilisateur par l'administrateur (Create)", description = "Permet de créer directement un compte Patient, Médecin ou Administrateur")
    public ResponseEntity<AdminUserDto> createUser(@Valid @RequestBody AdminCreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createUser(request));
    }

    @PutMapping("/users/{userId}")
    @Operation(summary = "Mettre à jour les informations d'un utilisateur (Update)", description = "Permet à l'administrateur de modifier les coordonnées, rôle, statut ou mot de passe")
    public ResponseEntity<AdminUserDto> updateUser(
            @PathVariable String userId,
            @Valid @RequestBody AdminUpdateUserRequest request) {
        return ResponseEntity.ok(adminService.updateUser(userId, request));
    }

    @PatchMapping("/users/{userId}/status")
    @Operation(summary = "Activer ou suspendre un compte utilisateur (Partial Update)", description = "Permet à l'Admin d'activer ou de suspendre un utilisateur (ex: signalement abusif)")
    public ResponseEntity<AdminUserDto> updateUserStatus(
            @PathVariable String userId,
            @RequestParam UserStatus status) {
        return ResponseEntity.ok(adminService.updateUserStatus(userId, status));
    }

    @DeleteMapping("/users/{userId}")
    @Operation(summary = "Supprimer définitivement un utilisateur (Delete)", description = "Supprime le compte utilisateur et ses données associées")
    public ResponseEntity<Void> deleteUser(@PathVariable String userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    // --- 3. Métriques & Statistiques ---

    @GetMapping("/stats")
    @Operation(summary = "Tableau de bord statistique global")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(adminService.getGlobalStats());
    }

    // --- 4. Traçabilité, Audit & Sécurité ---

    @GetMapping("/audit-logs")
    @Operation(summary = "Journal d'audit et historique des événements de la plateforme", description = "Fournit la traçabilité complète des actions utilisateurs, modifications administratives et alertes de sécurité")
    public ResponseEntity<List<AuditLog>> getAuditLogs(@RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(adminService.getAuditLogs(limit));
    }

    // --- 5. Supervision & Métriques Triage FastAPI ---

    @GetMapping("/triage-metrics")
    @Operation(summary = "Métriques de performance du microservice FastAPI", description = "Fournit la télémétrie en temps réel du service de triage (latence, détection d'urgence, état du service)")
    public ResponseEntity<Map<String, Object>> getTriageMetrics() {
        return ResponseEntity.ok(adminService.getTriagePerformanceMetrics());
    }
}
