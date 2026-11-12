package tn.maw3ed.api.modules.doctor.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tn.maw3ed.api.modules.doctor.model.DoctorProfile;
import tn.maw3ed.api.modules.doctor.service.DoctorProfileService;
import tn.maw3ed.api.security.user.UserPrincipal;

@RestController
@RequestMapping("/api/v1/doctors")
@RequiredArgsConstructor
@Tag(name = "Médecins & Annuaire", description = "Recherche géospatiale de praticiens et gestion des profils professionnels")
public class DoctorController {

    private final DoctorProfileService doctorProfileService;

    @GetMapping("/search")
    @Operation(summary = "Recherche géolocalisée et multicritère de médecins", description = "Recherche les médecins vérifiés par GPS réel ($near), gouvernorat tunisien ou spécialité")
    public ResponseEntity<Page<DoctorProfile>> searchDoctors(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(defaultValue = "25.0") Double radiusKm,
            @RequestParam(required = false) String governorate,
            @RequestParam(required = false) String specialty,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageRequest pageRequest = PageRequest.of(page, size);
        return ResponseEntity.ok(doctorProfileService.searchDoctors(lat, lng, radiusKm, governorate, specialty, pageRequest));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter le profil public d'un médecin")
    public ResponseEntity<DoctorProfile> getDoctorById(@PathVariable String id) {
        return ResponseEntity.ok(doctorProfileService.getProfileById(id));
    }

    @GetMapping("/me/profile")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Consulter son propre profil praticien")
    public ResponseEntity<DoctorProfile> getMyProfile(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(doctorProfileService.getProfileByUserId(currentUser.getId()));
    }

    @PutMapping("/me/profile")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Mettre à jour son profil praticien")
    public ResponseEntity<DoctorProfile> updateMyProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody DoctorProfile updatedData) {
        return ResponseEntity.ok(doctorProfileService.updateProfile(currentUser.getId(), updatedData));
    }
}
