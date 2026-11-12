package tn.maw3ed.api.modules.doctor.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "doctor_profiles")
@CompoundIndexes({
    @CompoundIndex(name = "status_specialties_idx", def = "{'verificationStatus': 1, 'specialties': 1}")
})
public class DoctorProfile {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    private String fullName;

    @Indexed(unique = true)
    private String medicalCouncilId;

    @TextIndexed(weight = 10)
    @Builder.Default
    private List<String> specialties = new ArrayList<>();

    @TextIndexed(weight = 3)
    private String presentation;

    @Builder.Default
    private List<String> spokenLanguages = new ArrayList<>();

    @Builder.Default
    private ConsultationFee consultationFee = new ConsultationFee();

    private Address address;

    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.SUBMITTED;

    @Builder.Default
    private boolean teleconsultationEnabled = true;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
