# SafetyMeg — Next Milestone Scope
**Milestone:** EHS Operational Expansion (Phase 2 EHS Capabilities + AI Intelligence)  
**Based on:** EHS Capability Roadmap (Cority/Intelex/VelocityEHS parity)  
**Pre-requisite:** Current milestone fully complete ✅

---

## Strategic Goal

Evolve SafetyMeg from a stable backend platform into a fully operational EHS system comparable to Cority, Intelex, and VelocityEHS — with AI-powered data capture, multi-site audit management, training competency tracking, and mobile offline capabilities.

---

## Module 1 — Incident Reporting Intelligence Upgrade

### What's already built (current milestone):
- Basic incident CRUD, DB persistence, Zod validation, error handling

### What to build next:

#### 1.1 AI-Assisted Incident Classification
- **Backend:** POST `/api/incidents/{id}/classify`
- **Model:** LLM + rules engine hybrid via existing OpenRouter integration
- **Input:** Free-text incident description
- **Output:** Suggested severity, category, regulatory classification (OSHA 300/WSIB/WorkSafe)
- **Stored as:** `classification_rules` table — OSHA/WSIB logic stored as JSON rules (allows client to customize without code changes)
- **Data models to add:**
  ```sql
  classification_rules (id, standard, rule_json, priority, created_at)
  incident_events (id, incident_id, event_type, actor_id, payload, created_at)
  ```

#### 1.2 Evidence Intelligence (OCR + NLP)
- **Backend:** POST `/api/incidents/{id}/evidence`
- **AI pipeline:** On image upload, run OCR → extract hazard descriptions, locations, equipment names
- **NLP layer:** Extract `hazards[]`, `causes[]`, `controls[]` from free-text and attach to incident
- **Data models to add:**
  ```sql
  incident_evidence (id, incident_id, file_url, file_type, ocr_text, extracted_hazards, metadata)
  injury_details (id, incident_id, body_part, treatment_type, lost_time_days, restricted_days)
  ```

#### 1.3 Incident Timeline (Event Log)
- Every status change, assignment, evidence upload, classification event stored in `incident_events`
- `GET /api/incidents/{id}/timeline` endpoint
- Frontend: Timeline view in incident detail page

---

## Module 2 — CAPA Intelligence Upgrade

### What's already built:
- CAPA CRUD, status tracking, Zod validation

### What to build next:

#### 2.1 AI-Generated Root Cause Suggestions
- When creating a CAPA linked to an incident, call AI with incident description + evidence summary
- Return suggested root causes using 5-Why / Fishbone framing
- Store in `root_cause_analysis` table:
  ```sql
  root_cause_analysis (id, capa_id, method, findings_json, contributing_factors_json, ai_generated, created_at)
  ```

#### 2.2 AI-Generated Corrective Action Recommendations
- Given root cause analysis output, AI suggests specific corrective actions ranked by effectiveness
- POST `/api/capa/{id}/ai-recommend`

#### 2.3 Predictive CAPA Prioritization
- ML scoring model (simple regression or LLM scoring) to rank open CAPAs by risk exposure
- Factors: linked incident severity, overdue days, recurrence history
- Exposed as `priority_score` field on CAPA list endpoint

---

## Module 3 — Audit & Inspection Management (Full)

### What's already built:
- Basic audit CRUD, inspection CRUD, AI audit analysis endpoint

### What to build next:

#### 3.1 Audit Scheduling Engine
- `audit_schedules` table: `(id, template_id, site_id, recurrence_rule, next_due, assigned_to, created_at)`
- Recurrence rules stored as iCal RRULE strings (e.g. `FREQ=MONTHLY;BYDAY=1MO`)
- Background job: daily check, auto-create audit instances from schedules
- `GET /api/audits/schedule` — list upcoming audits

#### 3.2 Multi-Site Audit Program Management
- `audit_programs` table: `(id, name, sites[], template_ids[], owner_id, start_date, end_date)`
- Cross-site compliance comparison reports
- `GET /api/audits/programs/{id}/report` — aggregated compliance % by site

#### 3.3 AI Audit Checklist Generation (Enhanced)
- Currently: generates summary after completion
- Next: generate full question checklist from standard + scope description before audit starts
- POST `/api/ai/audit-form/generate-checklist` with `{ standard, scope, siteType }`

#### 3.4 Conditional Form Logic Builder
- Audit forms support branching: if answer = "Non-Compliant" → show follow-up questions
- Store form logic as JSON schema with `conditions[]` array
- Frontend: form builder UI with drag-and-drop conditional logic

