const fs = require('fs');
const f = 'frontend/src/pages/VehicleIncidentReport.tsx';
let c = fs.readFileSync(f, 'utf8');

const r = [
  ['bg-gradient-to-b from-surface-50 to-surface-100', 'bg-surface-base'],
  // success state
  ['min-h-screen bg-surface-50 flex', 'min-h-screen bg-surface-base flex'],
  ['className="bg-white p-8 rounded-3xl text-center space-y-4 max-w-xs"', 'className="bg-surface-raised p-8 rounded-3xl text-center space-y-4 max-w-xs"'],
  ['bg-emerald-100 rounded-full', 'bg-success/10 rounded-full'],
  ['text-emerald-600 />', 'text-success />'],
  ['text-2xl font-bold text-brand-900">Report Submitted', 'text-2xl font-bold text-text-primary">Report Submitted'],
  // header
  ['bg-white/80 backdrop-blur-md shadow-sm sticky top-20', 'bg-surface-raised/80 backdrop-blur-md shadow-sm sticky top-[var(--nav-height)]'],
  ['border-b border-surface-200 max-w-7xl', 'border-b border-surface-border max-w-7xl'],
  ['className="p-2 -ml-2 hover:bg-surface-100 rounded-full"', 'className="p-2 -ml-2 hover:bg-surface-100 rounded-full" aria-label="Back"'],
  ['text-surface-600" />', 'text-text-muted" />'],
  ['text-xl font-bold text-brand-900 flex', 'text-xl font-bold text-text-primary flex'],
  // section cards
  ['className="bg-white p-6 rounded-3xl shadow-soft border border-surface-100 space-y-4">', 'className="bg-surface-raised p-6 rounded-3xl shadow-soft border border-surface-border space-y-4">'],
  ['className="bg-white p-6 rounded-3xl shadow-soft border border-surface-100">', 'className="bg-surface-raised p-6 rounded-3xl shadow-soft border border-surface-border">'],
  // headings
  ['font-bold text-brand-900 flex items-center gap-2">', 'font-bold text-text-primary flex items-center gap-2">'],
  ['font-bold text-brand-900">', 'font-bold text-text-primary">'],
  ['font-semibold text-brand-800 mt-4', 'font-semibold text-text-primary mt-4'],
  // labels
  ['text-xs font-bold text-surface-400 uppercase', 'text-xs font-bold text-text-muted uppercase'],
  // inputs and selects
  ['bg-surface-50 border border-surface-100 rounded-xl text-sm"', 'bg-surface-100 border border-surface-border rounded-xl text-sm text-text-primary"'],
  ['bg-surface-50 border border-surface-100 rounded-xl text-sm resize-none"', 'bg-surface-100 border border-surface-border rounded-xl text-sm resize-none text-text-primary"'],
  // checkboxes
  ['flex items-center gap-3 p-4 bg-surface-50 rounded-xl">', 'flex items-center gap-3 p-4 bg-surface-100 rounded-xl">'],
  ['flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">', 'flex items-center gap-3 p-4 bg-danger/5 rounded-xl border border-danger/15">'],
  ['text-sm font-medium text-brand-800">Police', 'text-sm font-medium text-text-primary">Police'],
  ['text-sm font-medium text-red-800">DOT', 'text-sm font-medium text-danger">DOT'],
  // photo upload dashed
  ['border-dashed border-surface-200 rounded-2xl', 'border-dashed border-surface-border rounded-2xl'],
  ['text-surface-400 hover:text-brand-500 hover:border-brand-500', 'text-text-muted hover:text-accent hover:border-accent'],
  // error
  ['bg-red-50 border border-red-200 rounded-2xl', 'bg-danger/5 border border-danger/20 rounded-2xl'],
  ['text-red-500 shrink-0', 'text-danger shrink-0'],
  ['text-sm text-red-700', 'text-sm text-danger'],
  // submit
  ['bg-brand-900 text-white rounded-3xl shadow-glow', 'bg-primary text-text-inverted rounded-3xl shadow-glow'],
];

for (const [from, to] of r) {
  const count = c.split(from).length - 1;
  c = c.split(from).join(to);
  if (count > 0) console.log(`Replaced ${count}x: ${from.slice(0, 60)}`);
}

fs.writeFileSync(f, c, 'utf8');
console.log('Done VehicleIncidentReport!');
