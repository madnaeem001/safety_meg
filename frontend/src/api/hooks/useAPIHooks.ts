// Custom React Hooks for API Integration
// Ready for Youbase backend connection

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  api,
  APIResponse,
  Incident,
  BackendIncidentRecord,
  DashboardOverview,
  IncidentSubmissionPayload,
  IncidentStats,
  InvestigationRecord,
  CreateInvestigationPayload,
  RccaRecord,
  SaveRccaPayload,
  CapaRecord,
  CreateCapaPayload,
  ControlHierarchyItem,
  ControlRecord,
  SafetyObservation,
  TrainingRecord,
  TrainingCourseRecord,
  TrainingComplianceSummary,
  EmployeeTrainingSummary,
  TrainingExpiringRecord,
  TrainingAssignmentPayload,
  TrainingAssignmentRecord,
  AuditRecord,
  AuditFinding,
  AuditStatsSummary,
  CreateAuditPayload,
  CreateAuditFindingPayload,
  InspectionScheduleRecord,
  InspectionStatsSummary,
  InspectionSensorRecord,
  CreateInspectionPayload,
  RiskMatrixReference,
  RiskRegisterStats,
  RiskRegisterItem,
  CreateRiskRegisterPayload,
  PermitToWorkRecord,
  PermitToWorkStats,
  CreatePermitToWorkPayload,
  PermitApprovalPayload,
  AutomationRuleRecord,
  CreateAutomationRulePayload,
  WebhookRecord,
  CreateWebhookPayload,
  ESGMetrics,
  LeadingIndicators,
  dashboardService,
  incidentService,
  investigationService,
  capaService,
  controlService,
  observationService,
  trainingService,
  auditService,
  inspectionService,
  riskService,
  permitToWorkService,
  automationService,
  webhookApiService,
  esgService,
  leadingIndicatorsService,
  // NEW SERVICES
  analyticsService,
  notificationApiService,
  certificationApiService,
  chemicalsApiService,
  projectApiService,
  taskCommentApiService,
  workersApiService,
  contractorApiService,
  kpiApiService,
  regulationsApiService,
  standardsApiService,
  toolboxApiService,
  behaviorSafetyApiService,
  hygieneApiService,
  qualityApiService,
  supervisorApiService,
  assetsApiService,
  safetyProceduresApiService,
  complianceProceduresApiService,
  type ComplianceCalendarEventRecord,
  type ComplianceProcedureRecord,
  type GapAnalysisItemRecord,
  hazardReportsApiService,
  sensorApiService,
  authApiService,
  sprintApiService,
  epicApiService,
  retroApiService,
  sprintSettingsApiService,
  charterApiService,
  closureApiService,
  releasesApiService,
  velocityHistoryApiService,
  NotificationEventRecord,
  CreateAutomationEventPayload,
  automationEventService,
  sdsEquipmentService,
  geotagApiService,
  hubRiskPredictionService,
  hubAnalyticsService,
  aiAuditFormService,
  aiTrainingService,
  visualAuditService,
  bowTieApiService,
  standardCertApiService,
  // Types
  AiAuditFormSession,
  AiAuditCustomTemplate,
  SaveAuditFormSessionPayload,
  SaveAuditCustomTemplatePayload,
  AuditAnalysisPayload,
  AuditAnalysisResult,
  AiTrainingModule,
  AiLearningPath,
  AiCompetencyArea,
  AiGeneratedCourse,
  GenerateCoursePayload,
  VisualAuditResult,
  SaveVisualAuditPayload,
  VisualAuditStats,
  // Live stats
  DashboardLiveStats,
  DashboardComplianceAlert,
  // Types
  IncidentTrendData,
  SeverityBreakdown,
  DepartmentMetric,
  KPIMetric,
  BackendNotification,
  NotificationPreferences,
  CertificationRecord,
  ChemicalRecord,
  ProjectRecord,
  ProjectTaskRecord,
  TaskCommentRecord,
  WorkerRecord,
  ContractorRecord,
  KPIDefinition,
  KPIReading,
  RegulationRecord,
  StandardRecord,
  ToolboxTalkRecord,
  ToolboxTalkAIGenerationPayload,
  ToolboxTalkAIGenerationResponse,
  BBSObservation,
  SIFPrecursor,
  HygieneAssessment,
  HygieneSamplingPlan,
  HygieneStats,
  QualityNonConformity,
  SupervisorApproval,
  LeaderboardEntry,
  AssetRecord,
  SafetyProcedureRecord,
  PermitApplicationRecord,
  PermitApplicationStats,
  ApprovalStepRecord,
  SafetyChecklistItemRecord,
  HazardReportRecord,
  SensorConfigRecord,
  SensorReadingRecord,
  SprintRecord,
  EpicRecord,
  RetroRecord,
  RetroItemRecord,
  SprintSettingsRecord,
  CharterRecord,
  CharterDetailRecord,
  CharterStakeholderRecord,
  CharterGoalRecord,
  ClosureRecord,
  ClosureDetailRecord,
  ClosureDeliverableRecord,
  ClosureLessonRecord,
  ClosureReportRecord,
  ReleaseRecord,
  VelocityHistoryRecord,
  BowTieScenarioRecord,
  BowTieStats,
  StandardCertApiRecord,
  StandardCertStats,
  customChecklistsApiService,
  CustomChecklistRecord,
  CustomChecklistIndustry,
  complianceReportingService,
  type ComplianceReportRecord,
  type ComplianceMetricRecord,
  type RegulatoryRequirementRecord,
  type ComplianceReportingStats,
  permitAppsService,
  crossReferenceApiService,
  type StandardRelationshipRecord,
  type StandardRelationshipStats,
  customAppsApiService,
  type CustomAppRecord,
  type CustomAppElement,
  type CustomAppStats,
  customReportsApiService,
  type CustomReportRecord,
  type ReportElement,
  type CustomReportStats,
  dataSecurityApiService,
  type SsoProviderRecord,
  type SecurityAuditLogRecord,
  type DataSecurityStats,
  type RbacMatrix,
  emailNotificationApiService,
  type EmailTemplateRecord,
  type AutomationWorkflowRecord,
  type EmailCampaignRecord,
  type EmailNotificationStats,
  type ExecutiveKPIs,
  type LeadingIndicatorItem,
  type LaggingIndicatorItem,
  type SiteScoreItem,
  type MonthlyTrendItem,
  complianceFrameworksService,
  type ComplianceFrameworkRecord,
  type ComplianceFrameworkStats,
  jsaApiService,
  type JsaRecord,
  type JsaStats,
  hypercareApiService,
  type HypercareDemo,
  type HypercareChampion,
  type HypercareQrDeployment,
  type HypercareStats,
  heatmapIncidentApiService,
  type HeatmapIncident,
  type HeatmapIncidentStats,
  type HeatmapIncidentFilters,
  incidentAnalyticsService,
  type IncidentAnalyticsParams,
  type IncidentAnalyticsKPIs,
  type IncidentAnalyticsMonthlyItem,
  type IncidentAnalyticsWeeklyItem,
  type IncidentAnalyticsByTypeItem,
  type IncidentAnalyticsBySeverityItem,
  type IncidentAnalyticsByDepartmentItem,
  type IncidentAnalyticsByDayItem,
  type IncidentAnalyticsByTimeItem,
  type IncidentAnalyticsRootCauseItem,
  type IncidentAnalyticsLeadingIndicatorItem,
  landingApiService,
  type LandingStats,
  type DemoRequest,
  userPreferencesApiService,
  type UserPreferences,
  mobileSyncApiService,
  type SyncQueueRecord,
  type SyncConflictRecord,
  type SyncTestResultItem,
  type SyncStats,
  workerAppApiService,
  type WorkerTask,
  type WorkerQuickReport,
  type WorkerEnvironmentalReading,
  type WorkerTaskStats,
  nearMissReportApiService,
  type NearMissReportPayload,
  type NearMissReportResponse,
  type NearMissCorrectiveAction,
  type NearMissAIAnalysisPayload,
  formConfigApiService,
  type FormConfigPayload,
  type FormConfigUpdatePayload,
  type FormConfigResponse,
  organizationApiService,
  type OrgProfile,
  type UpdateOrgProfilePayload,
  type OrgMember,
  type AddOrgMemberPayload,
  type UpdateOrgMemberPayload,
  type OrgSecurityPolicy,
  type UpdateSecurityPoliciesPayload,
  type OrgAuditLogEntry,
  type AddAuditLogPayload,
  type OrgApiKey,
  type RegenerateApiKeyResponse,
  pilotProgramApiService,
  type PilotBetaSite,
  type CreatePilotBetaSitePayload,
  type PilotShadowingSession,
  type CreatePilotShadowingSessionPayload,
  type PilotFeedbackItem,
  type CreatePilotFeedbackPayload,
  type PilotStats,
  predictiveSafetyApiService,
  type PredictiveSafetyStats,
  type PredictiveSafetyPrediction,
  type CreatePredictivePredictionPayload,
  type PredictiveInsight,
  type CreatePredictiveInsightPayload,
  type PredictiveModelMetrics,
  milestoneApiService,
  rfiApiService,
  type MilestoneRecord,
  type RFIRecord,
} from '../services/apiService';

// ============================================
// Generic Data Fetching Hook
// ============================================

interface UseAPIOptions<T> {
  initialData?: T;
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseAPIResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  setData: (data: T | null) => void;
}

