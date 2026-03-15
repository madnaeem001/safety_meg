# SafetyMEG Project Status Update

Prepared on: March 15, 2026

## Executive Summary

This project is no longer at the "blank backend / mock-only prototype" stage. A real backend exists, persistent SQLite storage exists, many major frontend pages are already integrated with backend APIs, and the app has substantial automated coverage.

However, the scope you listed is not fully complete yet.

Current overall assessment:

- Phase 1: Partially complete
- Phase 2: Mostly implemented but still partial
- Phase 3: Partially complete

The backend foundation is real and functional, but the codebase is still mixed between production-style implementation and demo/prototype patterns. The biggest remaining issues are:

- many frontend areas still depend on mock data or localStorage-only behavior
- backend validation and error handling are inconsistent across modules
- logging and monitoring are only partially structured
- environment security is incomplete because some routes still fall back to hard-coded secrets
- AI integration has good fallback behavior, but health/observability and production hardening are still limited
- email flows exist, but not all sending paths are validated and production-safe

## Evidence Base Used For This Assessment

This update is based on:

- existing audit docs already present in the repo
- backend bootstrap and route inspection
- AI route inspection
- validation/logging/email service inspection
- frontend mock-data and localStorage usage scan
- latest recorded automated test status from the repo docs

Key evidence reviewed:

- IMPLEMENTED_AND_VERIFIED_AREAS_2026-03-12.md
- REMAINING_GAPS_AND_DEFECTS_2026-03-12.md
- TEST_EXECUTION_LOG_2026-03-12.md
- backend/src/index.ts
- backend/src/db.ts
- backend/src/init-db.ts
- backend/src/routes/ai.ts
- backend/src/routes/auth.ts
- backend/src/routes/email-notifications.ts
- backend/src/services/logger.ts
- backend/src/services/email.ts
- backend/.env.example
- frontend/.env.example

## Phase 1 - Core Stability And Data Foundation

Goal: Make the system actually functional and persistent.

Status: Partially complete

### 1. Persistent database storage

Status: Largely implemented

What is done:

- Real persistent storage exists using better-sqlite3 and Drizzle wiring in backend/src/db.ts.
- Production database path is configured to use /data/local.sqlite and local development uses local.sqlite.
- Database initialization is substantial and already includes a very large schema in backend/src/init-db.ts.
- Core business tables exist for incidents, investigations, RCCA, audits, findings, training, risks, projects, assets, notifications, sensors, ESG, compliance, email notifications, and more.
- Existing repo memory and audit docs confirm that several important pages are already backend-backed, including:
  - IncidentReporting
  - InvestigationReports
  - RootCauseCorrectiveAction
  - TrainingManagement
  - SafetyAudit
  - RiskRegister
  - AutomationRuleBuilder
  - WebhooksPage backend endpoints exist even though route rendering is still defective on frontend
  - NotificationSettings
  - AssetQRScanner
  - ProjectManagement major data views
  - Analytics
  - EmissionReports
  - ESGReporting
  - SafetyProcedures

What is still missing or weak:

- Storage is still single-file SQLite, which is acceptable for local and small deployments but not a strong long-term multi-tenant production data foundation.
- Many route modules open SQLite connections directly instead of using a more unified repository/service architecture.
- Drizzle generated files still contain placeholder comments such as "No tables configured yet", which indicates the ORM model layer is not the real source of truth everywhere.
- Some AI-related tables are seeded with demo-style records automatically inside the route module.
- Persistent storage exists, but the codebase is not yet uniformly architected around a clean data access layer.

Assessment:

- Real persistence is present.
- The foundation works.
- The architecture is still mixed and not fully hardened.

### 2. Replace placeholder/mock data with real processing logic

Status: Partially complete

What is done:

- A meaningful part of the application has already moved from mock data to backend APIs.
- Repo audit memory confirms large backendization progress between March 8 and March 12.
- Several important production-like workflows already persist and reload real data.

What is still remaining:

- Frontend still contains many direct mock imports.
- Current scan found 39 direct mock-import matches across frontend code.
- Current scan also found broad localStorage usage across stores, widgets, notifications, onboarding, AI memory, SSO, quick tab settings, mobile settings, biometric auth, and other UX/service areas.
- Remaining examples still tied to mock or local-only behavior include:
  - NavigationBar and BottomTabNavigation still read mock navigation data
  - SensorConfiguration and IoTSensorDashboard still depend on mock sensor data paths
  - RiskDigester and related components still use mock risk digester datasets
  - Project/agile components still import mockProjectManagement types and seed data in several places
  - Email notification UI components still use mock rules, recipients, and notification logs
  - IncidentHeatmap includes mock incident coordinate data
  - SelfAdminPlatform still contains explicit mock data blocks
  - Team leaderboard, collaboration, OSHA log generator, QR document features, and some specialized safety components remain mock-backed
  - AIVisualAudit family remains partially localStorage-assisted according to repo memory
  - OrganizationSettings was already called out in the repo gap notes as partial/mock-backed

Assessment:

