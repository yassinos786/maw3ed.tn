package tn.maw3ed.api.modules.iam.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tn.maw3ed.api.modules.iam.dto.request.LoginRequest;
import tn.maw3ed.api.modules.iam.dto.request.RefreshTokenRequest;
import tn.maw3ed.api.modules.iam.dto.request.RegisterAdminRequest;
import tn.maw3ed.api.modules.iam.dto.request.RegisterDoctorRequest;
import tn.maw3ed.api.modules.iam.dto.request.RegisterPatientRequest;
import tn.maw3ed.api.modules.iam.dto.response.AuthResponse;
import tn.maw3ed.api.modules.iam.dto.response.UserSummaryDto;
import tn.maw3ed.api.modules.iam.model.Role;
import tn.maw3ed.api.modules.iam.service.AuthService;
import tn.maw3ed.api.security.user.UserPrincipal;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification & IAM", description = "Endpoints de connexion, inscription par rôle et gestion des jetons JWT")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Connexion utilisateur", description = "Authentifie un utilisateur et délivre les jetons JWT")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register/patient")
    @Operation(summary = "Inscription Patient", description = "Crée un nouveau compte patient actif")
    public ResponseEntity<AuthResponse> registerPatient(@Valid @RequestBody RegisterPatientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerPatient(request));
    }

    @PostMapping("/register/doctor")
    @Operation(summary = "Inscription Médecin", description = "Crée un nouveau compte médecin et son profil professionnel en attente de vérification administrative")
    public ResponseEntity<AuthResponse> registerDoctor(@Valid @RequestBody RegisterDoctorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerDoctor(request));
    }

    @PostMapping("/register/admin")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Inscription Administrateur (Restreint)", description = "Création de compte administrateur réservée strictement aux administrateurs connectés")
    public ResponseEntity<AuthResponse> registerAdmin(@Valid @RequestBody RegisterAdminRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerAdmin(request));
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Rafraîchir le jeton d'accès", description = "Renouvelle l'Access Token à partir d'un Refresh Token valide")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Profil de l'utilisateur connecté", description = "Retourne les informations du compte actuellement authentifié")
    public ResponseEntity<UserSummaryDto> getCurrentUser(@AuthenticationPrincipal UserPrincipal currentUser) {
        UserSummaryDto userSummary = UserSummaryDto.builder()
                .id(currentUser.getId())
                .email(currentUser.getEmail())
                .firstName(currentUser.getFirstName())
                .lastName(currentUser.getLastName())
                .roles(currentUser.getAuthorities().stream()
                        .map(a -> Role.valueOf(a.getAuthority()))
                        .collect(Collectors.toSet()))
                .status(currentUser.getStatus())
                .build();
        return ResponseEntity.ok(userSummary);
    }
}
