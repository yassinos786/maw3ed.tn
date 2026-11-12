package tn.maw3ed.api.modules.audit.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "audit_logs")
public class AuditLog {

    @Id
    private String id;

    @Indexed
    @CreatedDate
    @Builder.Default
    private Instant timestamp = Instant.now();

    @Indexed
    private String userId;

    private String userEmail;

    private String userName;

    @Indexed
    private String action; // E.g., AUTH_LOGIN, USER_CREATE, DOCTOR_VERIFIED, SLOT_GENERATE, CLINICAL_TRIAGE

    @Indexed
    private String category; // AUTHENTICATION, USER_MANAGEMENT, DOCTOR_VERIFICATION, SCHEDULE, TRIAGE, SECURITY

    @Indexed
    @Builder.Default
    private String severity = "INFO"; // INFO, WARNING, CRITICAL

    private String details;

    private String ipAddress;
}
