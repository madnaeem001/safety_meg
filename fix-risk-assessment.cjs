#!/usr/bin/env node
const fs = require('fs');

const FILE = '/Users/mudassarnaeem/safetymeg/frontend/src/pages/RiskAssessment.tsx';
let src = fs.readFileSync(FILE, 'utf8');
const original = src;

const replace = (from, to) => {
  const next = src.split(from).join(to);
  if (next === src) console.warn(`[NO MATCH] ${from.slice(0, 60)}`);
  else console.log(`[OK] ${from.slice(0, 60)}`);
  src = next;
};

// ── Outer wrapper ──────────────────────────────────────────────
replace('min-h-screen bg-surface-50 pb-20', 'min-h-screen bg-surface-base pb-20');

// ── Sticky header ──────────────────────────────────────────────
replace('bg-white/80 backdrop-blur-md shadow-sm sticky top-[72px]', 'bg-surface-raised/80 backdrop-blur-md shadow-sm sticky top-[var(--nav-height)]');
replace('border-b border-surface-200">', 'border-b border-surface-border">');

// ── Back button → SMButton ─────────────────────────────────────
replace(
  `<button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-surface-600" />
        </button>`,
  `<SMButton variant="ghost" size="sm" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="w-5 h-5" />} />`
);

// ── Text tokens ────────────────────────────────────────────────
replace('text-brand-900', 'text-text-primary');
replace('text-surface-900', 'text-text-primary');
replace('text-surface-800', 'text-text-primary');
replace('text-surface-700', 'text-text-primary');
replace('text-surface-600', 'text-text-muted');
replace('text-surface-500', 'text-text-muted');
replace('text-surface-400', 'text-text-muted');
replace('text-brand-600', 'text-accent');

// ── Border tokens ──────────────────────────────────────────────
replace('border-surface-100">', 'border-surface-border">');
replace('border-surface-100 ', 'border-surface-border ');
replace('border-surface-200">', 'border-surface-border">');
replace('border-surface-200 ', 'border-surface-border ');
replace('border-surface-200\n', 'border-surface-border\n');
replace('border-surface-300', 'border-surface-border');

// ── Focus ring tokens ─────────────────────────────────────────
replace('focus:ring-brand-500/20', 'focus:ring-accent/20');
replace('focus:ring-brand-500', 'focus:ring-accent');
replace('focus:border-brand-500', 'focus:border-accent');
replace('focus:ring-teal-500/20', 'focus:ring-accent/20');
replace('border-brand-200 focus:ring-2 focus:ring-accent focus:border-accent bg-white shadow-sm transition-all',
  'border-surface-border focus:ring-2 focus:ring-accent focus:border-accent bg-surface-raised shadow-sm transition-all');
replace('border-brand-200', 'border-accent/30');

// ── Mode tab (nav tabs) ──────────────────────────────────────
replace(
  `'bg-brand-900 text-white shadow-lg' \n                  : 'bg-white text-text-muted border border-surface-border hover:bg-surface-50'`,
  `'bg-primary text-text-inverted shadow-lg' \n                  : 'bg-surface-raised text-text-muted border border-surface-border hover:bg-surface-100'`
);
replace("'bg-brand-900 text-white shadow-lg'", "'bg-primary text-text-inverted shadow-lg'");
replace("'bg-white text-text-muted border border-surface-border hover:bg-surface-50'", "'bg-surface-raised text-text-muted border border-surface-border hover:bg-surface-100'");
// Fallback patterns for tabs
replace("bg-brand-900 text-white shadow-lg", "bg-primary text-text-inverted shadow-lg");
replace("bg-white text-surface-600 border border-surface-100 hover:bg-surface-50", "bg-surface-raised text-text-muted border border-surface-border hover:bg-surface-100");

// ── API key input block ───────────────────────────────────────
replace('bg-brand-50 p-5 rounded-2xl border border-brand-100', 'bg-accent/5 p-5 rounded-2xl border border-accent/20');

// ── CTA / submit buttons ───────────────────────────────────────
replace(
  'bg-brand-600 text-white rounded-2xl font-bold active:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-200',
  'bg-primary text-text-inverted rounded-2xl font-bold active:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg'
);
replace('bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors', 'bg-primary text-text-inverted rounded-xl font-bold hover:opacity-90 transition-colors');
replace("className=\"w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:opacity-90 transition-colors\"", "className=\"w-full py-3 bg-primary text-text-inverted rounded-xl font-bold hover:opacity-90 transition-colors\"");

