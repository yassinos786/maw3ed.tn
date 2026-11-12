package tn.maw3ed.api.modules.doctor.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationFee {
    @Builder.Default
    private Double inPerson = 60.0;
    @Builder.Default
    private Double teleconsultation = 50.0;
    @Builder.Default
    private String currency = "TND";
}
