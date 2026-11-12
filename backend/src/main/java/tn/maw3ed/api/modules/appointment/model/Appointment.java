package tn.maw3ed.api.modules.appointment.model;

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
import tn.maw3ed.api.modules.payment.model.PaymentMethod;
import tn.maw3ed.api.modules.payment.model.PaymentStatus;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "appointments")
@CompoundIndexes({
    @CompoundIndex(name = "patient_start_idx", def = "{'patientId': 1, 'scheduledStartTime': -1}"),
    @CompoundIndex(name = "doctor_start_idx", def = "{'doctorId': 1, 'scheduledStartTime': -1}")
})
public class Appointment {

    @Id
    private String id;

    @Indexed
    private String slotId;

    @Indexed
    private String doctorId;

    @Indexed
    private String patientId;

    @Builder.Default
    private ConsultationType type = ConsultationType.IN_PERSON;

    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.CONFIRMED;

    private String cancellationReason;

    private String cancelledBy; // PATIENT, DOCTOR, SYSTEM

    private Instant scheduledStartTime;

    private Instant scheduledEndTime;

    private DoctorSnapshot doctorSnapshot;

    private PatientSnapshot patientSnapshot;

    private TeleconsultationSession teleconsultationSession;

    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    private String paymentId;

    private Double amountPaid;

    private PaymentMethod paymentMethod;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @Version
    private Long version;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DoctorSnapshot {
        private String fullName;
        private String specialty;
        private String cabinetAddress;
        private Double fee;
        private Double latitude;
        private Double longitude;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PatientSnapshot {
        private String fullName;
        private String phoneNumber;
        private String email;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeleconsultationSession {
        private String roomName;
        private Instant doctorJoinedAt;
        private Instant patientJoinedAt;
        private Instant endedAt;
    }
}
