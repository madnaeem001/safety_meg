import Database from 'better-sqlite3';

/**
 * Initialize database tables
 * Run this once to create all necessary tables for Phase 1
 */

// LOGIC FIX: Explicitly point to the writable volume in Railway
const isProd = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const dbPath = isProd ? '/app/data/local.sqlite' : 'local.sqlite';

const sqlite = new Database(dbPath);

const initSQL = `
-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'worker',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_date TEXT NOT NULL,
  incident_time TEXT NOT NULL,
  location TEXT NOT NULL,
  department TEXT,
  industry_sector TEXT,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'Medium',
  regulatory_reportable INTEGER DEFAULT 0,
  body_part_affected TEXT,
  injury_type TEXT,
  description TEXT NOT NULL,
  immediate_actions TEXT,
  witnesses TEXT,
  root_causes TEXT,
  corrective_actions TEXT,
  assigned_to TEXT,
  due_date TEXT,
  iso_clause TEXT,
  selected_standards TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  reported_by INTEGER REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Checklists Table
CREATE TABLE IF NOT EXISTS checklists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  items TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id),
  due_date TEXT,
  completion_percentage INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Checklist Items Table
CREATE TABLE IF NOT EXISTS checklist_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  checklist_id INTEGER NOT NULL REFERENCES checklists(id),
  text TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  completed_at INTEGER,
  completed_by INTEGER REFERENCES users(id)
);

-- Gamification Stats Table
CREATE TABLE IF NOT EXISTS gamification_stats (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  total_points INTEGER DEFAULT 0,
  badges TEXT DEFAULT '[]',
  level INTEGER DEFAULT 1,
  last_updated INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- KPI Metrics Table
CREATE TABLE IF NOT EXISTS kpi_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_name TEXT NOT NULL,
  value INTEGER,
  target INTEGER,
  period TEXT,
  unit TEXT,
  timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Compliance Alerts Table
CREATE TABLE IF NOT EXISTS compliance_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL,
  category TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  is_resolved INTEGER DEFAULT 0,
  resolved_at INTEGER
);

-- ============================================
-- INCIDENT SUB-TYPE TABLES
-- ============================================

-- Injury Reports Table
CREATE TABLE IF NOT EXISTS injury_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL REFERENCES incidents(id),
  body_part TEXT NOT NULL,
  injury_type TEXT NOT NULL,
  treatment_required INTEGER DEFAULT 0,
  medical_attention INTEGER DEFAULT 0,
  days_lost INTEGER DEFAULT 0,
  injury_severity TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Vehicle Incidents Table
CREATE TABLE IF NOT EXISTS vehicle_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL REFERENCES incidents(id),
  vehicle_id TEXT,
  driver_name TEXT,
  vehicle_type TEXT,
  damage_level TEXT,
  third_party_involved INTEGER DEFAULT 0,
  insurance_claim INTEGER DEFAULT 0,
  claim_number TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Property Incidents Table
CREATE TABLE IF NOT EXISTS property_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL REFERENCES incidents(id),
  asset_id TEXT,
  asset_name TEXT,
  damage_description TEXT,
  damage_estimate INTEGER,
  repair_required INTEGER DEFAULT 0,
  estimated_repair_time TEXT,
  environmental_impact INTEGER DEFAULT 0,
  business_interruption INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Near Miss Reports Table
CREATE TABLE IF NOT EXISTS near_misses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL REFERENCES incidents(id),
  potential_severity TEXT,
  potential_consequence TEXT,
  preventative_measure TEXT,
  likelihood TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Investigations Table
CREATE TABLE IF NOT EXISTS investigations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL REFERENCES incidents(id),
  investigation_date TEXT NOT NULL,
  investigator TEXT NOT NULL,
  industry TEXT,
  findings TEXT,
  root_cause_analysis TEXT,
  contributing_factors TEXT,
  status TEXT NOT NULL DEFAULT 'Open',
  iso_clause TEXT,
  regulatory_reportable INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Root Cause & Corrective Action (RCCA) Table
CREATE TABLE IF NOT EXISTS rcca (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investigation_id INTEGER NOT NULL REFERENCES investigations(id),
  root_causes TEXT,
  why_analysis TEXT,
  fishbone_factors TEXT,
  corrective_actions TEXT,
  preventive_measures TEXT,
  lessons_learned TEXT,
  status TEXT NOT NULL DEFAULT 'Open',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Bow-Tie Analysis Scenarios Table
CREATE TABLE IF NOT EXISTS bowtie_scenarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investigation_id INTEGER REFERENCES investigations(id),
  title TEXT NOT NULL,
  top_event TEXT NOT NULL,
  hazard TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  threats TEXT,
  consequences TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  owner TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Bow-Tie Barriers Table
CREATE TABLE IF NOT EXISTS bowtie_barriers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_id INTEGER NOT NULL REFERENCES bowtie_scenarios(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  effectiveness INTEGER,
  status TEXT NOT NULL,
  related_to_threat INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Audit Trail Table
CREATE TABLE IF NOT EXISTS audit_trail (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investigation_id INTEGER NOT NULL REFERENCES investigations(id),
  action TEXT NOT NULL,
  details TEXT,
  user TEXT NOT NULL,
  timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Create indexes for incident sub-types
CREATE INDEX IF NOT EXISTS idx_injury_reports_incident ON injury_reports(incident_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_incidents_incident ON vehicle_incidents(incident_id);
CREATE INDEX IF NOT EXISTS idx_property_incidents_incident ON property_incidents(incident_id);
CREATE INDEX IF NOT EXISTS idx_near_misses_incident ON near_misses(incident_id);

-- Create indexes for investigations
CREATE INDEX IF NOT EXISTS idx_investigations_incident ON investigations(incident_id);
CREATE INDEX IF NOT EXISTS idx_investigations_status ON investigations(status);
CREATE INDEX IF NOT EXISTS idx_rcca_investigation ON rcca(investigation_id);
CREATE INDEX IF NOT EXISTS idx_bowtie_scenarios_investigation ON bowtie_scenarios(investigation_id);
CREATE INDEX IF NOT EXISTS idx_bowtie_barriers_scenario ON bowtie_barriers(scenario_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_investigation ON audit_trail(investigation_id);

-- CAPA & Controls Management Tables
CREATE TABLE IF NOT EXISTS capa_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investigation_id INTEGER REFERENCES investigations(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  capa_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium',
  department TEXT,
  risk_area TEXT,
  problem_statement TEXT,
  root_cause_statement TEXT,
  containment_actions TEXT,
  action_plan TEXT,
  assigned_to TEXT,
  due_date TEXT,
  completion_date TEXT,
  linked_controls TEXT,
  status TEXT NOT NULL DEFAULT 'Open',
  verification_date TEXT,
  verification_result TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS safety_controls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  control_type TEXT NOT NULL,
  hierarchy_level INTEGER,
  hazard_id TEXT,
  hazard_description TEXT,
  risk_level TEXT,
  design_effectiveness INTEGER,
  actual_effectiveness INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  department TEXT,
  owner TEXT,
  implementation_date TEXT,
  last_verification_date TEXT,
  next_verification_date TEXT,
  regulatory_justification TEXT,
  iso_clause TEXT,
  osha TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS control_barriers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  control_id INTEGER NOT NULL REFERENCES safety_controls(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  effectiveness INTEGER DEFAULT 80,
  status TEXT NOT NULL DEFAULT 'active',
  monitoring_method TEXT,
  inspection_frequency TEXT,
  last_inspection INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS risk_control_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hazard_id TEXT,
  risk_description TEXT,
  control_id INTEGER NOT NULL REFERENCES safety_controls(id),
  relationship_type TEXT,
  risk_reduction_potential INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS capa_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  capa_id INTEGER NOT NULL REFERENCES capa_records(id),
  verification_date TEXT NOT NULL,
  verified_by TEXT NOT NULL,
  result TEXT NOT NULL,
  findings TEXT,
  evidence TEXT,
  additional_actions_required INTEGER DEFAULT 0,
  follow_up_actions TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Create indexes for CAPA management
CREATE INDEX IF NOT EXISTS idx_capa_records_investigation ON capa_records(investigation_id);
CREATE INDEX IF NOT EXISTS idx_capa_records_status ON capa_records(status);
CREATE INDEX IF NOT EXISTS idx_capa_records_priority ON capa_records(priority);
CREATE INDEX IF NOT EXISTS idx_safety_controls_type ON safety_controls(control_type);
CREATE INDEX IF NOT EXISTS idx_safety_controls_status ON safety_controls(status);
CREATE INDEX IF NOT EXISTS idx_control_barriers_control ON control_barriers(control_id);
CREATE INDEX IF NOT EXISTS idx_risk_control_links_control ON risk_control_links(control_id);
CREATE INDEX IF NOT EXISTS idx_capa_verifications_capa ON capa_verifications(capa_id);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_checklists_user_id ON checklists(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_resolved ON compliance_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_timestamp ON kpi_metrics(timestamp);

-- ==================== PHASE 1.5: TRAINING & COMPETENCY MANAGEMENT ====================

CREATE TABLE IF NOT EXISTS training_courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  duration_hours INTEGER NOT NULL DEFAULT 1,
  validity_months INTEGER DEFAULT 12,
  required_for_roles TEXT,
  regulatory_reference TEXT,
  hazard_types TEXT,
  objectives TEXT,
  delivery_method TEXT DEFAULT 'Classroom',
  assessment_required INTEGER DEFAULT 0,
  passing_score INTEGER DEFAULT 80,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS employee_training (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT,
  course_id INTEGER REFERENCES training_courses(id),
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  completion_date TEXT,
  expiration_date TEXT,
  status TEXT NOT NULL DEFAULT 'Not Started',
  certificate_id TEXT,
  evidence_type TEXT,
  score INTEGER,
  instructor_name TEXT,
  training_provider TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS training_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT NOT NULL,
  course_id INTEGER REFERENCES training_courses(id),
  course_code TEXT NOT NULL,
  assigned_by TEXT NOT NULL,
  assigned_date TEXT NOT NULL,
  due_date TEXT,
  priority TEXT DEFAULT 'Normal',
  reason TEXT,
  status TEXT DEFAULT 'Pending',
  completed_date TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS training_matrix (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,
  course_id INTEGER REFERENCES training_courses(id),
  course_code TEXT NOT NULL,
  is_mandatory INTEGER DEFAULT 1,
  days_to_complete INTEGER DEFAULT 30,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Indexes for Training tables
CREATE INDEX IF NOT EXISTS idx_employee_training_employee ON employee_training(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_training_status ON employee_training(status);
CREATE INDEX IF NOT EXISTS idx_employee_training_course ON employee_training(course_id);
CREATE INDEX IF NOT EXISTS idx_employee_training_expiration ON employee_training(expiration_date);
CREATE INDEX IF NOT EXISTS idx_training_assignments_employee ON training_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_assignments_status ON training_assignments(status);
CREATE INDEX IF NOT EXISTS idx_training_matrix_role ON training_matrix(role);
CREATE INDEX IF NOT EXISTS idx_training_courses_category ON training_courses(category);

-- ==================== PHASE 1.6: RISK ASSESSMENT ====================

CREATE TABLE IF NOT EXISTS hazard_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hazard_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  typical_severity INTEGER DEFAULT 3,
  typical_likelihood INTEGER DEFAULT 3,
  potential_consequences TEXT,
  regulatory_references TEXT,
  suggested_controls TEXT,
  industrial_hygiene_factors TEXT,
  industries TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS risk_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hazard_template_id INTEGER REFERENCES hazard_templates(id),
  hazard_name TEXT NOT NULL,
  hazard_category TEXT NOT NULL,
  location TEXT NOT NULL,
  department TEXT,
  task_or_activity TEXT,
  assessed_by TEXT NOT NULL,
  assessment_date TEXT NOT NULL,
  review_date TEXT,
  severity INTEGER NOT NULL,
  likelihood INTEGER NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  controls TEXT,
  residual_severity INTEGER,
  residual_likelihood INTEGER,
  residual_risk INTEGER,
  residual_risk_level TEXT,
  description TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS risk_register (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_code TEXT NOT NULL UNIQUE,
  hazard TEXT NOT NULL,
  consequence TEXT NOT NULL,
  likelihood INTEGER NOT NULL,
  severity INTEGER NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  mitigation TEXT,
  control_type TEXT,
  responsible_person TEXT,
  target_date TEXT,
  status TEXT NOT NULL DEFAULT 'Open',
  assessment_id INTEGER REFERENCES risk_assessments(id),
  department TEXT,
  location TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_status ON risk_assessments(status);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_level ON risk_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_date ON risk_assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_risk_register_status ON risk_register(status);
CREATE INDEX IF NOT EXISTS idx_risk_register_level ON risk_register(risk_level);
CREATE INDEX IF NOT EXISTS idx_hazard_templates_category ON hazard_templates(category);

-- ==================== PHASE 1.7: AUDIT MANAGEMENT & COMPLIANCE ====================

CREATE TABLE IF NOT EXISTS audit_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  industry TEXT,
  audit_type TEXT NOT NULL,
  description TEXT,
  categories TEXT,
  checklist_items TEXT,
  compliance_references TEXT,
  is_active INTEGER DEFAULT 1,
  version TEXT DEFAULT '1.0',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_number TEXT NOT NULL UNIQUE,
  template_id INTEGER REFERENCES audit_templates(id),
  title TEXT NOT NULL,
  audit_type TEXT NOT NULL,
  location TEXT NOT NULL,
  department TEXT,
  industry TEXT,
  scheduled_date TEXT NOT NULL,
  completed_date TEXT,
  due_date TEXT,
  lead_auditor TEXT NOT NULL,
  audit_team TEXT,
  auditee TEXT,
  status TEXT NOT NULL DEFAULT 'Scheduled',
  overall_score INTEGER,
  total_items INTEGER DEFAULT 0,
  passed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  na_items INTEGER DEFAULT 0,
  findings TEXT,
  summary TEXT,
  next_audit_date TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS audit_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_id INTEGER NOT NULL REFERENCES audits(id),
  category TEXT NOT NULL,
  finding TEXT NOT NULL,
  severity TEXT NOT NULL,
  recommendation TEXT,
  responsible_person TEXT,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'Open',
  closed_date TEXT,
  closure_notes TEXT,
  regulatory_ref TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS compliance_requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  standard_id TEXT NOT NULL,
  clause_id TEXT NOT NULL,
  requirement TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  maturity_level TEXT DEFAULT 'none',
  evidence TEXT,
  gaps TEXT,
  action_items TEXT,
  assignee TEXT,
  due_date TEXT,
  last_assessed_date TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);
CREATE INDEX IF NOT EXISTS idx_audits_type ON audits(audit_type);
CREATE INDEX IF NOT EXISTS idx_audits_date ON audits(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_audit_findings_audit ON audit_findings(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_findings_status ON audit_findings(status);
CREATE INDEX IF NOT EXISTS idx_audit_findings_severity ON audit_findings(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_standard ON compliance_requirements(standard_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_requirements(status);

-- ============================================================
-- PHASE 1.8: Inspection Scheduling & Sensor Management
-- ============================================================

CREATE TABLE IF NOT EXISTS inspection_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  inspection_type TEXT NOT NULL,
  description TEXT,
  zone TEXT,
  location TEXT,
  equipment_id TEXT,
  assigned_to TEXT,
  assignee_email TEXT,
  recurrence TEXT NOT NULL DEFAULT 'once',
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT,
  duration INTEGER DEFAULT 60,
  completed_date TEXT,
  completed_time TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  priority TEXT NOT NULL DEFAULT 'medium',
  result TEXT,
  checklist TEXT,
  notes TEXT,
  findings TEXT,
  next_scheduled_date TEXT,
  notification_sent INTEGER DEFAULT 0,
  reminder_sent INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS sensor_configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sensor_type TEXT NOT NULL,
  location TEXT NOT NULL,
  zone TEXT,
  unit TEXT,
  min_threshold REAL,
  max_threshold REAL,
  status TEXT NOT NULL DEFAULT 'normal',
  alerts_enabled INTEGER DEFAULT 1,
  thresholds TEXT,
  position_x REAL,
  position_y REAL,
  mounted_since TEXT,
  calibration_due TEXT,
  last_calibrated TEXT,
  manufacturer TEXT,
  model_number TEXT,
  serial_number TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS sensor_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_id TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT,
  status TEXT NOT NULL DEFAULT 'normal',
  anomaly_detected INTEGER DEFAULT 0,
  notes TEXT,
  recorded_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS sensor_calibrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_id TEXT NOT NULL,
  calibration_date TEXT NOT NULL,
  calibrated_by TEXT NOT NULL,
  certificate_id TEXT,
  passed_calibration INTEGER DEFAULT 1,
  deviation_found TEXT,
  correction_applied TEXT,
  next_calibration_due TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_inspection_status ON inspection_schedule(status);
CREATE INDEX IF NOT EXISTS idx_inspection_type ON inspection_schedule(inspection_type);
CREATE INDEX IF NOT EXISTS idx_inspection_date ON inspection_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_id ON sensor_readings(sensor_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_time ON sensor_readings(recorded_at);
CREATE INDEX IF NOT EXISTS idx_sensor_calibrations_id ON sensor_calibrations(sensor_id);

CREATE TABLE IF NOT EXISTS report_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom',
  description TEXT,
  sections TEXT,
  filters TEXT,
  format TEXT DEFAULT 'pdf',
  is_default INTEGER DEFAULT 0,
  is_system INTEGER DEFAULT 0,
  created_by TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS scheduled_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  next_generation_date TEXT,
  last_generated_at INTEGER,
  recipients TEXT,
  format TEXT DEFAULT 'pdf',
  status TEXT DEFAULT 'active',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_report_templates_type ON report_templates(type);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_status ON scheduled_reports(status);

CREATE TABLE IF NOT EXISTS compliance_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'internal',
  frequency TEXT NOT NULL DEFAULT 'monthly',
  last_generated TEXT,
  next_due TEXT,
  status TEXT NOT NULL DEFAULT 'current',
  recipients TEXT,
  format TEXT DEFAULT 'pdf',
  automation_enabled INTEGER DEFAULT 0,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS compliance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Safety',
  current_value REAL NOT NULL DEFAULT 0,
  target_value REAL NOT NULL DEFAULT 100,
  unit TEXT DEFAULT '',
  trend TEXT NOT NULL DEFAULT 'stable',
  trend_value REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'compliant',
  last_updated TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_type ON compliance_reports(type);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_status ON compliance_reports(status);
CREATE INDEX IF NOT EXISTS idx_compliance_metrics_status ON compliance_metrics(status);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning',
  start_date TEXT,
  end_date TEXT,
  project_manager TEXT,
  budget REAL,
  safety_budget REAL,
  safety_officer TEXT,
  location TEXT,
  criticality TEXT DEFAULT 'medium',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS project_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  start_date TEXT,
  due_date TEXT,
  completed_date TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  safety_related INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS project_safety_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL UNIQUE,
  safety_score REAL,
  incidents INTEGER DEFAULT 0,
  near_misses INTEGER DEFAULT 0,
  audits_passed INTEGER DEFAULT 0,
  training_compliance_percentage REAL,
  last_updated TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_code TEXT NOT NULL UNIQUE,
  asset_name TEXT NOT NULL,
  asset_type TEXT,
  serial_number TEXT,
  qr_code TEXT UNIQUE,
  location TEXT,
  department TEXT,
  manufacturer TEXT,
  model TEXT,
  purchase_date TEXT,
  last_maintenance_date TEXT,
  next_maintenance_due TEXT,
  condition TEXT DEFAULT 'good',
  status TEXT DEFAULT 'active',
  owner TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS asset_maintenance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  maintenance_date TEXT NOT NULL,
  maintenance_type TEXT NOT NULL,
  performed_by TEXT,
  notes TEXT,
  cost REAL,
  next_due_date TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);

CREATE TABLE IF NOT EXISTS project_sprints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  goal TEXT,
  status TEXT NOT NULL DEFAULT 'future',
  project_id INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS project_epics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  summary TEXT,
  color TEXT DEFAULT '#6366f1',
  status TEXT NOT NULL DEFAULT 'todo',
  project_id INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS sprint_retrospectives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sprint_id TEXT NOT NULL UNIQUE,
  facilitator TEXT,
  date TEXT,
  participants TEXT NOT NULL DEFAULT '[]',
  summary TEXT,
  sentiment_happy INTEGER NOT NULL DEFAULT 0,
  sentiment_neutral INTEGER NOT NULL DEFAULT 0,
  sentiment_sad INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS sprint_retro_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  retro_id INTEGER NOT NULL REFERENCES sprint_retrospectives(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'went_well',
  content TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Anonymous',
  votes INTEGER NOT NULL DEFAULT 0,
  is_actionable INTEGER NOT NULL DEFAULT 0,
  assignee TEXT,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks(project_id);

CREATE TABLE IF NOT EXISTS task_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  author TEXT NOT NULL DEFAULT 'Current User',
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);

CREATE TABLE IF NOT EXISTS sprint_velocity_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  sprint_label TEXT NOT NULL,
  committed INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  carryover INTEGER NOT NULL DEFAULT 0,
  recorded_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_velocity_history_project ON sprint_velocity_history(project_id);
CREATE INDEX IF NOT EXISTS idx_project_sprints_status ON project_sprints(status);
CREATE INDEX IF NOT EXISTS idx_project_epics_status ON project_epics(status);
CREATE INDEX IF NOT EXISTS idx_sprint_retros_sprint ON sprint_retrospectives(sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprint_retro_items_retro ON sprint_retro_items(retro_id);

CREATE TABLE IF NOT EXISTS sprint_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  default_duration INTEGER NOT NULL DEFAULT 14,
  working_days TEXT NOT NULL DEFAULT '["monday","tuesday","wednesday","thursday","friday"]',
  sprint_start_day TEXT NOT NULL DEFAULT 'monday',
  velocity_target INTEGER NOT NULL DEFAULT 40,
  max_capacity INTEGER NOT NULL DEFAULT 50,
  buffer_percentage INTEGER NOT NULL DEFAULT 20,
  auto_start_enabled INTEGER NOT NULL DEFAULT 1,
  notifications TEXT NOT NULL DEFAULT '{"sprintStart":true,"sprintEnd":true,"capacityWarning":true,"dailyStandup":false}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_sprint_settings_project ON sprint_settings(project_id);

CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_asset ON asset_maintenance(asset_id);

CREATE TABLE IF NOT EXISTS workers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  department TEXT,
  role TEXT,
  job_title TEXT,
  manager_id INTEGER,
  hire_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_training_date TEXT,
  certifications TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS worker_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL,
  task_type TEXT NOT NULL,
  task_id INTEGER,
  task_title TEXT,
  assigned_by INTEGER,
  assignment_date TEXT NOT NULL,
  due_date TEXT,
  completion_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (worker_id) REFERENCES workers(id)
);

CREATE TABLE IF NOT EXISTS worker_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL UNIQUE,
  safety_score REAL DEFAULT 100,
  training_completion_rate REAL DEFAULT 0,
  incidents_reported INTEGER DEFAULT 0,
  incidents_free_days INTEGER DEFAULT 0,
  certifications_count INTEGER DEFAULT 0,
  last_review_date TEXT,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (worker_id) REFERENCES workers(id)
);

CREATE TABLE IF NOT EXISTS approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  requested_by INTEGER,
  requested_by_name TEXT,
  assigned_to INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by INTEGER,
  approved_by_name TEXT,
  approval_date TEXT,
  comment TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  related_id INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL UNIQUE,
  worker_name TEXT,
  department TEXT,
  safety_points INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  incidents_free_days INTEGER DEFAULT 0,
  training_score REAL DEFAULT 0,
  certifications_count INTEGER DEFAULT 0,
  badges TEXT DEFAULT '[]',
  period TEXT DEFAULT 'monthly',
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (worker_id) REFERENCES workers(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  read_status INTEGER NOT NULL DEFAULT 0,
  action_url TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  email_notifications INTEGER NOT NULL DEFAULT 1,
  sms_notifications INTEGER NOT NULL DEFAULT 0,
  in_app_notifications INTEGER NOT NULL DEFAULT 1,
  preferences TEXT,
  quiet_hours TEXT,
  frequency TEXT NOT NULL DEFAULT 'immediate',
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS notification_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  template TEXT NOT NULL,
  variables TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- =====================================================
-- PHASE 1.15: ADVANCED FEATURES
-- =====================================================

-- 52. Automation Rules
CREATE TABLE IF NOT EXISTS automation_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  trigger_condition TEXT NOT NULL,
  action TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_triggered INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- 53. Webhook Configurations
CREATE TABLE IF NOT EXISTS webhook_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  secret TEXT,
  last_delivery INTEGER,
  failure_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- 54. ESG Metrics
CREATE TABLE IF NOT EXISTS esg_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  metric TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT,
  period TEXT,
  notes TEXT,
  recorded_by TEXT,
  recorded_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- 55. Sustainability Goals
CREATE TABLE IF NOT EXISTS sustainability_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  goal TEXT NOT NULL,
  target REAL NOT NULL,
  current REAL NOT NULL DEFAULT 0,
  unit TEXT,
  deadline TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- 56. Quality Non-Conformities
CREATE TABLE IF NOT EXISTS quality_non_conformities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'minor',
  location TEXT,
  department TEXT,
  detected_by TEXT,
  detected_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  corrective_action TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  closed_at INTEGER,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- 57. Hygiene Assessments
CREATE TABLE IF NOT EXISTS hygiene_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  hazard_type TEXT NOT NULL,
  location TEXT NOT NULL,
  department TEXT,
  exposure_level TEXT,
  control_measures TEXT,
  assessed_by TEXT,
  assessed_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  next_review_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- 58. Contractors
CREATE TABLE IF NOT EXISTS contractors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  specialty TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  contract_start TEXT,
  contract_end TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- 59. Contractor Permits
CREATE TABLE IF NOT EXISTS contractor_permits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contractor_id INTEGER NOT NULL,
  permit_type TEXT NOT NULL,
  issued_by TEXT,
  issued_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  expires_at INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  conditions TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_workers_department ON workers(department);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);
CREATE INDEX IF NOT EXISTS idx_worker_assignments_worker ON worker_assignments(worker_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON leaderboard(safety_points DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read_status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(active);

-- 53b. Automation Events (history log)
CREATE TABLE IF NOT EXISTS automation_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_id INTEGER NOT NULL,
  rule_name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  details TEXT,
  recipient TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (rule_id) REFERENCES automation_rules(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_automation_events_rule ON automation_events(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_events_created ON automation_events(created_at);

CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhook_configs(active);
CREATE INDEX IF NOT EXISTS idx_esg_metrics_category ON esg_metrics(category);
CREATE INDEX IF NOT EXISTS idx_esg_metrics_period ON esg_metrics(period);
CREATE INDEX IF NOT EXISTS idx_sustainability_goals_status ON sustainability_goals(status);
CREATE INDEX IF NOT EXISTS idx_quality_nc_status ON quality_non_conformities(status);
CREATE INDEX IF NOT EXISTS idx_quality_nc_severity ON quality_non_conformities(severity);
CREATE INDEX IF NOT EXISTS idx_hygiene_hazard_type ON hygiene_assessments(hazard_type);
CREATE INDEX IF NOT EXISTS idx_hygiene_status ON hygiene_assessments(status);
CREATE INDEX IF NOT EXISTS idx_contractors_status ON contractors(status);
CREATE INDEX IF NOT EXISTS idx_contractor_permits_contractor ON contractor_permits(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_permits_status ON contractor_permits(status);

-- PHASE 1.16: COMPLIANCE PROCEDURES, REGULATIONS, CHEMICALS, TOOLBOX
CREATE TABLE IF NOT EXISTS compliance_procedures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  regulation TEXT,
  version TEXT NOT NULL DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'active',
  owner TEXT,
  approved_by TEXT,
  effective_date TEXT,
  review_date TEXT,
  document TEXT,
  industries TEXT NOT NULL DEFAULT '[]',
  iso_clause TEXT,
  steps TEXT NOT NULL DEFAULT '[]',
  ai_risk_score INTEGER NOT NULL DEFAULT 50,
  ai_risk_level TEXT NOT NULL DEFAULT 'Medium',
  ai_risk_rationale TEXT NOT NULL DEFAULT '',
  ai_risk_last_analyzed TEXT NOT NULL DEFAULT '',
  ai_risk_trending TEXT NOT NULL DEFAULT 'stable',
  audit_trail TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS regulations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  jurisdiction TEXT,
  category TEXT,
  description TEXT,
  requirements TEXT,
  applicable_sectors TEXT,
  effective_date TEXT,
  last_updated INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  source TEXT,
  is_mandatory INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS chemicals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cas_number TEXT,
  manufacturer TEXT,
  storage_location TEXT,
  hazard_class TEXT,
  signal_word TEXT,
  quantity REAL,
  unit TEXT NOT NULL DEFAULT 'kg',
  expiry_date TEXT,
  sds_upload_date INTEGER,
  last_reviewed INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  hazards TEXT NOT NULL DEFAULT '[]',
  pictograms TEXT NOT NULL DEFAULT '[]',
  ghs_classification TEXT NOT NULL DEFAULT '[]',
  emergency_contact TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS sds_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chemical_id INTEGER NOT NULL,
  sds_file_url TEXT,
  upload_date INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  revision TEXT NOT NULL DEFAULT '1',
  hazard_summary TEXT,
  pp_requirements TEXT,
  first_aid_measures TEXT,
  storage_handling TEXT,
  disposal_methods TEXT,
  uploaded_by TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY(chemical_id) REFERENCES chemicals(id)
);

CREATE TABLE IF NOT EXISTS toolbox_talks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  duration INTEGER,
  conductor TEXT,
  conducted_date INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  location TEXT,
  department TEXT,
  key_points TEXT,
  attachments TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS toolbox_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  talk_id INTEGER NOT NULL,
  employee_name TEXT NOT NULL,
  employee_id TEXT,
  department TEXT,
  signature INTEGER NOT NULL DEFAULT 0,
  attended_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY(talk_id) REFERENCES toolbox_talks(id)
);

CREATE INDEX IF NOT EXISTS idx_compliance_proc_status ON compliance_procedures(status);
CREATE INDEX IF NOT EXISTS idx_compliance_proc_category ON compliance_procedures(category);
CREATE INDEX IF NOT EXISTS idx_regulations_jurisdiction ON regulations(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_regulations_category ON regulations(category);
CREATE INDEX IF NOT EXISTS idx_chemicals_status ON chemicals(status);
CREATE INDEX IF NOT EXISTS idx_chemicals_hazard ON chemicals(hazard_class);
CREATE INDEX IF NOT EXISTS idx_sds_chemical ON sds_documents(chemical_id);
CREATE INDEX IF NOT EXISTS idx_toolbox_status ON toolbox_talks(status);
CREATE INDEX IF NOT EXISTS idx_toolbox_dept ON toolbox_talks(department);
CREATE INDEX IF NOT EXISTS idx_toolbox_attendance_talk ON toolbox_attendance(talk_id);

-- PHASE 1.17: CERTIFICATIONS, COMPLIANCE CALENDAR, STANDARDS, BBS, SIF
CREATE TABLE IF NOT EXISTS certifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_name TEXT NOT NULL,
  worker_id INTEGER,
  certification_name TEXT NOT NULL,
  issuing_body TEXT,
  certification_number TEXT,
  issue_date TEXT,
  expiry_date TEXT,
  renewal_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  category TEXT,
  attachment_url TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS gap_analysis_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  standard_id TEXT,
  standard TEXT,
  clause_id TEXT,
  requirement TEXT,
  current_state TEXT,
  desired_state TEXT,
  gap_description TEXT,
  severity TEXT,
  impact TEXT,
  remediation TEXT,
  effort TEXT,
  priority_order INTEGER,
  owner TEXT,
  target_date TEXT,
  evaluation_date TEXT,
  evaluated_by TEXT,
  findings TEXT,
  risk_level TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  action_items TEXT,
  compliance_rate REAL,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS compliance_calendar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL,
  due_date TEXT NOT NULL,
  assigned_to TEXT,
  department TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming',
  priority TEXT NOT NULL DEFAULT 'medium',
  description TEXT,
  regulation TEXT,
  related_item TEXT,
  completed_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS international_standards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  standard_code TEXT NOT NULL,
  standard_name TEXT NOT NULL,
  version TEXT,
  issuer TEXT,
  category TEXT,
  description TEXT,
  clauses TEXT,
  applicable_sectors TEXT,
  certification_required INTEGER NOT NULL DEFAULT 0,
  valid_from TEXT,
  last_updated INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS standard_relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_standard_id TEXT NOT NULL,
  target_standard_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  mapped_clauses TEXT NOT NULL DEFAULT '[]',
  integration_notes TEXT NOT NULL DEFAULT '',
  synergies TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_stdrel_type ON standard_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_stdrel_source ON standard_relationships(source_standard_id);
CREATE INDEX IF NOT EXISTS idx_stdrel_target ON standard_relationships(target_standard_id);

CREATE TABLE IF NOT EXISTS nfpa_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code_number TEXT NOT NULL,
  title TEXT NOT NULL,
  edition TEXT,
  category TEXT,
  hazard_level TEXT,
  description TEXT,
  requirements TEXT,
  applicable_industries TEXT,
  effective_date TEXT,
  last_updated INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS safety_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  observer_name TEXT NOT NULL,
  observer_id TEXT,
  observed_employee TEXT,
  observed_area TEXT,
  department TEXT,
  observation_date TEXT NOT NULL,
  behavior_type TEXT NOT NULL,
  category TEXT,
  description TEXT NOT NULL,
  action_taken TEXT,
  follow_up_required INTEGER NOT NULL DEFAULT 0,
  follow_up_date TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  safety_score INTEGER,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS sif_precursors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  precursor_type TEXT,
  severity TEXT,
  frequency TEXT,
  department TEXT,
  location TEXT,
  associated_hazards TEXT,
  mitigation_actions TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  alert_triggered INTEGER NOT NULL DEFAULT 0,
  last_review_date TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_cert_status ON certifications(status);
CREATE INDEX IF NOT EXISTS idx_cert_worker ON certifications(worker_id);
CREATE INDEX IF NOT EXISTS idx_cert_expiry ON certifications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_gap_status ON gap_analysis_reports(status);
CREATE INDEX IF NOT EXISTS idx_gap_standard ON gap_analysis_reports(standard);
CREATE INDEX IF NOT EXISTS idx_cal_status ON compliance_calendar(status);
CREATE INDEX IF NOT EXISTS idx_cal_due ON compliance_calendar(due_date);
CREATE INDEX IF NOT EXISTS idx_cal_dept ON compliance_calendar(department);
CREATE INDEX IF NOT EXISTS idx_std_code ON international_standards(standard_code);
CREATE INDEX IF NOT EXISTS idx_std_category ON international_standards(category);
CREATE INDEX IF NOT EXISTS idx_nfpa_category ON nfpa_codes(category);
CREATE INDEX IF NOT EXISTS idx_obs_behavior ON safety_observations(behavior_type);
CREATE INDEX IF NOT EXISTS idx_obs_dept ON safety_observations(department);
CREATE INDEX IF NOT EXISTS idx_obs_status ON safety_observations(status);
CREATE INDEX IF NOT EXISTS idx_sif_severity ON sif_precursors(severity);
CREATE INDEX IF NOT EXISTS idx_sif_status ON sif_precursors(status);

-- PHASE 1.18: STANDARD CERTIFICATIONS (ISO / regulatory org-level certifications)
CREATE TABLE IF NOT EXISTS standard_certifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  standard_id TEXT NOT NULL,
  standard_code TEXT NOT NULL,
  standard_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_certified',
  certification_body TEXT,
  certificate_number TEXT,
  initial_cert_date TEXT,
  expiry_date TEXT,
  last_surveillance_date TEXT,
  next_surveillance_date TEXT,
  scope TEXT NOT NULL DEFAULT '[]',
  locations TEXT NOT NULL DEFAULT '[]',
  overall_score INTEGER,
  clause_scores TEXT NOT NULL DEFAULT '[]',
  non_conformities TEXT NOT NULL DEFAULT '[]',
  audit_history TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_stdcert_status ON standard_certifications(status);
CREATE INDEX IF NOT EXISTS idx_stdcert_standard_id ON standard_certifications(standard_id);

-- PHASE 1.19: CUSTOM CHECKLISTS (ChecklistBuilder page)
CREATE TABLE IF NOT EXISTS custom_checklists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  industry TEXT NOT NULL DEFAULT 'Manufacturing',
  categories TEXT NOT NULL DEFAULT '[]',
  items TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_custom_checklists_industry ON custom_checklists(industry);

-- PHASE 1.21: CUSTOM APPS (CustomAppBuilder page)
CREATE TABLE IF NOT EXISTS custom_apps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  elements TEXT NOT NULL DEFAULT '[]',
  device_preference TEXT NOT NULL DEFAULT 'mobile',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  deployed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_custom_apps_status ON custom_apps(status);

CREATE TABLE IF NOT EXISTS custom_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  elements TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_custom_reports_status ON custom_reports(status);

CREATE TABLE IF NOT EXISTS permit_to_work (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  permit_number TEXT UNIQUE NOT NULL,
  permit_type TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  work_area TEXT,
  description TEXT,
  risk_level TEXT DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'draft',
  requested_by TEXT,
  approved_by TEXT,
  start_date TEXT,
  end_date TEXT,
  actual_start TEXT,
  actual_end TEXT,
  ppe_required TEXT,
  precautions TEXT,
  emergency_procedure TEXT,
  iot_sensor_ids TEXT,
  department TEXT,
  contractor_id INTEGER,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS ptw_approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  permit_id INTEGER NOT NULL REFERENCES permit_to_work(id),
  approver_name TEXT NOT NULL,
  approver_role TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  comments TEXT,
  approved_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS hazard_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_number TEXT UNIQUE NOT NULL,
  hazard_type TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  reported_by TEXT,
  voice_transcript TEXT,
  department TEXT,
  incident_id INTEGER,
  resolution_notes TEXT,
  resolved_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS safety_procedures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  procedure_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  steps TEXT,
  applicable_roles TEXT,
  department TEXT,
  risk_level TEXT DEFAULT 'medium',
  revision TEXT DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'active',
  approved_by TEXT,
  effective_date TEXT,
  review_date TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS kpi_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  unit TEXT,
  target REAL,
  warning_threshold REAL,
  critical_threshold REAL,
  frequency TEXT DEFAULT 'monthly',
  department TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS kpi_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kpi_id INTEGER NOT NULL REFERENCES kpi_definitions(id),
  value REAL NOT NULL,
  period TEXT NOT NULL,
  recorded_by TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_ptw_status ON permit_to_work(status);
CREATE INDEX IF NOT EXISTS idx_ptw_type ON permit_to_work(permit_type);
CREATE INDEX IF NOT EXISTS idx_ptw_dept ON permit_to_work(department);
CREATE INDEX IF NOT EXISTS idx_ptwapp_permit ON ptw_approvals(permit_id);
CREATE INDEX IF NOT EXISTS idx_haz_type ON hazard_reports(hazard_type);
CREATE INDEX IF NOT EXISTS idx_haz_severity ON hazard_reports(severity);
CREATE INDEX IF NOT EXISTS idx_haz_status ON hazard_reports(status);
CREATE INDEX IF NOT EXISTS idx_sp_category ON safety_procedures(category);
CREATE INDEX IF NOT EXISTS idx_sp_status ON safety_procedures(status);
CREATE INDEX IF NOT EXISTS idx_kpi_def_cat ON kpi_definitions(category);
CREATE INDEX IF NOT EXISTS idx_kpi_read_kpi ON kpi_readings(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_read_period ON kpi_readings(period);

-- SDS Equipment Table (AdvancedTechnologyHub QR/Barcode Scanner)
CREATE TABLE IF NOT EXISTS sds_equipment (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  barcode TEXT,
  qr_code TEXT,
  location TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  last_inspection TEXT,
  next_inspection TEXT,
  status TEXT NOT NULL DEFAULT 'operational',
  linked_sds TEXT DEFAULT '[]',
  risk_score INTEGER DEFAULT 0,
  manufacturer TEXT DEFAULT '',
  model TEXT DEFAULT '',
  purchase_date TEXT,
  warranty_expiry TEXT,
  maintenance_history TEXT DEFAULT '[]',
  pending_sync INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sds_eq_barcode ON sds_equipment(barcode) WHERE barcode IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sds_eq_qrcode ON sds_equipment(qr_code) WHERE qr_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sds_eq_serial ON sds_equipment(serial_number);
CREATE INDEX IF NOT EXISTS idx_sds_eq_status ON sds_equipment(status);
CREATE INDEX IF NOT EXISTS idx_sds_eq_location ON sds_equipment(location);

-- Geotags Table (AdvancedTechnologyHub Geotagging)
CREATE TABLE IF NOT EXISTS geotags (
  id TEXT PRIMARY KEY NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  accuracy REAL NOT NULL,
  altitude REAL,
  zone TEXT,
  facility_area TEXT,
  address TEXT,
  record_type TEXT NOT NULL DEFAULT 'manual',
  linked_record_id TEXT,
  linked_record_type TEXT,
  notes TEXT,
  captured_by TEXT NOT NULL DEFAULT 'system',
  sync_status TEXT NOT NULL DEFAULT 'synced',
  timestamp TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_geotags_record_type ON geotags(record_type);
CREATE INDEX IF NOT EXISTS idx_geotags_sync_status ON geotags(sync_status);
CREATE INDEX IF NOT EXISTS idx_geotags_captured_at ON geotags(captured_at);
CREATE INDEX IF NOT EXISTS idx_geotags_linked ON geotags(linked_record_id);

-- Facility Zones Table (AdvancedTechnologyHub zone mapping)
CREATE TABLE IF NOT EXISTS facility_zones (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  polygon TEXT NOT NULL DEFAULT '[]',
  risk_level TEXT NOT NULL DEFAULT 'low',
  department TEXT NOT NULL DEFAULT '',
  requires_ppe TEXT DEFAULT '[]',
  hazard_types TEXT DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- SSO Providers Table (DataSecurityHub)
CREATE TABLE IF NOT EXISTS sso_providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  protocol TEXT NOT NULL DEFAULT 'SAML 2.0',
  status TEXT NOT NULL DEFAULT 'disconnected',
  icon TEXT NOT NULL DEFAULT '🔐',
  connected_users INTEGER NOT NULL DEFAULT 0,
  last_sync TEXT NOT NULL DEFAULT 'N/A',
  config TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Security Audit Logs Table (DataSecurityHub)
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT NOT NULL DEFAULT '',
  timestamp TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_sso_status ON sso_providers(status);
CREATE INDEX IF NOT EXISTS idx_sal_action ON security_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_sal_user ON security_audit_logs(user_name);
CREATE INDEX IF NOT EXISTS idx_sal_created ON security_audit_logs(created_at);

CREATE TABLE IF NOT EXISTS email_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'active',
  subject TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  icon_name TEXT NOT NULL DEFAULT 'Mail',
  color TEXT NOT NULL DEFAULT 'cyan',
  open_rate REAL NOT NULL DEFAULT 0,
  click_rate REAL NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS automation_workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL DEFAULT '',
  emails_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  delivery_rate REAL NOT NULL DEFAULT 99.0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS email_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  audience_segment TEXT NOT NULL DEFAULT 'All Users',
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at INTEGER,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_et_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_et_status ON email_templates(status);
CREATE INDEX IF NOT EXISTS idx_aw_status ON automation_workflows(status);
CREATE INDEX IF NOT EXISTS idx_ec_status ON email_campaigns(status);
`;

