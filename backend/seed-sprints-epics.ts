import Database from 'better-sqlite3';

const db = new Database('local.sqlite');

const insertSprint = db.prepare(
  'INSERT OR IGNORE INTO project_sprints (id, name, start_date, end_date, goal, status) VALUES (?, ?, ?, ?, ?, ?)'
);
insertSprint.run(1, 'Sprint 24', '2026-02-03', '2026-02-16', 'Complete core safety dashboard features', 'active');
insertSprint.run(2, 'Sprint 25', '2026-02-17', '2026-03-02', 'Environmental monitoring integration', 'future');
insertSprint.run(3, 'Sprint 26', '2026-03-03', '2026-03-16', 'Mobile app enhancements', 'future');

const insertEpic = db.prepare(
  'INSERT OR IGNORE INTO project_epics (id, key_code, name, summary, color, status) VALUES (?, ?, ?, ?, ?, ?)'
);
insertEpic.run(1, 'SAFE-E1', 'Safety Dashboard', 'Comprehensive safety metrics dashboard', '#6366f1', 'in_progress');
insertEpic.run(2, 'SAFE-E2', 'Incident Management', 'End-to-end incident tracking system', '#22c55e', 'in_progress');
insertEpic.run(3, 'SAFE-E3', 'Environmental Monitoring', 'Real-time environmental data tracking', '#f59e0b', 'todo');
insertEpic.run(4, 'SAFE-E4', 'Training & Compliance', 'Training management and compliance tracking', '#ec4899', 'in_progress');
insertEpic.run(5, 'SAFE-E5', 'IoT Integration', 'Safety sensor network integration', '#14b8a6', 'todo');
insertEpic.run(6, 'SAFE-E6', 'AI Workflow Automation', 'AI-powered safety workflow orchestration', '#06b6d4', 'in_progress');
insertEpic.run(7, 'SAFE-E7', 'Emergency Response AI', 'AI emergency action plans and automated muster notifications', '#ef4444', 'in_progress');
insertEpic.run(8, 'SAFE-E8', 'Ergonomics & Behavioral AI', 'AI-powered ergonomic assessments and posture analysis', '#d424ff', 'todo');
insertEpic.run(9, 'SAFE-E9', 'LOTO & Confined Space AI', 'Digital lockout/tagout procedures with AI verification', '#f59e0b', 'todo');

const sprints = db.prepare('SELECT id, name, status FROM project_sprints').all();
const epics = db.prepare('SELECT id, key_code, name FROM project_epics').all();
console.log('Sprints seeded:', sprints);
console.log('Epics seeded:', epics);

db.close();
