package tn.maw3ed.api.modules.appointment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.maw3ed.api.modules.appointment.model.ConsultationType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookAppointmentRequest {

    @NotBlank(message = "L'identifiant du créneau est obligatoire")
    private String slotId;

    @NotNull(message = "Le type de consultation (présentiel ou téléconsultation) est obligatoire")
    private ConsultationType type;
}
