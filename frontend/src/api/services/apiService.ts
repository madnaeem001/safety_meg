// API Service Layer for EHS Platform
// Phase 1 integration foundation aligned to the current backend contract.

// ============================================
// API Configuration
// ============================================

export interface APIConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

const defaultConfig: APIConfig = {
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
};

// Environment-based configuration
export const getAPIConfig = (): APIConfig => {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  return {
    ...defaultConfig,
    baseURL: configuredBaseUrl && configuredBaseUrl.length > 0 ? configuredBaseUrl : '/api',
  };
};

// ============================================
// Types for API Responses
// ============================================

export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: PaginationInfo;
  timestamp: string;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================
// Entity Types (Ready for API Integration)
// ============================================

// Incident Entity
export interface Incident {
  id: string;
  type: 'incident' | 'near-miss' | 'injury' | 'property' | 'vehicle' | 'environmental';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  reportedBy: string;
  reportedAt: string;
  location: string;
  department: string;
  assignedTo?: string;
  rootCause?: string;
  correctiveActions?: CorrectiveAction[];
  attachments?: Attachment[];
  metadata?: Record<string, any>;
}

export interface CorrectiveAction {
  id: string;
  description: string;
  assignee: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  completedDate?: string;
  verifiedBy?: string;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

// Safety Observation
export interface SafetyObservation {
  id: string;
  type: 'safe' | 'at-risk';
  category: string;
  description: string;
  location: string;
  observedBy: string;
  observedAt: string;
  actionTaken?: string;
  photos?: string[];
}

// Training Record
export interface TrainingRecord {
  id: string | number;
  employeeId: string;
  employeeName: string;
  courseId?: string | number;
  courseCode?: string;
  courseName: string;
  completedDate?: string;
  expirationDate?: string | null;
  status: 'Current' | 'Expiring Soon' | 'Expired' | 'Not Started';
  role?: string;
  department?: string;
  score?: number;
  certificateId?: string;
  evidenceType?: string;
}

export interface TrainingCourseRecord {
  id: number;
  courseCode: string;
  title: string;
  category: string;
  description?: string;
  durationHours: number;
  validityMonths: number;
  requiredForRoles: string[];
  regulatoryReference?: string;
  hazardTypes?: string[];
  deliveryMethod?: string;
  assessmentRequired?: boolean;
  passingScore?: number;
  isActive?: boolean;
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface TrainingComplianceSummary {
  totalRecords: number;
  uniqueEmployees: number;
  current: number;
  expiringSoon: number;
  expired: number;
  notStarted: number;
  complianceRate: number;
  overdueAssignments: number;
}

export interface EmployeeTrainingSummary {
  employeeId: string;
  employeeName: string;
  role: string;
  department?: string;
  records: TrainingRecord[];
  stats: {
    total: number;
    current: number;
    expiringSoon: number;
    expired: number;
    complianceRate: number;
  } | null;
}

export interface TrainingExpiringRecord {
  id: number;
  employeeId: string;
  employeeName: string;
  role: string;
  department?: string;
  courseCode: string;
  courseName: string;
  expirationDate: string;
  daysUntilExpiration: number;
}

export interface TrainingAssignmentPayload {
  employeeId: string;
  courseCode: string;
  assignedBy: string;
  dueDate?: string;
  priority?: 'Low' | 'Normal' | 'High' | 'Critical';
  reason?: string;
}

export interface TrainingAssignmentRecord {
  id: number;
  employeeId: string;
  courseCode: string;
  dueDate?: string | null;
  priority: string;
  status: string;
}

// Audit Record
export interface AuditRecord {
  id: number;
  auditNumber?: string;
  auditType: 'Safety' | 'Environmental' | 'Quality' | 'Compliance' | 'Process';
  title: string;
  scheduledDate: string;
  completedDate?: string;
  dueDate?: string;
  leadAuditor: string;
  auditTeam?: string[];
  auditee?: string;
  location: string;
  department?: string;
  industry?: string;
  overallScore?: number | null;
  grade?: string | null;
  totalItems?: number | null;
  passedItems?: number | null;
  failedItems?: number | null;
  naItems?: number | null;
  summary?: string;
  nextAuditDate?: string;
  findings?: AuditFinding[];
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'Overdue';
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface AuditFinding {
  id: number;
  auditId?: number;
  auditNumber?: string;
  auditTitle?: string;
  category: string;
  finding: string;
  severity: 'Critical' | 'Major' | 'Minor' | 'Observation';
  status: 'Open' | 'In Progress' | 'Closed' | 'Accepted Risk' | 'Overdue';
  recommendation?: string;
  responsiblePerson?: string;
  dueDate?: string;
  regulatoryRef?: string;
  closedDate?: string;
  closureNotes?: string;
}

export interface InspectionScheduleRecord {
  id: number;
  title: string;
  inspectionType: 'swppp' | 'stormwater' | 'safety-audit' | 'epa' | 'sensor-check' | 'permit';
  description?: string;
  zone?: string;
  location?: string;
  equipmentId?: string;
  assignedTo?: string;
  assigneeEmail?: string;
  recurrence: 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';
  scheduledDate: string;
  scheduledTime?: string;
  duration: number;
  completedDate?: string;
  completedTime?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  result?: 'pass' | 'fail' | 'partial';
  checklist?: Array<{ item: string; completed: boolean }>;
  findings?: string[];
  notes?: string;
  nextScheduledDate?: string | null;
  notificationSent?: boolean;
  reminderSent?: boolean;
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface InspectionStatsSummary {
  inspections: {
    total: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    overdue: number;
    cancelled: number;
    passed: number;
    failed: number;
  };
  sensors: {
    total: number;
    normal: number;
    warning: number;
    critical: number;
    offline: number;
    overdueCalibrations: number;
  };
}

export interface InspectionSensorRecord {
  id: number;
  sensorId: string;
  name: string;
  sensorType: 'temperature' | 'gas' | 'humidity' | 'noise' | 'flame' | 'motion';
  location: string;
  zone?: string;
  unit?: string;
  minThreshold?: number | null;
  maxThreshold?: number | null;
  status: 'normal' | 'warning' | 'critical' | 'offline' | 'maintenance';
  alertsEnabled: boolean;
  calibrationDue?: string;
  lastCalibrated?: string;
  positionX?: number | null;
  positionY?: number | null;
}

export interface CreateInspectionPayload {
  title: string;
  inspectionType: 'swppp' | 'stormwater' | 'safety-audit' | 'epa' | 'sensor-check' | 'permit';
  description?: string;
  zone?: string;
  location?: string;
  equipmentId?: string;
  assignedTo?: string;
  assigneeEmail?: string;
  recurrence?: 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';
  scheduledDate: string;
  scheduledTime?: string;
  duration?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  checklist?: string[];
  notes?: string;
}

export interface RiskMatrixCell {
  severity: number;
  likelihood: number;
  score: number;
  level: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface RiskMatrixReference {
  matrix: RiskMatrixCell[][];
  severityLevels: Record<number, string>;
  likelihoodLevels: Record<number, string>;
  riskLevels: Record<'Low' | 'Medium' | 'High' | 'Critical', string>;
}

export interface RiskRegisterStats {
  assessments: {
    total: number;
    active: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  register: {
    total: number;
    open: number;
    mitigated: number;
    closed: number;
  };
}

export interface RiskRegisterItem {
  id: number;
  riskCode: string;
  hazard: string;
  consequence: string;
  likelihood: number;
  likelihoodLabel?: string;
  severity: number;
  severityLabel?: string;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  mitigation?: string;
  controlType?: 'Elimination' | 'Substitution' | 'Engineering' | 'Administrative' | 'PPE';
  responsiblePerson?: string;
  targetDate?: string;
  status: 'Open' | 'Mitigated' | 'Closed' | 'Monitoring';
  assessmentId?: number;
  department?: string;
  location?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface CreateRiskRegisterPayload {
  riskCode: string;
  hazard: string;
  consequence: string;
  likelihood: number;
  severity: number;
  mitigation?: string;
  controlType?: 'Elimination' | 'Substitution' | 'Engineering' | 'Administrative' | 'PPE';
  responsiblePerson?: string;
  targetDate?: string;
  assessmentId?: number;
  department?: string;
  location?: string;
}

export interface PermitApprovalRecord {
  id: number;
  permitId: number;
  approverName: string;
  approverRole?: string | null;
  status: 'approved' | 'rejected';
  comments?: string | null;
  approvedAt?: number | null;
  createdAt?: number | null;
}

export interface PermitToWorkRecord {
  id: number;
  permitNumber: string;
  permitType: 'hot-work' | 'confined-space' | 'working-at-height' | 'electrical' | 'excavation' | 'general';
  title: string;
  location: string;
  workArea?: string | null;
  description?: string | null;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'pending-approval' | 'approved' | 'active' | 'closed' | 'cancelled';
  requestedBy?: string | null;
  approvedBy?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  ppeRequired: string[];
  precautions: string[];
  emergencyProcedure?: string | null;
  iotSensorIds: string[];
  department?: string | null;
  contractorId?: number | null;
  notes?: string | null;
  approvals?: PermitApprovalRecord[];
  createdAt?: number | null;
  updatedAt?: number | null;
}

export interface PermitToWorkStats {
  total: number;
  active: number;
  pendingApproval: number;
  expiringSoon: number;
  byStatus: Array<{ status: string; count: number }>;
  byType: Array<{ permitType: string; count: number }>;
  byRiskLevel: Array<{ riskLevel: string; count: number }>;
}

export interface CreatePermitToWorkPayload {
  permitType: PermitToWorkRecord['permitType'];
  title: string;
  location: string;
  workArea?: string;
  description?: string;
  riskLevel?: PermitToWorkRecord['riskLevel'];
  requestedBy?: string;
  startDate?: string;
  endDate?: string;
  ppeRequired?: string[];
  precautions?: string[];
  emergencyProcedure?: string;
  iotSensorIds?: string[];
  department?: string;
  contractorId?: number;
  notes?: string;
}

export interface PermitApprovalPayload {
  approverName: string;
  approverRole?: string;
  comments?: string;
}

export interface AutomationRuleRecord {
  id: number;
  name: string;
  description?: string | null;
  triggerCondition: Record<string, unknown>;
  action: Record<string, unknown>;
  active: boolean;
  createdBy?: string | null;
  executionCount?: number | null;
  lastTriggered?: number | null;
  createdAt?: number | null;
  updatedAt?: number | null;
}

export interface CreateAutomationRulePayload {
  name: string;
  description?: string;
  triggerCondition: Record<string, unknown>;
  action: Record<string, unknown>;
  active?: boolean;
  createdBy?: string;
}

export interface WebhookRecord {
  id: number;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string | null;
  lastDelivery?: number | null;
  failureCount?: number | null;
  createdAt?: number | null;
  updatedAt?: number | null;
}

export interface CreateWebhookPayload {
  name: string;
  url: string;
  events: string[];
  active?: boolean;
  secret?: string;
}

export interface AuditStatsSummary {
  audits: {
    total: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    overdue: number;
    avgScore: number | null;
  };
  findings: {
    total: number;
    open: number;
    critical: number;
    major: number;
  };
  compliance: {
    total: number;
    compliant: number;
    nonCompliant: number;
    inProgress: number;
    complianceRate: number;
  };
}

export interface AuditTemplateRecord {
  id: number;
  name: string;
  industry?: string;
  auditType: 'Safety' | 'Environmental' | 'Quality' | 'Compliance' | 'Process';
  description?: string;
  version?: string;
  categories: string[];
  itemCount: number;
}

export interface CreateAuditPayload {
  auditNumber: string;
  templateId?: number;
  title: string;
  auditType: 'Safety' | 'Environmental' | 'Quality' | 'Compliance' | 'Process';
  location: string;
  department?: string;
  industry?: string;
  scheduledDate: string;
  dueDate?: string;
  leadAuditor: string;
  auditTeam?: string[];
  auditee?: string;
}

export interface CreateAuditFindingPayload {
  category: string;
  finding: string;
  severity: 'Critical' | 'Major' | 'Minor' | 'Observation';
  recommendation?: string;
  responsiblePerson?: string;
  dueDate?: string;
  regulatoryRef?: string;
}

// ESG Data Types (for 2026 Integration)
export interface ESGMetrics {
  period: string;
  environmental: EnvironmentalMetrics;
  social: SocialMetrics;
  governance: GovernanceMetrics;
  overallScore: number;
}

export interface EnvironmentalMetrics {
  carbonEmissions: number; // tCO2e
  energyConsumption: number; // MWh
  waterUsage: number; // m³
  wasteGenerated: number; // tonnes
  wasteDiverted: number; // percentage
  renewableEnergy: number; // percentage
  scope1Emissions: number;
  scope2Emissions: number;
  scope3Emissions?: number;
}

export interface SocialMetrics {
  trir: number;
  dartRate: number;
  lostTimeIncidents: number;
  nearMissReports: number;
  trainingHoursPerEmployee: number;
  employeeSatisfaction: number;
  diversityIndex: number;
  volunteerHours: number;
  communityInvestment: number;
}

export interface GovernanceMetrics {
  complianceScore: number;
  auditFindingsClosed: number;
  policyReviewsCompleted: number;
  ethicsViolations: number;
  boardDiversity: number;
  riskAssessmentsCompleted: number;
}

// Leading Indicators (Predictive Analytics)
export interface LeadingIndicators {
  period: string;
  auditClosureRate: number;
  trainingEffectiveness: number;
  hazardIdentificationRate: number;
  nearMissReportingRate: number;
  safetyMeetingAttendance: number;
  correctiveActionTimeliness: number;
  riskScore: number;
  predictedIncidentRate: number;
}

export interface BackendIncidentRecord {
  id: number;
  incidentDate: string;
  incidentTime: string;
  location: string;
  department?: string | null;
  industrySector?: string | null;
  incidentType: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  immediateActions?: string | null;
  witnesses?: string | null;
  rootCauses?: string | null;
  correctiveActions?: string | null;
  assignedTo?: string | null;
  dueDate?: string | null;
  isoClause?: string | null;
  regulatoryReportable?: boolean | null;
  status: string;
  createdAt?: number | string | null;
  updatedAt?: number | string | null;
}

export interface DashboardOverview {
  incidents: BackendIncidentRecord[];
  alerts: unknown[];
  kpis: unknown[];
  summary: {
    totalIncidents: number;
    activeAlerts: number;
    metricsCount: number;
    timestamp: string;
  };
}

// ── Dashboard Live Stats ──────────────────────────────────────────────────────

export interface DashboardPlatformStat {
  value: number | string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface DashboardIncidentTrend {
  month: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface DashboardInspectionTrend {
  month: string;
  total: number;
  completed: number;
  scheduled: number;
}

export interface DashboardSeverityBreakdown {
  severity: string;
  count: number;
  percentage: number;
}

export interface DashboardSystemHealth {
  name: string;
  status: 'healthy' | 'degraded';
  uptime: string;
  latency: string;
  icon: string;
}

export interface DashboardAIEngine {
  name: string;
  icon: string;
  status: 'online' | 'syncing' | 'offline';
  latency: string;
  load: number;
}

export interface DashboardBusinessMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
  subtext: string;
}

export interface DashboardFunnelStage {
  stage: string;
  value: number;
  pct: number;
  color: string;
}

export interface DashboardLiveEvent {
  type: string;
  message: string;
  timestamp: string;
  eventType: 'info' | 'warning' | 'success';
}

export interface DashboardChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface DashboardComplianceAlert {
  id: number;
  type: 'critical' | 'warning' | 'info' | 'success';
  message: string;
  isResolved: boolean;
  createdAt: number | string;
}

export interface DashboardLiveStats {
  platformStats: {
    activeSensors: DashboardPlatformStat;
    aiPredictions: DashboardPlatformStat;
    complianceRate: DashboardPlatformStat;
    threatsBlocked: DashboardPlatformStat;
    activeOperators: number;
    safetyScore: number;
    safetyScoreChange: string;
  };
  incidentTrends: DashboardIncidentTrend[];
  inspectionTrends: DashboardInspectionTrend[];
  severityBreakdown: DashboardSeverityBreakdown[];
  systemHealth: DashboardSystemHealth[];
  systemHealthSummary: { healthyCount: number; degradedCount: number; total: number };
  aiPlatforms: DashboardAIEngine[];
  aiPlatformsSummary: { onlineCount: number; total: number };
  businessMetrics: DashboardBusinessMetric[];
  conversionFunnel: DashboardFunnelStage[];
  liveEvents: DashboardLiveEvent[];
  checklistItems: DashboardChecklistItem[] | null;
  meta: {
    generatedAt: string;
    totalIncidents: number;
    totalWorkers: number;
    totalCourses: number;
  };
}


export interface InvestigationRecord {
  id: number;
  incidentId: number;
  investigationDate: string;
  investigator: string;
  industry?: string | null;
  findings?: string | null;
  status: string;
  isoClause?: string | null;
  regulatoryReportable?: boolean | null;
  createdAt?: number | string | null;
  updatedAt?: number | string | null;
}

export interface CreateInvestigationPayload {
  incidentId: number;
  investigationDate: string;
  investigator: string;
  industry?: string;
  findings?: string;
}

export interface RccaCorrectiveAction {
  action: string;
  assignedTo: string;
  dueDate: string;
  status: string;
}

export interface RccaLessonsLearned {
  whatHappened?: string;
  whyMatters?: string;
  keyTakeaways?: string;
  recommendations?: string;
}

export interface RccaRecord {
  id: number;
  investigationId: number;
  rootCauses: string[];
  whyAnalysis: Record<string, string>;
  fishboneFactors: Record<string, string[]>;
  correctiveActions: RccaCorrectiveAction[];
  preventiveMeasures: string[];
  lessonsLearned: RccaLessonsLearned;
  status: string;
  createdAt?: number | string | null;
  updatedAt?: number | string | null;
}

export interface SaveRccaPayload {
  investigationId?: number;
  rootCauses?: string[];
  whyAnalysis?: Record<string, string>;
  fishboneFactors?: Record<string, string[]>;
  correctiveActions?: RccaCorrectiveAction[];
  preventiveMeasures?: string[];
  lessonsLearned?: RccaLessonsLearned;
}

export interface CapaRecord {
  id: number;
  investigationId?: number | null;
  title: string;
  description?: string | null;
  capaType: 'Corrective' | 'Preventive';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  department?: string | null;
  riskArea?: string | null;
  problemStatement?: string | null;
  rootCauseStatement?: string | null;
  assignedTo?: string | null;
  dueDate?: string | null;
  completionDate?: string | null;
  status: string;
  verificationDate?: string | null;
  verificationResult?: string | null;
  createdAt?: number | string | null;
  updatedAt?: number | string | null;
}

export interface CreateCapaPayload {
  investigationId?: number;
  title: string;
  description: string;
  capaType: 'Corrective' | 'Preventive';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  department?: string;
  riskArea?: string;
  problemStatement?: string;
  rootCauseStatement?: string;
  assignedTo?: string;
  dueDate?: string;
}

export interface ControlHierarchyItem {
  level: number;
  name: string;
  description: string;
  effectiveness: number;
  examples: string[];
  regulatoryReferences: string[];
}

export interface ControlRecord {
  id: number;
  name: string;
  controlType: string;
  hierarchyLevel: number;
  status: string;
  designEffectiveness?: number | null;
  actualEffectiveness?: number | null;
  riskLevel?: string | null;
}

export interface IncidentSubmissionPayload {
  incidentDate: string;
  incidentTime: string;
  location: string;
  department?: string;
  industrySector?: string;
  incidentType?: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  immediateActions?: string;
  witnesses?: string;
  rootCauses?: string;
  correctiveActions?: string;
  assignedTo?: string;
  dueDate?: string;
  isoClause?: string;
  regulatoryReportable?: boolean;
  bodyPart?: string;
  injuryType?: string;
  treatmentRequired?: boolean;
  medicalAttention?: boolean;
  daysLost?: number;
  vehicleId?: string;
  driverName?: string;
  vehicleType?: string;
  damageLevel?: 'minor' | 'moderate' | 'severe';
  thirdPartyInvolved?: boolean;
  insuranceClaim?: boolean;
  claimNumber?: string;
  assetId?: string;
  assetName?: string;
  damageDescription?: string;
  damageEstimate?: number;
  repairRequired?: boolean;
  estimatedRepairTime?: string;
  environmentalImpact?: boolean;
  businessInterruption?: boolean;
  potentialSeverity?: string;
  potentialConsequence?: string;
  preventativeMeasure?: string;
  likelihood?: string;
  selectedStandards?: string[];
}

export interface AISuggestionPayload {
  industry?: string;
  category?: string;
  checklistItems?: string[];
  completedItems?: number;
}

export interface AISuggestionResult {
  suggestions: string[];
  source: string;
  status: string;
  message?: string;
}

const normalizeIncidentCreateEndpoint = (incidentType?: string): 'generic' | 'injury' | 'vehicle' | 'property' | 'near-miss' => {
  const normalizedType = incidentType?.trim().toLowerCase();

  if (!normalizedType) return 'generic';
  if (normalizedType.includes('vehicle')) return 'vehicle';
  if (normalizedType.includes('property')) return 'property';
  if (normalizedType.includes('near miss')) return 'near-miss';
  if (
    normalizedType.includes('injury') ||
    normalizedType.includes('first aid') ||
    normalizedType.includes('lost time') ||
    normalizedType.includes('fatal')
  ) {
    return 'injury';
  }

  return 'generic';
};

const resolveIncidentCreateEndpoint = (data: IncidentSubmissionPayload) => {
  if (data.bodyPart && data.injuryType) {
    return '/incidents/injury';
  }

  switch (normalizeIncidentCreateEndpoint(data.incidentType)) {
    case 'injury':
      return '/incidents/injury';
    case 'vehicle':
      return '/incidents/vehicle';
    case 'property':
      return '/incidents/property';
    case 'near-miss':
      return '/incidents/near-miss';
    default:
      return '/incidents/create';
  }
};

const parseJsonArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
};

const mapPermitApprovalRecord = (record: any): PermitApprovalRecord => ({
  id: Number(record.id),
  permitId: Number(record.permit_id ?? record.permitId),
  approverName: String(record.approver_name ?? record.approverName ?? 'Unknown'),
  approverRole: record.approver_role ?? record.approverRole ?? null,
  status: record.status,
  comments: record.comments ?? null,
  approvedAt: record.approved_at ?? record.approvedAt ?? null,
  createdAt: record.created_at ?? record.createdAt ?? null,
});

const mapPermitToWorkRecord = (record: any): PermitToWorkRecord => ({
  id: Number(record.id),
  permitNumber: String(record.permit_number ?? record.permitNumber ?? ''),
  permitType: record.permit_type ?? record.permitType,
  title: String(record.title ?? ''),
  location: String(record.location ?? ''),
  workArea: record.work_area ?? record.workArea ?? null,
  description: record.description ?? null,
  riskLevel: record.risk_level ?? record.riskLevel ?? 'medium',
  status: record.status,
  requestedBy: record.requested_by ?? record.requestedBy ?? null,
  approvedBy: record.approved_by ?? record.approvedBy ?? null,
  startDate: record.start_date ?? record.startDate ?? null,
  endDate: record.end_date ?? record.endDate ?? null,
  actualStart: record.actual_start ?? record.actualStart ?? null,
  actualEnd: record.actual_end ?? record.actualEnd ?? null,
  ppeRequired: parseJsonArray(record.ppeRequired ?? record.ppe_required),
  precautions: parseJsonArray(record.precautions),
  emergencyProcedure: record.emergency_procedure ?? record.emergencyProcedure ?? null,
  iotSensorIds: parseJsonArray(record.iotSensorIds ?? record.iot_sensor_ids),
  department: record.department ?? null,
  contractorId: record.contractor_id ?? record.contractorId ?? null,
  notes: record.notes ?? null,
  approvals: Array.isArray(record.approvals) ? record.approvals.map(mapPermitApprovalRecord) : undefined,
  createdAt: record.created_at ?? record.createdAt ?? null,
  updatedAt: record.updated_at ?? record.updatedAt ?? null,
});

// ============================================
// API Service Class
// ============================================

class APIService {
  private config: APIConfig;

