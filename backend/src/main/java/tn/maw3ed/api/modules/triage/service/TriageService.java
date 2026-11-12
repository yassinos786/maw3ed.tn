package tn.maw3ed.api.modules.triage.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.maw3ed.api.modules.triage.client.PythonTriageClient;
import tn.maw3ed.api.modules.triage.dto.TriageRequest;
import tn.maw3ed.api.modules.triage.dto.TriageResponse;
import tn.maw3ed.api.modules.triage.model.TriageAction;
import tn.maw3ed.api.modules.triage.model.TriageLog;
import tn.maw3ed.api.modules.triage.model.UrgencyLevel;
import tn.maw3ed.api.modules.triage.repository.TriageLogRepository;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class TriageService {

    private final TriageLogRepository triageLogRepository;
    private final PythonTriageClient pythonTriageClient;

    private static final List<String> CRITICAL_PATTERNS = List.of(
            "douleur thoracique", "bras gauche", "infarctus", "avc", "paralysie",
            "perte de connaissance", "étouffement", "détresse respiratoire", "convulsion",
            "sedri youja3", "wji3a fi 9albi", "chest pain"
    );

    private static final Map<String, List<String>> SPECIALTY_PATTERNS = Map.ofEntries(
            Map.entry("Urologie", List.of("testicule", "testicules", "douleur testiculaire", "bourses", "scrotum", "prostate", "urinaire", "urines", "miction", "brûlure en urinant", "brûlure urinaire", "calcul rénal", "colique néphrétique", "khsayet", "7ar9an fil boula")),
            Map.entry("Pneumologie", List.of("poumon", "poumons", "toux", "toux grasse", "toux sèche", "crachat", "bronchite", "asthme", "sifflement", "essoufflement", "ka77a", "koffa")),
            Map.entry("Psychiatrie", List.of("dépression", "déprime", "tristesse", "anxiété", "angoisse", "panique", "insomnie", "stress", "burnout", "idées noires", "manor9odech")),
            Map.entry("Endocrinologie-Diabétologie", List.of("diabète", "sucre", "glycémie", "soif excessive", "thyroïde", "tsh", "goitre", "sokker", "ghodda")),
            Map.entry("Rhumatologie", List.of("arthrose", "arthrite", "goutte", "acide urique", "rhumatismes", "mal de dos chronique", "mfaçel", "3dhami")),
            Map.entry("Cardiologie", List.of("palpitation", "coeur", "tachycardie", "tension", "hypertension", "arythmie", "dha5t", "9alb", "9albi")),
            Map.entry("Dermatologie", List.of("bouton", "démangeaison", "acné", "rougeur", "peau", "eczéma", "tache", "7ka", "chute de cheveux", "mycose", "hab")),
            Map.entry("Ophtalmologie", List.of("yeux", "vision", "flou", "oeil", "conjonctivite", "3in", "3iniya", "myopie", "sécheresse oculaire")),
            Map.entry("Chirurgie Dentaire", List.of("dent", "dents", "mâchoire", "gencive", "carie", "dharsa", "dharsi", "seni", "abcès dentaire")),
            Map.entry("Oto-Rhino-Laryngologie (ORL)", List.of("gorge", "mal de gorge", "oreille", "sinusite", "acouphène", "otite", "angine", "gorjouma", "wadhni", "khachmi")),
            Map.entry("Gastro-entérologie", List.of("estomac", "ventre", "mal au ventre", "vomissement", "nausée", "diarrhée", "constipation", "reflux", "kerchi", "ma3da")),
            Map.entry("Neurologie", List.of("migraine", "mal de tête", "céphalée", "vertiges", "engourdissement", "fourmillement", "rasi", "sodda3", "dwaykha")),
            Map.entry("Pédiatrie", List.of("nourrisson", "bébé", "enfant", "croissance", "pédiatre", "sghir", "weldi", "benti")),
            Map.entry("Gynécologie-Obstétrique", List.of("grossesse", "enceinte", "retard règles", "cycle", "contraception", "fœtus", "7ebla")),
            Map.entry("Orthopédie & Traumatologie", List.of("fracture", "entorse", "genou", "cheville", "épaule", "articulation", "lombalgie", "rokba", "dharba", "kaser"))
    );

    /**
     * Analyse les symptômes du patient :
     * 1. Tente l'analyse via le microservice Python FastAPI (port 8000)
     * 2. Si le microservice Python est inaccessible, bascule sans interruption sur le fallback local
     * 3. Enregistre la trace complète dans MongoDB triage_logs
     */
    public TriageResponse analyzeSymptoms(TriageRequest request, String patientId, String clientIp) {
        long startTime = System.currentTimeMillis();
        boolean usedFallback = false;

        // 1. Appel du microservice Python FastAPI
        TriageResponse response = pythonTriageClient.analyzeSymptoms(request);

        // 2. Mécanisme de tolérance aux pannes (repli local)
        if (response == null) {
            log.info("Activation du moteur de secours local pour la requête de triage.");
            response = classifySymptomsFallback(request, startTime);
            usedFallback = true;
        }

        // 3. Journalisation médico-légale et analytique dans MongoDB
        saveTriageLog(request, response, patientId, clientIp, usedFallback);

        return response;
    }

    /**
     * Moteur de repli (Fallback) basé sur règles sémantiques si le service Python est indisponible
     */
    private TriageResponse classifySymptomsFallback(TriageRequest request, long startTime) {
        String inputLower = request.getSymptoms().toLowerCase().trim();
        List<String> redFlags = new ArrayList<>();

        for (String pattern : CRITICAL_PATTERNS) {
            if (inputLower.contains(pattern)) {
                redFlags.add(pattern);
            }
        }

        boolean isEmergency = !redFlags.isEmpty();
        double elapsedMs = (double) (System.currentTimeMillis() - startTime);

        if (isEmergency) {
            return TriageResponse.builder()
                    .emergency(true)
                    .urgencyLevel(UrgencyLevel.CRITICAL)
                    .recommendedSpecialty("SAMU / Urgence Médicale")
                    .confidenceScore(0.98)
                    .redFlagsDetected(redFlags)
                    .advice("Alerte vitale : les symptômes décrits évoquent une urgence critique. Veuillez cesser toute activité et composer immédiatement le 198 (SAMU).")
                    .emergencyNumbers(List.of("SAMU : 198", "Protection Civile : 198", "Police Secours : 197"))
                    .modelVersion("fallback-rule-engine-v1")
                    .processingTimeMs(elapsedMs)
                    .engine("Moteur de règles clinique local (Haute Disponibilité)")
                    .build();
        }

        String bestSpecialty = "Médecine Générale";
        double confidence = 0.70;

        for (Map.Entry<String, List<String>> entry : SPECIALTY_PATTERNS.entrySet()) {
            for (String keyword : entry.getValue()) {
                if (inputLower.contains(keyword)) {
                    bestSpecialty = entry.getKey();
                    confidence = 0.88;
                    break;
                }
            }
        }

        return TriageResponse.builder()
                .emergency(false)
                .urgencyLevel(UrgencyLevel.MODERATE)
                .recommendedSpecialty(bestSpecialty)
                .confidenceScore(confidence)
                .redFlagsDetected(List.of())
                .advice("D'après vos symptômes, une consultation avec un praticien spécialisé en " + bestSpecialty + " est recommandée.")
                .emergencyNumbers(List.of())
                .modelVersion("fallback-rule-engine-v1")
                .processingTimeMs(elapsedMs)
                .engine("Moteur de règles clinique local (Haute Disponibilité)")
                .build();
    }

    /**
     * Vérification de l'état de santé du service de triage (consommé par le frontend et l'admin)
     */
    public Map<String, Object> checkHealth() {
        Map<String, Object> pythonHealth = pythonTriageClient.checkHealth();
        Map<String, Object> combined = new HashMap<>(pythonHealth);
        combined.put("fallbackEngineReady", true);
        combined.put("persistenceStore", "MongoDB (triage_logs)");
        return combined;
    }

    /**
     * Métriques consolidées du module de triage
     */
    public Map<String, Object> getMetrics() {
        Map<String, Object> result = new HashMap<>();
        long totalLogs = triageLogRepository.count();
        result.put("totalTriageRequests", totalLogs);
        
        Map<String, Object> pythonMetrics = pythonTriageClient.getMetrics();
        result.put("pythonTriageMicroserviceMetrics", pythonMetrics);
        return result;
    }

    private void saveTriageLog(TriageRequest request, TriageResponse response, String patientId, String clientIp, boolean usedFallback) {
        try {
            TriageLog.ClinicalAnalysis analysis = TriageLog.ClinicalAnalysis.builder()
                    .modelVersion(response.getModelVersion())
                    .isEmergency(response.isEmergency())
                    .urgencyLevel(response.getUrgencyLevel())
                    .recommendedSpecialty(response.getRecommendedSpecialty())
                    .confidenceScore(response.getConfidenceScore())
                    .redFlagsDetected(response.getRedFlagsDetected())
                    .latencyMs(response.getProcessingTimeMs())
                    .usedFallback(usedFallback)
                    .build();

            TriageLog logEntry = TriageLog.builder()
                    .patientId(patientId)
                    .rawInputSymptoms(request.getSymptoms())
                    .detectedLanguage(request.getLanguage())
                    .analysis(analysis)
                    .actionTaken(response.isEmergency() ? TriageAction.EMERGENCY_ALERT_SHOWN : TriageAction.SPECIALTY_SEARCHED)
                    .ipAddressHash(hashIp(clientIp))
                    .build();

            triageLogRepository.save(logEntry);
        } catch (Exception e) {
            log.error("Erreur lors de la journalisation du triage : {}", e.getMessage());
        }
    }

    private String hashIp(String ip) {
        if (ip == null) return "unknown";
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(ip.getBytes());
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            return "hash_error";
        }
    }
}
