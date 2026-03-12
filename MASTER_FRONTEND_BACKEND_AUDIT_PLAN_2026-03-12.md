# SafetyMEG Master Frontend, Component, Integration, and QA Audit Plan

Prepared on: March 12, 2026  
Purpose: This is the primary reference document for the full page-by-page and component-by-component audit of the SafetyMEG platform before execution testing begins.  
Rule for this phase: No git push, no deployment action, and no status inflation inside the audit itself. This document is intentionally operational and factual so it can be used as the source of truth during the testing pass.

## 1. Audit Objective

The objective of this audit is to verify, page by page and component by component, that the platform is stable, navigable, integrated, and production-credible across the following dimensions:

- Route navigation works from every user-facing button, CTA, menu item, quick action, tab, card, modal trigger, and deep link.
- Every page opens cleanly, opens at the top, and does not land at a random scroll position.
- Protected routes respect authentication and do not leak unauthenticated access.
- Backend-backed pages complete expected CRUD operations correctly.
- AI features respond correctly, fail safely, and do not produce runtime errors.
- Frontend state, API state, and backend persistence remain consistent after create, update, delete, refresh, and reload operations.
- No obvious runtime errors, broken layouts, dead buttons, blank states without messaging, or severe integration regressions remain.

This document is not the implementation report and not the pending-gap report. Those two documents will be produced after execution testing is completed.

## 2. Planned Deliverables After This Master Plan

After testing is executed using this file as the reference, the work should produce three operational outputs:

1. Master plan and inventory reference:
   MASTER_FRONTEND_BACKEND_AUDIT_PLAN_2026-03-12.md
2. Implemented and verified coverage report:
   IMPLEMENTED_AND_VERIFIED_AREAS_2026-03-12.md
3. Missing, partial, or broken areas report:
   REMAINING_GAPS_AND_DEFECTS_2026-03-12.md

Optional fourth artifact if execution becomes large:

4. TEST_EXECUTION_LOG_2026-03-12.md

## 3. Current Repository Snapshot Used For Planning

The planning baseline for this audit is the current repository state in the local workspace.

- Frontend files in primary audit scope: 310
- Files under pages: 100
- Files under components: 140
- Frontend architecture: React 18, TypeScript, Vite, HashRouter, Zustand, Tailwind, Framer Motion
- Backend architecture: Hono.js, Node.js, SQLite, JWT auth, Railway-hosted API surface
- Known verified backend-backed slices from prior work: Dashboard incident overview, Incident Reporting, Root Cause / RCCA, Investigation Reports, Training Management, Safety Audit, Risk Register, Automation Rules, Webhooks, Chemical SDS, and substantial compliance-related flows
- Known partial-risk areas from prior work: some pages still use mock data, localStorage behavior, or browser-side services; AI Visual Audit flows are known partial candidates and must be tested carefully

## 4. Global Acceptance Criteria

Every page and component in scope should be judged against the following acceptance criteria.

### 4.1 Navigation and Routing

- Every visible navigation action must route to the intended screen.
- No button should silently do nothing unless explicitly disabled.
- No route should unexpectedly redirect to the homepage unless that is the defined auth fallback.
- Refresh on a valid route should preserve correct app behavior.
- Every route change should open at the top of the page.
- Catch-all routes should only handle invalid paths, not valid feature paths.

### 4.2 Rendering and UI Stability

- No blank screen.
- No React error boundary failures.
- No obvious console runtime error.
- Loaders and empty states should be intentional.
- Modals should open, close, and restore focus correctly.
- Mobile and desktop layout should remain usable.

### 4.3 CRUD and Persistence

- Create operations should persist to backend where backend integration exists.
- Read operations should show current backend state after refresh.
- Update operations should persist and be reflected without stale UI.
- Delete or archive operations should remove or change the record state predictably.
- Optimistic UI should not mask failed persistence.

### 4.4 AI and Automation

- AI entry points should be discoverable and functional.
- Loading, error, and fallback behavior should be user-safe.
- Responses should render without malformed layout.
- Voice, image, attachment, or suggestion workflows should fail gracefully where unsupported.

### 4.5 Security and Auth

- Unauthenticated access to protected pages must redirect to login.
- Authenticated widgets should not appear on login and register pages.
- Role-sensitive UI should not expose unsupported actions accidentally.
- Token refresh and session restore should not break page rendering.

