import re

def fix_file(path, replacements):
    with open(path, 'r') as f:
        content = f.read()
    original = content
    for old, new in replacements:
        content = content.replace(old, new)
    changed = content != original
    with open(path, 'w') as f:
        f.write(content)
    return changed

BASE = '/Users/mudassarnaeem/safetymeg/frontend/src/components/'

# ─── 1. InjuryTrendAnalytics.tsx ───────────────────────────────────────────────
injury = BASE + 'safety/InjuryTrendAnalytics.tsx'
injury_fixes = [
    # Panel card wrappers
    ('bg-slate-800 rounded-2xl p-6 border border-slate-700', 'bg-surface-raised rounded-2xl p-6 border border-surface-border'),
    ('bg-slate-800 rounded-2xl border border-slate-700', 'bg-surface-raised rounded-2xl border border-surface-border'),
    # Period selector wrapper
    ('flex bg-slate-800 rounded-xl p-1 border border-slate-700', 'flex bg-surface-raised rounded-xl p-1 border border-surface-border'),
    # Filters button
    ('bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-700 transition-colors',
     'bg-surface-raised border border-surface-border rounded-xl text-text-secondary hover:bg-surface-overlay transition-colors'),
    # Active/inactive period tab
    ("'bg-brand-600 text-white'", "'bg-accent text-text-onAccent'"),
    ("'text-slate-400 hover:text-white'", "'text-text-muted hover:text-text-primary'"),
    # Progress bar backgrounds
    ('w-full bg-slate-700 rounded-full h-2', 'w-full bg-surface-overlay rounded-full h-2'),
    ('w-16 bg-slate-700 rounded-full h-2', 'w-16 bg-surface-overlay rounded-full h-2'),
    # Shift icon container
    ('w-12 h-12 bg-slate-700 rounded-xl', 'w-12 h-12 bg-surface-overlay rounded-xl'),
    # Progress bar fills
    ('bg-gradient-to-r from-brand-500 to-brand-400 h-2 rounded-full transition-all', 'bg-accent h-2 rounded-full transition-all'),
    ('bg-brand-500 h-2 rounded-full', 'bg-accent h-2 rounded-full'),
    # Text
    ('text-slate-400', 'text-text-muted'),
    ('text-slate-300', 'text-text-secondary'),
    ('text-slate-200', 'text-text-primary'),
    ('text-slate-500', 'text-text-muted'),
    # Headings on non-gradient bg
    ('"text-2xl font-bold text-white"', '"text-2xl font-bold text-text-primary"'),
    ('"text-lg font-bold text-white"', '"text-lg font-bold text-text-primary"'),
]
r = fix_file(injury, injury_fixes)
print(f"InjuryTrendAnalytics: {'CHANGED' if r else 'no change'}")

# ─── 2. UnifiedInvestigation.tsx ───────────────────────────────────────────────
invest = BASE + 'safety/UnifiedInvestigation.tsx'
invest_fixes = [
    # getStatusColor pending/default
    ("'bg-slate-500/20 text-slate-400 border-slate-500/30'",
     "'bg-surface-overlay text-text-muted border-surface-border'"),
    # getSeverityColor default
    ("'bg-slate-500/20 text-slate-400'", "'bg-surface-overlay text-text-muted'"),
    # Phase nav - inactive tabs
    ("'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750'",
     "'bg-surface-raised text-text-muted border border-surface-border hover:bg-surface-overlay'"),
    # Corrective actions panel
    ('bg-slate-800/50 rounded-2xl p-6 border border-slate-700', 'bg-surface-raised rounded-2xl p-6 border border-surface-border'),
    # Individual action items
    ('bg-slate-900/50 rounded-xl p-4 border border-slate-700', 'bg-surface-sunken rounded-xl p-4 border border-surface-border'),
    # Investigation list container
    ('bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden', 'bg-surface-raised rounded-2xl border border-surface-border overflow-hidden'),
    # List header border
    ('p-4 border-b border-slate-700', 'p-4 border-b border-surface-border'),
    # List divider
    ('divide-y divide-slate-700/50', 'divide-y divide-surface-border/50'),
    # Back button
    ('w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors',
     'w-10 h-10 flex items-center justify-center rounded-xl bg-surface-raised border border-surface-border hover:bg-surface-overlay transition-colors'),
    # Search input
    ('w-64 bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-slate-500',
     'w-64 bg-surface-raised border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-text-primary text-sm placeholder:text-text-muted'),
    # Status select
    ('bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-300 text-sm',
     'bg-surface-raised border border-surface-border rounded-xl px-4 py-2.5 text-text-secondary text-sm'),
    # Text colors
    ('text-slate-400', 'text-text-muted'),
    ('text-slate-300', 'text-text-secondary'),
    ('text-slate-500', 'text-text-muted'),
    # Page/section headings
    ('"text-2xl font-bold text-white"', '"text-2xl font-bold text-text-primary"'),
    ('"text-xl font-bold text-white"', '"text-xl font-bold text-text-primary"'),
    ('"text-lg font-bold text-white"', '"text-lg font-bold text-text-primary"'),
    ('"text-sm font-semibold text-white"', '"text-sm font-semibold text-text-primary"'),
    # Milestone title (non-completed)
    ("'text-white'", "'text-text-primary'"),
    # Action description text
    ('"font-medium mb-2 text-white"', '"font-medium mb-2 text-text-primary"'),
    # Investigation ID text on cards
    ('"text-sm text-white font-medium"', '"text-sm text-text-primary font-medium"'),
    ('text-xs text-slate-500', 'text-xs text-text-muted'),
]
r = fix_file(invest, invest_fixes)
print(f"UnifiedInvestigation: {'CHANGED' if r else 'no change'}")

