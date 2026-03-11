# Remaining Backend Integration Checklist

Date: 2026-03-09

## Scope

This checklist covers the remaining frontend modules that are not fully backend-integrated yet, or are only partially integrated because they still depend on mock data, localStorage, or browser-only simulation logic.

Status legend:

- `Implemented`: backend integration already sufficient for current scope
- `Partial`: backend exists, but page still mixes mock/local state with live data
- `Pending`: page still needs real backend integration or a dedicated backend module

## Group A: Backend Exists, Page Still Partial

### [src/pages/Analytics.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/Analytics.tsx)

Status: `Partial`

Current state:

- uses backend hooks for KPI metrics, incident trends, department metrics, and severity breakdown
- still imports `mockAnalytics` datasets for major visual sections

Checklist:

- replace `kpiData` with backend KPI dashboard payload
- replace `incidentsByMonth` with backend incident trends everywhere
- replace `incidentsByCategory` with backend severity/category distribution endpoint
- replace `inspectionCompletionData` with inspection stats endpoint data
- replace `qualityMetrics` and `qualityEvents` with quality backend data
- replace `complianceSummary` with backend compliance summary endpoint
- replace `performanceBenchmarks` and `departmentComparison` with backend analytics aggregates
- remove page-critical dependence on `src/data/mockAnalytics`

Required backend work:

- likely adapter expansion more than new route creation

### [src/pages/ESGReporting.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/ESGReporting.tsx)

Status: `Partial`

Current state:

- uses `useESGMetrics`
- still imports `mockESG`
- chart trend and category presentation still rely on hardcoded display data

Checklist:

- replace `ESG_METRICS` fallback with backend-driven normalized ESG metric records
- replace `mockChartData` with time-series ESG trend endpoint
- wire download/share actions to backend report generation or export service
- define backend contract for period comparison and disclosure-ready export
- remove business dependence on `src/data/mockESG`

Required backend work:

- add ESG trend/history endpoint if not already present
- optionally add report export endpoint

### [src/pages/ProjectManagement.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/ProjectManagement.tsx)

Status: `Partial`

Current state:

- uses project/task hooks
- still imports `mockProjectManagement` datasets for milestones, sprint context, RFI register, AI workflow stages, and intelligence overlays

Checklist:

- replace `PROJECT_SCHEDULE` with backend project schedule model
- replace `RFI_REGISTER` with real backend RFI/comments/issues module or separate project communications route
- replace `INITIAL_TASKS` fallback with backend-only task initialization once data exists
- replace `MILESTONES` with backend milestone persistence
- replace `SPRINTS` and `EPICS` local references with backend-sourced sprint/epic state throughout the page
- move AI workflow/intelligence display to backend-configurable metadata or clearly mark as static informational UI
- persist drag-and-drop order changes if the UI implies canonical ordering

Required backend work:

- milestones/RFI endpoints may still be missing
- project meta and ordering contracts need tightening

### [src/pages/ChemicalSDSManagement.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/ChemicalSDSManagement.tsx)

Status: `Partial`

Current state:

- uses `useChemicals`
- still merges backend chemicals with `mockChemicalSDS`

Checklist:

- remove mock-first rendering path for production mode
- fetch SDS metadata and document links from backend instead of relying on local mock inventory
- add create/update/delete flows if page UX expects editable inventory
- verify SDS document storage strategy for production

Required backend work:

- confirm `sds_documents` CRUD and file storage pipeline

### [src/pages/AssetQRScanner.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/AssetQRScanner.tsx)

Status: `Partial`

Current state:

- uses `useAssets`
- still merges backend assets with `mockAssets`

Checklist:

- remove mock asset fallback for authenticated production users
- complete asset detail, scan lookup, and maintenance history flow from backend
- persist scan event history if scanner is meant to be auditable
- verify QR/barcode decode result mapping to canonical asset IDs

Required backend work:

- optional scan event/audit trail route may still be needed

### [src/pages/SafetyProcedures.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/SafetyProcedures.tsx)

Status: `Partial`

Current state:

- uses `useSafetyProcedures`
- still imports structural mock content from `mockSafetyProcedures`

Checklist:

- move hierarchy of controls and procedure library metadata fully into backend-managed records
- decide which content is reference data and seed it in DB instead of shipping it as page-owned mock data
- wire create/update/delete/versioning if procedures are editable
- add approval/version workflow if procedures are compliance-controlled documents