- This scope item is not finished.
- The project has moved far beyond placeholder-only behavior, but it still contains a noticeable amount of prototype/demo data and local-only state.

### 3. Backend validation layers

Status: Partially complete

What is done:

- Zod is installed and actively used.
- There is a shared validation file at backend/src/validation/schemas.ts.
- Many routes perform request parsing and validation using Zod.
- Global app error handling already recognizes ZodError and returns 400 responses.

What is still missing:

- Validation is inconsistent across the backend.
- A lot of validation is route-local rather than centralized into reusable domain-level schemas.
- Some endpoints still parse request bodies directly with limited or no schema validation.
- Example: forgot-password in backend/src/routes/auth.ts reads email from c.req.json() and sends mail flow logic without a dedicated Zod validation schema on that endpoint.
- Validation coverage is not yet presented as a disciplined backend layer applied uniformly across modules.

Assessment:

- Validation exists and is real.
- The validation layer is not yet complete or standardized.

### 4. Structured error handling and logging system

Status: Partially complete

What is done:

- There is a logger service in backend/src/services/logger.ts.
- createApp in backend/src/index.ts includes a global error handler.
- Request IDs are added via X-Request-ID header.
- Some routes use the shared logger.

What is still missing:

- Logging is inconsistent across the codebase.
- Many modules still use raw console.log, console.warn, and console.error.
- Some routes define ad hoc inline logger objects instead of using the shared logger service.
- The shared logger still prints to console directly and is not integrated with a real sink, log formatter, trace correlation system, or alerting pipeline.
- Global error handling exists, but error shape consistency is not fully standardized across all routes.
- There is no strong separation between operational logs, audit logs, request logs, and security logs.

Assessment:

- Error handling and logging are present, but not yet production-grade across the full backend.

### 5. Environment configuration security

Status: Partially complete

What is done:

- backend/.env.example and frontend/.env.example exist.
- Key environment variables are clearly expected for AI, email, JWT, and frontend URL wiring.
- CORS uses configurable FRONTEND_URL.

What is still missing or risky:

- Multiple backend routes still fall back to a hard-coded JWT secret when JWT_SECRET is absent.
- Example pattern exists in auth and several other route modules.
- This means environment configuration is not truly enforced.
- backend/.env.example itself contains duplicate placeholder-style entries and is not fully polished.
- There is no evidence of centralized env parsing with fail-fast startup validation.

Assessment:

- Config scaffolding exists.
- Secure environment enforcement is not complete.

### Phase 1 Conclusion

Phase 1 is not fully done, but the biggest part of the backend foundation already exists.

Best classification:

- Core data persistence: mostly done
- Mock replacement: partial
- Validation: partial
- Logging/error handling: partial
- Secure env handling: partial

Practical conclusion:

- The backend is functional.
- The backend is not yet uniformly hardened.
- This phase should not be marked complete yet.

## Phase 2 - AI And Service Integration Fixes

Goal: Make AI assistant reliable and intelligent.

Status: Mostly implemented but still partial

### 1. Fix AI service communication

Status: Largely implemented

What is done:

- The backend has a real AI route module in backend/src/routes/ai.ts.
- OpenRouter integration is wired.
- AI suggestions route exists.
- AI chat route exists.
- Streaming chat is implemented.
- AI status route exists.
- AI audit summary generation exists.
- AI-generated training/course flows exist.

What is still weak:

- AI is still heavily dependent on OpenRouter availability and env configuration.
- There is no evidence of retry strategy, timeout policy standardization, circuit breaker logic, or upstream error classification.
- AI chat health is not deeply monitored beyond route-level success/failure.

Assessment:

- Communication is functional.
- It is not yet enterprise-grade resilient.

### 2. Flexible response parser

Status: Implemented

What is done:

- backend/src/routes/ai.ts includes a flexible parser for AI suggestions.
- It tries bullet points, numbered items, paragraphs, sentence splitting, chunk fallback, and final raw-content fallback.
- This directly addresses the rigid-formatting problem.

Assessment:

- This item is done.

### 3. Add fallback handling if AI fails

Status: Implemented

What is done:

- If OPENROUTER_API_KEY is missing, suggestions fall back to default recommendations.
- If AI returns empty content, fallback suggestions are returned.
- If AI suggestions call throws, graceful fallback is returned instead of crashing.
- Audit summary generation also has structured fallback summary generation.
- Training course generation also has fallback logic.

Assessment:

- This item is done.

### 4. Add service health checks

Status: Partial

What is done:

- Global public health route exists at /api/public/health.
- AI status endpoint exists at /api/ai/status.

What is missing:

- /api/ai/status mainly reports configuration state and declared capabilities; it does not perform a real upstream provider probe.
- There is no broader service-level health reporting for email provider, database readiness, queue state, or dependency readiness.
- There is no monitoring dashboard or metrics export visible in the backend.

Assessment:

- Basic health endpoints exist.
- Real dependency health checking is still incomplete.

### 5. Improve suggestion and chat stability

Status: Partial to strong

What is done:

