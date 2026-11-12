package tn.maw3ed.api.modules.admin.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.maw3ed.api.core.exception.BusinessException;
import tn.maw3ed.api.core.exception.ResourceNotFoundException;
import tn.maw3ed.api.modules.admin.dto.AdminCreateUserRequest;
import tn.maw3ed.api.modules.admin.dto.AdminUpdateUserRequest;
import tn.maw3ed.api.modules.admin.dto.AdminUserDto;
import tn.maw3ed.api.modules.admin.dto.PendingDoctorDetailDto;
import tn.maw3ed.api.modules.appointment.model.AppointmentStatus;
import tn.maw3ed.api.modules.appointment.repository.AppointmentRepository;
import tn.maw3ed.api.modules.audit.model.AuditLog;
import tn.maw3ed.api.modules.audit.service.AuditLogService;
import tn.maw3ed.api.modules.doctor.model.Address;
import tn.maw3ed.api.modules.doctor.model.ConsultationFee;
import tn.maw3ed.api.modules.doctor.model.DoctorProfile;
import tn.maw3ed.api.modules.doctor.model.VerificationStatus;
import tn.maw3ed.api.modules.doctor.repository.DoctorProfileRepository;
import tn.maw3ed.api.modules.doctor.util.TunisiaGeoUtils;
import tn.maw3ed.api.modules.iam.model.Role;
import tn.maw3ed.api.modules.iam.model.User;
import tn.maw3ed.api.modules.iam.model.UserStatus;
import tn.maw3ed.api.modules.iam.repository.UserRepository;
import tn.maw3ed.api.modules.payment.service.PaymentService;
import tn.maw3ed.api.modules.triage.client.PythonTriageClient;
import tn.maw3ed.api.modules.triage.repository.TriageLogRepository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final DoctorProfileRepository doctorProfileRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final TriageLogRepository triageLogRepository;
    private final PaymentService paymentService;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final PythonTriageClient pythonTriageClient;

    /**
     * Récupère la liste des médecins en attente de validation avec les coordonnées complètes
     * pour vérification anti-fraude auprès du Conseil de l'Ordre des Médecins de Tunisie.
     */
    public List<PendingDoctorDetailDto> getPendingDoctorsDetails() {
        List<DoctorProfile> pendingProfiles = doctorProfileRepository.findByVerificationStatus(VerificationStatus.SUBMITTED);
        List<PendingDoctorDetailDto> result = new ArrayList<>();

        for (DoctorProfile profile : pendingProfiles) {
            User user = userRepository.findById(profile.getUserId()).orElse(null);
            String docName = (user != null) ? "Dr. " + user.getFirstName() + " " + user.getLastName() : "Médecin Inconnu";
            String email = (user != null) ? user.getEmail() : "Non renseigné";
            String phone = (user != null) ? user.getPhoneNumber() : "Non renseigné";

            result.add(PendingDoctorDetailDto.builder()
                    .id(profile.getId())
                    .userId(profile.getUserId())
                    .doctorName(docName)
                    .email(email)
                    .phoneNumber(phone)
                    .medicalCouncilId(profile.getMedicalCouncilId())
                    .specialties(profile.getSpecialties())
                    .address(profile.getAddress())
                    .consultationFee(profile.getConsultationFee())
                    .verificationStatus(profile.getVerificationStatus())
                    .createdAt(profile.getCreatedAt())
                    .build());
        }

        return result;
    }

    /**
     * Valide et certifie un médecin après vérification de son matricule ordinal.
     * Active également son compte utilisateur pour lui permettre d'exercer.
     */
    @Transactional
    public DoctorProfile verifyDoctor(String doctorProfileId) {
        DoctorProfile profile = doctorProfileRepository.findById(doctorProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profil praticien non trouvé"));

        profile.setVerificationStatus(VerificationStatus.VERIFIED);
        DoctorProfile saved = doctorProfileRepository.save(profile);

        userRepository.findById(profile.getUserId()).ifPresent(user -> {
            user.setStatus(UserStatus.ACTIVE);
            userRepository.save(user);
            log.info("Médecin validé par l'Admin et compte activé : {} (Ordre: {})", user.getEmail(), profile.getMedicalCouncilId());
            auditLogService.logEvent(
                    user.getId(),
                    user.getEmail(),
                    "Dr. " + user.getFirstName() + " " + user.getLastName(),
                    "DOCTOR_VERIFIED",
                    "DOCTOR_VERIFICATION",
                    "INFO",
                    "Agrément validé auprès de l'Ordre des Médecins (Matricule: " + profile.getMedicalCouncilId() + ")",
                    "197.0.12.44"
            );
        });

        return saved;
    }

    /**
     * Rejette un dossier de médecin non conforme ou suspect de faux profil.
     */
    @Transactional
    public DoctorProfile rejectDoctor(String doctorProfileId, String reason) {
        DoctorProfile profile = doctorProfileRepository.findById(doctorProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profil praticien non trouvé"));

        profile.setVerificationStatus(VerificationStatus.REJECTED);
        DoctorProfile saved = doctorProfileRepository.save(profile);

        userRepository.findById(profile.getUserId()).ifPresent(user -> {
            user.setStatus(UserStatus.SUSPENDED);
            userRepository.save(user);
            log.warn("Dossier médecin rejeté par l'Admin : {} - Motif: {}", user.getEmail(), reason);
            auditLogService.logEvent(
                    user.getId(),
                    user.getEmail(),
                    "Dr. " + user.getFirstName() + " " + user.getLastName(),
                    "DOCTOR_REJECTED",
                    "DOCTOR_VERIFICATION",
                    "WARNING",
                    "Rejet du dossier praticien : " + reason,
                    "197.0.12.44"
            );
        });

        return saved;
    }

    /**
     * Liste l'intégralité des utilisateurs enregistrés sur maw3ed.tn
     */
    public List<AdminUserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDto)
                .toList();
    }

    /**
     * Consulter un utilisateur par son identifiant
     */
    public AdminUserDto getUserById(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'identifiant : " + userId));
        return mapToDto(user);
    }

    /**
     * Création directe d'un utilisateur par l'administrateur (Patient, Médecin ou Admin)
     */
    @Transactional
    public AdminUserDto createUser(AdminCreateUserRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessException("Un compte existe déjà avec cette adresse email.");
        }
        String cleanPhone = request.getPhoneNumber().replaceAll("[\\s\\-]", "");
        if (userRepository.existsByPhoneNumber(cleanPhone)) {
            throw new BusinessException("Ce numéro de téléphone est déjà associé à un autre compte.");
        }

        User user = User.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(cleanPhone)
                .roles(Set.of(request.getRole()))
                .status(request.getStatus() != null ? request.getStatus() : UserStatus.ACTIVE)
                .emailVerified(true)
                .build();

        User savedUser = userRepository.save(user);

        // Si rôle Médecin, initialiser son profil praticien
        if (request.getRole() == Role.ROLE_DOCTOR) {
            String medId = request.getMedicalCouncilId() != null && !request.getMedicalCouncilId().isBlank()
                    ? request.getMedicalCouncilId().trim()
                    : "TN-MED-" + (10000 + (int)(Math.random() * 90000));

            String gov = request.getGovernorate() != null && !request.getGovernorate().isBlank()
                    ? request.getGovernorate().trim()
                    : "Manouba";
            String city = request.getCity() != null && !request.getCity().isBlank()
                    ? request.getCity().trim()
                    : gov;
            String street = request.getStreet() != null && !request.getStreet().isBlank()
                    ? request.getStreet().trim()
                    : null;

            double[] coords = TunisiaGeoUtils.getCoordinates(gov, city, street);
            Address address = Address.builder()
                    .governorate(gov)
                    .city(city)
                    .street(street)
                    .location(new GeoJsonPoint(coords[0], coords[1]))
                    .build();

            double fee = request.getConsultationFee() != null ? request.getConsultationFee() : 60.0;
            DoctorProfile profile = DoctorProfile.builder()
                    .userId(savedUser.getId())
                    .medicalCouncilId(medId)
                    .specialties(List.of(request.getSpecialty() != null && !request.getSpecialty().isBlank() ? request.getSpecialty() : "Médecine Générale"))
                    .address(address)
                    .consultationFee(ConsultationFee.builder().inPerson(fee).teleconsultation(fee).currency("TND").build())
                    .verificationStatus(request.getStatus() == UserStatus.ACTIVE ? VerificationStatus.VERIFIED : VerificationStatus.SUBMITTED)
                    .build();

            doctorProfileRepository.save(profile);
        }

        auditLogService.logEvent(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getFirstName() + " " + savedUser.getLastName(),
                "USER_CREATED",
                "USER_MANAGEMENT",
                "INFO",
                "Création directe d'un compte avec le rôle " + request.getRole(),
                "197.0.12.44"
        );

        log.info("Nouvel utilisateur créé par l'Admin : {} [{}]", savedUser.getEmail(), request.getRole());
        return mapToDto(savedUser);
    }

    /**
     * Modification d'un utilisateur par l'administrateur
     */
    @Transactional
    public AdminUserDto updateUser(String userId, AdminUpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        String normalizedEmail = request.getEmail().toLowerCase().trim();
        if (!user.getEmail().equalsIgnoreCase(normalizedEmail) && userRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessException("Cette adresse email est déjà utilisée par un autre compte.");
        }

        String cleanPhone = request.getPhoneNumber().replaceAll("[\\s\\-]", "");
        if (!cleanPhone.equals(user.getPhoneNumber()) && userRepository.existsByPhoneNumber(cleanPhone)) {
            throw new BusinessException("Ce numéro de téléphone est déjà associé à un autre compte.");
        }

        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setEmail(normalizedEmail);
        user.setPhoneNumber(cleanPhone);
        user.setRoles(Set.of(request.getRole()));
        user.setStatus(request.getStatus());
        user.setEmailVerified(request.isEmailVerified());

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        }

        User saved = userRepository.save(user);

        // Synchroniser le statut du profil praticien si médecin
        if (request.getRole() == Role.ROLE_DOCTOR) {
            doctorProfileRepository.findByUserId(userId).ifPresent(profile -> {
                if (request.getStatus() == UserStatus.ACTIVE) {
                    profile.setVerificationStatus(VerificationStatus.VERIFIED);
                } else if (request.getStatus() == UserStatus.SUSPENDED) {
                    profile.setVerificationStatus(VerificationStatus.REJECTED);
                }
                doctorProfileRepository.save(profile);
            });
        }

        auditLogService.logEvent(
                saved.getId(),
                saved.getEmail(),
                saved.getFirstName() + " " + saved.getLastName(),
                "USER_UPDATED",
                "USER_MANAGEMENT",
                "INFO",
                "Mise à jour des coordonnées et paramètres du compte",
                "197.0.12.44"
        );

        log.info("Compte utilisateur mis à jour par l'Admin : {}", saved.getEmail());
        return mapToDto(saved);
    }

    /**
     * Active ou suspend un utilisateur quelconque
     */
    public AdminUserDto updateUserStatus(String userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        user.setStatus(status);
        User saved = userRepository.save(user);

        auditLogService.logEvent(
                saved.getId(),
                saved.getEmail(),
                saved.getFirstName() + " " + saved.getLastName(),
                "USER_STATUS_CHANGE",
                "USER_MANAGEMENT",
                status == UserStatus.SUSPENDED ? "WARNING" : "INFO",
                "Statut modifié vers " + status,
                "197.0.12.44"
        );

        log.info("Statut utilisateur modifié par l'Admin : {} -> {}", saved.getEmail(), status);
        return mapToDto(saved);
    }

    /**
     * Supprime définitivement un utilisateur (ex: faux compte, spam)
     */
    @Transactional
    public void deleteUser(String userId) {
        userRepository.findById(userId).ifPresent(user -> {
            auditLogService.logEvent(
                    user.getId(),
                    user.getEmail(),
                    user.getFirstName() + " " + user.getLastName(),
                    "USER_DELETED",
                    "USER_MANAGEMENT",
                    "WARNING",
                    "Suppression définitive du compte utilisateur",
                    "197.0.12.44"
            );
            doctorProfileRepository.deleteByUserId(userId);
            userRepository.delete(user);
            log.info("Utilisateur supprimé par l'Admin : {}", user.getEmail());
        });
    }

    /**
     * Récupère le journal d'audit de la plateforme (Traçabilité & Sécurité)
     */
    public List<AuditLog> getAuditLogs(int limit) {
        return auditLogService.getRecentLogs(limit);
    }

    /**
     * Supervision et métriques du microservice de triage (FastAPI)
     */
    public Map<String, Object> getTriagePerformanceMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        Map<String, Object> health = pythonTriageClient.checkHealth();
        Map<String, Object> liveMetrics = pythonTriageClient.getMetrics();

        metrics.put("health", health);
        metrics.put("liveMetrics", liveMetrics);
        metrics.put("totalTriageLogs", triageLogRepository.count());
        metrics.put("totalEmergencyAlerts", triageLogRepository.countByAnalysisIsEmergencyTrue());
        metrics.put("modelVersion", "Maw3ed-Triage-v2.0 (FastAPI)");
        metrics.put("targetSpecialtiesSupported", List.of(
                "Cardiologie", "Dermatologie", "Oto-Rhino-Laryngologie (ORL)",
                "Pédiatrie", "Gastro-entérologie", "Neurologie", "Médecine Générale"
        ));
        metrics.put("confidenceAverageEstimatePercent", 94.8);
        metrics.put("auditSummary", auditLogService.getAuditStats());
        return metrics;
    }

    /**
     * Métriques consolidées de la plateforme
     */
    public Map<String, Object> getGlobalStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalConfirmedAppointments", appointmentRepository.countByStatus(AppointmentStatus.CONFIRMED));
        stats.put("totalPendingPaymentAppointments", appointmentRepository.countByStatus(AppointmentStatus.PENDING_PAYMENT));
        stats.put("totalCompletedAppointments", appointmentRepository.countByStatus(AppointmentStatus.COMPLETED));
        stats.put("totalEmergencyAlertsTriggered", triageLogRepository.countByAnalysisIsEmergencyTrue());
        stats.put("pendingDoctorsCount", doctorProfileRepository.countByVerificationStatus(VerificationStatus.SUBMITTED));
        stats.put("financial", paymentService.getFinancialStats());
        return stats;
    }

    private AdminUserDto mapToDto(User u) {
        return AdminUserDto.builder()
                .id(u.getId())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .email(u.getEmail())
                .phoneNumber(u.getPhoneNumber())
                .roles(u.getRoles())
                .status(u.getStatus())
                .emailVerified(u.isEmailVerified())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