# ─── 3. SafetyReportTemplates.tsx ──────────────────────────────────────────────
templates = BASE + 'reports/SafetyReportTemplates.tsx'
templates_fixes = [
    # Page wrapper
    ('p-4 md:p-6 lg:p-8 min-h-screen bg-slate-900', 'p-4 md:p-6 lg:p-8 min-h-screen bg-surface-base'),
    # Template cards
    ('bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden', 'bg-surface-raised rounded-2xl border border-surface-border overflow-hidden'),
    # Quick stats cards
    ('bg-slate-800 rounded-xl p-4 border border-slate-700', 'bg-surface-raised rounded-xl p-4 border border-surface-border'),
    # Section tags
    ('bg-slate-700/50 rounded-md text-slate-300', 'bg-surface-overlay rounded-md text-text-secondary'),
    ('bg-slate-700/50 rounded-md text-slate-500', 'bg-surface-overlay rounded-md text-text-muted'),
    # Back to Templates button
    ('px-4 py-2 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors',
     'px-4 py-2 bg-surface-overlay text-text-secondary rounded-xl hover:bg-surface-raised transition-colors'),
    # Search input
    ('pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 \n                       rounded-xl text-sm w-64 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50',
     'pl-9 pr-4 py-2.5 bg-surface-raised border border-surface-border \n                       rounded-xl text-sm w-64 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50'),
    # Filter button
    ('p-2.5 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-700 transition-colors',
     'p-2.5 bg-surface-raised rounded-xl border border-surface-border text-text-muted hover:bg-surface-overlay transition-colors'),
    # Header icon bg + text
    ('bg-brand-900/30 rounded-xl', 'bg-accent/10 rounded-xl'),
    ('text-brand-400', 'text-accent'),
    # Text colors
    ('text-slate-400', 'text-text-muted'),
    ('text-slate-300', 'text-text-secondary'),
    ('text-slate-200', 'text-text-primary'),
    ('text-slate-500', 'text-text-muted'),
    ('text-slate-600', 'text-text-muted'),
    # Page heading white text
    ('"text-2xl md:text-3xl font-bold text-white flex items-center gap-3"',
     '"text-2xl md:text-3xl font-bold text-text-primary flex items-center gap-3"'),
    ('"font-semibold text-white mb-2"', '"font-semibold text-text-primary mb-2"'),
]
r = fix_file(templates, templates_fixes)
print(f"SafetyReportTemplates: {'CHANGED' if r else 'no change'}")