- AI suggestions have flexible parsing and fallbacks.
- AI chat route validates message structure.
- Streaming response has truncation protection.
- Stream parsing ignores malformed SSE lines.
- Stream read failures degrade gracefully.
- The repo includes AI-related test files, indicating some validation and fallback behavior is already being tested.

What is still missing:

- No evidence of provider latency tracking.
- No evidence of user/session level rate management specific to AI.
- No evidence of request cancellation, queueing, retry backoff, or persistent conversation storage on the backend.
- Frontend AI memory still includes localStorage usage.

Assessment:

- AI assistant reliability is much better than a prototype.
- It should still be considered partial from a production-hardening perspective.

### Important AI Caveat

The AI area is mixed between real service logic and seeded/demo persistence:

- some AI endpoints are genuinely integrated with OpenRouter
- some AI-related tables are auto-created and seeded in the AI route file itself
- fallback behavior is robust, but observability and operational hardening are still limited

### Phase 2 Conclusion

Best classification:

- AI communication: mostly done
- flexible parser: done
- fallback handling: done
- service health checks: partial
- chat/suggestion stability: partial but strong

Practical conclusion:

- AI is functional and reasonably resilient.
- This phase is closer to completion than Phase 1 or Phase 3.
- It should still be marked partial, not fully complete.

## Phase 3 - Email, Monitoring And Production Readiness

Goal: Make system safe for real users.

Status: Partially complete

### 1. Fix email validation before sending

Status: Partial

What is done:

- Email sending service exists in backend/src/services/email.ts using Resend.
- Register and login schemas validate email shape.
- Auth registration flow and some auth flows are already using validated email input.

What is still missing:

- Email service itself does not validate recipient format before send.
- Forgot-password route reads email directly from request JSON and does not validate via Zod before lookup/send flow.
- Password reset currently uses a temporary fake reset token string, which is explicitly non-production.
- Email service logs directly to console and returns success/failure objects without deeper classification.

Assessment:

- Email exists.
- Email safety and validation are not fully production-ready.

### 2. Add structured logging for service failures

Status: Partial

What is done:

- Shared logger exists.
- AI route uses createLogger.
- Some backend routes use shared logger or route-level logs.

What is still missing:

- Logging is inconsistent across backend modules.
- Service failures are not normalized into one standard structured format everywhere.
- Email service still uses raw console logs.
- Several route files still use custom inline loggers or raw console.error.

Assessment:

- The project has started this work but has not finished it.

### 3. Add basic monitoring visibility

Status: Partial

What is done:

- Public health endpoint exists.
- AI status endpoint exists.
- Request IDs are added.
- Test/audit reporting exists at the project level through Playwright, HTML, JSON, and JUnit output.

What is missing:

- No real runtime metrics pipeline is visible.
- No Prometheus-style metrics endpoint is visible.
- No database/provider health aggregation endpoint is visible.
- No alerting, dashboarding, or service-level telemetry integration is visible.
- Observability remains mostly console-level plus test-report level.

Assessment:

- Visibility exists in a minimal sense.
- Monitoring is not yet sufficient for real production operations.

### 4. Clean architecture refactoring where needed

Status: Partial

What is done:

- Route modules are split broadly by domain.
- Some shared utilities exist for logging and validation.
- App bootstrap is modular and fairly broad.

What is still missing:

- Architecture is still mixed between:
  - route-level SQL
  - direct DB connection creation inside routes
  - partial shared service usage
  - local route-specific schemas/loggers
  - UI modules that are still mock/data-heavy
- Some generated ORM artifacts still look placeholder-oriented.
- Some modules combine seeding, persistence, validation, and transport logic in the same file.

Assessment:

- Refactoring has started implicitly through modularization.
- Clean architecture work is not complete.

### 5. Final system testing

Status: Strong but not final-complete

What is done:

- Repo memory records passing frontend build, frontend TypeScript, backend TypeScript, backend Vitest, and large E2E coverage.
- Repo memory records backend Vitest passing 621/621 across 14 files.
- Repo memory records full all-pages desktop and mobile audit passes with Webhooks intentionally skipped.
- Existing test execution log documents broad route, auth, CRUD, shell, and empty-state coverage.

What is still missing:

- Webhooks route remains a known broken area in audit docs.
- Some mobile CRUD paths remain intentionally skipped due to rate-limit/environment instability.
- The system is not yet fully verified as SaaS-ready according to repo memory.
- Multi-tenant isolation, billing/subscription backend, and fuller observability are still identified as missing in the repo memory.

Assessment:

- Testing is strong.
- Final production signoff conditions are not met yet.

### Phase 3 Conclusion

Best classification:

- email validation/safety: partial
- structured logging for failures: partial
- monitoring visibility: partial
- architecture cleanup: partial
- final testing: strong but incomplete

Practical conclusion:

- This phase is not complete.

## What Has Definitely Been Achieved Already

These are the strongest completed or mostly completed outcomes in the scope of your requested plan:

