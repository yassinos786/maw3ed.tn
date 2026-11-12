package tn.maw3ed.api.modules.appointment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.maw3ed.api.modules.appointment.model.ConsultationType;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateSlotsRequest {

    @NotNull(message = "La date et l'heure de début sont obligatoires")
    private Instant startDateTime;

    @NotNull(message = "La date et l'heure de fin sont obligatoires")
    private Instant endDateTime;

    @Builder.Default
    private int durationMinutes = 30;

    @Builder.Default
    private ConsultationType consultationType = ConsultationType.BOTH;
}
