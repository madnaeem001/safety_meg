import re

path = '/Users/mudassarnaeem/safetymeg/frontend/src/components/reports/CustomReportBuilder.tsx'

with open(path, 'r') as f:
    content = f.read()

original = content

# Status/priority color functions
content = content.replace(
    "default: return 'bg-slate-500/20 text-text-muted border-slate-500/30';",
    "default: return 'bg-surface-overlay text-text-muted border-surface-border';"
)
content = content.replace(
    "case 'low': return 'bg-slate-500/20 text-text-muted';",
    "case 'low': return 'bg-surface-overlay text-text-muted';"
)

# Chart type option active: text-brand-300 → text-accent
content = content.replace(
    "bg-accent/20 border border-accent/50 text-brand-300",
    "bg-accent/20 border border-accent/50 text-accent"
)

# Section editor bg/border inputs and textareas
content = content.replace(
    "bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none",
    "bg-surface-overlay border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
)

# Hover buttons in section editor header
content = content.replace(
    '"p-2 hover:bg-slate-700 rounded-lg transition-colors"\n            >\n              <Printer',
    '"p-2 hover:bg-surface-overlay rounded-lg transition-colors"\n            >\n              <Printer'
)
content = content.replace(
    '"p-2 hover:bg-slate-700 rounded-lg transition-colors"\n            >\n              <X',
    '"p-2 hover:bg-surface-overlay rounded-lg transition-colors"\n            >\n              <X'
)
# Additional hover:bg-slate-700 in other modal close/print buttons
content = re.sub(
    r'(className="p-2 )hover:bg-slate-700( rounded-lg transition-colors")',
    r'\1hover:bg-surface-overlay\2',
    content
)

# Brand-500 accent bar in preview
content = content.replace(
    '"w-1 h-6 bg-brand-500 rounded-full"',
    '"w-1 h-6 bg-accent rounded-full"'
)
content = content.replace(
    '"w-1 h-6 bg-accent rounded-full"',  # already done above, idempotent
    '"w-1 h-6 bg-accent rounded-full"'
)

# KPI preview value text-white inside bg-surface
content = content.replace(
    '<p className="text-2xl font-bold text-white">{kpi.value}</p>',
    '<p className="text-2xl font-bold text-text-primary">{kpi.value}</p>'
)

# brand-400 bullet points in summary
content = content.replace(
    '"w-1.5 h-1.5 bg-brand-400 rounded-full"',
    '"w-1.5 h-1.5 bg-accent rounded-full"'
)

# Goal title in preview card
content = content.replace(
    '<h4 className="font-medium text-white">{goal.title}</h4>',
    '<h4 className="font-medium text-text-primary">{goal.title}</h4>'
)

# Status filter active
content = content.replace(
    "? 'bg-brand-600 text-white'\n                    : 'bg-surface-raised text-text-muted hover:bg-surface-overlay'",
    "? 'bg-accent text-text-onAccent'\n                    : 'bg-surface-raised text-text-muted hover:bg-surface-overlay'"
)

# Stats cards text-white values → text-text-primary (SafetyGoalsTargets stats overview)
content = content.replace(
    '"text-2xl font-bold text-white">{goals.length}</p>',
    '"text-2xl font-bold text-text-primary">{goals.length}</p>'
)
content = content.replace(
    '"text-2xl font-bold text-white">{goals.filter(g => g.status === \'on-track\' || g.status === \'completed\').length}</p>',
    '"text-2xl font-bold text-text-primary">{goals.filter(g => g.status === \'on-track\' || g.status === \'completed\').length}</p>'
)
content = content.replace(
    '"text-2xl font-bold text-white">{goals.filter(g => g.status === \'at-risk\').length}</p>',
    '"text-2xl font-bold text-text-primary">{goals.filter(g => g.status === \'at-risk\').length}</p>'
)
content = content.replace(
    '"text-2xl font-bold text-white">{goals.filter(g => g.status === \'completed\').length}</p>',
    '"text-2xl font-bold text-text-primary">{goals.filter(g => g.status === \'completed\').length}</p>'
)

# Empty state icon
content = content.replace(
    'text-slate-600 mx-auto mb-4"',
    'text-text-muted mx-auto mb-4"'
)

# Goal currentValue text-white
content = content.replace(
    '"text-3xl font-bold text-white">\n                        {goal.currentValue}',
    '"text-3xl font-bold text-text-primary">\n                        {goal.currentValue}'
)

# Progress bar: bg-brand-500 fill in goals
content = content.replace(
    "goal.status === 'overdue' ? 'bg-red-500' :\n                          'bg-brand-500'",
    "goal.status === 'overdue' ? 'bg-red-500' :\n                          'bg-accent'"
)

# Milestone inactive state
content = content.replace(
    "milestone.completed ? 'bg-emerald-500/10' : 'bg-slate-700/30 hover:bg-slate-700/50'",
    "milestone.completed ? 'bg-emerald-500/10' : 'bg-surface-overlay hover:bg-surface-raised'"
)