Required backend work:

- versioning and document control may still be incomplete

### [src/pages/RiskDigester.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/RiskDigester.tsx)

Status: `Partial`

Current state:

- uses backend risk and KPI analytics hooks
- still imports `mockRiskDigester`

Checklist:

- replace `SAFETY_KPIS` and derived dashboard logic with backend risk/KPI aggregates
- remove hardcoded recommendation logic that should come from backend analytics or AI service
- make trend summaries and export payloads backend-derived

Required backend work:

- analytics adapter expansion likely enough

### [src/pages/EmissionReports.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/EmissionReports.tsx)

Status: `Partial`

Current state:

- uses `useEmissionsData`
- still imports `DETAILED_EMISSIONS` from mock data

Checklist:

- replace detailed emissions tables/cards with backend emissions records
- align filter, trend, and export UI with backend emissions schema
- make submission and historical comparison backend-backed

Required backend work:

- verify emissions detail/list/history endpoint coverage

### [src/pages/IoTSensorDashboard.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/IoTSensorDashboard.tsx)

Status: `Partial`

Current state:

- uses `useSensors` and `useSensorReadings`
- still imports `mockSensors` and `facilityZones`

Checklist:

- replace `mockSensors` with backend-configured sensors only
- move `facilityZones` into backend-controlled facility/site metadata
- verify live readings, historical readings, and alert thresholds all come from backend
- add site/facility scoping for sensor data

Required backend work:

- facility/zone domain model likely needed

### [src/pages/KPIIndicators.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/KPIIndicators.tsx)

Status: `Partial`

Current state:

- uses `useKPIDashboard` and `useKPIReadings`
- still includes mock-export generation paths

Checklist:

- replace mock weekly export data with backend KPI/report datasets
- ensure report export reflects persisted KPI readings and actual date filters
- move standards compliance summary to backend if treated as live operational data

Required backend work:

- backend report export endpoint recommended

### [src/pages/NotificationSettings.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/NotificationSettings.tsx)

Status: `Partial`

Current state:

- uses backend notification settings hooks
- still mixes in `mockNavigation` notification objects

Checklist:

- remove mock notification preference fallback for authenticated users
- ensure all displayed channels map to backend preference schema
- persist every settings toggle through backend only

Required backend work:

- mostly frontend cleanup

### [src/pages/ContractorPermitManagement.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/ContractorPermitManagement.tsx)

Status: `Partial`

Current state:

- uses contractor hooks
- still renders core permit/application sections from local mock arrays

Checklist:

- replace mock permit applications with backend contractor permit data
- add create/update/approve/reject flows if UI supports those actions
- ensure contractor and permit dashboards derive counts from backend

Required backend work:

- verify contractor permit CRUD completeness

### [src/pages/IndustrialHygiene.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/IndustrialHygiene.tsx)

Status: `Partial`

Current state:

- uses hygiene hooks
- still renders sampling plans and some metrics from page-local mock arrays

Checklist:

- move sampling plans to backend
- replace summary stat calculations based on mock plans with backend counts
- persist monitoring plans and due dates

Required backend work:

- add hygiene sampling plan endpoints if absent

## Group B: Backend Hook Missing or Backend Module Missing

### [src/pages/ChecklistBuilder.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/ChecklistBuilder.tsx)

Status: `Pending`

Current state:

- fully localStorage-based custom checklist builder
- no shared API hook is used

Checklist:

- create backend checklist template table(s)
- add CRUD endpoints for custom checklists and checklist items
- add API service + hooks for checklist templates
- migrate localStorage records to backend on first load or provide import path
- support ownership and tenant scoping

Required backend work:

- new backend module required

### [src/pages/RiskAssessmentChecklists.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/RiskAssessmentChecklists.tsx)

Status: `Pending`

Current state:

- stores progress and email queue behavior in localStorage
- not wired to shared backend checklist persistence

Checklist:

- persist checklist progress, completion state, comments, and signatures to backend
- remove localStorage email queue logic and move notifications to backend jobs/events
- connect selected industry templates to backend checklist definition records
- add offline queue strategy only if intentionally required, not as primary persistence

Required backend work:

- checklist run/instance backend required

### [src/pages/OrganizationSettings.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/OrganizationSettings.tsx)

Status: `Pending`

