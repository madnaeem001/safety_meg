const Database = require('better-sqlite3');
const db = new Database('local.sqlite');
db.pragma('foreign_keys = OFF');

const now = Date.now();
const H = 3600000;

const existingEvents = db.prepare('SELECT COUNT(*) as n FROM automation_events').get();
if (existingEvents.n > 0) {
  console.log('automation_events already seeded (' + existingEvents.n + ' rows). Skipping.');
  process.exit(0);
}

const insertRule = db.prepare(
  'INSERT INTO automation_rules (name, description, trigger_condition, action, active, created_by, execution_count, last_triggered, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?)'
);

const rules = [
  {
    name: 'PPE Compliance Monitor',
    desc: 'Auto-assigns PPE refresher training when compliance drops below threshold',
    tc: { type: 'threshold', metric: 'ppe_compliance', below: 80 },
    action: { type: 'assign_training', course: 'PPE Refresher' },
    execs: 12, last: now - 2 * H,
  },
  {
    name: 'Incident Surge Alert',
    desc: 'Notifies safety team lead when incidents exceed weekly baseline',
    tc: { type: 'surge', metric: 'incidents_weekly', threshold: 3 },
    action: { type: 'notify', channel: 'email', recipient: 'safety.lead@company.com' },
    execs: 7, last: now - 5 * H,
  },
  {
    name: 'CAPA Auto-Initiator',
    desc: 'Opens CAPA ticket for every high or critical severity incident',
    tc: { type: 'event', source: 'incident', severity: ['high', 'critical'] },
    action: { type: 'create_capa', priority: 'high', assignTo: 'safety-team' },
    execs: 9, last: now - 8 * H,
  },
  {
    name: 'Weekly Safety Digest',
    desc: 'Generates and emails weekly safety KPI summary to all supervisors',
    tc: { type: 'schedule', cron: '0 8 * * MON' },
    action: { type: 'generate_report', template: 'weekly_digest', recipients: ['supervisors'] },
    execs: 18, last: now - 14 * H,
  },
  {
    name: 'Sensor Threshold Guardian',
    desc: 'Triggers ventilation boost when VOC or noise sensor exceeds 90% of limit',
    tc: { type: 'sensor', metrics: ['voc', 'noise_db'], pct_limit: 90 },
    action: { type: 'equipment_control', device: 'ventilation', command: 'boost' },
    execs: 5, last: now - 22 * H,
  },
  {
    name: 'Training Lapse Enforcer',
    desc: 'Auto-assigns mandatory retraining to employees 30 days past certification expiry',
    tc: { type: 'schedule', cron: '0 9 * * *', check: 'training_expiry_days', threshold: 30 },
    action: { type: 'assign_training', mandatory: true, deadline_days: 7 },
    execs: 31, last: now - 30 * H,
  },
];

const ruleIds = [];
for (const r of rules) {
  const res = insertRule.run(
    r.name, r.desc,
    JSON.stringify(r.tc), JSON.stringify(r.action),
    'System', r.execs, r.last,
    now - 7 * 24 * H, now - 7 * 24 * H
  );
  ruleIds.push(Number(res.lastInsertRowid));
}

const insertEvent = db.prepare(
  'INSERT INTO automation_events (rule_id, rule_name, trigger_type, status, details, recipient, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

const events = [
  { ri: 0, tt: 'threshold', status: 'success',
    details: 'PPE compliance dropped to 74% in Zone B. Refresher training automatically assigned to 8 workers.',
    recipient: 'zone-b-team@company.com', ts: now - 1 * H },
  { ri: 1, tt: 'surge', status: 'success',
    details: '4 incidents logged this week — baseline exceeded. Safety team lead notified via email.',
    recipient: 'sarah.mitchell@company.com', ts: now - 3 * H },
  { ri: 2, tt: 'event', status: 'success',
    details: 'High-severity incident at Loading Dock. CAPA-2026-0047 auto-created and assigned to safety team.',
    recipient: 'safety-team', ts: now - 6 * H },
  { ri: 3, tt: 'schedule', status: 'success',
    details: 'Weekly Safety Digest (Week 10) generated. KPIs: 22 safety score, 17% compliance, 4 active sensors. Dispatched to 12 supervisors.',
    recipient: 'supervisors@company.com', ts: now - 10 * H },
  { ri: 4, tt: 'sensor', status: 'success',
    details: 'VOC sensor S-003 reached 92% of permissible limit in Area 4. Ventilation boost activated automatically.',
    recipient: 'facility-control', ts: now - 16 * H },
  { ri: 5, tt: 'schedule', status: 'success',
    details: '3 employees found with expired OSHA 10-Hour certifications. Mandatory retraining assigned, 7-day deadline set.',
    recipient: 'hr@company.com', ts: now - 24 * H },
  { ri: 2, tt: 'event', status: 'success',
    details: 'Critical-severity incident at Production Floor. CAPA-2026-0046 auto-created with high priority.',
    recipient: 'safety-team', ts: now - 36 * H },
  { ri: 1, tt: 'surge', status: 'failed',
    details: 'Incident surge detected but email delivery to safety.lead@company.com failed — SMTP timeout. Retrying.',
    recipient: 'safety.lead@company.com', ts: now - 48 * H },
];

for (const ev of events) {
  insertEvent.run(ruleIds[ev.ri], rules[ev.ri].name, ev.tt, ev.status, ev.details, ev.recipient, ev.ts);
}

const finalCount = db.prepare('SELECT COUNT(*) as n FROM automation_events').get();
console.log('Done. Rules seeded:', ruleIds.length, '| Events seeded:', finalCount.n);
