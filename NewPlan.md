Prioritized Task List (ranked high→low):

Critical / Immediate

P2-4: Replace platform mock data with backend sources — remove all src/data/* mock fallbacks and ensure pages request real endpoints.
P2-5: Migrate localStorage business persistence to backend — replace localStorage-backed state with server persistence and migration endpoints.
P6-4: Apply auth middleware consistently across protected routes — enforce JWT auth on all business routes.
P6-5: Implement route-level authorization and policy checks — role/permission enforcement for sensitive actions.
P6-3: Remove insecure production secret fallbacks — fail fast if required env vars are missing.
P6-2: Replace custom SHA-256 password hashing with Argon2/bcrypt — migrate user password storage and upgrade flow.
High (platform foundation & security)

P7-1 → P7-5 (multi-tenant foundation): create org model, add organization_id to core tables, backfill data, enforce tenant queries, add org-scoped roles.
P5-2: Build checklist run instance backend for RiskAssessmentChecklists.
P5-5: Build visual audit backend module and history flows.
P8-1: Adopt structured JSON logging and central sink.
P8-2: Add metrics, tracing, and alerting.
Medium (feature completeness)

P4-9: Replace IoTSensorDashboard mock sensors with backend integration.
P4-7: Replace RiskDigester mock KPI logic with backend analytics.
P4-10: Replace IndustrialHygiene mock sampling plans with persisted data.
P4-13: Replace ContractorPermitManagement mock permit datasets.
P5-4: Extend user profile backend for avatar & contact details.
P6-6: Add account lockout and stronger auth telemetry.
P8-3: Add queue-backed jobs for email reports and AI processing.
P8-4: Implement object storage for uploads/exports/audit media.
P8-5: Define backup, recovery and health-check strategy.
Lower / Commercial readiness

P9-1 → P9-4: Plans/subscriptions, billing provider, enforce plan limits, connect billing UI — schedule after multi-tenant + ops work.