  constructor(config?: Partial<APIConfig>) {
    this.config = { ...getAPIConfig(), ...config };
  }

  private normalizeResponse<T>(payload: unknown): APIResponse<T> {
    const timestamp =
      typeof payload === 'object' &&
      payload !== null &&
      'timestamp' in payload &&
      typeof (payload as { timestamp?: unknown }).timestamp === 'string'
        ? (payload as { timestamp: string }).timestamp
        : new Date().toISOString();

    if (typeof payload === 'object' && payload !== null && 'success' in payload) {
      const responsePayload = payload as Partial<APIResponse<T>> & { data?: T };
      return {
        data: (responsePayload.data ?? (payload as T)) as T,
        success: Boolean(responsePayload.success),
        message: responsePayload.message,
        pagination: responsePayload.pagination,
        timestamp,
      };
    }

    return {
      data: payload as T,
      success: true,
      timestamp,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;
    const authHeaders = typeof window !== 'undefined' ? getAuthHeader() : {};
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.config.headers,
          ...authHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err = new Error(errorData.error || errorData.message || `HTTP ${response.status}`) as Error & { issues?: unknown[] };
        if (errorData.issues) err.issues = errorData.issues;
        throw err;
      }

      const payload = await response.json();
      return this.normalizeResponse<T>(payload);
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // Generic CRUD operations
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<APIResponse<T>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<T>(`${endpoint}${queryString}`, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Singleton instance
export const api = new APIService();

// ============================================
// Domain-Specific API Services
// ============================================

export const dashboardService = {
  getOverview: () => api.get<DashboardOverview>('/dashboard/overview'),
  getIncidents: () => api.get<BackendIncidentRecord[]>('/dashboard/incidents'),
  getLiveStats: () => api.get<DashboardLiveStats>('/dashboard/live-stats'),
  getComplianceAlerts: () => api.get<DashboardComplianceAlert[]>('/dashboard/compliance-alerts'),
};

export interface IncidentStats {
  total: number;
  distinctTypes: number;
  byType: { type: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
  byStatus: { status: string; count: number }[];
  dominantSeverity: string;
}

export const incidentService = {
  getAll: (params?: { page?: number; limit?: number; status?: string; type?: string }) =>
    api.get<BackendIncidentRecord[]>('/incidents', params),
  
  getById: (id: string) =>
    api.get<BackendIncidentRecord>(`/incidents/${id}`),
  
  create: (data: IncidentSubmissionPayload) =>
    api.post<BackendIncidentRecord>(resolveIncidentCreateEndpoint(data), data),
  
  update: (id: string, data: Partial<BackendIncidentRecord>) =>
    api.put<void>(`/incidents/${id}`, data),

  close: (id: string) =>
    api.post<void>(`/incidents/${id}/close`, {}),

  reopen: (id: string) =>
    api.post<void>(`/incidents/${id}/reopen`, {}),
  
  delete: (id: string) =>
    api.delete<void>(`/incidents/${id}`),
  
  addCorrectiveAction: (incidentId: string, action: Partial<CorrectiveAction>) =>
    api.post<CorrectiveAction>(`/incidents/${incidentId}/corrective-actions`, action),
  
  getStatistics: (period: string) =>
    api.get<DashboardOverview>('/dashboard/overview', { period }),

  getStats: () =>
    api.get<IncidentStats>('/incidents/stats'),
};

export const aiAssistantService = {
  getSuggestions: (payload: AISuggestionPayload) =>
    api.post<AISuggestionResult>('/ai/suggestions', payload),
};

export const investigationService = {
  getAll: (params?: { status?: string; industry?: string }) =>
    api.get<InvestigationRecord[]>('/investigations/list', params),

  getByIncidentId: (incidentId: number) =>
    api.get<InvestigationRecord>(`/investigations/${incidentId}`),

  getById: (id: number) =>
    api.get<InvestigationRecord>(`/investigations/id/${id}`),

  create: (data: CreateInvestigationPayload) =>
    api.post<InvestigationRecord>('/investigations/create', data),

  update: (id: number, data: Partial<InvestigationRecord>) =>
    api.put<InvestigationRecord>(`/investigations/${id}`, data),

  saveRcca: (investigationId: number, data: SaveRccaPayload) =>
    api.post<RccaRecord>(`/investigations/${investigationId}/rcca`, data),

  getRcca: (investigationId: number) =>
    api.get<RccaRecord>(`/investigations/${investigationId}/rcca`),
};

export const capaService = {
  getAll: (params?: { status?: string; priority?: string; type?: string }) =>
    api.get<CapaRecord[]>('/capa/list', params),

  getById: (id: number) =>
    api.get<CapaRecord>(`/capa/${id}`),

  create: (data: CreateCapaPayload) =>
    api.post<CapaRecord>('/capa/create', data),

  update: (id: number, data: Partial<CapaRecord>) =>
    api.put<CapaRecord>(`/capa/${id}`, data),
};

export const controlService = {
  getHierarchy: () => api.get<ControlHierarchyItem[]>('/controls/hierarchy'),
  getAll: (params?: { status?: string; type?: string; riskLevel?: string }) =>
    api.get<ControlRecord[]>('/controls/list', params),
};

export const observationService = {
  getAll: (params?: Record<string, any>) =>
    api.get<SafetyObservation[]>('/observations', params),
  
  create: (data: Partial<SafetyObservation>) =>
    api.post<SafetyObservation>('/observations', data),
  
  getStatistics: () =>
    api.get<any>('/observations/statistics'),
};

export const trainingService = {
  getCourses: (params?: { category?: string; role?: string; active?: boolean }) =>
    api.get<TrainingCourseRecord[]>('/training/courses', params),

  getCourseById: (id: number) =>
    api.get<TrainingCourseRecord>(`/training/courses/${id}`),
  
  getByEmployee: (employeeId: string) =>
    api.get<EmployeeTrainingSummary>(`/training/employee/${employeeId}`),
  
  assignCourse: (data: TrainingAssignmentPayload) =>
    api.post<TrainingAssignmentRecord>('/training/assign', data),
  
  getComplianceReport: () =>
    api.get<TrainingComplianceSummary>('/training/compliance'),

  getExpiring: (days: number = 30) =>
    api.get<TrainingExpiringRecord[]>('/training/expiring', { days }),
};

export const auditService = {
  getStats: () =>
    api.get<AuditStatsSummary>('/audits/stats'),

  getTemplates: (params?: { type?: string; industry?: string }) =>
    api.get<AuditTemplateRecord[]>('/audits/templates', params),

  getAll: (params?: { status?: string; type?: string; department?: string }) =>
    api.get<AuditRecord[]>('/audits/list', params),
  
  getById: (id: number) =>
    api.get<AuditRecord>(`/audits/${id}`),
  
  create: (data: CreateAuditPayload) =>
    api.post<AuditRecord>('/audits/create', data),
  
  addFinding: (auditId: number, finding: CreateAuditFindingPayload) =>
    api.post<AuditFinding>(`/audits/${auditId}/findings`, finding),
  
  updateFinding: (findingId: number, data: Partial<AuditFinding>) =>
    api.put<AuditFinding>(`/audits/findings/${findingId}`, data),

  getOpenFindings: (severity?: string) =>
    api.get<AuditFinding[]>('/audits/findings/open', severity ? { severity } : undefined),

  update: (id: number, data: Partial<AuditRecord>) =>
    api.put<AuditRecord>(`/audits/${id}`, data),
};

export const inspectionService = {
  getStats: () =>
    api.get<InspectionStatsSummary>('/inspections/stats'),

  getSchedule: (params?: { status?: string; type?: string; zone?: string; priority?: string }) =>
    api.get<InspectionScheduleRecord[]>('/inspections/schedule', params),

  getById: (id: number) =>
    api.get<InspectionScheduleRecord>(`/inspections/${id}`),

  create: (data: CreateInspectionPayload) =>
    api.post<InspectionScheduleRecord>('/inspections/schedule', data),

  update: (id: number, data: Partial<InspectionScheduleRecord>) =>
    api.put<InspectionScheduleRecord>(`/inspections/${id}`, data),

  getSensors: (params?: { type?: string; zone?: string; status?: string }) =>
    api.get<InspectionSensorRecord[]>('/inspections/sensors', params),
};

export const riskService = {
  getMatrix: () =>
    api.get<RiskMatrixReference>('/risks/matrix'),

  getStats: () =>
    api.get<RiskRegisterStats>('/risks/stats'),

  getRegister: (params?: { status?: string; riskLevel?: string; department?: string }) =>
    api.get<RiskRegisterItem[]>('/risks/register', params),

  getRegisterItem: (id: number) =>
    api.get<RiskRegisterItem>(`/risks/register/${id}`),

  createRegisterItem: (data: CreateRiskRegisterPayload) =>
    api.post<RiskRegisterItem>('/risks/register', data),

  updateRegisterItem: (id: number, data: Partial<RiskRegisterItem>) =>
    api.put<RiskRegisterItem>(`/risks/register/${id}`, data),
};

export const permitToWorkService = {
  getStats: async () => {
    const response = await api.get<{
      total: number;
      active: number;
      pendingApproval: number;
      expiringSoon: number;
      byStatus: Array<{ status: string; count: number }>;
      byType: Array<{ permit_type: string; count: number }>;
      byRiskLevel: Array<{ risk_level: string; count: number }>;
    }>('/ptw/stats');

    return {
      ...response,
      data: {
        total: response.data.total,
        active: response.data.active,
        pendingApproval: response.data.pendingApproval,
        expiringSoon: response.data.expiringSoon,
        byStatus: response.data.byStatus,
        byType: response.data.byType.map((item) => ({
          permitType: item.permit_type,
          count: item.count,
        })),
        byRiskLevel: response.data.byRiskLevel.map((item) => ({
          riskLevel: item.risk_level,
          count: item.count,
        })),
      } satisfies PermitToWorkStats,
    };
  },

  getPermits: async (params?: { status?: string; permitType?: string; riskLevel?: string; department?: string }) => {
    const response = await api.get<any[]>('/ptw/permits', params);
    return {
      ...response,
      data: response.data.map(mapPermitToWorkRecord),
    };
  },

  getPermit: async (id: number) => {
    const response = await api.get<any>(`/ptw/permits/${id}`);
    return {
      ...response,
      data: mapPermitToWorkRecord(response.data),
    };
  },

  createPermit: async (data: CreatePermitToWorkPayload) => {
    const response = await api.post<any>('/ptw/permits', data);
    return {
      ...response,
      data: mapPermitToWorkRecord(response.data),
    };
  },

  updatePermit: async (id: number, data: Partial<CreatePermitToWorkPayload> & { status?: PermitToWorkRecord['status']; approvedBy?: string; actualStart?: string; actualEnd?: string }) => {
    const response = await api.put<any>(`/ptw/permits/${id}`, data);
    return {
      ...response,
      data: mapPermitToWorkRecord(response.data),
    };
  },

  approvePermit: async (id: number, data: PermitApprovalPayload) => {
    const response = await api.post<any>(`/ptw/permits/${id}/approve`, data);
    return {
      ...response,
      data: mapPermitToWorkRecord(response.data),
    };
  },

  rejectPermit: async (id: number, data: PermitApprovalPayload) => {
    const response = await api.post<any>(`/ptw/permits/${id}/reject`, data);
    return {
      ...response,
      data: mapPermitToWorkRecord(response.data),
    };
  },

  deletePermit: (id: number) =>
    api.delete<{ message: string }>(`/ptw/permits/${id}`),
};

export const automationService = {
  getRules: (params?: { active?: boolean }) =>
    api.get<AutomationRuleRecord[]>('/automation/rules', {
      active: params?.active === undefined ? undefined : Number(params.active),
    }),

  createRule: (data: CreateAutomationRulePayload) =>
    api.post<AutomationRuleRecord>('/automation/rules', {
      ...data,
      active: data.active === undefined ? 1 : Number(data.active),
    }),

  updateRule: (id: number, data: Partial<CreateAutomationRulePayload>) =>
    api.put<AutomationRuleRecord>(`/automation/rules/${id}`, {
      ...data,
      active: data.active === undefined ? undefined : Number(data.active),
    }),

  deleteRule: (id: number) =>
    api.delete<{ message: string }>(`/automation/rules/${id}`),

  triggerRule: (ruleId: number) =>
    api.post<{ message: string; ruleId: number; action: Record<string, unknown>; triggeredAt: number }>('/automation/trigger', { ruleId }),
};

export const webhookApiService = {
  getAll: () =>
    api.get<WebhookRecord[]>('/webhooks'),

  create: (data: CreateWebhookPayload) =>
    api.post<WebhookRecord>('/webhooks', {
      ...data,
      active: data.active === undefined ? 1 : Number(data.active),
    }),

  update: (id: number, data: Partial<CreateWebhookPayload>) =>
    api.put<WebhookRecord>(`/webhooks/${id}`, {
      ...data,
      active: data.active === undefined ? undefined : Number(data.active),
    }),

  delete: (id: number) =>
    api.delete<{ message: string }>(`/webhooks/${id}`),
};

export interface NotificationEventRecord {
  id: number;
  ruleId: number;
  ruleName: string;
  triggerType: string;
  status: 'success' | 'failed' | 'pending';
  details?: string | null;
  recipient?: string | null;
  createdAt: number;
}

export interface CreateAutomationEventPayload {
  ruleId: number;
  ruleName: string;
  triggerType: string;
  status?: 'success' | 'failed' | 'pending';
  details?: string;
  recipient?: string;
}

export const automationEventService = {
  getAll: (params?: { ruleId?: number; limit?: number }) =>
    api.get<NotificationEventRecord[]>('/automation/events', {
      ...(params?.ruleId !== undefined && { ruleId: params.ruleId }),
      ...(params?.limit !== undefined && { limit: params.limit }),
    }),
  create: (data: CreateAutomationEventPayload) =>
    api.post<NotificationEventRecord>('/automation/events', data),
};

// ESG Service (Ready for 2026 integration)
export const esgService = {
  getMetrics: (period: string) =>
    api.get<any>('/esg/metrics', { period }),

  getDashboard: (period: string) =>
    api.get<ESGMetrics>('/esg/dashboard', { period }),
  
  getEnvironmental: (period: string) =>
    api.get<EnvironmentalMetrics>('/esg/environmental', { period }),
  
  getSocial: (period: string) =>
    api.get<SocialMetrics>('/esg/social', { period }),
  
  getGovernance: (period: string) =>
    api.get<GovernanceMetrics>('/esg/governance', { period }),
  
  submitReport: (data: ESGMetrics) =>
    api.post<{ reportId: string }>('/esg/reports', data),
  
  getSDGAlignment: () =>
    api.get<any>('/esg/sdg-alignment'),
};

// Leading Indicators Service (Predictive Analytics)
export const leadingIndicatorsService = {
  getIndicators: (period: string) =>
    api.get<LeadingIndicators>('/analytics/leading-indicators', { period }),
  
  getAuditClosureTime: () =>
    api.get<{ avgDays: number; trend: number }>('/analytics/audit-closure-time'),
  
  getTrainingEffectiveness: () =>
    api.get<{ score: number; trend: number }>('/analytics/training-effectiveness'),
  
  getPredictiveRisk: () =>
    api.get<{ riskScore: number; factors: any[] }>('/analytics/predictive-risk'),
  
  getTrends: (metrics: string[], period: string) =>
    api.get<any[]>('/analytics/trends', { metrics: metrics.join(','), period }),
};

// ============================================
// API Endpoint Mapping (for backend team)
// ============================================

export const API_ENDPOINTS = {
  // Dashboard
  DASHBOARD_OVERVIEW: '/dashboard/overview',
  DASHBOARD_INCIDENTS: '/dashboard/incidents',

  // Incidents
  INCIDENTS: '/incidents',
  INCIDENT_BY_ID: '/incidents/:id',
  INCIDENT_CREATE: '/incidents/create',
  INCIDENT_INJURY: '/incidents/injury',
  INCIDENT_VEHICLE: '/incidents/vehicle',
  INCIDENT_PROPERTY: '/incidents/property',
  INCIDENT_NEAR_MISS: '/incidents/near-miss',
  INCIDENT_CLOSE: '/incidents/:id/close',
  INCIDENT_REOPEN: '/incidents/:id/reopen',
  
  // Observations
  OBSERVATIONS: '/observations',
  OBSERVATION_STATISTICS: '/observations/statistics',
  
  // Training
  TRAINING: '/training',
  TRAINING_BY_EMPLOYEE: '/training/employee/:employeeId',
  TRAINING_ASSIGN: '/training/assign',
  TRAINING_COMPLETE: '/training/:id/complete',
  TRAINING_COMPLIANCE: '/training/compliance',
  
  // Audits
  AUDITS: '/audits',
  AUDIT_BY_ID: '/audits/:id',
  AUDIT_FINDINGS: '/audits/:id/findings',
  AUDIT_CLOSURE_RATE: '/audits/closure-rate',
  
  // ESG (Enterprise Sustainability & Governance)
  ESG_METRICS: '/esg/metrics',
  ESG_ENVIRONMENTAL: '/esg/environmental',
  ESG_SOCIAL: '/esg/social',
  ESG_GOVERNANCE: '/esg/governance',
  ESG_REPORTS: '/esg/reports',
  ESG_SDG_ALIGNMENT: '/esg/sdg-alignment',
  
  // Leading Indicators (Predictive)
  LEADING_INDICATORS: '/analytics/leading-indicators',
  AUDIT_CLOSURE_TIME: '/analytics/audit-closure-time',
  TRAINING_EFFECTIVENESS: '/analytics/training-effectiveness',
  PREDICTIVE_RISK: '/analytics/predictive-risk',
  ANALYTICS_TRENDS: '/analytics/trends',
  
  // Authentication (when Youbase is enabled)
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_ME: '/auth/me',

  // AI
  AI_SUGGESTIONS: '/ai/suggestions',
  AI_CHAT: '/ai/chat',
  AI_STATUS: '/ai/status',

  // Investigations
  INVESTIGATIONS: '/investigations/list',
  INVESTIGATION_BY_INCIDENT: '/investigations/:incidentId',
  INVESTIGATION_BY_ID: '/investigations/id/:id',
  INVESTIGATION_CREATE: '/investigations/create',
  INVESTIGATION_RCCA: '/investigations/:id/rcca',

  // CAPA and Controls
  CAPA_LIST: '/capa/list',
  CAPA_CREATE: '/capa/create',
  CAPA_BY_ID: '/capa/:id',
  CONTROLS_HIERARCHY: '/controls/hierarchy',
  CONTROLS_LIST: '/controls/list',

  // Permit to Work
  PTW_STATS: '/ptw/stats',
  PTW_PERMITS: '/ptw/permits',
  PTW_PERMIT_BY_ID: '/ptw/permits/:id',
  PTW_APPROVE: '/ptw/permits/:id/approve',
  PTW_REJECT: '/ptw/permits/:id/reject',
  
  // Users
  USERS: '/users',
  USER_BY_ID: '/users/:id',
  USER_PERMISSIONS: '/users/:id/permissions',
};

// ============================================
// Auth Service (NEW - JWT based)
// ============================================

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload {
  email: string; password: string; fullName: string;
  role?: string; department?: string; organization?: string;
}
export interface AuthTokenResponse {
  accessToken: string; refreshToken: string;
  expiresIn: number; tokenType: string;
  user: {
    id: number; email: string; fullName: string;
    role: string; department?: string; organization?: string;
    isActive: boolean; lastLogin?: number;
  };
}

// Helper: get auth header
function getAuthHeader(): Record<string, string> {
  try {
    const stored = localStorage.getItem('safetymeg-auth');
    if (stored) {
      const { state } = JSON.parse(stored);
      if (state?.accessToken) {
        return { Authorization: `Bearer ${state.accessToken}` };
      }
    }
  } catch { /* ignore */ }
  return {};
}

export const authApiService = {
  login: (data: LoginPayload) =>
    api.post<AuthTokenResponse>('/auth/login', data),

  register: (data: RegisterPayload) =>
    api.post<AuthTokenResponse>('/auth/register', data),

  logout: (refreshToken?: string) =>
    api.post<{ message: string }>('/auth/logout', { refreshToken }),

  refresh: (refreshToken: string) =>
    api.post<AuthTokenResponse>('/auth/refresh', { refreshToken }),

  getMe: () =>
    api.get<AuthTokenResponse['user']>('/auth/me'),

  updateMe: (data: Partial<Pick<AuthTokenResponse['user'], 'fullName' | 'department' | 'organization'>>) =>
    api.put<AuthTokenResponse['user']>('/auth/me', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword }),

  forgotPassword: (email: string) =>
    api.post<{ success: boolean; message: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post<{ success: boolean; message: string }>('/auth/reset-password', { token, newPassword }),

};

// ============================================
// Analytics Service (NEW)
// ============================================

export interface IncidentTrendData {
  month: string; total: number; critical: number;
  high: number; medium: number; low: number; nearMisses: number;
}
export interface SeverityBreakdown { severity: string; count: number; percentage: number; }
export interface DepartmentMetric {
  department: string; incidents: number; highSeverityIncidents: number;
  openCapas: number; totalCapas: number; capaClosureRate: number | null;
}
export interface HeatmapPoint {
  location: string; department: string; count: number;
  critical: number; high: number; riskLevel: string;
}
export interface TimeSeriesData { period: string; value: number; }
export interface KPIMetric {
  id: string; label: string; value: number | null;
  unit?: string; description?: string; trend: 'good' | 'bad' | 'neutral';
}

export interface ExecutiveKPIs {
  safetyScore: number;
  safetyScoreDelta: string;
  openActions: number;
  overdueActions: number;
  trir: number;
  trirChange: string;
  compliancePct: number;
  standardName: string;
}

export interface LeadingIndicatorItem {
  label: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down';
  delta: string;
}

export interface LaggingIndicatorItem {
  label: string;
  value: number;
  prev: number;
  unit: string;
  trend: 'up' | 'down';
  good: boolean;
}

export interface SiteScoreItem {
  site: string;
  leading: number;
  lagging: number;
  overall: number;
  risk: 'low' | 'medium' | 'high';
}

export interface MonthlyTrendItem {
  month: string;
  inspections: number;
  observations: number;
  incidents: number;
}

export const analyticsService = {
  getIncidentTrends: (params?: { months?: number; department?: string }) =>
    api.get<IncidentTrendData[]>('/analytics/incidents', params as any),

  getSeverityBreakdown: (params?: { from?: string; to?: string }) =>
    api.get<SeverityBreakdown[]>('/analytics/severity-breakdown', params as any),

  getDepartmentMetrics: (params?: { from?: string; to?: string }) =>
    api.get<DepartmentMetric[]>('/analytics/department-metrics', params as any),

  getHeatmapData: (params?: { from?: string; to?: string }) =>
    api.get<HeatmapPoint[]>('/analytics/heatmap-data', params as any),

  getTimeSeries: (params: { metric: string; period?: string; granularity?: string }) =>
    api.get<TimeSeriesData[]>('/analytics/time-series', params as any),

  getKPIMetrics: (year?: string) =>
    api.get<KPIMetric[]>('/analytics/kpi-metrics', year ? { year } : undefined),

  runCustomQuery: (data: { metric: string; from?: string; to?: string; groupBy?: string }) =>
    api.post<any[]>('/analytics/custom-query', data),

  getReportTemplates: (type?: string) =>
    api.get<any[]>('/reports/templates', type ? { type } : undefined),

  createReportTemplate: (data: any) =>
    api.post<any>('/reports/templates', data),

  generateReport: (data: { type: string; from?: string; to?: string; department?: string; format?: string }) =>
    api.post<any>('/reports/generate', data),

  scheduleReport: (data: any) =>
    api.post<any>('/reports/schedule', data),

  getScheduledReports: (status?: string) =>
    api.get<any[]>('/reports/scheduled', status ? { status } : undefined),

  toggleScheduledStatus: (id: number, status: 'active' | 'paused') =>
    api.patch<any>(`/reports/scheduled/${id}/status`, { status }),

  getEmissionsData: (year?: string) =>
    api.get<any>('/reports/emissions', year ? { year } : undefined),

  getEnterpriseStats: () =>
    api.get<any>('/analytics/enterprise-stats'),

  getExecutiveKPIs: () =>
    api.get<ExecutiveKPIs>('/analytics/executive-kpis'),

  getLeadingIndicatorsArray: (period: string = 'month') =>
    api.get<LeadingIndicatorItem[]>('/analytics/leading-indicators', { period }),

  getLaggingIndicators: (period: string = 'month') =>
    api.get<LaggingIndicatorItem[]>('/analytics/lagging-indicators', { period }),

  getSiteScorecard: () =>
    api.get<SiteScoreItem[]>('/analytics/site-scorecard'),

  getMonthlyTrend: (months: number = 6) =>
    api.get<MonthlyTrendItem[]>('/analytics/monthly-trend', { months }),

  exportData: (data: { table: string; format?: string; from?: string; to?: string }) =>
    api.post<any>('/reports/export', data),
};

// ============================================
// Compliance Reporting API Service
// ============================================

export interface ComplianceReportRecord {
  id: string;
  name: string;
  type: 'regulatory' | 'internal' | 'audit' | 'incident' | 'training' | 'environmental' | 'safety';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'on_demand';
  lastGenerated: string;
  nextDue: string;
  status: 'current' | 'due_soon' | 'overdue' | 'draft';
  recipients: string[];
  format: string;
  automationEnabled: boolean;
  description: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface ComplianceMetricRecord {
  id: string;
  name: string;
  category: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  status: 'compliant' | 'at_risk' | 'non_compliant';
  lastUpdated: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface RegulatoryRequirementRecord {
  id: string;
  regulation: string;
  requirement: string;
  agency: string;
  frequency: string;
  dueDate: string;
  status: 'compliant' | 'in_progress' | 'non_compliant' | 'upcoming';
  assignedTo: string;
  evidence: string[];
  lastReview: string;
  standardId: string;
  clauseId: string;
  description: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface ComplianceReportingStats {
  total: number;
  current: number;
  dueSoon: number;
  overdue: number;
  automated: number;
  complianceRate: number;
  upcomingRequirements: number;
}

export const complianceReportingService = {
  getStats: () =>
    api.get<ComplianceReportingStats>('/compliance/reporting/stats'),

  getReports: (params?: { type?: string; status?: string }) =>
    api.get<ComplianceReportRecord[]>('/compliance/reporting/reports', params as any),

  createReport: (data: Partial<ComplianceReportRecord>) =>
    api.post<ComplianceReportRecord>('/compliance/reporting/reports', data),

  getReport: (id: string | number) =>
    api.get<ComplianceReportRecord>(`/compliance/reporting/reports/${id}`),

  updateReport: (id: string | number, data: Partial<ComplianceReportRecord>) =>
    api.put<ComplianceReportRecord>(`/compliance/reporting/reports/${id}`, data),

  deleteReport: (id: string | number) =>
    api.delete<{ message: string }>(`/compliance/reporting/reports/${id}`),

  getMetrics: (params?: { category?: string; status?: string }) =>
    api.get<ComplianceMetricRecord[]>('/compliance/reporting/metrics', params as any),

  updateMetric: (id: string | number, data: Partial<ComplianceMetricRecord>) =>
    api.put<ComplianceMetricRecord>(`/compliance/reporting/metrics/${id}`, data),

  getRequirements: (params?: { status?: string }) =>
    api.get<RegulatoryRequirementRecord[]>('/compliance/reporting/requirements', params as any),

  updateRequirement: (id: string | number, data: Partial<RegulatoryRequirementRecord>) =>
    api.put<RegulatoryRequirementRecord>(`/compliance/reporting/requirements/${id}`, data),
};

// ============================================
// Notification API Service (NEW)
// ============================================

export interface BackendNotification {
  id: number; userId?: string; notificationType: string; title: string;
  message: string; severity: 'info' | 'warning' | 'critical' | 'success';
  isRead: boolean; actionUrl?: string; metadata?: any; createdAt: number;
}
export interface NotificationPreferences {
  userId: string; emailNotifications?: boolean; smsNotifications?: boolean;
  inAppNotifications?: boolean; preferences?: Record<string, boolean | string | number>;
  quietHours?: { start: string; end: string }; frequency?: string;
}

export const notificationApiService = {
  getAll: (params?: { userId?: string; type?: string; severity?: string; read?: boolean; limit?: number }) =>
    api.get<BackendNotification[]>('/notifications', params as any),

  getAlerts: (params?: { userId?: string; severity?: string }) =>
    api.get<BackendNotification[]>('/notifications/alerts', params as any),

  getSettings: (userId?: string) =>
    api.get<{ preferences: NotificationPreferences; templates: any[] }>('/notifications/settings', userId ? { userId } : undefined),

  updateSettings: (data: NotificationPreferences) =>
    api.put<void>('/notifications/settings', data),

  markRead: (ids: number[]) =>
    api.post<{ updated: number }>('/notifications/mark-read', { ids }),

  markAllRead: (userId?: string) =>
    api.post<{ updated: number }>('/notifications/mark-read', { all: true, userId }),

  broadcast: (data: { title: string; message: string; type?: string; severity?: string; department?: string; actionUrl?: string }) =>
    api.post<{ recipientCount: number }>('/notifications/broadcast', data),

  delete: (id: number) =>
    api.delete<void>(`/notifications/${id}`),

  sendEmail: (data: { to: string | string[]; subject: string; htmlBody: string }) =>
    api.post<{ message: string; resendId?: string }>('/public/notifications/send-email', data),
};

// ============================================
// Certifications API Service (NEW)
// ============================================

export interface CertificationRecord {
  id: number; certificationCode: string; name: string; issuingBody: string;
  certificationDate?: string; expiryDate?: string; status: string;
  employeeId?: string; employeeName?: string; department?: string;
  standard?: string; auditFrequency?: string; notes?: string;
  createdAt?: number;
}

export const certificationApiService = {
  getAll: (params?: { status?: string; department?: string; employeeId?: string }) =>
    api.get<CertificationRecord[]>('/certifications', params as any),

  getById: (id: number) =>
    api.get<CertificationRecord>(`/certifications/${id}`),

  create: (data: Partial<CertificationRecord>) =>
    api.post<CertificationRecord>('/certifications', data),

  update: (id: number, data: Partial<CertificationRecord>) =>
    api.put<CertificationRecord>(`/certifications/${id}`, data),

  delete: (id: number) =>
    api.delete<void>(`/certifications/${id}`),

  getExpiring: (days?: number) =>
    api.get<CertificationRecord[]>('/certifications/expiring', days ? { days } : undefined),
};

// ============================================
// Standard Certifications API Service
// (ISO / regulatory org-level certifications for CertificationTracker page)
// ============================================

export interface ClauseScore { clauseId: string; score: number; notes: string; }
export interface NonConformity { id: string; type: 'major' | 'minor'; description: string; status: 'open' | 'closed'; }
export interface AuditHistoryEntry { date: string; type: string; result: string; auditor: string; }
export type StandardCertStatus = 'not_certified' | 'in_audit' | 'certified' | 'expired' | 'suspended';

export interface StandardCertApiRecord {
  id: string;
  standardId: string;
  standardCode: string;
  standardTitle: string;
  status: StandardCertStatus;
  certificationBody?: string;
  certificateNumber?: string;
  initialCertDate?: string;
  expiryDate?: string;
  lastSurveillanceDate?: string;
  nextSurveillanceDate?: string;
  scope: string[];
  locations: string[];
  overallScore?: number;
  clauseScores: ClauseScore[];
  nonConformities: NonConformity[];
  auditHistory: AuditHistoryEntry[];
  createdAt?: number;
  updatedAt?: number;
}

export interface StandardCertStats {
  total: number;
  certified: number;
  inAudit: number;
  expired: number;
  suspended: number;
  notCertified: number;
  expiringSoon: number;
  avgScore: number;
  byStatus: { status: string; count: number }[];
}

export const standardCertApiService = {
  getStats: () =>
    api.get<StandardCertStats>('/standard-certifications/stats'),

  getAll: (params?: { status?: string; search?: string }) =>
    api.get<StandardCertApiRecord[]>('/standard-certifications', params as any),

  getById: (id: string | number) =>
    api.get<StandardCertApiRecord>(`/standard-certifications/${id}`),

  create: (data: Partial<StandardCertApiRecord>) =>
    api.post<StandardCertApiRecord>('/standard-certifications', data),

  update: (id: string | number, data: Partial<StandardCertApiRecord>) =>
    api.put<StandardCertApiRecord>(`/standard-certifications/${id}`, data),

  delete: (id: string | number) =>
    api.delete<void>(`/standard-certifications/${id}`),
};

// ============================================
// Custom Checklists API Service (ChecklistBuilder page)
// ============================================

export type CustomChecklistIndustry =
  | 'Manufacturing' | 'Construction' | 'Healthcare' | 'Oil & Gas'
  | 'Mining' | 'Utilities' | 'Transportation' | 'Warehousing' | 'Agriculture' | 'Retail';

export interface CustomChecklistItem {
  id: string;
  question: string;
  category: string;
  required: boolean;
  helpText?: string;
  regulatoryRef?: string;
  aiSuggestion?: string;
}

export interface CustomChecklistRecord {
  id: string;
  name: string;
  description: string;
  industry: CustomChecklistIndustry;
  categories: string[];
  items: CustomChecklistItem[];
  createdAt: number;
  updatedAt: number;
}

export const customChecklistsApiService = {
  getAll: (params?: { industry?: string; search?: string }) =>
    api.get<CustomChecklistRecord[]>('/custom-checklists', params as any),

  getById: (id: string | number) =>
    api.get<CustomChecklistRecord>(`/custom-checklists/${id}`),

  create: (data: Omit<CustomChecklistRecord, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<CustomChecklistRecord>('/custom-checklists', data),

  update: (id: string | number, data: Partial<Omit<CustomChecklistRecord, 'id' | 'createdAt' | 'updatedAt'>>) =>
    api.put<CustomChecklistRecord>(`/custom-checklists/${id}`, data),

  delete: (id: string | number) =>
    api.delete<void>(`/custom-checklists/${id}`),
};

// ============================================
// Chemicals API Service (NEW)
// ============================================

export interface ChemicalRecord {
  id: number;
  name: string;
  casNumber?: string;
  manufacturer?: string;
  storageLocation?: string;
  location?: string;              // alias for storageLocation
  hazardClass?: string;
  signalWord?: string;
  quantity?: number;
  unit?: string;
  expiryDate?: string;
  sdsUploadDate?: number;
  lastReviewed?: number;
  status?: string;
  notes?: string;
  hazards: string[];
  pictograms: string[];
  ghsClassification: string[];
  emergencyContact: string;
  createdAt?: number;
  updatedAt?: number;
}
export interface SDSRecord {
  id: number; chemicalId: number; version: string; issueDate: string;
  sections?: any; createdAt?: number;
}

export const chemicalsApiService = {
  getAll: (params?: { hazardClass?: string; location?: string; search?: string }) =>
    api.get<ChemicalRecord[]>('/chemicals', params as any),

  getById: (id: number) =>
    api.get<ChemicalRecord>(`/chemicals/${id}`),

  create: (data: Partial<ChemicalRecord>) =>
    api.post<ChemicalRecord>('/chemicals', data),

  update: (id: number, data: Partial<ChemicalRecord>) =>
    api.put<ChemicalRecord>(`/chemicals/${id}`, data),

  delete: (id: number) =>
    api.delete<void>(`/chemicals/${id}`),

  getSDS: (chemicalId: number) =>
    api.get<SDSRecord>(`/chemicals/${chemicalId}/sds`),

  createSDS: (chemicalId: number, data: Partial<SDSRecord>) =>
    api.post<SDSRecord>(`/chemicals/${chemicalId}/sds`, data),
};

// ============================================
// Project Management API Service (NEW)
// ============================================

export interface ProjectRecord {
  id: number; projectCode: string; title: string; description?: string;
  status: string; priority: string; projectType?: string; industry?: string;
  location?: string; department?: string; projectManager?: string;
  startDate?: string; targetEndDate?: string; actualEndDate?: string;
  budget?: number; actualCost?: number; safetyRating?: number;
  incidentCount?: number; createdAt?: number;
}
export interface ProjectTaskRecord {
  id: number; projectId: number; title: string; description?: string;
  status: string; priority: string; assignedTo?: string;
  dueDate?: string; completedDate?: string; safetyRequirements?: string[];
}

export interface TaskCommentRecord {
  id: number;
  taskId: number;
  projectId: number;
  author: string;
  content: string;
  createdAt: number;
  updatedAt?: number;
}

export const projectApiService = {
  getAll: (params?: { status?: string; department?: string; assignedTo?: string }) =>
    api.get<ProjectRecord[]>('/projects', params as any),

  getById: (id: number) =>
    api.get<ProjectRecord>(`/projects/${id}`),

  create: (data: Partial<ProjectRecord>) =>
    api.post<ProjectRecord>('/projects', data),

  update: (id: number, data: Partial<ProjectRecord>) =>
    api.put<ProjectRecord>(`/projects/${id}`, data),

  getTasks: (projectId: number) =>
    api.get<ProjectTaskRecord[]>(`/projects/${projectId}/tasks`),

  createTask: (projectId: number, data: Partial<ProjectTaskRecord>) =>
    api.post<ProjectTaskRecord>(`/projects/${projectId}/tasks`, data),

  updateTask: (projectId: number, taskId: number, data: Partial<ProjectTaskRecord>) =>
    api.put<ProjectTaskRecord>(`/projects/${projectId}/tasks/${taskId}`, data),

  getSchedule: (projectId: number) =>
    api.get<any>(`/projects/${projectId}/schedule`),

  safetyCheck: (projectId: number) =>
    api.post<any>(`/projects/${projectId}/safety-check`, {}),
};

export const taskCommentApiService = {
  getComments: (projectId: number, taskId: number) =>
    api.get<TaskCommentRecord[]>(`/projects/${projectId}/tasks/${taskId}/comments`),

  addComment: (projectId: number, taskId: number, data: { author: string; content: string }) =>
    api.post<TaskCommentRecord>(`/projects/${projectId}/tasks/${taskId}/comments`, data),
};

export interface VelocityHistoryRecord {
  id: number;
  projectId: number;
  sprintLabel: string;
  committed: number;
  completed: number;
  carryover: number;
  recordedAt?: number;
}

export const velocityHistoryApiService = {
  getAll: (projectId: number) =>
    api.get<VelocityHistoryRecord[]>(`/projects/${projectId}/velocity-history`),

  record: (projectId: number, data: Omit<VelocityHistoryRecord, 'id' | 'projectId' | 'recordedAt'>) =>
    api.post<VelocityHistoryRecord>(`/projects/${projectId}/velocity-history`, data),
};

// ============================================
// Sprint & Epic API Services
// ============================================

export interface SprintRecord {
  id: number;
  name: string;
  startDate?: string;
  endDate?: string;
  goal?: string;
  status: 'future' | 'active' | 'completed';
  projectId?: number;
  createdAt?: number;
}

export interface EpicRecord {
  id: number;
  key: string;
  name: string;
  summary?: string;
  color: string;
  status: string;
  projectId?: number;
  createdAt?: number;
}

export const sprintApiService = {
  getAll: (params?: { status?: string; projectId?: number }) =>
    api.get<SprintRecord[]>('/projects/sprints', params as any),

  create: (data: Partial<SprintRecord>) =>
    api.post<SprintRecord>('/projects/sprints', data),

  update: (id: number, data: Partial<SprintRecord>) =>
    api.put<SprintRecord>(`/projects/sprints/${id}`, data),

  delete: (id: number) =>
    api.delete<void>(`/projects/sprints/${id}`),
};

export const epicApiService = {
  getAll: (params?: { status?: string; projectId?: number }) =>
    api.get<EpicRecord[]>('/projects/epics', params as any),

  create: (data: Partial<EpicRecord> & { keyCode: string }) =>
    api.post<EpicRecord>('/projects/epics', data),

  update: (id: number, data: Partial<EpicRecord>) =>
    api.put<EpicRecord>(`/projects/epics/${id}`, data),
};

// ============================================
// Sprint Settings API Service
// ============================================

export interface SprintSettingsRecord {
  id?: number;
  projectId?: number;
  defaultDuration: number;
  workingDays: string[];
  sprintStartDay: string;
  velocityTarget: number;
  maxCapacity: number;
  bufferPercentage: number;
  autoStartEnabled: boolean;
  notifications: {
    sprintStart: boolean;
    sprintEnd: boolean;
    capacityWarning: boolean;
    dailyStandup: boolean;
  };
  createdAt?: number;
  updatedAt?: number;
}

export const sprintSettingsApiService = {
  get: (projectId?: number) =>
    api.get<SprintSettingsRecord>('/projects/sprint-settings', projectId !== undefined ? { projectId } as any : undefined),

  save: (data: Partial<SprintSettingsRecord>) =>
    api.put<SprintSettingsRecord>('/projects/sprint-settings', data),
};

// ============================================
// Retrospective API Service
// ============================================

export interface RetroItemRecord {
  id: number;
  retroId: number;
  category: 'went_well' | 'needs_improvement' | 'action_items';
  content: string;
  author: string;
  votes: number;
  isActionable: boolean;
  assignee?: string;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt?: number;
  updatedAt?: number;
}

export interface RetroRecord {
  id: number;
  sprintId: string;
  facilitator: string;
  date: string;
  participants: string[];
  summary: string;
  teamSentiment: { happy: number; neutral: number; sad: number };
  items: RetroItemRecord[];
  createdAt?: number;
  updatedAt?: number;
}

export const retroApiService = {
  getBySprintId: (sprintId: string) =>
    api.get<RetroRecord>(`/projects/retrospectives/${sprintId}`),

  voteSentiment: (sprintId: string, sentiment: 'happy' | 'neutral' | 'sad') =>
    api.post<RetroRecord>(`/projects/retrospectives/${sprintId}/sentiment`, { sentiment }),

  addItem: (sprintId: string, data: Omit<RetroItemRecord, 'id' | 'retroId' | 'createdAt' | 'updatedAt'>) =>
    api.post<RetroItemRecord>(`/projects/retrospectives/${sprintId}/items`, data),

  voteItem: (itemId: number) =>
    api.post<RetroItemRecord>(`/projects/retro-items/${itemId}/vote`, {}),

  updateItem: (id: number, data: Partial<Pick<RetroItemRecord, 'status' | 'votes' | 'content' | 'assignee' | 'dueDate'>>) =>
    api.patch<RetroItemRecord>(`/projects/retro-items/${id}`, data),

  deleteItem: (id: number) =>
    api.delete<void>(`/projects/retro-items/${id}`),
};

// ============================================
// Charter API Service
// ============================================

export interface CharterRecord {
  id: number;
  name: string;
  vision: string;
  mission: string;
  budget: string;
  sponsor: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface CharterStakeholderRecord {
  id: number;
  charterId: number;
  name: string;
  role: string;
  influence: 'High' | 'Medium' | 'Low';
  interest: 'High' | 'Medium' | 'Low';
  createdAt?: number;
}

export interface CharterGoalRecord {
  id: number;
  charterId: number;
  description: string;
  metric: string;
  priority: 'High' | 'Medium' | 'Low';
  createdAt?: number;
}

export interface CharterDetailRecord extends CharterRecord {
  stakeholders: CharterStakeholderRecord[];
  goals: CharterGoalRecord[];
}

export const charterApiService = {
  getAll: () =>
    api.get<CharterRecord[]>('/charters'),

  getById: (id: number) =>
    api.get<CharterDetailRecord>(`/charters/${id}`),

  update: (id: number, data: Partial<CharterRecord>) =>
    api.patch<CharterRecord>(`/charters/${id}`, data),

  addStakeholder: (charterId: number, data: Omit<CharterStakeholderRecord, 'id' | 'charterId' | 'createdAt'>) =>
    api.post<CharterStakeholderRecord>(`/charters/${charterId}/stakeholders`, data),

  deleteStakeholder: (charterId: number, stakeholderId: number) =>
    api.delete<void>(`/charters/${charterId}/stakeholders/${stakeholderId}`),

  addGoal: (charterId: number, data: Omit<CharterGoalRecord, 'id' | 'charterId' | 'createdAt'>) =>
    api.post<CharterGoalRecord>(`/charters/${charterId}/goals`, data),

  deleteGoal: (charterId: number, goalId: number) =>
    api.delete<void>(`/charters/${charterId}/goals/${goalId}`),
};

// ============================================
// Project Closure API Service
// ============================================

export interface ClosureRecord {
  id: number;
  name: string;
  projectId?: string | null;
  status: 'In Progress' | 'Archived';
  archivedAt?: number | null;
  reportGeneratedAt?: number | null;
  createdAt?: number;
  updatedAt?: number;
}

// ============================================
// Milestone & RFI API Services
// ============================================

export interface MilestoneRecord {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  projectId?: number;
  owner: string;
  taskIds: string[];
  createdAt?: number;
  updatedAt?: number;
}

export interface RFIRecord {
  id: string;
  rfiNumber: string;
  subject: string;
  from: string;
  to: string;
  dateSubmitted: string;
  dueDate: string;
  status: 'Open' | 'Closed' | 'Overdue';
  projectId?: number;
  response: string;
  createdAt?: number;
  updatedAt?: number;
}

export const milestoneApiService = {
  getAll: (params?: { status?: string; projectId?: number }) =>
    api.get<MilestoneRecord[]>('/projects/milestones', params as any),

  create: (data: Partial<MilestoneRecord>) =>
    api.post<MilestoneRecord>('/projects/milestones', data),

  update: (id: string, data: Partial<MilestoneRecord>) =>
    api.put<MilestoneRecord>(`/projects/milestones/${id}`, data),
};

export const rfiApiService = {
  getAll: (params?: { status?: string; projectId?: number }) =>
    api.get<RFIRecord[]>('/projects/rfi', params as any),

  create: (data: Partial<RFIRecord>) =>
    api.post<RFIRecord>('/projects/rfi', data),

  update: (id: string, data: Partial<RFIRecord>) =>
    api.put<RFIRecord>(`/projects/rfi/${id}`, data),
};

export interface ClosureDeliverableRecord {
  id: number;
  closureId: number;
  name: string;
  status: 'Accepted' | 'Pending' | 'Rejected';
  approver: string;
  date: string;
  createdAt?: number;
}

export interface ClosureLessonRecord {
  id: number;
  closureId: number;
  category: 'Process' | 'Technology' | 'People' | 'Product';
  description: string;
  impact: 'Positive' | 'Negative';
  recommendation: string;
  createdAt?: number;
}

export interface ClosureDetailRecord extends ClosureRecord {
  deliverables: ClosureDeliverableRecord[];
  lessons: ClosureLessonRecord[];
}

export interface ClosureReportRecord {
  closure: ClosureRecord;
  summary: {
    totalDeliverables: number;
    accepted: number;
    pending: number;
    rejected: number;
    acceptanceRate: number;
    totalLessons: number;
    positiveLessons: number;
    negativeLessons: number;
  };
  deliverables: ClosureDeliverableRecord[];
  lessons: ClosureLessonRecord[];
  generatedAt: number;
}

export const closureApiService = {
  getAll: () =>
    api.get<ClosureRecord[]>('/closures'),

  getById: (id: number) =>
    api.get<ClosureDetailRecord>(`/closures/${id}`),

  addDeliverable: (closureId: number, data: Omit<ClosureDeliverableRecord, 'id' | 'closureId' | 'createdAt'>) =>
    api.post<ClosureDeliverableRecord>(`/closures/${closureId}/deliverables`, data),

  updateDeliverable: (
    closureId: number,
    deliverableId: number,
    data: Partial<Pick<ClosureDeliverableRecord, 'status' | 'approver' | 'date'>>
  ) => api.patch<ClosureDeliverableRecord>(`/closures/${closureId}/deliverables/${deliverableId}`, data),

  deleteDeliverable: (closureId: number, deliverableId: number) =>
    api.delete<void>(`/closures/${closureId}/deliverables/${deliverableId}`),

  addLesson: (closureId: number, data: Omit<ClosureLessonRecord, 'id' | 'closureId' | 'createdAt'>) =>
    api.post<ClosureLessonRecord>(`/closures/${closureId}/lessons`, data),

  deleteLesson: (closureId: number, lessonId: number) =>
    api.delete<void>(`/closures/${closureId}/lessons/${lessonId}`),

  archive: (closureId: number) =>
    api.post<ClosureRecord>(`/closures/${closureId}/archive`, {}),

  generateReport: (closureId: number) =>
    api.post<ClosureReportRecord>(`/closures/${closureId}/report`, {}),
};

// ============================================
// Workers API Service (NEW)
// ============================================

export interface WorkerRecord {
  id: number; employeeId: string; name: string; email?: string;
  phone?: string; department?: string; role: string; jobTitle?: string;
  managerId?: number; hireDate?: string; status: string;
  lastTrainingDate?: string; certifications?: string[]; createdAt?: number;
}

export const workersApiService = {
  getAll: (params?: { department?: string; role?: string; status?: string }) =>
    api.get<WorkerRecord[]>('/workers', params as any),

  getById: (userId: number) =>
    api.get<WorkerRecord>(`/workers/${userId}`),

  create: (data: Partial<WorkerRecord>) =>
    api.post<WorkerRecord>('/workers', data),

  update: (userId: number, data: Partial<WorkerRecord>) =>
    api.put<WorkerRecord>(`/workers/${userId}`, data),

  getAssignments: (userId: number) =>
    api.get<any[]>(`/workers/${userId}/assignments`),

  getTrainings: (userId: number) =>
    api.get<any[]>(`/workers/${userId}/trainings`),

  getCertifications: (userId: number) =>
    api.get<any[]>(`/workers/${userId}/certifications`),

  getPerformance: (userId: number) =>
    api.get<any>(`/workers/${userId}/performance`),

  submitFeedback: (userId: number, data: { content: string; category?: string; anonymous?: boolean }) =>
    api.post<any>(`/workers/${userId}/feedback`, data),
};

// ============================================
// Contractor API Service (NEW)
// ============================================

export interface ContractorRecord {
  id: number;
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  tradeType?: string;
  insuranceExpiry?: string;
  safetyRating?: number;
  workersCount?: number;
  activePermits?: number;
  status: string;
  certifications?: string[];
  lastSafetyAudit?: string;
  incidentHistory?: number;
  // legacy / backward-compat
  contractorCode?: string; contactName?: string; serviceType?: string;
  insuredUntil?: string; qualificationStatus?: string; notes?: string; createdAt?: number;
}

export const contractorApiService = {
  getAll: (params?: { status?: string; serviceType?: string; tradeType?: string }) =>
    api.get<ContractorRecord[]>('/contractors', params as any),

  getById: (id: number) =>
    api.get<ContractorRecord>(`/contractors/${id}`),

  create: (data: Partial<ContractorRecord>) =>
    api.post<ContractorRecord>('/contractors', data),

  update: (id: number, data: Partial<ContractorRecord>) =>
    api.put<ContractorRecord>(`/contractors/${id}`, data),

  getPermits: (contractorId: number, params?: { status?: string }) =>
    api.get<any[]>(`/contractors/${contractorId}/permits`, params as any),

  createPermit: (contractorId: number, data: any) =>
    api.post<any>(`/contractors/${contractorId}/permits`, data),
};

// ============================================
// Contractor Permit Applications Service
// ============================================

export interface ApprovalStepRecord {
  id: string;
  role: string;
  approverName: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  timestamp?: string;
  comments?: string;
}

export interface SafetyChecklistItemRecord {
  id: string;
  question: string;
  response: boolean | null;
  required: boolean;
  category: string;
}

export interface PermitApplicationRecord {
  id: string;
  permitNumber: string;
  contractorId: string;
  contractorName: string;
  permitType: 'hot_work' | 'confined_space' | 'working_at_height' | 'excavation' | 'electrical' | 'lifting' | 'general';
  workDescription: string;
  location: string;
  startDate: string;
  endDate: string;
  workersAssigned: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'active' | 'completed' | 'expired' | 'suspended';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvalChain: ApprovalStepRecord[];
  attachments: string[];
  safetyChecklist: SafetyChecklistItemRecord[];
  specialConditions: string[];
}

export interface PermitApplicationStats {
  total: number;
  active: number;
  pending: number;
  rejected: number;
  completed: number;
  draft: number;
  totalContractors: number;
  activeContractors: number;
}

export const permitAppsService = {
  getStats: () =>
    api.get<PermitApplicationStats>('/permit-apps/stats'),

  getAll: (params?: { status?: string; type?: string; contractorId?: string; search?: string }) =>
    api.get<PermitApplicationRecord[]>('/permit-apps', params as any),

  getById: (id: number | string) =>
    api.get<PermitApplicationRecord>(`/permit-apps/${id}`),

  create: (data: Partial<PermitApplicationRecord>) =>
    api.post<PermitApplicationRecord>('/permit-apps', data),

  update: (id: number | string, data: Partial<PermitApplicationRecord>) =>
    api.put<PermitApplicationRecord>(`/permit-apps/${id}`, data),

  delete: (id: number | string) =>
    api.delete<void>(`/permit-apps/${id}`),

  approve: (id: number | string, data: { approverName?: string; approverRole?: string; comments?: string }) =>
    api.post<PermitApplicationRecord>(`/permit-apps/${id}/approve`, data),

  reject: (id: number | string, data: { approverName?: string; approverRole?: string; comments?: string }) =>
    api.post<PermitApplicationRecord>(`/permit-apps/${id}/reject`, data),
};

// ============================================
// KPI API Service (NEW)
// ============================================

export interface KPIDefinition {
  id: number; kpiCode: string; name: string; description?: string;
  category: string; unit: string; targetValue?: number;
  warningThreshold?: number; criticalThreshold?: number;
  calculationMethod?: string; frequency: string; isActive: boolean;
}
export interface KPIReading {
  id: number; kpiCode: string; value: number; reportingPeriod: string;
  recordedBy?: string; notes?: string; trendDirection?: string; createdAt?: number;
}

export const kpiApiService = {
  getDefinitions: (params?: { category?: string; active?: boolean }) =>
    api.get<KPIDefinition[]>('/kpi/definitions', params as any),

  createDefinition: (data: Partial<KPIDefinition>) =>
    api.post<KPIDefinition>('/kpi/definitions', data),

  getReadings: (params?: { kpiCode?: string; from?: string; to?: string }) =>
    api.get<KPIReading[]>('/kpi/readings', params as any),

  createReading: (data: Partial<KPIReading>) =>
    api.post<KPIReading>('/kpi/readings', data),

  getStats: () =>
    api.get<any>('/kpi/stats'),

  getDashboard: () =>
    api.get<any>('/kpi/dashboard'),

  getDepartmentComparison: () =>
    api.get<{ dept: string; leading: number; lagging: number }[]>('/kpi/department-comparison'),

  getIncidentBreakdown: () =>
    api.get<{ name: string; value: number; color: string }[]>('/kpi/incident-breakdown'),
};

// ============================================
// Regulations API Service (NEW)
// ============================================

export interface RegulationRecord {
  id: number; regulationCode: string; title: string; description?: string;
  authority: string; jurisdiction: string; effectiveDate?: string;
  expiryDate?: string; industry?: string[]; category?: string;
  applicableOperations?: string[]; penaltyRange?: string;
  documentationRequired?: string; status: string; createdAt?: number;
}

export const regulationsApiService = {
  getAll: (params?: { jurisdiction?: string; industry?: string; status?: string; search?: string }) =>
    api.get<RegulationRecord[]>('/regulations', params as any),

  getById: (id: number) =>
    api.get<RegulationRecord>(`/regulations/${id}`),

  create: (data: Partial<RegulationRecord>) =>
    api.post<RegulationRecord>('/regulations', data),

  update: (id: number, data: Partial<RegulationRecord>) =>
    api.put<RegulationRecord>(`/regulations/${id}`, data),

  delete: (id: number) =>
    api.delete<void>(`/regulations/${id}`),
};

// ============================================
// Standards API Service (NEW)
// ============================================

export interface StandardRecord {
  id: number; standardCode: string; title: string; description?: string;
  issuingBody: string; edition?: string; publicationDate?: string;
  category?: string; scope?: string; applicableIndustries?: string[];
  keyRequirements?: string[]; status: string; createdAt?: number;
}

export const standardsApiService = {
  getAll: (params?: { issuingBody?: string; category?: string; status?: string; search?: string }) =>
    api.get<StandardRecord[]>('/standards/international', params as any),

  getById: (id: number) =>
    api.get<StandardRecord>(`/standards/international/${id}`),

  create: (data: Partial<StandardRecord>) =>
    api.post<StandardRecord>('/standards/international', data),

  update: (id: number, data: Partial<StandardRecord>) =>
    api.put<StandardRecord>(`/standards/international/${id}`, data),

  delete: (id: number) =>
    api.delete<void>(`/standards/international/${id}`),

  getNFPACodes: (params?: { codeNumber?: string; topic?: string; search?: string }) =>
    api.get<any[]>('/nfpa/codes', params as any),

  createNFPACode: (data: any) =>
    api.post<any>('/nfpa/codes', data),
};

// ============================================
// Cross-Reference Matrix API Service (NEW)
// ============================================

export interface StandardRelationshipRecord {
  id: number;
  sourceStandardId: string;
  targetStandardId: string;
  relationshipType: 'compatible' | 'integrated' | 'prerequisite' | 'complementary' | 'overlapping';
  mappedClauses: { sourceClauses: string[]; targetClauses: string[]; description: string }[];
  integrationNotes: string;
  synergies: string[];
  createdAt?: number;
  updatedAt?: number;
}

export interface StandardRelationshipStats {
  total: number;
  byType: Record<string, number>;
  uniqueStandards: number;
}

export const crossReferenceApiService = {
  getStats: () =>
    api.get<StandardRelationshipStats>('/cross-reference/stats'),

  getAll: (params?: { type?: string; sourceId?: string; targetId?: string; search?: string }) =>
    api.get<StandardRelationshipRecord[]>('/cross-reference/relationships', params as any),

  getById: (id: number) =>
    api.get<StandardRelationshipRecord>(`/cross-reference/relationships/${id}`),

  create: (data: Partial<StandardRelationshipRecord>) =>
    api.post<StandardRelationshipRecord>('/cross-reference/relationships', data),

  update: (id: number, data: Partial<StandardRelationshipRecord>) =>
    api.put<StandardRelationshipRecord>(`/cross-reference/relationships/${id}`, data),

  delete: (id: number) =>
    api.delete<void>(`/cross-reference/relationships/${id}`),
};

// ============================================
// Toolbox Talks API Service (NEW)
// ============================================

export interface ToolboxTalkRecord {
  id: number; talkCode: string; topic: string; content?: string;
  category?: string; duration?: number; conductedBy?: string;
  conductedDate?: string; department?: string; location?: string;
  attendeeCount?: number; status: string; createdAt?: number;
}

export const toolboxApiService = {
  getAll: (params?: { category?: string; department?: string; status?: string }) =>
    api.get<ToolboxTalkRecord[]>('/toolbox-talks', params as any),

  getById: (id: number) =>
    api.get<ToolboxTalkRecord>(`/toolbox-talks/${id}`),

  create: (data: Partial<ToolboxTalkRecord>) =>
    api.post<ToolboxTalkRecord>('/toolbox-talks', data),

  attend: (id: number, data: { attendeeName: string; employeeId?: string; signature?: string }) =>
    api.post<any>(`/toolbox-talks/${id}/attend`, data),
};

// ============================================
// Behavior-Based Safety API Service (NEW)
// ============================================

export interface BBSObservation {
  id: number; observationCode: string; observerName: string; observerRole?: string;
  department: string; workArea: string; observationDate: string;
  observationType: 'safe' | 'at-risk'; category: string;
  behaviorObserved: string; feedback?: string; actionTaken?: string;
  acknowledged?: boolean; followUpRequired?: boolean; status: string;
  createdAt?: number;
}
export interface SIFPrecursor {
  id: number; precursorCode: string; description: string; location: string;
  department?: string; reportedBy: string; reportedDate: string;
  severity: string; energyType?: string; controlFailures?: string[];
  immediateAction?: string; status: string; createdAt?: number;
}

export const behaviorSafetyApiService = {
  getObservations: (params?: { department?: string; type?: string; status?: string; from?: string; to?: string }) =>
    api.get<BBSObservation[]>('/bbs/observations', params as any),

  createObservation: (data: Partial<BBSObservation>) =>
    api.post<BBSObservation>('/bbs/observations', data),

  getSIFPrecursors: (params?: { department?: string; severity?: string; status?: string }) =>
    api.get<SIFPrecursor[]>('/sif/precursors', params as any),

  createSIFPrecursor: (data: Partial<SIFPrecursor>) =>
    api.post<SIFPrecursor>('/sif/precursors', data),
};

// ============================================
// Hygiene API Service
// ============================================

export interface HygieneAssessment {
  id: number;
  title: string;
  hazardType: string;            // chemical|physical|biological|ergonomic|noise|radiation
  location: string;
  department?: string;
  exposureLevel?: string;        // low|medium|high|extreme
  controlMeasures?: string[];
  assessedBy?: string;
  assessedAt?: number;
  nextReviewDate?: string;
  status: string;                // active|resolved|requires-action
  createdAt?: number;
}

export interface HygieneSamplingPlan {
  id: number;
  title: string;
  agent: string;
  method: string;
  frequency: string;
  status: string;                // scheduled|in_progress|completed|overdue
  assignee?: string;
  dueDate?: string;
  notes?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface HygieneStats {
  total: number;
  byStatus: Array<{ status: string; c: number }>;
  byHazard: Array<{ hazard_type: string; c: number }>;
  byExposure: Array<{ exposure_level: string; c: number }>;
  overduePlans: number;
  totalPlans: number;
}

export const hygieneApiService = {
  getAssessments: (params?: { hazardType?: string; department?: string; status?: string; limit?: number }) =>
    api.get<HygieneAssessment[]>('/hygiene/assessments', params as any),
  getAssessmentById: (id: number) =>
    api.get<HygieneAssessment>(`/hygiene/assessments/${id}`),
  createAssessment: (data: Partial<HygieneAssessment>) =>
    api.post<HygieneAssessment>('/hygiene/assessment', data),
  updateAssessment: (id: number, data: Partial<HygieneAssessment>) =>
    api.put<HygieneAssessment>(`/hygiene/assessments/${id}`, data),
  deleteAssessment: (id: number) =>
    api.delete<{ message: string }>(`/hygiene/assessments/${id}`),
  patchAssessmentStatus: (id: number, status: string) =>
    api.patch<HygieneAssessment>(`/hygiene/assessments/${id}/status`, { status }),
  getMonitoring: () =>
    api.get<any>('/hygiene/monitoring'),
  getStats: () =>
    api.get<HygieneStats>('/hygiene/stats'),

  getSamplingPlans: (params?: { status?: string; agent?: string }) =>
    api.get<HygieneSamplingPlan[]>('/hygiene/sampling-plans', params as any),
  getSamplingPlanById: (id: number) =>
    api.get<HygieneSamplingPlan>(`/hygiene/sampling-plans/${id}`),
  createSamplingPlan: (data: Partial<HygieneSamplingPlan>) =>
    api.post<HygieneSamplingPlan>('/hygiene/sampling-plans', data),
  updateSamplingPlan: (id: number, data: Partial<HygieneSamplingPlan>) =>
    api.put<HygieneSamplingPlan>(`/hygiene/sampling-plans/${id}`, data),
  deleteSamplingPlan: (id: number) =>
    api.delete<{ message: string }>(`/hygiene/sampling-plans/${id}`),
  patchSamplingPlanStatus: (id: number, status: string) =>
    api.patch<HygieneSamplingPlan>(`/hygiene/sampling-plans/${id}/status`, { status }),
};

// ============================================
// Quality Management API Service (NEW)
// ============================================

export interface QualityNonConformity {
  id: number; ncCode: string; title: string; description: string;
  department?: string; processArea?: string; detectedBy?: string;
  detectionDate?: string; severity: string; rootCause?: string;
  correctiveAction?: string; preventiveAction?: string;
  closedDate?: string; status: string; createdAt?: number;
}

export const qualityApiService = {
  getMetrics: () =>
    api.get<any>('/quality/metrics'),

  getNonConformities: (params?: { department?: string; severity?: string; status?: string }) =>
    api.get<QualityNonConformity[]>('/quality/non-conformities', params as any),

  createNonConformity: (data: Partial<QualityNonConformity>) =>
    api.post<QualityNonConformity>('/quality/non-conformity', data),
};

// ============================================
// Supervisor API Service (NEW)
// ============================================

export interface SupervisorApproval {
  id: number; approvalType: string; requestedBy?: string; assignedTo?: string;
  title: string; description?: string; priority: string;
  status: 'pending' | 'approved' | 'rejected'; dueDate?: string;
  approvedBy?: string; approvalNotes?: string; relatedId?: number;
  relatedTable?: string; createdAt?: number;
}
export interface LeaderboardEntry {
  id: number; userId?: string; employeeName: string; department?: string;
  safetyScore: number; incidentsReported: number; nearMissesReported: number;
  trainingsCompleted: number; auditParticipation: number;
  recognitionBadges?: string[]; rank?: number; period?: string;
}

export const supervisorApiService = {
  getApprovals: (params?: { status?: string; assignedTo?: string; type?: string }) =>
    api.get<SupervisorApproval[]>('/supervisor/approvals', params as any),

  createApproval: (data: Partial<SupervisorApproval>) =>
    api.post<SupervisorApproval>('/supervisor/approvals', data),

  approveRequest: (id: number, data: { approvedBy: string; notes?: string }) =>
    api.post<SupervisorApproval>(`/supervisor/approvals/${id}/approve`, data),

  rejectRequest: (id: number, data: { approvedBy: string; notes?: string }) =>
    api.post<SupervisorApproval>(`/supervisor/approvals/${id}/reject`, data),

  getLeaderboard: (params?: { department?: string; period?: string; limit?: number }) =>
    api.get<LeaderboardEntry[]>('/supervisor/leaderboard', params as any),

  getTeamMetrics: (params?: { department?: string }) =>
    api.get<any>('/supervisor/team-metrics', params as any),

  createDelegation: (data: any) =>
    api.post<any>('/supervisor/delegation', data),
};

// ============================================
// Assets API Service (NEW)
// ============================================

export interface AssetRecord {
  id: number; assetCode: string; assetName: string; assetType: string;
  serialNumber?: string; qrCode?: string; location?: string;
  department?: string; manufacturer?: string; model?: string;
  purchaseDate?: string; lastMaintenanceDate?: string;
  nextMaintenanceDue?: string; condition?: string; status: string;
  owner?: string; notes?: string; createdAt?: number; updatedAt?: number;
  maintenanceHistory?: any[]; lastMaintenanceRecord?: any;
}

export const assetsApiService = {
  getAll: (params?: { category?: string; status?: string; department?: string }) =>
    api.get<AssetRecord[]>('/assets', params as any),

  getById: (assetId: number) =>
    api.get<AssetRecord>(`/assets/${assetId}`),

  scanQR: (qrCode: string) =>
    api.get<AssetRecord>(`/assets/scan/${encodeURIComponent(qrCode)}`),

  create: (data: Partial<AssetRecord>) =>
    api.post<AssetRecord>('/assets', data),

  update: (assetId: number, data: Partial<AssetRecord>) =>
    api.put<AssetRecord>(`/assets/${assetId}`, data),

  delete: (assetId: number) =>
    api.delete<void>(`/assets/${assetId}`),

  getMaintenanceHistory: (assetId: number) =>
    api.get<any[]>(`/assets/${assetId}/maintenance`),

  scheduleMaintenace: (assetId: number, data: any) =>
    api.post<any>(`/assets/${assetId}/maintenance`, data),
};

// ============================================
// Safety Procedures API Service (NEW)
// ============================================

export interface SafetyProcedureRecord {
  id: number; procedureCode: string; title: string; description?: string;
  category: string; department?: string; version: string;
  effectiveDate?: string; reviewDate?: string; approvedBy?: string;
  steps?: string[]; hazards?: string[]; ppe?: string[];
  regulations?: string[]; status: string; createdAt?: number;
}

export const safetyProceduresApiService = {
  getAll: (params?: { category?: string; department?: string; status?: string; search?: string }) =>
    api.get<SafetyProcedureRecord[]>('/safety-procedures', params as any),

  getById: (id: number) =>
    api.get<SafetyProcedureRecord>(`/safety-procedures/${id}`),

  create: (data: Partial<SafetyProcedureRecord>) =>
    api.post<SafetyProcedureRecord>('/safety-procedures', data),

  update: (id: number, data: Partial<SafetyProcedureRecord>) =>
    api.put<SafetyProcedureRecord>(`/safety-procedures/${id}`, data),

  delete: (id: number) =>
    api.delete<void>(`/safety-procedures/${id}`),
};

// ============================================
// Compliance Procedures API Service (NEW)
// ============================================

export interface ComplianceProcedureRecord {
  id: number;
  name: string;
  title: string;           // alias for name
  description?: string;
  scope?: string;          // alias for description
  category?: string;
  regulation?: string;
  industries: string[];
  isoClause?: string;
  steps: Array<{
    stepNumber: number;
    title: string;
    description: string;
    criticalControl: boolean;
  }>;
  version: string;
  status: string;
  owner?: string;
  approvedBy?: string;
  effectiveDate?: string;
  reviewDate?: string;
  lastUpdated?: string;
  document?: string;
  aiRisk: {
    score: number;
    level: string;
    rationale: string;
    lastAnalyzed: string;
    trending: 'improving' | 'stable' | 'worsening';
  };
  auditTrail: Array<{
    id: string;
    timestamp: string;
    action: string;
    user: string;
    details: string;
  }>;
  createdAt?: number;
  updatedAt?: number;
}

export interface GapAnalysisItemRecord {
  id: number;
  standardId: string;
  standard?: string;
  clauseId: string;
  clauseTitle: string;
  requirement: string;
  currentState: string;
  desiredState: string;
  gap: string;
  severity: 'critical' | 'major' | 'minor' | 'observation';
  impact: string;
  remediation: string;
  effort: 'low' | 'medium' | 'high';
  priority: number;
  owner?: string;
  targetDate?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
  notes?: string;
  riskLevel?: string;
  complianceRate?: number | null;
  evaluationDate?: string;
  evaluatedBy?: string;
  findings?: any[];
  actionItems?: any[];
  createdAt?: number;
  updatedAt?: number;
}

export interface ComplianceCalendarEventRecord {
  id: number;
  title: string;
  date: string;
  dueDate: string;
  type: 'audit' | 'certification' | 'inspection' | 'training' | 'regulatory' | 'renewal';
  eventType: string;
  status: 'upcoming' | 'overdue' | 'completed' | 'in-progress';
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  assignedTo: string;
  department?: string;
  description?: string;
  regulation?: string;
  relatedItem?: string;
  daysLeft?: number;
  completedAt?: number | null;
  createdAt?: number;
  updatedAt?: number;
}

export const complianceProceduresApiService = {
  getAll: (params?: { category?: string; status?: string; search?: string }) =>
    api.get<ComplianceProcedureRecord[]>('/compliance/procedures', params as any),

  getById: (id: number) =>
    api.get<ComplianceProcedureRecord>(`/compliance/procedures/${id}`),

  create: (data: Partial<ComplianceProcedureRecord> & { name: string }) =>
    api.post<ComplianceProcedureRecord>('/compliance/procedures', data),

  update: (id: number, data: Partial<ComplianceProcedureRecord>) =>
    api.put<ComplianceProcedureRecord>(`/compliance/procedures/${id}`, data),

  delete: (id: number) =>
    api.delete<void>(`/compliance/procedures/${id}`),

  getRequirements: (params?: { status?: string; standard?: string }) =>
    api.get<any[]>('/compliance/requirements', params as any),

  createRequirement: (data: any) =>
    api.post<any>('/compliance/requirements', data),

  updateRequirement: (id: number, data: any) =>
    api.put<any>(`/compliance/requirements/${id}`, data),

  getGapAnalysis: (params?: { status?: string; standard?: string }) =>
    api.get<GapAnalysisItemRecord[]>('/compliance/gap-analysis', params as any),

  createGapItem: (data: Partial<GapAnalysisItemRecord> & { title: string }) =>
    api.post<GapAnalysisItemRecord>('/compliance/gap-analysis', data),

  updateGapItem: (id: number, data: Partial<GapAnalysisItemRecord>) =>
    api.put<GapAnalysisItemRecord>(`/compliance/gap-analysis/${id}`, data),

  deleteGapItem: (id: number) =>
    api.delete<void>(`/compliance/gap-analysis/${id}`),

  getCalendar: (params?: { status?: string; year?: string; month?: string; eventType?: string; priority?: string; from?: string; to?: string; department?: string }) =>
    api.get<ComplianceCalendarEventRecord[]>('/compliance/calendar', params as any),

  createCalendarEvent: (data: Partial<ComplianceCalendarEventRecord> & { title: string; dueDate: string; eventType: string }) =>
    api.post<ComplianceCalendarEventRecord>('/compliance/calendar', data),
};

// ============================================
// Hazard Reports API Service (NEW)
// ============================================

export interface HazardReportRecord {
  id: number; hazardCode: string; title: string; description: string;
  location: string; department?: string; reportedBy: string;
  hazardType: string; riskLevel: string; immediateAction?: string;
  controlMeasures?: string[]; status: string; reportedDate?: string;
  resolvedDate?: string; createdAt?: number;
}

export const hazardReportsApiService = {
  getAll: (params?: { department?: string; type?: string; status?: string; riskLevel?: string }) =>
    api.get<HazardReportRecord[]>('/hazards', params as any),

  getById: (id: number) =>
    api.get<HazardReportRecord>(`/hazards/${id}`),

  create: (data: Partial<HazardReportRecord>) =>
    api.post<HazardReportRecord>('/hazards', data),

  submit: (id: number) =>
    api.post<HazardReportRecord>(`/hazards/${id}/submit`, {}),
};

// ============================================
// Sensor API Service (NEW - extends inspectionService)
// ============================================

// ============================================
// Vehicle Incident API Service
// ============================================

export interface VehicleIncidentRecord {
  id?: number;
  reportNumber?: string;
  status?: string;
  incidentDate: string;
  incidentTime?: string;
  location: string;
  incidentType?: string;
  damageSeverity?: string;
  estimatedCost?: string;
  driverName: string;
  employeeId?: string;
  licenseNumber?: string;
  vehicleType?: string;
  vehicleId?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  licensePlate?: string;
  odometer?: string;
  roadCondition?: string;
  lighting?: string;
  speedLimit?: string;
  estimatedSpeed?: string;
  weatherCondition?: string;
  description: string;
  otherVehicles?: string;
  witnesses?: string;
  policeReport?: boolean;
  policeReportNumber?: string;
  dotRecordable?: boolean;
  injuries?: boolean;
  injuryDescription?: string;
  propertyDamage?: string;
  preventable?: string;
  reportedBy?: string;
  createdAt?: number;
  updatedAt?: number;
}

export const vehicleIncidentApiService = {
  getAll: (params?: { status?: string; incidentType?: string }) =>
    api.get<VehicleIncidentRecord[]>('/vehicle-incidents', params as any),

  getById: (id: number) =>
    api.get<VehicleIncidentRecord>(`/vehicle-incidents/${id}`),

  create: (data: VehicleIncidentRecord) =>
    api.post<VehicleIncidentRecord>('/vehicle-incidents', data),

  update: (id: number, data: Partial<VehicleIncidentRecord>) =>
    api.put<VehicleIncidentRecord>(`/vehicle-incidents/${id}`, data),

  remove: (id: number) =>
    api.delete<{ deleted: boolean }>(`/vehicle-incidents/${id}`),

  getStats: () =>
    api.get<{ total: number; dotRecordable: number; withInjuries: number; byType: any[]; bySeverity: any[] }>('/vehicle-incidents/stats'),
};

export interface SensorConfigRecord {
  id: number; sensorId: string; name: string; sensorType: string;
  zone?: string; location?: string; unit?: string;
  minThreshold?: number; maxThreshold?: number; status: string;
  lastCalibrated?: string; installedDate?: string; createdAt?: number;
}
export interface SensorReadingRecord {
  id: number; sensorId: string; value: number; unit?: string;
  anomalyDetected?: boolean; recordedAt: number;
}

export const sensorApiService = {
  getAll: (params?: { type?: string; zone?: string; status?: string }) =>
    api.get<SensorConfigRecord[]>('/inspections/sensors', params as any),

  getById: (sensorId: string) =>
    api.get<SensorConfigRecord>(`/inspections/sensors/${sensorId}`),

  create: (data: Partial<SensorConfigRecord>) =>
    api.post<SensorConfigRecord>('/inspections/sensors', data),

  update: (sensorId: string, data: Partial<SensorConfigRecord>) =>
    api.put<SensorConfigRecord>(`/inspections/sensors/${sensorId}`, data),

  getReadings: (params?: { sensorId?: string; from?: string; to?: string; limit?: number }) =>
    api.get<SensorReadingRecord[]>('/inspections/readings', params as any),

  calibrate: (sensorId: string, data: any) =>
    api.post<any>(`/inspections/sensors/${sensorId}/calibrate`, data),

  getCalibrations: (sensorId: string) =>
    api.get<any[]>(`/inspections/sensors/${sensorId}/calibrations`),
};

// ============================================
// Releases API Service
// ============================================

export interface ReleaseRecord {
  id: number;
  version: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'released' | 'archived';
  releaseDate: string;
  plannedDate: string;
  owner: string;
  progress: number;
  riskLevel: 'low' | 'medium' | 'high';
  createdAt: number;
  updatedAt: number;
  features: string[];
  dependencies: string[];
  epicIds: string[];
  changelog: string[];
}

export const releasesApiService = {
  getAll: (params?: { status?: string }) =>
    api.get<ReleaseRecord[]>('/releases', params as any),

  getById: (id: number) =>
    api.get<ReleaseRecord>(`/releases/${id}`),

  create: (data: {
    version: string;
    name: string;
    description?: string;
    plannedDate?: string;
    owner?: string;
    riskLevel?: 'low' | 'medium' | 'high';
  }) => api.post<ReleaseRecord>('/releases', data),

  update: (
    id: number,
    data: Partial<{
      version: string;
      name: string;
      description: string;
      plannedDate: string;
      owner: string;
      progress: number;
      riskLevel: 'low' | 'medium' | 'high';
    }>
  ) => api.patch<ReleaseRecord>(`/releases/${id}`, data),

  updateStatus: (
    id: number,
    data: { status: 'planning' | 'in_progress' | 'released' | 'archived'; releaseDate?: string }
  ) => api.patch<ReleaseRecord>(`/releases/${id}/status`, data),

  delete: (id: number) =>
    api.delete<void>(`/releases/${id}`),

  addFeature: (id: number, feature: string) =>
    api.post<ReleaseRecord>(`/releases/${id}/features`, { feature }),

  addDependency: (id: number, dependency: string) =>
    api.post<ReleaseRecord>(`/releases/${id}/dependencies`, { dependency }),

  addChangelog: (id: number, entry: string) =>
    api.post<ReleaseRecord>(`/releases/${id}/changelog`, { entry }),

  addEpic: (id: number, epicId: string) =>
    api.post<ReleaseRecord>(`/releases/${id}/epics`, { epicId }),

  removeEpic: (id: number, epicId: string) =>
    api.delete<ReleaseRecord>(`/releases/${id}/epics/${epicId}`),
};

// ── SDS Equipment Service ─────────────────────────────────────────────────
export const sdsEquipmentService = {
  getAll: (params?: { status?: string; location?: string; department?: string; search?: string }) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null) as [string, string][]).toString() : '';
    return api.get<{ success: boolean; data: any[]; total: number }>(`/sds/equipment${query}`);
  },
  getById: (id: string) =>
    api.get<{ success: boolean; data: any }>(`/sds/equipment/${id}`),
  scanCode: (code: string) =>
    api.get<{ success: boolean; data: { equipment: any | null; linkedSDS: string[] } }>(`/sds/equipment/scan/${encodeURIComponent(code)}`),
  create: (data: Record<string, unknown>) =>
    api.post<{ success: boolean; data: any }>(`/sds/equipment`, data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put<{ success: boolean; data: any }>(`/sds/equipment/${id}`, data),
  logInspection: (id: string, record: Record<string, unknown>) =>
    api.post<{ success: boolean; data: any }>(`/sds/equipment/${id}/inspection`, record),
  importCSV: (items: Record<string, unknown>[]) =>
    api.post<{ success: boolean; data: { success: number; failed: number; errors: string[] } }>(`/sds/equipment/import`, { items }),
  sync: (items: Record<string, unknown>[]) =>
    api.post<{ success: boolean; data: { synced: number; syncedAt: string } }>(`/sds/sync`, { items }),
};

// ── Geotag API Service ────────────────────────────────────────────────────
export const geotagApiService = {
  getAll: (params?: { recordType?: string; zone?: string; syncStatus?: string; limit?: number; offset?: number }) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString() : '';
    return api.get<{ success: boolean; data: any[]; total: number }>(`/geotags${query}`);
  },
  save: (geotag: Record<string, unknown>) =>
    api.post<{ success: boolean; data: any }>(`/geotags`, geotag),
  syncBatch: (geotags: Record<string, unknown>[]) =>
    api.post<{ success: boolean; data: { synced: number; failed: number; syncedAt: string } }>(`/geotags/sync`, { geotags }),
  getZones: () =>
    api.get<{ success: boolean; data: any[] }>(`/geotags/zones`),
};

// ── Hub Risk Predictions Service ──────────────────────────────────────────
export const hubRiskPredictionService = {
  getPredictions: () =>
    api.post<{ success: boolean; data: any }>(`/ai/predict-incidents`, {
      facilityType: 'manufacturing',
      recentIncidents: 12,
      workersCount: 150,
      hazardCategories: ['Chemical', 'Equipment', 'Fall', 'Fire', 'Ergonomic'],
    }),
};

// ── Hub Analytics Service ─────────────────────────────────────────────────
export const hubAnalyticsService = {
  getTrends: () =>
    api.get<{ success: boolean; data: any }>(`/analytics/incidents`),
  getKPI: () =>
    api.get<{ success: boolean; data: any }>(`/analytics/kpi-metrics`),
};

// ── AI Audit Form Types ───────────────────────────────────────────────────

export interface AiAuditFormSession {
  id: number;
  templateId: string;
  templateName: string;
  templateStandard: string;
  answers: Record<string, { status: 'compliant' | 'non-compliant' | 'na'; notes: string }>;
  complianceScore: number;
  aiSummary: string | null;
  totalQuestions: number;
  compliantCount: number;
  nonCompliantCount: number;
  naCount: number;
  evidencePhotosCount: number;
  isCustomTemplate: boolean;
  createdAt: number;
}

export interface SaveAuditFormSessionPayload {
  templateId: string;
  templateName: string;
  templateStandard: string;
  answers: Record<string, { status: 'compliant' | 'non-compliant' | 'na'; notes: string }>;
  complianceScore: number;
  aiSummary?: string | null;
  totalQuestions: number;
  compliantCount: number;
  nonCompliantCount: number;
  naCount: number;
  evidencePhotosCount?: number;
  isCustomTemplate?: boolean;
}

export interface AiAuditCustomTemplate {
  id: string;
  name: string;
  standard: string;
  version: string;
  description: string;
  categories: string[];
  questions: Array<{
    id: string;
    text: string;
    standard: string;
    clause?: string;
    category: string;
    aiHint?: string;
    riskWeight: number;
  }>;
  createdAt: number;
}

export interface SaveAuditCustomTemplatePayload {
  id: string;
  name: string;
  standard: string;
  version?: string;
  description?: string;
  categories: string[];
  questions: Array<{
    id: string;
    text: string;
    standard: string;
    clause?: string;
    category: string;
    aiHint?: string;
    riskWeight: number;
  }>;
}

export interface AuditAnalysisPayload {
  templateId: string;
  templateName: string;
  standard: string;
  answers: Record<string, { status: 'compliant' | 'non-compliant' | 'na'; notes?: string }>;
  complianceScore: number;
  questions?: Array<{
    id: string;
    text: string;
    standard: string;
    clause?: string;
    category: string;
    riskWeight: number;
  }>;
}

export interface AuditAnalysisResult {
  summary: string;
  source: 'ai' | 'fallback';
  model: string | null;
}

// ── AI Training Module Types ──────────────────────────────────────────────
export interface AiTrainingModule {
  id: string;
  title: string;
  category: string;
  aiGenerated: boolean;
  difficulty: string;
  duration: string;
  modules: number;
  completed: number;
  score: number;
  enrolled: number;
  description: string;
  tags: string[];
  color: string;
  nextLesson: string;
  adaptiveScore: number;
  createdAt: number;
}

export interface AiLearningPath {
  id: string;
  name: string;
  modules: number;
  duration: string;
  progress: number;
  certified: boolean;
  color: string;
  createdAt: number;
}

export interface AiCompetencyArea {
  id: string;
  area: string;
  score: number;
  trend: string;
  benchmark: number;
  updatedAt: number;
}

export interface AiGeneratedCourse {
  id: number;
  topic: string;
  difficulty: string;
  audience: string;
  moduleCount: string;
  description: string;
  source: string;
  createdAt: number;
}

export interface GenerateCoursePayload {
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  audience: string;
  moduleCount: string;
}

// ── AI Training Service ───────────────────────────────────────────────────
export const aiTrainingService = {
  getModules: () =>
    api.get<AiTrainingModule[]>('/ai/training/modules'),

  updateProgress: (id: string, completed: number) =>
    api.patch<{ id: string; completed: number }>(`/ai/training/modules/${id}/progress`, { completed }),

  getPaths: () =>
    api.get<AiLearningPath[]>('/ai/training/paths'),

  getCompetency: () =>
    api.get<AiCompetencyArea[]>('/ai/training/competency'),

  generateCourse: (payload: GenerateCoursePayload) =>
    api.post<AiGeneratedCourse>('/ai/training/generate', payload),

  getGeneratedCourses: (limit?: number) =>
    api.get<AiGeneratedCourse[]>('/ai/training/generated', limit ? { limit } : undefined),
};

// ── Visual Audit Service ─────────────────────────────────────────────────────────────────────
export interface VisualAuditResult {
  id: string;
  type: string;
  mediaType: 'image' | 'video';
  analysis: string;
  suggestions: string[];
  status: 'safe' | 'warning' | 'danger';
  hazards?: Array<{ x: number; y: number; label: string; severity: 'high' | 'medium' | 'low'; standard?: string }>;
  ppeInventory?: Array<{ item: string; status: 'detected' | 'missing' | 'incorrect' }>;
  voiceNotes: string[];
  locationLat?: number;
  locationLng?: number;
  standard: string;
  createdAt: number;
}

export interface SaveVisualAuditPayload {
  id: string;
  type: string;
  mediaType: 'image' | 'video';
  analysis: string;
  suggestions: string[];
  status: 'safe' | 'warning' | 'danger';
  hazards?: Array<{ x: number; y: number; label: string; severity: 'high' | 'medium' | 'low'; standard?: string }>;
  ppeInventory?: Array<{ item: string; status: 'detected' | 'missing' | 'incorrect' }>;
  voiceNotes?: string[];
  locationLat?: number;
  locationLng?: number;
  standard?: string;
}

export interface VisualAuditStats {
  total: number;
  safe: number;
  warning: number;
  danger: number;
  byType: Record<string, number>;
}

export const visualAuditService = {
  saveResult: (payload: SaveVisualAuditPayload) =>
    api.post<{ id: string }>('/ai/visual-audit/results', payload),

  getResults: (limit?: number) =>
    api.get<VisualAuditResult[]>('/ai/visual-audit/results', limit ? { limit } : undefined),

  deleteResult: (id: string) =>
    api.delete<void>(`/ai/visual-audit/results/${id}`),

  addVoiceNote: (id: string, note: string) =>
    api.post<{ voiceNotes: string[] }>(`/ai/visual-audit/results/${id}/voice-notes`, { note }),

  getStats: () =>
    api.get<VisualAuditStats>('/ai/visual-audit/stats'),
};

// ── AI Audit Form Service ─────────────────────────────────────────────────
export const aiAuditFormService = {
  analyzeAudit: (payload: AuditAnalysisPayload) =>
    api.post<AuditAnalysisResult>('/ai/audit-analysis', payload),

  getSessions: (limit?: number) =>
    api.get<AiAuditFormSession[]>('/ai/audit-form/sessions', limit ? { limit } : undefined),

  saveSession: (payload: SaveAuditFormSessionPayload) =>
    api.post<{ id: number }>('/ai/audit-form/sessions', payload),

  getCustomTemplates: () =>
    api.get<AiAuditCustomTemplate[]>('/ai/audit-form/custom-templates'),

  saveCustomTemplate: (payload: SaveAuditCustomTemplatePayload) =>
    api.post<{ id: string; name: string }>('/ai/audit-form/custom-templates', payload),

  deleteCustomTemplate: (id: string) =>
    api.delete<{ success: boolean }>(`/ai/audit-form/custom-templates/${id}`),
};

export default api;

// ============================================
// Bow Tie Analysis API Service
// ============================================

export interface BowTieBarrier {
  id: string;
  name: string;
  type: 'engineering' | 'administrative' | 'ppe' | 'procedural';
  effectiveness: number;
  status: 'active' | 'degraded' | 'failed';
}

export interface BowTieThreat {
  id: string;
  name: string;
  preventiveBarriers: BowTieBarrier[];
}

export interface BowTieConsequence {
  id: string;
  name: string;
  severity: 'minor' | 'moderate' | 'major' | 'catastrophic';
  mitigativeBarriers: BowTieBarrier[];
}

export interface BowTieScenarioRecord {
  id: string;
  title: string;
  topEvent: string;
  hazard: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  threats: BowTieThreat[];
  consequences: BowTieConsequence[];
  status: 'draft' | 'active' | 'review' | 'archived';
  lastUpdated: string;
  owner: string;
  createdAt?: number;
}

export interface BowTieStats {
  total: number;
  critical: number;
  high: number;
  active: number;
  totalBarriers: number;
  degradedBarriers: number;
  byStatus: Array<{ status: string; count: number }>;
  byRisk: Array<{ risk_level: string; count: number }>;
}

export const bowTieApiService = {
  getStats: () =>
    api.get<BowTieStats>('/bowtie/stats'),

  getScenarios: (params?: { status?: string; riskLevel?: string; search?: string; owner?: string }) =>
    api.get<BowTieScenarioRecord[]>('/bowtie/scenarios', params as any),

  getScenario: (id: string) =>
    api.get<BowTieScenarioRecord>(`/bowtie/scenarios/${id}`),

  createScenario: (data: Omit<BowTieScenarioRecord, 'id' | 'createdAt' | 'lastUpdated'>) =>
    api.post<BowTieScenarioRecord>('/bowtie/scenarios', data),

  updateScenario: (id: string, data: Partial<Omit<BowTieScenarioRecord, 'id' | 'createdAt'>>) =>
    api.put<BowTieScenarioRecord>(`/bowtie/scenarios/${id}`, data),
};

// ============================================================
// Custom App Builder
// ============================================================

export interface CustomAppElement {
  id: string;
  type: string;
  label: string;
  props: Record<string, any>;
}

export interface CustomAppRecord {
  id: number;
  appName: string;
  status: 'draft' | 'deployed' | 'archived';
  elements: CustomAppElement[];
  devicePreference: string;
  createdAt?: number;
  updatedAt?: number;
  deployedAt?: number | null;
}

export interface CustomAppStats {
  total: number;
  deployed: number;
  drafts: number;
  archived: number;
}

export const customAppsApiService = {
  getStats: () =>
    api.get<CustomAppStats>('/custom-apps/stats'),

  getAll: (params?: { status?: string; search?: string }) =>
    api.get<CustomAppRecord[]>('/custom-apps', params as Record<string, string>),

  getById: (id: number) =>
    api.get<CustomAppRecord>(`/custom-apps/${id}`),

  create: (data: { appName: string; status?: string; elements?: CustomAppElement[]; devicePreference?: string }) =>
    api.post<CustomAppRecord>('/custom-apps', data),

  update: (id: number, data: Partial<{ appName: string; status: string; elements: CustomAppElement[]; devicePreference: string }>) =>
    api.put<CustomAppRecord>(`/custom-apps/${id}`, data),

  delete: (id: number) =>
    api.delete<void>(`/custom-apps/${id}`),

  deploy: (id: number) =>
    api.post<CustomAppRecord>(`/custom-apps/${id}/deploy`, {}),

  generate: (prompt: string) =>
    api.post<{ appName: string; elements: CustomAppElement[] }>('/custom-apps/generate', { prompt }),
};

// ============================================================
// Custom Report Builder
// ============================================================

export interface ReportElement {
  id: string;
  type: 'text' | 'checkbox' | 'image' | 'header';
  label: string;
  required: boolean;
}

export interface CustomReportRecord {
  id: number;
  reportName: string;
  status: 'draft' | 'published' | 'archived';
  elements: ReportElement[];
  createdAt?: number;
  updatedAt?: number;
}

export interface CustomReportStats {
  total: number;
  drafts: number;
  published: number;
  archived: number;
}

export const customReportsApiService = {
  getStats: () =>
    api.get<CustomReportStats>('/custom-reports/stats'),

  getAll: (params?: { status?: string; search?: string }) =>
    api.get<CustomReportRecord[]>('/custom-reports', params as Record<string, string>),

  getById: (id: number) =>
    api.get<CustomReportRecord>(`/custom-reports/${id}`),

  create: (data: { reportName: string; status?: string; elements?: ReportElement[] }) =>
    api.post<CustomReportRecord>('/custom-reports', data),

  update: (id: number, data: Partial<{ reportName: string; status: string; elements: ReportElement[] }>) =>
    api.put<CustomReportRecord>(`/custom-reports/${id}`, data),

  delete: (id: number) =>
    api.delete<void>(`/custom-reports/${id}`),

  publish: (id: number) =>
    api.post<CustomReportRecord>(`/custom-reports/${id}/publish`, {}),
};

// ── Data Security Hub ─────────────────────────────────────────────────────────

export interface SsoProviderRecord {
  id: number;
  name: string;
  protocol: string;
  status: 'connected' | 'configured' | 'disconnected';
  icon: string;
  connectedUsers: number;
  lastSync: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface SecurityAuditLogRecord {
  id: number;
  userName: string;
  action: string;
  resource: string;
  fieldName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  ipAddress: string;
  timestamp: string;
  createdAt?: number;
}

export interface DataSecurityStats {
  ssoCoverage: string;
  rbacPolicies: number;
  auditEvents24h: number;
  failedLogins24h: number;
  dataEncrypted: string;
  iso45001Ready: string;
}

export interface RbacResource {
  name: string;
  admin: string;
  safetyMgr: string;
  supervisor: string;
  worker: string;
  contractor: string;
  hr: string;
}

export interface RbacMatrix {
  roles: string[];
  resources: RbacResource[];
}

export const dataSecurityApiService = {
  getStats: () =>
    api.get<DataSecurityStats>('/data-security/stats'),

  getSsoProviders: () =>
    api.get<SsoProviderRecord[]>('/data-security/sso-providers'),

  updateSsoProvider: (id: number, data: { status?: string; connectedUsers?: number; lastSync?: string }) =>
    api.put<SsoProviderRecord>(`/data-security/sso-providers/${id}`, data),

  getAuditLogs: (params?: { search?: string; action?: string; limit?: number; offset?: number }) =>
    api.get<SecurityAuditLogRecord[]>('/data-security/audit-logs', params as Record<string, any>),

  createAuditLog: (data: Omit<SecurityAuditLogRecord, 'id' | 'createdAt'>) =>
    api.post<SecurityAuditLogRecord>('/data-security/audit-logs', data),

  getRbac: () =>
    api.get<RbacMatrix>('/data-security/rbac'),
};

// ─────────────────────────────────────────────────────────────────────────────
// Email Notification System
// ─────────────────────────────────────────────────────────────────────────────

export interface EmailTemplateRecord {
  id: number;
  name: string;
  category: string;
  status: 'active' | 'paused';
  subject: string;
  description: string;
  iconName: string;
  color: string;
  openRate: number;
  clickRate: number;
  sentCount: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface AutomationWorkflowRecord {
  id: number;
  name: string;
  triggerEvent: string;
  emailsCount: number;
  status: 'active' | 'testing' | 'paused';
  deliveryRate: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface EmailCampaignRecord {
  id: number;
  name: string;
  subject: string;
  audienceSegment: string;
  body: string;
  status: 'draft' | 'sent' | 'scheduled';
  sentAt?: number | null;
  recipientCount: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface EmailNotificationStats {
  sentCount30d: number;
  avgOpenRate: string;
  avgClickRate: string;
  deliveryRate: string;
  activeWorkflows: number;
  subscriberCount: number;
}

export const emailNotificationApiService = {
  getStats: () =>
    api.get<EmailNotificationStats>('/email-notifications/stats'),
  getTemplates: (category?: string) =>
    api.get<EmailTemplateRecord[]>('/email-notifications/templates', category ? { category } : undefined),
  updateTemplate: (id: number, data: { status?: 'active' | 'paused'; openRate?: number; clickRate?: number; sentCount?: number }) =>
    api.put<EmailTemplateRecord>(`/email-notifications/templates/${id}`, data),
  getWorkflows: () =>
    api.get<AutomationWorkflowRecord[]>('/email-notifications/workflows'),
  updateWorkflow: (id: number, data: { status?: 'active' | 'testing' | 'paused'; deliveryRate?: number; emailsCount?: number }) =>
    api.put<AutomationWorkflowRecord>(`/email-notifications/workflows/${id}`, data),
  createCampaign: (data: { name: string; subject: string; audienceSegment?: string; body?: string; status?: 'draft' | 'sent' | 'scheduled'; recipientCount?: number }) =>
    api.post<EmailCampaignRecord>('/email-notifications/campaigns', data),
  getCampaigns: (limit?: number) =>
    api.get<EmailCampaignRecord[]>('/email-notifications/campaigns', limit ? { limit } : undefined),
};

// ── Compliance Frameworks (Global Compliance Hub) ─────────────────────────

export interface ComplianceFrameworkRecord {
  id: string;
  name: string;
  shortName: string;
  region: string;
  category: string;
  status: 'compliant' | 'partial' | 'non-compliant' | 'not-applicable';
  score: number;
  lastAudit: string;
  nextDue: string;
  requirements: number;
  completed: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface ComplianceFrameworkStats {
  total: number;
  compliant: number;
  partial: number;
  nonCompliant: number;
  notApplicable: number;
  avgScore: number;
}

export const complianceFrameworksService = {
  getAll: (params?: { region?: string; category?: string; status?: string; search?: string }) =>
    api.get<ComplianceFrameworkRecord[]>('/compliance/frameworks', params),
  getStats: () =>
    api.get<ComplianceFrameworkStats>('/compliance/frameworks/stats'),
  getById: (id: string) =>
    api.get<ComplianceFrameworkRecord>(`/compliance/frameworks/${id}`),
  create: (data: Omit<ComplianceFrameworkRecord, 'createdAt' | 'updatedAt'>) =>
    api.post<ComplianceFrameworkRecord>('/compliance/frameworks', data),
  update: (id: string, data: Partial<Omit<ComplianceFrameworkRecord, 'id' | 'createdAt' | 'updatedAt'>>) =>
    api.put<ComplianceFrameworkRecord>(`/compliance/frameworks/${id}`, data),
  delete: (id: string) =>
    api.delete<{ message: string }>(`/compliance/frameworks/${id}`),
  export: (params?: { region?: string; category?: string; status?: string; search?: string }) =>
    api.get<ComplianceFrameworkRecord[]>('/compliance/frameworks/export', params),
};

// ── Job Safety Analysis (JSA / Hazard Assessment) ─────────────────────────

export interface JsaStep {
  id: string;
  stepNumber: number;
  taskDescription: string;
  hazards: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  controls: string;
  ppeRequired: string[];
  images: string[];
  complianceRef?: string;
}

export interface JsaRecord {
  id: string;
  title: string;
  department: string;
  location: string;
  compliance: string;
  steps: JsaStep[];
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  hazardCount: number;
  controlCount: number;
  assignee: string;
  createdDate: string;
  createdBy: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface JsaStats {
  total: number;
  approved: number;
  pending: number;
  draft: number;
  rejected: number;
  critical: number;
  high: number;
  totalHazards: number;
  totalControls: number;
}

export const jsaApiService = {
  getAll: (params?: { status?: string; risk?: string; department?: string; search?: string; limit?: number }) =>
    api.get<JsaRecord[]>('/jsa', params as any),
  getStats: () =>
    api.get<JsaStats>('/jsa/stats'),
  getById: (id: string) =>
    api.get<JsaRecord>(`/jsa/${id}`),
  create: (data: Omit<JsaRecord, 'hazardCount' | 'controlCount' | 'createdAt' | 'updatedAt'> & { id?: string }) =>
    api.post<JsaRecord>('/jsa', data),
  update: (id: string, data: Partial<Omit<JsaRecord, 'id' | 'createdAt' | 'updatedAt'>>) =>
    api.put<JsaRecord>(`/jsa/${id}`, data),
  delete: (id: string) =>
    api.delete<{ message: string }>(`/jsa/${id}`),
};

// ── Hyper-Care Training ───────────────────────────────────────────────────────

export interface HypercareDemo {
  id: number;
  title: string;
  duration: string;
  audience: string;
  scheduled: string;
  site: string;
  attendees: number;
  status: 'upcoming' | 'completed' | 'scheduled';
  type: 'live' | 'recorded';
  createdAt?: number;
  updatedAt?: number;
}

export interface HypercareChampion {
  id: number;
  name: string;
  site: string;
  role: string;
  trained: string;
  peersHelped: number;
  rating: number;
  specialties: string[];
  createdAt?: number;
  updatedAt?: number;
}

export interface HypercareQrDeployment {
  id: number;
  location: string;
  form: string;
  scans: number;
  lastScan: string;
  status: 'active' | 'inactive';
  createdAt?: number;
  updatedAt?: number;
}

export interface HypercareStats {
  toolboxDemos: number;
  safetyChampions: number;
  qrCodesDeployed: number;
  workersTrained: number;
  peerHelpSessions: number;
  avgCompetency: string;
}

export const hypercareApiService = {
  getStats: () =>
    api.get<HypercareStats>('/hypercare/stats'),

  // Toolbox Talk Demos
  getDemos: (params?: { status?: string; site?: string; search?: string }) =>
    api.get<HypercareDemo[]>('/hypercare/demos', params as any),
  getDemoById: (id: number) =>
    api.get<HypercareDemo>(`/hypercare/demos/${id}`),
  createDemo: (data: Omit<HypercareDemo, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<HypercareDemo>('/hypercare/demos', data),
  updateDemo: (id: number, data: Partial<Omit<HypercareDemo, 'id' | 'createdAt' | 'updatedAt'>>) =>
    api.put<HypercareDemo>(`/hypercare/demos/${id}`, data),
  deleteDemo: (id: number) =>
    api.delete<{ message: string }>(`/hypercare/demos/${id}`),

  // Safety Champions
  getChampions: (params?: { site?: string; search?: string }) =>
    api.get<HypercareChampion[]>('/hypercare/champions', params as any),
  getChampionById: (id: number) =>
    api.get<HypercareChampion>(`/hypercare/champions/${id}`),
  createChampion: (data: Omit<HypercareChampion, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<HypercareChampion>('/hypercare/champions', data),
  updateChampion: (id: number, data: Partial<Omit<HypercareChampion, 'id' | 'createdAt' | 'updatedAt'>>) =>
    api.put<HypercareChampion>(`/hypercare/champions/${id}`, data),
  deleteChampion: (id: number) =>
    api.delete<{ message: string }>(`/hypercare/champions/${id}`),

  // QR Code Deployments
  getQrDeployments: (params?: { status?: string; search?: string }) =>
    api.get<HypercareQrDeployment[]>('/hypercare/qr', params as any),
  getQrById: (id: number) =>
    api.get<HypercareQrDeployment>(`/hypercare/qr/${id}`),
  createQrDeployment: (data: Omit<HypercareQrDeployment, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<HypercareQrDeployment>('/hypercare/qr', data),
  updateQrDeployment: (id: number, data: Partial<Omit<HypercareQrDeployment, 'id' | 'createdAt' | 'updatedAt'>>) =>
    api.put<HypercareQrDeployment>(`/hypercare/qr/${id}`, data),
  deleteQrDeployment: (id: number) =>
    api.delete<{ message: string }>(`/hypercare/qr/${id}`),
  recordScan: (id: number) =>
    api.post<HypercareQrDeployment>(`/hypercare/qr/${id}/scan`, {}),
};

// ── Incident Heatmap ──────────────────────────────────────────────────────────

export interface HeatmapIncident {
  id: string;
  title: string;
  type: 'injury' | 'near-miss' | 'property-damage' | 'environmental' | 'fire' | 'vehicle';
  severity: 'low' | 'medium' | 'high' | 'critical';
  date: string;
  location: string;
  department: string;
  coordinates: { x: number; y: number };
  description: string;
  status: 'open' | 'investigating' | 'closed';
  reportedBy?: string;
  isNew?: boolean;
  timestamp?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface HeatmapIncidentStats {
  total: number;
  critical: number;
  open: number;
  newToday: number;
}

export interface HeatmapIncidentFilters {
  timeRange?: string;
  type?: string;
  severity?: string;
  department?: string;
  search?: string;
  limit?: number;
}

export const heatmapIncidentApiService = {
  getAll: (params?: HeatmapIncidentFilters) =>
    api.get<HeatmapIncident[]>('/heatmap/incidents', params as any),
  getStats: () =>
    api.get<HeatmapIncidentStats>('/heatmap/stats'),
  getById: (id: string) =>
    api.get<HeatmapIncident>(`/heatmap/incidents/${id}`),
  create: (data: Omit<HeatmapIncident, 'coordinates' | 'createdAt' | 'updatedAt'> & { coordX: number; coordY: number }) =>
    api.post<HeatmapIncident>('/heatmap/incidents', data),
  update: (id: string, data: Partial<Omit<HeatmapIncident, 'coordinates'> & { coordX?: number; coordY?: number }>) =>
    api.put<HeatmapIncident>(`/heatmap/incidents/${id}`, data),
  delete: (id: string) =>
    api.delete<{ message: string }>(`/heatmap/incidents/${id}`),
};

// ── Incident Analytics ────────────────────────────────────────────────────────

export interface IncidentAnalyticsParams {
  timeRange?: string;
  fromDate?: string;
  toDate?: string;
}

export interface IncidentAnalyticsKPIs {
  totalIncidents: number;
  totalInjuries: number;
  nearMissRatio: number;
  trir: number;
  trirChange: number;
  incidentChange: number;
  injuryChange: number;
}

export interface IncidentAnalyticsMonthlyItem {
  month: string;
  injuries: number;
  nearMisses: number;
  propertyDamage: number;
  environmental: number;
  fire: number;
  vehicle: number;
  other: number;
  total: number;
}

export interface IncidentAnalyticsWeeklyItem {
  week: string;
  injuries: number;
  nearMisses: number;
  total: number;
}

export interface IncidentAnalyticsByTypeItem {
  name: string;
  value: number;
  color: string;
}

export interface IncidentAnalyticsBySeverityItem {
  name: string;
  value: number;
  color: string;
}

export interface IncidentAnalyticsByDepartmentItem {
  department: string;
  incidents: number;
  injuries: number;
  nearMisses: number;
  trend: 'up' | 'down' | 'stable';
}

export interface IncidentAnalyticsByDayItem {
  day: string;
  incidents: number;
  average: number;
}

export interface IncidentAnalyticsByTimeItem {
  time: string;
  incidents: number;
  percentage: number;
}

export interface IncidentAnalyticsRootCauseItem {
  cause: string;
  count: number;
  percentage: number;
}

export interface IncidentAnalyticsLeadingIndicatorItem {
  name: string;
  current: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

export const incidentAnalyticsService = {
  getKPIs: (params?: IncidentAnalyticsParams) =>
    api.get<IncidentAnalyticsKPIs>('/incident-analytics/kpis', params as any),
  getMonthlyTrend: (params?: { months?: number }) =>
    api.get<IncidentAnalyticsMonthlyItem[]>('/incident-analytics/monthly-trend', params as any),
  getWeeklyTrend: (params?: { year?: string; month?: string }) =>
    api.get<IncidentAnalyticsWeeklyItem[]>('/incident-analytics/weekly-trend', params as any),
  getByType: (params?: IncidentAnalyticsParams) =>
    api.get<IncidentAnalyticsByTypeItem[]>('/incident-analytics/by-type', params as any),
  getBySeverity: (params?: IncidentAnalyticsParams) =>
    api.get<IncidentAnalyticsBySeverityItem[]>('/incident-analytics/by-severity', params as any),
  getByDepartment: (params?: IncidentAnalyticsParams) =>
    api.get<IncidentAnalyticsByDepartmentItem[]>('/incident-analytics/by-department', params as any),
  getByDayOfWeek: (params?: IncidentAnalyticsParams) =>
    api.get<IncidentAnalyticsByDayItem[]>('/incident-analytics/by-day-of-week', params as any),
  getByTimeOfDay: (params?: IncidentAnalyticsParams) =>
    api.get<IncidentAnalyticsByTimeItem[]>('/incident-analytics/by-time-of-day', params as any),
  getRootCauses: (params?: IncidentAnalyticsParams) =>
    api.get<IncidentAnalyticsRootCauseItem[]>('/incident-analytics/root-causes', params as any),
  getLeadingIndicators: (params?: IncidentAnalyticsParams) =>
    api.get<IncidentAnalyticsLeadingIndicatorItem[]>('/incident-analytics/leading-indicators', params as any),
};

// ============================================
// Landing Page API Service
// ============================================

export interface LandingStats {
  incidentReduction:   number;
  hazardDetection:     number;
  activeWorkers:       number;
  customerSatisfaction: number;
  totalIncidents:      number;
  nearMisses:          number;
  totalDemoRequests:   number;
}

export interface DemoRequest {
  id?:      number;
  name:     string;
  email:    string;
  company?: string;
  phone?:   string;
  message?: string;
  source?:  string;
  status?:  string;
  createdAt?: number;
}

// ============================================
// User Preferences Service
// ============================================

export interface UserPreferences {
  preferredLanguage: string;
}

export const userPreferencesApiService = {
  get: async (): Promise<APIResponse<UserPreferences>> => {
    const { baseURL } = getAPIConfig();
    const res = await fetch(`${baseURL}/user-preferences`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  save: async (data: UserPreferences): Promise<APIResponse<UserPreferences>> => {
    const { baseURL } = getAPIConfig();
    const res = await fetch(`${baseURL}/user-preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
};

export const landingApiService = {
  getStats: () =>
    api.get<LandingStats>('/landing/stats'),

  createDemoRequest: (data: Omit<DemoRequest, 'id' | 'status' | 'createdAt'>) =>
    api.post<{ id: number; message: string }>('/landing/demo-request', data),

  getDemoRequests: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get<DemoRequest[]>('/landing/demo-requests', params as any),

  updateDemoRequestStatus: (id: number, status: 'new' | 'contacted' | 'closed') =>
    api.patch<{ id: number; status: string }>(`/landing/demo-requests/${id}`, { status }),
};

// ============================================
// Mobile Offline Sync API Service
// ============================================

export interface SyncQueueRecord {
  id:         string;
  entity:     string;
  action:     'create' | 'update' | 'delete';
  timestamp:  string;
  data:       Record<string, unknown>;
  synced:     boolean;
  conflicted: boolean;
  version:    number;
}

export interface SyncConflictRecord {
  id:            string;
  title:         string;
  description:   string;
  localVersion:  Record<string, unknown>;
  serverVersion: Record<string, unknown>;
  resolution:    'local' | 'server' | 'merged' | 'pending';
  resolved:      boolean;
}

export interface SyncTestResultItem {
  id:          string;
  name:        string;
  description: string;
  status:      'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?:   number;
  error?:      string | null;
  category:    'queue' | 'conflict' | 'network' | 'integrity' | 'performance';
}

export interface SyncTestRun {
  id?:       number;
  results:   SyncTestResultItem[];
  passed:    number;
  failed:    number;
  total:     number;
  createdAt?: number;
}

export interface SyncStats {
  queue:     { total: number; pending: number; synced: number };
  conflicts: { unresolved: number };
  tests:     { passed: number; failed: number; total: number };
}

export const mobileSyncApiService = {
  // Queue
  getQueue: () =>
    api.get<SyncQueueRecord[]>('/sync/queue'),

  addQueueRecord: (data: SyncQueueRecord) =>
    api.post<SyncQueueRecord>('/sync/queue', data),

  updateQueueRecord: (id: string, data: Partial<Pick<SyncQueueRecord, 'synced' | 'conflicted' | 'version' | 'data'>>) =>
    api.put<SyncQueueRecord>(`/sync/queue/${id}`, data),

  deleteQueueRecord: (id: string) =>
    api.delete<{ message: string }>(`/sync/queue/${id}`),

  resetQueue: () =>
    api.post<{ message: string; count: number }>('/sync/queue/reset', {}),

  // Conflicts
  getConflicts: () =>
    api.get<SyncConflictRecord[]>('/sync/conflicts'),

  addConflict: (data: SyncConflictRecord) =>
    api.post<SyncConflictRecord>('/sync/conflicts', data),

  resolveConflict: (id: string, resolution: 'local' | 'server' | 'merged') =>
    api.put<SyncConflictRecord>(`/sync/conflicts/${id}`, { resolution }),

  deleteConflict: (id: string) =>
    api.delete<{ message: string }>(`/sync/conflicts/${id}`),

  // Test results
  getLatestTestRun: () =>
    api.get<SyncTestRun | null>('/sync/test-results'),

  saveTestRun: (results: SyncTestResultItem[]) =>
    api.post<{ id: number; passed: number; failed: number; total: number }>('/sync/test-results', { results }),

  updateTestResult: (runId: number, testId: string, status: SyncTestResultItem['status'], duration?: number, error?: string | null) =>
    api.put<SyncTestRun>(`/sync/test-results/${runId}`, { testId, status, duration, error }),

  // Stats
  getStats: () =>
    api.get<SyncStats>('/sync/stats'),
};

// ── Mobile Worker App ─────────────────────────────────────────────────────────

export interface WorkerChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  required: boolean;
}

export interface WorkerTask {
  id: string;
  title: string;
  type: 'inspection' | 'maintenance' | 'safety_check' | 'permit' | 'training';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  location: string;
  dueTime: string;
  assignedBy: string;
  description: string;
  checklist: WorkerChecklistItem[];
  syncStatus: 'synced' | 'pending' | 'failed';
}

export interface WorkerQuickReport {
  id: string;
  type: 'hazard' | 'near_miss' | 'unsafe_condition' | 'suggestion';
  title: string;
  description: string;
  location: string;
  photo?: string;
  timestamp: string;
  syncStatus: 'synced' | 'pending' | 'failed';
}

export interface WorkerEnvironmentalReading {
  type: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'danger';
}

export interface WorkerTaskStats {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
}

export const workerAppApiService = {
  getTasks: () =>
    api.get<WorkerTask[]>('/worker-app/tasks'),

  getTaskStats: () =>
    api.get<WorkerTaskStats>('/worker-app/tasks/stats'),

  seedTasks: () =>
    api.post<{ message: string; count: number; seeded: boolean }>('/worker-app/tasks/seed', {}),

  updateTaskStatus: (taskId: string, status: string) =>
    api.put<WorkerTask>(`/worker-app/tasks/${taskId}/status`, { status }),

  toggleChecklistItem: (taskId: string, itemId: string, completed: boolean) =>
    api.put<WorkerTask>(`/worker-app/tasks/${taskId}/checklist/${itemId}`, { completed }),

  getReports: () =>
    api.get<WorkerQuickReport[]>('/worker-app/reports'),

  createReport: (data: Omit<WorkerQuickReport, 'id' | 'timestamp' | 'syncStatus'>) =>
    api.post<WorkerQuickReport>('/worker-app/reports', data),

  getEnvironmental: () =>
    api.get<WorkerEnvironmentalReading[]>('/worker-app/environmental'),
};

// ── Near Miss Report Types & Service ─────────────────────────────────────────

export interface NearMissCorrectiveAction {
  id: string;
  action: string;
  assignedTo: string;
  assigneeEmail: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Completed' | 'Overdue';
  sendEmailNotification: boolean;
  completionNotes?: string;
}

export interface NearMissReportPayload {
  reportId: string;
  reportDate: string;
  reportTime: string;
  reportedBy: string;
  jobTitle: string;
  department: string;
  location: string;
  specificArea: string;
  industrySector: string;
  eventDate: string;
  eventTime: string;
  category: string;
  potentialSeverity: string;
  description: string;
  immediateActions: string;
  witnessList: string[];
  oshaReferences: string[];
  isoReferences: string[];
  internationalReferences: string[];
  contributingFactors: string[];
  rootCauseAnalysis: string;
  weatherCondition: string;
  ppeWorn: string[];
  equipmentInvolved: string[];
  correctiveActions: NearMissCorrectiveAction[];
  photos: string[];
  aiAnalysis: string;
}

export interface NearMissReportResponse extends NearMissReportPayload {
  id: number;
  userId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface NearMissAIAnalysisPayload {
  category: string;
  potentialSeverity: string;
  industrySector?: string;
  location?: string;
  specificArea?: string;
  oshaReferences?: string[];
  isoReferences?: string[];
  contributingFactors?: string[];
}

export const nearMissReportApiService = {
  getReports: () =>
    api.get<NearMissReportResponse[]>('/near-miss-reports'),

  createReport: (data: NearMissReportPayload) =>
    api.post<NearMissReportResponse>('/near-miss-reports', data),

  getReport: (id: number) =>
    api.get<NearMissReportResponse>(`/near-miss-reports/${id}`),

  updateCorrectiveActionStatus: (
    reportId: number,
    actionId: string,
    status: NearMissCorrectiveAction['status'],
    completionNotes?: string,
  ) =>
    api.put<NearMissReportResponse>(
      `/near-miss-reports/${reportId}/corrective-actions/${actionId}/status`,
      { status, ...(completionNotes !== undefined ? { completionNotes } : {}) },
    ),

  generateAIAnalysis: (data: NearMissAIAnalysisPayload) =>
    api.post<{ analysis: string; source: string }>('/near-miss-reports/ai-analysis', data),
};

// ============================================
// Form Configurator API Service
// ============================================

export interface FormFieldDef {
  id: string;
  type: 'text' | 'number' | 'email' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'time' | 'file' | 'signature' | 'location' | 'photo';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: { minLength?: number; maxLength?: number; pattern?: string; min?: number; max?: number };
  helpText?: string;
  conditional?: { dependsOn: string; showWhen: string };
}

export interface FormConfigPayload {
  clientId: string;
  name: string;
  description?: string;
  category?: string;
  fields?: FormFieldDef[];
  status?: 'draft' | 'published' | 'archived';
}

export interface FormConfigUpdatePayload {
  id: number;
  name?: string;
  description?: string;
  category?: string;
  fields?: FormFieldDef[];
  status?: 'draft' | 'published' | 'archived';
}

export interface FormConfigResponse {
  id: number;
  clientId: string;
  userId: number;
  name: string;
  description: string;
  category: string;
  fields: FormFieldDef[];
  status: 'draft' | 'published' | 'archived';
  createdAt: number;
  updatedAt: number;
}

export const formConfigApiService = {
  getAll: () =>
    api.get<FormConfigResponse[]>('/form-configs'),

  create: (data: FormConfigPayload) =>
    api.post<FormConfigResponse>('/form-configs', data),

  getById: (id: number) =>
    api.get<FormConfigResponse>(`/form-configs/${id}`),

  update: (id: number, data: Omit<FormConfigUpdatePayload, 'id'>) =>
    api.put<FormConfigResponse>(`/form-configs/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/form-configs/${id}`),
};

// ============================================
// Organization Settings Service
// ============================================

export interface OrgProfile {
  id: string;
  name: string;
  plan: 'starter' | 'professional' | 'enterprise';
  usersCount: number;
  facilities: number;
  logoUrl: string | null;
  industries: string[];
  regions: string[];
  language: string;
  timezone: string;
  dateFormat: string;
  units: 'imperial' | 'metric';
  updatedAt: number;
}

export type UpdateOrgProfilePayload = Partial<
  Pick<OrgProfile, 'name' | 'plan' | 'usersCount' | 'facilities' | 'logoUrl' | 'industries' | 'regions' | 'language' | 'timezone' | 'dateFormat' | 'units'>
>;

export interface OrgMember {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'user' | 'viewer';
  isActive: boolean;
  lastActive: number;
  createdAt: number;
}

export interface AddOrgMemberPayload {
  name: string;
  email: string;
  role?: 'owner' | 'admin' | 'manager' | 'user' | 'viewer';
}

export interface UpdateOrgMemberPayload {
  role?: 'owner' | 'admin' | 'manager' | 'user' | 'viewer';
  isActive?: boolean;
}

export interface OrgSecurityPolicy {
  id: number;
  policyName: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface UpdateSecurityPoliciesPayload {
  policies: Array<{ policyName: string; enabled: boolean }>;
}

export interface OrgAuditLogEntry {
  id: number;
  action: string;
  performer: string;
  details: string | null;
  createdAt: number;
}

export interface AddAuditLogPayload {
  action: string;
  performer?: string;
  details?: string;
}

export interface OrgApiKey {
  id: number;
  maskedKey: string;
  createdAt: number;
  updatedAt: number;
}

export interface RegenerateApiKeyResponse {
  maskedKey: string;
  regeneratedKey: string;
  updatedAt: number;
}

export const organizationApiService = {
  getProfile: () =>
    api.get<OrgProfile>('/organization'),

  updateProfile: (data: UpdateOrgProfilePayload) =>
    api.put<OrgProfile>('/organization', data),

  getMembers: () =>
    api.get<OrgMember[]>('/organization/members'),

  addMember: (data: AddOrgMemberPayload) =>
    api.post<OrgMember>('/organization/members', data),

  updateMember: (id: number, data: UpdateOrgMemberPayload) =>
    api.put<OrgMember>(`/organization/members/${id}`, data),

  removeMember: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/organization/members/${id}`),

  getSecurityPolicies: () =>
    api.get<OrgSecurityPolicy[]>('/organization/security-policies'),

  updateSecurityPolicies: (data: UpdateSecurityPoliciesPayload) =>
    api.put<OrgSecurityPolicy[]>('/organization/security-policies', data),

  getAuditLog: (params?: { limit?: number; offset?: number }) =>
    api.get<OrgAuditLogEntry[]>('/organization/audit-log', params as any),

  addAuditLogEntry: (data: AddAuditLogPayload) =>
    api.post<OrgAuditLogEntry>('/organization/audit-log', data),

  getApiKey: () =>
    api.get<OrgApiKey>('/organization/api-key'),

  regenerateApiKey: () =>
    api.post<RegenerateApiKeyResponse>('/organization/api-key/regenerate', {}),
};

// ============================================
// Pilot Program Service
// ============================================

export interface PilotBetaSite {
  id: number;
  name: string;
  department: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  enrolled: number;
  feedbackCount: number;
  startDate: string;
  daysLeft: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  notes: string | null;
  createdAt: number;
  updatedAt: number;
}

export type CreatePilotBetaSitePayload = {
  name: string;
  department?: string;
  status?: 'active' | 'completed' | 'paused';
  progress?: number;
  enrolled?: number;
  feedbackCount?: number;
  startDate?: string;
  daysLeft?: number;
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  notes?: string;
};

export interface PilotShadowingSession {
  id: number;
  observer: string;
  worker: string;
  site: string;
  date: string;
  findings: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: number;
  updatedAt: number;
}

export type CreatePilotShadowingSessionPayload = {
  observer: string;
  worker: string;
  site: string;
  findings: string;
  date?: string;
  severity?: 'low' | 'medium' | 'high';
  status?: 'open' | 'in-progress' | 'resolved';
};

export interface PilotFeedbackItem {
  id: number;
  type: 'bug' | 'idea' | 'praise';
  message: string;
  user: string;
  votes: number;
  date: string;
  createdAt: number;
  updatedAt: number;
}

export type CreatePilotFeedbackPayload = {
  type: 'bug' | 'idea' | 'praise';
  message: string;
  user?: string;
  date?: string;
};

export interface PilotStats {
  activePilots: number;
  totalEnrolled: number;
  feedbackItems: number;
  avgAdoption: number;
  uxIssuesFound: number;
  npsScore: number;
  changes: {
    activePilots: string;
    totalEnrolled: string;
    feedbackItems: string;
    avgAdoption: string;
    uxIssuesFound: string;
    npsScore: string;
  };
}

export const pilotProgramApiService = {
  getStats: () =>
    api.get<PilotStats>('/pilot/stats'),

  getSites: (params?: { status?: string; riskLevel?: string }) =>
    api.get<PilotBetaSite[]>('/pilot/sites', params as any),

  createSite: (data: CreatePilotBetaSitePayload) =>
    api.post<PilotBetaSite>('/pilot/sites', data),

  updateSite: (id: number, data: Partial<CreatePilotBetaSitePayload>) =>
    api.put<PilotBetaSite>(`/pilot/sites/${id}`, data),

  deleteSite: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/pilot/sites/${id}`),

  getShadowingSessions: (params?: { status?: string; severity?: string; site?: string }) =>
    api.get<PilotShadowingSession[]>('/pilot/shadowing', params as any),

  createShadowingSession: (data: CreatePilotShadowingSessionPayload) =>
    api.post<PilotShadowingSession>('/pilot/shadowing', data),

  updateShadowingSession: (id: number, data: Partial<CreatePilotShadowingSessionPayload & { status: string }>) =>
    api.put<PilotShadowingSession>(`/pilot/shadowing/${id}`, data),

  deleteShadowingSession: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/pilot/shadowing/${id}`),

  getFeedback: (params?: { type?: string }) =>
    api.get<PilotFeedbackItem[]>('/pilot/feedback', params as any),

  createFeedback: (data: CreatePilotFeedbackPayload) =>
    api.post<PilotFeedbackItem>('/pilot/feedback', data),

  voteFeedback: (id: number) =>
    api.post<PilotFeedbackItem>(`/pilot/feedback/${id}/vote`, {}),

  deleteFeedback: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/pilot/feedback/${id}`),
};

// ── Predictive Safety AI ────────────────────────────────────────────────────────

export interface PredictiveSafetyStats {
  modelAccuracy: number;
  predictionsMade: number;
  risksMitigated: number;
  activeAlerts: number;
}

export interface PredictiveRiskFactor {
  id: string;
  factor: string;
  weight: number;
  category: string;
  dataSource: string;
  currentValue: number;
  threshold: number;
}

export interface PredictiveRecommendation {
  id: string;
  action: string;
  priority: string;
  expectedImpact: number;
  cost: string;
  implementationTime: string;
  status: string;
  assignedTo?: string;
}

export interface PredictiveSafetyPrediction {
  id: string;
  dbId: number;
  type: string;
  title: string;
  description: string;
  location: string;
  department: string;
  probability: number;
  severity: string;
  timeframe: string;
  predictedDate: string;
  confidenceLevel: number;
  riskFactors: PredictiveRiskFactor[];
  recommendations: PredictiveRecommendation[];
  status: string;
  trend: string;
  historicalIncidents: number;
  lastUpdated: string;
  createdAt: number;
  updatedAt: number;
}

export type CreatePredictivePredictionPayload = {
  type?: string;
  title: string;
  description?: string;
  location?: string;
  department?: string;
  probability?: number;
  severity?: string;
  timeframe?: string;
  predictedDate?: string;
  confidenceLevel?: number;
  riskFactors?: PredictiveRiskFactor[];
  recommendations?: PredictiveRecommendation[];
  status?: string;
  trend?: string;
  historicalIncidents?: number;
};

export interface PredictiveInsight {
  id: number;
  type: string;
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  generatedAt: string;
  createdAt: number;
  updatedAt: number;
}

export type CreatePredictiveInsightPayload = {
  type?: string;
  title: string;
  description: string;
  confidence?: number;
  actionable?: boolean;
};

export interface PredictiveModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrainedDate: string;
  dataPoints: number;
  predictionsMade: number;
  successfulPredictions: number;
}

export const predictiveSafetyApiService = {
  getStats: () =>
    api.get<PredictiveSafetyStats>('/predictive-safety/stats'),

  getPredictions: (params?: { type?: string; status?: string }) =>
    api.get<PredictiveSafetyPrediction[]>('/predictive-safety/predictions', params as any),

  createPrediction: (data: CreatePredictivePredictionPayload) =>
    api.post<PredictiveSafetyPrediction>('/predictive-safety/predictions', data),

  updatePrediction: (id: string, data: Partial<CreatePredictivePredictionPayload & { status: string }>) =>
    api.put<PredictiveSafetyPrediction>(`/predictive-safety/predictions/${id}`, data),

  deletePrediction: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/predictive-safety/predictions/${id}`),

  updateRecommendation: (predId: string, recId: string, data: { status?: string; assignedTo?: string }) =>
    api.put<PredictiveSafetyPrediction>(`/predictive-safety/predictions/${predId}/recommendations/${recId}`, data),

  getInsights: () =>
    api.get<PredictiveInsight[]>('/predictive-safety/insights'),

  createInsight: (data: CreatePredictiveInsightPayload) =>
    api.post<PredictiveInsight>('/predictive-safety/insights', data),

  deleteInsight: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/predictive-safety/insights/${id}`),

  getModelMetrics: () =>
    api.get<PredictiveModelMetrics>('/predictive-safety/model-metrics'),
};

