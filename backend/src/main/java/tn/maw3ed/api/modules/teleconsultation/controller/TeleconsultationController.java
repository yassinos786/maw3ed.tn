package tn.maw3ed.api.modules.teleconsultation.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.maw3ed.api.modules.teleconsultation.service.TeleconsultationService;
import tn.maw3ed.api.security.user.UserPrincipal;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/teleconsultation")
@RequiredArgsConstructor
@Tag(name = "Téléconsultation (WebRTC / Jitsi)", description = "Accès sécurisé à la salle virtuelle de consultation vidéo")
public class TeleconsultationController {

    private final TeleconsultationService teleconsultationService;

    @PostMapping("/{appointmentId}/join")
    @Operation(summary = "Rejoindre la salle de téléconsultation vidéo")
    public ResponseEntity<Map<String, Object>> joinTeleconsultation(
            @PathVariable String appointmentId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(teleconsultationService.joinTeleconsultation(appointmentId, currentUser.getId()));
    }
}
