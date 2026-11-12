package tn.maw3ed.api.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.maw3ed.api.modules.doctor.model.Address;
import tn.maw3ed.api.modules.doctor.model.ConsultationFee;
import tn.maw3ed.api.modules.doctor.model.VerificationStatus;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingDoctorDetailDto {
    private String id;
    private String userId;
    private String doctorName;
    private String email;
    private String phoneNumber;
    private String medicalCouncilId;
    private List<String> specialties;
    private Address address;
    private ConsultationFee consultationFee;
    private VerificationStatus verificationStatus;
    private Instant createdAt;
}