- Real backend exists with many domain modules, not just stubs.
- Real SQLite persistence exists with a large initialized schema.
- Multiple important frontend pages have already been backendized.
- Incident, training, audit, risk, analytics, ESG, emissions, and several other business flows are already using backend-owned data.
- AI suggestions/chat/status/fallback architecture is implemented.
- Flexible AI response parsing is implemented.
- Health endpoint exists.
- Request IDs and a basic global error handler exist.
- Automated testing coverage is already substantial.
- Desktop/mobile route audits have already been run at large scale.

## What Is Still Remaining Before This Scope Can Be Marked Complete

These are the highest-value remaining gaps:

- remove remaining frontend mock-data dependencies and local-only business flows
- standardize backend validation across all important endpoints
- remove hard-coded JWT fallback secrets and enforce env validation at startup
- standardize logging across all services and routes
- add actual monitoring and dependency health visibility
- harden email flows with validation and real password reset token management
- complete cleanup of AI/localStorage/demo patterns in AI-adjacent features
- fix known unresolved frontend/runtime gaps such as Webhooks route rendering
- close remaining mobile test skips and environment instability gaps

## Recommended Status For The Three Phases

If you want a realistic management-level summary, I would classify the phases like this:

| Phase | Status | Realistic Summary |
|---|---|---|
| Phase 1 - Core Stability & Data Foundation | Partial | Backend foundation is real and useful, but mock removal, validation consistency, logging consistency, and security enforcement are still unfinished. |
| Phase 2 - AI & Service Integration Fixes | Partial but advanced | AI service is functional, fallbacks are good, parser is flexible, but observability and production hardening are still incomplete. |
| Phase 3 - Email, Monitoring & Production Readiness | Partial | Email and health basics exist, testing is strong, but monitoring, env hardening, consistent service logging, and full production readiness are not complete. |

## Bottom Line

This project has already completed a large amount of difficult work.

It is accurate to say:

- the backend foundation is already real
- persistence is already present
- several critical features already work against backend data
- AI integration is already functional with fallback behavior
- automated testing is already substantial

It is also accurate to say:

- the project is not yet fully aligned with the complete 3-phase scope you listed
- the remaining work is mostly hardening, consistency, cleanup, and production readiness
- the codebase still shows a hybrid state between product implementation and prototype/demo scaffolding

## Suggested Next Execution Order

If this scope is to be closed properly, the highest-value order would be:

1. finish Phase 1 leftovers first
2. remove remaining mock/local-only business flows
3. enforce env validation and remove JWT fallback secrets
4. standardize logger and error response patterns
5. harden email flows and password reset security
6. add real service health and monitoring visibility
7. finish unresolved frontend/runtime defects and skipped tests
8. do final production-readiness verification after those items

## Strict Actionable Implementation Checklist

This section converts the analysis into a hard execution checklist. Each item should be treated as a deliverable with explicit completion criteria.

### A. Phase 1 Closeout Checklist

- [ ] P1-01: Create a centralized backend environment module.
  Definition of done: one shared env parser/validator exists, startup fails fast when required secrets are missing, and routes stop reading raw process.env directly for core secrets.

- [ ] P1-02: Remove all hard-coded JWT secret fallbacks.
  Definition of done: auth, form-configurator, mobile-sync, near-miss-reports, user-preferences, worker-app, and any other JWT consumers require JWT_SECRET from validated env.

- [ ] P1-03: Add shared request/response validation standards.
  Definition of done: auth, email, organization settings, AI, notification, and high-risk write endpoints use shared Zod schemas instead of ad hoc body parsing.

- [ ] P1-04: Add a shared API error response shape.
  Definition of done: all write/read failures return a consistent structure with success, error code, message, and requestId.

- [ ] P1-05: Replace route-local console logging with shared logger usage.
  Definition of done: backend route modules no longer define inline logger objects or raw console error handling for operational logs.

- [ ] P1-06: Introduce request-scoped logging context.
  Definition of done: logger output includes requestId and route/service name for all backend error paths.

- [ ] P1-07: Standardize database access patterns.
  Definition of done: high-change domains stop creating ad hoc Database instances inside route handlers where a shared access path or repository wrapper is more appropriate.

- [ ] P1-08: Remove remaining mock-backed shell/profile/notification behavior.
  Definition of done: NavigationBar, BottomTabNavigation, NotificationSettings, UserProfile, and related utilities consume backend-backed state only for business data.

- [ ] P1-09: Remove remaining mock-backed sensor workflows.
  Definition of done: SensorConfiguration, SensorCalibration, and IoTSensorDashboard no longer fall back to mockSensor datasets for runtime business content.

- [ ] P1-10: Remove remaining project/agile mock business flows.
  Definition of done: ProjectManagement, JiraBoard, ReleasePlanningView, SprintPlanningView, SprintRetrospectives, SprintSettings, TaskDetailModal, VelocityCharts, and ProjectWorkflow stop depending on mockProjectManagement at runtime.

- [ ] P1-11: Remove remaining RiskDigester mock datasets.
  Definition of done: RiskDigester page and related CAPA/KPI/Standards/Emissions components use backend data or explicit empty states only.

- [ ] P1-12: Remove remaining compliance/scheduling mock flows.
  Definition of done: ComplianceAndProcedures, EPAReportingDashboard, CalendarView, and RiskAssessmentChecklists stop depending on mock business datasets for runtime behavior.

