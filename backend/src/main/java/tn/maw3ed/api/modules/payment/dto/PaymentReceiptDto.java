package tn.maw3ed.api.modules.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.maw3ed.api.modules.appointment.model.ConsultationType;
import tn.maw3ed.api.modules.payment.model.PaymentMethod;
import tn.maw3ed.api.modules.payment.model.PaymentStatus;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentReceiptDto {
    private String paymentId;
    private String transactionReference;
    private String appointmentId;
    private String patientName;
    private String patientEmail;
    private String doctorName;
    private String doctorSpecialty;
    private String cabinetAddress;
    private ConsultationType consultationType;
    private Instant scheduledStartTime;
    private Double amount;
    private String currency;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private Instant paidAt;
    private String issuedBy;
}
