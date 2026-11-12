export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  category: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  details: string;
  ipAddress: string;
}

export interface TriageMetricsData {
  health: {
    status: string;
    service?: string;
    version?: string;
    engine?: string;
    timestamp?: string;
    detail?: string;
  };
  liveMetrics: {
    totalRequests: number;
    emergencyCount: number;
    emergencyRatePercent: number;
    averageLatencyMs: number;
    specialtiesDistribution?: Record<string, number>;
    uptimeStartedAt?: string;
  };
  totalTriageLogs: number;
  totalEmergencyAlerts: number;
  modelVersion: string;
  targetSpecialtiesSupported: string[];
  confidenceAverageEstimatePercent: number;
  auditSummary?: {
    totalEvents: number;
    infoCount: number;
    warningCount: number;
    criticalCount: number;
    systemHealth: string;
  };
}

