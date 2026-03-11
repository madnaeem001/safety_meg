# SafetyMEG Backend Documentation

## Architecture
The backend is built with **Hono** and **Drizzle ORM**, following a modular route structure.

## Directory Structure
```
backend/
├── src/
│   ├── index.ts              # Entry point & route registration
│   ├── routes/               # Modular route definitions
│   │   ├── dashboard.ts      # Dashboard KPI & overview
│   │   ├── incidents.ts      # Incident reporting (PHASE 1.2)
│   │   ├── investigations.ts # Investigation & root cause (PHASE 1.3)
│   │   ├── capa.ts           # CAPA & controls management (PHASE 1.4) ✅
│   │   ├── training.ts       # Training & competency management (PHASE 1.5) ✅
│   │   ├── risks.ts          # Risk assessment & register (PHASE 1.6) ✅
│   │   ├── audits.ts         # Audit management & compliance (PHASE 1.7) ✅
│   │   ├── inspections.ts    # Inspection scheduling & sensors (PHASE 1.8) ✅
│   │   ├── analytics.ts      # Reporting & analytics (PHASE 1.9) ✅
│   │   ├── projects.ts       # Project management (PHASE 1.10) ✅
│   │   ├── assets.ts         # Asset management (PHASE 1.11) ✅
│   │   ├── workers.ts        # Worker/employee management (PHASE 1.12) ✅
│   │   ├── supervisor.ts     # Supervisor features: approvals, leaderboard (PHASE 1.13) ✅
│   │   ├── notifications.ts  # Notification system + email (PHASE 1.14) ✅
│   │   ├── automation.ts     # Automation rules + webhooks (PHASE 1.15) ✅
│   │   ├── esg.ts            # ESG metrics + sustainability goals (PHASE 1.15) ✅
│   │   ├── quality.ts        # Quality non-conformities (PHASE 1.15) ✅
│   │   ├── hygiene.ts        # Industrial hygiene assessments (PHASE 1.15) ✅
│   │   ├── contractors.ts    # Contractor management + permits (PHASE 1.15) ✅
│   │   ├── ai.ts             # AI chat, suggestions, ML endpoints (PHASE 1.15) ✅
│   │   ├── compliance-procedures.ts  # Compliance procedures (PHASE 1.16) ✅
│   │   ├── regulations.ts    # Regulations library (PHASE 1.16) ✅
│   │   ├── chemicals.ts      # Chemical inventory + SDS management (PHASE 1.16) ✅
│   │   ├── toolbox.ts        # Toolbox talks + attendance (PHASE 1.16) ✅
│   │   ├── certifications.ts # Certification tracker (PHASE 1.17) ✅
│   │   ├── compliance-calendar.ts # Compliance calendar + gap analysis (PHASE 1.17) ✅
│   │   ├── standards.ts      # International standards + NFPA codes (PHASE 1.17) ✅
│   │   ├── behavior-safety.ts # BBS observations + SIF precursors (PHASE 1.17) ✅
│   │   ├── permit-to-work.ts  # Permit to Work (PHASE 1.18) ✅
│   │   ├── hazard-reports.ts  # Hazard Reports voice-capable (PHASE 1.18) ✅
│   │   ├── safety-procedures.ts # Safety Procedures SOP (PHASE 1.18) ✅
│   │   ├── kpi.ts             # KPI definitions + readings (PHASE 1.18) ✅
│   │   ├── notifications.ts  # Email handling via Resend
│   │   └── safety.ts         # Safety baseline management
│   └── __generated__/        # Drizzle schema and types
```

## Implementation Status

### ✅ PHASE 1.2: Incident Reporting (COMPLETED)
**Status:** All 8 endpoints tested and working
**Database:** 4 incident sub-type tables created
**Endpoints:**
- POST /api/incidents/create - Generic incident creation
- POST /api/incidents/create/:type - Type-specific creation (injury, vehicle, property, near-miss)
- GET /api/incidents/:id - Retrieve incident
- GET /api/incidents/list - List all incidents with filters
- PUT /api/incidents/:id/close - Close incident
- PUT /api/incidents/:id/reopen - Reopen incident
- GET /api/incidents/stats - Get incident statistics

### ✅ PHASE 1.3: Investigation & Root Cause (COMPLETED)
**Status:** All 10 endpoints tested and working  
**Database:** 5 investigation tables created (investigations, rcca, bowtie_scenarios, bowtie_barriers, audit_trail)
**Endpoints:**
- POST /api/investigations/create - Create investigation
- GET /api/investigations/:id - Retrieve investigation
- GET /api/investigations/by-incident/:incidentId - Get by incident
- PUT /api/investigations/:id - Update investigation
- POST /api/investigations/:id/rcca - Create RCCA (Root Cause & Corrective Action)
- GET /api/investigations/:id/rcca - Retrieve RCCA
- POST /api/investigations/:id/bowtie - Create Bow-Tie analysis
- GET /api/investigations/:id/bowtie - Retrieve Bow-Tie analysis
- PUT /api/investigations/:id/assign - Assign investigation
- GET /api/investigations/list - List investigations

### ✅ PHASE 1.4: CAPA & Controls Management (COMPLETED)
**Status:** All 11 endpoints tested and working
**Database:** 5 CAPA tables created (capa_records, safety_controls, control_barriers, risk_control_links, capa_verifications)
**Endpoints:**
- POST /api/capa/create - Create CAPA record
- GET /api/capa/:id - Retrieve CAPA details
- PUT /api/capa/:id - Update CAPA (status, priority, etc.)
- GET /api/capa/list - List CAPAs with filters (status, priority, department)
- POST /api/capa/:id/verify - Verify CAPA effectiveness
- GET /api/capa/:id/risks - Get associated risks for CAPA
- POST /api/controls/create - Create safety control
- GET /api/controls/:id - Retrieve control details
- PUT /api/controls/:id - Update control status/effectiveness
- GET /api/controls/list - List controls with filters
- GET /api/controls/hierarchy - NIOSH 5-level hierarchy (Elimination→PPE)

