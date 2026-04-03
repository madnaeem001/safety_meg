import React, { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AISafetyAssistant } from './components/AISafetyAssistant';
import { FeedbackWidget } from './components/widgets/FeedbackWidget';
import { OnboardingWalkthrough } from './components/widgets/OnboardingWalkthrough';
import { useSwipeNavigation } from './hooks/useSwipeNavigation';
import { SwipeIndicator, SwipeProgressBar } from './components/dashboard/SwipeIndicator';
import { SkeletonDark } from './components/dashboard/Skeleton';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AppLayout } from './layouts/AppLayout';
import { BottomTabNavigation } from './components/dashboard/BottomTabNavigation';
import { SMToastProvider } from './components/ui';

// Eager load Dashboard for fast initial render
import { Dashboard } from './pages/Dashboard';

// Lazy load all other pages for bundle optimization
const RiskAssessment = lazy(() => import('./pages/RiskAssessment').then(m => ({ default: m.RiskAssessment })));
const NFPACodes = lazy(() => import('./pages/NFPACodes').then(m => ({ default: m.NFPACodes })));
const Analytics = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })));
const SafetyAudit = lazy(() => import('./pages/SafetyAudit').then(m => ({ default: m.SafetyAudit })));
const SafetyProcedures = lazy(() => import('./pages/SafetyProcedures').then(m => ({ default: m.SafetyProcedures })));
const IncidentReporting = lazy(() => import('./pages/IncidentReporting').then(m => ({ default: m.IncidentReporting })));
const ComplianceAndProcedures = lazy(() => import('./pages/ComplianceAndProcedures').then(m => ({ default: m.ComplianceAndProcedures })));
const EmissionReports = lazy(() => import('./pages/EmissionReports').then(m => ({ default: m.EmissionReports })));
const RiskRegister = lazy(() => import('./pages/RiskRegister').then(m => ({ default: m.RiskRegister })));
const ProjectManagement = lazy(() => import('./pages/ProjectManagement').then(m => ({ default: m.ProjectManagement })));
const InvestigationReports = lazy(() => import('./pages/InvestigationReports').then(m => ({ default: m.InvestigationReports })));
const ESGReporting = lazy(() => import('./pages/ESGReporting').then(m => ({ default: m.ESGReporting })));
const TrainingManagement = lazy(() => import('./pages/TrainingManagement').then(m => ({ default: m.TrainingManagement })));
const HazardAssessment = lazy(() => import('./pages/HazardAssessment').then(m => ({ default: m.HazardAssessment })));
const VehicleIncidentReport = lazy(() => import('./pages/VehicleIncidentReport').then(m => ({ default: m.VehicleIncidentReport })));
const InjuryReport = lazy(() => import('./pages/InjuryReport').then(m => ({ default: m.InjuryReport })));
const FullIncidentReport = lazy(() => import('./pages/FullIncidentReport').then(m => ({ default: m.FullIncidentReport })));
const RegulationsLibrary = lazy(() => import('./pages/RegulationsLibrary').then(m => ({ default: m.RegulationsLibrary })));
const ChemicalSDSManagement = lazy(() => import('./pages/ChemicalSDSManagement').then(m => ({ default: m.ChemicalSDSManagement })));
const PropertyIncidentReport = lazy(() => import('./pages/PropertyIncidentReport').then(m => ({ default: m.PropertyIncidentReport })));
const RootCauseCorrectiveAction = lazy(() => import('./pages/RootCauseCorrectiveAction').then(m => ({ default: m.RootCauseCorrectiveAction })));
const SafetyManagementHub = lazy(() => import('./pages/SafetyManagementHub').then(m => ({ default: m.SafetyManagementHub })));
const PermitToWork = lazy(() => import('./pages/PermitToWork').then(m => ({ default: m.PermitToWork })));
const SWPPPCompliance = lazy(() => import('./pages/SWPPPCompliance').then(m => ({ default: m.SWPPPCompliance })));
const StormWaterChecklist = lazy(() => import('./pages/StormWaterChecklist').then(m => ({ default: m.StormWaterChecklist })));
const SensorConfiguration = lazy(() => import('./pages/SensorConfiguration').then(m => ({ default: m.SensorConfiguration })));
const InspectionScheduling = lazy(() => import('./pages/InspectionScheduling').then(m => ({ default: m.InspectionScheduling })));
const EPAReportingDashboard = lazy(() => import('./pages/EPAReportingDashboard').then(m => ({ default: m.EPAReportingDashboard })));
const SensorCalibration = lazy(() => import('./pages/SensorCalibration').then(m => ({ default: m.SensorCalibration })));
const RiskAssessmentChecklists = lazy(() => import('./pages/RiskAssessmentChecklists').then(m => ({ default: m.RiskAssessmentChecklists })));
const CustomReportBuilder = lazy(() => import('./pages/CustomReportBuilder').then(m => ({ default: m.CustomReportBuilder })));
const ChecklistBuilder = lazy(() => import('./pages/ChecklistBuilder'));
const LanguageSelector = lazy(() => import('./pages/LanguageSelector'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const NearMissReport = lazy(() => import('./pages/NearMissReport'));
const ToolboxTalks = lazy(() => import('./pages/ToolboxTalks'));
const KPIIndicators = lazy(() => import('./pages/KPIIndicators'));
const ReportDashboard = lazy(() => import('./pages/ReportDashboard').then(m => ({ default: m.ReportDashboard })));
const AutomationRuleBuilder = lazy(() => import('./pages/AutomationRuleBuilder'));
const WebhooksPage = lazy(() => import('./pages/WebhooksPage'));
const InternationalStandards = lazy(() => import('./pages/InternationalStandards'));
const ComplianceGapAnalysis = lazy(() => import('./pages/ComplianceGapAnalysis').then(m => ({ default: m.ComplianceGapAnalysis })));
const CertificationTracker = lazy(() => import('./pages/CertificationTracker'));
const CrossReferenceMatrix = lazy(() => import('./pages/CrossReferenceMatrix'));
const SIFPrecursorDashboard = lazy(() => import('./pages/SIFPrecursorDashboard'));
const VoiceHazardReport = lazy(() => import('./pages/VoiceHazardReport'));
const NoCodeFormConfigurator = lazy(() => import('./pages/NoCodeFormConfigurator'));
const EnterpriseCommandCenter = lazy(() => import('./pages/EnterpriseCommandCenter'));
const OrganizationSettings = lazy(() => import('./pages/OrganizationSettings'));
const GlobalComplianceHub = lazy(() => import('./pages/GlobalComplianceHub'));
const JiraBoard = lazy(() => import('./pages/JiraBoard').then(m => ({ default: m.JiraBoard })));
const ContractorPermitManagement = lazy(() => import('./pages/ContractorPermitManagement'));
const SustainabilityDashboard = lazy(() => import('./pages/SustainabilityDashboard'));
const PredictiveSafetyAI = lazy(() => import('./pages/PredictiveSafetyAI'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const MobileWorkerApp = lazy(() => import('./pages/MobileWorkerApp'));
const ComplianceReporting = lazy(() => import('./pages/ComplianceReporting').then(m => ({ default: m.ComplianceReporting })));
const WorkerDashboard = lazy(() => import('./pages/WorkerDashboard').then(m => ({ default: m.WorkerDashboard })));
const SafetyLeaderboard = lazy(() => import('./pages/SafetyLeaderboard'));
const SupervisorApprovals = lazy(() => import('./pages/SupervisorApprovals'));
const NotificationCenter = lazy(() => import('./pages/NotificationCenter'));
const IncidentHeatmap = lazy(() => import('./pages/IncidentHeatmap'));
const IncidentTrendAnalytics = lazy(() => import('./pages/IncidentTrendAnalytics'));
const AdvancedTechnologyHub = lazy(() => import('./pages/AdvancedTechnologyHub'));
const SelfAdminPlatform = lazy(() => import('./pages/SelfAdminPlatform'));
const CustomAppBuilder = lazy(() => import('./pages/CustomAppBuilder'));
const AIVisualAudit = lazy(() => import('./pages/AIVisualAudit'));
const AIAuditTemplateForm = lazy(() => import('./pages/AIAuditTemplateForm').then(m => ({ default: m.AIAuditTemplateForm })));
const AuditScheduleBuilder = lazy(() => import('./pages/audits/AuditScheduleBuilder'));
const AuditScheduleList = lazy(() => import('./pages/audits/AuditScheduleList'));
const AIVisualAuditHub = lazy(() => import('./pages/AIVisualAuditHub'));
const AIVisualAuditHistory = lazy(() => import('./pages/AIVisualAuditHistory'));
const AssetQRScanner = lazy(() => import('./pages/AssetQRScanner'));
const IoTSensorDashboard = lazy(() => import('./pages/IoTSensorDashboard'));
const AITrainingModules = lazy(() => import('./pages/AITrainingModules'));
const ComplianceCalendar = lazy(() => import('./pages/ComplianceCalendar'));
const RetentionAnalytics = lazy(() => import('./pages/RetentionAnalytics'));
const EmailNotificationSystem = lazy(() => import('./pages/EmailNotificationSystem'));
const PilotProgram = lazy(() => import('./pages/PilotProgram'));
const DataSecurityHub = lazy(() => import('./pages/DataSecurityHub'));
const HyperCareTraining = lazy(() => import('./pages/HyperCareTraining'));
const ExecutiveReportDashboard = lazy(() => import('./pages/ExecutiveReportDashboard'));
const V2Roadmap = lazy(() => import('./pages/V2Roadmap'));
const AutomatedPdfReports = lazy(() => import('./pages/AutomatedPdfReports'));
const MobileOfflineSyncTest = lazy(() => import('./pages/MobileOfflineSyncTest'));
const RiskDigester = lazy(() => import('./pages/RiskDigester'));
const IndustrialHygiene = lazy(() => import('./pages/IndustrialHygiene'));
const BehaviorBasedSafety = lazy(() => import('./pages/BehaviorBasedSafety'));
const BowTieAnalysis = lazy(() => import('./pages/BowTieAnalysis'));
const QualityManagement = lazy(() => import('./pages/QualityManagement'));
const SSOLoginFlow = lazy(() => import('./pages/SSOLoginFlow'));

// Auth guard: redirects unauthenticated users to /login
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, loadCurrentUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !user) {
      loadCurrentUser();
    }
  }, [isAuthenticated, user, loadCurrentUser]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout>{children}</AppLayout>;
};

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface-base">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-3 border-accent/20 border-t-accent rounded-full animate-spin" />
      <p className="text-sm text-text-muted">Loading...</p>
    </div>
  </div>
);

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

