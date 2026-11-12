package tn.maw3ed.api.modules.iam.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.maw3ed.api.core.exception.BusinessException;
import tn.maw3ed.api.core.exception.ResourceNotFoundException;
import tn.maw3ed.api.modules.audit.service.AuditLogService;
import tn.maw3ed.api.modules.doctor.model.Address;
import tn.maw3ed.api.modules.doctor.model.ConsultationFee;
import tn.maw3ed.api.modules.doctor.model.DoctorProfile;
import tn.maw3ed.api.modules.doctor.model.VerificationStatus;
import tn.maw3ed.api.modules.doctor.repository.DoctorProfileRepository;
import tn.maw3ed.api.modules.doctor.util.TunisiaGeoUtils;
import tn.maw3ed.api.modules.iam.dto.request.LoginRequest;
import tn.maw3ed.api.modules.iam.dto.request.RefreshTokenRequest;
import tn.maw3ed.api.modules.iam.dto.request.RegisterAdminRequest;
import tn.maw3ed.api.modules.iam.dto.request.RegisterDoctorRequest;
import tn.maw3ed.api.modules.iam.dto.request.RegisterPatientRequest;
import tn.maw3ed.api.modules.iam.dto.response.AuthResponse;
import tn.maw3ed.api.modules.iam.dto.response.UserSummaryDto;
import tn.maw3ed.api.modules.iam.model.Role;
import tn.maw3ed.api.modules.iam.model.User;
import tn.maw3ed.api.modules.iam.model.UserStatus;
import tn.maw3ed.api.modules.iam.repository.UserRepository;
import tn.maw3ed.api.security.jwt.JwtTokenProvider;
import tn.maw3ed.api.security.user.UserPrincipal;

