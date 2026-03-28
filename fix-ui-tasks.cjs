const fs = require('fs');

function fixFile(path, replacements) {
  let c = fs.readFileSync(path, 'utf8');
  for (const [from, to] of replacements) {
    c = c.split(from).join(to);
  }
  fs.writeFileSync(path, c);
  console.log('Fixed:', path.split('/').pop());
}

const base = '/Users/mudassarnaeem/safetymeg/frontend/src/pages/';
const comp = '/Users/mudassarnaeem/safetymeg/frontend/src/components/';

// ── #31 NearMissReport.tsx ─────────────────────────────────────────────────
fixFile(base + 'NearMissReport.tsx', [
  ['bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-900 dark:to-surface-950', 'bg-surface-base'],
  ['bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700', 'bg-surface-raised rounded-2xl p-6 shadow-soft border border-surface-border'],
  ['bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-soft border border-surface-100 dark:border-surface-700', 'bg-surface-raised rounded-2xl p-5 shadow-soft border border-surface-border'],
  ['bg-white dark:bg-surface-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl', 'bg-surface-raised rounded-3xl p-6 max-w-lg w-full shadow-2xl'],
  ['bg-white dark:bg-surface-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl', 'bg-surface-raised rounded-3xl p-8 max-w-md w-full text-center shadow-2xl'],
  ['text-brand-900 dark:text-white', 'text-text-primary'],
  ['bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 sticky top-[72px] z-40', 'bg-surface-raised border-b border-surface-border sticky top-[var(--nav-height)] z-40'],
  ['bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700', 'bg-surface-raised border-b border-surface-border'],
  ['bg-white dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700 p-4 pb-24 z-50', 'bg-surface-raised border-t border-surface-border p-4 pb-24 z-50'],
  ['bg-gradient-to-br from-amber-500 to-orange-600', 'bg-warning'],
  ['w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent', 'w-full px-4 py-2.5 rounded-xl border border-surface-border bg-surface-raised text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent'],
  ['w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none', 'w-full px-4 py-3 rounded-xl border border-surface-border bg-surface-raised text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent resize-none'],
  ['w-full px-3 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white text-sm', 'w-full px-3 py-2.5 rounded-xl border border-surface-border bg-surface-raised text-text-primary text-sm'],
  ['bg-green-100 text-green-700 border-green-200', 'bg-success/15 text-success border-success/30'],
  ['bg-yellow-100 text-yellow-700 border-yellow-200', 'bg-warning/15 text-warning border-warning/30'],
  ['bg-orange-100 text-orange-700 border-orange-200', 'bg-warning/20 text-warning border-warning/40'],
  ['bg-red-100 text-red-700 border-red-200', 'bg-danger/15 text-danger border-danger/30'],
  ['bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors', 'bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors'],
  ['bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium hover:from-amber-600 hover:to-orange-700', 'bg-warning text-white font-medium hover:bg-warning/90'],
  ['bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors', 'bg-success text-white rounded-xl hover:bg-success/90 transition-colors'],
  ['bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2', 'bg-success text-white font-medium hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'],
  ['bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800', 'bg-success/10 rounded-xl border border-success/30'],
  ['text-emerald-800 dark:text-emerald-300', 'text-success'],
  ['text-emerald-600 dark:text-emerald-400', 'text-success'],
  ['text-emerald-600 dark:text-emerald-400 flex items-center gap-1', 'text-success flex items-center gap-1'],
  ['bg-blue-100 dark:bg-blue-900/30', 'bg-accent/10'],
  ['bg-emerald-100 dark:bg-emerald-900/30', 'bg-success/10'],
  ['bg-indigo-100 dark:bg-indigo-900/30', 'bg-primary/10'],
  ['text-blue-600 dark:text-blue-400', 'text-accent'],
  ['text-emerald-600 dark:text-emerald-400', 'text-success'],
  ['text-indigo-600 dark:text-indigo-400', 'text-primary'],
  ['bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4', 'bg-success/15 rounded-full flex items-center justify-center mb-4'],
  ['text-emerald-500', 'text-success'],
  ['hover:bg-brand-600', 'hover:bg-accent/90'],
  ['bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300', 'bg-accent/10 text-accent'],
]);

// ── #32 KPIIndicators.tsx ──────────────────────────────────────────────────
fixFile(base + 'KPIIndicators.tsx', [
  ['bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-900 dark:to-surface-950', 'bg-surface-base'],
  ['bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700', 'bg-surface-raised rounded-2xl p-6 shadow-soft border border-surface-border'],
  ['bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-soft border border-surface-100 dark:border-surface-700', 'bg-surface-raised rounded-2xl p-5 shadow-soft border border-surface-border'],
  ['bg-white dark:bg-surface-800 rounded-xl p-4 shadow-soft border border-surface-100 dark:border-surface-700', 'bg-surface-raised rounded-xl p-4 shadow-soft border border-surface-border'],
  ['bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 sticky top-[72px] z-40', 'bg-surface-raised border-b border-surface-border sticky top-[var(--nav-height)] z-40'],
  ['bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700', 'bg-surface-raised border-b border-surface-border'],
  ['text-brand-900 dark:text-white', 'text-text-primary'],
  ['bg-emerald-100 dark:bg-emerald-900/30', 'bg-success/10'],
  ['bg-blue-100 dark:bg-blue-900/30', 'bg-accent/10'],
  ['bg-indigo-100 dark:bg-indigo-900/30', 'bg-primary/10'],
  ['stopColor="#10b981"', 'stopColor="#16A34A"'],
  ['stopColor="#3b82f6"', 'stopColor="#00A89D"'],
  ['text-[10px] text-surface-400 mb-1', 'text-xs text-text-muted mb-1'],
  ['bg-emerald-100 text-emerald-700', 'bg-success/15 text-success'],
  ['bg-red-100 text-red-700', 'bg-danger/15 text-danger'],
  ['px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white text-sm', 'px-3 py-2 rounded-xl border border-surface-border bg-surface-raised text-text-primary text-sm'],
]);

// ── #34 InjuryReport.tsx ──────────────────────────────────────────────────
fixFile(base + 'InjuryReport.tsx', [
  ['min-h-screen bg-gray-50 pb-20', 'min-h-screen bg-surface-base pb-20'],
  ['text-slate-900', 'text-text-primary'],
  ['text-slate-500', 'text-text-muted'],
  ['text-purple-600 bg-purple-50', 'text-primary bg-primary/10'],
  ['text-cyan-600 bg-cyan-50', 'text-accent bg-accent/10'],
  ['text-amber-600 bg-amber-50', 'text-warning bg-warning/10'],
  ['text-emerald-600 bg-emerald-50', 'text-success bg-success/10'],
  ['bg-white rounded-2xl', 'bg-surface-raised rounded-2xl'],
  ['text-[10px] text-slate-500 uppercase tracking-wider', 'text-xs text-text-muted uppercase tracking-wider'],
  ['text-xl font-black text-slate-900', 'text-xl font-black text-text-primary'],
]);

console.log('All bulk replacements done!');
