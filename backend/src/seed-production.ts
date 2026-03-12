/**
 * Production Seed Script
 * Populates all key tables with realistic EHS demo data.
 * Safe to run multiple times – skips if data already exists.
 * Run with: tsx src/seed-production.ts
 */

import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

const isProd = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const dbPath = isProd ? '/data/local.sqlite' : 'local.sqlite';

const dbDir = dirname(dbPath);
if (dbDir !== '.' && !existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF');

// Epoch seconds (for most tables that use strftime('%s','now') or unixepoch())
const secsNow = () => Math.floor(Date.now() / 1000);
const secsAgo = (d: number) => Math.floor(Date.now() / 1000 - d * 86400);
// Epoch milliseconds (for tables that use unixepoch()*1000)
const msNow = () => Date.now();
const msAgo = (d: number) => Date.now() - d * 86400000;
// ISO date strings
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString().split('T')[0];

function count(table: string): number {
  try { return (db.prepare(`SELECT COUNT(*) as n FROM ${table}`).get() as any).n; }
  catch { return -1; }
}

function seed(label: string, table: string, fn: () => void) {
  const n = count(table);
  if (n < 0) { console.log(`  ⚠️  Table not found: ${table}`); return; }
  if (n > 0) { console.log(`  ✓  ${label} already has ${n} rows — skipping`); return; }
  fn();
  console.log(`  ✅ ${label}: seeded ${count(table)} rows`);
}

console.log('\n🌱 SafetyMEG Production Seed Script');
console.log('====================================');

// ── 1. WORKERS ─────────────────────────────────────────────────────────────
// Schema: employee_id, name, email, phone, department, role, job_title, hire_date, status, created_at, updated_at (ms)
seed('workers', 'workers', () => {
  const stmt = db.prepare(`INSERT INTO workers
    (employee_id, name, department, email, phone, role, job_title, hire_date, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`);
  const workers = [
    ['EMP001', 'Ahmed Hassan',      'Operations',       'ahmed.hassan@safetymeg.com',    '+1-555-0101', 'Field Engineer',     'Field Engineer',        daysAgo(720)],
    ['EMP002', 'Maria Santos',      'HSE Department',   'maria.santos@safetymeg.com',    '+1-555-0102', 'Safety Officer',     'HSE Safety Officer',    daysAgo(600)],
    ['EMP003', 'James Wilson',      'Maintenance',      'james.wilson@safetymeg.com',    '+1-555-0103', 'Maintenance Tech',   'Maintenance Technician',daysAgo(540)],
    ['EMP004', 'Fatima Al-Rashid',  'Quality Assurance','fatima.rashid@safetymeg.com',   '+1-555-0104', 'QA Inspector',       'Quality Assurance Inspector', daysAgo(480)],
    ['EMP005', 'Carlos Rivera',     'Operations',       'carlos.rivera@safetymeg.com',   '+1-555-0105', 'Site Supervisor',    'Site Supervisor',       daysAgo(420)],
    ['EMP006', 'Sarah Chen',        'HSE Department',   'sarah.chen@safetymeg.com',      '+1-555-0106', 'EHS Coordinator',    'EHS Coordinator',       daysAgo(365)],
    ['EMP007', 'Mohammed Ali',      'Engineering',      'mohammed.ali@safetymeg.com',    '+1-555-0107', 'Process Engineer',   'Process Engineer',      daysAgo(300)],
    ['EMP008', 'Emma Thompson',     'Administration',   'emma.thompson@safetymeg.com',   '+1-555-0108', 'HR Manager',         'Human Resources Manager', daysAgo(280)],
    ['EMP009', 'Raj Patel',         'Maintenance',      'raj.patel@safetymeg.com',       '+1-555-0109', 'Electrical Tech',    'Electrical Technician', daysAgo(240)],
    ['EMP010', 'Lisa Johnson',      'Operations',       'lisa.johnson@safetymeg.com',    '+1-555-0110', 'Operations Lead',    'Operations Lead',       daysAgo(200)],
    ['EMP011', 'David Kim',         'Engineering',      'david.kim@safetymeg.com',       '+1-555-0111', 'Safety Engineer',    'Safety Engineer',       daysAgo(180)],
    ['EMP012', 'Aisha Okonkwo',     'HSE Department',   'aisha.okonkwo@safetymeg.com',   '+1-555-0112', 'EHS Analyst',        'EHS Data Analyst',      daysAgo(150)],
    ['EMP013', 'Pedro Morales',     'Maintenance',      'pedro.morales@safetymeg.com',   '+1-555-0113', 'Mechanical Tech',    'Mechanical Technician', daysAgo(120)],
    ['EMP014', 'Yuki Tanaka',       'Quality Assurance','yuki.tanaka@safetymeg.com',     '+1-555-0114', 'Quality Manager',    'Quality Manager',       daysAgo(100)],
    ['EMP015', 'Omar Shaikh',       'Operations',       'omar.shaikh@safetymeg.com',     '+1-555-0115', 'Operations Tech',    'Operations Technician', daysAgo(60)],
    ['EMP016', 'Nadia Petrov',      'Engineering',      'nadia.petrov@safetymeg.com',    '+1-555-0116', 'Risk Analyst',       'Risk & Safety Analyst', daysAgo(30)],
  ];
  const t = db.transaction(() => {
    workers.forEach(([id, name, dept, email, phone, role, title, hire]) => {
      stmt.run(id, name, dept, email, phone, role, title, hire, msNow(), msNow());
    });
  });
  t();
});

// ── 2. INCIDENTS ───────────────────────────────────────────────────────────
// Schema: incident_date, incident_time, location, department, incident_type, severity, description, status, assigned_to, created_at, updated_at (secs)
seed('incidents', 'incidents', () => {
  const stmt = db.prepare(`INSERT INTO incidents
    (incident_date, incident_time, location, department, incident_type, severity,
     description, status, assigned_to, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const incidents = [
    [daysAgo(5),  '09:15', 'Plant A - Line 3',     'Operations',     'Near Miss',        'Low',      'Worker slipped on wet floor near loading bay. No injury. Anti-slip matting installed.', 'closed',        'Maria Santos',  secsAgo(5),  secsAgo(2)],
    [daysAgo(12), '14:30', 'Maintenance Bay',       'Maintenance',    'Equipment Failure','Medium',   'Hydraulic pump failure caused pressure release. Equipment isolated and repaired.',      'closed',        'James Wilson',  secsAgo(12), secsAgo(8)],
    [daysAgo(18), '08:45', 'Chemical Storage',      'HSE Department', 'Chemical Spill',   'High',     'Minor chemical spill during transfer. Contained within berm. Environmental team notified.','investigating','Sarah Chen',    secsAgo(18), secsAgo(5)],
    [daysAgo(25), '11:20', 'Warehouse B',           'Operations',     'Property Damage',  'Medium',   'Forklift struck racking system causing minor structural damage. Cleared after inspection.',  'closed',    'Carlos Rivera', secsAgo(25), secsAgo(15)],
    [daysAgo(33), '16:05', 'Workshop',              'Maintenance',    'Near Miss',        'Low',      'Dropped tool from elevated work platform. Exclusion zone now implemented.',                'closed',        'Raj Patel',     secsAgo(33), secsAgo(28)],
    [daysAgo(45), '10:30', 'Plant B - Reactor',     'Engineering',    'Process Deviation','High',     'Temperature exceeded upper control limit. Emergency shutdown activated. No injuries.',    'investigating', 'Mohammed Ali',  secsAgo(45), secsAgo(10)],
    [daysAgo(52), '13:45', 'Loading Dock',          'Operations',     'Vehicle Incident', 'Medium',   'Delivery vehicle struck dock bumper at low speed. Minor bodywork damage only.',            'closed',        'Lisa Johnson',  secsAgo(52), secsAgo(40)],
    [daysAgo(60), '07:30', 'Roof Access',           'Maintenance',    'Near Miss',        'High',     'Worker accessed roof without fall protection permit completed. Immediate stop-work issued.','closed',       'David Kim',     secsAgo(60), secsAgo(55)],
    [daysAgo(72), '15:00', 'Electrical Substation', 'Engineering',    'Near Miss',        'Critical', 'Arc flash event during panel inspection. PPE worn — no injury. Procedure review initiated.','investigating', 'Nadia Petrov',  secsAgo(72), secsAgo(3)],
    [daysAgo(85), '09:00', 'Plant A - Line 1',      'Operations',     'Injury',           'Medium',   'Worker sustained minor laceration from sharp edge. First aid administered. Not RIDDOR reportable.', 'closed', 'Maria Santos', secsAgo(85), secsAgo(80)],
    [daysAgo(95), '11:30', 'Canteen Area',          'Administration', 'Near Miss',        'Low',      'Slip hazard identified near dishwasher. Floor drained and anti-slip surface applied.',    'closed',        'Emma Thompson', secsAgo(95), secsAgo(90)],
    [daysAgo(105),'14:20', 'Plant B - Packaging',   'Operations',     'Equipment Failure','Medium',   'Conveyor belt jammed. Machine guarding found displaced during investigation.',             'open',          'Carlos Rivera', secsAgo(105),secsAgo(100)],
    [daysAgo(120),'08:15', 'QA Laboratory',         'Quality Assurance','Chemical Spill', 'Low',      'Sample spill in fume hood. Contained correctly. SDS procedure followed.',                 'closed',        'Yuki Tanaka',   secsAgo(120),secsAgo(115)],
    [daysAgo(135),'16:45', 'Parking Area',          'Administration', 'Vehicle Incident', 'Low',      'Minor collision between company vehicles at low speed in car park. No injuries.',         'closed',        'Emma Thompson', secsAgo(135),secsAgo(130)],
    [daysAgo(148),'10:00', 'Plant A - Boiler Room', 'Maintenance',    'Process Deviation','High',     'Steam pressure exceeded safe limit. Safety relief valve activated correctly.',             'closed',        'James Wilson',  secsAgo(148),secsAgo(140)],
  ];
  const t = db.transaction(() => {
    incidents.forEach(row => stmt.run(...row));
  });
  t();
});

// ── 3. CAPA RECORDS ────────────────────────────────────────────────────────
// Schema: title, description, capa_type, priority, department, assigned_to, due_date, status, created_at, updated_at (secs)
seed('capa_records', 'capa_records', () => {
  const stmt = db.prepare(`INSERT INTO capa_records
    (title, description, capa_type, priority, department, assigned_to, due_date, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const capas = [
    ['Install Anti-Slip Flooring — Loading Bay',    'Replace smooth flooring with high-traction anti-slip surface in all wet work areas',                          'Corrective', 'High',     'Operations',     'Carlos Rivera',  daysAgo(-14), 'In Progress', secsAgo(5),   secsAgo(2)],
    ['Chemical Transfer SOP Update',                'Update SOP for chemical transfer to include additional containment verification steps',                       'Corrective', 'Critical', 'HSE Department', 'Sarah Chen',     daysAgo(-7),  'Open',        secsAgo(18),  secsAgo(5)],
    ['Hydraulic System PM Schedule',                'Implement quarterly preventive maintenance for all hydraulic systems with pressure testing',                 'Preventive', 'Medium',   'Maintenance',    'James Wilson',   daysAgo(-21), 'In Progress', secsAgo(12),  secsAgo(8)],
    ['Arc Flash Hazard Assessment',                 'Commission third-party arc flash study for all electrical panels and implement labeling program',            'Corrective', 'Critical', 'Engineering',    'Nadia Petrov',   daysAgo(-30), 'Open',        secsAgo(72),  secsAgo(3)],
    ['Fall Protection Training Refresher',          'Mandatory fall protection and PTW refresher training for all maintenance personnel',                         'Preventive', 'High',     'Maintenance',    'David Kim',      daysAgo(5),   'Completed',   secsAgo(60),  secsAgo(10)],
    ['Forklift Operator Re-Assessment',             'Conduct competency re-assessment for all forklift operators following warehouse incident',                   'Corrective', 'Medium',   'Operations',     'Lisa Johnson',   daysAgo(2),   'Completed',   secsAgo(25),  secsAgo(3)],
    ['Machine Guarding Audit — Plant B',            'Inspect all machine guarding across Plant B packaging line and implement corrective actions',                'Corrective', 'High',     'Operations',     'Carlos Rivera',  daysAgo(-14), 'In Progress', secsAgo(105), secsAgo(20)],
    ['Process Temperature Interlock Review',        'Review and update high-temperature interlock setpoints for Plant B reactor with independent validation',    'Corrective', 'Critical', 'Engineering',    'Mohammed Ali',   daysAgo(-10), 'In Progress', secsAgo(45),  secsAgo(5)],
    ['Safety Observation Programme Launch',         'Launch monthly safety observation programme across all departments to proactively identify hazards',        'Preventive', 'Medium',   'HSE Department', 'Maria Santos',   daysAgo(-45), 'Open',        secsAgo(3),   secsAgo(3)],
    ['Emergency Response Drills Q1',                'Plan and execute three emergency response drills (fire, spill, evacuation) this quarter',                   'Preventive', 'Medium',   'HSE Department', 'Aisha Okonkwo',  daysAgo(-30), 'In Progress', secsAgo(20),  secsAgo(10)],
  ];
  const t = db.transaction(() => {
    capas.forEach(row => stmt.run(...row));
  });
  t();
});

// ── 4. KPI METRICS ─────────────────────────────────────────────────────────
// Schema: metric_name, value, target, period, unit, timestamp (secs)
seed('kpi_metrics', 'kpi_metrics', () => {
  const stmt = db.prepare(`INSERT INTO kpi_metrics (metric_name, value, target, period, unit, timestamp) VALUES (?, ?, ?, ?, ?, ?)`);
  const months = ['2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03'];
  const t = db.transaction(() => {
    months.forEach((period, i) => {
      const ts = secsAgo((6 - i) * 30);
      stmt.run('Total Recordable Incident Rate', Math.max(0, Math.round(2.1 - i * 0.15)), 2,   period, 'per 200k hrs', ts);
      stmt.run('Lost Time Injury Frequency',     Math.max(0, Math.round(0.8 - i * 0.08)), 1,   period, 'per 200k hrs', ts);
      stmt.run('Training Compliance',             75 + i * 3,                               95,  period, '%',            ts);
      stmt.run('Near Miss Reporting Rate',        45 + i * 5,                               80,  period, '%',            ts);
      stmt.run('CAPA Closure Rate',               55 + i * 6,                               90,  period, '%',            ts);
      stmt.run('Compliance Rate',                 78 + i * 2,                               96,  period, '%',            ts);
      stmt.run('Safety Score',                    82 + i * 2,                               95,  period, '%',            ts);
    });
  });
  t();
});

// ── 5. COMPLIANCE ALERTS ───────────────────────────────────────────────────
// Schema: alert_type, message, severity, category, is_resolved, created_at (secs)
seed('compliance_alerts', 'compliance_alerts', () => {
  const stmt = db.prepare(`INSERT INTO compliance_alerts (alert_type, message, severity, category, is_resolved, created_at) VALUES (?, ?, ?, ?, ?, ?)`);
  const t = db.transaction(() => {
    stmt.run('overdue_capa',     '3 CAPA records overdue — corrective action required',                            'critical', 'CAPA',       0, secsAgo(2));
    stmt.run('training_gap',     'Training compliance at 84% — 3 workers need certification renewal',              'warning',  'Training',   0, secsAgo(5));
    stmt.run('inspection_due',   'Monthly machinery inspection due in 3 days — Plant A Line 2',                    'warning',  'Inspection', 0, secsAgo(1));
    stmt.run('chemical_storage', 'Chemical storage audit overdue by 7 days',                                       'critical', 'Compliance', 0, secsAgo(7));
    stmt.run('permit_expiry',    'Hot work permit #PTW-0042 expires tomorrow',                                     'warning',  'Permits',    0, secsAgo(1));
    stmt.run('risk_review',      '5 risk assessments require annual review this month',                            'info',     'Risk',       0, secsAgo(10));
    stmt.run('ppe_inspection',   'PPE stock inspection required — Q1 cycle',                                       'info',     'PPE',        0, secsAgo(15));
    stmt.run('drill_scheduled',  'Fire drill scheduled for next Thursday — communications required',               'info',     'Emergency',  0, secsAgo(20));
  });
  t();
});

// ── 6. RISK REGISTER ───────────────────────────────────────────────────────
// Schema: risk_code (UNIQUE), hazard, consequence, likelihood (INT), severity (INT), risk_score (INT),
//         risk_level, mitigation, control_type, responsible_person, target_date, status, department, location, created_at, updated_at (secs)
seed('risk_register', 'risk_register', () => {
  const stmt = db.prepare(`INSERT INTO risk_register
    (risk_code, hazard, consequence, likelihood, severity, risk_score, risk_level,
     mitigation, control_type, responsible_person, target_date, status, department, location, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const risks = [
    ['RR-001', 'Chemical Exposure — VOC Solvents',     'Occupational illness / lung damage from chronic solvent inhalation',         3, 4, 12, 'High',   'LEV installed, PPE mandatory, atmospheric monitoring in place', 'Engineering',   'Sarah Chen',    daysAgo(-30), 'Open',      'HSE Department', 'Chemical Storage A', secsAgo(45), secsAgo(10)],
    ['RR-002', 'Manual Handling — Heavy Components',   'Musculoskeletal injury from repeated heavy lifting in maintenance tasks',    4, 3, 12, 'High',   'Task risk assessment, mechanical lifting aids provided, training completed', 'Administrative','James Wilson',   daysAgo(-60), 'Mitigated', 'Maintenance',    'Maintenance Bay',    secsAgo(90), secsAgo(20)],
    ['RR-003', 'Working at Height — Plant B Roof',     'Fatal or serious injury from fall during planned maintenance activities',    2, 5, 10, 'High',   'PTW mandatory, edge protection installed, harness inspection programme',    'Engineering',   'David Kim',     daysAgo(-14), 'Open',      'Maintenance',    'Plant B Roof',       secsAgo(120),secsAgo(5)],
    ['RR-004', 'Electrical Arc Flash — Substation',    'Severe burn injuries or fatality during HV equipment maintenance',          2, 5, 10, 'High',   'Arc flash study commissioned, PPE cat 4 mandatory, isolation procedure updated','PPE',        'Nadia Petrov',  daysAgo(-7),  'Open',      'Engineering',    'Main Substation',    secsAgo(72), secsAgo(3)],
    ['RR-005', 'Forklift — Pedestrian Interaction',    'Collision causing serious injury or fatality in shared warehouse space',     3, 3,  9, 'Medium', 'Segregated pedestrian routes, speed limiters, proximity warning system',    'Administrative','Carlos Rivera',  daysAgo(-90), 'Mitigated', 'Operations',     'Warehouse B',        secsAgo(25), secsAgo(15)],
    ['RR-006', 'Process Overpressure — Reactor R-01',  'Explosion / structural damage from pressure vessel failure',                2, 5, 10, 'High',   'PRV installed and tested, interlock review in progress, additional monitoring','Engineering', 'Mohammed Ali',  daysAgo(-10), 'Open',      'Engineering',    'Plant B Reactor Bay',secsAgo(45), secsAgo(5)],
    ['RR-007', 'Noise — Production Floor Operations',  'Noise-induced hearing loss (NIHL) from prolonged >85dB exposure',          4, 2,  8, 'Medium', 'Hearing protection zones defined, audiometry programme, engineering controls','PPE',         'Aisha Okonkwo', daysAgo(-120),'Mitigated', 'Operations',     'Plant A Production', secsAgo(200),secsAgo(60)],
    ['RR-008', 'Contractor Safety — Competency Gap',   'Incidents caused by contractor unfamiliarity with site safety requirements',3, 3,  9, 'Medium', 'Contractor induction updated, safety file required pre-mobilisation',       'Administrative','Maria Santos',   daysAgo(-30), 'Open',      'HSE Department', 'All Sites',          secsAgo(30), secsAgo(10)],
    ['RR-009', 'Emergency Response — Night Shift',     'Delayed response to emergency incident during low-staffing overnight period',2,4,  8, 'Medium', 'On-call emergency response team established, training refreshers scheduled', 'Administrative','Sarah Chen',    daysAgo(-21), 'Open',      'HSE Department', 'All Sites',          secsAgo(20), secsAgo(5)],
    ['RR-010', 'Hand Arm Vibration — Power Tools',     'HAVS from prolonged use of angle grinders and pneumatic tools',            3, 3,  9, 'Medium', 'HAV register maintained, daily exposure limits enforced, health surveillance','Administrative','Raj Patel',     daysAgo(-150),'Mitigated', 'Maintenance',    'Maintenance Workshop',secsAgo(300),secsAgo(100)],
    ['RR-011', 'Lone Working — Extended Night Shifts', 'Lack of monitoring for lone workers creates delayed emergency response',    3, 3,  9, 'Medium', 'Lone worker check-in app deployed, buddy system for high-risk tasks',       'Administrative','Lisa Johnson',   daysAgo(-14), 'Open',      'Operations',     'Plant A & B',        secsAgo(15), secsAgo(5)],
    ['RR-012', 'Slips / Trips — Wet Weather',          'Slip and trip incidents on outdoor walkways during inclement weather',      4, 2,  8, 'Medium', 'Anti-slip surfaces on all external routes, grit bins in place, inspection protocol','PPE',    'Ahmed Hassan',  daysAgo(-365),'Mitigated', 'Operations',     'External Walkways',  secsAgo(720),secsAgo(200)],
  ];
  const t = db.transaction(() => {
    risks.forEach(row => stmt.run(...row));
  });
  t();
});

// ── 7. AUDITS ──────────────────────────────────────────────────────────────
// Schema: audit_number (UNIQUE), title, audit_type, location, department, scheduled_date, completed_date,
//         lead_auditor, status, overall_score, total_items, passed_items, failed_items, created_at, updated_at (secs)
seed('audits', 'audits', () => {
  const stmt = db.prepare(`INSERT INTO audits
    (audit_number, title, audit_type, location, department, scheduled_date, completed_date,
     lead_auditor, status, overall_score, total_items, passed_items, failed_items, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const audits = [
    ['AUD-2026-001', 'Q1 HSE Management System Audit',    'Internal',    'Administration Block','HSE Department',    daysAgo(10), daysAgo(8),  'Sarah Chen',      'Completed',   88, 50, 44, 4, secsAgo(30), secsAgo(8)],
    ['AUD-2026-002', 'Fire Safety Inspection — Plant A',  'Internal',    'Plant A',             'Operations',        daysAgo(15), daysAgo(12), 'David Kim',       'Completed',   92, 30, 28, 2, secsAgo(20), secsAgo(12)],
    ['AUD-2026-003', 'Chemical Storage Compliance Audit', 'Regulatory',  'Chemical Storage',    'HSE Department',    daysAgo(7),  null,        'External Auditor','Overdue',      0, 40,  0, 0, secsAgo(30), secsAgo(30)],
    ['AUD-2026-004', 'Contractor Safety Audit',           'Internal',    'All Sites',           'HSE Department',    daysAgo(20), daysAgo(18), 'Maria Santos',    'Completed',   79, 35, 28, 7, secsAgo(40), secsAgo(18)],
    ['AUD-2026-005', 'Electrical Safety Inspection',      'Internal',    'Main Substation',     'Engineering',       daysAgo(-5), null,        'Nadia Petrov',    'Scheduled',    0, 25,  0, 0, secsAgo(5),  secsAgo(2)],
    ['AUD-2025-006', 'ISO 45001 Gap Analysis',            'Certification','All Departments',     'All Departments',   daysAgo(45), daysAgo(40), 'External Auditor','Completed',   84, 80, 67,12, secsAgo(60), secsAgo(40)],
    ['AUD-2025-007', 'Environmental Compliance Review',   'Regulatory',  'All Sites',           'HSE Department',    daysAgo(60), daysAgo(58), 'Aisha Okonkwo',   'Completed',   91, 45, 41, 3, secsAgo(75), secsAgo(58)],
    ['AUD-2026-008', 'Plant B Process Safety Review',     'Internal',    'Plant B',             'Engineering',       daysAgo(-10),null,        'Mohammed Ali',    'Scheduled',    0, 60,  0, 0, secsAgo(10), secsAgo(3)],
    ['AUD-2025-009', 'PPE Inspection & Inventory Audit',  'Internal',    'All Sites',           'Operations',        daysAgo(90), daysAgo(88), 'Maria Santos',    'Completed',   95, 20, 19, 1, secsAgo(100),secsAgo(88)],
    ['AUD-2025-010', 'Training Records Compliance Check', 'Internal',    'Administration Block','Administration',    daysAgo(120),daysAgo(118),'Emma Thompson',   'Completed',   87, 60, 52, 5, secsAgo(130),secsAgo(118)],
  ];
  const t = db.transaction(() => {
    audits.forEach(row => stmt.run(...row));
  });
  t();
});

// ── 8. INSPECTION SCHEDULE ─────────────────────────────────────────────────
// Schema: title, inspection_type, location, assigned_to, recurrence, scheduled_date, status, priority, created_at, updated_at (ms)
seed('inspection_schedule', 'inspection_schedule', () => {
  const stmt = db.prepare(`INSERT INTO inspection_schedule
    (title, inspection_type, location, assigned_to, recurrence, scheduled_date, status, priority, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const inspections = [
    ['Monthly Machinery Inspection — Plant A',   'Machinery',      'Plant A',              'James Wilson',    'monthly',   daysAgo(-3),  'scheduled', 'high',   msAgo(30), msAgo(30)],
    ['Weekly Fire Extinguisher Check',           'Fire Safety',    'All Buildings',        'David Kim',       'weekly',    daysAgo(-1),  'scheduled', 'medium', msAgo(7),  msAgo(7)],
    ['Chemical Storage Quarterly Audit',         'Chemical',       'Chemical Store A',     'Sarah Chen',      'quarterly', daysAgo(7),   'overdue',   'high',   msAgo(10), msAgo(10)],
    ['Electrical Panel Inspection',              'Electrical',     'Substation Main',      'Nadia Petrov',    'monthly',   daysAgo(-5),  'scheduled', 'high',   msAgo(15), msAgo(15)],
    ['PPE Condition Check — Operations',         'PPE',            'Plant A & B',          'Carlos Rivera',   'monthly',   daysAgo(-7),  'scheduled', 'medium', msAgo(20), msAgo(20)],
    ['Forklift Pre-Use Inspection',              'Equipment',      'Warehouse B',          'Ahmed Hassan',    'daily',     daysAgo(0),   'overdue',   'high',   msAgo(2),  msAgo(2)],
    ['Scaffolding Safety Inspection',            'Working at Height','Plant B Exterior',   'David Kim',       'weekly',    daysAgo(3),   'overdue',   'high',   msAgo(3),  msAgo(3)],
    ['Emergency Exit Inspection',                'Emergency',      'All Sites',            'Maria Santos',    'monthly',   daysAgo(-14), 'scheduled', 'medium', msAgo(7),  msAgo(7)],
    ['Noise Level Survey — Plant Operations',    'Environmental',  'Plant A & B',          'Aisha Okonkwo',   'quarterly', daysAgo(-30), 'scheduled', 'low',    msAgo(14), msAgo(14)],
    ['Ergonomics Workstation Review',            'Ergonomics',     'Administration Block', 'Emma Thompson',   'bi-annual', daysAgo(-21), 'completed', 'low',    msAgo(5),  msAgo(2)],
    ['Hazardous Substance Inventory Review',     'Chemical',       'Chemical Store B',     'Fatima Al-Rashid','monthly',   daysAgo(-14), 'scheduled', 'high',   msAgo(10), msAgo(10)],
    ['Confined Space Entry Checks',              'Process Safety', 'Plant B Basement',     'Mohammed Ali',    'weekly',    daysAgo(-7),  'scheduled', 'high',   msAgo(5),  msAgo(5)],
  ];
  const t = db.transaction(() => {
    inspections.forEach(row => stmt.run(...row));
  });
  t();
});

// ── 9. TRAINING COURSES ────────────────────────────────────────────────────
// Schema: course_code (UNIQUE NOT NULL), title, category, description, duration_hours, validity_months, is_active, created_at, updated_at (secs)
seed('training_courses', 'training_courses', () => {
  const stmt = db.prepare(`INSERT INTO training_courses
    (course_code, title, category, description, duration_hours, validity_months, delivery_method, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`);
  const courses = [
    ['FIRE-001', 'Fire Safety Awareness',         'Safety',        'Annual fire safety refresher covering evacuation procedures, extinguisher types and fire prevention',     2,  12, 'Classroom', secsAgo(365), secsAgo(30)],
    ['MH-001',   'Manual Handling',               'Ergonomics',    'Practical training on safe manual handling techniques and risk assessment for physical tasks',            3,  36, 'Classroom', secsAgo(365), secsAgo(60)],
    ['CHEM-001', 'Chemical Awareness (COSHH)',    'Chemical',      'COSHH regulations, hazard identification, SDS reading and chemical emergency procedures',                4,  12, 'Classroom', secsAgo(300), secsAgo(45)],
    ['WAH-001',  'Working at Height',             'Safety',        'Risk assessment, PTW, harness inspection and rescue procedures for elevated work activities',            6,  12, 'Classroom', secsAgo(280), secsAgo(20)],
    ['FA-001',   'First Aid at Work',             'Medical',       'Certified 3-day first aid course covering CPR, wound care, and emergency response',                     24,  36, 'Classroom', secsAgo(365), secsAgo(90)],
    ['ELEC-001', 'Electrical Safety Awareness',   'Electrical',    'Safe isolation, PAT testing awareness, arc flash hazards and lockout-tagout procedures',                4,  12, 'Classroom', secsAgo(250), secsAgo(30)],
    ['FLT-001',  'Forklift Truck Operation',      'Equipment',     'Counterbalance FLT operator certification including pre-use checks and safe operation',                 16,  36, 'Practical', secsAgo(200), secsAgo(15)],
    ['ISO-001',  'ISO 45001 Internal Auditor',    'Compliance',    'Clause-by-clause ISO 45001 training with audit planning, evidence gathering and reporting',             16,  36, 'Classroom', secsAgo(180), secsAgo(10)],
    ['ERP-001',  'Emergency Response Procedures', 'Emergency',     'Site emergency response including bomb threat, chemical spill, fire and medical emergency',             3,  12, 'Blended',   secsAgo(365), secsAgo(20)],
    ['PTW-001',  'Permit to Work System',         'Process Safety','PTW system overview covering hot work, confined space, electrical and working at height permits',      4,  12, 'Classroom', secsAgo(150), secsAgo(8)],
  ];
  const t = db.transaction(() => {
    courses.forEach(row => stmt.run(...row));
  });
  t();
});

// ── 10. EMPLOYEE TRAINING ──────────────────────────────────────────────────
// Schema: employee_id, employee_name, role (NOT NULL), department, course_code (NOT NULL), course_name,
//         completion_date, expiration_date, status, score, created_at, updated_at (secs)
seed('employee_training', 'employee_training', () => {
  const stmt = db.prepare(`INSERT INTO employee_training
    (employee_id, employee_name, role, department, course_code, course_name,
     completion_date, expiration_date, status, score, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  type EmpRow = [string, string, string, string];
  const employees: EmpRow[] = [
    ['EMP001','Ahmed Hassan',      'Field Engineer',        'Operations'],
    ['EMP002','Maria Santos',      'Safety Officer',        'HSE Department'],
    ['EMP003','James Wilson',      'Maintenance Tech',      'Maintenance'],
    ['EMP004','Fatima Al-Rashid',  'QA Inspector',          'Quality Assurance'],
    ['EMP005','Carlos Rivera',     'Site Supervisor',       'Operations'],
    ['EMP006','Sarah Chen',        'EHS Coordinator',       'HSE Department'],
    ['EMP007','Mohammed Ali',      'Process Engineer',      'Engineering'],
    ['EMP008','Emma Thompson',     'HR Manager',            'Administration'],
    ['EMP009','Raj Patel',         'Electrical Tech',       'Maintenance'],
    ['EMP010','Lisa Johnson',      'Operations Lead',       'Operations'],
    ['EMP011','David Kim',         'Safety Engineer',       'Engineering'],
    ['EMP012','Aisha Okonkwo',     'EHS Analyst',           'HSE Department'],
    ['EMP013','Pedro Morales',     'Mechanical Tech',       'Maintenance'],
    ['EMP014','Yuki Tanaka',       'Quality Manager',       'Quality Assurance'],
    ['EMP015','Omar Shaikh',       'Operations Tech',       'Operations'],
    ['EMP016','Nadia Petrov',      'Risk Analyst',          'Engineering'],
  ];

  // Mandatory courses for all: FIRE-001, MH-001, ERP-001
  // Role-specific: WAH-001 (maint/eng/ops), CHEM-001 (chem deps), FLT-001 (ops/maint), ELEC-001 (maint/eng)
  type CourseRow = [string, string, boolean];
  const mandatoryCourses: CourseRow[] = [
    ['FIRE-001','Fire Safety Awareness', true],
    ['MH-001',  'Manual Handling',       true],
    ['ERP-001', 'Emergency Response Procedures', true],
  ];

  const t = db.transaction(() => {
    employees.forEach(([empId, name, role, dept], i) => {
      mandatoryCourses.forEach(([code, courseName], j) => {
        const daysCompleted = 30 + (i * 15) + (j * 7);
        const expiryMonths = code === 'MH-001' ? 36 : 12;
        const expiryDays = Math.floor(expiryMonths * 30.5);
        const isExpired = daysCompleted > expiryDays;
        const status = isExpired ? 'Expired' : 'Current';
        stmt.run(
          empId, name, role, dept, code, courseName,
          daysAgo(daysCompleted),
          daysAgo(daysCompleted - expiryDays),
          status, 75 + ((i * 7 + j * 13) % 20),
          secsAgo(daysCompleted), secsAgo(daysCompleted)
        );
      });

      // Extra optional courses based on role/dept
      const extraCourses: CourseRow[] = [];
      if (['Maintenance', 'Engineering', 'Operations'].includes(dept)) {
        extraCourses.push(['WAH-001', 'Working at Height', false]);
      }
      if (['Maintenance', 'Engineering'].includes(dept)) {
        extraCourses.push(['ELEC-001', 'Electrical Safety Awareness', false]);
      }
      if (['Operations', 'Maintenance'].includes(dept)) {
        extraCourses.push(['FLT-001', 'Forklift Truck Operation', false]);
      }
      if (['HSE Department', 'Quality Assurance'].includes(dept)) {
        extraCourses.push(['CHEM-001', 'Chemical Awareness (COSHH)', false]);
        extraCourses.push(['ISO-001', 'ISO 45001 Internal Auditor', false]);
      }

      extraCourses.forEach(([code, courseName], j) => {
        if ((i + j) % 4 === 3) return; // simulate a few not done
        const daysCompleted = 60 + (i * 10) + (j * 20);
        const expiryDays = 365;
        const isExpired = daysCompleted > expiryDays;
        const status = isExpired ? 'Expired' : 'Current';
        stmt.run(
          empId, name, role, dept, code, courseName,
          daysAgo(daysCompleted),
          daysAgo(daysCompleted - expiryDays),
          status, 80 + ((i * 3 + j * 11) % 16),
          secsAgo(daysCompleted), secsAgo(daysCompleted)
        );
      });
    });
  });
  t();
});

// ── 11. SENSOR CONFIGURATIONS ─────────────────────────────────────────────
// Schema: sensor_id (UNIQUE), name, sensor_type, location, unit, min_threshold, max_threshold, status, created_at, updated_at (ms)
seed('sensor_configurations', 'sensor_configurations', () => {
  const stmt = db.prepare(`INSERT INTO sensor_configurations
    (sensor_id, name, sensor_type, location, unit, min_threshold, max_threshold, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const sensors = [
    ['SNS-001', 'Gas Detector — H2S',           'gas',         'Plant A - Ground Floor',    'ppm',   0,   10,  'normal', msAgo(300), msAgo(1)],
    ['SNS-002', 'Gas Detector — CO',            'gas',         'Plant A - Boiler Room',     'ppm',   0,   35,  'normal', msAgo(300), msAgo(1)],
    ['SNS-003', 'Temperature Sensor — Reactor', 'temperature', 'Plant B - Reactor 1',       '°C',    15,  85,  'normal', msAgo(280), msAgo(1)],
    ['SNS-004', 'Temperature Sensor — HVAC',    'temperature', 'Administration Block',      '°C',    18,  26,  'normal', msAgo(250), msAgo(1)],
    ['SNS-005', 'Noise Monitor — Plant Floor',  'noise',       'Plant A - Production',      'dB',    0,   85,  'normal', msAgo(240), msAgo(1)],
    ['SNS-006', 'Noise Monitor — Workshop',     'noise',       'Maintenance Workshop',      'dB',    0,   85,  'normal', msAgo(240), msAgo(2)],
    ['SNS-007', 'Vibration Sensor — Pump 1',    'vibration',   'Plant A - Pump Room',       'mm/s',  0,   4.5, 'normal', msAgo(200), msAgo(2)],
    ['SNS-008', 'Air Quality PM2.5 Monitor',    'air_quality', 'Plant B - Exhaust Stack',   'μg/m³', 0,   35,  'normal', msAgo(180), msAgo(3)],
    ['SNS-009', 'Pressure Sensor — Pipeline',   'pressure',    'Plant A - Pipeline',        'bar',   2,   8,   'normal', msAgo(160), msAgo(1)],
    ['SNS-010', 'Smoke Detector — Warehouse',   'smoke',       'Warehouse B',               'obs/m', 0,   0.1, 'normal', msAgo(150), msAgo(5)],
    ['SNS-011', 'Gas Detector — LPG',           'gas',         'Chemical Storage A',        'ppm',   0,   25,  'normal', msAgo(130), msAgo(2)],
    ['SNS-012', 'Temperature — Cold Store',     'temperature', 'Cold Storage Facility',     '°C',    -5,  5,   'normal', msAgo(120), msAgo(1)],
  ];
  const t = db.transaction(() => {
    sensors.forEach(row => stmt.run(...row));
  });
  t();
});

// ── 12. SENSOR READINGS ────────────────────────────────────────────────────
// Schema: sensor_id, value, unit, status, anomaly_detected, recorded_at (ms)
seed('sensor_readings', 'sensor_readings', () => {
  const stmt = db.prepare(`INSERT INTO sensor_readings (sensor_id, value, unit, status, anomaly_detected, recorded_at) VALUES (?, ?, ?, ?, ?, ?)`);
  const sensorDefs = [
    { id: 'SNS-001', unit: 'ppm',   min: 0,  max: 10,  normal: 2.1 },
    { id: 'SNS-002', unit: 'ppm',   min: 0,  max: 35,  normal: 8.5 },
    { id: 'SNS-003', unit: '°C',    min: 15, max: 85,  normal: 62 },
    { id: 'SNS-004', unit: '°C',    min: 18, max: 26,  normal: 22 },
    { id: 'SNS-005', unit: 'dB',    min: 0,  max: 85,  normal: 78 },
    { id: 'SNS-009', unit: 'bar',   min: 2,  max: 8,   normal: 5.2 },
  ];
  const t = db.transaction(() => {
    sensorDefs.forEach((s, i) => {
      // 48 readings per sensor over last 2 days (every 60 mins)
      for (let h = 0; h < 48; h++) {
        const offset = (Math.sin(h * 0.5 + i) * 0.1 + (Math.random() * 0.05)) * s.normal;
        const val = Math.round((s.normal + offset) * 100) / 100;
        const isAnomaly = h === 20 && i === 2 ? 1 : 0; // one anomaly on SNS-003
        const status = isAnomaly ? 'warning' : 'normal';
        stmt.run(s.id, val, s.unit, status, isAnomaly, msAgo(0) - h * 3600000);
      }
    });
  });
  t();
});

// ── 13. CHECKLISTS ─────────────────────────────────────────────────────────
// Schema: title, description, category, items (JSON), due_date, completion_percentage, status, created_at, updated_at (secs)
seed('checklists', 'checklists', () => {
  const stmt = db.prepare(`INSERT INTO checklists
    (title, description, category, items, due_date, completion_percentage, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const t = db.transaction(() => {
    stmt.run('Daily Pre-Shift Safety Check',      'Morning safety walkthrough before production starts',              'Safety',        JSON.stringify(['PPE compliance check','Fire exit clear','Spill kits stocked','Equipment guards in place','First aid kit complete']),             daysAgo(0),  80,  'active',    secsAgo(1), secsAgo(1));
    stmt.run('Chemical Storage Monthly Audit',    'Monthly audit of chemical storage compliance',                    'Compliance',    JSON.stringify(['SDS files up to date','Secondary containment intact','Labeling correct','Incompatibles segregated','Ventilation operational']),   daysAgo(-2), 40,  'active',    secsAgo(5), secsAgo(2));
    stmt.run('Permit to Work Follow-up',          'Post-work permit closure checks',                                 'Process Safety',JSON.stringify(['Work area restored','Tools accounted for','Isolation removed','Area re-energised safely','Permit formally closed']),              daysAgo(-1), 60,  'active',    secsAgo(2), secsAgo(1));
    stmt.run('Fire Safety Weekly Check',          'Weekly fire safety compliance verification',                      'Fire Safety',   JSON.stringify(['Extinguishers accessible','Exit signs illuminated','Fire doors not wedged','Assembly point visible','Last inspection checked']), daysAgo(-3), 100, 'completed', secsAgo(3), secsAgo(0));
    stmt.run('PPE Inspection — Q1 2026',          'Quarterly PPE inspection and replacement assessment',             'PPE',           JSON.stringify(['Hard hats inspected','Safety footwear checked','Harnesses inspected','Eye protection assessed','Hi-vis condition checked']),     daysAgo(7),  20,  'active',    secsAgo(7), secsAgo(7));
  });
  t();
});

// ── 14. CONTRACTORS ────────────────────────────────────────────────────────
// Schema: name, company, email, phone, specialty, status, contract_start, contract_end, created_at, updated_at (ms)
seed('contractors', 'contractors', () => {
  const stmt = db.prepare(`INSERT INTO contractors
    (name, company, email, phone, specialty, status, contract_start, contract_end, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const t = db.transaction(() => {
    stmt.run('John Bradley',   'SafeWork Solutions Ltd',    'j.bradley@safework.com',   '+44-161-555-0201', 'Electrical & HV Maintenance',   'active', daysAgo(400), daysAgo(-200), msAgo(400), msAgo(30));
    stmt.run('Karen Foster',   'Apex Industrial Services',  'k.foster@apex-ind.com',    '+44-161-555-0202', 'Mechanical Repairs & Pressure',  'active', daysAgo(380), daysAgo(-180), msAgo(380), msAgo(15));
    stmt.run('Tony Marsh',     'CleanAir Environmental',    't.marsh@cleanair.co.uk',   '+44-161-555-0203', 'Environmental Monitoring',       'active', daysAgo(300), daysAgo(-100), msAgo(300), msAgo(45));
    stmt.run('Sandra Hughes',  'BuildSafe Scaffolding',     's.hughes@buildsafe.com',   '+44-161-555-0204', 'Scaffolding & Working at Height','active', daysAgo(250), daysAgo(-150), msAgo(250), msAgo(20));
    stmt.run('Mike Donovan',   'ProFire Safety Systems',    'm.donovan@profire.co.uk',  '+44-161-555-0205', 'Fire Safety & Suppression',      'active', daysAgo(200), daysAgo(-100), msAgo(200), msAgo(10));
  });
  t();
});

// ── 15. INVESTIGATIONS ─────────────────────────────────────────────────────
// Schema: incident_id, investigation_date, investigator, findings, root_cause_analysis, status, created_at, updated_at (secs)
seed('investigations', 'investigations', () => {
  const incidentIds = db.prepare('SELECT id FROM incidents').all() as any[];
  if (!incidentIds.length) return;
  // Helper: safely get incident id by index, cycling if not enough rows
  const iid = (i: number) => incidentIds[i % incidentIds.length].id;
  const stmt = db.prepare(`INSERT INTO investigations
    (incident_id, investigation_date, investigator, findings, root_cause_analysis, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const t = db.transaction(() => {
    stmt.run(iid(0), daysAgo(4),  'Maria Santos',  'Anti-slip matting was missing following cleaning activities. No hazard notification was posted.',                              'Root cause (5-Why): lack of housekeeping procedure for wet floor management. Corrective action: procedure updated, matting replaced.',            'Closed',      secsAgo(5),  secsAgo(2));
    stmt.run(iid(1), daysAgo(17), 'Sarah Chen',    'Chemical transfer hose connection not double-checked per SOP. Berm contained spillage. Volume estimated 2L.',               'Root cause: procedure shortcut under time pressure. Contributing factor: inadequate supervision. SOP to be revised with mandatory double-check.', 'Open',        secsAgo(18), secsAgo(5));
    stmt.run(iid(2), daysAgo(44), 'Mohammed Ali',  'Temperature interlock setpoint was 3°C below design specification following last maintenance activity.',                      'Root cause: change management failure — maintenance log not updated and engineering review bypassed. Procedure being revised.',                   'In Progress', secsAgo(45), secsAgo(10));
    stmt.run(iid(3), daysAgo(71), 'Nadia Petrov',  'Panel access procedure did not mandate de-energisation. Technician believed panel safe via visual inspection only.',        'Root cause: procedural gap. No written safe-work method for this panel type. Immediate stop-work issued, arc flash study commissioned.',        'Open',        secsAgo(72), secsAgo(3));
    stmt.run(iid(4), daysAgo(84), 'Maria Santos',  'Laceration caused by exposed sharp edge on conveyor frame section. Guard removed for maintenance and not replaced.',        'Root cause: machine guarding reinstatement not included in maintenance job card. Job card template updated.',                                    'Closed',      secsAgo(85), secsAgo(80));
  });
  t();
});

// ── SUMMARY ────────────────────────────────────────────────────────────────
console.log('\n====================================');
console.log('✅ Seed complete! Row counts:');
const tables = [
  'workers','incidents','capa_records','kpi_metrics','compliance_alerts',
  'risk_register','audits','inspection_schedule','training_courses','employee_training',
  'sensor_configurations','sensor_readings','checklists','contractors','investigations',
];
tables.forEach(t => {
  const n = count(t);
  if (n >= 0) console.log(`   ${t.padEnd(30)} ${n} rows`);
});

db.close();

