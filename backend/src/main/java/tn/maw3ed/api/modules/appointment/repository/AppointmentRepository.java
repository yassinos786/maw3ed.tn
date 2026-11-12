package tn.maw3ed.api.modules.appointment.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.maw3ed.api.modules.appointment.model.Appointment;
import tn.maw3ed.api.modules.appointment.model.AppointmentStatus;

import java.time.Instant;
import java.util.List;

@Repository
public interface AppointmentRepository extends MongoRepository<Appointment, String> {
    Page<Appointment> findByPatientIdOrderByScheduledStartTimeDesc(String patientId, Pageable pageable);
    Page<Appointment> findByDoctorIdOrderByScheduledStartTimeDesc(String doctorId, Pageable pageable);
    List<Appointment> findByDoctorIdAndScheduledStartTimeBetween(String doctorId, Instant start, Instant end);
    long countByStatus(AppointmentStatus status);
}