## 5. Execution Strategy

Testing should be executed in the following order.

### Phase 1: Shell, auth, and shared layout validation

- Login
- Register
- Session restore
- Logout
- Top navigation
- Bottom navigation
- Scroll-to-top behavior
- Floating widgets
- Route guards

### Phase 2: Core data pages with live backend dependency

- Dashboard
- Incident flows
- Investigation flows
- RCCA flows
- Training flows
- Risk flows
- Audit flows
- Sensors and compliance flows

### Phase 3: AI and advanced workflows

- AI Safety Copilot
- AI Visual Audit family
- Predictive Safety AI
- AI Training Modules
- Voice Hazard reporting
- AI-based suggestions or assistance embedded in pages

### Phase 4: Secondary modules and admin experiences

- Notifications
- Organization settings
- Custom builders
- Webhooks
- Automation rules
- Reporting and exports
- Security and SSO areas

### Phase 5: Cross-cutting verification

- Mobile responsiveness
- Retry behavior after failed requests
- Empty-state correctness
- Refresh consistency
- Duplicate submit prevention
- Data consistency after reload

## 6. How Results Must Be Classified During Testing

Each audited item must be marked using one of these statuses:

- Verified Working
- Working with Minor UX Issue
- Partially Integrated
- Frontend Only
- Mock/Data Placeholder
- Broken Navigation
- Broken CRUD
- Runtime Error
- Blocked by Missing Backend Contract
- Blocked by Environment or Credentials

## 7. Page-by-Page Audit Matrix

This section lists every page file currently present in frontend/src/pages and defines what each page is, what must be tested, and what integration expectation exists.

### 7.1 Access, shell, and entry pages

- LoginPage.tsx: login entry; verify validation, auth API request, bad credential handling, success redirect, hidden authenticated-only widgets, and refresh behavior.
- RegisterPage.tsx: account creation entry; verify registration submission, field validation, success redirect, and correct auth state hydration.
- LandingPage.tsx: public/demo landing experience; verify public access, CTA routing, and no protected shell leakage.
- SSOLoginFlow.tsx: enterprise sign-in flow; verify routing, loader, callback/error state, and unsupported-provider handling.

### 7.2 Dashboard, navigation, and overview pages

- Dashboard.tsx: authenticated landing dashboard; verify KPI loading, compliance alerts, incident CTA buttons, chart rendering, backend overview data, and navigation from summary cards.
- SafetyManagementHub.tsx: central safety hub; verify navigation out to related safety modules and absence of dead CTAs.
- AdvancedTechnologyHub.tsx: advanced feature hub; verify route cards and feature entry points.
- EnterpriseCommandCenter.tsx: executive/enterprise overview; verify route cards, filters, and dashboard widgets.
- WorkerDashboard.tsx: worker-focused view; verify mobile-friendly rendering, quick actions, and role-safe navigation.
- ReportDashboard.tsx: reporting hub; verify report cards, drill-down navigation, and export entry points.
- ExecutiveReportDashboard.tsx: leadership reporting view; verify summary panels, charts, and export actions.
- NotificationCenter.tsx: in-app notification center; verify read state, filters, and navigation from notifications.
- NotificationSettings.tsx: settings page for notification preferences; verify persistence behavior and save/update flow.
- UserProfile.tsx: profile management; verify read, edit, save, and refresh consistency.
- LanguageSelector.tsx: language preference screen; verify selection persistence and UI updates.

### 7.3 Incident, injury, near-miss, and investigation pages

- IncidentReporting.tsx: main incident creation page; verify create flow, field validation, AI suggestion flow if present, worker lookup, submission persistence, and post-submit state.
- InjuryReport.tsx: injury-specific incident flow; verify specialized fields, body diagram/photo flows if present, and persistence.
- VehicleIncidentReport.tsx: vehicle incident flow; verify transport-specific fields and persistence.
- PropertyIncidentReport.tsx: property damage flow; verify create flow and persistence.
- FullIncidentReport.tsx: extended incident form; verify section navigation, save behavior, and completeness checks.
- NearMissReport.tsx: near-miss reporting flow; verify create flow and list/state update.
- InvestigationReports.tsx: investigation list and detail view; verify backend list loading, expand/detail flow, RCCA linkage, and status changes.
- RootCauseCorrectiveAction.tsx: RCCA workflow; verify incident-linked load, backend draft/final save behavior, controls hierarchy load, and update persistence.
- IncidentHeatmap.tsx: incident visualization; verify backend load, filters, and chart/map rendering.
- IncidentTrendAnalytics.tsx: incident trend analytics; verify chart rendering, filter changes, and backend-driven updates.

