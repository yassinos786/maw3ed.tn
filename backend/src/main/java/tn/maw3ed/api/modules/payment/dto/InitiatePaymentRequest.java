package tn.maw3ed.api.modules.payment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.maw3ed.api.modules.payment.model.PaymentMethod;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InitiatePaymentRequest {

    @NotBlank(message = "L'identifiant du rendez-vous est obligatoire")
    private String appointmentId;

    private PaymentMethod paymentMethod;
}