// ── White card bodies ──────────────────────────────────────────
replace('bg-white p-6 rounded-3xl shadow-soft border border-surface-border', 'bg-surface-raised p-6 rounded-3xl shadow-soft border border-surface-border');
replace('bg-white p-8 rounded-3xl shadow-soft border border-surface-border', 'bg-surface-raised p-8 rounded-3xl shadow-soft border border-surface-border');
replace('bg-white rounded-3xl p-6 max-w-lg', 'bg-surface-raised rounded-3xl p-6 max-w-lg');
replace('bg-white rounded-3xl p-6 max-w-md', 'bg-surface-raised rounded-3xl p-6 max-w-md');
replace('bg-white p-6 rounded-3xl shadow-soft border border-surface-border\n                    ', 'bg-surface-raised p-6 rounded-3xl shadow-soft border border-surface-border\n                    ');

// ── AI analysis input textarea ────────────────────────────────
replace('bg-surface-50 focus:bg-white transition-all', 'bg-surface-100 focus:bg-surface-raised transition-all');

// ── Result card success icon ──────────────────────────────────
replace('bg-emerald-100 rounded-full', 'bg-success/10 rounded-full');
replace('text-emerald-600', 'text-success');

// ── Brand-50 selected states ──────────────────────────────────
replace("'bg-brand-50 border-brand-300 text-brand-700'", "'bg-accent/5 border-accent/30 text-accent'");
replace("'bg-surface-50 border-surface-border text-text-muted hover:bg-surface-100'", "'bg-surface-100 border-surface-border text-text-muted hover:bg-surface-100'");
// remaining bg-brand-50 in ternary / string
replace("bg-brand-50 border-brand-300 text-brand-700", "bg-accent/5 border-accent/30 text-accent");
replace("bg-surface-50 border-surface-200 text-text-muted hover:bg-surface-100", "bg-surface-100 border-surface-border text-text-muted hover:bg-surface-100");

// ── Inline selected/unselected JSA template / PPE ─────────────
replace("'bg-purple-50 border-purple-300 text-purple-700'", "'bg-accent/5 border-accent/30 text-accent'");
replace("'bg-surface-50 border-surface-200 text-surface-600 hover:bg-surface-100'", "'bg-surface-100 border-surface-border text-text-muted hover:bg-surface-100'");
replace("bg-purple-50 border-purple-300 text-purple-700", "bg-accent/5 border-accent/30 text-accent");
replace("bg-surface-50 border-surface-200 text-surface-600 hover:bg-surface-100", "bg-surface-100 border-surface-border text-text-muted hover:bg-surface-100");

// ── Step number badge ─────────────────────────────────────────
replace('w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center font-bold text-sm', 'w-8 h-8 bg-primary text-text-inverted rounded-full flex items-center justify-center font-bold text-sm');

// ── Step expand rows ──────────────────────────────────────────
replace('bg-surface-50 rounded-2xl border border-surface-200 overflow-hidden', 'bg-surface-100 rounded-2xl border border-surface-border overflow-hidden');

// ── Add step buttons ──────────────────────────────────────────
replace('text-accent font-bold text-sm hover:bg-brand-50', 'text-accent font-bold text-sm hover:bg-accent/5');
replace('text-brand-600 font-bold text-sm hover:bg-brand-50', 'text-accent font-bold text-sm hover:bg-accent/5');

// ── Hazard / control field labels ────────────────────────────
replace('text-orange-400 uppercase mb-1 block flex items-center gap-1', 'text-warning uppercase mb-1 block flex items-center gap-1');
replace('text-green-400 uppercase mb-1 block flex items-center gap-1', 'text-success uppercase mb-1 block flex items-center gap-1');

// ── Delete step button ────────────────────────────────────────
replace('text-red-500 font-bold text-sm hover:bg-red-50 px-4 py-2 rounded-xl transition-colors', 'text-danger font-bold text-sm hover:bg-danger/5 px-4 py-2 rounded-xl transition-colors');