# ─── 4. CustomReportBuilder.tsx (SafetyGoalsTargets + full file) ────────────────
builder = BASE + 'reports/CustomReportBuilder.tsx'
builder_fixes = [
    # Page wrapper
    ('min-h-screen bg-slate-900 p-4 md:p-6 lg:p-8', 'min-h-screen bg-surface-base p-4 md:p-6 lg:p-8'),
    # Stats cards
    ('bg-slate-800/50 rounded-xl p-4 border border-slate-700', 'bg-surface-raised rounded-xl p-4 border border-surface-border'),
    # Goal cards
    ('bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden', 'bg-surface-raised rounded-2xl border border-surface-border overflow-hidden'),
    # Section editor item
    ('bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden', 'bg-surface-raised rounded-xl border border-surface-border overflow-hidden'),
    # Section editor border-t
    ('border-t border-slate-700/50', 'border-t border-surface-border'),
    # Expanded config panel border
    ('className="border-t border-slate-700/50"', 'className="border-t border-surface-border"'),
    # Empty state
    ('bg-slate-800/30 rounded-2xl border border-slate-700/50', 'bg-surface-raised/60 rounded-2xl border border-surface-border'),
    # Report preview modal
    ('bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700',
     'bg-surface-raised rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-surface-border'),
    ('p-6 border-b border-slate-700 flex items-center justify-between bg-slate-800/80',
     'p-6 border-b border-surface-border flex items-center justify-between bg-surface-raised'),
    ('p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-slate-900/50',
     'p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-surface-sunken'),
    ('bg-slate-800/50 rounded-xl p-6 border border-slate-700/50',
     'bg-surface-raised rounded-xl p-6 border border-surface-border'),
    # KPI preview inner cards
    ('bg-slate-700/50 rounded-xl p-4', 'bg-surface-overlay rounded-xl p-4'),
    # Chart preview area
    ('h-48 bg-slate-700/30 rounded-lg flex items-center justify-center',
     'h-48 bg-surface-overlay rounded-lg flex items-center justify-center'),
    # Table preview header
    ('thead className="bg-slate-700/50"', 'thead className="bg-surface-overlay"'),
    ('divide-y divide-slate-700/50', 'divide-y divide-surface-border'),
    ('hover:bg-slate-700/30', 'hover:bg-surface-overlay/30'),
    # Checklist preview
    ('bg-slate-700/30 rounded-lg', 'bg-surface-overlay rounded-lg'),
    ('border-2 border-slate-500', 'border-2 border-surface-border'),
    # Goal preview cards
    ('bg-slate-700/30 rounded-xl p-4', 'bg-surface-overlay rounded-xl p-4'),
    ('bg-slate-600 rounded-full h-2', 'bg-surface-overlay rounded-full h-2'),
    ('bg-brand-500 h-2 rounded-full transition-all', 'bg-accent h-2 rounded-full transition-all'),
    ('bg-slate-600', 'bg-surface-overlay'),
    # Progress bar in Goals list
    ('w-full bg-slate-700 rounded-full h-3', 'w-full bg-surface-overlay rounded-full h-3'),
    # Milestone timeline line
    ('w-0.5 bg-slate-700', 'w-0.5 bg-surface-border'),
    # Milestone incomplete state  
    ('bg-slate-600 border-2 border-slate-500', 'bg-surface-overlay border-2 border-surface-border'),
    # Timeline border
    ('border-t border-slate-700/50 flex items-center', 'border-t border-surface-border flex items-center'),
    # Action button border-t
    ('border-t border-slate-700/50 flex items-center gap-2', 'border-t border-surface-border flex items-center gap-2'),
    # View History button
    ('bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50', 'bg-surface-overlay text-text-secondary rounded-lg hover:bg-surface-raised'),
    # Team avatar border
    ('border-2 border-slate-800', 'border-2 border-surface-raised'),
    # Notifications button
    ('bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700', 'bg-surface-raised text-text-secondary rounded-xl hover:bg-surface-overlay'),
    # Category filter chips inactive
    ("'bg-slate-800 text-slate-400 hover:bg-slate-700'", "'bg-surface-raised text-text-muted hover:bg-surface-overlay'"),
    # Status filter buttons inactive
    ("'bg-slate-800 text-slate-400 hover:bg-slate-700'", "'bg-surface-raised text-text-muted hover:bg-surface-overlay'"),
    # Active Add Goal button
    ('bg-brand-600 text-white rounded-xl hover:bg-brand-500', 'bg-accent text-text-onAccent rounded-xl hover:bg-accent/90'),
    # Section editor grip icon + chevron
    ('text-slate-500', 'text-text-muted'),
    # KPI option selected
    ('bg-brand-500/20 border border-brand-500/50', 'bg-accent/20 border border-accent/50'),
    ('bg-slate-700/30 border border-slate-600/30 hover:bg-slate-700/50', 'bg-surface-overlay border border-surface-border hover:bg-surface-raised'),
    # Chart type selected
    ('bg-brand-500/20 border border-brand-500/50 text-brand-300', 'bg-accent/20 border border-accent/50 text-accent'),
    ('bg-slate-700/30 border border-slate-600/30 text-slate-400 hover:bg-slate-700/50', 'bg-surface-overlay border border-surface-border text-text-muted hover:bg-surface-raised'),
    # Select / textarea / input backgrounds in section editor
    ('bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50',
     'bg-surface-overlay border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50'),
    ('bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-1 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50',
     'bg-surface-overlay border border-surface-border rounded-lg px-3 py-1 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50'),
    ('placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none',
     'placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none'),
    # Checkbox borders
    ('border-slate-600 bg-slate-700 text-brand-500', 'border-surface-border bg-surface-overlay text-accent'),
    ('border-slate-600 bg-slate-700 text-brand-500 focus:ring-brand-500/50', 'border-surface-border bg-surface-overlay text-accent focus:ring-accent/50'),
    # Section editor config area labels
    ('text-sm font-medium text-slate-300', 'text-sm font-medium text-text-secondary'),
    ('text-sm text-slate-300', 'text-sm text-text-secondary'),
    ('text-sm text-slate-400', 'text-sm text-text-muted'),
    # Hover bg in section editor
    ('hover:bg-slate-700/50 rounded-lg', 'hover:bg-surface-overlay rounded-lg'),
    # Section editor input title - transparent bg
    ('bg-transparent text-white font-semibold', 'bg-transparent text-text-primary font-semibold'),
    # Text colors general
    ('text-slate-400', 'text-text-muted'),
    ('text-slate-300', 'text-text-secondary'),
    ('text-slate-200', 'text-text-primary'),
    # Headings
    ('"text-2xl md:text-3xl font-bold text-white"', '"text-2xl md:text-3xl font-bold text-text-primary"'),
    ('"text-xl font-bold text-white"', '"text-xl font-bold text-text-primary"'),
    ('"text-lg font-semibold text-white mb-1"', '"text-lg font-semibold text-text-primary mb-1"'),
    ('"text-lg font-semibold text-white mb-4 flex items-center gap-2"', '"text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"'),
    # Summary bullets
    ('text-sm text-slate-300 flex items-center gap-2', 'text-sm text-text-secondary flex items-center gap-2'),
    ('text-sm text-slate-300 whitespace-pre-wrap', 'text-sm text-text-secondary whitespace-pre-wrap'),
    # Table td text
    ('text-sm text-slate-300', 'text-sm text-text-secondary'),
    ('text-sm text-slate-400', 'text-sm text-text-muted'),
    # thead th text
    ('text-xs font-semibold text-slate-300 uppercase', 'text-xs font-semibold text-text-secondary uppercase'),
    # Table header row bg
    ('"bg-slate-700/50"', '"bg-surface-overlay"'),
    # brand-400 icon colors kept as accent
    ('text-brand-400', 'text-accent'),
]
r = fix_file(builder, builder_fixes)
print(f"CustomReportBuilder: {'CHANGED' if r else 'no change'}")

# ─── 5. EHSWorkflowDashboard.tsx ───────────────────────────────────────────────
ehs = BASE + 'safety/EHSWorkflow/EHSWorkflowDashboard.tsx'
ehs_fixes = [
    # Malformed wrapper class
    ('min-h-screen bg-gradient-to-br bg-surface-base', 'min-h-screen bg-surface-base'),
    # Non-semantic surface number tokens
    ('text-surface-500', 'text-text-muted'),
    ('text-surface-600', 'text-text-muted'),
    ('text-surface-700', 'text-text-secondary'),
    ('text-surface-800', 'text-text-primary'),
    ('bg-surface-100', 'bg-surface-overlay'),
    ('hover:bg-surface-200', 'hover:bg-surface-overlay'),
    # Progress bar fills 
    ('bg-brand-500 rounded-full', 'bg-accent rounded-full'),
    ('text-brand-600', 'text-accent'),
    # Already-there but non-semantic tab button classes
    ('bg-surface-100 text-surface-600 hover:bg-surface-200', 'bg-surface-overlay text-text-muted hover:bg-surface-raised'),
]
r = fix_file(ehs, ehs_fixes)
print(f"EHSWorkflowDashboard: {'CHANGED' if r else 'no change'}")

print("\nAll done!")