### ✅ PHASE 1.5: Training & Competency Management (COMPLETED)
**Status:** All 8 endpoints tested and working
**Database:** 4 training tables created (training_courses, employee_training, training_assignments, training_matrix)
**Endpoints:**
- POST /api/training/courses - Add training course to catalog
- GET /api/training/courses - List courses (filter: category, role, active)
- GET /api/training/courses/:id - Get course details by ID
- POST /api/training/complete - Record employee training completion (auto-calculates expiration + status)
- GET /api/training/employee/:employeeId - Get all training records for employee (with compliance stats)
- POST /api/training/assign - Assign training to employee with due date
- GET /api/training/compliance - Get compliance overview (current%, expiring, expired, overdue)
- GET /api/training/expiring?days=N - Get records expiring within N days
- POST /api/training/matrix - Add course to role training matrix
- GET /api/training/matrix - Get role-to-course matrix (filter by role)

**Key Logic:**
- Expiration dates auto-calculated from completionDate + validityMonths
- Status auto-updated on each GET: Current | Expiring Soon (≤30 days) | Expired
- Upsert on completion: re-completing a course updates existing record
- Completing assigned training auto-marks the assignment as Completed

### ✅ PHASE 1.6: Risk Assessment & Risk Register (COMPLETED)
**Status:** All 13 endpoints tested and working
**Database:** 3 risk tables created (hazard_templates, risk_assessments, risk_register)
**Endpoints:**
- GET /api/risks/matrix - 5x5 risk matrix with severity/likelihood labels + level ranges
- GET /api/risks/stats - Dashboard stats (assessments by level + register by status)
- POST /api/risks/hazards - Create hazard template with suggested controls (JSON)
- GET /api/risks/hazards - List hazard templates (filter by category)
- GET /api/risks/hazards/:id - Full hazard details
- POST /api/risks/assessments - Create assessment (severity × likelihood → riskScore + riskLevel auto)
- GET /api/risks/assessments - List with filters (status, riskLevel, department)
- GET /api/risks/assessments/:id - Full details with controls array + linked register items
- PUT /api/risks/assessments/:id - Update (recalculates riskScore + residualRisk)
- POST /api/risks/register - Add to risk register (auto-deduplication by riskCode)
- GET /api/risks/register - List register sorted by risk score desc
- GET /api/risks/register/:id - Detail with severity/likelihood labels
- PUT /api/risks/register/:id - Update status/mitigation

**Key Logic:**
- Risk score = severity × likelihood (1-25)
- Risk levels: Low (1-4) | Medium (5-9) | High (10-16) | Critical (17-25)
- Residual risk calculated independently from controls applied
- Risk register items can be linked to full assessments via assessmentId

### ✅ PHASE 1.11: Asset Management (COMPLETED)
**Status:** All 14 endpoints tested and working (27/27 total tests PASS)
**Database:** 2 new tables (assets, asset_maintenance) — total: 43 tables
**Endpoints:**
- GET /api/assets - List assets (filter: type, location, status, department, condition, search)
- POST /api/assets - Register asset (auto-generates asset_code=ASSET-XXXXX, qr_code=QR-<uuid>)
- GET /api/assets/scan/:qrCode - Look up asset by QR code (STATIC, registered BEFORE /:assetId)
- GET /api/assets/:assetId - Full asset detail with last 5 maintenance records
- PUT /api/assets/:assetId - Update asset fields (condition, status, location, notes, etc.)
- DELETE /api/assets/:assetId - Soft decommission (sets status='decommissioned', no hard delete)
- POST /api/assets/:assetId/qr - Generate / regenerate QR code (UUID-based)
- POST /api/assets/:assetId/maintenance - Log maintenance record (updates asset.lastMaintenanceDate + nextMaintenanceDue)
- GET /api/assets/:assetId/maintenance - Full maintenance history for asset

**Key Logic:**
- assetCode auto-generated: `ASSET-00001`, `ASSET-00002`, ...
- qrCode auto-generated on creation as `QR-<uuid>`; can be regenerated via POST /qr
- DELETE is soft-delete only — sets status='decommissioned'
- Asset types: Machine | Vehicle | Tool | Safety Equipment | Infrastructure
- Maintenance types: preventive | corrective | emergency | inspection
- CRITICAL: `GET /api/assets/scan/:qrCode` MUST be registered BEFORE `GET /api/assets/:assetId`
- Logging a maintenance record auto-updates `last_maintenance_date` and `next_maintenance_due` on the asset

### ✅ PHASE 1.18: Permit to Work, Hazard Reports, Safety Procedures & KPI Management (COMPLETED)
**Status:** 39/39 PASS
**Database:** 6 new tables (permit_to_work, ptw_approvals, hazard_reports, safety_procedures, kpi_definitions, kpi_readings) — total: **78 tables**
**New Route Files:** permit-to-work.ts, hazard-reports.ts, safety-procedures.ts, kpi.ts

**18.1 Permit to Work (permit-to-work.ts):**
- GET /api/ptw/stats — total, active, pendingApproval, expiringSoon, byStatus, byType, byRiskLevel [STATIC first]
- GET /api/ptw/permits — list (filter: status, permitType, riskLevel, department, from/to)
- POST /api/ptw/permits — create (permitType required: hot-work|confined-space|working-at-height|electrical|excavation|general; location required; ppeRequired/precautions/iotSensorIds stored as JSON; auto-generates PTW-XXXXX)
- POST /api/ptw/permits/:id/approve — approve permit (inserts ptw_approvals record, sets status='approved') [STATIC BEFORE /:id GET]
- POST /api/ptw/permits/:id/reject — reject permit (inserts ptw_approvals record, sets status='cancelled') [STATIC BEFORE /:id GET]
- GET /api/ptw/permits/:id — single permit with parsed ppeRequired, precautions, iotSensorIds + approvals array
- PUT /api/ptw/permits/:id — update any fields
- DELETE /api/ptw/permits/:id — cascades: deletes ptw_approvals then permit

**18.2 Hazard Reports (hazard-reports.ts):**
- GET /api/hazards/stats — total, submitted, resolved, critical, byType, bySeverity, byStatus [STATIC first]
- GET /api/hazards — list (filter: hazardType, severity, status, department, from/to)
- POST /api/hazards — create (hazardType required: slip-trip-fall|electrical|chemical|machinery|ergonomic|fire|confined-space|other; location+description+severity required; auto-generates HAZ-XXXXX; status defaults to 'draft')
- POST /api/hazards/:id/submit — submit report (sets status='submitted') [STATIC BEFORE /:id GET]
- GET /api/hazards/:id — single report
- PUT /api/hazards/:id — update (auto-sets resolved_at when status → 'resolved' or 'closed')

