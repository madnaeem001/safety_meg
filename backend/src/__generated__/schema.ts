import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// 1. Users Table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').unique().notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  role: text('role').notNull().default('worker'), // admin, manager, worker
  createdAt: integer('created_at').notNull().default(Date.now()),
});

// 2. Incidents Table - Fully Synced with Frontend (IncidentReporting.tsx)
export const incidents = sqliteTable('incidents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  // Basic Information
  incidentDate: text('incident_date').notNull(),
  incidentTime: text('incident_time').notNull(),
  location: text('location').notNull(),
  department: text('department'),
  industrySector: text('industry_sector'),
  incidentType: text('incident_type').notNull(),
  
  // Classification & Flags
  severity: text('severity').notNull().default('Medium'),
  regulatoryReportable: integer('regulatory_reportable', { mode: 'boolean' }).default(false),
  
  // Injury Details (Body Diagram data)
  bodyPartAffected: text('body_part_affected'), // JSON string of selected parts
  injuryType: text('injury_type'),
  
  // Content
  description: text('description').notNull(),
  immediateActions: text('immediate_actions'),
  witnesses: text('witnesses'),
  
  // AI Analysis Results (ISO 14001/OH&S)
  rootCauses: text('root_causes'),
  correctiveActions: text('corrective_actions'),
  
  // Assignment & Compliance
  assignedTo: text('assigned_to'), // From MOCK_TEAM select
  dueDate: text('due_date'),
  isoClause: text('iso_clause'), // ISO 9001 Clause selection
  selectedStandards: text('selected_standards'), // JSON string of selected international standard IDs

  // System Fields
  status: text('status').notNull().default('open'),
  reportedBy: integer('reported_by').references(() => users.id),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 3. Checklists Table
export const checklists = sqliteTable('checklists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'),
  items: text('items').notNull(), // JSON string of checklist items
  userId: integer('user_id').references(() => users.id),
  dueDate: text('due_date'),
  completionPercentage: integer('completion_percentage').default(0),
  status: text('status').notNull().default('active'),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 4. Checklist Items Table
export const checklistItems = sqliteTable('checklist_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  checklistId: integer('checklist_id').notNull().references(() => checklists.id),
  text: text('text').notNull(),
  completed: integer('completed', { mode: 'boolean' }).default(false),
  completedAt: integer('completed_at'),
  completedBy: integer('completed_by').references(() => users.id),
});

// 5. Gamification Stats Table
export const gamificationStats = sqliteTable('gamification_stats', {
  userId: integer('user_id').primaryKey().references(() => users.id),
  totalPoints: integer('total_points').default(0),
  badges: text('badges').default('[]'), // JSON string array
  level: integer('level').default(1),
  lastUpdated: integer('last_updated').notNull().default(Date.now()),
});

// 6. KPI Metrics Table
export const kpiMetrics = sqliteTable('kpi_metrics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  metricName: text('metric_name').notNull(),
  value: integer('value'),
  target: integer('target'),
  period: text('period'), // 'daily', 'weekly', 'monthly', 'yearly'
  unit: text('unit'),
  timestamp: integer('timestamp').notNull().default(Date.now()),
});

// 7. Compliance Alerts Table
export const complianceAlerts = sqliteTable('compliance_alerts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  alertType: text('alert_type').notNull(),
  message: text('message').notNull(),
  severity: text('severity').notNull(), // 'low', 'medium', 'high', 'critical'
  category: text('category'),
  createdAt: integer('created_at').notNull().default(Date.now()),
  isResolved: integer('is_resolved', { mode: 'boolean' }).default(false),
  resolvedAt: integer('resolved_at'),
});

// ============================================
// INCIDENT SUB-TYPE TABLES
// ============================================

