package tn.maw3ed.api.modules.payment.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "payments")
@CompoundIndexes({
    @CompoundIndex(name = "doctor_payment_idx", def = "{'doctorId': 1, 'status': 1, 'paidAt': -1}"),
    @CompoundIndex(name = "patient_payment_idx", def = "{'patientId': 1, 'status': 1, 'paidAt': -1}")
})
public class PaymentTransaction {

    @Id
    private String id;

    @Indexed(unique = true)
    private String appointmentId;

    @Indexed
    private String patientId;

    @Indexed
    private String doctorId;

    private Double amount;

    @Builder.Default
    private String currency = "TND";

    private Double platformCommission; // Ex: 10%

    private Double doctorNetRevenue;   // Ex: 90%

    private PaymentMethod paymentMethod;

    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    private String transactionReference;

    private String cardLast4;

    private Instant paidAt;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @Version
    private Long version;
}