### 7.4 Risk, hazard, bow-tie, and analysis pages

- RiskAssessment.tsx: assessment workflow; verify create/edit flow, scoring logic, and persistence if integrated.
- HazardAssessment.tsx: hazard-specific assessment; verify form behavior and route actions.
- RiskRegister.tsx: live risk registry; verify list load, stats, detail load, create, update, filtering, and refresh consistency.
- RiskAssessmentChecklists.tsx: checklist-based risk flow; verify checklist rendering, completion state, and persistence path.
- RiskDigester.tsx: risk digest analytics; verify data source, charts, emissions widgets, and cross-links.
- BowTieAnalysis.tsx: bow-tie workflow; verify create/edit/render behavior and backend relationship if present.
- SIFPrecursorDashboard.tsx: precursor dashboard; verify metrics, charts, and navigation.
- BehaviorBasedSafety.tsx: behavior tracking page; verify create/list/update behaviors and analytics widgets.
- VoiceHazardReport.tsx: voice-enabled hazard report; verify voice capture permission flow, transcript handling, and submission path.

### 7.5 Audit, inspection, checklist, and field execution pages

- SafetyAudit.tsx: backend-backed audit operations; verify stats, list, detail, create audit, create finding, severity filtering, and refresh.
- InspectionScheduling.tsx: inspections planning; verify schedule CRUD, calendar/list transitions, and persistence.
- ChecklistBuilder.tsx: custom checklist builder; verify checklist CRUD and schema persistence.
- PermitToWork.tsx: permit workflow; verify create, approval, status transitions, and route actions.
- ToolboxTalks.tsx: toolbox talk records; verify create/list/update/export behaviors.
- AssetQRScanner.tsx: QR-based asset/inspection entry; verify scan flow, fallback/manual entry, and downstream navigation.
- MobileOfflineSyncTest.tsx: offline validation page; verify offline queue, sync state, and reconnection behavior.

### 7.6 Compliance, procedures, standards, and governance pages

- ComplianceAndProcedures.tsx: compliance procedures page; verify backend live procedure load plus static standards reference content.
- ComplianceGapAnalysis.tsx: gap analysis workflow; verify data load, findings, save/update behavior, and exports if present.
- ComplianceReporting.tsx: compliance reporting page; verify report generation, filters, and backend calls.
- ComplianceCalendar.tsx: compliance calendar page; verify event load, add/edit/delete where present, and date navigation.
- CrossReferenceMatrix.tsx: standards mapping page; verify matrix rendering, mapping edits, and export behavior.
- CertificationTracker.tsx: certification management; verify list load, add/update flows, expiry logic, and reminders.
- RegulationsLibrary.tsx: regulatory library; verify browsing, search, content detail, and no broken references.
- InternationalStandards.tsx: standards reference view; verify content structure and route accessibility.
- NFPACodes.tsx: NFPA reference page; verify search, lookup, and display behavior.
- SafetyProcedures.tsx: safety procedure content; verify rendering, document navigation, and action buttons.
- GlobalComplianceHub.tsx: global compliance overview; verify cards, drill-down routes, and data views.
- DataSecurityHub.tsx: security and compliance center; verify route actions, settings cards, and backend dependency where present.

### 7.7 Training, workforce, and people pages

- TrainingManagement.tsx: backend-backed training center; verify course load, compliance summary, expiring records, assignment flow, filters, and refresh.
- AITrainingModules.tsx: AI-generated training modules page; verify content generation path, loading/error handling, and save or assignment actions.
- HyperCareTraining.tsx: intensive training program page; verify flows, progress, and backend persistence if implemented.
- SafetyLeaderboard.tsx: gamified leaderboard; verify ranking load, filters, and worker/team drill-down behavior.
- SupervisorApprovals.tsx: supervisor action queue; verify approval/rejection flows and state refresh.
- MobileWorkerApp.tsx: field-worker experience; verify mobile layout, quick tasks, and backend data usage.