export function useAPI<T>(
  fetcher: () => Promise<APIResponse<T>>,
  options: UseAPIOptions<T> = {}
): UseAPIResult<T> {
  const { initialData, immediate = true, onSuccess, onError } = options;
  
  const [data, setData] = useState<T | null>(initialData ?? null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetcher();
      
      if (mountedRef.current) {
        setData(response.data);
        onSuccess?.(response.data);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err);
        onError?.(err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetcher, onSuccess, onError]);

  useEffect(() => {
    // Reset to true on every (re)mount — fixes React 18 StrictMode double-invoke:
    // StrictMode runs cleanup (sets false) then re-runs the effect, so we must
    // reset here so the async callback can still call setData after the refetch.
    mountedRef.current = true;

    if (immediate) {
      refetch();
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { data, loading, error, refetch, setData };
}

// ============================================
// Mutation Hook (Create, Update, Delete)
// ============================================

interface UseMutationOptions<T, P> {
  onSuccess?: (data: T, params: P) => void;
  onError?: (error: Error) => void;
}

interface UseMutationResult<T, P> {
  mutate: (params: P) => Promise<T | null>;
  loading: boolean;
  error: Error | null;
  data: T | null;
  reset: () => void;
}

export function useMutation<T, P = any>(
  mutationFn: (params: P) => Promise<APIResponse<T>>,
  options: UseMutationOptions<T, P> = {}
): UseMutationResult<T, P> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const mutate = useCallback(async (params: P): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await mutationFn(params);
      setData(response.data);
      options.onSuccess?.(response.data, params);
      return response.data;
    } catch (err: any) {
      setError(err);
      options.onError?.(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, options]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { mutate, loading, error, data, reset };
}

// ============================================
// Domain-Specific Hooks
// ============================================

export function useDashboardOverview() {
  return useAPI<DashboardOverview>(
    () => dashboardService.getOverview(),
    { immediate: true }
  );
}

export function useDashboardLiveStats() {
  return useAPI<DashboardLiveStats>(
    () => dashboardService.getLiveStats(),
    { immediate: true }
  );
}

export function useDashboardIncidents() {
  return useAPI<BackendIncidentRecord[]>(
    () => dashboardService.getIncidents(),
    { immediate: true }
  );
}

export function useDashboardComplianceAlerts() {
  return useAPI<DashboardComplianceAlert[]>(
    () => dashboardService.getComplianceAlerts(),
    { immediate: true }
  );
}

// Incidents Hook
export function useIncidents(params?: { status?: string; type?: string; page?: number; limit?: number }) {
  return useAPI<BackendIncidentRecord[]>(
    () => incidentService.getAll(params),
    { immediate: true }
  );
}

export function useIncident(id: string) {
  return useAPI<BackendIncidentRecord>(
    () => incidentService.getById(id),
    { immediate: !!id }
  );
}

export function useCreateIncident() {
  return useMutation<BackendIncidentRecord, IncidentSubmissionPayload>(
    (data) => incidentService.create(data)
  );
}

export function useUpdateIncident() {
  return useMutation<void, { id: string; data: Partial<BackendIncidentRecord> }>(
    ({ id, data }) => incidentService.update(id, data)
  );
}

export function useIncidentStatistics(period: string = 'month') {
  return useAPI<any>(
    () => incidentService.getStatistics(period),
    { immediate: true }
  );
}

export function useIncidentStats() {
  return useAPI<IncidentStats>(
    () => incidentService.getStats(),
    { immediate: true }
  );
}

export function useCloseIncident() {
  return useMutation<void, string>(
    (id) => incidentService.close(id)
  );
}

export function useReopenIncident() {
  return useMutation<void, string>(
    (id) => incidentService.reopen(id)
  );
}

export function useDeleteIncident() {
  return useMutation<void, string>(
    (id) => incidentService.delete(id)
  );
}

export function useInvestigations(params?: { status?: string; industry?: string }) {
  return useAPI<InvestigationRecord[]>(
    () => investigationService.getAll(params),
    { immediate: true }
  );
}

export function useInvestigationByIncident(incidentId: number | null) {
  return useAPI<InvestigationRecord>(
    () => investigationService.getByIncidentId(incidentId as number),
    { immediate: !!incidentId }
  );
}

export function useInvestigation(investigationId: number | null) {
  return useAPI<InvestigationRecord>(
    () => investigationService.getById(investigationId as number),
    { immediate: !!investigationId }
  );
}

export function useCreateInvestigation() {
  return useMutation<InvestigationRecord, CreateInvestigationPayload>(
    (data) => investigationService.create(data)
  );
}

export function useInvestigationRcca(investigationId: number | null) {
  return useAPI<RccaRecord>(
    () => investigationService.getRcca(investigationId as number),
    { immediate: !!investigationId }
  );
}

export function useSaveInvestigationRcca() {
  return useMutation<RccaRecord, { investigationId: number; data: SaveRccaPayload }>(
    ({ investigationId, data }) => investigationService.saveRcca(investigationId, data)
  );
}

export function useCapaRecords(params?: { status?: string; priority?: string; type?: string }) {
  return useAPI<CapaRecord[]>(
    () => capaService.getAll(params),
    { immediate: true }
  );
}

export function useCreateCapa() {
  return useMutation<CapaRecord, CreateCapaPayload>(
    (data) => capaService.create(data)
  );
}

export function useControlsHierarchy() {
  return useAPI<ControlHierarchyItem[]>(
    () => controlService.getHierarchy(),
    { immediate: true }
  );
}

export function useControls(params?: { status?: string; type?: string; riskLevel?: string }) {
  return useAPI<ControlRecord[]>(
    () => controlService.getAll(params),
    { immediate: true }
  );
}

// Safety Observations Hook
export function useSafetyObservations(params?: Record<string, any>) {
  return useAPI<SafetyObservation[]>(
    () => observationService.getAll(params),
    { immediate: true }
  );
}

export function useCreateObservation() {
  return useMutation<SafetyObservation, Partial<SafetyObservation>>(
    (data) => observationService.create(data)
  );
}

// Training Hooks
export function useTrainingCourses(params?: { category?: string; role?: string; active?: boolean }) {
  return useAPI<TrainingCourseRecord[]>(
    () => trainingService.getCourses(params),
    { immediate: true }
  );
}

export function useEmployeeTraining(employeeId: string) {
  return useAPI<EmployeeTrainingSummary>(
    () => trainingService.getByEmployee(employeeId),
    { immediate: !!employeeId }
  );
}

export function useTrainingCompliance() {
  return useAPI<TrainingComplianceSummary>(
    () => trainingService.getComplianceReport(),
    { immediate: true }
  );
}

export function useTrainingExpiring(days: number = 30) {
  return useAPI<TrainingExpiringRecord[]>(
    () => trainingService.getExpiring(days),
    { immediate: true }
  );
}

export function useAssignTraining() {
  return useMutation<TrainingAssignmentRecord, TrainingAssignmentPayload>(
    (data) => trainingService.assignCourse(data)
  );
}

// Audit Hooks
export function useAudits(params?: Record<string, any>) {
  return useAPI<AuditRecord[]>(
    () => auditService.getAll(params),
    { immediate: true }
  );
}

export function useAudit(id: number | null) {
  return useAPI<AuditRecord>(
    () => auditService.getById(id as number),
    { immediate: !!id }
  );
}

export function useAuditStats() {
  return useAPI<AuditStatsSummary>(
    () => auditService.getStats(),
    { immediate: true }
  );
}

export function useOpenAuditFindings(severity?: string) {
  return useAPI<AuditFinding[]>(
    () => auditService.getOpenFindings(severity),
    { immediate: true }
  );
}

export function useCreateAudit() {
  return useMutation<AuditRecord, CreateAuditPayload>(
    (data) => auditService.create(data)
  );
}

export function useCreateAuditFinding() {
  return useMutation<AuditFinding, { auditId: number; data: CreateAuditFindingPayload }>(
    ({ auditId, data }) => auditService.addFinding(auditId, data)
  );
}

export function useUpdateAuditFinding() {
  return useMutation<AuditFinding, { findingId: number; data: Partial<AuditFinding> }>(
    ({ findingId, data }) => auditService.updateFinding(findingId, data)
  );
}

export function useInspectionStats() {
  return useAPI<InspectionStatsSummary>(
    () => inspectionService.getStats(),
    { immediate: true }
  );
}

export function useInspectionSchedule(params?: { status?: string; type?: string; zone?: string; priority?: string }) {
  return useAPI<InspectionScheduleRecord[]>(
    () => inspectionService.getSchedule(params),
    { immediate: true }
  );
}

export function useInspection(id: number | null) {
  return useAPI<InspectionScheduleRecord>(
    () => inspectionService.getById(id as number),
    { immediate: !!id }
  );
}

export function useCreateInspection() {
  return useMutation<InspectionScheduleRecord, CreateInspectionPayload>(
    (data) => inspectionService.create(data)
  );
}

export function useInspectionSensors(params?: { type?: string; zone?: string; status?: string }) {
  return useAPI<InspectionSensorRecord[]>(
    () => inspectionService.getSensors(params),
    { immediate: true }
  );
}

export function useRiskMatrix() {
  return useAPI<RiskMatrixReference>(
    () => riskService.getMatrix(),
    { immediate: true }
  );
}

export function useRiskStats() {
  return useAPI<RiskRegisterStats>(
    () => riskService.getStats(),
    { immediate: true }
  );
}

export function useRiskRegister(params?: { status?: string; riskLevel?: string; department?: string }) {
  return useAPI<RiskRegisterItem[]>(
    () => riskService.getRegister(params),
    { immediate: true }
  );
}

export function useRiskRegisterItem(id: number | null) {
  return useAPI<RiskRegisterItem>(
    () => riskService.getRegisterItem(id as number),
    { immediate: !!id }
  );
}

export function useCreateRiskRegisterItem() {
  return useMutation<RiskRegisterItem, CreateRiskRegisterPayload>(
    (data) => riskService.createRegisterItem(data)
  );
}

export function useUpdateRiskRegisterItem() {
  return useMutation<RiskRegisterItem, { id: number; data: Partial<RiskRegisterItem> }>(
    ({ id, data }) => riskService.updateRegisterItem(id, data)
  );
}

export function usePermitToWorkStats() {
  return useAPI<PermitToWorkStats>(
    () => permitToWorkService.getStats(),
    { immediate: true }
  );
}

export function usePermitToWorkPermits(params?: { status?: string; permitType?: string; riskLevel?: string; department?: string }) {
  return useAPI<PermitToWorkRecord[]>(
    () => permitToWorkService.getPermits(params),
    { immediate: true }
  );
}

export function usePermitToWorkPermit(id: number | null) {
  return useAPI<PermitToWorkRecord>(
    () => permitToWorkService.getPermit(id as number),
    { immediate: !!id }
  );
}

export function useCreatePermitToWork() {
  return useMutation<PermitToWorkRecord, CreatePermitToWorkPayload>(
    (data) => permitToWorkService.createPermit(data)
  );
}

export function useUpdatePermitToWork() {
  return useMutation<PermitToWorkRecord, { id: number; data: Partial<CreatePermitToWorkPayload> & { status?: PermitToWorkRecord['status']; approvedBy?: string; actualStart?: string; actualEnd?: string } }>(
    ({ id, data }) => permitToWorkService.updatePermit(id, data)
  );
}

export function useApprovePermitToWork() {
  return useMutation<PermitToWorkRecord, { id: number; data: PermitApprovalPayload }>(
    ({ id, data }) => permitToWorkService.approvePermit(id, data)
  );
}

export function useRejectPermitToWork() {
  return useMutation<PermitToWorkRecord, { id: number; data: PermitApprovalPayload }>(
    ({ id, data }) => permitToWorkService.rejectPermit(id, data)
  );
}

export function useDeletePermitToWork() {
  return useMutation<{ message: string }, number>(
    (id) => permitToWorkService.deletePermit(id)
  );
}

export function useAutomationRules(params?: { active?: boolean }) {
  return useAPI<AutomationRuleRecord[]>(
    () => automationService.getRules(params),
    { immediate: true }
  );
}

export function useCreateAutomationRule() {
  return useMutation<AutomationRuleRecord, CreateAutomationRulePayload>(
    (data) => automationService.createRule(data)
  );
}

export function useUpdateAutomationRule() {
  return useMutation<AutomationRuleRecord, { id: number; data: Partial<CreateAutomationRulePayload> }>(
    ({ id, data }) => automationService.updateRule(id, data)
  );
}

export function useDeleteAutomationRule() {
  return useMutation<{ message: string }, number>(
    (id) => automationService.deleteRule(id)
  );
}

export function useTriggerAutomationRule() {
  return useMutation<{ message: string; ruleId: number; action: Record<string, unknown>; triggeredAt: number }, number>(
    (ruleId) => automationService.triggerRule(ruleId)
  );
}

export function useAutomationEvents(params?: { ruleId?: number; limit?: number }) {
  return useAPI<NotificationEventRecord[]>(
    () => automationEventService.getAll(params),
    { immediate: true }
  );
}

export function useCreateAutomationEvent() {
  return useMutation<NotificationEventRecord, CreateAutomationEventPayload>(
    (data) => automationEventService.create(data)
  );
}

export function useWebhooks() {
  return useAPI<WebhookRecord[]>(
    () => webhookApiService.getAll(),
    { immediate: true }
  );
}

export function useCreateWebhook() {
  return useMutation<WebhookRecord, CreateWebhookPayload>(
    (data) => webhookApiService.create(data)
  );
}

export function useUpdateWebhook() {
  return useMutation<WebhookRecord, { id: number; data: Partial<CreateWebhookPayload> }>(
    ({ id, data }) => webhookApiService.update(id, data)
  );
}

export function useDeleteWebhook() {
  return useMutation<{ message: string }, number>(
    (id) => webhookApiService.delete(id)
  );
}

// ESG Hooks (Ready for 2026 Integration)
export function useESGMetrics(period: string = 'quarter') {
  return useAPI<ESGMetrics>(
    () => esgService.getDashboard(period),
    { immediate: true }
  );
}

export function useEnvironmentalMetrics(period: string = 'month') {
  return useAPI<any>(
    () => esgService.getEnvironmental(period),
    { immediate: true }
  );
}

export function useSocialMetrics(period: string = 'month') {
  return useAPI<any>(
    () => esgService.getSocial(period),
    { immediate: true }
  );
}

export function useGovernanceMetrics(period: string = 'month') {
  return useAPI<any>(
    () => esgService.getGovernance(period),
    { immediate: true }
  );
}

export function useSubmitESGReport() {
  return useMutation<{ reportId: string }, ESGMetrics>(
    (data) => esgService.submitReport(data)
  );
}

// Leading Indicators Hooks (Predictive Analytics)
export function useLeadingIndicators(period: string = 'month') {
  return useAPI<LeadingIndicators>(
    () => leadingIndicatorsService.getIndicators(period),
    { immediate: true }
  );
}

// Executive Report Dashboard Hooks
export function useExecutiveKPIs() {
  return useAPI<ExecutiveKPIs>(
    () => analyticsService.getExecutiveKPIs(),
    { immediate: true }
  );
}

export function useLeadingIndicatorsArray(period: string = 'month') {
  return useAPI<LeadingIndicatorItem[]>(
    () => analyticsService.getLeadingIndicatorsArray(period),
    { immediate: true }
  );
}

export function useLaggingIndicators(period: string = 'month') {
  return useAPI<LaggingIndicatorItem[]>(
    () => analyticsService.getLaggingIndicators(period),
    { immediate: true }
  );
}

export function useSiteScorecard() {
  return useAPI<SiteScoreItem[]>(
    () => analyticsService.getSiteScorecard(),
    { immediate: true }
  );
}

export function useMonthlyTrend(months: number = 6) {
  return useAPI<MonthlyTrendItem[]>(
    () => analyticsService.getMonthlyTrend(months),
    { immediate: true }
  );
}

export function useAuditClosureTime() {
  return useAPI<{ avgDays: number; trend: number }>(
    () => leadingIndicatorsService.getAuditClosureTime(),
    { immediate: true }
  );
}

export function useTrainingEffectiveness() {
  return useAPI<{ score: number; trend: number }>(
    () => leadingIndicatorsService.getTrainingEffectiveness(),
    { immediate: true }
  );
}

export function usePredictiveRisk() {
  return useAPI<{ riskScore: number; factors: any[] }>(
    () => leadingIndicatorsService.getPredictiveRisk(),
    { immediate: true }
  );
}

export function useAnalyticsTrends(metrics: string[], period: string = 'year') {
  return useAPI<any[]>(
    () => leadingIndicatorsService.getTrends(metrics, period),
    { immediate: metrics.length > 0 }
  );
}

// ============================================
// Analytics Hooks (NEW)
// ============================================

export function useIncidentTrends(params?: { months?: number; department?: string }) {
  return useAPI<IncidentTrendData[]>(
    () => analyticsService.getIncidentTrends(params),
    { immediate: true }
  );
}

export function useSeverityBreakdown(params?: { from?: string; to?: string }) {
  return useAPI<SeverityBreakdown[]>(
    () => analyticsService.getSeverityBreakdown(params),
    { immediate: true }
  );
}

export function useDepartmentMetrics(params?: { from?: string; to?: string }) {
  return useAPI<DepartmentMetric[]>(
    () => analyticsService.getDepartmentMetrics(params),
    { immediate: true }
  );
}

export function useHeatmapData(params?: { from?: string; to?: string }) {
  return useAPI<any[]>(
    () => analyticsService.getHeatmapData(params),
    { immediate: true }
  );
}

export function useKPIMetricsAnalytics(year?: string) {
  return useAPI<KPIMetric[]>(
    () => analyticsService.getKPIMetrics(year),
    { immediate: true }
  );
}

export function useGenerateReport() {
  return useMutation<any, { type: string; from?: string; to?: string; department?: string; format?: string }>(
    (data) => analyticsService.generateReport(data)
  );
}

export function useScheduleReport() {
  return useMutation<any, any>(
    (data) => analyticsService.scheduleReport(data)
  );
}

export function useScheduledReports(status?: string) {
  return useAPI<any[]>(
    () => analyticsService.getScheduledReports(status),
    { immediate: true }
  );
}

export function useReportTemplates(type?: string) {
  return useAPI<any[]>(
    () => analyticsService.getReportTemplates(type),
    { immediate: true }
  );
}

export function useCreateReportTemplate() {
  return useMutation<any, any>(
    (data) => analyticsService.createReportTemplate(data)
  );
}

export function useToggleScheduleStatus() {
  return useMutation<any, { id: number; status: 'active' | 'paused' }>(
    ({ id, status }) => analyticsService.toggleScheduledStatus(id, status)
  );
}

export interface EmissionDetailItem {
  id: string;
  type: string;
  unit: string;
  actual: number;
  limit: number;
  status: 'Compliant' | 'Warning' | 'Exceeded';
  trend: 'up' | 'down' | 'stable';
}

export interface EmissionLogItem {
  id: string | number;
  date: string;
  facility: string;
  type: string;
  value: number;
  unit: string;
  recordedBy: string;
}

export interface EmissionsResponse {
  year: string;
  detailedEmissions: EmissionDetailItem[];
  logs: EmissionLogItem[];
  facilityBreakdown: { name: string; value: number }[];
  gasSensorReadings: any[];
  environmentalIncidents: number;
  anomaliesByZone: any[];
  summary: {
    totalGasReadings: number;
    totalAnomalies: number;
    environmentalIncidents: number;
    compliantCount: number;
    warningCount: number;
    exceededCount: number;
  };
}

export function useEmissionsData(year?: string) {
  return useAPI<EmissionsResponse>(
    () => analyticsService.getEmissionsData(year),
    { immediate: true }
  );
}

// ============================================
// Enterprise Command Center Hooks
// ============================================

export interface EnterpriseProjectHealth {
  id: number;
  name: string;
  status: 'on-track' | 'at-risk' | 'delayed';
  safetyScore: number;
  progress: number;
  incidents: number;
  lastAudit: string;
}

export interface EnterpriseStatsResponse {
  globalStats: {
    safetyScore: number;
    activeFacilities: number;
    totalWorkforce: number;
    criticalRisks: number;
    trainingRate: number;
    riskMitigationRate: number;
    capaResolutionRate: number;
  };
  projectHealth: EnterpriseProjectHealth[];
  aiInsights: {
    automatedWorkflows: number;
    activeAlerts: number;
    nearMissesLast30d: number;
    aiPredictionsTotal: number;
  };
}

export function useEnterpriseStats() {
  return useAPI<EnterpriseStatsResponse>(
    () => analyticsService.getEnterpriseStats(),
    { immediate: true }
  );
}


export function useBackendNotifications(params?: { userId?: string; type?: string; severity?: string; read?: boolean; limit?: number }) {
  return useAPI<BackendNotification[]>(
    () => notificationApiService.getAll(params),
    { immediate: true }
  );
}

export function useNotificationAlerts(params?: { userId?: string; severity?: string }) {
  return useAPI<BackendNotification[]>(
    () => notificationApiService.getAlerts(params),
    { immediate: true }
  );
}

export function useNotificationSettings(userId?: string) {
  return useAPI<{ preferences: NotificationPreferences; templates: any[] }>(
    () => notificationApiService.getSettings(userId),
    { immediate: true }
  );
}

export function useUpdateNotificationSettings() {
  return useMutation<void, NotificationPreferences>(
    (data) => notificationApiService.updateSettings(data)
  );
}

export function useMarkNotificationsRead() {
  return useMutation<{ updated: number }, number[]>(
    (ids) => notificationApiService.markRead(ids)
  );
}

export function useBroadcastNotification() {
  return useMutation<{ recipientCount: number }, any>(
    (data) => notificationApiService.broadcast(data)
  );
}

// ============================================
// Certification Hooks (NEW)
// ============================================

export function useCertifications(params?: { status?: string; department?: string; employeeId?: string }) {
  return useAPI<CertificationRecord[]>(
    () => certificationApiService.getAll(params),
    { immediate: true }
  );
}

export function useCertification(id: number | null) {
  return useAPI<CertificationRecord>(
    () => certificationApiService.getById(id as number),
    { immediate: !!id }
  );
}

export function useCreateCertification() {
  return useMutation<CertificationRecord, Partial<CertificationRecord>>(
    (data) => certificationApiService.create(data)
  );
}

export function useUpdateCertification() {
  return useMutation<CertificationRecord, { id: number; data: Partial<CertificationRecord> }>(
    ({ id, data }) => certificationApiService.update(id, data)
  );
}

export function useDeleteCertification() {
  return useMutation<void, number>(
    (id) => certificationApiService.delete(id)
  );
}

// ============================================
// Standard Certifications Hooks
// (CertificationTracker page — ISO / regulatory org-level certifications)
// ============================================

export function useStandardCertifications(params?: { status?: string; search?: string }) {
  return useAPI<StandardCertApiRecord[]>(
    () => standardCertApiService.getAll(params),
    { immediate: true }
  );
}

export function useStandardCertStats() {
  return useAPI<StandardCertStats>(
    () => standardCertApiService.getStats(),
    { immediate: true }
  );
}

export function useCreateStandardCert() {
  return useMutation<StandardCertApiRecord, Partial<StandardCertApiRecord>>(
    (data) => standardCertApiService.create(data)
  );
}

export function useUpdateStandardCert() {
  return useMutation<StandardCertApiRecord, { id: string | number; data: Partial<StandardCertApiRecord> }>(
    ({ id, data }) => standardCertApiService.update(id, data)
  );
}

// ============================================
// Custom Checklists Hooks (ChecklistBuilder page)
// ============================================

export function useCustomChecklists(params?: { industry?: CustomChecklistIndustry; search?: string }) {
  return useAPI<CustomChecklistRecord[]>(
    () => customChecklistsApiService.getAll(params),
    { immediate: true }
  );
}

export function useCreateCustomChecklist() {
  return useMutation<
    CustomChecklistRecord,
    Omit<CustomChecklistRecord, 'id' | 'createdAt' | 'updatedAt'>
  >((data) => customChecklistsApiService.create(data));
}

export function useUpdateCustomChecklist() {
  return useMutation<
    CustomChecklistRecord,
    { id: string | number; data: Partial<Omit<CustomChecklistRecord, 'id' | 'createdAt' | 'updatedAt'>> }
  >(({ id, data }) => customChecklistsApiService.update(id, data));
}

export function useDeleteCustomChecklist() {
  return useMutation<void, string | number>(
    (id) => customChecklistsApiService.delete(id)
  );
}

// ============================================
// Chemicals Hooks (NEW)
// ============================================

export function useChemicals(params?: { hazardClass?: string; location?: string; search?: string }) {
  return useAPI<ChemicalRecord[]>(
    () => chemicalsApiService.getAll(params),
    { immediate: true }
  );
}

export function useChemical(id: number | null) {
  return useAPI<ChemicalRecord>(
    () => chemicalsApiService.getById(id as number),
    { immediate: !!id }
  );
}

export function useCreateChemical() {
  return useMutation<ChemicalRecord, Partial<ChemicalRecord>>(
    (data) => chemicalsApiService.create(data)
  );
}

export function useUpdateChemical() {
  return useMutation<ChemicalRecord, { id: number; data: Partial<ChemicalRecord> }>(
    ({ id, data }) => chemicalsApiService.update(id, data)
  );
}

export function useDeleteChemical() {
  return useMutation<void, number>(
    (id) => chemicalsApiService.delete(id)
  );
}

// ============================================
// Projects Hooks (NEW)
// ============================================

export function useProjects(params?: { status?: string; department?: string }) {
  return useAPI<ProjectRecord[]>(
    () => projectApiService.getAll(params),
    { immediate: true }
  );
}

export function useProject(id: number | null) {
  return useAPI<ProjectRecord>(
    () => projectApiService.getById(id as number),
    { immediate: !!id }
  );
}

export function useCreateProject() {
  return useMutation<ProjectRecord, Partial<ProjectRecord>>(
    (data) => projectApiService.create(data)
  );
}

export function useProjectTasks(projectId: number | null) {
  return useAPI<ProjectTaskRecord[]>(
    () => projectApiService.getTasks(projectId as number),
    { immediate: !!projectId }
  );
}

export function useCreateProjectTask() {
  return useMutation<ProjectTaskRecord, { projectId: number; data: Partial<ProjectTaskRecord> }>(
    ({ projectId, data }) => projectApiService.createTask(projectId, data)
  );
}

export function useUpdateProjectTask() {
  return useMutation<ProjectTaskRecord, { projectId: number; taskId: number; data: Partial<ProjectTaskRecord> }>(
    ({ projectId, taskId, data }) => projectApiService.updateTask(projectId, taskId, data)
  );
}

export function useTaskComments(projectId?: number, taskId?: number) {
  return useAPI<TaskCommentRecord[]>(
    () => taskCommentApiService.getComments(projectId as number, taskId as number),
    { immediate: !!(projectId && taskId) }
  );
}

export function useAddTaskComment() {
  return useMutation<TaskCommentRecord, { projectId: number; taskId: number; author: string; content: string }>(
    ({ projectId, taskId, author, content }) =>
      taskCommentApiService.addComment(projectId, taskId, { author, content })
  );
}

export function useVelocityHistory(projectId?: number) {
  return useAPI<VelocityHistoryRecord[]>(
    () => velocityHistoryApiService.getAll(projectId as number),
    { immediate: !!projectId }
  );
}

export function useRecordVelocity() {
  return useMutation<
    VelocityHistoryRecord,
    { projectId: number; sprintLabel: string; committed: number; completed: number; carryover: number }
  >(({ projectId, ...data }) => velocityHistoryApiService.record(projectId, data));
}

// ============================================
// Sprint Hooks
// ============================================

export function useProjectSprints(params?: { status?: string; projectId?: number }) {
  return useAPI<SprintRecord[]>(
    () => sprintApiService.getAll(params),
    { immediate: true }
  );
}

export function useCreateSprint() {
  return useMutation<SprintRecord, Partial<SprintRecord>>(
    (data) => sprintApiService.create(data)
  );
}

export function useUpdateSprint() {
  return useMutation<SprintRecord, { id: number; data: Partial<SprintRecord> }>(
    ({ id, data }) => sprintApiService.update(id, data)
  );
}

export function useDeleteSprint() {
  return useMutation<void, number>(
    (id) => sprintApiService.delete(id)
  );
}

export function useSprintSettings(projectId?: number) {
  return useAPI<SprintSettingsRecord>(
    () => sprintSettingsApiService.get(projectId),
    { immediate: true }
  );
}

export function useSaveSprintSettings() {
  return useMutation<SprintSettingsRecord, Partial<SprintSettingsRecord>>(
    (data) => sprintSettingsApiService.save(data)
  );
}

// ============================================
// Epic Hooks
// ============================================

export function useProjectEpics(params?: { status?: string; projectId?: number }) {
  return useAPI<EpicRecord[]>(
    () => epicApiService.getAll(params),
    { immediate: true }
  );
}

export function useCreateEpic() {
  return useMutation<EpicRecord, Partial<EpicRecord> & { keyCode: string }>(
    (data) => epicApiService.create(data)
  );
}

export function useUpdateEpic() {
  return useMutation<EpicRecord, { id: number; data: Partial<EpicRecord> }>(
    ({ id, data }) => epicApiService.update(id, data)
  );
}

// ============================================
// Retrospective Hooks
// ============================================

export function useSprintRetro(sprintId: string | null) {
  return useAPI<RetroRecord>(
    () => retroApiService.getBySprintId(sprintId!),
    { immediate: !!sprintId }
  );
}

export function useVoteRetroSentiment() {
  return useMutation<RetroRecord, { sprintId: string; sentiment: 'happy' | 'neutral' | 'sad' }>(
    ({ sprintId, sentiment }) => retroApiService.voteSentiment(sprintId, sentiment)
  );
}

export function useAddRetroItem() {
  return useMutation<RetroItemRecord, { sprintId: string; data: Omit<RetroItemRecord, 'id' | 'retroId' | 'createdAt' | 'updatedAt'> }>(
    ({ sprintId, data }) => retroApiService.addItem(sprintId, data)
  );
}

export function useVoteRetroItem() {
  return useMutation<RetroItemRecord, number>(
    (itemId) => retroApiService.voteItem(itemId)
  );
}

export function useUpdateRetroItem() {
  return useMutation<RetroItemRecord, { id: number; data: Partial<Pick<RetroItemRecord, 'status' | 'votes' | 'content' | 'assignee' | 'dueDate'>> }>(
    ({ id, data }) => retroApiService.updateItem(id, data)
  );
}

export function useDeleteRetroItem() {
  return useMutation<void, number>(
    (id) => retroApiService.deleteItem(id)
  );
}

// ============================================
// Milestone Hooks
// ============================================

export function useProjectMilestones(params?: { status?: string; projectId?: number }) {
  return useAPI<MilestoneRecord[]>(
    () => milestoneApiService.getAll(params),
    { immediate: true }
  );
}

export function useCreateMilestone() {
  return useMutation<MilestoneRecord, Partial<MilestoneRecord>>(
    (data) => milestoneApiService.create(data)
  );
}

export function useUpdateMilestone() {
  return useMutation<MilestoneRecord, { id: string; data: Partial<MilestoneRecord> }>(
    ({ id, data }) => milestoneApiService.update(id, data)
  );
}

// ============================================
// RFI Register Hooks
// ============================================

export function useProjectRFI(params?: { status?: string; projectId?: number }) {
  return useAPI<RFIRecord[]>(
    () => rfiApiService.getAll(params),
    { immediate: true }
  );
}

export function useCreateRFI() {
  return useMutation<RFIRecord, Partial<RFIRecord>>(
    (data) => rfiApiService.create(data)
  );
}

export function useUpdateRFI() {
  return useMutation<RFIRecord, { id: string; data: Partial<RFIRecord> }>(
    ({ id, data }) => rfiApiService.update(id, data)
  );
}

// ============================================
// Project Schedule Hook
// ============================================

export function useProjectSchedule(projectId: number | null) {
  return useAPI<any>(
    () => projectApiService.getSchedule(projectId as number),
    { immediate: !!projectId }
  );
}

// ============================================
// Charter Hooks
// ============================================

export function useProjectCharters() {
  return useAPI<CharterRecord[]>(
    () => charterApiService.getAll(),
    { immediate: true }
  );
}

export function useCharterDetail(id: number | null) {
  return useAPI<CharterDetailRecord>(
    () => charterApiService.getById(id!),
    { immediate: id !== null }
  );
}

export function useUpdateCharter() {
  return useMutation<CharterRecord, { id: number; data: Partial<CharterRecord> }>(
    ({ id, data }) => charterApiService.update(id, data)
  );
}

export function useAddCharterStakeholder() {
  return useMutation<CharterStakeholderRecord, { charterId: number; data: Omit<CharterStakeholderRecord, 'id' | 'charterId' | 'createdAt'> }>(
    ({ charterId, data }) => charterApiService.addStakeholder(charterId, data)
  );
}

export function useDeleteCharterStakeholder() {
  return useMutation<void, { charterId: number; stakeholderId: number }>(
    ({ charterId, stakeholderId }) => charterApiService.deleteStakeholder(charterId, stakeholderId)
  );
}

export function useAddCharterGoal() {
  return useMutation<CharterGoalRecord, { charterId: number; data: Omit<CharterGoalRecord, 'id' | 'charterId' | 'createdAt'> }>(
    ({ charterId, data }) => charterApiService.addGoal(charterId, data)
  );
}

export function useDeleteCharterGoal() {
  return useMutation<void, { charterId: number; goalId: number }>(
    ({ charterId, goalId }) => charterApiService.deleteGoal(charterId, goalId)
  );
}

// ============================================
// Project Closure Hooks
// ============================================

export function useProjectClosures() {
  return useAPI<ClosureRecord[]>(
    () => closureApiService.getAll(),
    { immediate: true }
  );
}

export function useClosureDetail(id: number | null) {
  return useAPI<ClosureDetailRecord>(
    () => closureApiService.getById(id!),
    { immediate: id !== null }
  );
}

export function useAddClosureDeliverable() {
  return useMutation<ClosureDeliverableRecord, { closureId: number; data: Omit<ClosureDeliverableRecord, 'id' | 'closureId' | 'createdAt'> }>(
    ({ closureId, data }) => closureApiService.addDeliverable(closureId, data)
  );
}

export function useUpdateClosureDeliverable() {
  return useMutation<ClosureDeliverableRecord, { closureId: number; deliverableId: number; data: Partial<Pick<ClosureDeliverableRecord, 'status' | 'approver' | 'date'>> }>(
    ({ closureId, deliverableId, data }) => closureApiService.updateDeliverable(closureId, deliverableId, data)
  );
}

export function useDeleteClosureDeliverable() {
  return useMutation<void, { closureId: number; deliverableId: number }>(
    ({ closureId, deliverableId }) => closureApiService.deleteDeliverable(closureId, deliverableId)
  );
}

export function useAddClosureLesson() {
  return useMutation<ClosureLessonRecord, { closureId: number; data: Omit<ClosureLessonRecord, 'id' | 'closureId' | 'createdAt'> }>(
    ({ closureId, data }) => closureApiService.addLesson(closureId, data)
  );
}

export function useDeleteClosureLesson() {
  return useMutation<void, { closureId: number; lessonId: number }>(
    ({ closureId, lessonId }) => closureApiService.deleteLesson(closureId, lessonId)
  );
}

export function useArchiveClosure() {
  return useMutation<ClosureRecord, number>(
    (closureId) => closureApiService.archive(closureId)
  );
}

export function useGenerateClosureReport() {
  return useMutation<ClosureReportRecord, number>(
    (closureId) => closureApiService.generateReport(closureId)
  );
}

// ============================================
// Workers Hooks (NEW)
// ============================================

export function useWorkers(params?: { department?: string; role?: string; status?: string }) {
  return useAPI<WorkerRecord[]>(
    () => workersApiService.getAll(params),
    { immediate: true }
  );
}

export function useWorker(userId: number | null) {
  return useAPI<WorkerRecord>(
    () => workersApiService.getById(userId as number),
    { immediate: !!userId }
  );
}

export function useCreateWorker() {
  return useMutation<WorkerRecord, Partial<WorkerRecord>>(
    (data) => workersApiService.create(data)
  );
}

export function useUpdateWorker() {
  return useMutation<WorkerRecord, { userId: number; data: Partial<WorkerRecord> }>(
    ({ userId, data }) => workersApiService.update(userId, data)
  );
}

export function useWorkerTrainings(userId: number | null) {
  return useAPI<any[]>(
    () => workersApiService.getTrainings(userId as number),
    { immediate: !!userId }
  );
}

export function useWorkerPerformance(userId: number | null) {
  return useAPI<any>(
    () => workersApiService.getPerformance(userId as number),
    { immediate: !!userId }
  );
}

// ============================================
// Contractors Hooks (NEW)
// ============================================

export function useContractors(params?: { status?: string; serviceType?: string }) {
  return useAPI<ContractorRecord[]>(
    () => contractorApiService.getAll(params),
    { immediate: true }
  );
}

export function useContractor(id: number | null) {
  return useAPI<ContractorRecord>(
    () => contractorApiService.getById(id as number),
    { immediate: !!id }
  );
}

export function useCreateContractor() {
  return useMutation<ContractorRecord, Partial<ContractorRecord>>(
    (data) => contractorApiService.create(data)
  );
}

export function useContractorPermits(contractorId: number | null, params?: { status?: string }) {
  return useAPI<any[]>(
    () => contractorApiService.getPermits(contractorId as number, params),
    { immediate: !!contractorId }
  );
}

export function useUpdateContractor() {
  return useMutation<ContractorRecord, { id: number; data: Partial<ContractorRecord> }>(
    ({ id, data }) => contractorApiService.update(id, data)
  );
}

// ============================================
// Contractor Permit Applications Hooks
// ============================================

export function usePermitApplicationStats() {
  return useAPI<PermitApplicationStats>(
    () => permitAppsService.getStats(),
    { immediate: true }
  );
}

export function usePermitApplications(params?: { status?: string; type?: string; contractorId?: string; search?: string }) {
  return useAPI<PermitApplicationRecord[]>(
    () => permitAppsService.getAll(params),
    { immediate: true }
  );
}

export function usePermitApplication(id: number | string | null) {
  return useAPI<PermitApplicationRecord>(
    () => permitAppsService.getById(id as number),
    { immediate: !!id }
  );
}

export function useCreatePermitApplication() {
  return useMutation<PermitApplicationRecord, Partial<PermitApplicationRecord>>(
    (data) => permitAppsService.create(data)
  );
}

export function useUpdatePermitApplication() {
  return useMutation<PermitApplicationRecord, { id: number | string; data: Partial<PermitApplicationRecord> }>(
    ({ id, data }) => permitAppsService.update(id, data)
  );
}

export function useDeletePermitApplication() {
  return useMutation<void, number | string>(
    (id) => permitAppsService.delete(id)
  );
}

export function useApprovePermitApplication() {
  return useMutation<PermitApplicationRecord, { id: number | string; approverName?: string; approverRole?: string; comments?: string }>(
    ({ id, ...rest }) => permitAppsService.approve(id, rest)
  );
}

export function useRejectPermitApplication() {
  return useMutation<PermitApplicationRecord, { id: number | string; approverName?: string; approverRole?: string; comments?: string }>(
    ({ id, ...rest }) => permitAppsService.reject(id, rest)
  );
}

// ============================================
// KPI Hooks (NEW)
// ============================================

export function useKPIDefinitions(params?: { category?: string; active?: boolean }) {
  return useAPI<KPIDefinition[]>(
    () => kpiApiService.getDefinitions(params),
    { immediate: true }
  );
}

export function useKPIReadings(params?: { kpiCode?: string; from?: string; to?: string }) {
  return useAPI<KPIReading[]>(
    () => kpiApiService.getReadings(params),
    { immediate: true }
  );
}

export function useKPIStats() {
  return useAPI<any>(
    () => kpiApiService.getStats(),
    { immediate: true }
  );
}

export function useKPIDashboard() {
  return useAPI<any>(
    () => kpiApiService.getDashboard(),
    { immediate: true }
  );
}

export function useCreateKPIReading() {
  return useMutation<KPIReading, Partial<KPIReading>>(
    (data) => kpiApiService.createReading(data)
  );
}

export function useKPIDepartmentComparison() {
  return useAPI<{ dept: string; leading: number; lagging: number }[]>(
    () => kpiApiService.getDepartmentComparison(),
    { immediate: true }
  );
}

export function useKPIIncidentBreakdown() {
  return useAPI<{ name: string; value: number; color: string }[]>(
    () => kpiApiService.getIncidentBreakdown(),
    { immediate: true }
  );
}

// ============================================
// Landing Page Hooks
// ============================================

export function useLandingStats() {
  return useAPI<LandingStats>(
    () => landingApiService.getStats(),
    { immediate: true }
  );
}

export function useCreateDemoRequest() {
  return useMutation<{ id: number; message: string }, Omit<DemoRequest, 'id' | 'status' | 'createdAt'>>(
    (data) => landingApiService.createDemoRequest(data)
  );
}

export function useLoadUserPreferences() {
  return useAPI<UserPreferences>(
    () => userPreferencesApiService.get(),
    { immediate: true }
  );
}

export function useSaveLanguagePreference() {
  return useMutation<UserPreferences, UserPreferences>(
    (data) => userPreferencesApiService.save(data)
  );
}

// ============================================
// Regulations Hooks (NEW)
// ============================================

export function useRegulations(
  params?: { jurisdiction?: string; industry?: string; status?: string; search?: string },
  options: UseAPIOptions<RegulationRecord[]> = {}
) {
  return useAPI<RegulationRecord[]>(
    () => regulationsApiService.getAll(params),
    { immediate: true, ...options }
  );
}

export function useRegulation(id: number | null) {
  return useAPI<RegulationRecord>(
    () => regulationsApiService.getById(id as number),
    { immediate: !!id }
  );
}

export function useCreateRegulation() {
  return useMutation<RegulationRecord, Partial<RegulationRecord>>(
    (data) => regulationsApiService.create(data)
  );
}

export function useUpdateRegulation() {
  return useMutation<RegulationRecord, { id: number; data: Partial<RegulationRecord> }>(
    ({ id, data }) => regulationsApiService.update(id, data)
  );
}

export function useDeleteRegulation() {
  return useMutation<void, number>(
    (id) => regulationsApiService.delete(id)
  );
}

// ============================================
// Standards Hooks (NEW)
// ============================================

export function useStandards(params?: { issuingBody?: string; category?: string; status?: string; search?: string }) {
  return useAPI<StandardRecord[]>(
    () => standardsApiService.getAll(params),
    { immediate: true }
  );
}

export function useNFPACodes(params?: { codeNumber?: string; topic?: string; search?: string }) {
  return useAPI<any[]>(
    () => standardsApiService.getNFPACodes(params),
    { immediate: true }
  );
}

export function useCreateStandard() {
  return useMutation<StandardRecord, Partial<StandardRecord>>(
    (data) => standardsApiService.create(data)
  );
}

// ============================================
// Cross-Reference Matrix Hooks (NEW)
// ============================================

export function useStandardRelationships(params?: { type?: string; sourceId?: string; targetId?: string; search?: string }) {
  return useAPI<StandardRelationshipRecord[]>(
    () => crossReferenceApiService.getAll(params),
    { immediate: true }
  );
}

export function useStandardRelationshipStats() {
  return useAPI<StandardRelationshipStats>(
    () => crossReferenceApiService.getStats(),
    { immediate: true }
  );
}

export function useCreateStandardRelationship() {
  return useMutation<StandardRelationshipRecord, Partial<StandardRelationshipRecord>>(
    (data) => crossReferenceApiService.create(data)
  );
}

export function useUpdateStandardRelationship() {
  return useMutation<StandardRelationshipRecord, { id: number; data: Partial<StandardRelationshipRecord> }>(
    ({ id, data }) => crossReferenceApiService.update(id, data)
  );
}

export function useDeleteStandardRelationship() {
  return useMutation<void, number>(
    (id) => crossReferenceApiService.delete(id)
  );
}

// ============================================
// Toolbox Talks Hooks (NEW)
// ============================================

export function useToolboxTalks(params?: { category?: string; department?: string; status?: string }) {
  return useAPI<ToolboxTalkRecord[]>(
    () => toolboxApiService.getAll(params),
    { immediate: true }
  );
}

export function useToolboxTalk(id: number | null) {
  return useAPI<ToolboxTalkRecord>(
    () => toolboxApiService.getById(id as number),
    { immediate: !!id }
  );
}

export function useCreateToolboxTalk() {
  return useMutation<ToolboxTalkRecord, Partial<ToolboxTalkRecord>>(
    (data) => toolboxApiService.create(data)
  );
}

export function useAttendToolboxTalk() {
  return useMutation<any, { id: number; data: { attendees: Array<{ employeeName: string; employeeId?: string; department?: string; signature?: boolean }> } }>(
    ({ id, data }) => toolboxApiService.attend(id, data)
  );
}

export function useGenerateToolboxTalk() {
  return useMutation<ToolboxTalkAIGenerationResponse, ToolboxTalkAIGenerationPayload>(
    (data) => toolboxApiService.generateAI(data)
  );
}

// ============================================
// BBS & SIF Hooks (NEW)
// ============================================

export function useBBSObservations(params?: { department?: string; type?: string; status?: string }) {
  return useAPI<BBSObservation[]>(
    () => behaviorSafetyApiService.getObservations(params),
    { immediate: true }
  );
}

export function useCreateBBSObservation() {
  return useMutation<BBSObservation, Partial<BBSObservation>>(
    (data) => behaviorSafetyApiService.createObservation(data)
  );
}

export function useSIFPrecursors(params?: { department?: string; severity?: string; status?: string }) {
  return useAPI<SIFPrecursor[]>(
    () => behaviorSafetyApiService.getSIFPrecursors(params),
    { immediate: true }
  );
}

export function useCreateSIFPrecursor() {
  return useMutation<SIFPrecursor, Partial<SIFPrecursor>>(
    (data) => behaviorSafetyApiService.createSIFPrecursor(data)
  );
}

// ── Hygiene Hooks ────────────────────────────────────────────────────────────

export function useHygieneAssessments(params?: { hazardType?: string; department?: string; status?: string }) {
  return useAPI<HygieneAssessment[]>(
    () => hygieneApiService.getAssessments(params),
    { immediate: true }
  );
}

export function useHygieneById(id: number) {
  return useAPI<HygieneAssessment>(
    () => hygieneApiService.getAssessmentById(id),
    { immediate: !!id }
  );
}

export function useHygieneStats() {
  return useAPI<HygieneStats>(
    () => hygieneApiService.getStats(),
    { immediate: true }
  );
}

export function useHygieneMonitoring() {
  return useAPI<any>(
    () => hygieneApiService.getMonitoring(),
    { immediate: true }
  );
}

export function useCreateHygieneAssessment() {
  return useMutation<HygieneAssessment, Partial<HygieneAssessment>>(
    (data) => hygieneApiService.createAssessment(data)
  );
}

export function useUpdateHygieneAssessmentMutation() {
  return useMutation<HygieneAssessment, { id: number; data: Partial<HygieneAssessment> }>(
    ({ id, data }) => hygieneApiService.updateAssessment(id, data)
  );
}

export function useDeleteHygieneAssessmentMutation() {
  return useMutation<{ message: string }, number>(
    (id) => hygieneApiService.deleteAssessment(id)
  );
}

export function usePatchHygieneAssessmentStatusMutation() {
  return useMutation<HygieneAssessment, { id: number; status: string }>(
    ({ id, status }) => hygieneApiService.patchAssessmentStatus(id, status)
  );
}

export function useHygieneSamplingPlans(params?: { status?: string; agent?: string }) {
  return useAPI<HygieneSamplingPlan[]>(
    () => hygieneApiService.getSamplingPlans(params),
    { immediate: true }
  );
}

export function useHygieneSamplingPlanById(id: number) {
  return useAPI<HygieneSamplingPlan>(
    () => hygieneApiService.getSamplingPlanById(id),
    { immediate: !!id }
  );
}

export function useCreateHygieneSamplingPlanMutation() {
  return useMutation<HygieneSamplingPlan, Partial<HygieneSamplingPlan>>(
    (data) => hygieneApiService.createSamplingPlan(data)
  );
}

export function useUpdateHygieneSamplingPlanMutation() {
  return useMutation<HygieneSamplingPlan, { id: number; data: Partial<HygieneSamplingPlan> }>(
    ({ id, data }) => hygieneApiService.updateSamplingPlan(id, data)
  );
}

export function useDeleteHygieneSamplingPlanMutation() {
  return useMutation<{ message: string }, number>(
    (id) => hygieneApiService.deleteSamplingPlan(id)
  );
}

export function usePatchSamplingPlanStatusMutation() {
  return useMutation<HygieneSamplingPlan, { id: number; status: string }>(
    ({ id, status }) => hygieneApiService.patchSamplingPlanStatus(id, status)
  );
}

// ============================================
// Quality Hooks (NEW)
// ============================================

export function useQualityMetrics() {
  return useAPI<any>(
    () => qualityApiService.getMetrics(),
    { immediate: true }
  );
}

export function useNonConformities(params?: { department?: string; severity?: string; status?: string }) {
  return useAPI<QualityNonConformity[]>(
    () => qualityApiService.getNonConformities(params),
    { immediate: true }
  );
}

export function useCreateNonConformity() {
  return useMutation<QualityNonConformity, Partial<QualityNonConformity>>(
    (data) => qualityApiService.createNonConformity(data)
  );
}

// ============================================
// Supervisor Hooks (NEW)
// ============================================

export function useSupervisorApprovals(params?: { status?: string; assignedTo?: string; type?: string }) {
  return useAPI<SupervisorApproval[]>(
    () => supervisorApiService.getApprovals(params),
    { immediate: true }
  );
}

export function useCreateApproval() {
  return useMutation<SupervisorApproval, Partial<SupervisorApproval>>(
    (data) => supervisorApiService.createApproval(data)
  );
}

export function useApproveRequest() {
  return useMutation<SupervisorApproval, { id: number; data: { approvedBy: string; notes?: string } }>(
    ({ id, data }) => supervisorApiService.approveRequest(id, data)
  );
}

export function useRejectRequest() {
  return useMutation<SupervisorApproval, { id: number; data: { approvedBy: string; notes?: string } }>(
    ({ id, data }) => supervisorApiService.rejectRequest(id, data)
  );
}

export function useLeaderboard(params?: { department?: string; period?: string; limit?: number }) {
  return useAPI<LeaderboardEntry[]>(
    () => supervisorApiService.getLeaderboard(params),
    { immediate: true }
  );
}

export function useTeamMetrics(params?: { department?: string }) {
  return useAPI<any>(
    () => supervisorApiService.getTeamMetrics(params),
    { immediate: true }
  );
}

// ============================================
// Assets Hooks (NEW)
// ============================================

export function useAssets(params?: { category?: string; status?: string; department?: string }) {
  return useAPI<AssetRecord[]>(
    () => assetsApiService.getAll(params),
    { immediate: true }
  );
}

export function useAsset(id: number | null) {
  return useAPI<AssetRecord>(
    () => assetsApiService.getById(id as number),
    { immediate: !!id }
  );
}

export function useCreateAsset() {
  return useMutation<AssetRecord, Partial<AssetRecord>>(
    (data) => assetsApiService.create(data)
  );
}

export function useUpdateAsset() {
  return useMutation<AssetRecord, { id: number; data: Partial<AssetRecord> }>(
    ({ id, data }) => assetsApiService.update(id, data)
  );
}

export function useDeleteAsset() {
  return useMutation<void, number>(
    (id) => assetsApiService.delete(id)
  );
}

export function useAssetMaintenance(assetId: number | null) {
  return useAPI<any[]>(
    () => assetsApiService.getMaintenanceHistory(assetId as number),
    { immediate: !!assetId }
  );
}

export function useAssetByQR(qrCode: string | null) {
  return useAPI<AssetRecord>(
    () => assetsApiService.scanQR(qrCode as string),
    { immediate: !!qrCode }
  );
}

// ============================================
// Safety Procedures Hooks (NEW)
// ============================================

export function useSafetyProcedures(params?: { category?: string; department?: string; status?: string; search?: string }) {
  return useAPI<SafetyProcedureRecord[]>(
    () => safetyProceduresApiService.getAll(params),
    { immediate: true }
  );
}

export function useSafetyProcedure(id: number | null) {
  return useAPI<SafetyProcedureRecord>(
    () => safetyProceduresApiService.getById(id as number),
    { immediate: !!id }
  );
}

export function useCreateSafetyProcedure() {
  return useMutation<SafetyProcedureRecord, Partial<SafetyProcedureRecord>>(
    (data) => safetyProceduresApiService.create(data)
  );
}

export function useUpdateSafetyProcedure() {
  return useMutation<SafetyProcedureRecord, { id: number; data: Partial<SafetyProcedureRecord> }>(
    ({ id, data }) => safetyProceduresApiService.update(id, data)
  );
}

export function useDeleteSafetyProcedure() {
  return useMutation<void, number>(
    (id) => safetyProceduresApiService.delete(id)
  );
}

// ============================================
// Compliance Hooks (NEW)
// ============================================

export function useComplianceProcedures(params?: { category?: string; status?: string; search?: string }) {
  return useAPI<ComplianceProcedureRecord[]>(
    () => complianceProceduresApiService.getAll(params),
    { immediate: true }
  );
}

export function useComplianceRequirements(params?: { status?: string; standard?: string }) {
  return useAPI<any[]>(
    () => complianceProceduresApiService.getRequirements(params),
    { immediate: true }
  );
}

export function useComplianceGapAnalysis(params?: { status?: string; standard?: string }) {
  return useAPI<GapAnalysisItemRecord[]>(
    () => complianceProceduresApiService.getGapAnalysis(params),
    { immediate: true }
  );
}

export function useUpdateGapItem() {
  return useMutation<GapAnalysisItemRecord, { id: number; data: Partial<GapAnalysisItemRecord> }>(
    ({ id, data }) => complianceProceduresApiService.updateGapItem(id, data)
  );
}

export function useCreateGapItem() {
  return useMutation<GapAnalysisItemRecord, Partial<GapAnalysisItemRecord> & { title: string }>(
    (data) => complianceProceduresApiService.createGapItem(data)
  );
}

export function useComplianceCalendar(params?: { status?: string; year?: string; month?: string; eventType?: string; priority?: string; from?: string; to?: string; department?: string }) {
  return useAPI<ComplianceCalendarEventRecord[]>(
    () => complianceProceduresApiService.getCalendar(params),
    { immediate: true }
  );
}

export function useCreateComplianceEvent() {
  return useMutation<any, any>(
    (data) => complianceProceduresApiService.createCalendarEvent(data)
  );
}

// ============================================
// Compliance Reporting Hooks
// ============================================

export function useComplianceReportingStats() {
  return useAPI<ComplianceReportingStats>(
    () => complianceReportingService.getStats(),
    { immediate: true }
  );
}

export function useComplianceReports(params?: { type?: string; status?: string }) {
  return useAPI<ComplianceReportRecord[]>(
    () => complianceReportingService.getReports(params),
    { immediate: true }
  );
}

export function useComplianceMetrics(params?: { category?: string; status?: string }) {
  return useAPI<ComplianceMetricRecord[]>(
    () => complianceReportingService.getMetrics(params),
    { immediate: true }
  );
}

export function useRegulatoryRequirements(params?: { status?: string }) {
  return useAPI<RegulatoryRequirementRecord[]>(
    () => complianceReportingService.getRequirements(params),
    { immediate: true }
  );
}

export function useCreateComplianceReport() {
  return useMutation<ComplianceReportRecord, Partial<ComplianceReportRecord> & { name: string }>(
    (data) => complianceReportingService.createReport(data)
  );
}

export function useUpdateComplianceReport() {
  return useMutation<ComplianceReportRecord, { id: string | number; data: Partial<ComplianceReportRecord> }>(
    ({ id, data }) => complianceReportingService.updateReport(id, data)
  );
}

export function useDeleteComplianceReport() {
  return useMutation<{ message: string }, string | number>(
    (id) => complianceReportingService.deleteReport(id)
  );
}

export function useUpdateComplianceMetric() {
  return useMutation<ComplianceMetricRecord, { id: string | number; data: Partial<ComplianceMetricRecord> }>(
    ({ id, data }) => complianceReportingService.updateMetric(id, data)
  );
}

export function useUpdateRegulatoryRequirement() {
  return useMutation<RegulatoryRequirementRecord, { id: string | number; data: Partial<RegulatoryRequirementRecord> }>(
    ({ id, data }) => complianceReportingService.updateRequirement(id, data)
  );
}

// ============================================
// Hazard Reports Hooks (NEW)
// ============================================

export function useHazardReports(params?: { department?: string; type?: string; status?: string; riskLevel?: string }) {
  return useAPI<HazardReportRecord[]>(
    () => hazardReportsApiService.getAll(params),
    { immediate: true }
  );
}

export function useCreateHazardReport() {
  return useMutation<HazardReportRecord, Partial<HazardReportRecord>>(
    (data) => hazardReportsApiService.create(data)
  );
}

// ============================================
// Sensor Hooks (NEW)
// ============================================

export function useSensors(params?: { type?: string; zone?: string; status?: string }) {
  return useAPI<SensorConfigRecord[]>(
    () => sensorApiService.getAll(params),
    { immediate: true }
  );
}

export function useSensor(sensorId: string | null) {
  return useAPI<SensorConfigRecord>(
    () => sensorApiService.getById(sensorId as string),
    { immediate: !!sensorId }
  );
}

export function useSensorReadings(params?: { sensorId?: string; from?: string; to?: string; limit?: number }) {
  return useAPI<SensorReadingRecord[]>(
    () => sensorApiService.getReadings(params),
    { immediate: true }
  );
}

export function useCalibrateSensor() {
  return useMutation<any, { sensorId: string; data: any }>(
    ({ sensorId, data }) => sensorApiService.calibrate(sensorId, data)
  );
}

export function useUpdateSensor() {
  return useMutation<SensorConfigRecord, { sensorId: string; data: Partial<SensorConfigRecord> }>(
    ({ sensorId, data }) => sensorApiService.update(sensorId, data)
  );
}

// ============================================
// Releases Hooks
// ============================================

export function useReleases(params?: { status?: string }) {
  return useAPI<ReleaseRecord[]>(
    () => releasesApiService.getAll(params),
    { immediate: true }
  );
}

export function useReleaseDetail(id: number | null) {
  return useAPI<ReleaseRecord>(
    () => releasesApiService.getById(id as number),
    { immediate: !!id }
  );
}

export function useCreateRelease() {
  return useMutation<ReleaseRecord, {
    version: string;
    name: string;
    description?: string;
    plannedDate?: string;
    owner?: string;
    riskLevel?: 'low' | 'medium' | 'high';
  }>(
    (data) => releasesApiService.create(data)
  );
}

export function useUpdateRelease() {
  return useMutation<ReleaseRecord, {
    id: number;
    data: Partial<{
      version: string;
      name: string;
      description: string;
      plannedDate: string;
      owner: string;
      progress: number;
      riskLevel: 'low' | 'medium' | 'high';
    }>;
  }>(
    ({ id, data }) => releasesApiService.update(id, data)
  );
}

export function useUpdateReleaseStatus() {
  return useMutation<ReleaseRecord, {
    id: number;
    status: 'planning' | 'in_progress' | 'released' | 'archived';
    releaseDate?: string;
  }>(
    ({ id, status, releaseDate }) => releasesApiService.updateStatus(id, { status, releaseDate })
  );
}

export function useDeleteRelease() {
  return useMutation<void, number>(
    (id) => releasesApiService.delete(id)
  );
}

export function useAddReleaseFeature() {
  return useMutation<ReleaseRecord, { id: number; feature: string }>(
    ({ id, feature }) => releasesApiService.addFeature(id, feature)
  );
}

export function useAddReleaseDependency() {
  return useMutation<ReleaseRecord, { id: number; dependency: string }>(
    ({ id, dependency }) => releasesApiService.addDependency(id, dependency)
  );
}

export function useAddReleaseChangelog() {
  return useMutation<ReleaseRecord, { id: number; entry: string }>(
    ({ id, entry }) => releasesApiService.addChangelog(id, entry)
  );
}

export function useAddReleaseEpic() {
  return useMutation<ReleaseRecord, { id: number; epicId: string }>(
    ({ id, epicId }) => releasesApiService.addEpic(id, epicId)
  );
}

export function useRemoveReleaseEpic() {
  return useMutation<ReleaseRecord, { id: number; epicId: string }>(
    ({ id, epicId }) => releasesApiService.removeEpic(id, epicId)
  );
}

// ============================================
// Offline-First Hook (with sync queue)
// ============================================

interface UseOfflineDataOptions<T> {
  key: string;
  fetcher: () => Promise<APIResponse<T>>;
  staleTime?: number; // ms before data is considered stale
}

export function useOfflineData<T>(options: UseOfflineDataOptions<T>) {
  const { key, fetcher, staleTime = 5 * 60 * 1000 } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);

  const loadFromCache = useCallback(async () => {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        setData(cachedData);
        setIsStale(Date.now() - timestamp > staleTime);
        return true;
      }
    } catch {
      // Cache read failed
    }
    return false;
  }, [key, staleTime]);

  const saveToCache = useCallback((dataToCache: T) => {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify({
        data: dataToCache,
        timestamp: Date.now()
      }));
    } catch {
      // Cache write failed (quota exceeded, etc.)
    }
  }, [key]);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetcher();
      setData(response.data);
      setIsStale(false);
      saveToCache(response.data);
      setError(null);
    } catch (err: any) {
      setError(err);
      // Keep showing cached data on error
    } finally {
      setLoading(false);
    }
  }, [fetcher, saveToCache]);

  useEffect(() => {
    const init = async () => {
      const hasCached = await loadFromCache();
      
      if (!hasCached || isStale) {
        await refetch();
      } else {
        setLoading(false);
      }
    };
    
    init();
  }, []);

  return { data, loading, error, isStale, refetch };
}

