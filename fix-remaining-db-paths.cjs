const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'backend/src/routes');
const files = ['dashboard.ts','assets.ts','releases.ts','esg.ts','automation.ts','inspections.ts','supervisor.ts','geotags.ts'];

const old = "const sqlite = new Database('local.sqlite');";
const replacement = "const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;\nconst sqlite = new Database(isProdRoute ? '/data/local.sqlite' : 'local.sqlite');";

// Also fix ai.ts which has multiple occurrences including `const db = new Database('local.sqlite');`
const aiFile = path.join(routesDir, 'ai.ts');
if (fs.existsSync(aiFile)) {
  let content = fs.readFileSync(aiFile, 'utf8');
  const changed = content
    .replace("const sqlite = new Database('local.sqlite');",
      "const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;\nconst sqlite = new Database(isProdRoute ? '/data/local.sqlite' : 'local.sqlite');")
    .replaceAll("const db = new Database('local.sqlite');",
      "const db = new Database(isProdRoute ? '/data/local.sqlite' : 'local.sqlite');");
  fs.writeFileSync(aiFile, changed);
  console.log('Fixed: ai.ts');
}

files.forEach(f => {
  const fp = path.join(routesDir, f);
  if (!fs.existsSync(fp)) { console.log('Not found:', f); return; }
  let content = fs.readFileSync(fp, 'utf8');
  if (content.includes(old)) {
    fs.writeFileSync(fp, content.replaceAll(old, replacement));
    console.log('Fixed:', f);
  } else {
    console.log('Skipped (already fixed or not found):', f);
  }
});

console.log('Done.');