### 7.8 Sensor, IoT, environmental, and sustainability pages

- IoTSensorDashboard.tsx: sensor monitoring page; verify live readings, counts, thresholds, filters, and charts.
- SensorConfiguration.tsx: sensor config page; verify configuration CRUD, threshold save, and validation.
- SensorCalibration.tsx: calibration management; verify create/update status and asset linkage.
- EPAReportingDashboard.tsx: EPA dashboard; verify environmental metrics and reporting flows.
- EmissionReports.tsx: emissions reporting page; verify report generation, chart data, and export behavior.
- ESGReporting.tsx: ESG data page; verify metrics load, summaries, and report outputs.
- SustainabilityDashboard.tsx: sustainability overview; verify KPI cards and trends.
- SWPPPCompliance.tsx: SWPPP page; verify forms, checklist navigation, and data persistence.
- StormWaterChecklist.tsx: stormwater checklist page; verify checklist progression and save behavior.
- IndustrialHygiene.tsx: hygiene monitoring page; verify exposure or observation flows and backend usage.
- ChemicalSDSManagement.tsx: SDS management page; verify backend chemical list load, search, detail, and related navigation.

### 7.9 Project, planning, and operational management pages

- ProjectManagement.tsx: project schedule or board-linked view; verify task navigation, edit operations, and backend linkage.
- JiraBoard.tsx: agile board page; verify backlog, sprint, task detail, workflow movement, and modal actions.
- PilotProgram.tsx: pilot workflow page; verify enrollment/status actions and reporting.
- OrganizationSettings.tsx: organization configuration page; verify setting load/save and permission constraints.
- SelfAdminPlatform.tsx: self-admin page; verify admin actions, route availability, and save flows.
- NoCodeFormConfigurator.tsx: custom form builder; verify schema CRUD and preview behavior.
- CustomAppBuilder.tsx: custom app composition page; verify builder flow, saves, and generated entity configuration.
- AutomationRuleBuilder.tsx: backend-backed automation rules; verify rule list, create, update, delete, and trigger behavior.
- WebhooksPage.tsx: backend-backed webhook management; verify list, create, update, delete, and test/send actions.

### 7.10 AI, predictive, and advanced automation pages

- AIVisualAuditHub.tsx: visual audit entry page; verify route cards, history access, scan access, and start flow.
- AIVisualAudit.tsx: visual audit execution page; verify upload, preview, analysis request, fallback behavior, and saved result behavior.
- AIVisualAuditHistory.tsx: visual audit history; verify history load, persistence source, reload consistency, and detail navigation.
- AIAuditTemplateForm.tsx: AI audit template management; verify form creation/editing and save path.
- PredictiveSafetyAI.tsx: predictive safety intelligence; verify forecast generation, chart rendering, and API dependency.
- AutomatedPdfReports.tsx: automated document generation page; verify report templates, scheduling, and output handling.
- RetentionAnalytics.tsx: retention analytics view; verify charts, filters, and data consistency.
- EmailNotificationSystem.tsx: email notification management; verify templates, triggers, send/test flows, and backend persistence.
- KPIIndicators.tsx: KPI metric management page; verify metric load, filter, and create/update behavior.
- V2Roadmap.tsx: roadmap page; verify rendering and no dead CTAs.

### 7.11 Reporting, quality, and supporting operational pages

- QualityManagement.tsx: quality workflow page; verify records, statuses, and save/update behavior.
- ContractorPermitManagement.tsx: contractor permit workflow; verify contractor list, permit state transitions, and backend actions.

### 7.12 Supporting page files that must still be included in planning

- README.md: page directory documentation; verify it matches actual route/page state during documentation cleanup.
- __tests__/CertificationTracker.test.tsx: page-level regression coverage for certification tracker.
- __tests__/ComplianceGapAnalysis.test.tsx: regression coverage for compliance gap analysis.
- __tests__/CrossReferenceMatrix.test.tsx: regression coverage for cross-reference matrix.
- __tests__/FullIncidentReport.test.tsx: regression coverage for full incident report.
- __tests__/SIFPrecursorDashboard.test.tsx: regression coverage for SIF dashboard.
- __tests__/VehicleIncidentReport.test.tsx: regression coverage for vehicle incident reporting.

## 8. Component Audit Inventory by Folder