**18.3 Safety Procedures (safety-procedures.ts):**
- GET /api/safety-procedures/stats — total, active, reviewDue (next 30 days), byCategory, byStatus, byRiskLevel [STATIC first]
- GET /api/safety-procedures — list (filter: category, status, riskLevel, department, search LIKE title/description)
- POST /api/safety-procedures — create (title+category required; category: emergency|operational|maintenance|chemical|electrical|confined-space|ppe|fire|general; steps stored as JSON array; applicableRoles stored as JSON; auto-generates SOP-XXXXX)
- GET /api/safety-procedures/:id — single with parsed steps (array of {stepNumber, title, description, warning?}) + applicableRoles
- PUT /api/safety-procedures/:id — update (steps/applicableRoles re-JSON-stringified on write)
- DELETE /api/safety-procedures/:id — hard delete

**18.4 KPI Management (kpi.ts):**
- GET /api/kpi/stats — total, active, leading, lagging, totalReadings, byDepartment [STATIC first]
- GET /api/kpi/dashboard — latest reading per KPI with statusVsTarget (on-target|warning|critical|no-data) and trendVsPrev (up|down|stable) [STATIC]
- GET /api/kpi/definitions — list (filter: category, department, isActive) [STATIC BEFORE /definitions/:id]
- POST /api/kpi/definitions — create (name+category required; category: leading|lagging; frequency: daily|weekly|monthly|quarterly|annual)
- GET /api/kpi/definitions/:id — single with recentReadings (last 12)
- PUT /api/kpi/definitions/:id — update (camelCase in body → snake_case columns)
- DELETE /api/kpi/definitions/:id — cascades: deletes kpi_readings then definition
- GET /api/kpi/readings — list with JOIN to kpi_definitions (filter: kpiId, period, from/to)
- POST /api/kpi/readings — record reading (kpiId must exist, returns joined kpi_name+unit)

**Key Notes:**
- CRITICAL route order: `POST /api/ptw/permits/:id/approve` and `POST /api/ptw/permits/:id/reject` MUST be registered BEFORE `GET /api/ptw/permits/:id`
- CRITICAL route order: `POST /api/hazards/:id/submit` MUST be registered BEFORE `GET /api/hazards/:id`
- PTW response columns are snake_case: permit_number, permit_type, risk_level, start_date, end_date (NOT camelCase)
- Hazard response column is report_number (NOT hazardNumber)
- Safety Procedures response column is procedure_number (NOT sopNumber)
- PTW startDate/endDate expect ISO date strings (not Unix timestamps)
- Safety Procedures reviewDate/effectiveDate expect ISO date strings
- PTW GET /:id parses ppeRequired, precautions, iotSensorIds from JSON to arrays
- SP GET /:id parses steps from JSON to array of objects; applicableRoles from JSON to string array
- KPI dashboard: lagging KPIs — lower is better; leading KPIs — higher is better vs target
- KPI cascade delete removes kpi_readings before kpi_definitions

### ✅ PHASE 1.17: Certifications, Compliance Calendar, Gap Analysis, Standards, BBS & SIF (COMPLETED)
**Status:** 52/52 PASS
**Database:** 7 new tables (certifications, gap_analysis_reports, compliance_calendar, international_standards, nfpa_codes, safety_observations, sif_precursors) — total: **72 tables**
**New Route Files:** certifications.ts, compliance-calendar.ts, standards.ts, behavior-safety.ts

**17.1 Certification Tracker (certifications.ts):**
- GET /api/certifications/stats — total, active, expired, pendingRenewal, expiringSoon (next 30 days), byCategory [STATIC, first]
- GET /api/certifications — list (filter: status, category, workerId, search, expiringSoon=true)
- POST /api/certifications — create (workerName+certificationName required; status: active|expired|suspended|pending-renewal; category: safety|health|environment|technical|first-aid)
- GET /api/certifications/:id — single (404 if not found)
- PUT /api/certifications/:id — update any fields
- DELETE /api/certifications/:id — hard delete

**17.2 Compliance Calendar + Gap Analysis (compliance-calendar.ts):**
- GET /api/compliance/gap-analysis/stats — total, byStatus, byStandard, avgComplianceRate [STATIC first]
- GET /api/compliance/gap-analysis — list (filter: status, standard)
- POST /api/compliance/gap-analysis — create (standard: ISO45001|OSHA|EPA|NFPA|WHO|ISO14001|ISO9001|local; findings/actionItems stored as JSON arrays)
- GET /api/compliance/gap-analysis/:id — single with parsed findings+actionItems
- PUT /api/compliance/gap-analysis/:id — update
- GET /api/compliance/calendar/stats — total, byStatus, byType, byPriority, overdue count, upcoming7 [STATIC first]
- GET /api/compliance/calendar — list (filter: status, eventType, department, from/to, priority; order: due_date ASC)
- POST /api/compliance/calendar — create (eventType: audit|inspection|certification-renewal|regulation-deadline|review|training|reporting; dueDate required)
- GET /api/compliance/calendar/:id — single
- PUT /api/compliance/calendar/:id — update (auto-sets completedAt when status→'completed')
- DELETE /api/compliance/calendar/:id — hard delete

**17.3 International Standards (standards.ts):**
- GET /api/standards/international/stats — total, byCategory, byIssuer, requireCertification count [STATIC first]
- GET /api/standards/international — list (filter: category, issuer, search, certRequired=true) [STATIC second, BEFORE /:id]
- POST /api/standards/international — create (issuer: ISO|IEC|ANSI|BSI|AS|other; clauses/applicableSectors stored as JSON)
- GET /api/standards/:id — single with parsed clauses+applicableSectors (404 if not found)
- PUT /api/standards/:id — update
- DELETE /api/standards/:id — delete

**17.4 NFPA Codes (standards.ts):**
- GET /api/nfpa/stats — total, byCategory, byHazardLevel [STATIC first]
- GET /api/nfpa/codes — list (filter: category, hazardLevel, search) [STATIC before /codes/:id]
- POST /api/nfpa/codes — create (category: electrical|fire-protection|life-safety|hazardous-materials|processes|other; requirements/applicableIndustries stored as JSON)
- GET /api/nfpa/codes/:id — single with parsed requirements+applicableIndustries
- PUT /api/nfpa/codes/:id — update
- DELETE /api/nfpa/codes/:id — delete

