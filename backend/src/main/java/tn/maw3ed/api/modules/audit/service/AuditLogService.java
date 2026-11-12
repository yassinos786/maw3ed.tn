package tn.maw3ed.api.modules.audit.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import tn.maw3ed.api.modules.audit.model.AuditLog;
import tn.maw3ed.api.modules.audit.repository.AuditLogRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLog logEvent(
            String userId,
            String userEmail,
            String userName,
            String action,
            String category,
            String severity,
            String details,
            String ipAddress
    ) {
        AuditLog auditLog = AuditLog.builder()
                .timestamp(Instant.now())
                .userId(userId)
                .userEmail(userEmail)
                .userName(userName)
                .action(action)
                .category(category)
                .severity(severity != null ? severity : "INFO")
                .details(details)
                .ipAddress(ipAddress != null ? ipAddress : "127.0.0.1")
                .build();

        AuditLog saved = auditLogRepository.save(auditLog);
        log.info("[AUDIT] {} - {} by {}: {}", category, action, userEmail != null ? userEmail : "SYSTEM", details);
        return saved;
    }

    public List<AuditLog> getRecentLogs(int limit) {
        int safeLimit = Math.min(Math.max(limit, 10), 200);
        return auditLogRepository.findAllByOrderByTimestampDesc(PageRequest.of(0, safeLimit));
    }

    public Map<String, Object> getAuditStats() {
        Map<String, Object> stats = new HashMap<>();
        long totalEvents = auditLogRepository.count();
        long warningCount = auditLogRepository.countBySeverity("WARNING");
        long criticalCount = auditLogRepository.countBySeverity("CRITICAL");
        long infoCount = auditLogRepository.countBySeverity("INFO");

        stats.put("totalEvents", totalEvents);
        stats.put("infoCount", infoCount);
        stats.put("warningCount", warningCount);
        stats.put("criticalCount", criticalCount);
        stats.put("systemHealth", "OPTIMAL");
        return stats;
    }
}