This section defines what must be inspected across the component layer. Where components are shared, testing must include every page that consumes them.

### 8.1 Root shared components

- AISafetyAssistant.tsx: primary floating AI copilot; verify open/close, send message, quick actions, microphone, attachments, regenerate, feedback, conversation history, fullscreen mode, text-to-speech, error handling, and auth-aware visibility.
- ThemeProvider.tsx: theme context provider; verify theme switching does not break route rendering.
- README.md: component directory documentation; compare against actual component inventory after audit.

### 8.2 Agile components

Folder responsibility: project management, sprint planning, backlog handling, command and task interactions.

Files in scope:

- agile/BacklogManagement.tsx
- agile/CommandPalette.tsx
- agile/ProjectCharter.tsx
- agile/ProjectClosure.tsx
- agile/ReleasePlanningView.tsx
- agile/SprintPlanningView.tsx
- agile/SprintRetrospectives.tsx
- agile/SprintSettings.tsx
- agile/TaskDetailModal.tsx
- agile/VelocityCharts.tsx
- agile/WorkflowAutomation.tsx
- agile/index.ts
- agile/__tests__/BacklogManagement.test.tsx
- agile/__tests__/CommandPalette.test.tsx
- agile/__tests__/ProjectCharter.test.tsx
- agile/__tests__/ProjectClosure.test.tsx
- agile/__tests__/ReleasePlanningView.test.tsx
- agile/__tests__/SprintPlanningView.test.tsx
- agile/__tests__/SprintRetrospectives.test.tsx
- agile/__tests__/SprintSettings.test.tsx
- agile/__tests__/TaskDetailModal.test.tsx
- agile/__tests__/VelocityCharts.test.tsx
- agile/__tests__/WorkflowAutomation.test.tsx
- agile/__tests__/index.test.ts

Audit expectations:

- Task create/edit/move behavior must not desync from page state.
- Modal components must open and close predictably.
- Charts must render without NaN or empty-axis issues.
- Export barrel and tests must align with current component API.

### 8.3 Analytics components

Files in scope:

- analytics/IncidentAnalyticsDashboard.tsx
- analytics/index.ts

Audit expectations:

- Charts, filters, and incident metric visualizations should match page usage and not break on empty datasets.

### 8.4 Animation and transition components

Files in scope:

- animations/BlurText.tsx
- animations/FadeContent.tsx
- animations/PageTransition.tsx
- animations/PullToRefresh.tsx
- animations/SwipeNavigator.tsx

Audit expectations:

- No animation should block primary functionality, scroll behavior, pointer interaction, or route transitions.

### 8.5 Auth components

Files in scope:

- auth/BiometricAuth.tsx
- auth/index.ts

Audit expectations:

- Any auth enhancement must degrade safely where browser/device support is missing.

### 8.6 Collaboration components

Files in scope:

- collaboration/CollaborationPanel.tsx
- collaboration/index.ts

Audit expectations:

- Panel mounting, mentions, shared updates, and layout behavior should not disrupt core workflows.

### 8.7 Dashboard components

Files in scope:

- dashboard/BottomTabNavigation.tsx
- dashboard/ComplianceAlerts.tsx
- dashboard/FeatureGrid.tsx
- dashboard/GamificationStats.tsx
- dashboard/GestureComponents.tsx
- dashboard/IncidentCard.tsx
- dashboard/IncidentList.tsx
- dashboard/KPICharts.tsx
- dashboard/NavigationBar.tsx
- dashboard/QuickTabSwitcher.tsx
- dashboard/RealTimeAlerts.tsx
- dashboard/SafetyChecklist.tsx
- dashboard/Skeleton.tsx
- dashboard/SwipeIndicator.tsx
- dashboard/UnifiedSafetyHub.tsx
- dashboard/types.ts

Audit expectations:

- All cards, tabs, CTA buttons, and nav items must route correctly.
- NavigationBar and BottomTabNavigation act as critical shared controls and should be treated as release blockers if broken.
- IncidentList and related cards must open the intended reporting flows.
- Skeleton and alert components must not trap stale loading states.

### 8.8 Leaderboard components

Files in scope:

- leaderboard/TeamLeaderboard.tsx
- leaderboard/index.ts

Audit expectations:

- Ranking views should remain stable with empty, partial, and full datasets.

### 8.9 PWA components

Files in scope:

