package tn.maw3ed.api.modules.doctor.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Metrics;
import org.springframework.data.geo.Point;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.stereotype.Service;
import tn.maw3ed.api.core.exception.ResourceNotFoundException;
import tn.maw3ed.api.modules.doctor.model.Address;
import tn.maw3ed.api.modules.doctor.model.DoctorProfile;
import tn.maw3ed.api.modules.doctor.model.VerificationStatus;
import tn.maw3ed.api.modules.doctor.repository.DoctorProfileRepository;
import tn.maw3ed.api.modules.doctor.util.TunisiaGeoUtils;

@Service
@RequiredArgsConstructor
public class DoctorProfileService {

    private final DoctorProfileRepository doctorProfileRepository;
    private final tn.maw3ed.api.modules.iam.repository.UserRepository userRepository;

    private DoctorProfile enrichWithFullName(DoctorProfile profile) {
        if (profile == null) return null;
        if (profile.getFullName() == null || profile.getFullName().isBlank()) {
            userRepository.findById(profile.getUserId()).ifPresent(u -> {
                profile.setFullName("Dr. " + u.getFirstName() + " " + u.getLastName());
            });
        }
        return profile;
    }

    public DoctorProfile getProfileById(String id) {
        return enrichWithFullName(doctorProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profil médecin non trouvé avec l'identifiant : " + id)));
    }

    public DoctorProfile getProfileByUserId(String userId) {
        return enrichWithFullName(doctorProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Aucun profil praticien associé à l'utilisateur : " + userId)));
    }

    public Page<DoctorProfile> searchNear(double latitude, double longitude, double radiusKm, Pageable pageable) {
        Point location = new Point(longitude, latitude);
        Distance maxDistance = new Distance(radiusKm, Metrics.KILOMETERS);
        return doctorProfileRepository.findByVerificationStatusAndAddressLocationNear(
                VerificationStatus.VERIFIED, location, maxDistance, pageable);
    }

    public Page<DoctorProfile> searchDoctors(
            Double latitude, Double longitude, Double radiusKm,
            String governorate, String specialty, Pageable pageable) {

        if (latitude != null && longitude != null) {
            Point location = new Point(longitude, latitude);
            Distance maxDistance = new Distance(radiusKm != null ? radiusKm : 25.0, Metrics.KILOMETERS);
            return doctorProfileRepository.findByVerificationStatusAndAddressLocationNear(
                    VerificationStatus.VERIFIED, location, maxDistance, pageable).map(this::enrichWithFullName);
        }

        boolean hasGov = governorate != null && !governorate.isBlank() && !governorate.equalsIgnoreCase("TOUS");
        boolean hasSpec = specialty != null && !specialty.isBlank() && !specialty.equalsIgnoreCase("TOUTES");

        if (hasGov && hasSpec) {
            return doctorProfileRepository.findByVerificationStatusAndAddressGovernorateIgnoreCaseAndSpecialtiesContainingIgnoreCase(
                    VerificationStatus.VERIFIED, governorate.trim(), specialty.trim(), pageable).map(this::enrichWithFullName);
        } else if (hasGov) {
            return doctorProfileRepository.findByVerificationStatusAndAddressGovernorateIgnoreCase(
                    VerificationStatus.VERIFIED, governorate.trim(), pageable).map(this::enrichWithFullName);
        } else if (hasSpec) {
            return doctorProfileRepository.findByVerificationStatusAndSpecialtiesContainingIgnoreCase(
                    VerificationStatus.VERIFIED, specialty.trim(), pageable).map(this::enrichWithFullName);
        }

        return doctorProfileRepository.findByVerificationStatus(VerificationStatus.VERIFIED, pageable).map(this::enrichWithFullName);
    }

    public Page<DoctorProfile> getVerifiedDoctors(Pageable pageable) {
        return doctorProfileRepository.findByVerificationStatus(VerificationStatus.VERIFIED, pageable).map(this::enrichWithFullName);
    }

    public DoctorProfile updateProfile(String userId, DoctorProfile updatedData) {
        DoctorProfile profile = getProfileByUserId(userId);
        
        if (updatedData.getSpecialties() != null) {
            profile.setSpecialties(updatedData.getSpecialties());
        }
        if (updatedData.getPresentation() != null) {
            profile.setPresentation(updatedData.getPresentation());
        }
        if (updatedData.getSpokenLanguages() != null) {
            profile.setSpokenLanguages(updatedData.getSpokenLanguages());
        }
        if (updatedData.getConsultationFee() != null) {
            profile.setConsultationFee(updatedData.getConsultationFee());
        }
        if (updatedData.getAddress() != null) {
            Address newAddr = updatedData.getAddress();
            String gov = newAddr.getGovernorate() != null && !newAddr.getGovernorate().isBlank()
                    ? newAddr.getGovernorate().trim()
                    : (profile.getAddress() != null ? profile.getAddress().getGovernorate() : "Tunis");
            String city = newAddr.getCity() != null && !newAddr.getCity().isBlank()
                    ? newAddr.getCity().trim()
                    : (profile.getAddress() != null && profile.getAddress().getCity() != null ? profile.getAddress().getCity() : gov);
            String street = newAddr.getStreet() != null && !newAddr.getStreet().isBlank()
                    ? newAddr.getStreet().trim()
                    : (profile.getAddress() != null ? profile.getAddress().getStreet() : null);

            double[] coords = TunisiaGeoUtils.getCoordinates(gov, city, street);
            newAddr.setGovernorate(gov);
            newAddr.setCity(city);
            newAddr.setStreet(street);
            newAddr.setLocation(new GeoJsonPoint(coords[0], coords[1]));
            profile.setAddress(newAddr);
        }
        profile.setTeleconsultationEnabled(updatedData.isTeleconsultationEnabled());

        enrichWithFullName(profile);
        return doctorProfileRepository.save(profile);
    }
}