// ── Add step dashed border button ────────────────────────────
replace('border-2 border-dashed border-surface-300 rounded-xl text-text-muted font-medium hover:bg-surface-50 transition-colors', 'border-2 border-dashed border-surface-border rounded-xl text-text-muted font-medium hover:bg-surface-100 transition-colors');

// ── Cancel/secondary buttons (py-4) ──────────────────────────
replace('bg-surface-100 text-surface-700 rounded-2xl font-bold hover:bg-surface-200 transition-all flex items-center justify-center gap-2', 'bg-surface-100 text-text-primary rounded-2xl font-bold hover:bg-surface-200 transition-all flex items-center justify-center gap-2');
replace('bg-surface-100 text-surface-700 rounded-xl font-medium hover:bg-surface-200 transition-colors', 'bg-surface-100 text-text-primary rounded-xl font-medium hover:bg-surface-200 transition-colors');

// ── AI Insights section ──────────────────────────────────────
replace('bg-gradient-to-r from-indigo-500 to-purple-600 text-white', 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'); // keep intent
replace("bg-purple-100 text-purple-700 rounded-xl font-medium hover:bg-purple-200 transition-colors disabled:opacity-50", "bg-accent/10 text-accent rounded-xl font-medium hover:bg-accent/20 transition-colors disabled:opacity-50");

// Insight type cards
replace("insight.type === 'warning' ? 'bg-red-50 border-red-200' :", "insight.type === 'warning' ? 'bg-danger/5 border border-danger/20' :");
replace("insight.type === 'pattern' ? 'bg-amber-50 border-amber-200' :", "insight.type === 'pattern' ? 'bg-warning/5 border border-warning/20' :");
replace("insight.type === 'recommendation' ? 'bg-blue-50 border-blue-200' :", "insight.type === 'recommendation' ? 'bg-accent/5 border border-accent/20' :");
replace("'bg-green-50 border-green-200'", "'bg-success/5 border border-success/20'");

// Insight icon bg
replace("insight.type === 'warning' ? 'bg-red-100' :", "insight.type === 'warning' ? 'bg-danger/10' :");
replace("insight.type === 'pattern' ? 'bg-amber-100' :", "insight.type === 'pattern' ? 'bg-warning/10' :");
replace("insight.type === 'recommendation' ? 'bg-blue-100' :", "insight.type === 'recommendation' ? 'bg-accent/10' :");
replace("'bg-green-100'", "'bg-success/10'");

// Insight icons
replace('{insight.type === \'warning\' && <AlertTriangle className="w-4 h-4 text-red-600" />}', '{insight.type === \'warning\' && <AlertTriangle className="w-4 h-4 text-danger" />}');
replace('{insight.type === \'pattern\' && <TrendingUp className="w-4 h-4 text-amber-600" />}', '{insight.type === \'pattern\' && <TrendingUp className="w-4 h-4 text-warning" />}');
replace('{insight.type === \'recommendation\' && <Lightbulb className="w-4 h-4 text-blue-600" />}', '{insight.type === \'recommendation\' && <Lightbulb className="w-4 h-4 text-accent" />}');
replace('{insight.type === \'benchmark\' && <BarChart3 className="w-4 h-4 text-green-600" />}', '{insight.type === \'benchmark\' && <BarChart3 className="w-4 h-4 text-success" />}');

// Insight text
replace("insight.type === 'warning' ? 'text-red-800' :", "insight.type === 'warning' ? 'text-danger' :");
replace("insight.type === 'pattern' ? 'text-amber-800' :", "insight.type === 'pattern' ? 'text-warning' :");
replace("insight.type === 'recommendation' ? 'text-blue-800' :", "insight.type === 'recommendation' ? 'text-accent' :");
replace("'text-green-800'", "'text-success'");

// Empty state
replace('text-center py-8 text-text-muted', 'text-center py-8 text-text-muted'); // already done

// ── Incident section ──────────────────────────────────────────
replace("bg-orange-100 text-orange-700 rounded-xl font-medium hover:bg-orange-200 transition-colors", "bg-warning/10 text-warning rounded-xl font-medium hover:bg-warning/20 transition-colors");

// Incident cards
replace('p-4 bg-surface-50 rounded-xl border border-surface-200', 'p-4 bg-surface-100 rounded-xl border border-surface-border');

// Incident severity badges
replace("incident.severity === 'critical' ? 'bg-red-100 text-red-700' :", "incident.severity === 'critical' ? 'bg-danger/10 text-danger' :");
replace("incident.severity === 'high' ? 'bg-orange-100 text-orange-700' :", "incident.severity === 'high' ? 'bg-warning/10 text-warning' :");
replace("'bg-green-100 text-green-700'", "'bg-success/10 text-success'");

// Incident root cause bg
replace('text-text-primary bg-red-50 p-2 rounded-lg', 'text-text-primary bg-danger/5 p-2 rounded-lg');
replace('text-sm text-green-700 bg-green-50 p-2 rounded-lg flex items-start gap-2', 'text-sm text-success bg-success/5 p-2 rounded-lg flex items-start gap-2');

// ── Purple icon (ClipboardList, FileText, Brain) ─────────────
replace('text-purple-600', 'text-accent');
replace('text-purple-500 ml-2', 'text-accent ml-2');

// ── Orange / AlertTriangle icons ──────────────────────────────
replace('text-orange-500', 'text-warning');
replace('text-orange-500"', 'text-warning"');

// ── Red icon AlertTriangle ────────────────────────────────────
replace('<AlertTriangle className="w-5 h-5 text-red-500"', '<AlertTriangle className="w-5 h-5 text-danger"');

// ── check icon in step ────────────────────────────────────────
replace('text-green-500', 'text-success');

// ── JSA submit success card ───────────────────────────────────
replace('w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6', 'w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6');
replace('bg-surface-50 rounded-xl p-4 mb-6', 'bg-surface-100 rounded-xl p-4 mb-6');

// ── Signature list ────────────────────────────────────────────
replace("sig.signed ? 'bg-green-100' : 'bg-surface-200'", "sig.signed ? 'bg-success/10' : 'bg-surface-100'");
replace("sig.signed ? 'bg-green-100 text-green-700' : 'bg-surface-200 text-surface-600'", "sig.signed ? 'bg-success/10 text-success' : 'bg-surface-100 text-text-muted'");
replace('<CheckCircle className="w-5 h-5 text-green-600"', '<CheckCircle className="w-5 h-5 text-success"');

// ── modal search input ────────────────────────────────────────
replace('w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl mb-4', 'w-full px-4 py-3 bg-surface-100 border border-surface-border rounded-xl mb-4');
replace('w-full p-4 bg-surface-50 rounded-xl border border-surface-200 text-left hover:bg-surface-100 transition-colors', 'w-full p-4 bg-surface-100 rounded-xl border border-surface-border text-left hover:bg-surface-100 transition-colors');
replace('px-2 py-0.5 bg-surface-200 text-text-muted text-xs rounded-full', 'px-2 py-0.5 bg-surface-100 text-text-muted text-xs rounded-full');
replace('XCircle className="w-5 h-5 text-surface-500"', 'XCircle className="w-5 h-5 text-text-muted"');
replace('XCircle className="w-4 h-4 text-surface-400"', 'XCircle className="w-4 h-4 text-text-muted"');

// ── Remaining surface-50 inputs ────────────────────────────────
replace('bg-surface-50 border border-surface-200 rounded-xl', 'bg-surface-100 border border-surface-border rounded-xl');
replace('bg-surface-50 border\n', 'bg-surface-100 border\n');

// ── Remaining bg-surface-50 standalone ───────────────────────
// (should be none left, but just in case)
src = src.replace(/\bbg-surface-50\b/g, (m, offset) => {
  console.log(`[REMAINING bg-surface-50] at offset ${offset}`);
  return 'bg-surface-100';
});

// ── PB / teal gradient links (keep gradient hero) ─────────────
// Keep: bg-gradient-to-r from-indigo-500, from-teal-500

// ── Verification ──────────────────────────────────────────────
const remaining = src.match(/text-brand|text-surface-[0-9]|bg-brand|border-brand|border-surface-[12]/g) || [];
if (remaining.length > 0) {
  console.warn('[REMAINING TOKENS]', [...new Set(remaining)]);
}

fs.writeFileSync(FILE, src, 'utf8');
console.log('\nDone. Changed', src.length - original.length, 'chars net.');