**17.5 Behavior-Based Safety (behavior-safety.ts):**
- GET /api/bbs/stats — total, safe/atRisk/unsafe counts, safeRate%, byCategory, byDept, byStatus, requireFollowUp, avgSafetyScore [STATIC first]
- GET /api/bbs/observations — list (filter: behaviorType, department, status, category, from/to)
- POST /api/bbs/observations — create (observerName+observationDate+behaviorType+description required; behaviorType: safe|at-risk|unsafe; category: ppe|housekeeping|procedures|ergonomics|equipment|environmental|other; safetyScore 1-10)
- GET /api/bbs/observations/:id — single
- PUT /api/bbs/observations/:id — update

**17.6 SIF Precursors (behavior-safety.ts):**
- GET /api/sif/stats — total, active, alertsTriggered, bySeverity, byType, byStatus, recentPrecursors [STATIC first]
- GET /api/sif/precursors — list (filter: severity, status, department, precursorType, alertTriggered=true)
- POST /api/sif/precursors — create (title required; precursorType: energized-equipment|fall-from-height|confined-space|struck-by|vehicle|chemical-exposure|explosion|other; severity: potential-sif|critical|high|medium; associatedHazards/mitigationActions stored as JSON)
- GET /api/sif/precursors/:id — single with parsed associatedHazards+mitigationActions
- PUT /api/sif/precursors/:id — update

**Key Notes:**
- CRITICAL route order: `GET /api/standards/international/stats` and `GET /api/standards/international` MUST be registered BEFORE `GET /api/standards/:id`
- CRITICAL route order: `GET /api/nfpa/stats` and `GET /api/nfpa/codes` MUST be registered BEFORE `GET /api/nfpa/codes/:id`
- CRITICAL route order: `GET /api/compliance/gap-analysis/stats` and `GET /api/compliance/gap-analysis` MUST be registered BEFORE `GET /api/compliance/gap-analysis/:id`
- CRITICAL route order: `GET /api/compliance/calendar/stats` and `GET /api/compliance/calendar` MUST be registered BEFORE `GET /api/compliance/calendar/:id`
- Compliance calendar PUT auto-sets `completed_at` timestamp when status changes to 'completed'
- Gap analysis findings/actionItems stored as JSON strings in DB; parsed back on all reads
- SIF precursors associatedHazards/mitigationActions stored as JSON; parsed on read

### ✅ PHASE 1.16: Compliance Procedures, Regulations, Chemicals & Toolbox Talks (COMPLETED)
**Status:** 48/48 PASS
**Database:** 6 new tables (compliance_procedures, regulations, chemicals, sds_documents, toolbox_talks, toolbox_attendance) — total: **65 tables**
**New Route Files:** compliance-procedures.ts, regulations.ts, chemicals.ts, toolbox.ts

**16.1 Compliance Procedures (compliance-procedures.ts):**
- GET /api/compliance/procedures/stats — total, byStatus, byCategory, recentlyUpdated (last 7 days) [STATIC, first]
- GET /api/compliance/procedures — list with filters (status, category, search LIKE name/description)
- POST /api/compliance/procedures — create (name required; category: safety|environmental|health|quality|regulatory; status: active|draft|archived|under-review)
- GET /api/compliance/procedures/:id — single procedure (404 if not found)
- PUT /api/compliance/procedures/:id — update any fields
- DELETE /api/compliance/procedures/:id — hard delete (404 if not found)

**16.2 Regulations Library (regulations.ts):**
- GET /api/regulations/search — full-text search (q param required, min 2 chars; filter: jurisdiction, category) [STATIC, first]
- GET /api/regulations/stats — total, mandatory count, byJurisdiction, byCategory [STATIC, second]
- GET /api/regulations/list — list (filter: jurisdiction, category, mandatory=true|false) [STATIC, third]
- POST /api/regulations — create (requirements/applicableSectors stored as JSON strings in DB; parsed on read)
- GET /api/regulations/:id — single with parsed requirements/applicableSectors arrays (404 if not found)
- PUT /api/regulations/:id — update any fields
- DELETE /api/regulations/:id — hard delete
- jurisdiction values: federal|state|international|local
- category values: safety|environmental|health|work-hours|fire

**16.3 Chemical Inventory & SDS Management (chemicals.ts):**
- GET /api/chemicals/stats — total, byStatus, byHazard, expiringSoon (next 30 days), withoutSds [STATIC, first]
- GET /api/chemicals — list with filters (status, hazardClass, search LIKE name/casNumber/manufacturer)
- POST /api/chemicals — create chemical record
- GET /api/chemicals/:id/sds — list all SDS documents for chemical [STATIC sub-route, BEFORE /:id]
- POST /api/chemicals/:id/sds — upload/link SDS (auto-updates chemical.sds_upload_date + last_reviewed) [STATIC sub-route, BEFORE /:id]
- GET /api/chemicals/:id — chemical detail + latestSds object (most recent SDS or null)
- PUT /api/chemicals/:id — update fields
- DELETE /api/chemicals/:id — soft-delete (sets status='disposed', NOT hard delete)
- hazardClass values: flammable|toxic|corrosive|oxidizer|explosive|inert|radioactive
- signalWord values: Danger|Warning

**16.4 Toolbox Talks (toolbox.ts):**
- GET /api/toolbox-talks/stats — total, totalAttendees, byStatus, byTopic, byDept, recentTalks [STATIC, first]
- GET /api/toolbox-talks — list with attendeeCount per talk (filter: status, topic, department, from/to timestamps)
- POST /api/toolbox-talks — create talk (keyPoints/attachments stored as JSON strings; parsed on read)
- GET /api/toolbox-talks/:id/attendance — attendance list with talk details [STATIC sub-route, BEFORE /:id]
- POST /api/toolbox-talks/:id/attend — bulk record attendance (DB transaction; min 1 attendee required)
- GET /api/toolbox-talks/:id — full talk detail with attendees array
- PUT /api/toolbox-talks/:id — update any talk fields

**Key Notes:**
- CRITICAL route order: `GET/POST /api/chemicals/:id/sds` MUST be registered BEFORE `GET /api/chemicals/:id`
- CRITICAL route order: `GET /api/toolbox-talks/:id/attendance` and `POST /api/toolbox-talks/:id/attend` MUST be registered BEFORE `GET /api/toolbox-talks/:id`
- CRITICAL route order: `/api/regulations/search`, `/stats`, `/list` MUST be registered BEFORE `GET /api/regulations/:id`
- DELETE /api/chemicals/:id is soft-delete only (status='disposed') — NO hard delete
- Bulk attendance insert uses SQLite transaction for atomicity
- regulations.requirements and regulations.applicableSectors stored as JSON strings; parsed back to arrays on all reads via `safeJson()` helper

