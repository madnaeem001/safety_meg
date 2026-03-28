const fs = require('fs');
const f = 'frontend/src/components/safety/ComplianceDashboard/ComplianceDashboard.tsx';
let c = fs.readFileSync(f, 'utf8');

// Add import
c = c.replace(
  "import React, { useState, useMemo } from 'react';",
  "import React, { useState, useMemo } from 'react';\nimport { SMButton } from '../../ui';"
);

// Update getStatusColor and getPriorityColor
const oldStatus = `  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };`;
const newStatus = `  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-danger/10 text-danger';
      case 'medium': return 'bg-warning/10 text-warning';
      case 'low': return 'bg-success/10 text-success';
      default: return 'bg-surface-100 text-text-muted';
    }
  };`;
c = c.split(oldStatus).join(newStatus);

const r = [
  // outer bg
  ['from-slate-50 via-blue-50/30 to-slate-50', 'bg-surface-base'],
  // back button
  ['p-2 hover:bg-white/80 rounded-xl transition-colors">', 'p-2 hover:bg-surface-100 rounded-xl transition-colors">'],
  // header icon
  ['bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">', 'bg-primary shadow-lg">'],
  // header text
  ['text-2xl font-bold text-slate-800">', 'text-2xl font-bold text-text-primary">'],
  ['text-sm text-slate-500">Track', 'text-sm text-text-muted">Track'],
  // Refresh button
  ['className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm">', 'className="flex items-center gap-2 px-4 py-2 bg-surface-raised rounded-xl shadow-sm hover:shadow-md transition-all text-sm text-text-primary">'],
  // export button (primary blue)
  ['className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm">', 'className="flex items-center gap-2 px-4 py-2 bg-primary text-text-inverted rounded-xl shadow-sm hover:shadow-md transition-all text-sm">'],
  // dropdown items
  ['bg-white rounded-xl shadow-lg border border-slate-200 py-2 w-48', 'bg-surface-raised rounded-xl shadow-lg border border-surface-border py-2 w-48'],
  ['text-sm text-slate-700 hover:bg-slate-50', 'text-sm text-text-primary hover:bg-surface-100'],
  // view tabs container
  ['bg-white/60 p-1 rounded-xl w-fit">', 'bg-surface-raised/60 p-1 rounded-xl w-fit">'],
  // active tab
  ["'bg-white shadow-sm text-blue-600'", "'bg-surface-raised shadow-sm text-accent'"],
  // inactive tab
  ["'text-slate-600 hover:bg-white/50'", "'text-text-muted hover:bg-surface-100/50'"],
  // score card gradient
  ['bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white', 'bg-primary rounded-2xl p-6 text-text-inverted'],
  ['text-blue-200 text-sm mb-2">', 'text-text-inverted/70 text-sm mb-2">'],
  // score card stats colors
  ['bg-blue-500/20', 'bg-white/10'],
  // category cards
  ['className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-100">', 'className="bg-surface-raised rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer border border-surface-border">'],
  ['font-semibold text-slate-800">{category.name}', 'font-semibold text-text-primary">{category.name}'],
  ['text-sm text-slate-500">{category.items}', 'text-sm text-text-muted">{category.items}'],
  // cat trend badges
  ["'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'", "'bg-success/10 text-success' : 'bg-danger/10 text-danger'"],
  // score bar track
  ['bg-slate-100 rounded-full h-2 overflow-hidden">', 'bg-surface-border rounded-full h-2 overflow-hidden">'],
  // score bar fill
  ["'bg-green-500' : \n                          category.score >= 85 ? 'bg-amber-500' : 'bg-red-500'", "'bg-success' : \n                          category.score >= 85 ? 'bg-warning' : 'bg-danger'"],
  ['text-2xl font-bold text-slate-800">{category.score}', 'text-2xl font-bold text-text-primary">{category.score}'],
  // item breakdown cells
  ['bg-green-50 rounded-lg p-2">', 'bg-success/5 rounded-lg p-2">'],
  ['text-lg font-semibold text-green-700">', 'text-lg font-semibold text-success">'],
  ['text-xs text-green-600">Compliant', 'text-xs text-success">Compliant'],
  ['bg-amber-50 rounded-lg p-2">', 'bg-warning/5 rounded-lg p-2">'],
  ['text-lg font-semibold text-amber-700">', 'text-lg font-semibold text-warning">'],
  ['text-xs text-amber-600">Pending', 'text-xs text-warning">Pending'],
  ['bg-red-50 rounded-lg p-2">', 'bg-danger/5 rounded-lg p-2">'],
  ['text-lg font-semibold text-red-700">', 'text-lg font-semibold text-danger">'],
  ['text-xs text-red-600">Overdue', 'text-xs text-danger">Overdue'],
  // audit dates
  ['border-t border-slate-100 flex items-center', 'border-t border-surface-border flex items-center'],
  ['text-xs text-slate-500">', 'text-xs text-text-muted">'],
  // whitespace cards (2 col panels)
  ['className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">', 'className="bg-surface-raised rounded-2xl p-5 shadow-soft border border-surface-border">'],
  ['font-semibold text-slate-800 flex items-center gap-2">', 'font-semibold text-text-primary flex items-center gap-2">'],
  ['text-blue-600" />', 'text-accent" />'],
  // framework items
  ['bg-slate-50 rounded-xl hover:bg-slate-100', 'bg-surface-100/50 rounded-xl hover:bg-surface-100'],
  ["framework.status === 'compliant' ? 'bg-green-500' : 'bg-amber-500'", "framework.status === 'compliant' ? 'bg-success' : 'bg-warning'"],
  ['font-medium text-slate-800">{framework.name}', 'font-medium text-text-primary">{framework.name}'],
  ['text-xs text-slate-500">{framework.items}', 'text-xs text-text-muted">{framework.items}'],
  ['font-semibold text-slate-800">{framework.score}', 'font-semibold text-text-primary">{framework.score}'],
];

for (const [from, to] of r) {
  const count = c.split(from).length - 1;
  c = c.split(from).join(to);
  if (count > 0) console.log(`Replaced ${count}x: ${from.slice(0, 60)}`);
}

fs.writeFileSync(f, c, 'utf8');
console.log('Done ComplianceDashboard!');
