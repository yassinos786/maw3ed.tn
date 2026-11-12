package tn.maw3ed.api.modules.doctor.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Point;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.maw3ed.api.modules.doctor.model.DoctorProfile;
import tn.maw3ed.api.modules.doctor.model.VerificationStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorProfileRepository extends MongoRepository<DoctorProfile, String> {
    Optional<DoctorProfile> findByUserId(String userId);
    Optional<DoctorProfile> findByMedicalCouncilId(String medicalCouncilId);
    boolean existsByMedicalCouncilId(String medicalCouncilId);
    List<DoctorProfile> findByVerificationStatus(VerificationStatus status);
    long countByVerificationStatus(VerificationStatus status);
    Page<DoctorProfile> findByVerificationStatus(VerificationStatus status, Pageable pageable);
    Page<DoctorProfile> findByVerificationStatusAndAddressLocationNear(
            VerificationStatus status, Point point, Distance maxDistance, Pageable pageable);
    Page<DoctorProfile> findByVerificationStatusAndAddressGovernorateIgnoreCase(
            VerificationStatus status, String governorate, Pageable pageable);
    Page<DoctorProfile> findByVerificationStatusAndSpecialtiesContainingIgnoreCase(
            VerificationStatus status, String specialty, Pageable pageable);
    Page<DoctorProfile> findByVerificationStatusAndAddressGovernorateIgnoreCaseAndSpecialtiesContainingIgnoreCase(
            VerificationStatus status, String governorate, String specialty, Pageable pageable);
    void deleteByUserId(String userId);
}
