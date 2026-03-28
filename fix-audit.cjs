const fs = require('fs');
const f = 'frontend/src/components/safety/AuditTrail/AuditTrail.tsx';
let c = fs.readFileSync(f, 'utf8');

// Update getActionColor to use semantic tokens
const oldGetActionColor = `  const getActionColor = (action: AuditAction) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-700 border-green-200';
      case 'UPDATE': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DELETE': return 'bg-red-100 text-red-700 border-red-200';
      case 'VIEW': return 'bg-surface-100 text-surface-600 border-surface-200';
      case 'SUBMIT': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'APPROVE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REJECT': return 'bg-red-100 text-red-700 border-red-200';
      case 'SIGN': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'EXPORT': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'ASSIGN': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'COMMENT': return 'bg-violet-100 text-violet-700 border-violet-200';
      case 'ATTACH': return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'STATUS_CHANGE': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-surface-100 text-surface-600 border-surface-200';
    }
  };`;

const newGetActionColor = `  const getActionColor = (action: AuditAction) => {
    switch (action) {
      case 'CREATE': return 'bg-success/10 text-success border-success/20';
      case 'UPDATE': return 'bg-accent/10 text-accent border-accent/20';
      case 'DELETE': return 'bg-danger/10 text-danger border-danger/20';
      case 'VIEW': return 'bg-surface-100 text-text-muted border-surface-border';
      case 'SUBMIT': return 'bg-primary/10 text-text-primary border-primary/20';
      case 'APPROVE': return 'bg-success/10 text-success border-success/20';
      case 'REJECT': return 'bg-danger/10 text-danger border-danger/20';
      case 'SIGN': return 'bg-accent/10 text-accent border-accent/20';
      case 'EXPORT': return 'bg-warning/10 text-warning border-warning/20';
      case 'ASSIGN': return 'bg-teal/10 text-teal border-teal/20';
      case 'COMMENT': return 'bg-primary/10 text-text-primary border-primary/20';
      case 'ATTACH': return 'bg-primary/10 text-text-primary border-primary/20';
      case 'STATUS_CHANGE': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-surface-100 text-text-muted border-surface-border';
    }
  };`;

c = c.split(oldGetActionColor).join(newGetActionColor);

