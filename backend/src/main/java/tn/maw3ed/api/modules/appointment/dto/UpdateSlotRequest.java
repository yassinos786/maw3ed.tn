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
public class UpdateSlotRequest {

    @NotNull(message = "L'heure de début est obligatoire")
    private Instant startTime;

    @NotNull(message = "L'heure de fin est obligatoire")
    private Instant endTime;

    @NotNull(message = "Le type de consultation est obligatoire")
    private ConsultationType consultationType;
}