- pwa/PWAInstaller.tsx
- pwa/index.ts

Audit expectations:

- Install prompts should appear only when valid and should not interrupt core navigation.

### 8.10 Report components

Files in scope:

- reports/CustomReportBuilder.tsx
- reports/SafetyReportTemplates.tsx
- reports/index.ts

Audit expectations:

- Export, template selection, and report preview behavior should be validated in both empty and populated data states.

### 8.11 Safety component library

Folder responsibility: the largest supporting component area covering incident capture, AI support, investigation, compliance, notifications, workflow, and specialized calculators.

Files in scope:

- safety/AIAnalyticsEngine.tsx
- safety/AIAssistant/EHSAIAssistant.tsx
- safety/AIAutomatedReporting.tsx
- safety/AIMalwareSecurity.tsx
- safety/AIRiskAnalysis.tsx
- safety/AITrainingGenerator.tsx
- safety/AuditTrail/AuditTrail.tsx
- safety/AuditTrail/index.ts
- safety/BodyDiagram.tsx
- safety/CAPAReminder.tsx
- safety/CombinedIncidentInjuryReport.tsx
- safety/CompanyHeader.tsx
- safety/ComplianceDashboard/ComplianceDashboard.tsx
- safety/ComplianceDashboard/index.ts
- safety/CriticalLiftPlan/CriticalLiftPlan.tsx
- safety/EHSWorkflow/ActionModal.tsx
- safety/EHSWorkflow/DetailModal.tsx
- safety/EHSWorkflow/EHSWorkflowDashboard.tsx
- safety/EHSWorkflow/ExportModal.tsx
- safety/EHSWorkflow/ProjectWorkflow.tsx
- safety/EHSWorkflow/StageCard.tsx
- safety/EHSWorkflow/StageStepper.tsx
- safety/EHSWorkflow/index.ts
- safety/ESignatureCertificate/ESignatureCertificate.tsx
- safety/ESignatureCertificate/index.ts
- safety/EmailNotification/EmailNotification.tsx
- safety/EmailTemplates/NotificationEmailTemplates.tsx
- safety/EmailTemplates/index.ts
- safety/EnhancedInjuryReport.tsx
- safety/FishboneDiagram.tsx
- safety/FiveWhysAnalysis.tsx
- safety/HierarchyOfControls.tsx
- safety/ISOControlsChecklist.tsx
- safety/IncidentAnalytics/IncidentAnalytics.tsx
- safety/InjuryPhotoUpload.tsx
- safety/InjurySeverityCalculator.tsx
- safety/InjuryTrendAnalytics.tsx
- safety/JSABuilder.tsx
- safety/LessonsLearnedPanel.tsx
- safety/MobileDataCollection.tsx
- safety/NotificationService.tsx
- safety/OSHAISOWorkflow/OSHAISOWorkflow.tsx
- safety/OSHALogGenerator/OSHALogGenerator.tsx
- safety/OpenAPIIntegration.tsx
- safety/PhotoUpload.tsx
- safety/PropertyDamageReport.tsx
- safety/PushNotifications/PushNotifications.tsx
- safety/PushNotifications/index.ts
- safety/QRCodeAudit.tsx
- safety/QRCodeFeature/QRCodeFeature.tsx
- safety/QRCodeFeature/index.ts
- safety/QualityManagement/QualityManagement.tsx
- safety/RealTimeNotifications/RealTimeNotifications.tsx
- safety/RealTimeNotifications/index.ts
- safety/RealTimeThreatAlerts.tsx
- safety/RiggingCalculator/RiggingCalculator.tsx
- safety/SafetyAutoPilot.tsx
- safety/SafetyScorecard/SafetyScorecard.tsx
- safety/SafetyScorecard/index.ts
- safety/SecurityIncidentResponse.tsx
- safety/SignatureCanvas.tsx
- safety/SignaturePad.tsx
- safety/TapRootAnalysis.tsx
- safety/UnifiedInvestigation.tsx
- safety/UniversalJSA.tsx
- safety/risk-digester/CAPATable.tsx
- safety/risk-digester/EmissionsChart.tsx
- safety/risk-digester/KPIWidget.tsx
- safety/risk-digester/StandardsReference.tsx
- safety/risk-digester/emissions/EmissionHistoryTable.tsx
- safety/risk-digester/emissions/EmissionTypeCard.tsx
- safety/risk-digester/emissions/FacilityBreakdownChart.tsx