const r = [
  // compact view
  ['text-surface-800 flex items-center gap-2">', 'text-text-primary flex items-center gap-2">'],
  ['text-brand-500" />\n            Recent Activity', 'text-accent" />\n            Recent Activity'],
  ['text-xs text-surface-500">{filteredEntries', 'text-xs text-text-muted">{filteredEntries'],
  ['bg-surface-50 rounded-lg">', 'bg-surface-raised/50 rounded-lg">'],
  ['text-sm text-surface-800 truncate">', 'text-sm text-text-primary truncate">'],
  ['text-xs text-surface-500">{date}', 'text-xs text-text-muted">{date}'],
  // full view header
  ['text-xl font-bold text-brand-900 flex items-center gap-2">', 'text-xl font-bold text-text-primary flex items-center gap-2">'],
  ['text-brand-500" />\n            Audit Trail', 'text-accent" />\n            Audit Trail'],
  ['text-sm text-surface-500">Complete', 'text-sm text-text-muted">Complete'],
  // export button
  ['className="px-4 py-2.5 bg-surface-100 text-surface-700 font-semibold rounded-xl hover:bg-surface-200 transition-colors flex items-center gap-2">', 'className="px-4 py-2.5 bg-surface-100 text-text-muted font-semibold rounded-xl hover:bg-surface-200 transition-colors flex items-center gap-2">'],
  // search/filter container
  ['className="bg-white rounded-2xl p-4 border border-surface-100 shadow-soft space-y-4">', 'className="bg-surface-raised rounded-2xl p-4 border border-surface-border shadow-soft space-y-4">'],
  ['bg-surface-50 border border-surface-100 rounded-xl text-sm"', 'bg-surface-100 border border-surface-border rounded-xl text-sm"'],
  ['bg-surface-50 border border-surface-100">', 'bg-surface-100 border border-surface-border">'],
  ['bg-brand-50 border-brand-200 text-brand-600', 'bg-primary/5 border-primary/20 text-text-primary'],
  ['bg-surface-50 border-surface-100 text-surface-600', 'bg-surface-100 border-surface-border text-text-muted'],
  ['border-t border-surface-100">', 'border-t border-surface-border">'],
  ['text-xs font-bold text-surface-400 uppercase', 'text-xs font-bold text-text-muted uppercase'],
  ['text-sm text-surface-500">', 'text-sm text-text-muted">'],
  ['text-sm text-surface-500">{filteredEntries', 'text-sm text-text-muted">{filteredEntries'],
  // tamper-evident
  ['<Lock className="w-4 h-4"', '<Lock className="w-4 h-4 text-text-muted"'],
  // audit entry cards
  ['className="bg-white rounded-xl border border-surface-100 shadow-soft overflow-hidden">', 'className="bg-surface-raised rounded-xl border border-surface-border shadow-soft overflow-hidden">'],
  ['w-full p-4 flex items-start gap-4 text-left hover:bg-surface-50', 'w-full p-4 flex items-start gap-4 text-left hover:bg-surface-100/50'],
  // entry text
  ['text-xs text-surface-400 font-mono">', 'text-xs text-text-muted font-mono">'],
  ['text-sm text-surface-800">', 'text-sm text-text-primary">'],
  ['text-surface-500 mx-1">({entry.userRole})', 'text-text-muted mx-1">({entry.userRole})'],
  ['line-through text-surface-400">', 'line-through text-text-muted">'],
  ['font-medium text-brand-600">', 'font-medium text-accent">'],
  ['text-surface-600"> - {entry.details}', 'text-text-muted"> - {entry.details}'],
  ['text-xs text-surface-500 mt-1 truncate">', 'text-xs text-text-muted mt-1 truncate">'],
  ['text-xs text-surface-400">', 'text-xs text-text-muted">'],
  ['w-5 h-5 text-surface-300', 'w-5 h-5 text-text-muted'],
  // expanded details
  ['pt-2 border-t border-surface-100 bg-surface-50 space-y-3">', 'pt-2 border-t border-surface-border bg-surface-base/40 space-y-3">'],
  ['text-xs font-bold text-surface-400 uppercase">Entity', 'text-xs font-bold text-text-muted uppercase">Entity'],
  ['text-xs font-bold text-surface-400 uppercase">User', 'text-xs font-bold text-text-muted uppercase">User'],
  ['text-xs font-bold text-surface-400 uppercase">IP', 'text-xs font-bold text-text-muted uppercase">IP'],
  ['text-xs font-bold text-surface-400 uppercase">Audit', 'text-xs font-bold text-text-muted uppercase">Audit'],
  ['text-sm text-surface-700 capitalize">', 'text-sm text-text-primary capitalize">'],
  ['text-sm text-surface-700 font-mono">{entry.userId}', 'text-sm text-text-primary font-mono">{entry.userId}'],
  ['text-sm text-surface-700 font-mono">{entry.ipAddress}', 'text-sm text-text-primary font-mono">{entry.ipAddress}'],
  ['text-sm text-surface-700 font-mono">{entry.id}', 'text-sm text-text-primary font-mono">{entry.id}'],
  ['className="p-3 bg-white rounded-lg border border-surface-200">', 'className="p-3 bg-surface-raised rounded-lg border border-surface-border">'],
  ['<Hash className="w-4 h-4 text-surface-400"', '<Hash className="w-4 h-4 text-text-muted"'],
  ['text-xs font-bold text-surface-400 uppercase">Integrity', 'text-xs font-bold text-text-muted uppercase">Integrity'],
  ['text-xs text-surface-600 font-mono', 'text-xs text-text-primary font-mono'],
  // empty state
  ['bg-surface-50 rounded-2xl">', 'bg-surface-raised/50 rounded-2xl">'],
  ['text-surface-300 mx-auto mb-4"', 'text-text-muted mx-auto mb-4"'],
  ['text-surface-500">No audit', 'text-text-muted">No audit'],
];

for (const [from, to] of r) {
  const count = c.split(from).length - 1;
  c = c.split(from).join(to);
  if (count > 0) console.log(`Replaced ${count}x: ${from.slice(0, 60)}`);
}

// Add import
c = c.replace(
  "import React, { useState, useMemo } from 'react';",
  "import React, { useState, useMemo } from 'react';\nimport { SMButton } from '../../ui';"
);

fs.writeFileSync(f, c, 'utf8');
console.log('Done AuditTrail!');