// ============================================
// Real-time Updates Hook (WebSocket-ready)
// ============================================

interface UseRealtimeOptions {
  channel: string;
  onMessage?: (data: any) => void;
  enabled?: boolean;
}

export function useRealtime(options: UseRealtimeOptions) {
  const { channel, onMessage, enabled = true } = options;
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // WebSocket connection would go here when backend is enabled
    // For now, this is a placeholder for future integration
    
    // Example implementation:
    // const ws = new WebSocket(`wss://api.example.com/ws/${channel}`);
    // ws.onopen = () => setConnected(true);
    // ws.onclose = () => setConnected(false);
    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   setLastMessage(data);
    //   onMessage?.(data);
    // };
    // wsRef.current = ws;
    
    // return () => ws.close();
  }, [channel, enabled, onMessage]);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { connected, lastMessage, send };
}

// ── SDS Equipment Hooks ───────────────────────────────────────────────────

export function useSDSEquipment(params?: { status?: string; location?: string; department?: string; search?: string }) {
  return useAPI(() => sdsEquipmentService.getAll(params), [JSON.stringify(params)]);
}

export function useSDSScan(code: string | null) {
  return useAPI(
    () => code ? sdsEquipmentService.scanCode(code) : Promise.resolve({ success: true, data: { equipment: null, linkedSDS: [] } }),
    [code]
  );
}