// 8. Injury Reports Table
export const injuryReports = sqliteTable('injury_reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  incidentId: integer('incident_id').notNull().references(() => incidents.id),
  bodyPart: text('body_part').notNull(),
  injuryType: text('injury_type').notNull(),
  treatmentRequired: integer('treatment_required', { mode: 'boolean' }).default(false),
  medicalAttention: integer('medical_attention', { mode: 'boolean' }).default(false),
  daysLost: integer('days_lost').default(0),
  injurySeverity: text('injury_severity'),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 9. Vehicle Incidents Table
export const vehicleIncidents = sqliteTable('vehicle_incidents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  incidentId: integer('incident_id').notNull().references(() => incidents.id),
  vehicleId: text('vehicle_id'),
  driverName: text('driver_name'),
  vehicleType: text('vehicle_type'),
  damageLevel: text('damage_level'), // 'minor', 'moderate', 'severe'
  thirdPartyInvolved: integer('third_party_involved', { mode: 'boolean' }).default(false),
  insuranceClaim: integer('insurance_claim', { mode: 'boolean' }).default(false),
  claimNumber: text('claim_number'),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 10. Property Incidents Table
export const propertyIncidents = sqliteTable('property_incidents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  incidentId: integer('incident_id').notNull().references(() => incidents.id),
  assetId: text('asset_id'),
  assetName: text('asset_name'),
  damageDescription: text('damage_description'),
  damageEstimate: integer('damage_estimate'),
  repairRequired: integer('repair_required', { mode: 'boolean' }).default(false),
  estimatedRepairTime: text('estimated_repair_time'),
  environmentalImpact: integer('environmental_impact', { mode: 'boolean' }).default(false),
  businessInterruption: integer('business_interruption', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 11. Near Miss Reports Table
export const nearMisses = sqliteTable('near_misses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  incidentId: integer('incident_id').notNull().references(() => incidents.id),
  potentialSeverity: text('potential_severity'), // 'low', 'medium', 'high', 'critical'
  potentialConsequence: text('potential_consequence'),
  preventativeMeasure: text('preventative_measure'),
  likelihood: text('likelihood'), // 'rare', 'unlikely', 'possible', 'likely', 'almost_certain'
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// ============================================
// INVESTIGATION & ROOT CAUSE ANALYSIS TABLES
// ============================================

// 12. Investigations Table
export const investigations = sqliteTable('investigations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  incidentId: integer('incident_id').notNull().references(() => incidents.id),
  
  // Investigation Details
  investigationDate: text('investigation_date').notNull(),
  investigator: text('investigator').notNull(),
  industry: text('industry'),
  
  // Findings & Analysis
  findings: text('findings'),
  rootCauseAnalysis: text('root_cause_analysis'), // JSON array
  contributingFactors: text('contributing_factors'), // JSON array
  
  // Status & Compliance
  status: text('status').notNull().default('Open'), // 'Open', 'In Progress', 'Completed', 'Closed'
  isoClause: text('iso_clause'),
  regulatoryReportable: integer('regulatory_reportable', { mode: 'boolean' }).default(false),
  
  // System Fields
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 13. Root Cause & Corrective Action (RCCA) Table
export const rcca = sqliteTable('rcca', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  investigationId: integer('investigation_id').notNull().references(() => investigations.id),
  
  // 5 Whys Analysis & Fishbone
  rootCauses: text('root_causes'), // JSON array of root cause strings
  whyAnalysis: text('why_analysis'), // JSON: { why1: '', why2: '', etc }
  
  // Fishbone Diagram Categories
  fishboneFactors: text('fishbone_factors'), // JSON: { manpower: [], methods: [], etc }
  
  // Corrective Actions
  correctiveActions: text('corrective_actions'), // JSON array
  preventiveMeasures: text('preventive_measures'), // JSON array
  
  // Lessons Learned
  lessonsLearned: text('lessons_learned'), // JSON: { whatHappened: '', whyMatters: '', keyTakeaways: '', recommendations: '' }
  
  // Status
  status: text('status').notNull().default('Open'),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 14. Bow-Tie Analysis Scenarios Table
export const bowtieScenarios = sqliteTable('bowtie_scenarios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  investigationId: integer('investigation_id').references(() => investigations.id),
  
  // Scenario Details
  title: text('title').notNull(),
  topEvent: text('top_event').notNull(),
  hazard: text('hazard').notNull(),
  riskLevel: text('risk_level').notNull(), // 'low', 'medium', 'high', 'critical'
  
  // Threats & Consequences
  threats: text('threats'), // JSON array of threat objects
  consequences: text('consequences'), // JSON array of consequence objects
  
  // Status
  status: text('status').notNull().default('draft'), // 'draft', 'active', 'review', 'archived'
  owner: text('owner'),
  
  // System Fields
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 15. Bow-Tie Barriers Table (for threats & consequences)
export const bowtieBarriers = sqliteTable('bowtie_barriers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  scenarioId: integer('scenario_id').notNull().references(() => bowtieScenarios.id),
  
  // Barrier Details
  name: text('name').notNull(),
  type: text('type').notNull(), // 'engineering', 'administrative', 'ppe', 'procedural'
  effectiveness: integer('effectiveness'), // 0-100
  status: text('status').notNull(), // 'active', 'degraded', 'failed'
  
  // Categorization
  relatedToThreat: integer('related_to_threat', { mode: 'boolean' }).default(true), // true = preventive, false = mitigative
  
  // System Fields
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 16. Audit Trail Table
export const auditTrail = sqliteTable('audit_trail', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  investigationId: integer('investigation_id').notNull().references(() => investigations.id),
  
  // Event Details
  action: text('action').notNull(),
  details: text('details'),
  user: text('user').notNull(),
  
  // System Fields
  timestamp: integer('timestamp').notNull().default(Date.now()),
});

// ============================================
// CAPA & CONTROLS MANAGEMENT TABLES
// ============================================

// 17. CAPA Records Table
export const capaRecords = sqliteTable('capa_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  investigationId: integer('investigation_id').references(() => investigations.id),
  
  // CAPA Details
  title: text('title').notNull(),
  description: text('description').notNull(),
  capaType: text('capa_type').notNull(), // 'Corrective' or 'Preventive'
  
  // Classification
  priority: text('priority').notNull().default('Medium'), // 'Low', 'Medium', 'High', 'Critical'
  department: text('department'),
  riskArea: text('risk_area'), // the area/process this CAPA addresses
  
  // Details
  problemStatement: text('problem_statement'),
  rootCauseStatement: text('root_cause_statement'),
  containmentActions: text('containment_actions'), // JSON array
  
  // Implementation
  actionPlan: text('action_plan'), // JSON: {action, owner, dueDate, status}
  assignedTo: text('assigned_to'),
  dueDate: text('due_date'),
  completionDate: text('completion_date'),
  
  // Control Links
  linkedControls: text('linked_controls'), // JSON array of control IDs
  
  // Status & Verification
  status: text('status').notNull().default('Open'), // 'Open', 'In Progress', 'Completed', 'Verified', 'Closed'
  verificationDate: text('verification_date'),
  verificationResult: text('verification_result'), // 'Effective', 'Partially Effective', 'Ineffective'
  
  // System Fields
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 18. Safety Controls Table
export const safetyControls = sqliteTable('safety_controls', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  // Control Details
  name: text('name').notNull(),
  description: text('description'),
  controlType: text('control_type').notNull(), // 'elimination', 'substitution', 'engineering', 'administrative', 'ppe'
  hierarchyLevel: integer('hierarchy_level'), // 1-5 (elimination=1, ppe=5)
  
  // Hazard & Risk
  hazardId: text('hazard_id'),
  hazardDescription: text('hazard_description'),
  riskLevel: text('risk_level'), // 'low', 'medium', 'high', 'critical'
  
  // Effectiveness & Status
  designEffectiveness: integer('design_effectiveness'),  // 0-100
  actualEffectiveness: integer('actual_effectiveness'),  // 0-100 (from verification)
  status: text('status').notNull().default('active'), // 'active', 'degraded', 'failed', 'archived'
  
  // Implementation
  department: text('department'),
  owner: text('owner'),
  implementationDate: text('implementation_date'),
  lastVerificationDate: text('last_verification_date'),
  nextVerificationDate: text('next_verification_date'),
  
  // Regulatory
  regulatoryJustification: text('regulatory_justification'),
  isoClause: text('iso_clause'),
  osha: text('osha'), // OSHA reference
  
  // System Fields
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 19. Control Barriers Table (for Bow-Tie style analysis)
export const controlBarriers = sqliteTable('control_barriers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  controlId: integer('control_id').notNull().references(() => safetyControls.id),
  
  // Barrier Details
  name: text('name').notNull(),
  type: text('type').notNull(), // Same as control types
  effectiveness: integer('effectiveness').default(80), // 0-100
  status: text('status').notNull().default('active'),
  
  // Monitoring
  monitoringMethod: text('monitoring_method'),
  inspectionFrequency: text('inspection_frequency'), // 'daily', 'weekly', 'monthly', 'quarterly', 'annually'
  lastInspection: integer('last_inspection'),
  
  // System Fields
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 20. Risk-Control Linkage Table
export const riskControlLinks = sqliteTable('risk_control_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  // Risk Reference
  hazardId: text('hazard_id'),
  riskDescription: text('risk_description'),
  
  // Control Reference
  controlId: integer('control_id').notNull().references(() => safetyControls.id),
  
  // Relationship Details
  relationshipType: text('relationship_type'), // 'Primary', 'Secondary', 'Mitigating'
  riskReductionPotential: integer('risk_reduction_potential'), // 0-100 %
  
  // System Fields
  createdAt: integer('created_at').notNull().default(Date.now()),
});

// 21. CAPA Verification Records Table
export const capaVerifications = sqliteTable('capa_verifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  capaId: integer('capa_id').notNull().references(() => capaRecords.id),
  
  // Verification Details
  verificationDate: text('verification_date').notNull(),
  verifiedBy: text('verified_by').notNull(),
  
  // Results
  result: text('result').notNull(), // 'Effective', 'Partially Effective', 'Ineffective'
  findings: text('findings'),
  evidence: text('evidence'), // JSON array of evidence items
  
  // Follow-up
  additionalActionsRequired: integer('additional_actions_required', { mode: 'boolean' }).default(false),
  followUpActions: text('follow_up_actions'), // JSON array
  
  // System Fields
  createdAt: integer('created_at').notNull().default(Date.now()),
});

// ==================== PHASE 1.5: TRAINING & COMPETENCY MANAGEMENT ====================

// 22. Training Courses Catalog
export const trainingCourses = sqliteTable('training_courses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  // Course Identity
  courseCode: text('course_code').unique().notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(), // 'OSHA Required', 'EPA Compliance', 'MSHA Required', 'Industrial Hygiene', 'ISO Standards', 'Job Specific', 'Company Policy'
  description: text('description'),
  
  // Duration & Validity
  durationHours: integer('duration_hours').notNull().default(1),
  validityMonths: integer('validity_months').default(12), // 0 = one-time
  
  // Requirements
  requiredForRoles: text('required_for_roles'), // JSON array of role names
  regulatoryReference: text('regulatory_reference'),
  hazardTypes: text('hazard_types'), // JSON array
  
  // Content
  objectives: text('objectives'), // JSON array
  deliveryMethod: text('delivery_method').default('Classroom'), // 'Classroom', 'Online', 'OJT', 'Blended'
  assessmentRequired: integer('assessment_required', { mode: 'boolean' }).default(false),
  passingScore: integer('passing_score').default(80),
  
  // Status
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  
  // System Fields
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 23. Employee Training Records
export const employeeTraining = sqliteTable('employee_training', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  // Employee Info
  employeeId: text('employee_id').notNull(),
  employeeName: text('employee_name').notNull(),
  role: text('role').notNull(),
  department: text('department'),
  
  // Course Reference
  courseId: integer('course_id').references(() => trainingCourses.id),
  courseCode: text('course_code').notNull(),
  courseName: text('course_name').notNull(),
  
  // Completion Details
  completionDate: text('completion_date'),
  expirationDate: text('expiration_date'),
  status: text('status').notNull().default('Not Started'), // 'Current', 'Expiring Soon', 'Expired', 'Not Started'
  
  // Evidence & Scoring
  certificateId: text('certificate_id'),
  evidenceType: text('evidence_type'), // 'Certificate', 'Sign-off Sheet', 'Test Score', 'Photo Evidence'
  score: integer('score'), // 0-100
  
  // Trainer/Instructor
  instructorName: text('instructor_name'),
  trainingProvider: text('training_provider'),
  
  // Notes
  notes: text('notes'),
  
  // System Fields
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 24. Training Assignments (Required training per role/department)
export const trainingAssignments = sqliteTable('training_assignments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  // Target
  employeeId: text('employee_id').notNull(),
  courseId: integer('course_id').references(() => trainingCourses.id),
  courseCode: text('course_code').notNull(),
  
  // Assignment Details
  assignedBy: text('assigned_by').notNull(),
  assignedDate: text('assigned_date').notNull(),
  dueDate: text('due_date'),
  priority: text('priority').default('Normal'), // 'Low', 'Normal', 'High', 'Critical'
  reason: text('reason'), // Why assigned
  
  // Status
  status: text('status').default('Pending'), // 'Pending', 'In Progress', 'Completed', 'Overdue', 'Waived'
  completedDate: text('completed_date'),
  
  // System Fields
  createdAt: integer('created_at').notNull().default(Date.now()),
});

// 25. Training Matrix (Role requirements mapping)
export const trainingMatrix = sqliteTable('training_matrix', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  role: text('role').notNull(),
  courseId: integer('course_id').references(() => trainingCourses.id),
  courseCode: text('course_code').notNull(),
  isMandatory: integer('is_mandatory', { mode: 'boolean' }).default(true),
  daysToComplete: integer('days_to_complete').default(30),
  
  // System Fields
  createdAt: integer('created_at').notNull().default(Date.now()),
});

// ==================== PHASE 1.6: RISK ASSESSMENT ====================

// 26. Hazard Templates (Catalog of hazard types with suggested controls)
export const hazardTemplates = sqliteTable('hazard_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  // Identification
  hazardCode: text('hazard_code').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(), // Physical, Chemical, Biological, Ergonomic, Psychosocial, Mechanical, Electrical, Thermal, Radiation, Environmental
  description: text('description'),

  // Risk Defaults
  typicalSeverity: integer('typical_severity').default(3),     // 1-5
  typicalLikelihood: integer('typical_likelihood').default(3), // 1-5

  // Reference Data (stored as JSON)
  potentialConsequences: text('potential_consequences'),       // JSON string[]
  regulatoryReferences: text('regulatory_references'),         // JSON [{standard, citation}]
  suggestedControls: text('suggested_controls'),               // JSON ControlMeasure[]
  industrialHygieneFactors: text('industrial_hygiene_factors'), // JSON
  industries: text('industries'),                              // JSON string[]

  // System Fields
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 27. Risk Assessments (Full assessment records)
export const riskAssessments = sqliteTable('risk_assessments', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  // Reference
  hazardTemplateId: integer('hazard_template_id').references(() => hazardTemplates.id),
  hazardName: text('hazard_name').notNull(),
  hazardCategory: text('hazard_category').notNull(),

  // Context
  location: text('location').notNull(),
  department: text('department'),
  taskOrActivity: text('task_or_activity'),
  assessedBy: text('assessed_by').notNull(),
  assessmentDate: text('assessment_date').notNull(),
  reviewDate: text('review_date'),

  // Risk Scoring (before controls)
  severity: integer('severity').notNull(),        // 1-5
  likelihood: integer('likelihood').notNull(),    // 1-5
  riskScore: integer('risk_score').notNull(),      // severity * likelihood
  riskLevel: text('risk_level').notNull(),         // Low | Medium | High | Critical

  // Controls Applied (JSON array of ControlMeasure)
  controls: text('controls'),                     // JSON

  // Residual Risk (after controls)
  residualSeverity: integer('residual_severity'),
  residualLikelihood: integer('residual_likelihood'),
  residualRisk: integer('residual_risk'),
  residualRiskLevel: text('residual_risk_level'),

  // Additional
  description: text('description'),
  notes: text('notes'),
  status: text('status').notNull().default('Draft'), // Draft | Active | Under Review | Archived

  // System Fields
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 28. Risk Register (Simplified risk register for operational tracking)
export const riskRegister = sqliteTable('risk_register', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  // Identification
  riskCode: text('risk_code').notNull().unique(),    // e.g. R-001
  hazard: text('hazard').notNull(),
  consequence: text('consequence').notNull(),

  // Risk Scoring
  likelihood: integer('likelihood').notNull(),       // 1-5
  severity: integer('severity').notNull(),           // 1-5
  riskScore: integer('risk_score').notNull(),        // likelihood * severity
  riskLevel: text('risk_level').notNull(),           // Low | Medium | High | Critical

  // Control
  mitigation: text('mitigation'),
  controlType: text('control_type'),                 // Elimination | Substitution | Engineering | Administrative | PPE
  responsiblePerson: text('responsible_person'),
  targetDate: text('target_date'),

  // Status
  status: text('status').notNull().default('Open'), // Open | Mitigated | Closed | Monitoring

  // Links
  assessmentId: integer('assessment_id').references(() => riskAssessments.id),
  department: text('department'),
  location: text('location'),

  // System Fields
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// ==================== PHASE 1.7: AUDIT MANAGEMENT & COMPLIANCE ====================

// 29. Audit Templates (Reusable checklists per industry or type)
export const auditTemplates = sqliteTable('audit_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  name: text('name').notNull(),
  industry: text('industry'),       // Oil & Gas, Construction, Manufacturing, Healthcare, Mining, Utilities, Transportation
  auditType: text('audit_type').notNull(), // Safety, Environmental, Quality, Compliance, Process
  description: text('description'),
  categories: text('categories'),   // JSON string[]
  checklistItems: text('checklist_items'), // JSON [{category, question, required, regulatoryRef}]
  complianceReferences: text('compliance_references'), // JSON [{body, code, title}]
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  version: text('version').default('1.0'),

  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 30. Audits (Audit instances / scheduled or conducted audits)
export const audits = sqliteTable('audits', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  // Identity
  auditNumber: text('audit_number').notNull().unique(), // e.g. AUD-2026-001
  templateId: integer('template_id').references(() => auditTemplates.id),
  title: text('title').notNull(),
  auditType: text('audit_type').notNull(), // Safety | Environmental | Quality | Compliance | Process

  // Scope
  location: text('location').notNull(),
  department: text('department'),
  industry: text('industry'),

  // Scheduling
  scheduledDate: text('scheduled_date').notNull(),
  completedDate: text('completed_date'),
  dueDate: text('due_date'),

  // People
  leadAuditor: text('lead_auditor').notNull(),
  auditTeam: text('audit_team'),   // JSON string[]
  auditee: text('auditee'),

  // Results
  status: text('status').notNull().default('Scheduled'), // Scheduled | In Progress | Completed | Cancelled | Overdue
  overallScore: integer('overall_score'),   // 0-100
  totalItems: integer('total_items').default(0),
  passedItems: integer('passed_items').default(0),
  failedItems: integer('failed_items').default(0),
  naItems: integer('na_items').default(0),
  findings: text('findings'),       // JSON [{category, finding, severity, recommendation}]
  summary: text('summary'),
  nextAuditDate: text('next_audit_date'),

  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 31. Audit Findings (Individual findings from audits)
export const auditFindings = sqliteTable('audit_findings', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  auditId: integer('audit_id').notNull().references(() => audits.id),
  category: text('category').notNull(),
  finding: text('finding').notNull(),
  severity: text('severity').notNull(), // Critical | Major | Minor | Observation
  recommendation: text('recommendation'),
  responsiblePerson: text('responsible_person'),
  dueDate: text('due_date'),
  status: text('status').notNull().default('Open'), // Open | In Progress | Closed | Accepted Risk
  closedDate: text('closed_date'),
  closureNotes: text('closure_notes'),
  regulatoryRef: text('regulatory_ref'),

  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 32. Compliance Requirements (Standards compliance tracking)
export const complianceRequirements = sqliteTable('compliance_requirements', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  standardId: text('standard_id').notNull(),   // e.g. ISO-45001, OSHA-1910
  clauseId: text('clause_id').notNull(),        // e.g. 6.1.2
  requirement: text('requirement').notNull(),
  description: text('description'),
  status: text('status').notNull().default('not_started'), // not_started | in_progress | partially_compliant | compliant | non_compliant
  maturityLevel: text('maturity_level').default('none'),   // none | initial | managed | defined | measured | optimized
  evidence: text('evidence'),           // JSON string[]
  gaps: text('gaps'),                   // JSON string[]
  actionItems: text('action_items'),    // JSON string[]
  assignee: text('assignee'),
  dueDate: text('due_date'),
  lastAssessedDate: text('last_assessed_date'),
  notes: text('notes'),

  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 33. Inspection Schedule
export const inspectionSchedule = sqliteTable('inspection_schedule', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  title: text('title').notNull(),
  inspectionType: text('inspection_type').notNull(),   // swppp | stormwater | safety-audit | epa | sensor-check | permit
  description: text('description'),
  zone: text('zone'),
  location: text('location'),
  equipmentId: text('equipment_id'),

  assignedTo: text('assigned_to'),
  assigneeEmail: text('assignee_email'),

  recurrence: text('recurrence').notNull().default('once'),  // once | daily | weekly | biweekly | monthly | quarterly | annual
  scheduledDate: text('scheduled_date').notNull(),
  scheduledTime: text('scheduled_time'),
  duration: integer('duration').default(60),
  completedDate: text('completed_date'),
  completedTime: text('completed_time'),

  status: text('status').notNull().default('scheduled'), // scheduled | in_progress | completed | overdue | cancelled
  priority: text('priority').notNull().default('medium'), // low | medium | high | critical
  result: text('result'),                    // pass | fail | partial
  checklist: text('checklist'),              // JSON [{item, completed}]
  notes: text('notes'),
  findings: text('findings'),                // JSON string[]
  nextScheduledDate: text('next_scheduled_date'),
  notificationSent: integer('notification_sent').default(0),
  reminderSent: integer('reminder_sent').default(0),

  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 34. Sensor Configurations
export const sensorConfigurations = sqliteTable('sensor_configurations', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  sensorId: text('sensor_id').notNull().unique(),
  name: text('name').notNull(),
  sensorType: text('sensor_type').notNull(),   // temperature | gas | humidity | noise | flame | motion
  location: text('location').notNull(),
  zone: text('zone'),

  unit: text('unit'),
  minThreshold: real('min_threshold'),
  maxThreshold: real('max_threshold'),
  status: text('status').notNull().default('normal'), // normal | warning | critical | offline | maintenance
  alertsEnabled: integer('alerts_enabled').default(1),
  thresholds: text('thresholds'),     // JSON
  positionX: real('position_x'),
  positionY: real('position_y'),

  mountedSince: text('mounted_since'),
  calibrationDue: text('calibration_due'),
  lastCalibrated: text('last_calibrated'),
  manufacturer: text('manufacturer'),
  modelNumber: text('model_number'),
  serialNumber: text('serial_number'),

  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 35. Sensor Readings
export const sensorReadings = sqliteTable('sensor_readings', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  sensorId: text('sensor_id').notNull(),
  value: real('value').notNull(),
  unit: text('unit'),
  status: text('status').notNull().default('normal'),  // normal | warning | critical
  anomalyDetected: integer('anomaly_detected').default(0),
  notes: text('notes'),

  recordedAt: integer('recorded_at').notNull().default(Date.now()),
});

// 36. Sensor Calibrations
export const sensorCalibrations = sqliteTable('sensor_calibrations', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  sensorId: text('sensor_id').notNull(),
  calibrationDate: text('calibration_date').notNull(),
  calibratedBy: text('calibrated_by').notNull(),
  certificateId: text('certificate_id'),
  passedCalibration: integer('passed_calibration').default(1),
  deviationFound: text('deviation_found'),
  correctionApplied: text('correction_applied'),
  nextCalibrationDue: text('next_calibration_due'),
  notes: text('notes'),

  createdAt: integer('created_at').notNull().default(Date.now()),
});

// 37. Report Templates
export const reportTemplates = sqliteTable('report_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  name: text('name').notNull(),
  type: text('type').notNull(), // incident|safety|compliance|training|kpi|audit|custom
  description: text('description'),
  sections: text('sections'), // JSON array of section configs
  filters: text('filters'),   // JSON default filters
  format: text('format').default('pdf'),  // pdf|csv|excel
  isDefault: integer('is_default').default(0),
  isSystem: integer('is_system').default(0),
  createdBy: text('created_by'),

  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 38. Scheduled Reports
export const scheduledReports = sqliteTable('scheduled_reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  templateId: integer('template_id'),
  name: text('name').notNull(),
  frequency: text('frequency').notNull(), // daily|weekly|monthly|quarterly
  nextGenerationDate: text('next_generation_date'),
  lastGeneratedAt: integer('last_generated_at'),
  recipients: text('recipients'), // JSON array of email strings
  format: text('format').default('pdf'),
  status: text('status').default('active'), // active|paused

  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 39. Projects
export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectCode: text('project_code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').default('planning'), // planning|active|on_hold|completed|cancelled
  startDate: text('start_date'),
  endDate: text('end_date'),
  projectManager: text('project_manager'),
  budget: real('budget'),
  safetyBudget: real('safety_budget'),
  safetyOfficer: text('safety_officer'),
  location: text('location'),
  criticality: text('criticality').default('medium'), // low|medium|high|critical
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 40. Project Tasks
export const projectTasks = sqliteTable('project_tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  assignedTo: text('assigned_to'),
  startDate: text('start_date'),
  dueDate: text('due_date'),
  completedDate: text('completed_date'),
  status: text('status').default('todo'), // todo|in_progress|completed|blocked
  priority: text('priority').default('medium'), // low|medium|high|critical
  safetyRelated: integer('safety_related').default(0),
  progress: integer('progress').default(0), // 0-100
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 41. Project Safety Metrics
export const projectSafetyMetrics = sqliteTable('project_safety_metrics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull().unique(),
  safetyScore: real('safety_score'),
  incidents: integer('incidents').default(0),
  nearMisses: integer('near_misses').default(0),
  auditsPassed: integer('audits_passed').default(0),
  trainingCompliancePercentage: real('training_compliance_percentage'),
  lastUpdated: text('last_updated'),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 42. Assets
export const assets = sqliteTable('assets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  assetCode: text('asset_code').notNull().unique(),
  assetName: text('asset_name').notNull(),
  assetType: text('asset_type'), // Machine|Vehicle|Tool|Safety Equipment|Infrastructure
  serialNumber: text('serial_number'),
  qrCode: text('qr_code').unique(),
  location: text('location'),
  department: text('department'),
  manufacturer: text('manufacturer'),
  model: text('model'),
  purchaseDate: text('purchase_date'),
  lastMaintenanceDate: text('last_maintenance_date'),
  nextMaintenanceDue: text('next_maintenance_due'),
  condition: text('condition').default('good'), // excellent|good|fair|poor|critical
  status: text('status').default('active'), // active|maintenance|decommissioned
  owner: text('owner'),
  notes: text('notes'),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 43. Asset Maintenance
export const assetMaintenance = sqliteTable('asset_maintenance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  assetId: integer('asset_id').notNull(),
  maintenanceDate: text('maintenance_date').notNull(),
  maintenanceType: text('maintenance_type').notNull(), // preventive|corrective|emergency|inspection
  performedBy: text('performed_by'),
  notes: text('notes'),
  cost: real('cost'),
  nextDueDate: text('next_due_date'),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 44. Workers / Employees
export const workers = sqliteTable('workers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: text('employee_id').unique(),       // e.g. EMP-0001
  name: text('name').notNull(),
  email: text('email').unique(),
  phone: text('phone'),
  department: text('department'),
  role: text('role'),                             // supervisor|worker|manager|safety_officer
  jobTitle: text('job_title'),
  managerId: integer('manager_id'),
  hireDate: text('hire_date'),
  status: text('status').default('active'),       // active|inactive|on_leave
  lastTrainingDate: text('last_training_date'),
  certifications: text('certifications'),         // JSON array
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 45. Worker Assignments
export const workerAssignments = sqliteTable('worker_assignments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workerId: integer('worker_id').notNull(),
  taskType: text('task_type').notNull(),          // project_task|inspection|audit|training
  taskId: integer('task_id'),
  taskTitle: text('task_title'),
  assignedBy: integer('assigned_by'),
  assignmentDate: text('assignment_date').notNull(),
  dueDate: text('due_date'),
  completionDate: text('completion_date'),
  status: text('status').default('pending'),      // pending|in_progress|completed|cancelled
  notes: text('notes'),
  createdAt: integer('created_at').notNull().default(Date.now()),
});

// 46. Worker Performance
export const workerPerformance = sqliteTable('worker_performance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workerId: integer('worker_id').notNull().unique(),
  safetyScore: real('safety_score').default(100),
  trainingCompletionRate: real('training_completion_rate').default(0),
  incidentsReported: integer('incidents_reported').default(0),
  incidentsFreedays: integer('incidents_free_days').default(0),
  certificationsCount: integer('certifications_count').default(0),
  lastReviewDate: text('last_review_date'),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 47. Supervisor Approvals
export const approvals = sqliteTable('approvals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(),                   // incident|training|permit|capa|leave
  title: text('title').notNull(),
  description: text('description'),
  requestedBy: integer('requested_by'),
  requestedByName: text('requested_by_name'),
  assignedTo: integer('assigned_to'),
  status: text('status').default('pending'),      // pending|approved|rejected
  approvedBy: integer('approved_by'),
  approvedByName: text('approved_by_name'),
  approvalDate: text('approval_date'),
  comment: text('comment'),
  priority: text('priority').default('medium'),   // low|medium|high|critical
  relatedId: integer('related_id'),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 49. Notifications
export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id'),                        // optional — null = system/broadcast
  type: text('type').notNull(),                   // incident|training|audit|inspection|capa|system|broadcast
  title: text('title').notNull(),
  message: text('message').notNull(),
  severity: text('severity').default('info'),     // info|warning|critical|success
  readStatus: integer('read_status').default(0),  // 0=unread 1=read
  actionUrl: text('action_url'),
  metadata: text('metadata'),                     // JSON for extra context
  createdAt: integer('created_at').notNull().default(Date.now()),
});

// 50. Notification Preferences
export const notificationPreferences = sqliteTable('notification_preferences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().unique(),
  emailNotifications: integer('email_notifications').default(1),
  smsNotifications: integer('sms_notifications').default(0),
  inAppNotifications: integer('in_app_notifications').default(1),
  preferences: text('preferences'),               // JSON: per-type toggles
  quietHours: text('quiet_hours'),                // JSON: { start: HH:MM, end: HH:MM }
  frequency: text('frequency').default('immediate'), // immediate|daily|weekly
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 51. Notification Templates
export const notificationTemplates = sqliteTable('notification_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull().unique(),          // incident|training|audit|...
  subject: text('subject').notNull(),
  template: text('template').notNull(),           // JSON: { title, message } with {variable} placeholders
  variables: text('variables'),                   // JSON array of variable names
  isActive: integer('is_active').default(1),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 48. Safety Leaderboard
export const leaderboard = sqliteTable('leaderboard', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workerId: integer('worker_id').notNull().unique(),
  workerName: text('worker_name'),
  department: text('department'),
  safetyPoints: integer('safety_points').default(0),
  rank: integer('rank').default(0),
  incidentsFreedays: integer('incidents_free_days').default(0),
  trainingScore: real('training_score').default(0),
  certificationsCount: integer('certifications_count').default(0),
  badges: text('badges').default('[]'),           // JSON array
  period: text('period').default('monthly'),      // weekly|monthly|quarterly|annual
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 52. Automation Rules
export const automationRules = sqliteTable('automation_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  triggerCondition: text('trigger_condition').notNull(), // JSON: {type, field, operator, value}
  action: text('action').notNull(),                      // JSON: {type, target, payload}
  active: integer('active').default(1),
  createdBy: text('created_by'),
  executionCount: integer('execution_count').default(0),
  lastTriggered: integer('last_triggered'),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 53. Webhook Configurations
export const webhookConfigs = sqliteTable('webhook_configs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  events: text('events').notNull(),    // JSON array: ['incident.created', 'capa.closed', ...]
  active: integer('active').default(1),
  secret: text('secret'),              // HMAC signing secret
  lastDelivery: integer('last_delivery'),
  failureCount: integer('failure_count').default(0),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 54. ESG Metrics
export const esgMetrics = sqliteTable('esg_metrics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  category: text('category').notNull(), // environmental|social|governance
  metric: text('metric').notNull(),
  value: real('value').notNull(),
  unit: text('unit'),
  period: text('period'),               // e.g. '2026-Q1', '2026-03'
  notes: text('notes'),
  recordedBy: text('recorded_by'),
  recordedAt: integer('recorded_at').notNull().default(Date.now()),
});

// 55. Sustainability Goals
export const sustainabilityGoals = sqliteTable('sustainability_goals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  category: text('category').notNull(), // carbon|water|waste|energy|diversity|safety
  goal: text('goal').notNull(),
  target: real('target').notNull(),
  current: real('current').default(0),
  unit: text('unit'),
  deadline: text('deadline'),
  status: text('status').default('active'), // active|achieved|missed|paused
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 56. Quality Non-Conformities
export const qualityNonConformities = sqliteTable('quality_non_conformities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(),           // product|process|supplier|customer|internal
  description: text('description').notNull(),
  severity: text('severity').default('minor'), // minor|major|critical
  location: text('location'),
  department: text('department'),
  detectedBy: text('detected_by'),
  detectedAt: integer('detected_at').notNull().default(Date.now()),
  correctiveAction: text('corrective_action'),
  status: text('status').default('open'), // open|in-progress|closed|verified
  closedAt: integer('closed_at'),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 57. Hygiene Assessments
export const hygieneAssessments = sqliteTable('hygiene_assessments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  hazardType: text('hazard_type').notNull(), // chemical|physical|biological|ergonomic|noise|radiation
  location: text('location').notNull(),
  department: text('department'),
  exposureLevel: text('exposure_level'),     // low|medium|high|extreme
  controlMeasures: text('control_measures'), // JSON array
  assessedBy: text('assessed_by'),
  assessedAt: integer('assessed_at').notNull().default(Date.now()),
  nextReviewDate: text('next_review_date'),
  status: text('status').default('active'),  // active|resolved|requires-action
  createdAt: integer('created_at').notNull().default(Date.now()),
});

// 58. Contractors
export const contractors = sqliteTable('contractors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  company: text('company').notNull(),
  email: text('email'),
  phone: text('phone'),
  specialty: text('specialty'),
  status: text('status').default('active'), // active|inactive|suspended
  contractStart: text('contract_start'),
  contractEnd: text('contract_end'),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 59. Contractor Permits
export const contractorPermits = sqliteTable('contractor_permits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  contractorId: integer('contractor_id').notNull(),
  permitType: text('permit_type').notNull(), // hot-work|confined-space|electrical|excavation|general|height-work
  issuedBy: text('issued_by'),
  issuedAt: integer('issued_at').notNull().default(Date.now()),
  expiresAt: integer('expires_at'),
  status: text('status').default('active'), // active|expired|revoked
  conditions: text('conditions'),           // JSON array of conditions
  createdAt: integer('created_at').notNull().default(Date.now()),
});

// =====================================================================
// PHASE 1.16: COMPLIANCE PROCEDURES, REGULATIONS, CHEMICALS, TOOLBOX
// =====================================================================

// 60. Compliance Procedures
export const complianceProcedures = sqliteTable('compliance_procedures', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),              // safety|environmental|health|quality|regulatory
  regulation: text('regulation'),          // e.g. OSHA 1910.147, ISO 45001
  version: text('version').default('1.0'),
  status: text('status').default('active'), // active|draft|archived|under-review
  owner: text('owner'),
  approvedBy: text('approved_by'),
  effectiveDate: text('effective_date'),
  reviewDate: text('review_date'),
  document: text('document'),              // document content or URL
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 61. Regulations
export const regulations = sqliteTable('regulations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  jurisdiction: text('jurisdiction'),      // federal|state|international|local
  category: text('category'),              // safety|environmental|health|work-hours|fire
  description: text('description'),
  requirements: text('requirements'),      // JSON array of requirement strings
  applicableSectors: text('applicable_sectors'), // JSON array of sectors
  effectiveDate: text('effective_date'),
  lastUpdated: integer('last_updated').notNull().default(Date.now()),
  source: text('source'),
  isMandatory: integer('is_mandatory').default(1),
  createdAt: integer('created_at').notNull().default(Date.now()),
});

// 62. Chemicals
export const chemicals = sqliteTable('chemicals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  casNumber: text('cas_number'),
  manufacturer: text('manufacturer'),
  storageLocation: text('storage_location'),
  hazardClass: text('hazard_class'),       // flammable|toxic|corrosive|oxidizer|explosive|inert|radioactive
  signalWord: text('signal_word'),         // Danger|Warning
  quantity: real('quantity'),
  unit: text('unit').default('kg'),
  expiryDate: text('expiry_date'),
  sdsUploadDate: integer('sds_upload_date'),
  lastReviewed: integer('last_reviewed'),
  status: text('status').default('active'), // active|disposed|transferred
  notes: text('notes'),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// 63. SDS Documents
export const sdsDocuments = sqliteTable('sds_documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  chemicalId: integer('chemical_id').notNull(),
  sdsFileUrl: text('sds_file_url'),
  uploadDate: integer('upload_date').notNull().default(Date.now()),
  revision: text('revision').default('1'),
  hazardSummary: text('hazard_summary'),   // JSON object
  ppRequirements: text('pp_requirements'),
  firstAidMeasures: text('first_aid_measures'),
  storageHandling: text('storage_handling'),
  disposalMethods: text('disposal_methods'),
  uploadedBy: text('uploaded_by'),
  createdAt: integer('created_at').notNull().default(Date.now()),
});

// 64. Toolbox Talks
export const toolboxTalks = sqliteTable('toolbox_talks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  topic: text('topic').notNull(),          // safety|health|environment|emergency|general
  description: text('description'),
  duration: integer('duration'),           // minutes
  conductor: text('conductor'),
  conductedDate: integer('conducted_date').notNull().default(Date.now()),
  location: text('location'),
  department: text('department'),
  keyPoints: text('key_points'),           // JSON array
  attachments: text('attachments'),        // JSON array of file URLs
  status: text('status').default('completed'), // scheduled|completed|cancelled
  createdAt: integer('created_at').notNull().default(Date.now()),
});

// 65. Toolbox Attendance
export const toolboxAttendance = sqliteTable('toolbox_attendance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  talkId: integer('talk_id').notNull(),
  employeeName: text('employee_name').notNull(),
  employeeId: text('employee_id'),
  department: text('department'),
  signature: integer('signature').default(0),
  attendedAt: integer('attended_at').notNull().default(Date.now()),
});

// =====================================================
// PHASE 1.17: CERTIFICATIONS, COMPLIANCE CALENDAR, STANDARDS, BBS
// =====================================================

// TABLE 66: STANDALONE CERTIFICATION TRACKER
export const certifications = sqliteTable('certifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workerName: text('worker_name').notNull(),
  workerId: integer('worker_id'),
  certificationName: text('certification_name').notNull(),
  issuingBody: text('issuing_body'),
  certificationNumber: text('certification_number'),
  issueDate: text('issue_date'),
  expiryDate: text('expiry_date'),
  renewalDate: text('renewal_date'),
  status: text('status').notNull().default('active'), // active|expired|suspended|pending-renewal
  category: text('category'), // safety|health|environment|technical|first-aid
  attachmentUrl: text('attachment_url'),
  notes: text('notes'),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// TABLE 67: COMPLIANCE GAP ANALYSIS REPORTS
export const gapAnalysisReports = sqliteTable('gap_analysis_reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  evaluationDate: text('evaluation_date'),
  standard: text('standard'), // ISO45001|OSHA|EPA|NFPA|WHO|ISO14001|ISO9001|local
  evaluatedBy: text('evaluated_by'),
  findings: text('findings'), // JSON array
  riskLevel: text('risk_level'), // low|medium|high|critical
  status: text('status').notNull().default('draft'), // draft|in-progress|completed
  actionItems: text('action_items'), // JSON array
  complianceRate: real('compliance_rate'), // 0-100
  notes: text('notes'),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// TABLE 68: COMPLIANCE CALENDAR EVENTS
export const complianceCalendar = sqliteTable('compliance_calendar', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  eventType: text('event_type').notNull(), // audit|inspection|certification-renewal|regulation-deadline|review|training|reporting
  dueDate: text('due_date').notNull(),
  assignedTo: text('assigned_to'),
  department: text('department'),
  status: text('status').notNull().default('upcoming'), // upcoming|overdue|completed|cancelled
  priority: text('priority').notNull().default('medium'), // low|medium|high|critical
  description: text('description'),
  relatedItem: text('related_item'),
  completedAt: integer('completed_at'),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// TABLE 69: INTERNATIONAL STANDARDS
export const internationalStandards = sqliteTable('international_standards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  standardCode: text('standard_code').notNull(), // e.g. ISO45001
  standardName: text('standard_name').notNull(),
  version: text('version'),
  issuer: text('issuer'), // ISO|IEC|ANSI|BSI|AS|other
  category: text('category'), // health-safety|environment|quality|information-security|fire|other
  description: text('description'),
  clauses: text('clauses'), // JSON array of {number, title, description}
  applicableSectors: text('applicable_sectors'), // JSON array
  certificationRequired: integer('certification_required').default(0),
  validFrom: text('valid_from'),
  lastUpdated: integer('last_updated').notNull().default(Date.now()),
});

// TABLE 70: NFPA CODES
export const nfpaCodes = sqliteTable('nfpa_codes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  codeNumber: text('code_number').notNull(), // e.g. NFPA 70
  title: text('title').notNull(),
  edition: text('edition'),
  category: text('category'), // electrical|fire-protection|life-safety|hazardous-materials|processes|other
  hazardLevel: text('hazard_level'), // low|medium|high|critical
  description: text('description'),
  requirements: text('requirements'), // JSON array
  applicableIndustries: text('applicable_industries'), // JSON array
  effectiveDate: text('effective_date'),
  lastUpdated: integer('last_updated').notNull().default(Date.now()),
});

// TABLE 71: BEHAVIOR-BASED SAFETY OBSERVATIONS
export const safetyObservations = sqliteTable('safety_observations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  observerName: text('observer_name').notNull(),
  observerId: text('observer_id'),
  observedEmployee: text('observed_employee'),
  observedArea: text('observed_area'),
  department: text('department'),
  observationDate: text('observation_date').notNull(),
  behaviorType: text('behavior_type').notNull(), // safe|at-risk|unsafe
  category: text('category'), // ppe|housekeeping|procedures|ergonomics|equipment|environmental|other
  description: text('description').notNull(),
  actionTaken: text('action_taken'),
  followUpRequired: integer('follow_up_required').default(0),
  followUpDate: text('follow_up_date'),
  status: text('status').notNull().default('open'), // open|closed|in-review
  safetyScore: integer('safety_score'), // 1-10
  notes: text('notes'),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// TABLE 72: SIF PRECURSORS (Serious Injury & Fatality)
export const sifPrecursors = sqliteTable('sif_precursors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  precursorType: text('precursor_type'), // energized-equipment|fall-from-height|confined-space|struck-by|vehicle|chemical-exposure|explosion|other
  severity: text('severity'), // potential-sif|critical|high|medium
  frequency: text('frequency'), // daily|weekly|monthly|rarely
  department: text('department'),
  location: text('location'),
  associatedHazards: text('associated_hazards'), // JSON array
  mitigationActions: text('mitigation_actions'), // JSON array
  status: text('status').notNull().default('active'), // active|mitigated|monitoring
  alertTriggered: integer('alert_triggered').default(0),
  lastReviewDate: text('last_review_date'),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// Table 73: permit_to_work
export const permitToWork = sqliteTable('permit_to_work', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  permitNumber: text('permit_number').notNull().unique(),
  permitType: text('permit_type').notNull(), // hot-work|confined-space|working-at-height|electrical|excavation|general
  title: text('title').notNull(),
  location: text('location').notNull(),
  workArea: text('work_area'),
  description: text('description'),
  riskLevel: text('risk_level').default('medium'), // low|medium|high|critical
  status: text('status').notNull().default('draft'), // draft|pending-approval|approved|active|completed|cancelled|expired
  requestedBy: text('requested_by'),
  approvedBy: text('approved_by'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  actualStart: text('actual_start'),
  actualEnd: text('actual_end'),
  ppeRequired: text('ppe_required'), // JSON array
  precautions: text('precautions'), // JSON array
  emergencyProcedure: text('emergency_procedure'),
  iotSensorIds: text('iot_sensor_ids'), // JSON array
  department: text('department'),
  contractorId: integer('contractor_id'),
  notes: text('notes'),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// Table 74: ptw_approvals
export const ptwApprovals = sqliteTable('ptw_approvals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  permitId: integer('permit_id').notNull(),
  approverName: text('approver_name').notNull(),
  approverRole: text('approver_role'),
  status: text('status').notNull().default('pending'), // pending|approved|rejected
  comments: text('comments'),
  approvedAt: integer('approved_at'),
  createdAt: integer('created_at').notNull().default(Date.now()),
});

// Table 75: hazard_reports
export const hazardReports = sqliteTable('hazard_reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reportNumber: text('report_number').notNull().unique(),
  hazardType: text('hazard_type').notNull(), // slip-trip-fall|electrical|chemical|machinery|ergonomic|fire|confined-space|other
  location: text('location').notNull(),
  description: text('description').notNull(),
  severity: text('severity').notNull(), // low|medium|high|critical
  status: text('status').notNull().default('draft'), // draft|submitted|under-review|resolved|closed
  reportedBy: text('reported_by'),
  voiceTranscript: text('voice_transcript'),
  department: text('department'),
  incidentId: integer('incident_id'),
  resolutionNotes: text('resolution_notes'),
  resolvedAt: integer('resolved_at'),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// Table 76: safety_procedures
export const safetyProcedures = sqliteTable('safety_procedures', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  procedureNumber: text('procedure_number').notNull().unique(),
  title: text('title').notNull(),
  category: text('category').notNull(), // emergency|operational|maintenance|chemical|electrical|confined-space|ppe|fire|general
  description: text('description'),
  steps: text('steps'), // JSON array of {stepNumber, title, description, warning}
  applicableRoles: text('applicable_roles'), // JSON array
  department: text('department'),
  riskLevel: text('risk_level').default('medium'),
  revision: text('revision').default('1.0'),
  status: text('status').notNull().default('active'), // active|draft|archived|under-review
  approvedBy: text('approved_by'),
  effectiveDate: text('effective_date'),
  reviewDate: text('review_date'),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// Table 77: kpi_definitions
export const kpiDefinitions = sqliteTable('kpi_definitions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(), // leading|lagging
  unit: text('unit'), // observations|%|hours|count|rate|days
  target: real('target'),
  warningThreshold: real('warning_threshold'),
  criticalThreshold: real('critical_threshold'),
  frequency: text('frequency').default('monthly'), // daily|weekly|monthly|quarterly|annual
  department: text('department'),
  isActive: integer('is_active').default(1),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// Table 78: kpi_readings
export const kpiReadings = sqliteTable('kpi_readings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kpiId: integer('kpi_id').notNull(),
  value: real('value').notNull(),
  period: text('period').notNull(), // e.g. "2026-03" monthly, "2026-W10" weekly
  recordedBy: text('recorded_by'),
  notes: text('notes'),
  createdAt: integer('created_at').notNull().default(Date.now()),
});

// Table 79: sds_equipment (AdvancedTechnologyHub QR/Barcode Scanner)
export const sdsEquipment = sqliteTable('sds_equipment', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  serialNumber: text('serial_number').notNull(),
  barcode: text('barcode'),
  qrCode: text('qr_code'),
  location: text('location').notNull(),
  department: text('department').notNull().default(''),
  lastInspection: text('last_inspection'),
  nextInspection: text('next_inspection'),
  status: text('status').notNull().default('operational'), // operational|maintenance_due|out_of_service
  linkedSDS: text('linked_sds').default('[]'),             // JSON array of SDS IDs
  riskScore: integer('risk_score').default(0),
  manufacturer: text('manufacturer').default(''),
  model: text('model').default(''),
  purchaseDate: text('purchase_date'),
  warrantyExpiry: text('warranty_expiry'),
  maintenanceHistory: text('maintenance_history').default('[]'), // JSON array
  pendingSync: integer('pending_sync', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at').notNull().default(Date.now()),
  updatedAt: integer('updated_at').notNull().default(Date.now()),
});

// Table 80: geotags (AdvancedTechnologyHub Geotagging)
export const geotags = sqliteTable('geotags', {
  id: text('id').primaryKey().notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  accuracy: real('accuracy').notNull(),
  altitude: real('altitude'),
  zone: text('zone'),
  facilityArea: text('facility_area'),
  address: text('address'),
  recordType: text('record_type').notNull().default('manual'), // incident|observation|inspection|hazard|near_miss|manual
  linkedRecordId: text('linked_record_id'),
  linkedRecordType: text('linked_record_type'),
  notes: text('notes'),
  capturedBy: text('captured_by').notNull().default('system'),
  syncStatus: text('sync_status').notNull().default('synced'), // pending|synced|error
  timestamp: text('timestamp').notNull(),
  capturedAt: text('captured_at').notNull(),
  createdAt: integer('created_at').notNull().default(Date.now()),
});

// Table 81: facility_zones (AdvancedTechnologyHub Geotagging zones)
export const facilityZones = sqliteTable('facility_zones', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  polygon: text('polygon').notNull().default('[]'), // JSON array of {lat, lng}
  riskLevel: text('risk_level').notNull().default('low'), // low|medium|high|critical
  department: text('department').notNull().default(''),
  requiresPPE: text('requires_ppe').default('[]'),  // JSON array
  hazardTypes: text('hazard_types').default('[]'),   // JSON array
  createdAt: integer('created_at').notNull().default(Date.now()),
});