# Milestone title non-completed → text-text-primary
content = content.replace(
    "milestone.completed ? 'text-emerald-400' : 'text-white'",
    "milestone.completed ? 'text-emerald-400' : 'text-text-primary'"
)

# Team avatar (bg-brand-600)
content = content.replace(
    '"w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-xs text-white border-2 border-surface-raised"',
    '"w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs text-text-onAccent border-2 border-surface-raised"'
)
# Overflow avatar count
content = content.replace(
    '"w-6 h-6 rounded-full bg-surface-overlay flex items-center justify-center text-xs text-white border-2 border-surface-raised"',
    '"w-6 h-6 rounded-full bg-surface-overlay flex items-center justify-center text-xs text-text-primary border-2 border-surface-raised"'
)

# ── Modals ──
# Progress Update modal
content = content.replace(
    '"bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-700"',
    '"bg-surface-raised rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-surface-border"'
)
content = content.replace(
    '"bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700"',
    '"bg-surface-raised rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl border border-surface-border"'
)
content = content.replace(
    '"bg-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700"',
    '"bg-surface-raised rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-surface-border"'
)
content = content.replace(
    '"bg-slate-800 rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl border border-slate-700"',
    '"bg-surface-raised rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl border border-surface-border"'
)
content = content.replace(
    '"bg-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-700"',
    '"bg-surface-raised rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-surface-border"'
)

# Modal headings
content = re.sub(
    r'(className="text-xl font-bold )text-white( flex items-center gap-2">)',
    r'\1text-text-primary\2',
    content
)

# Modal inputs
content = content.replace(
    '"flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"',
    '"flex-1 bg-surface-overlay border border-surface-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"'
)
content = content.replace(
    'bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none',
    'bg-surface-overlay border border-surface-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none'
)
# Progress update milestone count progress bar
content = content.replace(
    '"mt-2 w-full bg-slate-700 rounded-full h-2"',
    '"mt-2 w-full bg-surface-overlay rounded-full h-2"'
)
# Cancel/back buttons in modals
content = re.sub(
    r'bg-slate-700( text-text-secondary rounded-xl hover:bg-surface-overlay transition-colors)',
    r'bg-surface-overlay\1',
    content
)
content = re.sub(
    r'bg-slate-700( text-text-secondary rounded-xl hover:bg-surface-overlay)',
    r'bg-surface-overlay\1',
    content
)

# Team assignment modal - unassigned member row 
content = content.replace(
    "'bg-slate-700/30 hover:bg-slate-700/50 border border-transparent'",
    "'bg-surface-overlay hover:bg-surface-raised border border-transparent'"
)
# Team assignment checkbox
content = content.replace(
    '"w-4 h-4 rounded border-slate-600 bg-slate-700 text-purple-500 focus:ring-purple-500/50"',
    '"w-4 h-4 rounded border-surface-border bg-surface-overlay text-purple-500 focus:ring-purple-500/50"'
)
# Member name text-white
content = content.replace(
    '<p className="font-medium text-white">{member.name}</p>',
    '<p className="font-medium text-text-primary">{member.name}</p>'
)

# Dashboard modal
content = content.replace(
    '"bg-slate-700/30 rounded-xl p-5 border border-slate-600/50"',
    '"bg-surface-overlay rounded-xl p-5 border border-surface-border"'
)
content = content.replace(
    '"bg-slate-800/50 rounded-lg p-4"',
    '"bg-surface-raised rounded-lg p-4"'
)
content = content.replace(
    '"font-medium text-white text-sm truncate max-w-[180px]"',
    '"font-medium text-text-primary text-sm truncate max-w-[180px]"'
)
content = content.replace(
    '"bg-slate-500 text-slate-950"',  # leaderboard 2nd place
    '"bg-surface-overlay text-text-primary"'
)
content = content.replace(
    '"text-sm font-medium text-white truncate"',
    '"text-sm font-medium text-text-primary truncate"'
)
# Dashboard stats text-white
content = re.sub(
    r'(className="text-3xl font-bold )text-white(">)',
    r'\1text-text-primary\2',
    content
)
content = content.replace(
    '"text-sm font-medium text-white">{count}</span>',
    '"text-sm font-medium text-text-primary">{count}</span>'
)

# Template selection modal
content = content.replace(
    '"flex flex-col items-center gap-3 p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl transition-colors text-left border border-slate-600/30 hover:border-brand-500/30"',
    '"flex flex-col items-center gap-3 p-4 bg-surface-overlay hover:bg-surface-raised rounded-xl transition-colors text-left border border-surface-border hover:border-accent/30"'
)
content = content.replace(
    '"w-12 h-12 bg-brand-500/20 rounded-xl flex items-center justify-center"',
    '"w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center"'
)
content = content.replace(
    '"font-medium text-white text-sm">{template.label}</h3>',
    '"font-medium text-text-primary text-sm">{template.label}</h3>'
)

