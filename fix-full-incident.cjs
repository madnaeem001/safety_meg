const fs = require('fs');
const file = 'frontend/src/pages/FullIncidentReport.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  ['text-xs font-bold text-surface-700 uppercase tracking-wide', 'text-xs font-bold text-text-muted uppercase tracking-wide'],
  ['border border-surface-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-surface-900 placeholder:text-surface-600"', 'border border-surface-border rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm text-text-primary placeholder:text-text-muted"'],
  ['border border-surface-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-surface-900 appearance-none"', 'border border-surface-border rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm text-text-primary appearance-none"'],
  ['border border-surface-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-surface-900 placeholder:text-surface-600 resize-none"', 'border border-surface-border rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm text-text-primary placeholder:text-text-muted resize-none"'],
];

for (const [from, to] of replacements) {
  const count = content.split(from).length - 1;
  content = content.split(from).join(to);
  console.log(`Replaced ${count}x: ${from.slice(0, 60)}`);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Done FullIncidentReport fixes!');