### ✅ PHASE 1.15: Advanced Features (COMPLETED)
**Status:** All 49 endpoints tested and working (49/49 tests PASS)
**Database:** 8 new tables (automation_rules, webhook_configs, esg_metrics, sustainability_goals, quality_non_conformities, hygiene_assessments, contractors, contractor_permits) — total: 59 tables
**New Route Files:** automation.ts, esg.ts, quality.ts, hygiene.ts, contractors.ts
**Updated:** ai.ts (added 5 ML/AI endpoints), index.ts (registered 5 new route modules)

**10.1 AI/ML Endpoints (ai.ts):**
- POST /api/ai/predict-incidents — ML incident prediction using historical data (riskScore, riskLevel, factors, recommendations)
- POST /api/ai/anomaly-detection — Detect anomalies in sensor data or incident patterns (statistical z-score method)
- POST /api/ai/voice-analysis — Extract hazard data from voice transcript (urgency, hazardKeywords, suggestedCategory)
- POST /api/ml/train-model — Queue ML model training job (incident-predictor|anomaly-detector|risk-classifier|compliance-advisor)
- GET /api/ai/recommendations — ML-based safety recommendations from current DB state (open incidents, CAPA, expired training)

**10.2 Automation & Integrations (automation.ts):**
- GET /api/automation/rules — List automation rules (filter: active=0|1)
- POST /api/automation/rules — Create rule (name, triggerCondition JSON, action JSON)
- PUT /api/automation/rules/:id — Update rule
- DELETE /api/automation/rules/:id — Delete rule
- POST /api/automation/trigger — Manually trigger a rule (increments execution_count, sets last_triggered)
- GET /api/webhooks — List webhook configurations
- POST /api/webhooks — Register webhook (name, url, events array, secret)
- PUT /api/webhooks/:id — Update webhook
- DELETE /api/webhooks/:id — Delete webhook

**10.3 ESG & Sustainability (esg.ts):**
- GET /api/esg/metrics — List ESG metrics (filter: category, period; includes grouped summary)
- POST /api/esg/metrics — Add new ESG metric measurement
- POST /api/esg/report — Generate ESG summary report (aggregated by metric per category)
- GET /api/sustainability/metrics — Sustainability goals + recent environmental metrics
- POST /api/sustainability/goals — Create sustainability goal (carbon|water|waste|energy|diversity|safety)

**10.4 Quality Management (quality.ts):**
- GET /api/quality/metrics — Quality KPIs (total, byStatus, bySeverity, byType, recent 5)
- POST /api/quality/non-conformity — Report non-conformity (type, description, severity minor|major|critical)
- GET /api/quality/non-conformities — List non-conformities (filter: status, severity, department)
- PUT /api/quality/non-conformities/:id — Update status/correctiveAction/closedAt
- GET /api/quality/trends — Monthly trends for last 12 months (critical/major/minor counts per month)

**10.5 Industrial Hygiene (hygiene.ts):**
- GET /api/hygiene/assessments — List assessments (filter: hazardType, department, status)
- POST /api/hygiene/assessment — Create assessment (title, hazardType chemical|physical|biological|ergonomic|noise|radiation, location, exposureLevel low|medium|high|extreme, controlMeasures array)
- GET /api/hygiene/assessments/:id — Get single assessment (404 if not found)
- GET /api/hygiene/monitoring — Summary: total, byExposureLevel, byHazardType, requiresAction (high/extreme or requires-action)

**10.6 Contractor Management (contractors.ts):**
- GET /api/contractors — List contractors (filter: status, specialty)
- POST /api/contractors — Register contractor (name, company, email, phone, specialty, contractStart/End)
- GET /api/contractors/:id — Get contractor with permits array
- GET /api/contractors/:id/permits — List permits for contractor (STATIC, registered before /:id)
- POST /api/contractors/:id/permits — Issue permit (permitType hot-work|confined-space|electrical|excavation|general|height-work, conditions array)

**Key Notes:**
- `better-sqlite3` opened separately in each route file (no `foreign_keys = OFF` needed for these tables)
- `incidents.type` column does not exist: use `incident_type` instead
- `sensor_readings` uses `recorded_at` not `timestamp`
- `capa` table is `capa_records`; `employee_training` has no `is_active` column (use `status != 'expired'`)
- Static sub-routes (`/api/contractors/:id/permits`) registered BEFORE parameterized `/:id` route

### ✅ PHASE 1.14: Notification System (COMPLETED)
**Status:** All 8 endpoints tested and working (20/20 tests PASS)
**Database:** 3 new tables (notifications, notification_preferences, notification_templates) — total: 51 tables
**Endpoints:**
- GET /api/notifications — List notifications (filter: userId, type, severity, read=true|false, limit; userId=null entries visible to all)
- PUT /api/notifications/settings — Upsert notification preferences (emailNotifications, smsNotifications, inAppNotifications, preferences JSON, quietHours JSON, frequency)
- GET /api/notifications/settings — Get preferences + active templates for a user (STATIC, before /:id)
- POST /api/notifications/preferences — Alternate upsert route (same logic as PUT /settings)
- POST /api/notifications/mark-read — Mark read: { id } | { ids: [...] } | { all: true }
- POST /api/notifications/broadcast — Create notification(s); if department= provided, sends to active workers in that dept; otherwise user_id=NULL (visible to all)
- DELETE /api/notifications/:id — Delete notification (404 if not found)
- GET /api/notifications/alerts — Unread warning+critical notifications (STATIC, before /:id)

**Key Logic:**
- notification_templates table exists for template storage but seeding is done manually; GET /settings returns active templates
- Broadcast with department filter: resolves to worker IDs from `workers` table (status=active); without dept → user_id=NULL broadcast
- CRITICAL: All static routes (alerts, settings, preferences, mark-read, broadcast) MUST be registered BEFORE `DELETE /api/notifications/:id`
- `z.record(z.string(), z.boolean())` required (NOT `z.record(z.boolean())`) in Zod v4 — v4 treats single arg as key type, not value type
- Email sending is handled by separate `POST /api/public/notifications/send-email` (Resend API) — unchanged