- [ ] P1-13: Remove localStorage as the source of truth for business records.
  Definition of done: localStorage remains only for non-critical UX preferences, not for business entities, queues, audits, notifications, reports, or AI records.

### B. Phase 2 Closeout Checklist

- [ ] P2-01: Add a dedicated AI service wrapper.
  Definition of done: OpenRouter request construction, timeout handling, retry policy, error classification, and response normalization are separated from route code.

- [ ] P2-02: Add upstream AI provider health probe.
  Definition of done: /api/ai/status reports more than config presence and can distinguish configured, degraded, unavailable, and fallback-only states.

- [ ] P2-03: Add structured AI error categories.
  Definition of done: rate-limit, timeout, auth failure, empty response, malformed stream, and upstream 5xx errors are separately logged and returned.

- [ ] P2-04: Remove AI route seeding from request-serving code.
  Definition of done: demo AI seed/setup logic is moved out of backend/src/routes/ai.ts into init/seed scripts.

- [ ] P2-05: Remove remaining AI localStorage persistence as a business fallback.
  Definition of done: AIVisualAudit, AIVisualAuditHistory, AIVisualAuditHub, and aiService no longer rely on localStorage for primary record retention.

- [ ] P2-06: Add AI request observability.
  Definition of done: request counts, failures, fallback frequency, and latency are measurable per AI route.

### C. Phase 3 Closeout Checklist

- [ ] P3-01: Add shared email validation before all sends.
  Definition of done: every email-sending path validates recipient, subject, and payload via schema before calling the email service.

- [ ] P3-02: Replace fake password reset token flow.
  Definition of done: forgot-password persists a secure token or one-time code with expiry and uses a real reset verification flow.

- [ ] P3-03: Refactor email service to shared structured logging.
  Definition of done: email success/failure logs use the shared logger with request/service context and sanitized metadata.

- [ ] P3-04: Add backend dependency health endpoint.
  Definition of done: health endpoint includes database readiness, AI provider readiness, and email provider readiness.

- [ ] P3-05: Add minimal metrics/monitoring visibility.
  Definition of done: backend exposes counters or summary metrics for requests, failures, AI fallbacks, and email failures.

- [ ] P3-06: Fix the known Webhooks route defect.
  Definition of done: Webhooks page renders correctly and the route is removed from intentional audit skips.

- [ ] P3-07: Eliminate mobile test skips caused by environment/rate-limit instability.
  Definition of done: mobile risk-register mutation and mobile training mutation run stably in CI or controlled serial execution.

- [ ] P3-08: Run final verification gate.
  Definition of done: backend typecheck, frontend typecheck/build, backend tests, critical E2E, route-surface audit, and all-pages audit pass without known business-critical skips.

## File-By-File Gap Matrix

This matrix covers remaining runtime-relevant mock/localStorage areas in the frontend application. Test-only files are excluded unless they expose a runtime dependency pattern that still exists in product code.

### 1. Mock-Backed Runtime Files