export function useSDSSyncMutation() {
  return useMutation((items: Record<string, unknown>[]) => sdsEquipmentService.sync(items));
}

export function useSDSInspectionMutation() {
  return useMutation(({ id, record }: { id: string; record: Record<string, unknown> }) =>
    sdsEquipmentService.logInspection(id, record)
  );
}

export function useSDSImportMutation() {
  return useMutation((items: Record<string, unknown>[]) => sdsEquipmentService.importCSV(items));
}

export function useSDSCreateMutation() {
  return useMutation((data: Record<string, unknown>) => sdsEquipmentService.create(data));
}

export function useSDSUpdateMutation() {
  return useMutation(({ id, data }: { id: string; data: Record<string, unknown> }) =>
    sdsEquipmentService.update(id, data)
  );
}

// ── Geotag Hooks ─────────────────────────────────────────────────────────

export function useGeotags(params?: { recordType?: string; zone?: string; syncStatus?: string; limit?: number; offset?: number }) {
  return useAPI(() => geotagApiService.getAll(params), [JSON.stringify(params)]);
}

export function useFacilityZones() {
  return useAPI(() => geotagApiService.getZones(), []);
}

export function useSaveGeotagMutation() {
  return useMutation((geotag: Record<string, unknown>) => geotagApiService.save(geotag));
}