try {
  // Split the SQL into individual statements and execute each one
  const statements = initSQL.split(';').filter(stmt => stmt.trim());
  
  for (const statement of statements) {
    if (statement.trim()) {
      sqlite.exec(statement);
    }
  }

  // MIGRATION: Add new columns to compliance_procedures table if not yet present (for existing DBs)
  {
    const cpCols = (sqlite.prepare('PRAGMA table_info(compliance_procedures)').all() as any[]).map((c: any) => c.name);
    if (!cpCols.includes('industries'))
      sqlite.exec("ALTER TABLE compliance_procedures ADD COLUMN industries TEXT NOT NULL DEFAULT '[]'");
    if (!cpCols.includes('iso_clause'))
      sqlite.exec("ALTER TABLE compliance_procedures ADD COLUMN iso_clause TEXT");
    if (!cpCols.includes('steps'))
      sqlite.exec("ALTER TABLE compliance_procedures ADD COLUMN steps TEXT NOT NULL DEFAULT '[]'");
    if (!cpCols.includes('ai_risk_score'))
      sqlite.exec("ALTER TABLE compliance_procedures ADD COLUMN ai_risk_score INTEGER NOT NULL DEFAULT 50");
    if (!cpCols.includes('ai_risk_level'))
      sqlite.exec("ALTER TABLE compliance_procedures ADD COLUMN ai_risk_level TEXT NOT NULL DEFAULT 'Medium'");
    if (!cpCols.includes('ai_risk_rationale'))
      sqlite.exec("ALTER TABLE compliance_procedures ADD COLUMN ai_risk_rationale TEXT NOT NULL DEFAULT ''");
    if (!cpCols.includes('ai_risk_last_analyzed'))
      sqlite.exec("ALTER TABLE compliance_procedures ADD COLUMN ai_risk_last_analyzed TEXT NOT NULL DEFAULT ''");
    if (!cpCols.includes('ai_risk_trending'))
      sqlite.exec("ALTER TABLE compliance_procedures ADD COLUMN ai_risk_trending TEXT NOT NULL DEFAULT 'stable'");
    if (!cpCols.includes('audit_trail'))
      sqlite.exec("ALTER TABLE compliance_procedures ADD COLUMN audit_trail TEXT NOT NULL DEFAULT '[]'");
  }

  // MIGRATION: Add new columns to compliance_calendar table if not yet present (for existing DBs)
  {
    const calCols = (sqlite.prepare('PRAGMA table_info(compliance_calendar)').all() as any[]).map((c: any) => c.name);
    if (!calCols.includes('regulation'))
      sqlite.exec("ALTER TABLE compliance_calendar ADD COLUMN regulation TEXT");
  }

  // MIGRATION: Add new columns to gap_analysis_reports table if not yet present (for existing DBs)
  {
    const gapCols = (sqlite.prepare('PRAGMA table_info(gap_analysis_reports)').all() as any[]).map((c: any) => c.name);
    if (!gapCols.includes('standard_id')) sqlite.exec('ALTER TABLE gap_analysis_reports ADD COLUMN standard_id TEXT');
    if (!gapCols.includes('clause_id')) sqlite.exec('ALTER TABLE gap_analysis_reports ADD COLUMN clause_id TEXT');
    if (!gapCols.includes('requirement')) sqlite.exec('ALTER TABLE gap_analysis_reports ADD COLUMN requirement TEXT');
    if (!gapCols.includes('current_state')) sqlite.exec('ALTER TABLE gap_analysis_reports ADD COLUMN current_state TEXT');
    if (!gapCols.includes('desired_state')) sqlite.exec('ALTER TABLE gap_analysis_reports ADD COLUMN desired_state TEXT');
    if (!gapCols.includes('gap_description')) sqlite.exec('ALTER TABLE gap_analysis_reports ADD COLUMN gap_description TEXT');
    if (!gapCols.includes('severity')) sqlite.exec('ALTER TABLE gap_analysis_reports ADD COLUMN severity TEXT');
    if (!gapCols.includes('impact')) sqlite.exec('ALTER TABLE gap_analysis_reports ADD COLUMN impact TEXT');
    if (!gapCols.includes('remediation')) sqlite.exec('ALTER TABLE gap_analysis_reports ADD COLUMN remediation TEXT');
    if (!gapCols.includes('effort')) sqlite.exec('ALTER TABLE gap_analysis_reports ADD COLUMN effort TEXT');
    if (!gapCols.includes('priority_order')) sqlite.exec('ALTER TABLE gap_analysis_reports ADD COLUMN priority_order INTEGER');
    if (!gapCols.includes('owner')) sqlite.exec('ALTER TABLE gap_analysis_reports ADD COLUMN owner TEXT');
    if (!gapCols.includes('target_date')) sqlite.exec('ALTER TABLE gap_analysis_reports ADD COLUMN target_date TEXT');
  }

  // MIGRATION: Add regulatory fields to compliance_requirements if not yet present
  {
    const reqCols = (sqlite.prepare('PRAGMA table_info(compliance_requirements)').all() as any[]).map((c: any) => c.name);
    if (!reqCols.includes('regulation')) sqlite.exec('ALTER TABLE compliance_requirements ADD COLUMN regulation TEXT');
    if (!reqCols.includes('agency')) sqlite.exec('ALTER TABLE compliance_requirements ADD COLUMN agency TEXT');
    if (!reqCols.includes('frequency')) sqlite.exec('ALTER TABLE compliance_requirements ADD COLUMN frequency TEXT');
    if (!reqCols.includes('last_review')) sqlite.exec('ALTER TABLE compliance_requirements ADD COLUMN last_review TEXT');
    if (!reqCols.includes('assigned_to')) sqlite.exec('ALTER TABLE compliance_requirements ADD COLUMN assigned_to TEXT');
    if (!reqCols.includes('due_date_text')) sqlite.exec('ALTER TABLE compliance_requirements ADD COLUMN due_date_text TEXT');
  }

  // MIGRATION: Add new columns to chemicals table if not yet present (for existing DBs)
  {
    const chemCols = (sqlite.prepare('PRAGMA table_info(chemicals)').all() as any[]).map((c: any) => c.name);
    if (!chemCols.includes('hazards'))
      sqlite.exec("ALTER TABLE chemicals ADD COLUMN hazards TEXT NOT NULL DEFAULT '[]'");
    if (!chemCols.includes('pictograms'))
      sqlite.exec("ALTER TABLE chemicals ADD COLUMN pictograms TEXT NOT NULL DEFAULT '[]'");
    if (!chemCols.includes('ghs_classification'))
      sqlite.exec("ALTER TABLE chemicals ADD COLUMN ghs_classification TEXT NOT NULL DEFAULT '[]'");
    if (!chemCols.includes('emergency_contact'))
      sqlite.exec("ALTER TABLE chemicals ADD COLUMN emergency_contact TEXT NOT NULL DEFAULT ''");
  }

  // MIGRATION: Add new columns to contractors table (for existing DBs)
  {
    const ctrCols = (sqlite.prepare('PRAGMA table_info(contractors)').all() as any[]).map((c: any) => c.name);
    if (!ctrCols.includes('trade_type')) sqlite.exec('ALTER TABLE contractors ADD COLUMN trade_type TEXT');
    if (!ctrCols.includes('contact_person')) sqlite.exec('ALTER TABLE contractors ADD COLUMN contact_person TEXT');
    if (!ctrCols.includes('insured_until')) sqlite.exec('ALTER TABLE contractors ADD COLUMN insured_until TEXT');
    if (!ctrCols.includes('safety_rating')) sqlite.exec('ALTER TABLE contractors ADD COLUMN safety_rating REAL DEFAULT 0');
    if (!ctrCols.includes('workers_count')) sqlite.exec('ALTER TABLE contractors ADD COLUMN workers_count INTEGER DEFAULT 0');
    if (!ctrCols.includes('certifications')) sqlite.exec("ALTER TABLE contractors ADD COLUMN certifications TEXT DEFAULT '[]'");
    if (!ctrCols.includes('last_safety_audit')) sqlite.exec('ALTER TABLE contractors ADD COLUMN last_safety_audit TEXT');
    if (!ctrCols.includes('incident_history')) sqlite.exec('ALTER TABLE contractors ADD COLUMN incident_history INTEGER DEFAULT 0');
  }

  // MIGRATION: Add new columns to permit_to_work table (for existing DBs)
  {
    const ptwCols = (sqlite.prepare('PRAGMA table_info(permit_to_work)').all() as any[]).map((c: any) => c.name);
    if (!ptwCols.includes('contractor_name')) sqlite.exec('ALTER TABLE permit_to_work ADD COLUMN contractor_name TEXT');
    if (!ptwCols.includes('workers_assigned')) sqlite.exec("ALTER TABLE permit_to_work ADD COLUMN workers_assigned TEXT DEFAULT '[]'");
    if (!ptwCols.includes('submitted_at')) sqlite.exec('ALTER TABLE permit_to_work ADD COLUMN submitted_at TEXT');
    if (!ptwCols.includes('reviewed_by')) sqlite.exec('ALTER TABLE permit_to_work ADD COLUMN reviewed_by TEXT');
    if (!ptwCols.includes('reviewed_at')) sqlite.exec('ALTER TABLE permit_to_work ADD COLUMN reviewed_at TEXT');
    if (!ptwCols.includes('attachments')) sqlite.exec("ALTER TABLE permit_to_work ADD COLUMN attachments TEXT DEFAULT '[]'");
    if (!ptwCols.includes('safety_checklist')) sqlite.exec("ALTER TABLE permit_to_work ADD COLUMN safety_checklist TEXT DEFAULT '[]'");
    if (!ptwCols.includes('special_conditions')) sqlite.exec("ALTER TABLE permit_to_work ADD COLUMN special_conditions TEXT DEFAULT '[]'");
  }

  // Seed Bow Tie scenarios (idempotent)
  const bowTieCount = (sqlite.prepare('SELECT COUNT(*) as n FROM bowtie_scenarios').get() as any).n;
  if (bowTieCount === 0) {
    const insertBT = sqlite.prepare(`
      INSERT INTO bowtie_scenarios (title, top_event, hazard, risk_level, threats, consequences, status, owner, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const ts = Date.now();
    const scenarios = [
      {
        title: 'Confined Space Entry',
        topEvent: 'Loss of Atmosphere',
        hazard: 'Toxic/Oxygen-Deficient Atmosphere',
        riskLevel: 'critical',
        status: 'active',
        owner: 'J. Martinez',
        threats: JSON.stringify([
          { id: 'T1', name: 'Residual chemicals in vessel', preventiveBarriers: [
            { id: 'PB1', name: 'Gas Testing Protocol', type: 'procedural', effectiveness: 92, status: 'active' },
            { id: 'PB2', name: 'Continuous Air Monitor', type: 'engineering', effectiveness: 95, status: 'active' },
            { id: 'PB3', name: 'Ventilation System', type: 'engineering', effectiveness: 88, status: 'active' },
          ]},
          { id: 'T2', name: 'Welding/cutting fumes', preventiveBarriers: [
            { id: 'PB4', name: 'Hot Work Permit', type: 'administrative', effectiveness: 85, status: 'active' },
            { id: 'PB5', name: 'LEV Extraction', type: 'engineering', effectiveness: 78, status: 'degraded' },
          ]},
          { id: 'T3', name: 'Biological decomposition', preventiveBarriers: [
            { id: 'PB6', name: 'Pre-entry Inspection', type: 'procedural', effectiveness: 80, status: 'active' },
          ]},
        ]),
        consequences: JSON.stringify([
          { id: 'C1', name: 'Worker asphyxiation', severity: 'catastrophic', mitigativeBarriers: [
            { id: 'MB1', name: 'SCBA Rescue Kit', type: 'ppe', effectiveness: 90, status: 'active' },
            { id: 'MB2', name: 'Emergency Retrieval System', type: 'engineering', effectiveness: 85, status: 'active' },
            { id: 'MB3', name: 'Rescue Team on Standby', type: 'procedural', effectiveness: 88, status: 'active' },
          ]},
          { id: 'C2', name: 'Multiple casualties', severity: 'catastrophic', mitigativeBarriers: [
            { id: 'MB4', name: 'Entry Buddy System', type: 'procedural', effectiveness: 82, status: 'active' },
            { id: 'MB5', name: 'Emergency Alarm System', type: 'engineering', effectiveness: 90, status: 'active' },
          ]},
        ]),
      },
      {
        title: 'Chemical Spill',
        topEvent: 'Uncontrolled Release',
        hazard: 'Corrosive Chemical Storage',
        riskLevel: 'high',
        status: 'active',
        owner: 'S. Chen',
        threats: JSON.stringify([
          { id: 'T4', name: 'Container failure', preventiveBarriers: [
            { id: 'PB7', name: 'Inspection Program', type: 'procedural', effectiveness: 88, status: 'active' },
            { id: 'PB8', name: 'Secondary Containment', type: 'engineering', effectiveness: 95, status: 'active' },
          ]},
          { id: 'T5', name: 'Transfer line leak', preventiveBarriers: [
            { id: 'PB9', name: 'Pressure Testing', type: 'engineering', effectiveness: 90, status: 'active' },
            { id: 'PB10', name: 'Leak Detection System', type: 'engineering', effectiveness: 85, status: 'degraded' },
          ]},
        ]),
        consequences: JSON.stringify([
          { id: 'C3', name: 'Chemical burns', severity: 'major', mitigativeBarriers: [
            { id: 'MB6', name: 'Emergency Shower/Eyewash', type: 'engineering', effectiveness: 95, status: 'active' },
            { id: 'MB7', name: 'Chemical PPE Kit', type: 'ppe', effectiveness: 88, status: 'active' },
          ]},
          { id: 'C4', name: 'Environmental contamination', severity: 'major', mitigativeBarriers: [
            { id: 'MB8', name: 'Spill Response Kit', type: 'engineering', effectiveness: 82, status: 'active' },
            { id: 'MB9', name: 'Drain Isolation Valves', type: 'engineering', effectiveness: 90, status: 'active' },
          ]},
        ]),
      },
      {
        title: 'Fall from Height',
        topEvent: 'Worker Falls',
        hazard: 'Working at Elevation >6ft',
        riskLevel: 'high',
        status: 'review',
        owner: 'R. Patel',
        threats: JSON.stringify([
          { id: 'T6', name: 'Guardrail missing/damaged', preventiveBarriers: [
            { id: 'PB11', name: 'Daily Inspection', type: 'procedural', effectiveness: 85, status: 'active' },
            { id: 'PB12', name: 'Permanent Guardrails', type: 'engineering', effectiveness: 95, status: 'active' },
          ]},
          { id: 'T7', name: 'Scaffold collapse', preventiveBarriers: [
            { id: 'PB13', name: 'Competent Person Check', type: 'administrative', effectiveness: 90, status: 'active' },
          ]},
        ]),
        consequences: JSON.stringify([
          { id: 'C5', name: 'Serious injury/fatality', severity: 'catastrophic', mitigativeBarriers: [
            { id: 'MB10', name: 'Fall Arrest System', type: 'ppe', effectiveness: 92, status: 'active' },
            { id: 'MB11', name: 'Safety Net', type: 'engineering', effectiveness: 88, status: 'active' },
          ]},
        ]),
      },
    ];
    for (const s of scenarios) {
      insertBT.run(s.title, s.topEvent, s.hazard, s.riskLevel, s.threats, s.consequences, s.status, s.owner, ts, ts);
    }
  }

  // Seed standard certifications (idempotent)
  const stdCertCount = (sqlite.prepare('SELECT COUNT(*) as n FROM standard_certifications').get() as any).n;
  if (stdCertCount === 0) {
    const insertSC = sqlite.prepare(`
      INSERT INTO standard_certifications
        (standard_id, standard_code, standard_title, status, certification_body, certificate_number,
         initial_cert_date, expiry_date, last_surveillance_date, next_surveillance_date,
         scope, locations, overall_score, clause_scores, non_conformities, audit_history, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const ts = Date.now();
    const stdCerts = [
      {
        standardId: 'iso-45001', standardCode: 'ISO 45001:2018',
        standardTitle: 'Occupational Health and Safety Management Systems',
        status: 'certified', certificationBody: 'Bureau Veritas',
        certificateNumber: 'OH&S-2024-45001-12345',
        initialCertDate: '2024-06-15', expiryDate: '2027-06-14',
        lastSurveillanceDate: '2025-06-10', nextSurveillanceDate: '2026-06-15',
        scope: JSON.stringify(['Manufacturing operations', 'Warehouse and logistics', 'Office administration']),
        locations: JSON.stringify(['Main Plant - Chicago, IL', 'Distribution Center - Atlanta, GA']),
        overallScore: 92,
        clauseScores: JSON.stringify([
          { clauseId: '45001-4', score: 95, notes: 'Strong context analysis' },
          { clauseId: '45001-5', score: 88, notes: 'Leadership commitment evident; worker participation can be improved' },
          { clauseId: '45001-6', score: 90, notes: 'Comprehensive risk assessment' },
          { clauseId: '45001-7', score: 94, notes: 'Excellent training programs' },
          { clauseId: '45001-8', score: 92, notes: 'Strong operational controls' },
          { clauseId: '45001-9', score: 93, notes: 'Good monitoring systems' },
          { clauseId: '45001-10', score: 91, notes: 'Effective improvement process' },
        ]),
        nonConformities: JSON.stringify([
          { id: 'nc-001', type: 'minor', description: 'Contractor safety training records incomplete', status: 'closed' },
          { id: 'nc-002', type: 'minor', description: 'Emergency drill documentation missing for one location', status: 'closed' },
        ]),
        auditHistory: JSON.stringify([
          { date: '2024-06-15', type: 'Initial Certification', result: 'Certified', auditor: 'John Smith' },
          { date: '2025-06-10', type: 'Surveillance 1', result: 'Maintained', auditor: 'Jane Doe' },
        ]),
      },
      {
        standardId: 'iso-27001', standardCode: 'ISO/IEC 27001:2022',
        standardTitle: 'Information Security Management Systems',
        status: 'in_audit', certificationBody: 'BSI Group',
        certificateNumber: null, initialCertDate: null, expiryDate: null,
        lastSurveillanceDate: null, nextSurveillanceDate: null,
        scope: JSON.stringify(['IT infrastructure', 'Cloud services', 'Customer data processing']),
        locations: JSON.stringify(['Headquarters - New York, NY', 'Data Center - Virginia']),
        overallScore: null,
        clauseScores: JSON.stringify([]),
        nonConformities: JSON.stringify([]),
        auditHistory: JSON.stringify([
          { date: '2026-01-20', type: 'Stage 1 Audit', result: 'Proceed to Stage 2', auditor: 'Michael Chen' },
        ]),
      },
      {
        standardId: 'iso-22301', standardCode: 'ISO 22301:2019',
        standardTitle: 'Business Continuity Management Systems',
        status: 'not_certified', certificationBody: null,
        certificateNumber: null, initialCertDate: null, expiryDate: null,
        lastSurveillanceDate: null, nextSurveillanceDate: null,
        scope: JSON.stringify(['Critical business operations', 'IT systems', 'Supply chain']),
        locations: JSON.stringify(['All locations']),
        overallScore: null,
        clauseScores: JSON.stringify([]),
        nonConformities: JSON.stringify([]),
        auditHistory: JSON.stringify([]),
      },
      {
        standardId: 'iso-22000', standardCode: 'ISO 22000:2018',
        standardTitle: 'Food Safety Management Systems',
        status: 'certified', certificationBody: 'SGS',
        certificateNumber: 'FSMS-2023-22000-98765',
        initialCertDate: '2023-09-01', expiryDate: '2026-08-31',
        lastSurveillanceDate: '2025-09-05', nextSurveillanceDate: '2026-03-01',
        scope: JSON.stringify(['Food manufacturing', 'Packaging', 'Cold chain logistics']),
        locations: JSON.stringify(['Food Processing Plant - Denver, CO']),
        overallScore: 96,
        clauseScores: JSON.stringify([
          { clauseId: '22000-4', score: 95, notes: 'Clear scope definition' },
          { clauseId: '22000-7', score: 97, notes: 'Excellent food safety team' },
          { clauseId: '22000-8', score: 96, notes: 'Robust HACCP plan' },
        ]),
        nonConformities: JSON.stringify([]),
        auditHistory: JSON.stringify([
          { date: '2023-09-01', type: 'Initial Certification', result: 'Certified', auditor: 'Sarah Wilson' },
          { date: '2024-09-03', type: 'Surveillance 1', result: 'Maintained', auditor: 'Tom Brown' },
          { date: '2025-09-05', type: 'Surveillance 2', result: 'Maintained', auditor: 'Sarah Wilson' },
        ]),
      },
    ];
    for (const c of stdCerts) {
      insertSC.run(
        c.standardId, c.standardCode, c.standardTitle, c.status,
        c.certificationBody ?? null, c.certificateNumber ?? null,
        c.initialCertDate ?? null, c.expiryDate ?? null,
        c.lastSurveillanceDate ?? null, c.nextSurveillanceDate ?? null,
        c.scope, c.locations, c.overallScore ?? null,
        c.clauseScores, c.nonConformities, c.auditHistory, ts, ts,
      );
    }
  }

  // Seed system report templates (idempotent)
  const sysTemplateCount = (sqlite.prepare('SELECT COUNT(*) as n FROM report_templates WHERE is_system = 1').get() as any).n;
  if (sysTemplateCount === 0) {
    const insertTpl = sqlite.prepare(
      `INSERT OR IGNORE INTO report_templates (name, type, description, sections, format, is_default, is_system)
       VALUES (?, ?, ?, ?, 'pdf', 1, 1)`
    );
    [
      ['Executive Safety Summary', 'kpi', 'C-suite overview with KPIs, incident trends, compliance status, and risk forecast', '["KPI Dashboard","Incident Summary","Compliance Status","Risk Forecast","Action Items"]'],
      ['Monthly Incident Report', 'incident', 'Detailed incident analysis with root causes, corrective actions, and trend charts', '["Incident Log","Root Cause Analysis","CAPA Status","Trend Charts","Lessons Learned"]'],
      ['Compliance Audit Report', 'compliance', 'Regulatory compliance status across OSHA, EPA, ISO 45001 frameworks', '["Regulatory Status","Audit Findings","Gap Analysis","Corrective Actions","Certification Status"]'],
      ['Environmental Metrics Dashboard', 'custom', 'Emissions tracking, waste management, water quality, and ESG indicators', '["Emission Data","Waste Metrics","Water Quality","Energy Consumption","ESG Score"]'],
      ['Training Compliance Report', 'training', 'Employee training status, certifications expiring, and completion rates', '["Completion Rates","Overdue Training","Certification Status","Training Hours","Gap Analysis"]'],
      ['Safety Audit Summary', 'audit', 'Comprehensive audit findings with severity ratings and action tracking', '["Audit Schedule","Findings Summary","Severity Matrix","Action Tracking","Trends"]'],
    ].forEach(([name, type, desc, sections]) => insertTpl.run(name, type, desc, sections));
  }

  // Seed compliance reports (idempotent)
  const compReportCount = (sqlite.prepare('SELECT COUNT(*) as n FROM compliance_reports').get() as any).n;
  if (compReportCount === 0) {
    const insertCR = sqlite.prepare(
      `INSERT INTO compliance_reports (name, type, frequency, last_generated, next_due, status, recipients, format, automation_enabled, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const ts = Date.now();
    const reports = [
      { name: 'OSHA 300 Log - Annual Summary', type: 'regulatory', frequency: 'annual', lastGenerated: '2025-02-01', nextDue: '2026-02-01', status: 'current', recipients: ['safety@company.com','hr@company.com'], format: 'pdf', automation: 1, description: 'Annual summary of work-related injuries and illnesses as required by OSHA' },
      { name: 'Monthly Safety Performance Report', type: 'internal', frequency: 'monthly', lastGenerated: '2026-02-01', nextDue: '2026-03-01', status: 'current', recipients: ['management@company.com','safety@company.com'], format: 'pdf', automation: 1, description: 'Comprehensive monthly safety metrics including TRIR, DART, and leading indicators' },
      { name: 'EPA Air Emissions Report', type: 'environmental', frequency: 'quarterly', lastGenerated: '2026-01-15', nextDue: '2026-04-15', status: 'current', recipients: ['environmental@company.com'], format: 'excel', automation: 1, description: 'Quarterly air emissions data for EPA compliance reporting' },
      { name: 'Weekly Incident Summary', type: 'incident', frequency: 'weekly', lastGenerated: '2026-02-05', nextDue: '2026-02-12', status: 'due_soon', recipients: ['safety@company.com','operations@company.com'], format: 'dashboard', automation: 1, description: 'Weekly summary of all reported incidents, near-misses, and corrective actions' },
      { name: 'Training Compliance Report', type: 'training', frequency: 'monthly', lastGenerated: '2026-01-28', nextDue: '2026-02-28', status: 'current', recipients: ['training@company.com','hr@company.com'], format: 'excel', automation: 0, description: 'Status of required safety training completion and certification renewals' },
      { name: 'ISO 45001 Audit Report', type: 'audit', frequency: 'annual', lastGenerated: '2025-11-15', nextDue: '2026-11-15', status: 'current', recipients: ['quality@company.com','management@company.com'], format: 'pdf', automation: 0, description: 'Annual internal audit report for ISO 45001 occupational health and safety management' },
      { name: 'Daily Safety Briefing', type: 'safety', frequency: 'daily', lastGenerated: '2026-02-06', nextDue: '2026-02-07', status: 'current', recipients: ['supervisors@company.com'], format: 'dashboard', automation: 1, description: 'Daily safety briefing with weather alerts, active permits, and scheduled high-risk work' },
      { name: 'Contractor Safety Performance', type: 'safety', frequency: 'monthly', lastGenerated: '2026-01-15', nextDue: '2026-02-15', status: 'overdue', recipients: ['procurement@company.com','safety@company.com'], format: 'pdf', automation: 0, description: 'Monthly contractor safety performance metrics and compliance status' },
    ];
    for (const r of reports) {
      insertCR.run(r.name, r.type, r.frequency, r.lastGenerated, r.nextDue, r.status, JSON.stringify(r.recipients), r.format, r.automation, r.description, ts, ts);
    }
  }

  // Seed compliance metrics (idempotent)
  const compMetricCount = (sqlite.prepare('SELECT COUNT(*) as n FROM compliance_metrics').get() as any).n;
  if (compMetricCount === 0) {
    const insertCM = sqlite.prepare(
      `INSERT INTO compliance_metrics (name, category, current_value, target_value, unit, trend, trend_value, status, last_updated, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const ts = Date.now();
    const metrics = [
      { name: 'TRIR', category: 'Safety', current: 2.1, target: 2.5, unit: '', trend: 'down', trendVal: -15, status: 'compliant', lastUpdated: '2026-02-06' },
      { name: 'DART Rate', category: 'Safety', current: 1.4, target: 1.5, unit: '', trend: 'down', trendVal: -8, status: 'compliant', lastUpdated: '2026-02-06' },
      { name: 'Training Compliance', category: 'Training', current: 94, target: 95, unit: '%', trend: 'up', trendVal: 3, status: 'at_risk', lastUpdated: '2026-02-05' },
      { name: 'Inspection Completion', category: 'Safety', current: 98, target: 100, unit: '%', trend: 'stable', trendVal: 0, status: 'compliant', lastUpdated: '2026-02-06' },
      { name: 'CAPA Closure Rate', category: 'Quality', current: 87, target: 90, unit: '%', trend: 'up', trendVal: 5, status: 'at_risk', lastUpdated: '2026-02-05' },
      { name: 'Near Miss Reporting', category: 'Safety', current: 42, target: 40, unit: '/month', trend: 'up', trendVal: 12, status: 'compliant', lastUpdated: '2026-02-06' },
      { name: 'Permit Compliance', category: 'Operations', current: 100, target: 100, unit: '%', trend: 'stable', trendVal: 0, status: 'compliant', lastUpdated: '2026-02-06' },
      { name: 'Emissions (tCO2e)', category: 'Environmental', current: 1250, target: 1400, unit: '', trend: 'down', trendVal: -18, status: 'compliant', lastUpdated: '2026-02-01' },
    ];
    for (const m of metrics) {
      insertCM.run(m.name, m.category, m.current, m.target, m.unit, m.trend, m.trendVal, m.status, m.lastUpdated, ts, ts);
    }
  }

  // Seed contractors (idempotent — check by company name)
  {
    const existingCtr = (sqlite.prepare("SELECT COUNT(*) as n FROM contractors WHERE company IN ('Elite Welding Services','Skyline Scaffolding Co.','PowerGrid Electrical','DeepDig Excavation')").get() as any).n;
    if (existingCtr === 0) {
      const insertC = sqlite.prepare(`
        INSERT INTO contractors (name, company, email, phone, specialty, status, contract_start, contract_end,
          trade_type, contact_person, insured_until, safety_rating, workers_count, certifications, last_safety_audit, incident_history,
          created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const ts2 = Date.now();
      const j = (arr: string[]) => JSON.stringify(arr);
      insertC.run('John Martinez', 'Elite Welding Services', 'john@elitewelding.com', '+1 555-0101', 'Welding & Fabrication', 'active', '2025-01-01', '2026-12-31', 'Welding & Fabrication', 'John Martinez', '2026-12-31', 4.8, 24, j(['AWS Certified', 'OSHA 30', 'Confined Space Entry']), '2026-01-15', 0, ts2, ts2);
      insertC.run('Sarah Chen', 'Skyline Scaffolding Co.', 'sarah@skylinescaff.com', '+1 555-0102', 'Scaffolding & Access', 'active', '2025-01-01', '2026-08-15', 'Scaffolding & Access', 'Sarah Chen', '2026-08-15', 4.5, 18, j(['SAIA Certified', 'OSHA 30', 'Fall Protection']), '2026-01-20', 1, ts2, ts2);
      insertC.run('Mike Thompson', 'PowerGrid Electrical', 'mike@powergrid.com', '+1 555-0103', 'Electrical', 'pending_approval', '2025-01-01', '2026-03-01', 'Electrical', 'Mike Thompson', '2026-03-01', 3.9, 12, j(['Licensed Electrician', 'Arc Flash Certified']), '2025-11-10', 2, ts2, ts2);
      insertC.run('Robert Wilson', 'DeepDig Excavation', 'robert@deepdig.com', '+1 555-0104', 'Excavation & Trenching', 'expired', '2024-01-01', '2025-02-01', 'Excavation & Trenching', 'Robert Wilson', '2025-02-01', 3.2, 8, j(['Competent Person', 'OSHA 10']), '2025-08-20', 3, ts2, ts2);
    }
  }

  // Seed permit_to_work applications (idempotent — check by permit_number)
  {
    const existingPTW = (sqlite.prepare("SELECT COUNT(*) as n FROM permit_to_work WHERE permit_number IN ('PTW-2026-0042','PTW-2026-0043','PTW-2026-0044','PTW-2026-0045')").get() as any).n;
    if (existingPTW === 0) {
      const insertP = sqlite.prepare(`
        INSERT INTO permit_to_work (permit_number, permit_type, title, location, description, risk_level, status,
          contractor_id, contractor_name, workers_assigned, start_date, end_date, submitted_at, reviewed_by, reviewed_at,
          attachments, safety_checklist, special_conditions, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const ts3 = Math.floor(Date.now() / 1000);
      const j = JSON.stringify.bind(JSON);
      // PA-001: hot_work, under_review (contractor_id will be resolved at query time — use 1 as placeholder)
      insertP.run('PTW-2026-0042', 'hot_work', 'Welding repairs on structural steel beams', 'Building A - Section 3',
        'Welding repairs on structural steel beams in Building A, Section 3', 'high', 'under_review',
        1, 'Elite Welding Services', j(['Carlos Rodriguez', 'Maria Santos', 'James Lee']),
        '2026-02-10', '2026-02-12', '2026-02-05T09:30:00Z', null, null,
        j(['welding_procedure.pdf', 'risk_assessment.pdf']),
        j([
          { id: 'SC-1', question: 'Fire extinguisher within 25 feet?', response: true, required: true, category: 'Fire Safety' },
          { id: 'SC-2', question: 'Fire watch assigned?', response: true, required: true, category: 'Fire Safety' },
          { id: 'SC-3', question: 'Combustibles removed or covered?', response: true, required: true, category: 'Fire Safety' },
          { id: 'SC-4', question: 'Welding screens in place?', response: null, required: true, category: 'PPE' },
        ]),
        j(['Continuous fire watch for 1 hour after work completion', 'Notify Building A occupants before starting']),
        ts3, ts3);
      // PA-002: working_at_height, approved
      insertP.run('PTW-2026-0043', 'working_at_height', 'Erection of scaffolding for facade renovation', 'West Wing Exterior',
        'Erection of scaffolding for facade renovation on west wing', 'critical', 'approved',
        2, 'Skyline Scaffolding Co.', j(['Peter Chang', 'Lisa Park', 'Tom Anderson', 'Raj Patel']),
        '2026-02-08', '2026-02-20', '2026-02-03T11:00:00Z', 'Jennifer Walsh', '2026-02-04T16:45:00Z',
        j(['scaffold_design.pdf', 'fall_protection_plan.pdf', 'worker_certifications.pdf']),
        j([
          { id: 'SC-1', question: 'All workers certified for WAH?', response: true, required: true, category: 'Training' },
          { id: 'SC-2', question: 'Fall protection equipment inspected?', response: true, required: true, category: 'Equipment' },
          { id: 'SC-3', question: 'Weather conditions suitable?', response: true, required: true, category: 'Environmental' },
          { id: 'SC-4', question: 'Rescue plan in place?', response: true, required: true, category: 'Emergency' },
        ]),
        j(['Daily scaffold inspection required', 'Work suspended if wind > 25 mph', 'Exclusion zone below work area']),
        ts3, ts3);
      // PA-003: electrical, rejected
      insertP.run('PTW-2026-0044', 'electrical', 'Panel upgrade and rewiring in Substation B', 'Substation B',
        'Panel upgrade and rewiring in Substation B', 'critical', 'rejected',
        3, 'PowerGrid Electrical', j(['Kevin Nguyen', 'Amy Foster']),
        '2026-02-15', '2026-02-16', '2026-02-04T08:00:00Z', 'Emily Brown', '2026-02-04T11:30:00Z',
        j(['electrical_scope.pdf']),
        j([
          { id: 'SC-1', question: 'LOTO procedure documented?', response: false, required: true, category: 'Isolation' },
          { id: 'SC-2', question: 'Arc flash PPE available?', response: true, required: true, category: 'PPE' },
          { id: 'SC-3', question: 'Current arc flash study?', response: false, required: true, category: 'Documentation' },
        ]),
        j([]),
        ts3, ts3);
      // PA-004: confined_space, active
      insertP.run('PTW-2026-0045', 'confined_space', 'Internal tank inspection and weld repairs', 'Storage Tank T-103',
        'Internal tank inspection and weld repairs', 'critical', 'active',
        1, 'Elite Welding Services', j(['Carlos Rodriguez', 'James Lee']),
        '2026-02-18', '2026-02-19', '2026-02-01T10:00:00Z', 'Jennifer Walsh', '2026-02-03T09:00:00Z',
        j(['csep_procedure.pdf', 'atmospheric_monitoring.pdf', 'rescue_plan.pdf']),
        j([
          { id: 'SC-1', question: 'Entry permit posted at entry point?', response: true, required: true, category: 'Documentation' },
          { id: 'SC-2', question: 'Atmospheric testing completed?', response: true, required: true, category: 'Monitoring' },
          { id: 'SC-3', question: 'Rescue team on standby?', response: true, required: true, category: 'Emergency' },
          { id: 'SC-4', question: 'Continuous air monitoring active?', response: true, required: true, category: 'Monitoring' },
          { id: 'SC-5', question: 'Entry attendant assigned?', response: true, required: true, category: 'Personnel' },
        ]),
        j(['Continuous air monitoring required', 'Communication check every 15 minutes', 'Maximum 2 entrants at any time']),
        ts3, ts3);

      // Seed ptw_approvals for the 4 permits
      const getPermitId = (num: string) => (sqlite.prepare('SELECT id FROM permit_to_work WHERE permit_number = ?').get(num) as any)?.id;
      const insertA = sqlite.prepare(`
        INSERT INTO ptw_approvals (permit_id, approver_name, approver_role, status, comments, approved_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const p1 = getPermitId('PTW-2026-0042');
      if (p1) {
        insertA.run(p1, 'Emily Brown', 'Safety Officer', 'approved', 'Verified fire watch requirements', ts3, ts3);
        insertA.run(p1, 'David Kim', 'Area Supervisor', 'pending', null, null, ts3);
        insertA.run(p1, 'Jennifer Walsh', 'Safety Manager', 'pending', null, null, ts3);
      }
      const p2 = getPermitId('PTW-2026-0043');
      if (p2) {
        insertA.run(p2, 'Emily Brown', 'Safety Officer', 'approved', null, ts3, ts3);
        insertA.run(p2, 'David Kim', 'Area Supervisor', 'approved', null, ts3, ts3);
        insertA.run(p2, 'Jennifer Walsh', 'Safety Manager', 'approved', null, ts3, ts3);
      }
      const p3 = getPermitId('PTW-2026-0044');
      if (p3) {
        insertA.run(p3, 'Emily Brown', 'Safety Officer', 'rejected', 'LOTO procedure incomplete. Arc flash study outdated.', ts3, ts3);
      }
      const p4 = getPermitId('PTW-2026-0045');
      if (p4) {
        insertA.run(p4, 'Emily Brown', 'Safety Officer', 'approved', null, ts3, ts3);
        insertA.run(p4, 'David Kim', 'Area Supervisor', 'approved', null, ts3, ts3);
        insertA.run(p4, 'Jennifer Walsh', 'Safety Manager', 'approved', null, ts3, ts3);
      }
    }
  }

  // ── SEED: international_standards (idempotent – skip if standard_code already present) ──
  {
    const hasStd = (code: string) =>
      !!(sqlite.prepare('SELECT id FROM international_standards WHERE standard_code = ?').get(code));
    const insertStd = sqlite.prepare(`
      INSERT INTO international_standards (standard_code, standard_name, issuer, category, certification_required, last_updated)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const ts4 = Date.now();
    const stdSeeds: [string, string, string, string, number][] = [
      ['ISO 45001:2018', 'Occupational Health and Safety Management Systems', 'ISO', 'Occupational Health & Safety', 1],
      ['ISO 45003:2021', 'Psychological Health and Safety at Work', 'ISO', 'Occupational Health & Safety', 0],
      ['ILO-OSH 2001', 'Guidelines on Occupational Safety and Health Management Systems', 'ILO', 'Occupational Health & Safety', 0],
      ['ISO/IEC 27001:2022', 'Information Security Management', 'ISO/IEC', 'Digital & Information Safety', 1],
      ['ISO 31000:2018', 'Risk Management', 'ISO', 'Specialized & Risk Standards', 0],
      ['ISO/IEC 27701:2019', 'Privacy Information Management', 'ISO/IEC', 'Digital & Information Safety', 1],
      ['ISO 22301:2019', 'Business Continuity Management', 'ISO', 'Digital & Information Safety', 1],
      ['ISO 13485:2016', 'Medical Devices Quality Management', 'ISO', 'Sector-Specific Safety', 1],
      ['ISO 22000:2018', 'Food Safety Management Systems', 'ISO', 'Sector-Specific Safety', 1],
      ['IEC 61508', 'Functional Safety of E/E/PE Systems', 'IEC', 'Technical & Engineering Safety', 1],
      ['ISO 26262:2018', 'Road Vehicles Functional Safety', 'ISO', 'Sector-Specific Safety', 1],
      ['IEC 60364', 'Low-Voltage Electrical Installations', 'IEC', 'Technical & Engineering Safety', 0],
      ['IEC 61140:2016', 'Protection Against Electric Shock', 'IEC', 'Technical & Engineering Safety', 0],
      ['ISO 12100:2010', 'Safety of Machinery', 'ISO', 'Technical & Engineering Safety', 0],
    ];
    for (const [code, name, issuer, category, cert] of stdSeeds) {
      if (!hasStd(code)) insertStd.run(code, name, issuer, category, cert, ts4);
    }
  }

  // ── SEED: standard_relationships (idempotent – skip if source+target pair exists) ──
  {
    const hasRel = (src: string, tgt: string) =>
      !!(sqlite.prepare('SELECT id FROM standard_relationships WHERE source_standard_id = ? AND target_standard_id = ?').get(src, tgt));
    const insertRel = sqlite.prepare(`
      INSERT INTO standard_relationships
        (source_standard_id, target_standard_id, relationship_type, mapped_clauses, integration_notes, synergies, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const ts5 = Date.now();
    const j = (v: any) => JSON.stringify(v);
    const relSeeds: [string, string, string, string, string, string][] = [
      [
        'iso-45001', 'iso-45003', 'integrated',
        j([{ sourceClauses: ['6.1', '6.2'], targetClauses: ['4.1', '4.2'], description: 'Risk assessment integrates psychological hazard identification' },
           { sourceClauses: ['7.2', '7.3'], targetClauses: ['7.1', '7.2'], description: 'Competence and awareness requirements aligned' },
           { sourceClauses: ['9.1'], targetClauses: ['8.4'], description: 'Performance monitoring includes psychological wellbeing indicators' }]),
        'ISO 45003 extends ISO 45001 to address psychological health and safety, with direct clause alignment for seamless integration. Organizations certified to ISO 45001 can extend their scope to include psychological wellbeing.',
        j(['Unified OHS management system', 'Comprehensive worker wellbeing coverage', 'Single audit process', 'Reduced documentation overhead'])
      ],
      [
        'iso-45001', 'ilo-osh-2001', 'compatible',
        j([{ sourceClauses: ['4.1', '4.2'], targetClauses: ['2.1', '2.2'], description: 'Both require organizational context and stakeholder analysis' },
           { sourceClauses: ['5.1'], targetClauses: ['3.1'], description: 'Leadership commitment requirements are structurally equivalent' },
           { sourceClauses: ['10.1'], targetClauses: ['12.1'], description: 'Continual improvement principles aligned' }]),
        'ILO-OSH 2001 guidelines provided the foundation for ISO 45001. Organizations following ILO-OSH 2001 have a strong base for ISO 45001 certification with minimal additional effort.',
        j(['Regulatory compliance pathway', 'International recognition', 'Structured OHS framework', 'Worker participation focus'])
      ],
      [
        'iso-45001', 'iso-27001', 'complementary',
        j([{ sourceClauses: ['6.1'], targetClauses: ['6.1.2'], description: 'Risk assessment methodologies can be harmonized' },
           { sourceClauses: ['7.5'], targetClauses: ['7.5'], description: 'Documented information requirements follow same Annex SL structure' },
           { sourceClauses: ['9.2'], targetClauses: ['9.2'], description: 'Internal audit programs can be combined' }]),
        'Both standards follow the ISO High Level Structure (Annex SL), enabling integrated management system implementation. Shared clauses for context, leadership, planning, and performance evaluation reduce duplication.',
        j(['Integrated management system', 'Annex SL alignment', 'Combined audits', 'Shared documentation', 'Resource efficiency'])
      ],
      [
        'iso-45001', 'iso-31000', 'complementary',
        j([{ sourceClauses: ['6.1.1', '6.1.2'], targetClauses: ['6.1', '6.2', '6.3'], description: 'OHS hazard identification aligns with ISO 31000 risk identification principles' },
           { sourceClauses: ['6.2'], targetClauses: ['6.5', '6.6'], description: 'OHS objectives setting benefits from ISO 31000 risk treatment framework' }]),
        'ISO 31000 provides a comprehensive risk management framework that enhances the risk-based thinking in ISO 45001. Organizations can use ISO 31000 principles to strengthen their OHS risk assessment processes.',
        j(['Enhanced risk framework', 'Systematic hazard identification', 'Risk-based decision making', 'Organizational resilience'])
      ],
      [
        'iso-27001', 'iso-27701', 'integrated',
        j([{ sourceClauses: ['6.1.2'], targetClauses: ['6.1.1'], description: 'Information security risk assessment extended to include privacy risks' },
           { sourceClauses: ['8.2'], targetClauses: ['8.2.1'], description: 'Information security risk treatment incorporates privacy controls' },
           { sourceClauses: ['A.5-A.18'], targetClauses: ['7.2', '7.3', '7.4', '7.5'], description: 'Annex A controls mapped to privacy-specific controls' }]),
        'ISO 27701 is explicitly designed as an extension to ISO 27001, adding privacy information management requirements. ISO 27001 certification is a prerequisite for ISO 27701 certification.',
        j(['Unified ISMS and PIMS', 'GDPR compliance pathway', 'Privacy by design', 'Single management system', 'Comprehensive data protection'])
      ],
      [
        'iso-27001', 'iso-22301', 'complementary',
        j([{ sourceClauses: ['A.17'], targetClauses: ['8.3', '8.4'], description: 'Information security continuity controls align with BCM requirements' },
           { sourceClauses: ['8.2', '8.3'], targetClauses: ['8.2', '8.3'], description: 'Risk assessment and treatment processes complement each other' },
           { sourceClauses: ['9.2', '9.3'], targetClauses: ['9.2', '9.3'], description: 'Management review and internal audit programs can be integrated' }]),
        'ISO 22301 business continuity management complements ISO 27001 by ensuring IT and information systems remain available during disruptions. Together they provide comprehensive organizational resilience.',
        j(['Organizational resilience', 'Information availability', 'Cyber resilience', 'Combined incident response'])
      ],
      [
        'iso-13485', 'iso-45001', 'complementary',
        j([{ sourceClauses: ['4.1'], targetClauses: ['4.1', '4.2'], description: 'QMS scope includes OHS considerations for medical device manufacturing' },
           { sourceClauses: ['6.2'], targetClauses: ['7.2'], description: 'Personnel competence requirements for safe medical device manufacturing' },
           { sourceClauses: ['6.3', '6.4'], targetClauses: ['8.1.2'], description: 'Infrastructure and work environment requirements overlap' }]),
        'Medical device manufacturers require both quality management (ISO 13485) and occupational health and safety (ISO 45001) systems. Integration reduces audit burden and ensures comprehensive compliance.',
        j(['Manufacturing safety', 'Regulatory compliance', 'Worker and product safety', 'Reduced audit burden'])
      ],
      [
        'iso-22000', 'iso-45001', 'complementary',
        j([{ sourceClauses: ['7.2'], targetClauses: ['7.2'], description: 'Food handler hygiene requirements complement OHS training requirements' },
           { sourceClauses: ['8.1'], targetClauses: ['8.1.2'], description: 'Operational planning for food safety and worker safety are linked' },
           { sourceClauses: ['9.1.1'], targetClauses: ['9.1'], description: 'Monitoring and measurement programs can be combined' }]),
        'Food manufacturing operations must address both food safety and worker safety. Integrated ISO 22000 and ISO 45001 systems enable comprehensive management of all hazards in food production environments.',
        j(['Food safety and worker safety alignment', 'Hazard analysis synergy', 'Regulatory compliance', 'Integrated incident management'])
      ],
      [
        'iec-61508', 'iso-26262', 'prerequisite',
        j([{ sourceClauses: ['7', '8', '9'], targetClauses: ['4', '5', '6'], description: 'ISO 26262 is derived from IEC 61508 with automotive-specific requirements added' },
           { sourceClauses: ['3'], targetClauses: ['3'], description: 'Safety integrity levels (SIL) mapped to automotive safety integrity levels (ASIL)' },
           { sourceClauses: ['10'], targetClauses: ['11', '12', '13'], description: 'Software safety lifecycle requirements extended for automotive applications' }]),
        'ISO 26262 is directly derived from IEC 61508 for automotive applications. IEC 61508 provides the foundational functional safety principles, while ISO 26262 applies them specifically to automotive E/E systems.',
        j(['Automotive functional safety', 'ASIL methodology foundation', 'Safety lifecycle consistency', 'E/E system safety framework'])
      ],
      [
        'iec-60364', 'iec-61140', 'integrated',
        j([{ sourceClauses: ['4', '5'], targetClauses: ['5', '6'], description: 'Electrical installation protection measures directly implement IEC 61140 shock protection principles' },
           { sourceClauses: ['6', '7'], targetClauses: ['7', '8'], description: 'Protective measures in installations aligned with fundamental safety provisions' }]),
        'IEC 61140 sets the fundamental principles for protection against electric shock, while IEC 60364 implements these principles in low-voltage electrical installation design and construction. They form an integrated framework.',
        j(['Electric shock prevention', 'Installation safety', 'Protective measures alignment', 'Unified electrical safety framework'])
      ],
      [
        'iso-12100', 'iec-61508', 'complementary',
        j([{ sourceClauses: ['5.4', '5.5'], targetClauses: ['7.4', '7.6'], description: 'Risk reduction measures for E/E/PE safety-related systems complement machinery risk assessment' },
           { sourceClauses: ['6.2.3'], targetClauses: ['7.4.2'], description: 'Safeguarding and protective devices for machinery safety systems' }]),
        'ISO 12100 risk assessment for machinery and IEC 61508 functional safety for control systems are complementary standards. Modern machinery increasingly uses E/E/PE safety-related systems where both standards apply.',
        j(['Machine safety system design', 'Functional safety integration', 'PL/SIL correlation', 'Comprehensive machinery risk management'])
      ],
    ];
    for (const [src, tgt, type, clauses, notes, synergies] of relSeeds) {
      if (!hasRel(src, tgt)) insertRel.run(src, tgt, type, clauses, notes, synergies, ts5, ts5);
    }
  }

  // ── SEED: sso_providers (idempotent) ───────────────────────────────────────
  {
    const ssoCount = (sqlite.prepare('SELECT COUNT(*) as n FROM sso_providers').get() as any).n;
    if (ssoCount === 0) {
      const insertSSO = sqlite.prepare(`
        INSERT INTO sso_providers (name, protocol, status, icon, connected_users, last_sync, config, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const ts6 = Date.now();
      insertSSO.run('Okta', 'SAML 2.0', 'connected', '🔐', 342, '2 min ago', '{}', ts6, ts6);
      insertSSO.run('Azure AD', 'OpenID Connect', 'configured', '☁️', 0, 'Not synced', '{}', ts6, ts6);
      insertSSO.run('Google Workspace', 'OAuth 2.0', 'disconnected', '🔵', 0, 'N/A', '{}', ts6, ts6);
      insertSSO.run('OneLogin', 'SAML 2.0', 'disconnected', '🟣', 0, 'N/A', '{}', ts6, ts6);
    }
  }

  // ── SEED: security_audit_logs (idempotent) ─────────────────────────────────
  {
    const salCount = (sqlite.prepare('SELECT COUNT(*) as n FROM security_audit_logs').get() as any).n;
    if (salCount === 0) {
      const insertLog = sqlite.prepare(`
        INSERT INTO security_audit_logs (user_name, action, resource, field_name, old_value, new_value, ip_address, timestamp, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const ts7 = Date.now();
      const logSeeds: [string, string, string, string | null, string | null, string | null, string, string][] = [
        ['Sarah Chen', 'Updated', 'Incident #INC-2026-087', 'severity', 'Medium', 'High', '10.0.1.45', '2026-02-19 14:32:11'],
        ['Mike Torres', 'Created', 'Risk Assessment #RA-441', null, null, null, '10.0.2.12', '2026-02-19 14:28:03'],
        ['James Park', 'Viewed', 'Medical Record #MR-112', null, null, null, '10.0.1.88', '2026-02-19 14:15:47'],
        ['System', 'Auto-locked', 'User: contractor_temp_01', 'status', 'active', 'locked', 'system', '2026-02-19 13:59:22'],
        ['Admin', 'Exported', 'OSHA 300 Log', null, null, null, '10.0.1.1', '2026-02-19 13:45:00'],
        ['Lisa Wang', 'Deleted', 'Draft Checklist #CL-draft-19', null, null, null, '10.0.3.22', '2026-02-19 13:30:15'],
        ['Ahmed Hassan', 'Login Failed', 'Authentication', null, null, '3rd attempt', '192.168.1.100', '2026-02-19 13:12:44'],
      ];
      for (const [user, action, resource, field, oldVal, newVal, ip, ts_str] of logSeeds) {
        insertLog.run(user, action, resource, field, oldVal, newVal, ip, ts_str, ts7);
      }
    }
  }

  // ── SEED: email_templates (idempotent) ────────────────────────────────────
  {
    const etCount = (sqlite.prepare('SELECT COUNT(*) as n FROM email_templates').get() as any).n;
    if (etCount === 0) {
      const insertET = sqlite.prepare(`
        INSERT INTO email_templates (name, category, status, subject, description, icon_name, color, open_rate, click_rate, sent_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const tsET = Date.now();
      const etSeeds: [string, string, string, string, string, string, string, number, number, number][] = [
        ['Welcome Email', 'Onboarding', 'active', 'Welcome to SafetyMEG — Your Safety Command Center', 'Sent immediately after user signup. Introduces key features and first steps.', 'UserPlus', 'cyan', 68.4, 32.1, 1420],
        ['Onboarding Day 3', 'Onboarding', 'active', 'Have you tried AI Visual Audits yet?', 'Nudge users toward key activation features on day 3.', 'Eye', 'purple', 54.2, 24.8, 1180],
        ['Weekly Safety Digest', 'Engagement', 'active', 'Your Weekly Safety Report — 3 New Insights', 'Weekly summary of incidents, compliance status, and AI predictions.', 'BarChart3', 'blue', 45.6, 18.3, 4200],
        ['Compliance Deadline', 'Alerts', 'active', '⚠️ OSHA Audit Due in 7 Days — Action Required', 'Automated alert triggered by upcoming compliance deadlines.', 'ShieldCheck', 'amber', 78.9, 45.2, 340],
        ['Incident Alert', 'Alerts', 'active', '🚨 Critical Incident Reported — Immediate Review', 'Real-time notification when critical incidents are filed.', 'AlertCircle', 'red', 92.1, 67.4, 86],
        ['Re-engagement', 'Retention', 'active', "We miss you! Here's what's new in SafetyMEG", 'Sent to users inactive for 14+ days with feature updates.', 'RefreshCw', 'emerald', 38.7, 15.2, 620],
        ['Training Reminder', 'Training', 'active', 'Certification Expiring — Complete Your Safety Training', 'Automated reminder for expiring certifications.', 'Calendar', 'violet', 62.3, 38.9, 290],
        ['Monthly Report', 'Reports', 'paused', 'January 2026 — Your Monthly Safety Performance Report', 'Comprehensive monthly summary of safety metrics and KPIs.', 'FileText', 'indigo', 51.8, 22.4, 1100],
      ];
      for (const [name, cat, status, subject, desc, icon, color, openRate, clickRate, sentCount] of etSeeds) {
        insertET.run(name, cat, status, subject, desc, icon, color, openRate, clickRate, sentCount, tsET, tsET);
      }
    }
  }

  // ── SEED: automation_workflows (idempotent) ────────────────────────────────
  {
    const awCount = (sqlite.prepare('SELECT COUNT(*) as n FROM automation_workflows').get() as any).n;
    if (awCount === 0) {
      const insertAW = sqlite.prepare(`
        INSERT INTO automation_workflows (name, trigger_event, emails_count, status, delivery_rate, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const tsAW = Date.now();
      const awSeeds: [string, string, number, string, number][] = [
        ['New User Welcome Sequence', 'User signs up', 5, 'active', 99.2],
        ['Onboarding Drip Campaign', 'First login', 7, 'active', 98.8],
        ['Compliance Alert Pipeline', 'Deadline approaching', 3, 'active', 99.5],
        ['Incident Escalation Chain', 'Critical incident', 4, 'active', 99.9],
        ['Win-Back Campaign', 'Inactive 30 days', 4, 'testing', 97.6],
        ['Training Renewal Series', 'Cert expires in 30d', 3, 'active', 98.4],
      ];
      for (const [name, trigger, emails, status, deliveryRate] of awSeeds) {
        insertAW.run(name, trigger, emails, status, deliveryRate, tsAW, tsAW);
      }
    }
  }

  console.log('✅ Database initialized successfully!');
  console.log('Tables created:');
  console.log('  - users');
  console.log('  - incidents');
  console.log('  - checklists');
  console.log('  - checklist_items');
  console.log('  - gamification_stats');
  console.log('  - kpi_metrics');
  console.log('  - compliance_alerts');
  console.log('  - injury_reports');
  console.log('  - vehicle_incidents');
  console.log('  - property_incidents');
  console.log('  - near_misses');
  console.log('  - investigations');
  console.log('  - rcca');
  console.log('  - bowtie_scenarios');
  console.log('  - bowtie_barriers');
  console.log('  - audit_trail');
  console.log('  - capa_records');
  console.log('  - safety_controls');
  console.log('  - control_barriers');
  console.log('  - risk_control_links');
  console.log('  - capa_verifications');
  console.log('  - training_courses');
  console.log('  - employee_training');
  console.log('  - training_assignments');
  console.log('  - training_matrix');
  console.log('  - hazard_templates');
  console.log('  - risk_assessments');
  console.log('  - risk_register');
  console.log('  - audit_templates');
  console.log('  - audits');
  console.log('  - audit_findings');
  console.log('  - compliance_requirements');
  console.log('  - inspection_schedule');
  console.log('  - sensor_configurations');
  console.log('  - sensor_readings');
  console.log('  - sensor_calibrations');
  console.log('  - report_templates');
  console.log('  - scheduled_reports');
  console.log('  - compliance_reports');
  console.log('  - compliance_metrics');
  console.log('  - projects');
  console.log('  - project_tasks');
  console.log('  - task_comments');
  console.log('  - project_safety_metrics');
  console.log('  - project_sprints');
  console.log('  - project_epics');
  console.log('  - sprint_retrospectives');
  console.log('  - sprint_retro_items');
  console.log('  - sprint_settings');
  console.log('  - assets');
  console.log('  - asset_maintenance');
  console.log('  - workers');
  console.log('  - worker_assignments');
  console.log('  - worker_performance');
  console.log('  - approvals');
  console.log('  - leaderboard');
  console.log('  - notifications');
  console.log('  - notification_preferences');
  console.log('  - notification_templates');
  console.log('  - automation_rules');
  console.log('  - webhook_configs');
  console.log('  - esg_metrics');
  console.log('  - sustainability_goals');
  console.log('  - quality_non_conformities');
  console.log('  - hygiene_assessments');
  console.log('  - contractors');
  console.log('  - contractor_permits');
  console.log('  - permit_to_work (extended)');
  console.log('  - compliance_procedures');
  console.log('  - regulations');
  console.log('  - chemicals');
  console.log('  - sds_documents');
  console.log('  - toolbox_talks');
  console.log('  - toolbox_attendance');
  console.log('  - certifications');
  console.log('  - gap_analysis_reports');
  console.log('  - compliance_calendar');
  console.log('  - international_standards');
  console.log('  - nfpa_codes');
  console.log('  - standard_relationships');
  console.log('  - safety_observations');
  console.log('  - sif_precursors');
  console.log('  - standard_certifications');
  console.log('  - custom_checklists');
  console.log('  - custom_apps');
  console.log('  - custom_reports');
  console.log('  - sso_providers');
  console.log('  - security_audit_logs');
  console.log('  - permit_to_work');
  console.log('  - ptw_approvals');
  console.log('  - hazard_reports');
  console.log('  - safety_procedures');
  console.log('  - kpi_definitions');
  console.log('  - kpi_readings');
  console.log('  - email_templates');
  console.log('  - automation_workflows');
  console.log('  - email_campaigns');
  console.log('\nIndexes created for better query performance.');
  
} catch (error) {
  console.error('❌ Database initialization error:', error);
  process.exit(1);
} finally {
  sqlite.close();
}
