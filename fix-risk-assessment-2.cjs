#!/usr/bin/env node
const fs = require('fs');

const FILE = '/Users/mudassarnaeem/safetymeg/frontend/src/pages/RiskAssessment.tsx';
let src = fs.readFileSync(FILE, 'utf8');

const replace = (from, to) => {
  const next = src.split(from).join(to);
  if (next === src) console.warn(`[NO MATCH] ${from.slice(0, 80)}`);
  else console.log(`[OK] ${from.slice(0, 80)}`);
  src = next;
};

// Fix remaining border-surface-100 (at end of line without trailing space or >)
src = src.replace(/border-surface-100(?=[^a-zA-Z0-9])/g, () => { console.log('[OK REGEX] border-surface-100'); return 'border-surface-border'; });

// Fix bg-white on input fields
replace('bg-white border border-surface-border rounded-xl', 'bg-surface-raised border border-surface-border rounded-xl');

// Fix bg-surface-200 in signature (unsigned state)
replace("'bg-success/10' : 'bg-surface-200'", "'bg-success/10' : 'bg-surface-100'");
replace("'bg-success/10 text-success' : 'bg-surface-200 text-text-muted'", "'bg-success/10 text-success' : 'bg-surface-100 text-text-muted'");

// Fix any remaining bg-white that aren't on dark overlay cards
// Only bg-white NOT preceded by / (bg-white/20 etc) and NOT in the two gradient hero divs
src = src.replace(/(?<!\/)\bbg-white\b(?!\/)/g, (m, offset) => {
  // Check context - look for 'rounded-3xl' or 'rounded-xl' nearby (input/card contexts)
  const context = src.slice(Math.max(0, offset - 50), offset + 100);
  if (context.includes('bg-white/')) return m; // skip opacity variants
  if (context.includes('bg-white/20')) return m; // dark card overlay
  console.log(`[OK REGEX] bg-white at offset ${offset}`);
  return 'bg-surface-raised';
});

// Fix incident items list 
replace('p-4 bg-surface-100 rounded-xl border border-surface-border', 'p-4 bg-surface-100 rounded-xl border border-surface-border'); // verify

// Fix step items (bg-surface-50 → bg-surface-100 – already done by fallback regex)
// But check bg-surface-200 remaining
src = src.replace(/\bbg-surface-200\b/g, () => { console.log('[OK REGEX] bg-surface-200'); return 'bg-surface-100'; });

// Verify
const remaining = src.match(/text-brand|text-surface-[0-9]|bg-brand|border-brand|border-surface-[12]/g) || [];
const bgWhite = (src.match(/(?<!\/)\bbg-white\b(?!\/)/g) || []);
if (remaining.length > 0) console.warn('[REMAINING TOKENS]', [...new Set(remaining)]);
if (bgWhite.length > 0) console.warn('[REMAINING bg-white]', bgWhite.length, 'instances');

fs.writeFileSync(FILE, src, 'utf8');
console.log('Done.');
