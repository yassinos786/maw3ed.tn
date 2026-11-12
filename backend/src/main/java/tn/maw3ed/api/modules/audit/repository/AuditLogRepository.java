package tn.maw3ed.api.modules.audit.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.maw3ed.api.modules.audit.model.AuditLog;

import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    List<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);
    List<AuditLog> findByCategoryOrderByTimestampDesc(String category, Pageable pageable);
    List<AuditLog> findBySeverityOrderByTimestampDesc(String severity, Pageable pageable);
    long countBySeverity(String severity);
}