import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final AuditLogService auditLogService;

    @Value("${application.security.jwt.access-token-expiration-ms:900000}")
    private long accessTokenExpirationMs;

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Identifiants incorrects (email ou mot de passe invalide)"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Identifiants incorrects (email ou mot de passe invalide)");
        }

        // Vérification stricte du statut du compte selon les règles d'agrément
        if (user.getRoles().contains(Role.ROLE_DOCTOR)) {
            if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
                throw new BusinessException("Votre compte praticien est en attente de validation par l'administrateur. L'accès à votre espace sera ouvert dès vérification de votre matricule auprès de l'Ordre des Médecins.");
            }
            if (user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.DELETED) {
                throw new BusinessException("Votre compte praticien a été suspendu ou refusé par l'administration.");
            }
            if (user.getStatus() != UserStatus.ACTIVE) {
                throw new BusinessException("Votre compte praticien n'est pas encore actif.");
            }
        } else {
            if (user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.DELETED) {
                throw new BusinessException("Ce compte utilisateur a été suspendu.");
            }
            if (user.getStatus() != UserStatus.ACTIVE) {
                throw new BusinessException("Ce compte utilisateur n'est pas encore actif.");
            }
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        auditLogService.logEvent(
                userPrincipal.getId(),
                userPrincipal.getEmail(),
                userPrincipal.getFirstName() + " " + userPrincipal.getLastName(),
                "AUTH_LOGIN",
                "AUTHENTICATION",
                "INFO",
                "Connexion réussie à l'espace maw3ed.tn (Rôle: " + userPrincipal.getAuthorities() + ")",
                "197.0.12.44"
        );

        return generateAuthResponse(userPrincipal);
    }

    public AuthResponse registerPatient(RegisterPatientRequest request) {
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
                .roles(Set.of(Role.ROLE_PATIENT))
                .status(UserStatus.ACTIVE)
                .emailVerified(false)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Nouveau patient inscrit : {}", savedUser.getEmail());

        auditLogService.logEvent(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getFirstName() + " " + savedUser.getLastName(),
                "PATIENT_REGISTER",
                "USER_MANAGEMENT",
                "INFO",
                "Inscription d'un nouveau patient sur la plateforme",
                "197.0.12.44"
        );

        return generateAuthResponse(UserPrincipal.create(savedUser));
    }

    @Transactional
    public AuthResponse registerDoctor(RegisterDoctorRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessException("Un compte existe déjà avec cette adresse email.");
        }
        if (doctorProfileRepository.existsByMedicalCouncilId(request.getMedicalCouncilId())) {
            throw new BusinessException("Ce numéro d'inscription au conseil de l'ordre est déjà enregistré.");
        }

        String cleanPhone = request.getPhoneNumber().replaceAll("[\\s\\-]", "");
        if (userRepository.existsByPhoneNumber(cleanPhone)) {
            throw new BusinessException("Ce numéro de téléphone est déjà associé à un autre compte.");
        }

        // 1. Création du compte utilisateur en attente de validation
        User user = User.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(cleanPhone)
                .roles(Set.of(Role.ROLE_DOCTOR))
                .status(UserStatus.PENDING_VERIFICATION)
                .emailVerified(false)
                .build();

        User savedUser = userRepository.save(user);

        // 2. Détermination des coordonnées géographiques GPS réelles
        double lon;
        double lat;
        if (request.getLongitude() != null && request.getLatitude() != null) {
            lon = request.getLongitude();
            lat = request.getLatitude();
        } else {
            double[] coords = TunisiaGeoUtils.getCoordinates(
                    request.getGovernorate(), request.getCity(), request.getStreet());
            lon = coords[0];
            lat = coords[1];
        }

        Address cabinetAddress = Address.builder()
                .street(request.getStreet() != null && !request.getStreet().isBlank() ? request.getStreet().trim() : null)
                .city(request.getCity().trim())
                .governorate(request.getGovernorate().trim())
                .location(new GeoJsonPoint(lon, lat))
                .build();

        double feeAmount = request.getConsultationFee() != null ? request.getConsultationFee() : 60.0;
        ConsultationFee fee = ConsultationFee.builder()
                .inPerson(feeAmount)
                .teleconsultation(feeAmount)
                .currency("TND")
                .build();

        DoctorProfile profile = DoctorProfile.builder()
                .userId(savedUser.getId())
                .fullName("Dr. " + savedUser.getFirstName() + " " + savedUser.getLastName())
                .medicalCouncilId(request.getMedicalCouncilId().trim())
                .specialties(request.getSpecialties())
                .address(cabinetAddress)
                .consultationFee(fee)
                .verificationStatus(VerificationStatus.SUBMITTED)
                .build();

        doctorProfileRepository.save(profile);
        log.info("Nouveau praticien inscrit en attente de vérification administrative : {} (Matricule: {}, GPS: [{}, {}])",
                savedUser.getEmail(), request.getMedicalCouncilId(), lon, lat);

        auditLogService.logEvent(
                savedUser.getId(),
                savedUser.getEmail(),
                "Dr. " + savedUser.getFirstName() + " " + savedUser.getLastName(),
                "DOCTOR_REGISTER_SUBMITTED",
                "DOCTOR_VERIFICATION",
                "INFO",
                "Dossier praticien soumis pour validation anti-fraude (Ordre: " + request.getMedicalCouncilId() + ")",
                "197.0.12.44"
        );

        // Le médecin inscrit ne reçoit pas de jeton d'accès : son compte requiert la validation préalable de l'Administrateur
        return AuthResponse.builder()
                .accessToken(null)
                .refreshToken(null)
                .user(UserSummaryDto.builder()
                        .id(savedUser.getId())
                        .email(savedUser.getEmail())
                        .firstName(savedUser.getFirstName())
                        .lastName(savedUser.getLastName())
                        .phoneNumber(savedUser.getPhoneNumber())
                        .roles(savedUser.getRoles())
                        .status(savedUser.getStatus())
                        .build())
                .build();
    }

    public AuthResponse registerAdmin(RegisterAdminRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        if (!"MAW3ED_ADMIN_2026".equalsIgnoreCase(request.getAdminSecurityKey().trim())) {
            throw new BusinessException("Clé de sécurité administrateur invalide. Création de compte admin refusée.");
        }
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessException("Un compte existe déjà avec cette adresse email.");
        }
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new BusinessException("Ce numéro de téléphone est déjà associé à un autre compte.");
        }

        User user = User.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber().trim())
                .roles(Set.of(Role.ROLE_ADMIN))
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Nouvel Administrateur système enregistré : {}", savedUser.getEmail());

        return generateAuthResponse(UserPrincipal.create(savedUser));
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String token = request.getRefreshToken();
        if (!tokenProvider.validateToken(token)) {
            throw new BusinessException("Le jeton de rafraîchissement est invalide ou expiré.");
        }

        String userId = tokenProvider.getUserIdFromToken(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if (user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.DELETED) {
            throw new BusinessException("Le compte utilisateur n'est plus actif.");
        }

        return generateAuthResponse(UserPrincipal.create(user));
    }

    private AuthResponse generateAuthResponse(UserPrincipal userPrincipal) {
        String accessToken = tokenProvider.generateAccessToken(userPrincipal);
        String refreshToken = tokenProvider.generateRefreshToken(userPrincipal);

        UserSummaryDto userSummary = UserSummaryDto.builder()
                .id(userPrincipal.getId())
                .email(userPrincipal.getEmail())
                .firstName(userPrincipal.getFirstName())
                .lastName(userPrincipal.getLastName())
                .roles(userPrincipal.getAuthorities().stream()
                        .map(a -> Role.valueOf(a.getAuthority()))
                        .collect(java.util.stream.Collectors.toSet()))
                .status(userPrincipal.getStatus())
                .build();

        return AuthResponse.builder()
                .tokenType("Bearer")
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresInMs(accessTokenExpirationMs)
                .user(userSummary)
                .build();
    }
}