---

## Module 4 — Training & Competency Management (Enhanced)

### What's already built:
- Training course CRUD, AI course description generation, competency scores, certification tracking

### What to build next:

#### 4.1 Training Matrix Engine
- Map workers to required competencies based on their role + site + job hazards
- `training_matrix` table: `(id, role, site_id, required_course_ids[], created_at)`
- `GET /api/training/matrix/gaps?worker_id=` — returns overdue/missing training per worker

#### 4.2 Certification Expiry Engine (Alerts)
- Background job: daily check for certifications expiring in 30/60/90 days
- Auto-create notifications + optional email alerts for worker + manager
- `GET /api/training/certifications/expiring?days=30`

#### 4.3 SCORM / xAPI Support (External LMS Integration)
- Accept xAPI statements: POST `/api/training/xapi/statements`
- Store completion evidence from external LMS systems (Docebo, TalentLMS, etc.)
- Map xAPI completion to internal certification records

#### 4.4 AI Skill Gap Prediction
- Given a worker's training history and their assigned JHAs, AI identifies missing competencies
- POST `/api/ai/training/skill-gap` with `{ worker_id, jha_ids[] }`

---

## Module 5 — Asset & Equipment Safety Management

### What's to build (not started):

#### 5.1 Asset Registry
- `assets` table: `(id, name, category, location_id, serial_number, manufacturer, model, install_date, status)`
- `GET/POST/PUT/DELETE /api/assets`
- QR code generation per asset (returns scannable code linking to asset detail page)

#### 5.2 Inspection Intervals + Calibration Tracking
- `asset_inspection_schedule` table: recurrence-based inspection scheduling tied to each asset
- `asset_calibration_records` table: calibration date, next due, calibration authority, cert file URL
- Overdue alerts via notification engine

#### 5.3 LOTO (Lockout/Tagout) Templates
- `loto_templates` table: `(id, asset_id, steps_json, energy_sources_json, created_by)`
- Workers can pull LOTO procedure on mobile before working on equipment

#### 5.4 AI-Flagged High-Risk Assets
- Based on inspection history, failure frequency, and age — AI scores assets by risk level
- `GET /api/assets?sort=risk_score` exposes ranked list

---

## Module 6 — Advanced Risk Management (Bowtie)

### What's already built:
- Risk register CRUD, risk matrix, JHA/JSA builder, basic bow-tie routes

### What to build next:

#### 6.1 Full Bowtie Builder (Interactive)
- Complete `bowtie_diagrams` data model:
  ```sql
  bowtie_events (id, diagram_id, event_type, description, likelihood, consequence)
  bowtie_barriers (id, event_id, barrier_type, description, effectiveness, owner_id)
  bowtie_controls (id, barrier_id, control_type, verification_date, status)
  ```
- Frontend: interactive drag-and-drop bowtie canvas

#### 6.2 Critical Control Verification Workflow
- Flag controls as "critical" — require verified check-in before high-risk work begins
- POST `/api/risks/controls/{id}/verify` creates a verified entry with timestamp + user signature

#### 6.3 AI-Generated Bowtie Diagrams
- Given an event description, AI generates a complete bowtie: threats, consequences, barriers
- POST `/api/ai/bowtie/generate` with `{ event_description, industry }`

#### 6.4 Predictive Risk Scoring
- Rolling AI score for each risk item based on: control effectiveness, past incidents, environmental factors
- Updated nightly via background job

---

## Module 7 — Mobile App (iOS + Android)

### Current state:
- Mobile-responsive web app (PWA)

### What to build next:

#### 7.1 React Native / Expo App
- Shared business logic with existing React frontend via extracted hooks/services
- Target: iOS App Store + Google Play Store distribution

#### 7.2 Offline Incident Capture
- Local SQLite via `expo-sqlite` or `WatermelonDB`
- Full incident form works with no network connection
- Background sync engine: queues mutations, retries with exponential backoff when online

#### 7.3 Voice-to-Incident Reporting
- Device microphone → speech-to-text (iOS native / Android native APIs or Whisper API)
- AI processes transcript → pre-fills incident form fields (location, type, severity)

#### 7.4 QR Code Location Tagging
- Each site location / asset / permit has a printable QR code
- Camera scan → auto-fills `location_id` on incident/inspection forms
- Backend: `GET /api/locations/{qr_token}` — resolves token to full location record