### ✅ PHASE 1.13: Supervisor Features (COMPLETED)
**Status:** All 8 endpoints tested and working (29/29 total tests PASS)
**Database:** 2 new tables (approvals, leaderboard) — total: 48 tables
**Endpoints:**
- GET /api/supervisor/approvals - List approvals (default: pending; filter: status=all|pending|approved|rejected, type, priority, assignedTo)
- POST /api/supervisor/approvals - Create approval request (type: incident|training|permit|capa|leave|other)
- POST /api/supervisor/approvals/:id/approve - Approve a pending request (400 if already non-pending)
- POST /api/supervisor/approvals/:id/reject - Reject a pending request (400 if already non-pending)
- GET /api/supervisor/leaderboard - List leaderboard entries (filter: period, department, limit; ordered by safety_points DESC)
- POST /api/supervisor/leaderboard - Upsert leaderboard entry; auto-recalculates ranks for the period
- GET /api/supervisor/team-metrics - Aggregate team stats: avgSafetyScore, avgTrainingRate, totalIncidents, pendingApprovals (filter: department, managerId)
- POST /api/supervisor/delegation - Delegate a task to a worker (inserts into worker_assignments)

**Key Logic:**
- `recalcRanks(period)` is called after every leaderboard upsert — orders by safety_points DESC and renumbers rank 1,2,3,...
- Approval approve/reject: returns 400 if status is already non-pending
- Delegation validates that worker exists (404 if not)
- Leaderboard period values: weekly|monthly|quarterly|annual

### ✅ PHASE 1.12: Worker Management (COMPLETED)
**Status:** All 14 endpoints (9 worker + tests) tested and working (29/29 PASS)
**Database:** 3 new tables (workers, worker_assignments, worker_performance) — total: 46 tables (before approvals/leaderboard)
**Endpoints:**
- GET /api/workers - List workers (filter: department, role, status, search) with summary stats
- POST /api/workers - Create worker (auto-generates EMP-XXXX employeeId; auto-inserts worker_performance row safetyScore=100)
- GET /api/workers/:userId - Full profile with manager info and performance
- PUT /api/workers/:userId - Update any worker fields
- GET /api/workers/:userId/assignments - Worker task assignments (filter: status, taskType)
- GET /api/workers/:userId/trainings - Training history from employee_training + training_courses join
- GET /api/workers/:userId/certifications - Active certifications (training certs + inline JSON certs)
- POST /api/workers/:userId/feedback - Submit feedback (stored as approvals record type=other)
- GET /api/workers/:userId/performance - Performance metrics (safetyScore, trainingRate, incidents, etc.)

**Key Logic:**
- employeeId auto-generated: `EMP-0001`, `EMP-0002`, ...
- Creating a worker auto-inserts a worker_performance row with safetyScore=100
- Training data joined from `employee_training` LEFT JOIN `training_courses` on course_id
- Certifications split: trainingCertifications (from employee_training where certificate_id IS NOT NULL) + additionalCertifications (JSON field on worker)
- Feedback stored in `approvals` table (type='other', status='approved') to avoid audit_trail FK constraint
- CRITICAL: static worker sub-routes (trainings, certifications, etc.) MUST be registered BEFORE `/:userId` param route
- `employee_training` column is `expiration_date` (NOT `expiry_date`) and `certificate_id` (NOT `certificate_issued`)

### ✅ PHASE 1.10: Project Management (COMPLETED)
**Status:** All 13 endpoints tested and working
**Database:** 3 new tables (projects, project_tasks, project_safety_metrics) — total: 41 tables (before assets)
**Endpoints:**
- GET /api/projects - List projects (filter: status, criticality, location, search) with task counts
- POST /api/projects - Create project (auto-generates project_code=PRJ-XXXX; auto-creates safety_metrics row)
- GET /api/projects/:id - Full project detail with tasks array and safety metrics
- PUT /api/projects/:id - Update project (status, manager, dates, budget, safety officer, etc.)
- GET /api/projects/:id/tasks - List tasks for a project (filter: status, priority)
- POST /api/projects/:id/tasks - Create a task within a project
- PUT /api/projects/:id/tasks/:taskId - Update a task (auto-sets completedDate when status=completed)
- GET /api/projects/:id/schedule - Gantt/timeline view (tasks sorted by start_date, overall progress %)
- POST /api/projects/:id/safety-check - Upsert safety metrics (safetyScore, incidents, nearMisses, auditsPassed, trainingCompliancePercentage)

**Key Logic:**
- projectCode auto-generated: `PRJ-0001`, `PRJ-0002`, ...
- Creating a project auto-inserts a project_safety_metrics row (safetyScore=100, incidents=0)
- Setting task status='completed' auto-populates completedDate if not provided
- GET /api/projects returns summary: total, planning, active, onHold, completed counts
- GET /api/projects/:id/schedule returns overallProgress = avg of all task progress values

### ✅ PHASE 1.9: Reporting & Analytics (COMPLETED)
**Status:** All 28 endpoints tested and working
**Database:** 2 new tables (report_templates, scheduled_reports) — total: 38 tables
**Analytics Endpoints:**
- GET /api/analytics/incidents - Incident trends by month (filter: months, department)
- GET /api/analytics/severity-breakdown - Incidents grouped by severity (with %)
- GET /api/analytics/department-metrics - Per-dept: incidents, high-severity, open/total CAPAs
- GET /api/analytics/heatmap-data - Incident counts by location + top 10 hotspots
- GET /api/analytics/time-series - Metric trends over time (metric=incidents|capa|training|audits, period=7d|30d|90d|1y)
- GET /api/analytics/kpi-metrics - Live KPIs: TRIR, LTIR, capaClosureRate, trainingCompletion, complianceRate, avgAuditScore, daysSinceLTI, overdueInspections
- POST /api/analytics/custom-query - 9 predefined analytics queries (incidents_by_severity, incidents_by_type, incidents_by_department, incidents_by_month, capa_status_breakdown, training_completion_by_dept, audit_scores, risk_matrix, sensor_anomaly_rate)

**Reports Endpoints:**
- GET /api/reports/templates - List report templates (filter: type)
- POST /api/reports/templates - Create custom report template
- POST /api/reports/generate - Generate report data (type=incident|training|compliance|audit|kpi|custom; format=json|csv)
- POST /api/reports/schedule - Schedule automated report (frequency=daily|weekly|monthly|quarterly, recipients array)
- GET /api/reports/scheduled - List scheduled reports (filter: status)
- GET /api/reports/emissions - ESG/gas sensor summary (year filter)
- POST /api/reports/export - Export table as CSV or JSON (table=incidents|capa|training|risks|audits|inspections)