| File | Gap Type | Current Dependency | Required Action | Priority |
|---|---|---|---|---|
| frontend/src/components/dashboard/NavigationBar.tsx | Mock import | mockNavigation | Replace notification/profile helper reads with backend-backed selectors/hooks | High |
| frontend/src/components/dashboard/BottomTabNavigation.tsx | Mock import | mockNavigation | Replace unread/badge data with backend or store-backed notification state | High |
| frontend/src/pages/NotificationSettings.tsx | Mock import plus runtime merge | mockNavigation | Remove mock notification merge path; backend settings and notification feed only | High |
| frontend/src/pages/UserProfile.tsx | Mock import plus local profile storage | mockNavigation | Move profile load/save fully to backend-backed profile API | High |
| frontend/src/utils/notificationSettings.ts | Mock import | mockNavigation | Replace helper mapping with backend-backed settings adapter | High |
| frontend/src/components/dashboard/KPICharts.tsx | Mock import | mockAnalytics | Remove remaining mock KPI/chart fallback and bind to analytics API only | High |
| frontend/src/pages/SensorConfiguration.tsx | Mock import and fallback | mockSensor | Remove backend-empty fallback to mock sensors | High |
| frontend/src/pages/SensorCalibration.tsx | Mock import | mockSensor | Replace mock calibration schedules/records with backend-backed data | High |
| frontend/src/pages/IoTSensorDashboard.tsx | Mock import | mockSensor, facilityZones | Replace runtime mock sensor/zones feed with backend-backed sensor and geotag data | High |
| frontend/src/pages/RiskDigester.tsx | Mock import | mockRiskDigester | Replace SAFETY_KPIS and remaining digester business content with backend data | High |
| frontend/src/components/safety/risk-digester/CAPATable.tsx | Mock import | mockRiskDigester | Replace CAPA_LIST with backend CAPA source | High |
| frontend/src/components/safety/risk-digester/KPIWidget.tsx | Mock import | mockRiskDigester | Replace KPI props/types with backend-owned model | High |
| frontend/src/components/safety/risk-digester/StandardsReference.tsx | Mock import | mockRiskDigester | Replace standards reference mock source with backend or static non-mock catalog | Medium |
| frontend/src/components/safety/risk-digester/EmissionsChart.tsx | Mock import | mockRiskDigester | Replace chart feed with backend emissions series | High |
| frontend/src/pages/RiskAssessmentChecklists.tsx | Mock import | mockRiskAssessmentTemplates | Move template source and progress/email queue behavior to backend-owned workflow | High |
| frontend/src/pages/ComplianceAndProcedures.tsx | Mock import | mockComplianceProcedures | Remove remaining mock-backed procedure/compliance content | High |
| frontend/src/pages/EPAReportingDashboard.tsx | Mock import | mockScheduling | Replace EPA runtime dataset and scheduling-derived content with backend feeds | Medium |
| frontend/src/components/scheduling/CalendarView.tsx | Mock type dependency | mockAudit | Remove coupling to mock audit schedule/template models | Medium |
| frontend/src/pages/ProjectManagement.tsx | Mock import | mockProjectManagement | Remove remaining tasks/epics/milestones/RFI mock ownership | High |
| frontend/src/pages/JiraBoard.tsx | Mock import | mockProjectManagement | Replace mock project/task source with backend agile/project API | High |
| frontend/src/components/agile/ReleasePlanningView.tsx | Mock import | mockProjectManagement | Replace mock epics/sprints/tasks with backend data contract | High |
| frontend/src/components/agile/SprintPlanningView.tsx | Mock import | mockProjectManagement | Replace mock sprint/task source with backend data | High |
| frontend/src/components/agile/SprintRetrospectives.tsx | Mock import | mockProjectManagement | Replace mock sprint dependency with backend sprint model | Medium |
| frontend/src/components/agile/SprintSettings.tsx | Mock import | mockProjectManagement | Replace mock sprint dependency with backend sprint settings model | Medium |
| frontend/src/components/agile/TaskDetailModal.tsx | Mock import | mockProjectManagement | Replace mock task/comment model with backend model | High |
| frontend/src/components/agile/VelocityCharts.tsx | Mock import | mockProjectManagement | Replace mock task analytics input with backend sprint/task metrics | Medium |
| frontend/src/components/safety/EHSWorkflow/ProjectWorkflow.tsx | Mock import plus inline mock arrays | mockProjectManagement | Replace schedule/RFI/milestone/resource mock state with backend project workflow data | High |
| frontend/src/components/safety/EHSWorkflow/EHSWorkflowDashboard.tsx | Mock import | mockEHSWorkflow | Replace workflow demo entities with backend-backed workflow records | High |
| frontend/src/components/safety/EHSWorkflow/ExportModal.tsx | Mock import | mockEHSWorkflow | Replace export source with backend workflow payloads | Medium |
| frontend/src/components/safety/EHSWorkflow/DetailModal.tsx | Mock import | mockEHSWorkflow | Replace modal models with backend workflow records | Medium |
| frontend/src/components/safety/EHSWorkflow/StageStepper.tsx | Mock import | mockEHSWorkflow | Replace workflow stage source with backend or static config not tied to mock dataset | Medium |
| frontend/src/components/safety/EHSWorkflow/StageCard.tsx | Mock import | mockEHSWorkflow | Replace stage card business models with backend-owned models | Medium |
| frontend/src/components/safety/EHSWorkflow/ActionModal.tsx | Mock import | mockEHSWorkflow | Replace mock workflow enums/models with shared backend contract | Medium |
| frontend/src/pages/RootCauseCorrectiveAction.tsx | Mock import still present | mockCapaControls | Remove remaining mock controls/reference data after backend integration | Medium |
| frontend/src/pages/AssetQRScanner.tsx | Mock type import only | mockAssets | Remove leftover mock type coupling and use backend/shared asset type | Low |
| frontend/src/services/sdsDatabase.ts | Mock seed service | mockChemicalSDS plus mock equipment | Decommission or isolate behind dev-only tooling if runtime no longer needs it | High |

### 2. Inline Mock Runtime Files Still In Use