#### 7.5 AI-Powered Hazard Detection via Camera
- Camera feed → image sent to AI (vision model via OpenRouter or dedicated endpoint)
- Detects: missing PPE, blocked exits, spills, unsecured equipment
- Returns flagged hazard list + confidence scores

#### 7.6 Push Notifications
- Backend: `POST /api/push/subscribe` stores device tokens (FCM/APNs)
- Triggers: CAPA due date, certification expiry, inspection schedule, incident assigned
- Mobile: foreground + background notification handling via `expo-notifications`

#### 7.7 Digital Signatures
- In-app signature capture (finger/stylus) on permit-to-work, inspection sign-off, LOTO procedures
- Stored as base64 PNG with timestamp + user ID — legally auditable

#### 7.8 Multi-Language Support
- Already has i18n infrastructure in frontend
- Mobile: extend to React Native with `react-i18next`
- Priority languages: English, Arabic, Spanish, French (based on international EHS market)

---

## Module 8 — Workflow Automation (Enhanced)

### What's already built:
- Basic automation rule builder UI, webhook CRUD

### What to build next:

#### 8.1 Event-Driven Trigger Engine
- When events fire (incident created, CAPA overdue, inspection failed), evaluate automation rules
- `automation_triggers` table: `(id, event_type, conditions_json, action_type, action_payload)`
- Backend worker process: subscribes to event bus, evaluates matching rules, fires actions

#### 8.2 Multi-Step Workflow Builder
- Chain multiple actions: notify → assign CAPA → escalate after 48h → send report
- `workflow_steps` table with ordered `step_index` and `wait_duration`

#### 8.3 AI-Based Escalation Logic
- If CAPA remains open after X days and risk score is high, AI recommends escalation path
- Suggests: notify supervisor, extend deadline, re-assign, or close as accepted risk

---

## Module 9 — ESG & Sustainability Reporting (Foundation)

### What's already built:
- ESG dashboard, basic metrics API endpoints

### What to build next:

#### 9.1 Carbon Accounting Engine
- `emissions_records` table: scope 1 (direct), scope 2 (purchased energy), scope 3 (supply chain)
- Emission factors library (EPA, IPCC) stored in DB
- `POST /api/esg/emissions` — submit consumption data → auto-calculate CO2e

#### 9.2 ESG Framework Mapping
- Map company data to GRI, TCFD, CDP, SASB reporting frameworks
- `esg_framework_mappings` table: `(metric_id, framework, requirement_ref, auto_satisfied)`

#### 9.3 AI-Generated ESG Reports
- Given a period's metrics, AI generates narrative ESG report sections
- POST `/api/ai/esg/generate-report` with `{ period, metrics_snapshot }`

---

## Module 10 — Enterprise Integrations

### What to build next:

#### 10.1 SSO (Azure AD / Okta) — SAML 2.0 / OIDC
- Backend: SAML assertion handler or OIDC callback at `/api/auth/sso/callback`
- Map IdP user attributes to SafetyMeg roles
- `sso_providers` table: `(id, tenant_id, provider, metadata_url, attribute_map_json)`

#### 10.2 HRIS Integration (Workday / SAP SuccessFactors)
- Sync employee roster, role changes, terminations via scheduled HRIS API pull
- `hris_sync_log` table: tracks last sync, changes applied, errors
- Workers auto-enrolled in training matrix when onboarded via HRIS

#### 10.3 ERP Integration (SAP / Oracle)
- Receive asset data from ERP → auto-populate asset registry
- Push CAPA actions to ERP maintenance work orders

#### 10.4 IoT Sensor Ingestion Pipeline (Enhanced)
- Currently: mock sensor readings in DB
- Next: real-time ingestion via MQTT broker or HTTP POST from physical sensors
- `sensor_readings` time-series table with retention policy
- AI anomaly detection: threshold breach + trend deviation alerts

---

## Priority Order for Next Milestone

