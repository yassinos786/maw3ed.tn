package tn.maw3ed.api.modules.triage.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.maw3ed.api.modules.triage.model.TriageLog;

import java.time.Instant;
import java.util.List;

@Repository
public interface TriageLogRepository extends MongoRepository<TriageLog, String> {
    List<TriageLog> findByTimestampBetweenOrderByTimestampDesc(Instant start, Instant end);
    long countByAnalysisIsEmergencyTrue();
}
