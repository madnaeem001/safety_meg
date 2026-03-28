const fs = require('fs');
const f = 'frontend/src/components/safety/EHSWorkflow/EHSWorkflowDashboard.tsx';
let c = fs.readFileSync(f, 'utf8');

const r = [
  // outer bg
  ['from-surface-50 via-white to-surface-100', 'bg-surface-base'],
  // tab switcher containers
  ['className="bg-white border-b border-surface-200 sticky top-0 z-50"', 'className="bg-surface-raised border-b border-surface-border sticky top-0 z-50"'],
  // active ehs tab
  ['bg-brand-600 text-white shadow-lg"', 'bg-primary text-text-inverted shadow-lg"'],
  // active project tab  
  ['bg-indigo-600 text-white shadow-lg"', 'bg-accent text-text-inverted shadow-lg"'],
  // inactive project tab
  ['bg-indigo-100 text-indigo-600 hover:bg-indigo-200"', 'bg-accent/10 text-accent hover:bg-accent/20"'],
  // header
  ['bg-white/80 backdrop-blur-xl border-b border-surface-200/60', 'bg-surface-raised/80 backdrop-blur-xl border-b border-surface-border/60'],
  ['text-xl font-bold text-surface-800">', 'text-xl font-bold text-text-primary">'],
  ['text-xs text-surface-500">Standard', 'text-xs text-text-muted">Standard'],
  ['text-xs text-surface-400 hidden', 'text-xs text-text-muted hidden'],
  // stats cards
  ['className="bg-white rounded-xl border border-surface-200 p-4"', 'className="bg-surface-raised rounded-xl border border-surface-border p-4"'],
  // icon containers
  ['p-2 bg-brand-100 rounded-lg">', 'p-2 bg-primary/10 rounded-lg">'],
  ['w-4 h-4 text-brand-600"', 'w-4 h-4 text-accent"'],
  ['p-2 bg-amber-100 rounded-lg">', 'p-2 bg-warning/10 rounded-lg">'],
  ['w-4 h-4 text-amber-600"', 'w-4 h-4 text-warning"'],
  ['p-2 bg-red-100 rounded-lg">', 'p-2 bg-danger/10 rounded-lg">'],
  ['w-4 h-4 text-red-600" />', 'w-4 h-4 text-danger" />'],
  ['p-2 bg-green-100 rounded-lg">', 'p-2 bg-success/10 rounded-lg">'],
  ['w-4 h-4 text-green-600"', 'w-4 h-4 text-success"'],
  // stats text
  ['text-xs text-surface-500">TRIR', 'text-xs text-text-muted">TRIR'],
  ['text-xs text-surface-500">Pending', 'text-xs text-text-muted">Pending'],
  ['text-xs text-surface-500">Overdue', 'text-xs text-text-muted">Overdue'],
  ['text-xs text-surface-500">Compliance', 'text-xs text-text-muted">Compliance'],
  ['text-2xl font-bold text-surface-800">', 'text-2xl font-bold text-text-primary">'],
  ['text-2xl font-bold text-red-600">', 'text-2xl font-bold text-danger">'],
  ['text-[10px] text-surface-400 mt-1">', 'text-xs text-text-muted mt-1">'],
  ['text-[10px] text-green-600 mt-1">', 'text-xs text-success mt-1">'],
  ['text-[10px] text-green-600">', 'text-xs text-success">'],
  // stage header
  ['text-lg font-semibold text-surface-800">', 'text-lg font-semibold text-text-primary">'],
  ['text-xs text-surface-500">', 'text-xs text-text-muted">'],
  ['text-sm text-surface-400">', 'text-sm text-text-muted">'],
  // onBack button
  ['p-2 rounded-xl hover:bg-surface-100 transition-colors">\n                  <ArrowLeft className="w-5 h-5 text-surface-600"', 'p-2 rounded-xl hover:bg-surface-100 transition-colors">\n                  <ArrowLeft className="w-5 h-5 text-text-muted"'],
  // export button
  ['text-surface-600 bg-surface-100 rounded-lg hover:bg-surface-200', 'text-text-muted bg-surface-100 rounded-lg hover:bg-surface-200'],
];

for (const [from, to] of r) {
  const count = c.split(from).length - 1;
  c = c.split(from).join(to);
  if (count > 0) console.log(`Replaced ${count}x: ${from.slice(0, 60)}`);
}

fs.writeFileSync(f, c, 'utf8');
console.log('Done EHSWorkflowDashboard!');