| Priority | Module | Effort | Business Value |
|----------|--------|--------|----------------|
| 🔴 High | Module 3 — Audit Scheduling Engine | M | Multi-site standardization |
| 🔴 High | Module 4 — Training Matrix + Expiry Engine | M | Compliance risk reduction |
| 🔴 High | Module 7 — Mobile App (Offline + QR + Voice) | XL | Field worker adoption |
| 🟡 Med | Module 1 — AI Classification + Evidence OCR | L | AI differentiation |
| 🟡 Med | Module 2 — AI CAPA Root Cause | M | AI differentiation |
| 🟡 Med | Module 5 — Asset Registry + LOTO | L | Regulated industry entry |
| 🟡 Med | Module 6 — Bowtie Builder (Full) | L | Enterprise risk maturity |
| 🟢 Low | Module 8 — Workflow Event Engine | L | Automation platform |
| 🟢 Low | Module 9 — ESG Carbon Accounting | M | Sustainability market |
| 🟢 Low | Module 10 — SSO + HRIS Integrations | XL | Enterprise sales blocker |

---

## Technical Debt to Address Alongside Next Milestone

| Item | Reason |
|------|--------|
| Migrate from SQLite to PostgreSQL | SQLite has write concurrency limits for multi-user production |
| Extract DB access into repository pattern | Routes still access DB directly in many places |
| Add background job worker (e.g. BullMQ + Redis) | Needed for scheduling engine, cert expiry alerts, IoT ingestion |
| Add file storage integration (S3 / R2) | Evidence photos, SDS PDFs, signature PNGs need blob storage |
| Multi-tenant schema isolation | Required before enterprise or regional client onboarding |
| Rate limiting per tenant (not just per IP) | Current rate limiter is IP-based only |
| API versioning (`/api/v1/`) | Needed before external integrations (HRIS, ERP) are built |

---

## Transactional Email — Next Milestone Items

> **Current milestone status:** Password reset email (`noreply@safetymeg.com` via Resend) and welcome email on registration are fully implemented using `sendSystemEmail()` in `backend/src/services/email.ts`.
>
> **Email domain:** `safetymeg.com` (configured in Resend). **From:** `SafetyMEG <noreply@safetymeg.com>`. Team email `silteam@safetymeg.com` is Google Workspace — manual use only, never automated.

The following transactional email triggers are **deferred to the next milestone** because they depend on modules (incident alert engine, CAPA, certifications, inspections) not yet fully built:

### NE-01 — Incident Created Alert
- **Trigger:** New incident submitted via `POST /api/incidents`
- **Recipients:** Incident reporter (confirmation), assigned supervisor / EHS manager
- **Content:** Incident title, severity, location, link to incident record
- **Template function to add:** `sendIncidentCreatedEmail(to, incident)`
- **Dependency:** Incident routing module, supervisor lookup by department

### NE-02 — CAPA Overdue Alert
- **Trigger:** Background job — daily cron at 08:00 local time; finds CAPAs where `due_date < now AND status != 'closed'`
- **Recipients:** CAPA owner, department manager
- **Content:** CAPA title, days overdue, link to CAPA record
- **Template function to add:** `sendCAPAOverdueEmail(to, capa)`
- **Dependency:** Background job worker (BullMQ + Redis), CAPA module completion

### NE-03 — Certification Expiry Reminder
- **Trigger:** Background job — daily cron; sends at 60, 30, and 7 days before expiry
- **Recipients:** Worker (cert holder), direct manager
- **Content:** Certification name, expiry date, days remaining, renewal instructions
- **Template function to add:** `sendCertificationExpiryEmail(to, cert, daysRemaining)`
- **Dependency:** Background job worker, Worker Profiles + Certifications module (Module 3)

### NE-04 — Inspection Scheduled Notification
- **Trigger:** Inspection assigned/scheduled via `POST /api/inspections`
- **Recipients:** Assigned inspector, location manager
- **Content:** Inspection type, scheduled date, site/area, link to checklist
- **Template function to add:** `sendInspectionScheduledEmail(to, inspection)`
- **Dependency:** Inspection module completion

### NE-05 — HRIS Worker Import Welcome
- **Trigger:** Worker imported via HRIS bulk import (`POST /api/hris/import`)
- **Recipients:** Imported worker (to their work email)
- **Content:** Welcome to SafetyMEG, temporary password / login instructions
- **Template function to add:** `sendHRISWelcomeEmail(to, worker, tempPassword)`
- **Dependency:** SSO + HRIS Integrations module (Module 10)

### Implementation Notes for Next Milestone
- All email functions will extend `sendSystemEmail()` — no new Resend configuration needed.
- A background job scheduler must be added before NE-02 and NE-03 can be implemented.
- HTML templates should be extracted into a dedicated `emailTemplates.ts` file once there are 5+ template functions.
- Consider adding email delivery tracking (Resend webhooks → `email_logs` table) to monitor bounces/failures.
