export type UrgencyLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface TriageRequestPayload {
  symptoms: string;
  language?: string;
}

export interface TriageResponse {
  emergency: boolean;
  urgencyLevel: UrgencyLevel;
  recommendedSpecialty: string;
  confidenceScore: number;
  redFlagsDetected: string[];
  advice: string;
  emergencyNumbers: string[];
  modelVersion?: string;
  processingTimeMs?: number;
  engine?: string;
}

export interface TriageHealthStatus {
  status: string;
  service?: string;
  version?: string;
  engine?: string;
  fallbackEngineReady?: boolean;
  persistenceStore?: string;
  timestamp?: string;
  serviceUrl?: string;
}

