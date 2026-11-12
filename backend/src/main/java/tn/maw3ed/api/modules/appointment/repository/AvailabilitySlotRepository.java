package tn.maw3ed.api.modules.appointment.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.maw3ed.api.modules.appointment.model.AvailabilitySlot;
import tn.maw3ed.api.modules.appointment.model.SlotStatus;

import java.time.Instant;
import java.util.List;

@Repository
public interface AvailabilitySlotRepository extends MongoRepository<AvailabilitySlot, String> {
    List<AvailabilitySlot> findByDoctorIdAndStartTimeBetweenAndStatusOrderByStartTimeAsc(
            String doctorId, Instant start, Instant end, SlotStatus status);

    List<AvailabilitySlot> findByDoctorIdAndStartTimeBetweenOrderByStartTimeAsc(
            String doctorId, Instant start, Instant end);
}
