package tn.maw3ed.api.modules.triage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.maw3ed.api.modules.triage.model.UrgencyLevel;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TriageResponse {

    private boolean emergency;
    private UrgencyLevel urgencyLevel;
    private String recommendedSpecialty;
    private Double confidenceScore;
    private List<String> redFlagsDetected;
    private String advice;
    private List<String> emergencyNumbers;
    private String modelVersion;
    private Double processingTimeMs;
    private String engine;
}