# ── CustomReportBuilder main component ──
# Report settings panel
content = content.replace(
    '"bg-slate-800/50 rounded-2xl p-6 mb-6 border border-slate-700/50"',
    '"bg-surface-raised rounded-2xl p-6 mb-6 border border-surface-border"'
)
content = content.replace(
    '"bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50"',
    '"bg-surface-raised rounded-2xl p-6 border border-surface-border"'
)
content = content.replace(
    '"bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 mb-6"',
    '"bg-surface-raised rounded-2xl p-6 border border-surface-border mb-6"'
)
# Report section headings
content = content.replace(
    '"text-lg font-semibold text-white">Report Settings</h2>',
    '"text-lg font-semibold text-text-primary">Report Settings</h2>'
)
content = content.replace(
    '"text-lg font-semibold text-white">Report Sections</h2>',
    '"text-lg font-semibold text-text-primary">Report Sections</h2>'
)
content = content.replace(
    '"text-lg font-semibold text-white mb-4">Saved Reports</h2>',
    '"text-lg font-semibold text-text-primary mb-4">Saved Reports</h2>'
)
# Section count badge
content = content.replace(
    '"px-2 py-0.5 bg-slate-700 rounded-full text-xs text-text-muted"',
    '"px-2 py-0.5 bg-surface-overlay rounded-full text-xs text-text-muted"'
)
# Inputs in CustomReportBuilder form
content = content.replace(
    'bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50',
    'bg-surface-overlay border border-surface-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50'
)
# Empty sections state icon  
content = content.replace(
    '"w-12 h-12 text-slate-600 mx-auto mb-4"',
    '"w-12 h-12 text-text-muted mx-auto mb-4"'
)
# Saved report cards
content = content.replace(
    '"font-medium text-white mb-1">{saved.name}</h3>',
    '"font-medium text-text-primary mb-1">{saved.name}</h3>'
)
content = content.replace(
    '"flex-1 py-2 text-xs bg-slate-700 text-text-secondary rounded-lg hover:bg-surface-overlay transition-colors"',
    '"flex-1 py-2 text-xs bg-surface-overlay text-text-secondary rounded-lg hover:bg-surface-raised transition-colors"'
)

# Notification settings modal (line ~2840)
content = content.replace(
    '"bg-slate-800 rounded-2xl w-full max-w-md overflow-\nhidden shadow-2xl border border-slate-700"',
    '"bg-surface-raised rounded-2xl w-full max-w-md overflow-\nhidden shadow-2xl border border-surface-border"'
)
# Add Goal form modal inputs
content = re.sub(
    r'bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white(?: placeholder-slate-500)? focus:outline-none focus:ring-2 focus:ring-\w+-500/50"',
    'bg-surface-overlay border border-surface-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"',
    content
)
# Checkbox in Add Goal
content = content.replace(
    '"w-4 h-4 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500/50"',
    '"w-4 h-4 rounded border-surface-border bg-surface-overlay text-amber-500 focus:ring-amber-500/50"'
)
# Cancel button in add goal / progress history modals (bg-slate-700 text-text-secondary)
content = re.sub(
    r'"flex-1 py-3 bg-slate-700 text-text-secondary rounded-xl hover:bg-surface-overlay transition-colors"',
    '"flex-1 py-3 bg-surface-overlay text-text-secondary rounded-xl hover:bg-surface-raised transition-colors"',
    content
)

# Remaining bg-slate-700/50 in unmatched inputs
content = content.replace(
    'bg-slate-700/50 border border-slate-600 rounded-xl',
    'bg-surface-overlay border border-surface-border rounded-xl'
)
content = content.replace(
    'bg-slate-700/50 border border-slate-600/50 rounded-xl',
    'bg-surface-overlay border border-surface-border rounded-xl'
)

# text-white inside progress history empty state icon
content = content.replace(
    '"w-12 h-12 text-slate-600 mx-auto mb-4"\n', 
    '"w-12 h-12 text-text-muted mx-auto mb-4"\n'
)

# bg-slate-700/30 with border-slate-600/50 in dashboard panels
content = content.replace(
    '"bg-slate-700/30 rounded-xl p-5 border border-slate-600/50"',
    '"bg-surface-overlay rounded-xl p-5 border border-surface-border"'
)
content = content.replace(
    '"bg-slate-700/30 rounded-xl p-5 border border-slate-600/50 mb-6"',
    '"bg-surface-overlay rounded-xl p-5 border border-surface-border mb-6"'
)

# Reminder modal bg-slate-700/50 textarea  
content = content.replace(
    '"w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none"',
    '"w-full bg-surface-overlay border border-surface-border rounded-xl px-4 py-3 text-text-primary focus:outline-none"'
)

changed = content != original
with open(path, 'w') as f:
    f.write(content)

print(f"CustomReportBuilder: {'CHANGED' if changed else 'no change'}")
# Count remaining
import subprocess
result = subprocess.run(['grep', '-cE', 
    'bg-slate-[0-9]|text-slate-[0-9]|bg-brand-[0-9]|text-brand-[0-9]|bg-surface-[0-9]|text-surface-[0-9]|bg-white\\b',
    path], capture_output=True, text=True)
print(f"Remaining violations: {result.stdout.strip()}")