export function useGeotagSyncMutation() {
  return useMutation((geotags: Record<string, unknown>[]) => geotagApiService.syncBatch(geotags));
}

// ── Hub Risk Predictions ──────────────────────────────────────────────────

export function useHubRiskPredictions() {
  return useAPI(() => hubRiskPredictionService.getPredictions(), []);
}

// ── Hub Analytics Trends ─────────────────────────────────────────────────

export function useHubAnalyticsTrends() {
  return useAPI(() => hubAnalyticsService.getTrends(), []);
}

export function useHubKPITrends() {
  return useAPI(() => hubAnalyticsService.getKPI(), []);
}

// ── AI Audit Form Hooks ───────────────────────────────────────────────────

export function useAuditFormSessions(limit?: number) {
  return useAPI<AiAuditFormSession[]>(
    () => aiAuditFormService.getSessions(limit),
    { immediate: true }
  );
}

export function useSaveAuditFormSessionMutation() {
  return useMutation<{ id: number }, SaveAuditFormSessionPayload>(
    (payload) => aiAuditFormService.saveSession(payload)
  );
}

export function useAuditFormCustomTemplates() {
  return useAPI<AiAuditCustomTemplate[]>(
    () => aiAuditFormService.getCustomTemplates(),
    { immediate: true }
  );
}

