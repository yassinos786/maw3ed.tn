package tn.maw3ed.api.modules.triage.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tn.maw3ed.api.modules.triage.dto.TriageRequest;
import tn.maw3ed.api.modules.triage.dto.TriageResponse;
import tn.maw3ed.api.modules.triage.service.TriageService;
import tn.maw3ed.api.security.user.UserPrincipal;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/triage")
@RequiredArgsConstructor
@Tag(name = "Triage Médical", description = "Analyse clinique des symptômes via microservice Python FastAPI et détection d'urgence vitale")
public class TriageController {

    private final TriageService triageService;

    @PostMapping("/analyze")
    @Operation(summary = "Analyser les symptômes d'un patient", description = "Délègue l'analyse au microservice Python FastAPI (ou fallback local) et retourne la recommandation médicale ou alerte SAMU 198")
    public ResponseEntity<TriageResponse> analyzeSymptoms(
            @Valid @RequestBody TriageRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest servletRequest) {

        String patientId = currentUser != null ? currentUser.getId() : null;
        String clientIp = servletRequest.getRemoteAddr();

        return ResponseEntity.ok(triageService.analyzeSymptoms(request, patientId, clientIp));
    }

    @GetMapping("/health")
    @Operation(summary = "État de santé du service de triage", description = "Vérifie la disponibilité du microservice Python FastAPI (port 8000) et du fallback local")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        return ResponseEntity.ok(triageService.checkHealth());
    }

    @GetMapping("/metrics")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Métriques du service de triage", description = "Statistiques de performance du microservice de triage et de la persistance MongoDB (Admin uniquement)")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        return ResponseEntity.ok(triageService.getMetrics());
    }
}
