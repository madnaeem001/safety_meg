# SafetyMEG Remaining Gaps And Defects

Prepared on: March 12, 2026  
Purpose: This document records only the areas that remain partial, broken, mock-backed, blocked, or unverified after execution testing.

## Status Legend

- Broken Navigation
- Broken CRUD
- Runtime Error
- Partially Integrated
- Mock/Data Placeholder
- Blocked by Missing Backend Contract
- Blocked by Environment or Credentials
- Not Yet Executed

## 1. High-Priority Gaps

| Area | Severity | Status | Root Cause | Suggested Fix | Notes |
|---|---|---|---|---|---|
| Webhooks route | High | Broken Navigation | `/#/webhooks` audit route does not resolve/render the expected page in current app state | Inspect route resolution, lazy import, and any redirect/catch-all interaction | Currently intentionally skipped in route audit spec. |
| Mobile risk-register mutation coverage | Medium | Blocked by Environment or Credentials | Backend rate-limiting under E2E load affects mobile mutation path | Keep mobile mutation serial/skipped until backend rate-limit/test env is relaxed | Intentionally skipped. |
| Mobile training mutation coverage | Medium | Blocked by Environment or Credentials | Shared mobile environment remains unstable for assignment mutation run | Keep mobile mutation serial/skipped or provision more stable seeded environment | Intentionally skipped. |

## 2. Page-Level Defect Matrix

| Page | Issue Type | Severity | Reproduction | Expected | Actual | Notes |
|---|---|---|---|---|---|---|
| WebhooksPage | Broken Navigation | High | Open `/#/webhooks` in authenticated session | Webhook Integrations page should render | Expected heading/text does not render; route currently skipped in audit suite | Needs route-level investigation. |

Resolved in latest audit cycle:

- RegulationsLibrary duplicate React key warnings were fixed by deduplicating repeated regulation ids in the merged regulation export.
- NotificationSettings and UserProfile route-surface failures were fixed by restoring explicit `main` landmarks.
- InspectionScheduling route crash was fixed by guarding against null schedule and sensor collections before rendering.
- Mobile demo-admin login smoke now passes in the latest full mobile audit cycle.
- Shell AI readiness and shared drawer/bottom-tab regressions were fixed; desktop and mobile all-pages audits now pass with only Webhooks skipped.
- NotificationSettings no longer relies on mock localStorage preference fallback and now persists settings through the backend notification preferences endpoints.
- SafetyProcedures no longer depends on `mockSafetyProcedures` for business content; summary metrics, hierarchy-of-controls examples, ISO checklist mappings, and review labels now derive from backend safety procedure records with explicit empty states.

## 3. Component-Level Defect Matrix

| Component | Issue Type | Severity | Reproduction | Notes |
|---|---|---|---|---|
| No currently confirmed shared-shell component defects | N/A | N/A | Latest full desktop/mobile route audit | Remaining gaps are page-specific or backendization-related rather than shell-component breakage. |

## 4. Mock And Local-Only Areas Still Requiring Backendization

| Area | Current State | Target State | Priority | Notes |
|---|---|---|---|---|
| AIVisualAudit family | Partial localStorage-assisted behavior | Backend-backed persistence | High |  |
| OrganizationSettings | Partial/mock-backed | Backend-backed organization settings | High |  |

## 5. Audit Blockers

| Blocker | Impact | Mitigation | Notes |
|---|---|---|---|
| Backend rate limiting during mobile mutation E2E | Prevents stable mobile CRUD verification for some heavy flows | Run serial, reduce auth/API bursts, or relax test environment rate limit | Current mitigation is explicit skip for mobile risk/training mutation tests. |
| Webhooks route unresolved | Prevents route-audit verification of webhook management screen | Keep route marked skipped until route is fixed | Known defect retained in suite as `fixme`. |