**Key Notes:**
- DB status values are capitalized: CAPA uses `Open`/`Verified`, Training uses `Current`/`Expired`, Audits use `Completed`
- Incident severity is mixed-case in DB — all severity comparisons use `UPPER()` for safety
- SQL alias `group` is reserved in SQLite — uses `grp` alias in all custom queries
- TRIR/LTIR calculated against ANNUAL_HOURS = 104,000 (50 employees × 40hr/wk × 52 wks)

### ✅ PHASE 1.8: Inspection Scheduling & Sensor Management (COMPLETED)
**Status:** All 16 endpoints tested and working
**Database:** 4 tables created (inspection_schedule, sensor_configurations, sensor_readings, sensor_calibrations)
**Endpoints:**
- GET /api/inspections/stats - Dashboard: totals by status/type, overdue count, sensor counts by status
- GET /api/inspections/schedule - List inspections (filter: type, zone, status, from/to dates)
- POST /api/inspections/schedule - Schedule new inspection (title, type, zone, recurrence, assignee)
- GET /api/inspections/sensors - List sensors (filter: type, zone, status)
- POST /api/inspections/sensors - Register new sensor (sensorId, type, thresholds, zone, calibrationDue)
- GET /api/inspections/sensors/:sensorId - Full sensor detail with last reading + last calibration
- PUT /api/inspections/sensors/:sensorId - Update sensor config (status, thresholds, calibrationDue)
- POST /api/inspections/readings - Record sensor reading (auto-calculates status, updates sensor status)
- GET /api/inspections/readings - Get readings (filter: sensorId, anomaly, limit)
- POST /api/inspections/sensors/:sensorId/calibrate - Record calibration (updates lastCalibrated, nextCalibrationDue)
- GET /api/inspections/sensors/:sensorId/calibrations - Calibration history for a sensor
- GET /api/inspections/:id - Full inspection detail (checklist, findings, nextScheduledDate)
- PUT /api/inspections/:id - Reschedule/update inspection (status, assignee, date, priority)
- POST /api/inspections/:id/complete - Complete inspection (auto-calculates next scheduled date)

**Key Logic:**
- `calcNextDate()`: Computes next scheduled date from recurrence (weekly=+7d, monthly=+1m, quarterly=+3m, etc.)
- `calcSensorStatus()`: Maps reading value vs min/max thresholds → normal/warning(within 10%)/critical
- Recording a sensor reading auto-updates `sensor_configurations.status` in realtime
- All static routes registered BEFORE parameterized `/:id` routes (Hono RegExpRouter requirement)

### ✅ PHASE 1.7: Audit Management & Compliance (COMPLETED)
**Status:** All 17 endpoints tested and working
**Database:** 4 audit tables created (audit_templates, audits, audit_findings, compliance_requirements)
**Endpoints:**
- GET /api/audits/stats - Dashboard: totals by status, avg score, findings by severity, compliance rate
- POST /api/audits/templates - Create audit template (with checklist items + compliance refs)
- GET /api/audits/templates - List templates (filter: industry, type)
- GET /api/audits/templates/:id - Full template with checklist items
- POST /api/audits/create - Schedule new audit (auditNumber, templateId, leader, team)
- GET /api/audits/list - List audits (filter: status, type, department)
- GET /api/audits/:id - Full audit details with embedded findings array
- PUT /api/audits/:id - Update audit (complete, score, summary)
- POST /api/audits/:auditId/findings - Add finding to audit
- PUT /api/audits/findings/:findingId - Update finding (close, accept risk)
- GET /api/audits/findings/open - All open/in-progress findings across audits
- GET /api/compliance/requirements - List (filter: standard, status)
- POST /api/compliance/requirements - Create compliance requirement
- GET /api/compliance/requirements/:id - Full requirement with evidence/gaps/actions
- PUT /api/compliance/requirements/:id - Update status/maturity/evidence/gaps
- GET /api/compliance/gap-analysis - Gap analysis grouped by standard with compliance rate

**Key Logic:**
- Audit score graded A(90+)/B(80+)/C(70+)/D(60+)/F(<60)
- Static routes (stats, templates, list, create, findings/open) registered before /:id parameterized routes
- Compliance maturity levels: none → initial → managed → defined → measured → optimized
- Gap analysis aggregates all requirements per standard with percentage compliance rate

## API Endpoints

### Public Endpoints
- `GET /api/public/health`: System health check.
- `POST /api/public/notifications/send-email`: Send email via Resend.

### Dashboard Endpoints
- `GET /api/dashboard/overview`: Company-wide safety metrics
- `GET /api/dashboard/analytics`: Detailed analytics data
- `GET /api/dashboard/checklists`: Checklist management

### Incident Endpoints (PHASE 1.2)
- `POST /api/incidents/create`: Create generic incident
- `POST /api/incidents/create/:type`: Create typed incident (injury|vehicle|property|near-miss)
- `GET /api/incidents/:id`: Retrieve incident
- `GET /api/incidents/list`: List all incidents with filters

### Investigation Endpoints (PHASE 1.3)
- `POST /api/investigations/create`: Create investigation
- `GET /api/investigations/:id`: Retrieve investigation
- `POST /api/investigations/:id/rcca`: Create Root Cause & Corrective Action
- `POST /api/investigations/:id/bowtie`: Create Bow-Tie analysis
- `GET /api/investigations/list`: List investigations with filters

### CAPA Endpoints (PHASE 1.4)
- `POST /api/capa/create`: Create CAPA record
- `GET /api/capa/:id`: Get CAPA details
- `PUT /api/capa/:id`: Update CAPA
- `GET /api/capa/list`: List CAPAs with filtering
- `POST /api/capa/:id/verify`: Verify CAPA effectiveness
- `GET /api/capa/:id/risks`: Get associated risks

### Control Endpoints (PHASE 1.4)
- `POST /api/controls/create`: Create safety control

### Training Endpoints (PHASE 1.5)
- `POST /api/training/courses`: Add course to catalog
- `GET /api/training/courses`: List courses with filters
- `GET /api/training/courses/:id`: Get course details
- `POST /api/training/complete`: Record training completion
- `GET /api/training/employee/:id`: Get employee training records + stats
- `POST /api/training/assign`: Assign training to employee
- `GET /api/training/compliance`: Compliance dashboard stats
- `GET /api/training/expiring`: Expiring training records
- `POST /api/training/matrix`: Add course to role matrix
- `GET /api/training/matrix`: Get role-to-course matrix
- `GET /api/controls/:id`: Get control details
- `PUT /api/controls/:id`: Update control
- `GET /api/controls/list`: List controls with filtering
- `GET /api/controls/hierarchy`: NIOSH hierarchy of controls