// Gesture Navigation Provider - enables swipe between main pages
const GestureNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateIsMobile = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobileScreen(event.matches);
    };

    updateIsMobile(mediaQuery);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateIsMobile);
      return () => mediaQuery.removeEventListener('change', updateIsMobile);
    }

    mediaQuery.addListener(updateIsMobile);
    return () => mediaQuery.removeListener(updateIsMobile);
  }, []);

  useSwipeNavigation({ 
    enabled: isMobileScreen,
    threshold: 80,
    velocityThreshold: 0.3,
  });

  return <>{children}</>;
};

// Renders persistent mobile-only bottom navigation above the Suspense boundary
// so route highlighting stays current during lazy page transitions.
function PersistentNavigation() {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return null;
  return (
    <>
      <BottomTabNavigation />
    </>
  );
}

// Animated Routes wrapper component with swipe indicators
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <GestureNavigationProvider>
      <ScrollToTop />
      {/* Swipe navigation visual feedback */}
      <SwipeIndicator show={false} />

      {/* Navigation is stable and lives ABOVE Suspense so it always has
          the current location — never frozen by a pending lazy-load. */}
      <PersistentNavigation />
      
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected app routes */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/risk-assessment" element={<ProtectedRoute><RiskAssessment /></ProtectedRoute>} />
          <Route path="/hazard-assessment" element={<ProtectedRoute><HazardAssessment /></ProtectedRoute>} />
          <Route path="/nfpa-codes" element={<ProtectedRoute><NFPACodes /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/safety-audit" element={<ProtectedRoute><SafetyAudit /></ProtectedRoute>} />
          <Route path="/audit-schedule/new" element={<ProtectedRoute><AuditScheduleBuilder /></ProtectedRoute>} />
          <Route path="/audit-schedules" element={<ProtectedRoute><AuditScheduleList /></ProtectedRoute>} />
          <Route path="/safety-procedures" element={<ProtectedRoute><SafetyProcedures /></ProtectedRoute>} />
          <Route path="/report-incident" element={<ProtectedRoute><IncidentReporting /></ProtectedRoute>} />
          <Route path="/injury-report" element={<ProtectedRoute><InjuryReport /></ProtectedRoute>} />
          <Route path="/full-report" element={<ProtectedRoute><FullIncidentReport /></ProtectedRoute>} />
          <Route path="/vehicle-incident" element={<ProtectedRoute><VehicleIncidentReport /></ProtectedRoute>} />
          <Route path="/compliance-procedures" element={<ProtectedRoute><ComplianceAndProcedures /></ProtectedRoute>} />
          <Route path="/risk-digester" element={<ProtectedRoute><RiskDigester /></ProtectedRoute>} />
          <Route path="/emission-reports" element={<ProtectedRoute><EmissionReports /></ProtectedRoute>} />
          <Route path="/risk-register" element={<ProtectedRoute><RiskRegister /></ProtectedRoute>} />
          <Route path="/project-management" element={<ProtectedRoute><ProjectManagement /></ProtectedRoute>} />
          <Route path="/project-schedule" element={<ProtectedRoute><ProjectManagement /></ProtectedRoute>} />
          <Route path="/jira-board" element={<ProtectedRoute><JiraBoard /></ProtectedRoute>} />
          <Route path="/investigation-reports" element={<ProtectedRoute><InvestigationReports /></ProtectedRoute>} />
          <Route path="/esg-reporting" element={<ProtectedRoute><ESGReporting /></ProtectedRoute>} />
          <Route path="/training" element={<ProtectedRoute><TrainingManagement /></ProtectedRoute>} />
          <Route path="/regulations" element={<ProtectedRoute><RegulationsLibrary /></ProtectedRoute>} />
          <Route path="/regulations-library" element={<ProtectedRoute><RegulationsLibrary /></ProtectedRoute>} />
          <Route path="/quality-management" element={<ProtectedRoute><QualityManagement /></ProtectedRoute>} />
          <Route path="/industrial-hygiene" element={<ProtectedRoute><IndustrialHygiene /></ProtectedRoute>} />
          <Route path="/international-standards" element={<ProtectedRoute><InternationalStandards /></ProtectedRoute>} />
          <Route path="/ai-robotics" element={<ProtectedRoute><RegulationsLibrary /></ProtectedRoute>} />
          <Route path="/chemical-sds" element={<ProtectedRoute><ChemicalSDSManagement /></ProtectedRoute>} />
          <Route path="/property-incident" element={<ProtectedRoute><PropertyIncidentReport /></ProtectedRoute>} />
          <Route path="/root-cause" element={<ProtectedRoute><RootCauseCorrectiveAction /></ProtectedRoute>} />
          <Route path="/safety-hub" element={<ProtectedRoute><SafetyManagementHub /></ProtectedRoute>} />
          <Route path="/permit-to-work" element={<ProtectedRoute><PermitToWork /></ProtectedRoute>} />
          <Route path="/swppp" element={<ProtectedRoute><SWPPPCompliance /></ProtectedRoute>} />
          <Route path="/stormwater-checklist" element={<ProtectedRoute><StormWaterChecklist /></ProtectedRoute>} />
          <Route path="/sensor-config" element={<ProtectedRoute><SensorConfiguration /></ProtectedRoute>} />
          <Route path="/inspection-scheduling" element={<ProtectedRoute><InspectionScheduling /></ProtectedRoute>} />
          <Route path="/epa-dashboard" element={<ProtectedRoute><EPAReportingDashboard /></ProtectedRoute>} />
          <Route path="/sensor-calibration" element={<ProtectedRoute><SensorCalibration /></ProtectedRoute>} />
          <Route path="/risk-checklists" element={<ProtectedRoute><RiskAssessmentChecklists /></ProtectedRoute>} />
          <Route path="/custom-report-builder" element={<ProtectedRoute><CustomReportBuilder /></ProtectedRoute>} />
          <Route path="/checklist-builder" element={<ProtectedRoute><ChecklistBuilder /></ProtectedRoute>} />
          <Route path="/language" element={<ProtectedRoute><LanguageSelector /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/near-miss" element={<ProtectedRoute><NearMissReport /></ProtectedRoute>} />
          <Route path="/toolbox-talks" element={<ProtectedRoute><ToolboxTalks /></ProtectedRoute>} />
          <Route path="/kpi-indicators" element={<ProtectedRoute><KPIIndicators /></ProtectedRoute>} />
          <Route path="/report-dashboard" element={<ProtectedRoute><ReportDashboard /></ProtectedRoute>} />
          <Route path="/automation-rule-builder" element={<ProtectedRoute><AutomationRuleBuilder /></ProtectedRoute>} />
          <Route path="/webhooks" element={<ProtectedRoute><WebhooksPage /></ProtectedRoute>} />
          <Route path="/gap-analysis" element={<ProtectedRoute><ComplianceGapAnalysis /></ProtectedRoute>} />
          <Route path="/certification-tracker" element={<ProtectedRoute><CertificationTracker /></ProtectedRoute>} />
          <Route path="/cross-reference" element={<ProtectedRoute><CrossReferenceMatrix /></ProtectedRoute>} />
          <Route path="/sif-dashboard" element={<ProtectedRoute><SIFPrecursorDashboard /></ProtectedRoute>} />
          <Route path="/voice-hazard" element={<ProtectedRoute><VoiceHazardReport /></ProtectedRoute>} />
          <Route path="/form-configurator" element={<ProtectedRoute><NoCodeFormConfigurator /></ProtectedRoute>} />
          <Route path="/enterprise" element={<ProtectedRoute><EnterpriseCommandCenter /></ProtectedRoute>} />
          <Route path="/organization" element={<ProtectedRoute><OrganizationSettings /></ProtectedRoute>} />
          <Route path="/global-compliance" element={<ProtectedRoute><GlobalComplianceHub /></ProtectedRoute>} />
          <Route path="/contractor-permits" element={<ProtectedRoute><ContractorPermitManagement /></ProtectedRoute>} />
          <Route path="/sustainability" element={<ProtectedRoute><SustainabilityDashboard /></ProtectedRoute>} />
          <Route path="/predictive-safety" element={<ProtectedRoute><PredictiveSafetyAI /></ProtectedRoute>} />
          <Route path="/demo" element={<LandingPage />} />
          <Route path="/mobile-worker" element={<ProtectedRoute><MobileWorkerApp /></ProtectedRoute>} />
          <Route path="/compliance-reporting" element={<ProtectedRoute><ComplianceReporting /></ProtectedRoute>} />
          <Route path="/worker-dashboard" element={<ProtectedRoute><WorkerDashboard /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><SafetyLeaderboard /></ProtectedRoute>} />
          <Route path="/supervisor-approvals" element={<ProtectedRoute><SupervisorApprovals /></ProtectedRoute>} />
          <Route path="/notification-center" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
          <Route path="/incident-heatmap" element={<ProtectedRoute><IncidentHeatmap /></ProtectedRoute>} />
          <Route path="/incident-trends" element={<ProtectedRoute><IncidentTrendAnalytics /></ProtectedRoute>} />
          <Route path="/advanced-tech" element={<ProtectedRoute><AdvancedTechnologyHub /></ProtectedRoute>} />
          <Route path="/self-admin" element={<ProtectedRoute><SelfAdminPlatform /></ProtectedRoute>} />
          <Route path="/app-builder" element={<ProtectedRoute><CustomAppBuilder /></ProtectedRoute>} />
          <Route path="/visual-audit" element={<ProtectedRoute><AIVisualAuditHub /></ProtectedRoute>} />
          <Route path="/visual-audit/tool" element={<ProtectedRoute><AIVisualAudit /></ProtectedRoute>} />
          <Route path="/visual-audit/history" element={<ProtectedRoute><AIVisualAuditHistory /></ProtectedRoute>} />
          <Route path="/visual-audit/scan" element={<ProtectedRoute><AssetQRScanner /></ProtectedRoute>} />
          <Route path="/visual-audit/template" element={<ProtectedRoute><AIAuditTemplateForm /></ProtectedRoute>} />
          <Route path="/iot-sensors" element={<ProtectedRoute><IoTSensorDashboard /></ProtectedRoute>} />
          <Route path="/ai-training-modules" element={<ProtectedRoute><AITrainingModules /></ProtectedRoute>} />
          <Route path="/compliance-calendar" element={<ProtectedRoute><ComplianceCalendar /></ProtectedRoute>} />
          <Route path="/retention-analytics" element={<ProtectedRoute><RetentionAnalytics /></ProtectedRoute>} />
          <Route path="/email-notifications" element={<ProtectedRoute><EmailNotificationSystem /></ProtectedRoute>} />
          <Route path="/pilot-program" element={<ProtectedRoute><PilotProgram /></ProtectedRoute>} />
          <Route path="/data-security" element={<ProtectedRoute><DataSecurityHub /></ProtectedRoute>} />
          <Route path="/hyper-care-training" element={<ProtectedRoute><HyperCareTraining /></ProtectedRoute>} />
          <Route path="/executive-reports" element={<ProtectedRoute><ExecutiveReportDashboard /></ProtectedRoute>} />
          <Route path="/v2-roadmap" element={<ProtectedRoute><V2Roadmap /></ProtectedRoute>} />
          <Route path="/automated-pdf-reports" element={<ProtectedRoute><AutomatedPdfReports /></ProtectedRoute>} />
          <Route path="/offline-sync-test" element={<ProtectedRoute><MobileOfflineSyncTest /></ProtectedRoute>} />
          <Route path="/behavior-based-safety" element={<ProtectedRoute><BehaviorBasedSafety /></ProtectedRoute>} />
          <Route path="/bowtie-analysis" element={<ProtectedRoute><BowTieAnalysis /></ProtectedRoute>} />
          <Route path="/sso-login" element={<ProtectedRoute><SSOLoginFlow /></ProtectedRoute>} />
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </GestureNavigationProvider>
  );
}

function AuthAwareWidgets() {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return null;
  return (
    <>
      <AISafetyAssistant />
      <FeedbackWidget />
      <OnboardingWalkthrough />
    </>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SMToastProvider />
      <AnimatedRoutes />
      <AuthAwareWidgets />
    </Router>
  );
}

export default App;