Audit expectations:

- Form-support components must validate file upload, signature, photo, and diagram interactions.
- Investigation-analysis components must render structured reasoning tools correctly.
- Notification, push, and real-time wrappers must fail safely when browser permissions are denied.
- Risk-digester analytics components must not crash on incomplete datasets.
- AI wrappers must be checked for both successful and failed request states.

### 8.12 Scheduling components

Files in scope:

- scheduling/CalendarView.tsx

Audit expectations:

- Calendar interactions, date navigation, and event rendering must work in scheduling pages.

### 8.13 Voice components

Files in scope:

- voice/VoiceCommands.tsx
- voice/index.ts

Audit expectations:

- Speech recognition permissions, transcript capture, fallback states, and cleanup must be verified.

### 8.14 Widget components

Files in scope:

- widgets/DashboardWidgets.tsx
- widgets/FeedbackWidget.tsx
- widgets/OnboardingWalkthrough.tsx
- widgets/index.ts

Audit expectations:

- Widgets must mount only where intended.
- FeedbackWidget and OnboardingWalkthrough must not break auth pages.
- DashboardWidgets must not duplicate or conflict with page-level KPI rendering.

## 9. Supporting Frontend File Audit Inventory

This section covers the rest of the frontend files that influence integration, state, mock data usage, exports, and environment behavior.

### 9.1 API layer

Files in scope:

- api/README.md
- api/hooks/index.ts
- api/hooks/useAPIHooks.ts
- api/services/apiService.ts
- api/services/index.ts

Audit expectations:

- Confirm the frontend contract matches real backend `/api/...` routes.
- Identify missing adapters and stale endpoint definitions.
- Ensure hooks expose correct loading, error, mutate, and refetch behavior.

### 9.2 Hooks

Files in scope:

- hooks/useGeolocation.ts
- hooks/usePinchZoom.ts
- hooks/usePullToRefresh.ts
- hooks/useRBAC.ts
- hooks/useSwipeNavigation.ts
- hooks/useVoiceRecognition.ts

Audit expectations:

- Browser APIs must fail safely when unsupported.
- Gesture hooks must not interfere with form inputs or route navigation.
- RBAC hook must not expose actions incorrectly.

### 9.3 Layouts

Files in scope:

- layouts/AppLayout.tsx
- layouts/README.md

Audit expectations:

- AppLayout must remain the single authenticated shell.
- Navigation shell must wrap all protected pages consistently.

### 9.4 Services

Files in scope:

- services/aiService.ts
- services/auditLogService.ts
- services/automatedReportScheduler.ts
- services/emailNotificationService.ts
- services/encryptionService.ts
- services/geotagCache.ts
- services/pushNotificationService.ts
- services/rbacService.ts
- services/realTimeNotificationService.ts
- services/sdsDatabase.ts
- services/smsNotificationService.ts
- services/ssoService.ts
- services/webhookService.ts

Audit expectations:

- Determine which services are browser-local helpers versus true backend adapters.
- Replace or flag any business-critical service that only simulates production behavior.
- Validate AI, notification, webhook, and SSO flows against real runtime constraints.

### 9.5 Store

Files in scope:

- store/README.md
- store/appStore.ts
- store/authStore.ts
- store/index.ts

Audit expectations:

- Auth persistence, token restore, and logout cleanup must be verified.
- App-level state should not leak stale records across pages.

### 9.6 Utilities

Files in scope:

- utils/exports/auditReportExport.ts
- utils/exports/complianceExport.ts
- utils/exports/compliancePdfExport.ts
- utils/exports/emailDelivery.ts
- utils/exports/excelExport.ts
- utils/exports/incidentPdfExport.ts
- utils/exports/weeklySafetyReport.ts
- utils/jsaPdfExport.ts
- utils/mobileFeatures.ts
- utils/offline/OfflineSyncManager.tsx
- utils/offline/index.ts
- utils/offline/offlineSync.ts
- utils/realTimeSync.ts

Audit expectations:

- Exports must produce correct files or fail clearly.
- Offline and real-time helpers must not create hidden desynchronization.

### 9.7 Data and mock sources

Files in scope:

