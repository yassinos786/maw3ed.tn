package tn.maw3ed.api.modules.appointment.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
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
@Document(collection = "availability_slots")
@CompoundIndexes({
    @CompoundIndex(name = "doctor_slot_time_idx", def = "{'doctorId': 1, 'startTime': 1, 'status': 1}")
})
public class AvailabilitySlot {

    @Id
    private String id;

    @Indexed
    private String doctorId;

    private Instant startTime;

    private Instant endTime;

    @Builder.Default
    private SlotStatus status = SlotStatus.AVAILABLE;

    @Builder.Default
    private ConsultationType consultationType = ConsultationType.BOTH;

    private String bookedByPatientId;

    @Indexed(expireAfter = "0s")
    private Instant reservedUntil;

    @Version
    private Long version;
}
