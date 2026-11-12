package tn.maw3ed.api.modules.teleconsultation.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.maw3ed.api.core.exception.BusinessException;
import tn.maw3ed.api.core.exception.ResourceNotFoundException;
import tn.maw3ed.api.modules.appointment.model.Appointment;
import tn.maw3ed.api.modules.appointment.model.AppointmentStatus;
import tn.maw3ed.api.modules.appointment.model.ConsultationType;
import tn.maw3ed.api.modules.appointment.repository.AppointmentRepository;
import tn.maw3ed.api.modules.doctor.model.DoctorProfile;
import tn.maw3ed.api.modules.doctor.repository.DoctorProfileRepository;
import tn.maw3ed.api.modules.payment.model.PaymentStatus;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TeleconsultationService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorProfileRepository doctorProfileRepository;

    public Map<String, Object> joinTeleconsultation(String appointmentId, String userId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Rendez-vous introuvable"));

        if (appointment.getType() != ConsultationType.TELECONSULTATION) {
            throw new BusinessException("Ce rendez-vous n'est pas programmé en téléconsultation.");
        }

        if (appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new BusinessException("La téléconsultation ne peut démarrer que pour un rendez-vous confirmé.");
        }

        boolean isPatient = appointment.getPatientId().equals(userId);
        DoctorProfile doctorProfile = doctorProfileRepository.findByUserId(userId).orElse(null);
        boolean isDoctor = doctorProfile != null && doctorProfile.getId().equals(appointment.getDoctorId());

        if (!isPatient && !isDoctor) {
            throw new BusinessException("Accès non autorisé à cette salle de téléconsultation.");
        }

        if (isPatient && appointment.getPaymentStatus() != PaymentStatus.PAID) {
            throw new BusinessException("L'accès à la téléconsultation est bloqué tant que le paiement de la séance n'est pas validé.");
        }

        // Mise à jour de la présence dans la session
        Appointment.TeleconsultationSession session = appointment.getTeleconsultationSession();
        if (session == null) {
            session = Appointment.TeleconsultationSession.builder()
                    .roomName("maw3ed-" + appointment.getId())
                    .build();
        }

        if (isDoctor && session.getDoctorJoinedAt() == null) {
            session.setDoctorJoinedAt(Instant.now());
        } else if (isPatient && session.getPatientJoinedAt() == null) {
            session.setPatientJoinedAt(Instant.now());
        }
        appointment.setTeleconsultationSession(session);
        appointmentRepository.save(appointment);

        Map<String, Object> roomConfig = new HashMap<>();
        roomConfig.put("roomName", session.getRoomName());
        roomConfig.put("domain", "meet.jit.si");
        roomConfig.put("isDoctor", isDoctor);
        roomConfig.put("patientName", appointment.getPatientSnapshot().getFullName());
        roomConfig.put("doctorName", appointment.getDoctorSnapshot().getFullName());

        return roomConfig;
    }
}