- data/complianceManagement.ts
- data/ehsData.ts
- data/internationalStandards.ts
- data/mockAnalytics.ts
- data/mockAssets.ts
- data/mockAudit.ts
- data/mockCapaControls.ts
- data/mockChemicalSDS.ts
- data/mockComplianceProcedures.ts
- data/mockEHSWorkflow.ts
- data/mockESG.ts
- data/mockNavigation.ts
- data/mockProjectManagement.ts
- data/mockRiskAssessmentTemplates.ts
- data/mockRiskDigester.ts
- data/mockRiskRegister.ts
- data/mockSafetyProcedures.ts
- data/mockScheduling.ts
- data/mockSensor.ts
- data/mockTrainingManagement.ts
- data/nfpaCodes.ts
- data/regulationsLibrary.ts

Audit expectations:

- Each import site must be tracked and classified as acceptable static reference data or unacceptable production mock dependency.
- Static standards libraries can remain if intentionally reference-only.
- Business records, workflows, and operational metrics should be moved off mock data wherever required.

### 9.8 Internationalization

Files in scope:

- i18n/index.ts
- i18n/locales/en.json
- i18n/locales/es.json
- i18n/locales/fr.json

Audit expectations:

- Language switching should not break page rendering.
- Missing translation keys should be logged during the audit where visible.

## 10. Backend-to-Frontend Integration Focus Areas

This is the priority integration list that must be verified first because these areas are either already integrated or expected to be integrated.

### 10.1 High-priority verified or near-verified backend slices

- Dashboard overview and recent incidents
- Incident reporting and incident creation endpoints
- Training management data and assignment endpoints
- Safety audit stats, list, detail, and findings
- Risk register stats, matrix, list, detail, create, and update
- Investigation list, detail, and RCCA linkage
- RCCA persistence for numeric incident workflows
- Automation rules CRUD and trigger actions
- Webhook CRUD actions
- Chemical SDS live data
- Compliance procedures live data

### 10.2 High-risk partial areas requiring careful verification

- AI Visual Audit family
- Predictive and AI-heavy pages using browser-side service wrappers
- Pages still importing mock datasets
- Pages still relying on localStorage or local state as pseudo-persistence
- Export flows that may generate files without corresponding backend persistence

## 11. Mandatory Use Cases to Execute During Testing

The later testing pass must include at minimum these use cases.

### 11.1 Auth and shell

- Register a user
- Log in with valid credentials
- Log in with invalid credentials
- Refresh a protected route
- Log out and verify protected route redirect
- Confirm AI widget and feedback widget do not show on auth screens

### 11.2 Navigation

- Navigate from dashboard cards to feature pages
- Open every sidebar or top navigation destination
- Open every bottom tab destination
- Click all visible primary action buttons on each page
- Refresh a deep route and verify correct state

### 11.3 CRUD

- Create record
- View created record
- Update created record
- Refresh and verify persistence
- Delete, archive, or close record where supported
- Retry after failed submit

### 11.4 AI

- Open AI Safety Assistant
- Submit text prompt
- Trigger quick actions
- Use microphone if supported
- Test attachment/image flow if supported
- Regenerate answer
- Submit feedback
- Test fullscreen and close behavior
- Test graceful failure when AI provider is unavailable

### 11.5 Mobile and resilience

- Test responsive layout
- Test scroll-to-top on route changes
- Test offline or degraded network behavior where supported
- Test empty states
- Test duplicate submission prevention

## 12. Exit Criteria For The Audit Execution Phase

Testing can be considered execution-complete only when:

- Every page in Section 7 has been classified.
- Every component family in Section 8 has been assessed at least once through direct rendering or consuming-page verification.
- Supporting files in Section 9 have been classified as production-ready, acceptable static reference, or still mock/local-only.
- Verified working areas are copied into the implementation report.
- Broken, partial, mock, or blocked areas are copied into the remaining gaps report.
- No new code is pushed until the defect list is reviewed.

## 13. Recommended Working Method During The Next Step

When execution testing begins, work in this exact order:

1. Start with route shell and authentication.
2. Move through pages by domain section, not randomly.
3. For each page, test all visible CTAs before deep form input.
4. For backend-backed pages, verify persistence with refresh.
5. For AI pages, test success and failure paths.
6. Record each result immediately in either the implemented report or the remaining gaps report.

This file is now the canonical reference for the audit pass.