export function useSaveAuditCustomTemplateMutation() {
  return useMutation<{ id: string; name: string }, SaveAuditCustomTemplatePayload>(
    (payload) => aiAuditFormService.saveCustomTemplate(payload)
  );
}

export function useDeleteAuditCustomTemplateMutation() {
  return useMutation<{ success: boolean }, string>(
    (id) => aiAuditFormService.deleteCustomTemplate(id)
  );
}

export function useAuditAnalysisMutation() {
  return useMutation<AuditAnalysisResult, AuditAnalysisPayload>(
    (payload) => aiAuditFormService.analyzeAudit(payload)
  );
}

// ── AI Training Hooks ─────────────────────────────────────────

export function useAiTrainingModules() {
  return useAPI<AiTrainingModule[]>(
    () => aiTrainingService.getModules(),
    { immediate: true }
  );
}

export function useUpdateTrainingProgressMutation() {
  return useMutation<{ id: string; completed: number }, { id: string; completed: number }>(
    ({ id, completed }) => aiTrainingService.updateProgress(id, completed)
  );
}

export function useAiLearningPaths() {
  return useAPI<AiLearningPath[]>(
    () => aiTrainingService.getPaths(),
    { immediate: true }
  );
}

export function useAiCompetencyAreas() {
  return useAPI<AiCompetencyArea[]>(
    () => aiTrainingService.getCompetency(),
    { immediate: true }
  );
}

export function useGenerateCourseMutation() {
  return useMutation<AiGeneratedCourse, GenerateCoursePayload>(
    (payload) => aiTrainingService.generateCourse(payload)
  );
}

export function useAiGeneratedCourses(limit?: number) {
  return useAPI<AiGeneratedCourse[]>(
    () => aiTrainingService.getGeneratedCourses(limit),
    { immediate: true }
  );
}

// ============================================
// Bow Tie Analysis Hooks
// ============================================

export function useBowTieScenarios(params?: { status?: string; riskLevel?: string; search?: string; owner?: string }) {
  return useAPI<BowTieScenarioRecord[]>(
    () => bowTieApiService.getScenarios(params),
    { immediate: true }
  );
}

export function useBowTieStats() {
  return useAPI<BowTieStats>(
    () => bowTieApiService.getStats(),
    { immediate: true }
  );
}

export function useCreateBowTieScenario() {
  return useMutation<BowTieScenarioRecord, Omit<BowTieScenarioRecord, 'id' | 'createdAt' | 'lastUpdated'>>(
    (data) => bowTieApiService.createScenario(data)
  );
}

export function useUpdateBowTieScenario() {
  return useMutation<BowTieScenarioRecord, { id: string; data: Partial<Omit<BowTieScenarioRecord, 'id' | 'createdAt'>> }>(
    ({ id, data }) => bowTieApiService.updateScenario(id, data)
  );
}

// ============================================================
// Custom App Builder Hooks
// ============================================================

export function useCustomApps(params?: { status?: string; search?: string }) {
  return useAPI<CustomAppRecord[]>(
    () => customAppsApiService.getAll(params),
    { immediate: true }
  );
}

export function useCustomApp(id: number | null) {
  return useAPI<CustomAppRecord>(
    () => customAppsApiService.getById(id!),
    { immediate: !!id }
  );
}

export function useCustomAppStats() {
  return useAPI<CustomAppStats>(
    () => customAppsApiService.getStats(),
    { immediate: true }
  );
}

export function useCreateCustomApp() {
  return useMutation<CustomAppRecord, { appName: string; status?: string; elements?: CustomAppElement[]; devicePreference?: string }>(
    (data) => customAppsApiService.create(data)
  );
}

export function useUpdateCustomApp() {
  return useMutation<CustomAppRecord, { id: number; data: Partial<{ appName: string; status: string; elements: CustomAppElement[]; devicePreference: string }> }>(
    ({ id, data }) => customAppsApiService.update(id, data)
  );
}

export function useDeleteCustomApp() {
  return useMutation<void, number>(
    (id) => customAppsApiService.delete(id)
  );
}

