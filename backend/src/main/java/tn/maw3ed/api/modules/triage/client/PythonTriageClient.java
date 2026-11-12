package tn.maw3ed.api.modules.triage.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import tn.maw3ed.api.modules.triage.dto.TriageRequest;
import tn.maw3ed.api.modules.triage.dto.TriageResponse;
import tn.maw3ed.api.modules.triage.model.UrgencyLevel;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Client REST communicant avec le microservice Python FastAPI de triage médical.
 * Intègre une gestion de timeout stricte et une tolérance aux pannes (résilience).
 */
@Slf4j
@Component
public class PythonTriageClient {

    private final boolean enabled;
    private final String triageServiceUrl;
    private final RestTemplate restTemplate;

    public PythonTriageClient(
            @Value("${application.triage-service.enabled:true}") boolean enabled,
            @Value("${application.triage-service.url:http://localhost:8000}") String triageServiceUrl,
            @Value("${application.triage-service.connect-timeout-ms:3000}") int connectTimeout,
            @Value("${application.triage-service.read-timeout-ms:5000}") int readTimeout) {

        this.enabled = enabled;
        this.triageServiceUrl = triageServiceUrl.replaceAll("/+$", ""); // supprimer slash final éventuel

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeout);
        factory.setReadTimeout(readTimeout);
        this.restTemplate = new RestTemplate(factory);

        log.info("PythonTriageClient initialisé -> URL: {}, Activé: {}, Timeout: {}ms",
                this.triageServiceUrl, this.enabled, readTimeout);
    }

    /**
     * DTO interne pour désérialiser la réponse FastAPI
     */
    public record FastApiTriageResponse(
            boolean emergency,
            String urgencyLevel,
            String recommendedSpecialty,
            Double confidenceScore,
            List<String> redFlagsDetected,
            String advice,
            List<String> emergencyNumbers,
            Double processingTimeMs,
            String modelVersion,
            String analyzedAt
    ) {}

    /**
     * Envoie la description des symptômes au microservice Python FastAPI.
     * En cas d'indisponibilité ou d'erreur réseau, renvoie null pour déclencher
     * automatiquement le mode de repli local.
     */
    public TriageResponse analyzeSymptoms(TriageRequest request) {
        if (!enabled) {
            log.debug("Microservice Python de triage désactivé par configuration, utilisation directe du fallback.");
            return null;
        }

        String targetUrl = triageServiceUrl + "/api/v1/triage/analyze";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

            HttpEntity<TriageRequest> httpEntity = new HttpEntity<>(request, headers);

            long startTime = System.currentTimeMillis();
            ResponseEntity<FastApiTriageResponse> response = restTemplate.exchange(
                    targetUrl,
                    HttpMethod.POST,
                    httpEntity,
                    FastApiTriageResponse.class
            );
            long roundTripMs = System.currentTimeMillis() - startTime;

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                FastApiTriageResponse body = response.getBody();
                UrgencyLevel level = mapUrgencyLevel(body.urgencyLevel());

                log.info("Appel du microservice Python réussi en {}ms (Durée: {}ms, Règle: {}) -> Urgence: {}, Spécialité: {}",
                        roundTripMs, body.processingTimeMs(), body.modelVersion(), body.emergency(), body.recommendedSpecialty());

                return TriageResponse.builder()
                        .emergency(body.emergency())
                        .urgencyLevel(level)
                        .recommendedSpecialty(body.recommendedSpecialty())
                        .confidenceScore(body.confidenceScore())
                        .redFlagsDetected(body.redFlagsDetected() != null ? body.redFlagsDetected() : List.of())
                        .advice(body.advice())
                        .emergencyNumbers(body.emergencyNumbers() != null ? body.emergencyNumbers() : List.of())
                        .modelVersion(body.modelVersion())
                        .processingTimeMs(body.processingTimeMs() != null ? body.processingTimeMs() : (double) roundTripMs)
                        .engine("FastAPI Python Microservice (Port 8000)")
                        .build();
            }
        } catch (RestClientException ex) {
            log.warn("Microservice Python de triage inaccessible ou en timeout sur {} : {}. Bascule automatique sur le moteur de règles local.",
                    targetUrl, ex.getMessage());
        } catch (Exception ex) {
            log.error("Erreur inattendue lors de la communication avec le microservice de triage : {}", ex.getMessage());
        }

        return null;
    }

    /**
     * Vérifie la disponibilité du microservice Python FastAPI (Health Check).
     */
    public Map<String, Object> checkHealth() {
        if (!enabled) {
            return Map.of(
                    "status", "DISABLED",
                    "engine", "Moteur local uniquement",
                    "serviceUrl", triageServiceUrl
            );
        }

        String healthUrl = triageServiceUrl + "/health";
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    healthUrl,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception ex) {
            log.debug("Health check microservice Python échoué sur {} : {}", healthUrl, ex.getMessage());
        }

        return Map.of(
                "status", "DOWN",
                "engine", "Moteur de règles local actif",
                "serviceUrl", triageServiceUrl,
                "detail", "Microservice Python hors-ligne ou inaccessible"
        );
    }

    /**
     * Récupère les métriques de performance du microservice Python FastAPI.
     */
    public Map<String, Object> getMetrics() {
        if (!enabled) {
            return Map.of("status", "DISABLED");
        }

        String metricsUrl = triageServiceUrl + "/metrics";
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    metricsUrl,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception ex) {
            log.debug("Récupération métriques de triage Python échouée sur {} : {}", metricsUrl, ex.getMessage());
        }

        return Map.of("status", "UNAVAILABLE");
    }

    private UrgencyLevel mapUrgencyLevel(String levelStr) {
        if (levelStr == null) return UrgencyLevel.MODERATE;
        try {
            return UrgencyLevel.valueOf(levelStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return UrgencyLevel.MODERATE;
        }
    }
}