| File | Gap Type | Current Dependency | Required Action | Priority |
|---|---|---|---|---|
| frontend/src/components/analytics/IncidentAnalyticsDashboard.tsx | Inline mock dataset | generateMockIncidents | Replace dashboard analytics generation with backend incident analytics feed | High |
| frontend/src/components/dashboard/RealTimeAlerts.tsx | Inline mock state | MOCK_ALERTS | Replace alert feed with backend/real-time notification source | Medium |
| frontend/src/components/dashboard/UnifiedSafetyHub.tsx | Inline mock state | mockUnifiedReports | Replace unified report summaries with backend data | Medium |
| frontend/src/components/collaboration/CollaborationPanel.tsx | Inline mock state | mockCollaborators, mockActivity | Replace with backend collaboration/activity service or mark non-production | Medium |
| frontend/src/components/safety/PushNotifications/PushNotifications.tsx | Inline mock state | mockScheduledNotifications | Replace scheduled notification source with backend notification schedule APIs | Medium |
| frontend/src/components/safety/RealTimeNotifications/RealTimeNotifications.tsx | Inline mock state | mockNotifications | Replace with backend/real-time notification feed | Medium |
| frontend/src/components/safety/PropertyDamageReport.tsx | Inline mock state | mockPropertyReports | Replace with backend property incident report records | Medium |
| frontend/src/components/safety/UniversalJSA.tsx | Inline mock state | mockJSAs | Replace with backend JSA storage and listing endpoints | High |
| frontend/src/components/safety/CriticalLiftPlan/CriticalLiftPlan.tsx | Inline mock state | mockLiftPlans | Replace with backend lift-plan entity flow or explicitly defer feature | Medium |
| frontend/src/components/safety/QRCodeFeature/QRCodeFeature.tsx | Inline mock state | mockQRDocuments | Replace with backend document/QR source | Medium |
| frontend/src/components/safety/ESignatureCertificate/ESignatureCertificate.tsx | Inline mock state | mockCertificates | Replace with backend certificate verification source | Medium |
| frontend/src/components/safety/CombinedIncidentInjuryReport.tsx | Inline mock merge | mockReports + backendReports | Remove mock merge and rely on backend incident/injury feeds only | High |
| frontend/src/components/safety/IncidentAnalytics/IncidentAnalytics.tsx | Inline mock default | mockIncidentsEnhanced | Replace default analytics input with backend data | Medium |
| frontend/src/components/safety/MobileDataCollection.tsx | Inline mock state | MOCK_ENTRIES | Replace with backend/offline-sync managed entries | Medium |
| frontend/src/components/safety/AIAnalyticsEngine.tsx | Inline mock fallback | generateMockInsights | Replace generated fallback insights with backend analytics/AI endpoint result | Medium |
| frontend/src/pages/Dashboard.tsx | Inline mock fallback | MOCK_INCIDENTS, MOCK_CHECKLIST | Remove remaining mock incident/checklist fallback paths from dashboard | High |
| frontend/src/pages/NotificationSettings.tsx | Inline mock runtime merge | mockNotifs | Remove mock notification list fallback now that settings backend exists | High |

### 3. LocalStorage-Backed Runtime Files Still Acting As Source Of Truth

| File | Gap Type | Current Dependency | Required Action | Priority |
|---|---|---|---|---|
| frontend/src/store/authStore.ts | Persisted auth state | localStorage | Keep token persistence if needed, but review for secure token handling and SSR-safe access | Medium |
| frontend/src/store/appStore.ts | Persisted app UI state | localStorage | Restrict to safe UX prefs only; avoid business-state persistence here | Medium |
| frontend/src/data/mockNavigation.ts | localStorage-backed mock source | notification settings, profile, notifications | Retire as runtime source once backend-backed replacements are complete | High |
| frontend/src/data/mockSensor.ts | localStorage-backed mock source | sensors, alerts | Retire as runtime fallback once sensor pages are backend-pure | High |
| frontend/src/data/complianceManagement.ts | local-only business records | gap analysis, certifications, audit trail | Move business persistence to backend | High |
| frontend/src/data/mockScheduling.ts | local-only queue | notification queue | Move queue/schedule persistence to backend | Medium |
| frontend/src/api/hooks/useAPIHooks.ts | localStorage cache | generic cache entries | Review caching policy; keep only if bounded/invalidated and not authoritative | Medium |
| frontend/src/api/services/apiService.ts | auth token read | safetymeg-auth | Acceptable if aligned with auth strategy; document as intentional | Low |
| frontend/src/services/aiService.ts | AI user memory | localStorage | Move long-term AI context to backend or explicitly limit to non-authoritative UX memory | High |
| frontend/src/pages/AIVisualAudit.tsx | localStorage fallback and blob cache | visual audit records | Remove primary localStorage fallback and use backend/session storage only where needed | High |
| frontend/src/pages/AIVisualAuditHistory.tsx | migration and enrichment from localStorage | visual audit records | Complete migration off localStorage and remove duplicate-path logic | High |
| frontend/src/pages/AIVisualAuditHub.tsx | localStorage cleanup coupling | visual audit storage | Remove cleanup dependency once AI visual audit is backend-pure | Medium |
| frontend/src/services/realTimeNotificationService.ts | local-only notification persistence | realTimeNotifications, sound settings | Move persistent notification state to backend-backed notification channel/settings | High |
| frontend/src/services/pushNotificationService.ts | local-only notification prefs/device id | notificationPreferences, deviceId | Move device registration and preferences to backend | High |
| frontend/src/services/smsNotificationService.ts | local-only prefs/quota | smsPreferences, smsQuota | Move quota/preferences to backend or explicit server-side service | Medium |
| frontend/src/services/ssoService.ts | local-only SSO configs | safetymeg_sso_configs | Move organization SSO config to backend settings source | High |
| frontend/src/services/encryptionService.ts | local key storage | safetymeg_encryption_key | Reassess security model; localStorage key storage is not strong protection | High |
| frontend/src/services/rbacService.ts | local role persistence | safetymeg_user_role | Use server-issued role claims as source of truth | Medium |
| frontend/src/utils/mobileFeatures.ts | local-only push config | pushNotificationConfig | Move mobile notification config to backend-backed user/device settings | Medium |
| frontend/src/components/dashboard/QuickTabSwitcher.tsx | extensive local-only UX state | recent tabs, favorites, groups, themes, badges | Keep only if explicitly accepted as user preference storage; otherwise move syncable prefs backend-side | Medium |
| frontend/src/components/widgets/OnboardingWalkthrough.tsx | local onboarding state | onboarding complete/show flags | Acceptable if intentional UX-only, otherwise move to backend user preference | Low |
| frontend/src/pages/RegisterPage.tsx | onboarding trigger flag | safetymeg_show_onboarding | Keep only if aligned with onboarding preference strategy | Low |
| frontend/src/pages/RiskAssessmentChecklists.tsx | local email queue and saved progress | safetymeg_email_queue, checklist progress | Move progress and outbound queue behavior to backend | High |
| frontend/src/pages/UserProfile.tsx | local accent color | safetymeg_accent_color | Keep only if intentional UX preference or migrate into user preferences API | Low |
| frontend/src/pages/OrganizationSettings.tsx | blanket localStorage clear | full local storage | Replace with targeted cleanup; avoid wiping unrelated persisted app state | Medium |
| frontend/src/components/agile/CommandPalette.tsx | local recent command history | cp_recent_commands | Keep if intentional UX-only preference; otherwise move to user preferences | Low |
| frontend/src/i18n/index.ts | local language pref | safetymeg_language | Acceptable as a UX preference if documented, otherwise move to backend user preferences | Low |
| frontend/src/components/ThemeProvider.tsx | local theme pref | THEME_STORAGE_KEY | Acceptable as UX preference if documented | Low |
| frontend/src/components/auth/BiometricAuth.tsx | local biometric credential metadata | biometric_credentials | Reassess security model; should not be the trust source for auth | High |
| frontend/src/components/pwa/PWAInstaller.tsx | local banner dismissal | pwa_banner_dismissed | Acceptable as UX preference if documented | Low |