export function useDeployCustomApp() {
  return useMutation<CustomAppRecord, number>(
    (id) => customAppsApiService.deploy(id)
  );
}

export function useGenerateCustomApp() {
  return useMutation<{ appName: string; elements: CustomAppElement[] }, string>(
    (prompt) => customAppsApiService.generate(prompt)
  );
}

// ============================================================
// Custom Report Builder Hooks
// ============================================================

export function useCustomReports(params?: { status?: string; search?: string }) {
  return useAPI<CustomReportRecord[]>(
    () => customReportsApiService.getAll(params),
    { immediate: true }
  );
}

export function useCustomReport(id: number | null) {
  return useAPI<CustomReportRecord>(
    () => customReportsApiService.getById(id!),
    { immediate: !!id }
  );
}

export function useCustomReportStats() {
  return useAPI<CustomReportStats>(
    () => customReportsApiService.getStats(),
    { immediate: true }
  );
}

export function useCreateCustomReport() {
  return useMutation<CustomReportRecord, { reportName: string; status?: string; elements?: ReportElement[] }>(
    (data) => customReportsApiService.create(data)
  );
}

export function useUpdateCustomReport() {
  return useMutation<CustomReportRecord, { id: number; data: Partial<{ reportName: string; status: string; elements: ReportElement[] }> }>(
    ({ id, data }) => customReportsApiService.update(id, data)
  );
}

export function useDeleteCustomReport() {
  return useMutation<void, number>(
    (id) => customReportsApiService.delete(id)
  );
}

export function usePublishCustomReport() {
  return useMutation<CustomReportRecord, number>(
    (id) => customReportsApiService.publish(id)
  );
}

// ============================================================
// Data Security Hub Hooks
// ============================================================

export function useDataSecurityStats() {
  return useAPI<DataSecurityStats>(
    () => dataSecurityApiService.getStats(),
    { immediate: true }
  );
}

export function useSsoProviders() {
  return useAPI<SsoProviderRecord[]>(
    () => dataSecurityApiService.getSsoProviders(),
    { immediate: true }
  );
}

export function useUpdateSsoProvider() {
  return useMutation<SsoProviderRecord, { id: number; data: { status?: string; connectedUsers?: number; lastSync?: string } }>(
    ({ id, data }) => dataSecurityApiService.updateSsoProvider(id, data)
  );
}

export function useSecurityAuditLogs(params?: { search?: string; action?: string; limit?: number }) {
  return useAPI<SecurityAuditLogRecord[]>(
    () => dataSecurityApiService.getAuditLogs(params),
    { immediate: true }
  );
}

export function useCreateSecurityAuditLog() {
  return useMutation<SecurityAuditLogRecord, Omit<SecurityAuditLogRecord, 'id' | 'createdAt'>>(
    (data) => dataSecurityApiService.createAuditLog(data)
  );
}

export function useRbacMatrix() {
  return useAPI<RbacMatrix>(
    () => dataSecurityApiService.getRbac(),
    { immediate: true }
  );
}

// ============================================================
// Email Notification System Hooks
// ============================================================

export function useEmailNotificationStats() {
  return useAPI<EmailNotificationStats>(
    () => emailNotificationApiService.getStats(),
    { immediate: true }
  );
}

export function useEmailTemplates(category?: string) {
  return useAPI<EmailTemplateRecord[]>(
    () => emailNotificationApiService.getTemplates(category),
    { immediate: true }
  );
}

export function useUpdateEmailTemplate() {
  return useMutation<EmailTemplateRecord, { id: number; data: { status?: 'active' | 'paused'; openRate?: number; clickRate?: number; sentCount?: number } }>(
    ({ id, data }) => emailNotificationApiService.updateTemplate(id, data)
  );
}

export function useAutomationWorkflows() {
  return useAPI<AutomationWorkflowRecord[]>(
    () => emailNotificationApiService.getWorkflows(),
    { immediate: true }
  );
}

export function useUpdateAutomationWorkflow() {
  return useMutation<AutomationWorkflowRecord, { id: number; data: { status?: 'active' | 'testing' | 'paused'; deliveryRate?: number; emailsCount?: number } }>(
    ({ id, data }) => emailNotificationApiService.updateWorkflow(id, data)
  );
}

export function useCreateEmailCampaign() {
  return useMutation<EmailCampaignRecord, { name: string; subject: string; audienceSegment?: string; body?: string; status?: 'draft' | 'sent' | 'scheduled'; recipientCount?: number }>(
    (data) => emailNotificationApiService.createCampaign(data)
  );
}

export function useEmailCampaigns() {
  return useAPI<EmailCampaignRecord[]>(
    () => emailNotificationApiService.getCampaigns(),
    { immediate: true }
  );
}

// ============================================================
// Visual Audit Hooks
// ============================================================

export function useVisualAuditResults(limit?: number) {
  return useAPI<VisualAuditResult[]>(() => visualAuditService.getResults(limit), { immediate: true });
}

export function useSaveVisualAuditMutation() {
  return useMutation<{ id: string }, SaveVisualAuditPayload>((payload) => visualAuditService.saveResult(payload));
}

export function useDeleteVisualAuditMutation() {
  return useMutation<void, string>((id) => visualAuditService.deleteResult(id));
}

export function useAddVoiceNoteMutation() {
  return useMutation<{ voiceNotes: string[] }, { id: string; note: string }>(({ id, note }) => visualAuditService.addVoiceNote(id, note));
}

export function useVisualAuditStats() {
  return useAPI<VisualAuditStats>(() => visualAuditService.getStats(), { immediate: true });
}

// ============================================================
// Compliance Frameworks (Global Compliance Hub) Hooks
// ============================================================

export function useComplianceFrameworks(params?: {
  region?: string;
  category?: string;
  status?: string;
  search?: string;
}) {
  return useAPI<ComplianceFrameworkRecord[]>(
    () => complianceFrameworksService.getAll(params),
    { immediate: true }
  );
}

export function useComplianceFrameworkStats() {
  return useAPI<ComplianceFrameworkStats>(
    () => complianceFrameworksService.getStats(),
    { immediate: true }
  );
}

export function useCreateComplianceFrameworkMutation() {
  return useMutation<ComplianceFrameworkRecord, Omit<ComplianceFrameworkRecord, 'createdAt' | 'updatedAt'>>(
    (data) => complianceFrameworksService.create(data)
  );
}

export function useUpdateComplianceFrameworkMutation() {
  return useMutation<
    ComplianceFrameworkRecord,
    { id: string; data: Partial<Omit<ComplianceFrameworkRecord, 'id' | 'createdAt' | 'updatedAt'>> }
  >(({ id, data }) => complianceFrameworksService.update(id, data));
}

export function useDeleteComplianceFrameworkMutation() {
  return useMutation<{ message: string }, string>((id) => complianceFrameworksService.delete(id));
}

// ============================================================
// JSA / Hazard Assessment Hooks
// ============================================================

export function useJsaList(params?: {
  status?: string;
  risk?: string;
  department?: string;
  search?: string;
  limit?: number;
}) {
  return useAPI<JsaRecord[]>(
    () => jsaApiService.getAll(params),
    { immediate: true }
  );
}

export function useJsaStats() {
  return useAPI<JsaStats>(
    () => jsaApiService.getStats(),
    { immediate: true }
  );
}

export function useJsaById(id: string) {
  return useAPI<JsaRecord>(
    () => jsaApiService.getById(id),
    { immediate: !!id }
  );
}

export function useCreateJsaMutation() {
  return useMutation<JsaRecord, Omit<JsaRecord, 'hazardCount' | 'controlCount' | 'createdAt' | 'updatedAt'> & { id?: string }>(
    (data) => jsaApiService.create(data)
  );
}

export function useUpdateJsaMutation() {
  return useMutation<
    JsaRecord,
    { id: string; data: Partial<Omit<JsaRecord, 'id' | 'createdAt' | 'updatedAt'>> }
  >(({ id, data }) => jsaApiService.update(id, data));
}

export function useDeleteJsaMutation() {
  return useMutation<{ message: string }, string>((id) => jsaApiService.delete(id));
}

// ── Hyper-Care Training ───────────────────────────────────────────────────────

export function useHypercareStats() {
  return useAPI<HypercareStats>(
    () => hypercareApiService.getStats(),
    { immediate: true }
  );
}

export function useHypercareDemos(params?: { status?: string; site?: string; search?: string }) {
  return useAPI<HypercareDemo[]>(
    () => hypercareApiService.getDemos(params),
    { immediate: true }
  );
}

export function useHypercareChampions(params?: { site?: string; search?: string }) {
  return useAPI<HypercareChampion[]>(
    () => hypercareApiService.getChampions(params),
    { immediate: true }
  );
}

export function useHypercareQrDeployments(params?: { status?: string; search?: string }) {
  return useAPI<HypercareQrDeployment[]>(
    () => hypercareApiService.getQrDeployments(params),
    { immediate: true }
  );
}

export function useCreateHypercareDemoMutation() {
  return useMutation<HypercareDemo, Omit<HypercareDemo, 'id' | 'createdAt' | 'updatedAt'>>(
    (data) => hypercareApiService.createDemo(data)
  );
}

export function useCreateHypercareChampionMutation() {
  return useMutation<HypercareChampion, Omit<HypercareChampion, 'id' | 'createdAt' | 'updatedAt'>>(
    (data) => hypercareApiService.createChampion(data)
  );
}

export function useCreateHypercareQrMutation() {
  return useMutation<HypercareQrDeployment, Omit<HypercareQrDeployment, 'id' | 'createdAt' | 'updatedAt'>>(
    (data) => hypercareApiService.createQrDeployment(data)
  );
}

export function useRecordQrScanMutation() {
  return useMutation<HypercareQrDeployment, number>(
    (id) => hypercareApiService.recordScan(id)
  );
}

// ── Incident Heatmap ──────────────────────────────────────────────────────────

export function useHeatmapIncidents(params?: HeatmapIncidentFilters) {
  return useAPI<HeatmapIncident[]>(
    () => heatmapIncidentApiService.getAll(params),
    { immediate: true }
  );
}

export function useHeatmapIncidentStats() {
  return useAPI<HeatmapIncidentStats>(
    () => heatmapIncidentApiService.getStats(),
    { immediate: true }
  );
}

export function useHeatmapIncidentById(id: string) {
  return useAPI<HeatmapIncident>(
    () => heatmapIncidentApiService.getById(id),
    { immediate: !!id }
  );
}

export function useCreateHeatmapIncidentMutation() {
  return useMutation<
    HeatmapIncident,
    Omit<HeatmapIncident, 'coordinates' | 'createdAt' | 'updatedAt'> & { coordX: number; coordY: number }
  >((data) => heatmapIncidentApiService.create(data));
}

export function useUpdateHeatmapIncidentMutation() {
  return useMutation<
    HeatmapIncident,
    { id: string; data: Partial<Omit<HeatmapIncident, 'coordinates'> & { coordX?: number; coordY?: number }> }
  >(({ id, data }) => heatmapIncidentApiService.update(id, data));
}

export function useDeleteHeatmapIncidentMutation() {
  return useMutation<{ message: string }, string>(
    (id) => heatmapIncidentApiService.delete(id)
  );
}

// ── Incident Analytics ────────────────────────────────────────────────────────

export function useIncidentAnalyticsKPIs(params?: IncidentAnalyticsParams) {
  return useAPI<IncidentAnalyticsKPIs>(
    () => incidentAnalyticsService.getKPIs(params),
    { immediate: true }
  );
}

export function useIncidentAnalyticsMonthlyTrend(params?: { months?: number }) {
  return useAPI<IncidentAnalyticsMonthlyItem[]>(
    () => incidentAnalyticsService.getMonthlyTrend(params),
    { immediate: true }
  );
}

export function useIncidentAnalyticsWeeklyTrend(params?: { year?: string; month?: string }) {
  return useAPI<IncidentAnalyticsWeeklyItem[]>(
    () => incidentAnalyticsService.getWeeklyTrend(params),
    { immediate: true }
  );
}

export function useIncidentAnalyticsByType(params?: IncidentAnalyticsParams) {
  return useAPI<IncidentAnalyticsByTypeItem[]>(
    () => incidentAnalyticsService.getByType(params),
    { immediate: true }
  );
}

export function useIncidentAnalyticsBySeverity(params?: IncidentAnalyticsParams) {
  return useAPI<IncidentAnalyticsBySeverityItem[]>(
    () => incidentAnalyticsService.getBySeverity(params),
    { immediate: true }
  );
}

export function useIncidentAnalyticsByDepartment(params?: IncidentAnalyticsParams) {
  return useAPI<IncidentAnalyticsByDepartmentItem[]>(
    () => incidentAnalyticsService.getByDepartment(params),
    { immediate: true }
  );
}

export function useIncidentAnalyticsByDayOfWeek(params?: IncidentAnalyticsParams) {
  return useAPI<IncidentAnalyticsByDayItem[]>(
    () => incidentAnalyticsService.getByDayOfWeek(params),
    { immediate: true }
  );
}

export function useIncidentAnalyticsByTimeOfDay(params?: IncidentAnalyticsParams) {
  return useAPI<IncidentAnalyticsByTimeItem[]>(
    () => incidentAnalyticsService.getByTimeOfDay(params),
    { immediate: true }
  );
}

