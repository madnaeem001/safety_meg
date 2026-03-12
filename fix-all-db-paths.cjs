const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'backend/src/routes');

let fixedCount = 0;

function fix(file, fn) {
  const fp = path.join(routesDir, file);
  if (!fs.existsSync(fp)) { console.log('NOT FOUND:', file); return; }
  const before = fs.readFileSync(fp, 'utf8');
  const after = fn(before);
  if (before !== after) {
    fs.writeFileSync(fp, after);
    console.log('✅ Fixed:', file);
    fixedCount++;
  } else {
    console.log('⚠️  No change (check manually):', file);
  }
}

// ── GROUP 1: Fix corruption `|| # Fix...process.env.RAILWAY_ENVIRONMENT` ──
const corrupted = [
  'dashboard.ts', 'assets.ts', 'automation.ts', 'esg.ts',
  'geotags.ts', 'inspections.ts', 'releases.ts', 'supervisor.ts'
];
corrupted.forEach(f => {
  fix(f, content => content.replace(
    /const isProdRoute = process\.env\.NODE_ENV === 'production' \|\| # Fix all non-test route files that still have hardcoded 'local\.sqlite'process\.env\.RAILWAY_ENVIRONMENT;/g,
    "const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;"
  ));
});

// ── GROUP 2: `const dbPath = resolve(process.cwd(), 'local.sqlite')` → add isProdRoute ──
const resolvePattern = [
  'behavior-safety.ts', 'bow-tie.ts', 'certifications.ts', 'compliance-frameworks.ts',
  'contractors.ts', 'custom-apps.ts', 'custom-checklists.ts', 'custom-reports.ts',
  'data-security.ts', 'email-notifications.ts', 'form-configurator.ts', 'hazard-reports.ts',
  'jsa.ts', 'landing.ts', 'near-miss-reports.ts', 'organization-settings.ts',
  'permit-to-work.ts', 'pilot-program.ts', 'safety-procedures.ts', 'sensors.ts',
  'standard-certifications.ts', 'standards.ts', 'user-preferences.ts', 'worker-app.ts'
];
resolvePattern.forEach(f => {
  fix(f, content => content.replace(
    /const dbPath = resolve\(process\.cwd\(\), 'local\.sqlite'\);/g,
    "const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;\nconst dbPath = isProdRoute ? '/data/local.sqlite' : resolve(process.cwd(), 'local.sqlite');"
  ));
});

// ── GROUP 3: `const DB_PATH = path.join(__dirname, '../../local.sqlite')` → add isProdRoute ──
const dirnamePattern = [
  'chemicals.ts', 'compliance-procedures.ts', 'heatmap.ts',
  'hygiene.ts', 'incident-analytics.ts', 'predictive-safety.ts',
  'regulations.ts', 'toolbox.ts'
];
dirnamePattern.forEach(f => {
  fix(f, content => content.replace(
    /const DB_PATH = path\.join\(__dirname, '\.\.\/\.\.\/local\.sqlite'\);/g,
    "const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;\nconst DB_PATH = isProdRoute ? '/data/local.sqlite' : path.join(__dirname, '../../local.sqlite');"
  ));
});

console.log(`\nTotal fixed: ${fixedCount} files`);