### 4. Mock Source Modules Still Feeding Runtime Code

These files are not always direct defects by themselves, but they remain part of the active runtime dependency chain and should be retired or isolated as dev-only fixtures when the consuming screens are cleaned up.

| File | Current Role | Action |
|---|---|---|
| frontend/src/data/mockNavigation.ts | Notification/profile shell mock source | Retire from runtime path |
| frontend/src/data/mockSensor.ts | Sensor and calibration mock source | Retire from runtime path |
| frontend/src/data/mockRiskDigester.ts | Risk digester KPIs/CAPA/standards/emissions source | Retire from runtime path |
| frontend/src/data/mockRiskAssessmentTemplates.ts | Checklist template source | Replace with backend templates |
| frontend/src/data/mockProjectManagement.ts | Project/agile runtime source | Replace with backend project/agile APIs |
| frontend/src/data/mockEHSWorkflow.ts | EHS workflow demo data | Replace with backend workflow source |
| frontend/src/data/mockAudit.ts | Audit scheduling/template source in remaining components | Replace with backend/shared real model |
| frontend/src/data/mockChemicalSDS.ts | SDS seed data | Remove from runtime service path |
| frontend/src/data/mockScheduling.ts | Scheduling/EPA/notification queue mock source | Replace with backend scheduling APIs |
| frontend/src/data/complianceManagement.ts | Local-only compliance storage helper | Move persistence to backend |
| frontend/src/data/mockAssets.ts | Leftover asset type/mock source | Remove final coupling |

## Immediate Recommended Execution Order For The Gap Matrix

To make this actionable, the cleanup should be executed in this order:

1. Shell and user-state cleanup
   Files: NavigationBar, BottomTabNavigation, NotificationSettings, UserProfile, mockNavigation, notificationSettings utils.

2. Sensor stack cleanup
   Files: SensorConfiguration, SensorCalibration, IoTSensorDashboard, mockSensor, geotag-related runtime dependencies.

3. AI/localStorage cleanup
   Files: AIVisualAudit, AIVisualAuditHistory, AIVisualAuditHub, aiService.

4. Project/agile cleanup
   Files: ProjectManagement, JiraBoard, ReleasePlanningView, SprintPlanningView, SprintRetrospectives, SprintSettings, TaskDetailModal, VelocityCharts, ProjectWorkflow, mockProjectManagement.

5. Risk/compliance cleanup
   Files: RiskDigester family, RiskAssessmentChecklists, ComplianceAndProcedures, EPAReportingDashboard, CalendarView, complianceManagement helpers.

6. Notification and messaging cleanup
   Files: pushNotificationService, realTimeNotificationService, smsNotificationService, QuickTabSwitcher where state should be synced or clearly documented as UX-only.

7. Remaining specialized feature cleanup
   Files: UniversalJSA, CombinedIncidentInjuryReport, CriticalLiftPlan, QRCodeFeature, ESignatureCertificate, CollaborationPanel, IncidentAnalyticsDashboard, Dashboard inline mock fallbacks.