export function useIncidentAnalyticsRootCauses(params?: IncidentAnalyticsParams) {
  return useAPI<IncidentAnalyticsRootCauseItem[]>(
    () => incidentAnalyticsService.getRootCauses(params),
    { immediate: true }
  );
}

export function useIncidentAnalyticsLeadingIndicators(params?: IncidentAnalyticsParams) {
  return useAPI<IncidentAnalyticsLeadingIndicatorItem[]>(
    () => incidentAnalyticsService.getLeadingIndicators(params),
    { immediate: true }
  );
}

// ============================================
// Mobile Offline Sync Hooks
// ============================================

export function useSyncQueue() {
  return useAPI<SyncQueueRecord[]>(
    () => mobileSyncApiService.getQueue(),
    { immediate: true }
  );
}

export function useAddSyncQueueRecord() {
  return useMutation<SyncQueueRecord, SyncQueueRecord>(
    (data) => mobileSyncApiService.addQueueRecord(data)
  );
}

export function useUpdateSyncQueueRecord() {
  return useMutation<SyncQueueRecord, { id: string; updates: Partial<Pick<SyncQueueRecord, 'synced' | 'conflicted' | 'version' | 'data'>> }>(
    ({ id, updates }) => mobileSyncApiService.updateQueueRecord(id, updates)
  );
}

export function useDeleteSyncQueueRecord() {
  return useMutation<{ message: string }, string>(
    (id) => mobileSyncApiService.deleteQueueRecord(id)
  );
}

export function useResetSyncQueue() {
  return useMutation<{ message: string; count: number }, void>(
    () => mobileSyncApiService.resetQueue()
  );
}

export function useSyncConflicts() {
  return useAPI<SyncConflictRecord[]>(
    () => mobileSyncApiService.getConflicts(),
    { immediate: true }
  );
}

export function useAddSyncConflict() {
  return useMutation<SyncConflictRecord, SyncConflictRecord>(
    (data) => mobileSyncApiService.addConflict(data)
  );
}

export function useResolveConflict() {
  return useMutation<SyncConflictRecord, { id: string; resolution: 'local' | 'server' | 'merged' }>(
    ({ id, resolution }) => mobileSyncApiService.resolveConflict(id, resolution)
  );
}

export function useDeleteSyncConflict() {
  return useMutation<{ message: string }, string>(
    (id) => mobileSyncApiService.deleteConflict(id)
  );
}

export function useLatestTestRun() {
  return useAPI<{ id?: number; results: SyncTestResultItem[]; passed: number; failed: number; total: number; createdAt?: number } | null>(
    () => mobileSyncApiService.getLatestTestRun(),
    { immediate: true }
  );
}

export function useSaveTestRun() {
  return useMutation<{ id: number; passed: number; failed: number; total: number }, SyncTestResultItem[]>(
    (results) => mobileSyncApiService.saveTestRun(results)
  );
}

export function useSyncStats() {
  return useAPI<SyncStats>(
    () => mobileSyncApiService.getStats(),
    { immediate: true }
  );
}

// ── Mobile Worker App Hooks ────────────────────────────────────────────────────

export function useWorkerTasks() {
  return useAPI<WorkerTask[]>(
    () => workerAppApiService.getTasks(),
    { immediate: true }
  );
}

export function useWorkerTaskStats() {
  return useAPI<WorkerTaskStats>(
    () => workerAppApiService.getTaskStats(),
    { immediate: true }
  );
}

export function useSeedWorkerTasks() {
  return useMutation<{ message: string; count: number; seeded: boolean }, void>(
    () => workerAppApiService.seedTasks()
  );
}

export function useUpdateWorkerTaskStatus() {
  return useMutation<WorkerTask, { taskId: string; status: string }>(
    ({ taskId, status }) => workerAppApiService.updateTaskStatus(taskId, status)
  );
}

export function useToggleChecklistItem() {
  return useMutation<WorkerTask, { taskId: string; itemId: string; completed: boolean }>(
    ({ taskId, itemId, completed }) =>
      workerAppApiService.toggleChecklistItem(taskId, itemId, completed)
  );
}

export function useWorkerReports() {
  return useAPI<WorkerQuickReport[]>(
    () => workerAppApiService.getReports(),
    { immediate: true }
  );
}

export function useCreateWorkerReport() {
  return useMutation<WorkerQuickReport, Omit<WorkerQuickReport, 'id' | 'timestamp' | 'syncStatus'>>(
    (data) => workerAppApiService.createReport(data)
  );
}

export function useWorkerEnvironmental() {
  return useAPI<WorkerEnvironmentalReading[]>(
    () => workerAppApiService.getEnvironmental(),
    { immediate: true }
  );
}

// ── Near Miss Report hooks ────────────────────────────────────────────────────

export function useNearMissReports() {
  return useAPI<NearMissReportResponse[]>(
    () => nearMissReportApiService.getReports(),
    { immediate: true }
  );
}

export function useCreateNearMissReport() {
  return useMutation<NearMissReportResponse, NearMissReportPayload>(
    (data) => nearMissReportApiService.createReport(data)
  );
}

export function useUpdateNearMissCAStatus() {
  return useMutation<
    NearMissReportResponse,
    { reportId: number; actionId: string; status: NearMissCorrectiveAction['status']; completionNotes?: string }
  >(
    ({ reportId, actionId, status, completionNotes }) =>
      nearMissReportApiService.updateCorrectiveActionStatus(reportId, actionId, status, completionNotes)
  );
}

export function useNearMissAIAnalysis() {
  return useMutation<{ analysis: string; source: string }, NearMissAIAnalysisPayload>(
    (data) => nearMissReportApiService.generateAIAnalysis(data)
  );
}

// ── Form Configurator hooks ───────────────────────────────────────────────────

export function useFormConfigs() {
  return useAPI<FormConfigResponse[]>(
    () => formConfigApiService.getAll(),
    { immediate: true }
  );
}

export function useCreateFormConfig() {
  return useMutation<FormConfigResponse, FormConfigPayload>(
    (data) => formConfigApiService.create(data)
  );
}

export function useUpdateFormConfig() {
  return useMutation<FormConfigResponse, FormConfigUpdatePayload>(
    ({ id, ...data }) => formConfigApiService.update(id, data)
  );
}

export function useDeleteFormConfig() {
  return useMutation<{ success: boolean; message: string }, number>(
    (id) => formConfigApiService.delete(id)
  );
}

// ── Organization Settings hooks ───────────────────────────────────────────────

export function useOrgProfile() {
  return useAPI<OrgProfile>(
    () => organizationApiService.getProfile(),
    { immediate: true }
  );
}

export function useUpdateOrgProfile() {
  return useMutation<OrgProfile, UpdateOrgProfilePayload>(
    (data) => organizationApiService.updateProfile(data)
  );
}

export function useOrgMembers() {
  return useAPI<OrgMember[]>(
    () => organizationApiService.getMembers(),
    { immediate: true }
  );
}

export function useAddOrgMember() {
  return useMutation<OrgMember, AddOrgMemberPayload>(
    (data) => organizationApiService.addMember(data)
  );
}

export function useUpdateOrgMember() {
  return useMutation<OrgMember, { id: number } & UpdateOrgMemberPayload>(
    ({ id, ...data }) => organizationApiService.updateMember(id, data)
  );
}

export function useRemoveOrgMember() {
  return useMutation<{ success: boolean; message: string }, number>(
    (id) => organizationApiService.removeMember(id)
  );
}

export function useOrgSecurityPolicies() {
  return useAPI<OrgSecurityPolicy[]>(
    () => organizationApiService.getSecurityPolicies(),
    { immediate: true }
  );
}

export function useUpdateOrgSecurityPolicies() {
  return useMutation<OrgSecurityPolicy[], UpdateSecurityPoliciesPayload>(
    (data) => organizationApiService.updateSecurityPolicies(data)
  );
}

export function useOrgAuditLog(params?: { limit?: number; offset?: number }) {
  return useAPI<OrgAuditLogEntry[]>(
    () => organizationApiService.getAuditLog(params),
    { immediate: true }
  );
}

export function useAddOrgAuditLogEntry() {
  return useMutation<OrgAuditLogEntry, AddAuditLogPayload>(
    (data) => organizationApiService.addAuditLogEntry(data)
  );
}

export function useOrgApiKey() {
  return useAPI<OrgApiKey>(
    () => organizationApiService.getApiKey(),
    { immediate: true }
  );
}

export function useRegenerateOrgApiKey() {
  return useMutation<RegenerateApiKeyResponse, void>(
    () => organizationApiService.regenerateApiKey()
  );
}

// ============================================
// Pilot Program Hooks
// ============================================

export function usePilotStats() {
  return useAPI<PilotStats>(
    () => pilotProgramApiService.getStats(),
    { immediate: true }
  );
}

export function usePilotSites(params?: { status?: string; riskLevel?: string }) {
  return useAPI<PilotBetaSite[]>(
    () => pilotProgramApiService.getSites(params),
    { immediate: true }
  );
}

export function useCreatePilotSite() {
  return useMutation<PilotBetaSite, CreatePilotBetaSitePayload>(
    (data) => pilotProgramApiService.createSite(data)
  );
}

export function useUpdatePilotSite() {
  return useMutation<PilotBetaSite, { id: number; data: Partial<CreatePilotBetaSitePayload> }>(
    ({ id, data }) => pilotProgramApiService.updateSite(id, data)
  );
}

export function useDeletePilotSite() {
  return useMutation<{ success: boolean; message: string }, number>(
    (id) => pilotProgramApiService.deleteSite(id)
  );
}

export function usePilotShadowingSessions(params?: { status?: string; severity?: string; site?: string }) {
  return useAPI<PilotShadowingSession[]>(
    () => pilotProgramApiService.getShadowingSessions(params),
    { immediate: true }
  );
}

export function useCreatePilotShadowingSession() {
  return useMutation<PilotShadowingSession, CreatePilotShadowingSessionPayload>(
    (data) => pilotProgramApiService.createShadowingSession(data)
  );
}

export function useUpdatePilotShadowingSession() {
  return useMutation<PilotShadowingSession, { id: number; data: Partial<CreatePilotShadowingSessionPayload & { status: string }> }>(
    ({ id, data }) => pilotProgramApiService.updateShadowingSession(id, data)
  );
}

export function useDeletePilotShadowingSession() {
  return useMutation<{ success: boolean; message: string }, number>(
    (id) => pilotProgramApiService.deleteShadowingSession(id)
  );
}

export function usePilotFeedback(params?: { type?: string }) {
  return useAPI<PilotFeedbackItem[]>(
    () => pilotProgramApiService.getFeedback(params),
    { immediate: true }
  );
}

export function useCreatePilotFeedback() {
  return useMutation<PilotFeedbackItem, CreatePilotFeedbackPayload>(
    (data) => pilotProgramApiService.createFeedback(data)
  );
}

export function useVotePilotFeedback() {
  return useMutation<PilotFeedbackItem, number>(
    (id) => pilotProgramApiService.voteFeedback(id)
  );
}

export function useDeletePilotFeedback() {
  return useMutation<{ success: boolean; message: string }, number>(
    (id) => pilotProgramApiService.deleteFeedback(id)
  );
}

// ── Predictive Safety AI ────────────────────────────────────────────────────────

export function usePredictiveStats() {
  return useAPI<PredictiveSafetyStats>(
    () => predictiveSafetyApiService.getStats(),
    { immediate: true }
  );
}

export function usePredictivePredictions(params?: { type?: string; status?: string }) {
  return useAPI<PredictiveSafetyPrediction[]>(
    () => predictiveSafetyApiService.getPredictions(params),
    { immediate: true }
  );
}

export function useCreatePredictivePrediction() {
  return useMutation<PredictiveSafetyPrediction, CreatePredictivePredictionPayload>(
    (data) => predictiveSafetyApiService.createPrediction(data)
  );
}

export function useUpdatePredictivePrediction() {
  return useMutation<PredictiveSafetyPrediction, { id: string; data: Partial<CreatePredictivePredictionPayload & { status: string }> }>(
    ({ id, data }) => predictiveSafetyApiService.updatePrediction(id, data)
  );
}

export function useDeletePredictivePrediction() {
  return useMutation<{ success: boolean; message: string }, string>(
    (id) => predictiveSafetyApiService.deletePrediction(id)
  );
}

export function useUpdatePredictiveRecommendation() {
  return useMutation<PredictiveSafetyPrediction, { predId: string; recId: string; data: { status?: string; assignedTo?: string } }>(
    ({ predId, recId, data }) => predictiveSafetyApiService.updateRecommendation(predId, recId, data)
  );
}

export function usePredictiveInsights() {
  return useAPI<PredictiveInsight[]>(
    () => predictiveSafetyApiService.getInsights(),
    { immediate: true }
  );
}

export function useCreatePredictiveInsight() {
  return useMutation<PredictiveInsight, CreatePredictiveInsightPayload>(
    (data) => predictiveSafetyApiService.createInsight(data)
  );
}

export function useDeletePredictiveInsight() {
  return useMutation<{ success: boolean; message: string }, number>(
    (id) => predictiveSafetyApiService.deleteInsight(id)
  );
}

export function usePredictiveModelMetrics() {
  return useAPI<PredictiveModelMetrics>(
    () => predictiveSafetyApiService.getModelMetrics(),
    { immediate: true }
  );
}