Current state:

- fully mock organization/team/billing/integration UI
- no dedicated organization settings hooks
- auth profile update exists, but organization management module does not

Checklist:

- create organization profile endpoint
- create team member management endpoints
- create invite/member role endpoints
- create region/facility/industry settings endpoints
- connect billing tab only after subscription backend exists
- connect integrations tab to real integration configuration backend

Required backend work:

- new organization management module required

### [src/pages/UserProfile.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/UserProfile.tsx)

Status: `Pending`

Current state:

- partially overlays auth user data
- still loads/saves profile via mock navigation helpers and localStorage
- accent/theme/avatar state remains browser-local

Checklist:

- remove `loadUserProfile` and `saveUserProfile` as primary persistence
- extend backend profile schema to include phone, title, avatar, preferences, accent/theme if these are product-level settings
- add avatar upload/storage strategy
- persist user preferences server-side or intentionally separate them as local-only UI preferences

Required backend work:

- profile/preferences backend expansion required

### [src/pages/AIVisualAudit.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/AIVisualAudit.tsx)

Status: `Pending`

Current state:

- uses browser-side `aiService`
- stores audit results in localStorage
- no shared backend hook or dedicated backend route is used for audit persistence

Checklist:

- define backend visual audit job/result model
- upload images/videos to managed object storage
- send analysis requests through backend, not direct browser-only engine logic
- persist results, hazards, suggestions, notes, and attachments in backend
- store activity history and audit trail server-side
- support re-open/view by ID from backend records

Required backend work:

- new visual audit backend module required

### [src/pages/AIVisualAuditHistory.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/AIVisualAuditHistory.tsx)

Status: `Pending`

Current state:

- history is localStorage-backed

Checklist:

- replace localStorage history with backend audit result list/detail endpoints
- support pagination, filters, retention rules, and permissions

Required backend work:

- depends on visual audit module

### [src/pages/AIVisualAuditHub.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/AIVisualAuditHub.tsx)

Status: `Pending`

Current state:

- still reads local visual audit state
- mostly orchestration/dashboard UI, not backed by real backend audit telemetry

Checklist:

- replace local audit counters and activity with backend visual audit metrics
- wire engine health/status to backend AI service health endpoints
- make standards/config metadata backend-driven if intended to be admin-configurable

Required backend work:

- depends on visual audit module and AI ops metrics

### [src/pages/OrganizationSettings.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/OrganizationSettings.tsx#L1)

Status note:

- billing and integrations sub-tabs should not be marked complete until subscription, org provisioning, and integration config backends exist

## Group C: Static Reference Pages That May Stay Static

These pages import static reference data but are not necessarily blockers if they are intended as built-in reference content rather than tenant data.

### [src/pages/CrossReferenceMatrix.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/CrossReferenceMatrix.tsx)

Status: `Implemented`

Note:

- acceptable as static standards mapping unless product requirements change

### [src/pages/NFPACodes.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/NFPACodes.tsx)

Status: `Partial but acceptable`

Note:

- if NFPA library is product reference content, seeded static defaults are acceptable
- if admin-managed code library is required, move fully to backend records

### [src/pages/IncidentReporting.tsx](/Users/mudassarnaeem/source_code%207_2/src/pages/IncidentReporting.tsx)

Status: `Implemented with static standards reference`

Note:

- standards import alone is not a blocker if used for label/reference selection only

## Priority Order

### Priority 1

- OrganizationSettings
- UserProfile
- ChecklistBuilder
- RiskAssessmentChecklists
- AIVisualAudit
- AIVisualAuditHistory
- AIVisualAuditHub

### Priority 2

- Analytics
- ESGReporting
- ProjectManagement
- EmissionReports
- IoTSensorDashboard
- IndustrialHygiene

### Priority 3

- ChemicalSDSManagement
- AssetQRScanner
- SafetyProcedures
- RiskDigester
- KPIIndicators
- NotificationSettings
- ContractorPermitManagement

## Exit Criteria for Full Backend Integration

A page should be considered fully integrated only when:

- business-critical state is stored on the backend, not localStorage
- the page does not depend on mock data for core user workflows
- API contract is normalized through `src/api/services` and `src/api/hooks`
- user/org scope is enforced on reads and writes
- mutations survive refresh and cross-device usage
- audit/history data is queryable from the backend where relevant