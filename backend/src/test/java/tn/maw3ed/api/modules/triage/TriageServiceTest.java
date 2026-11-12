package tn.maw3ed.api.modules.triage;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.maw3ed.api.modules.triage.client.PythonTriageClient;
import tn.maw3ed.api.modules.triage.dto.TriageRequest;
import tn.maw3ed.api.modules.triage.dto.TriageResponse;
import tn.maw3ed.api.modules.triage.model.UrgencyLevel;
import tn.maw3ed.api.modules.triage.repository.TriageLogRepository;
import tn.maw3ed.api.modules.triage.service.TriageService;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TriageServiceTest {

    @Mock
    private TriageLogRepository triageLogRepository;

    @Mock
    private PythonTriageClient pythonTriageClient;

    private TriageService triageService;

    @BeforeEach
    void setUp() {
        triageService = new TriageService(triageLogRepository, pythonTriageClient);
    }

    @Test
    @DisplayName("Doit déléguer avec succès au microservice Python FastAPI lorsqu'il est disponible")
    void shouldDelegateToPythonWhenAvailable() {
        TriageRequest request = TriageRequest.builder()
                .symptoms("J'ai une forte douleur thoracique irradiant dans le bras gauche")
                .language("fr")
                .build();

        TriageResponse mockPythonResponse = TriageResponse.builder()
                .emergency(true)
                .urgencyLevel(UrgencyLevel.CRITICAL)
                .recommendedSpecialty("SAMU / Urgence Médicale")
                .confidenceScore(0.99)
                .redFlagsDetected(List.of("douleur thoracique"))
                .emergencyNumbers(List.of("SAMU : 198"))
                .modelVersion("fastapi-medical-rules-v2")
                .engine("FastAPI Python Microservice (Port 8000)")
                .build();

        when(pythonTriageClient.analyzeSymptoms(any())).thenReturn(mockPythonResponse);

        TriageResponse response = triageService.analyzeSymptoms(request, "pat-123", "127.0.0.1");

        assertNotNull(response);
        assertTrue(response.isEmergency());
        assertEquals("fastapi-medical-rules-v2", response.getModelVersion());
        assertEquals(UrgencyLevel.CRITICAL, response.getUrgencyLevel());
        assertEquals("SAMU / Urgence Médicale", response.getRecommendedSpecialty());
    }

    @Test
    @DisplayName("Doit basculer automatiquement sur le moteur de repli local si le service Python est indisponible")
    void shouldTriggerFallbackWhenPythonServiceFails() {
        TriageRequest request = TriageRequest.builder()
                .symptoms("J'ai des rougeurs et des démangeaisons avec de l'eczéma sur les mains")
                .language("fr")
                .build();

        // Cas où le service Python est indisponible ou en timeout
        when(pythonTriageClient.analyzeSymptoms(any())).thenReturn(null);

        TriageResponse response = triageService.analyzeSymptoms(request, "pat-123", "127.0.0.1");

        assertNotNull(response);
        assertFalse(response.isEmergency());
        assertEquals("fallback-rule-engine-v1", response.getModelVersion());
        assertEquals("Dermatologie", response.getRecommendedSpecialty());
        assertEquals(UrgencyLevel.MODERATE, response.getUrgencyLevel());
    }
}