### Risk Endpoints (PHASE 1.6)
- `GET /api/risks/matrix`: 5x5 risk matrix reference data with labels
- `GET /api/risks/stats`: Risk dashboard statistics (assessments + register summary)
- `POST /api/risks/hazards`: Create hazard template
- `GET /api/risks/hazards`: List hazard templates (filter: category)
- `GET /api/risks/hazards/:id`: Get hazard template details
- `POST /api/risks/assessments`: Create risk assessment (auto-calculates riskLevel)
- `GET /api/risks/assessments`: List assessments (filter: status, riskLevel, department)
- `GET /api/risks/assessments/:id`: Get assessment details (with controls + linked register items)
- `PUT /api/risks/assessments/:id`: Update assessment (recalculates scores)
- `POST /api/risks/register`: Add item to risk register
- `GET /api/risks/register`: List risk register (sorted by score desc, filter: status, riskLevel)
- `GET /api/risks/register/:id`: Get register item details
- `PUT /api/risks/register/:id`: Update register item status/mitigation

### Audit Endpoints (PHASE 1.7)
- `GET /api/audits/stats`: Audit + findings + compliance dashboard stats
- `POST /api/audits/templates`: Create audit template with checklist
- `GET /api/audits/templates`: List templates (filter: type, industry)
- `GET /api/audits/templates/:id`: Get template with full checklist items
- `POST /api/audits/create`: Schedule new audit
- `GET /api/audits/list`: List audits (filter: status, type, department)
- `GET /api/audits/:id`: Full audit details with findings embedded
- `PUT /api/audits/:id`: Update audit (complete with scores and summary)
- `POST /api/audits/:auditId/findings`: Add finding to audit
- `PUT /api/audits/findings/:findingId`: Update finding (close/accept risk)
- `GET /api/audits/findings/open`: All open findings across all audits

### Compliance Endpoints (PHASE 1.7)
- `GET /api/compliance/requirements`: List requirements (filter: standard, status)
- `POST /api/compliance/requirements`: Create compliance requirement
- `GET /api/compliance/requirements/:id`: Get full requirement (evidence, gaps, actions)
- `PUT /api/compliance/requirements/:id`: Update status/maturity/evidence/gaps
- `GET /api/compliance/gap-analysis`: Gap analysis by standard with compliance rate

### Inspection Endpoints (PHASE 1.8)
- `GET /api/inspections/stats`: Dashboard totals (by status/type, overdue, sensor counts)
- `GET /api/inspections/schedule`: List inspections (filter: type, zone, status, date range)
- `POST /api/inspections/schedule`: Schedule new inspection
- `GET /api/inspections/:id`: Full inspection detail with checklist, findings, nextScheduledDate
- `PUT /api/inspections/:id`: Reschedule/update inspection
- `POST /api/inspections/:id/complete`: Complete inspection (auto-calculates next date by recurrence)

### Sensor Endpoints (PHASE 1.8)
- `GET /api/inspections/sensors`: List sensors (filter: type, zone, status)
- `POST /api/inspections/sensors`: Register new sensor
- `GET /api/inspections/sensors/:sensorId`: Full sensor detail with last reading + calibration
- `PUT /api/inspections/sensors/:sensorId`: Update sensor configuration
- `POST /api/inspections/readings`: Record reading (auto-calculates status, updates sensor)
- `GET /api/inspections/readings`: Get readings (filter: sensorId, anomaly, limit)
- `POST /api/inspections/sensors/:sensorId/calibrate`: Record calibration event
- `GET /api/inspections/sensors/:sensorId/calibrations`: Calibration history

### AI Endpoints
- `POST /api/ai/suggestions`: Get AI safety recommendations.
- `POST /api/ai/chat`: Streaming AI safety assistant.
- `GET /api/ai/status`: Check AI configuration status.

### Safety Endpoints
- `GET /api/safety/incidents`: List all incidents.
- `POST /api/safety/incidents`: Report a new incident.

## Database Tables

**Total Tables: 78**

### PHASE 1.2 Tables
- incidents, injury_reports, vehicle_incidents, property_incidents, near_misses

### PHASE 1.3 Tables
- investigations, rcca, bowtie_scenarios, bowtie_barriers, audit_trail

### PHASE 1.4 Tables
- capa_records, safety_controls, control_barriers, risk_control_links, capa_verifications

### PHASE 1.5 Tables
- training_courses, employee_training, training_assignments, training_matrix

### PHASE 1.6 Tables
- hazard_templates, risk_assessments, risk_register

### PHASE 1.7 Tables
- audit_templates, audits, audit_findings, compliance_requirements

### PHASE 1.8 Tables
- inspection_schedule, sensor_configurations, sensor_readings, sensor_calibrations

### PHASE 1.9 Tables
- report_templates, scheduled_reports

### PHASE 1.10 Tables
- projects, project_tasks, project_safety_metrics

### PHASE 1.11 Tables
- assets, asset_maintenance

### PHASE 1.12 Tables
- workers, worker_assignments, worker_performance

### PHASE 1.13 Tables
- approvals, leaderboard

### PHASE 1.14 Tables
- notifications, notification_preferences, notification_templates

### PHASE 1.15 Tables
- automation_rules, webhook_configs
- esg_metrics, sustainability_goals
- quality_non_conformities
- hygiene_assessments
- contractors, contractor_permits

### PHASE 1.16 Tables
- compliance_procedures, regulations, chemicals, sds_documents, toolbox_talks, toolbox_attendance

### PHASE 1.18 Tables
- permit_to_work, ptw_approvals, hazard_reports, safety_procedures, kpi_definitions, kpi_readings

### PHASE 1.17 Tables
- certifications, gap_analysis_reports, compliance_calendar, international_standards, nfpa_codes, safety_observations, sif_precursors

### Core Tables
- users, checklists, checklist_items, gamification_stats, kpi_metrics, compliance_alerts

## Integration Steps
1. **Enable Backend**: Backend running on http://localhost:8787
2. **Set Secrets**: Add `OPENROUTER_API_KEY` and `RESEND_API_KEY` to environment
3. **Database**: SQLite with local.sqlite (all tables initialized)
4. **Routes**: Modular route structure with auto-registration in index.ts
