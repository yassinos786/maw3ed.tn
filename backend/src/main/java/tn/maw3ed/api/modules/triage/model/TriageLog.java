package tn.maw3ed.api.modules.triage.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "triage_logs")
@CompoundIndexes({
    @CompoundIndex(name = "emergency_time_idx_v2", def = "{'analysis.isEmergency': 1, 'timestamp': -1}")
})
public class TriageLog {

    @Id
    private String id;

    @Indexed
    private String patientId; // Nullable pour les consultations anonymes

    private String rawInputSymptoms;

    private String detectedLanguage;

    private ClinicalAnalysis analysis;

    @Builder.Default
    private TriageAction actionTaken = TriageAction.SPECIALTY_SEARCHED;

    private String ipAddressHash;

    @CreatedDate
    private Instant timestamp;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClinicalAnalysis {
        private String modelVersion;
        private boolean isEmergency;
        private UrgencyLevel urgencyLevel;
        private String recommendedSpecialty;
        private Double confidenceScore;
        private List<String> redFlagsDetected;
        private Double latencyMs;
        private boolean usedFallback;
    }
}
