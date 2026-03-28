import os

def fix(path, pairs):
    if not os.path.exists(path):
        print(f"NOT FOUND: {path}"); return
    with open(path) as f: src = f.read()
    orig = src
    for old, new in pairs:
        src = src.replace(old, new)
    with open(path, 'w') as f: f.write(src)
    print(f"{'CHANGED' if src != orig else 'NO CHANGE'}: {os.path.basename(path)}")

base = '/Users/mudassarnaeem/safetymeg/frontend/src/pages'

# ── PropertyIncidentReport.tsx ──────────────────────────────────────────────
fix(f'{base}/PropertyIncidentReport.tsx', [
    ('text-surface-400"', 'text-text-muted"'),
    ('bg-surface-100 border border-surface-border rounded-2xl focus:ring-2 focus:ring-accent/20 outline-none transition-all"',
     'bg-surface-sunken border border-surface-border rounded-2xl focus:ring-2 focus:ring-accent/20 outline-none transition-all"'),
    ('bg-surface-100 border border-surface-border rounded-2xl focus:ring-2 focus:ring-accent/20 outline-none transition-all resize-none"',
     'bg-surface-sunken border border-surface-border rounded-2xl focus:ring-2 focus:ring-accent/20 outline-none transition-all resize-none"'),
])

# ── InvestigationReports.tsx ─────────────────────────────────────────────────
fix(f'{base}/InvestigationReports.tsx', [
    ("'bg-surface-100'", "'bg-surface-raised'"),
    ("'border-surface-border'", "'border-surface-border'"),  # already correct, skip
    ("bg-surface-100 hover:bg-primary-100 text-surface-500 hover:text-primary-600",
     "bg-surface-raised hover:bg-accent/10 text-text-muted hover:text-accent"),
    ("hover:bg-surface-50/50", "hover:bg-surface-overlay/50"),
    ("border-surface-100\"", "border-surface-border\""),
    ("border-surface-200\"", "border-surface-border\""),
    ("bg-surface-50 rounded-2xl border border-surface-200", "bg-surface-raised rounded-2xl border border-surface-border"),
    ("text-surface-300\"", "text-text-muted\""),
    ("text-surface-400\"", "text-text-muted\""),
    ("text-surface-400}", "text-text-muted}"),
    ("text-surface-500\"", "text-text-muted\""),
    ("text-surface-500}", "text-text-muted}"),
    ("text-surface-500 ", "text-text-muted "),
    ("text-surface-600 ", "text-text-secondary "),
    ("text-surface-600\"", "text-text-secondary\""),
    ("<ChevronDown className=\"w-5 h-5 text-surface-300\"", "<ChevronDown className=\"w-5 h-5 text-text-muted\""),
    ("bg-surface-200\"", "bg-surface-raised\""),
    ("bg-surface-100 flex items-center justify-center", "bg-surface-raised flex items-center justify-center"),
    ("text-surface-500\">No backend", "text-text-muted\">No backend"),
])

# ── RiskRegister.tsx ──────────────────────────────────────────────────────────
fix(f'{base}/RiskRegister.tsx', [
    ("bg-surface-50 border border-surface-200 text-sm text-surface-500",
     "bg-surface-raised border border-surface-border text-sm text-text-muted"),
    ("border-b border-surface-50", "border-b border-surface-border"),
    ("bg-accent-50/70", "bg-accent/10"),
    ("hover:bg-surface-50/50", "hover:bg-surface-overlay/50"),
    ("text-surface-600\"", "text-text-secondary\""),
    ("p-4 rounded-2xl bg-surface-50 border border-surface-100",
     "p-4 rounded-2xl bg-surface-raised border border-surface-border"),
    ("p-5 rounded-2xl bg-surface-50 border border-surface-100",
     "p-5 rounded-2xl bg-surface-raised border border-surface-border"),
])

# ── RiskAssessment.tsx ────────────────────────────────────────────────────────
fix(f'{base}/RiskAssessment.tsx', [
    # Tab inactive state
    ("bg-surface-raised text-text-muted border border-surface-border hover:bg-surface-100",
     "bg-surface-raised text-text-muted border border-surface-border hover:bg-surface-overlay"),
    # All textarea/input bg
    ("h-40 px-4 py-3 rounded-xl border border-surface-border focus:ring-2 focus:ring-accent focus:border-accent resize-none bg-surface-100 focus:bg-surface-raised",
     "h-40 px-4 py-3 rounded-xl border border-surface-border focus:ring-2 focus:ring-accent focus:border-accent resize-none bg-surface-sunken focus:bg-surface-raised"),
    ("px-4 py-3 bg-surface-100 border border-surface-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none\"",
     "px-4 py-3 bg-surface-sunken border border-surface-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none\""),
    ("px-4 py-3 bg-surface-100 border border-surface-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none resize-none\"",
     "px-4 py-3 bg-surface-sunken border border-surface-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none resize-none\""),
    ("flex-1 px-4 py-2 bg-surface-100 border border-surface-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none\"",
     "flex-1 px-4 py-2 bg-surface-sunken border border-surface-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none\""),
    ("px-4 py-3 bg-surface-100 border border-surface-border rounded-xl mb-4\"",
     "px-4 py-3 bg-surface-sunken border border-surface-border rounded-xl mb-4\""),
    ("px-4 py-3 bg-surface-100 border border-surface-border rounded-xl\"",
     "px-4 py-3 bg-surface-sunken border border-surface-border rounded-xl\""),
    # Inactive toggle/severity buttons
    ("'bg-surface-100 border-surface-border text-text-muted hover:bg-surface-100'",
     "'bg-surface-raised border-surface-border text-text-muted hover:bg-surface-overlay'"),
    # Section container divs
    ("className=\"bg-surface-100 rounded-2xl border border-surface-border overflow-hidden\"",
     "className=\"bg-surface-raised rounded-2xl border border-surface-border overflow-hidden\""),
    ("className=\"bg-surface-100 rounded-2xl border border-surface-border overflow-hidden\">",
     "className=\"bg-surface-raised rounded-2xl border border-surface-border overflow-hidden\">"),
    # Section header hover
    ("p-4 hover:bg-surface-100 transition-colors\"",
     "p-4 hover:bg-surface-overlay transition-colors\""),
    # Small cards
    ("p-4 bg-surface-100 rounded-xl border border-surface-border\"",
     "p-4 bg-surface-raised rounded-xl border border-surface-border\""),
    ("p-4 bg-surface-100 rounded-xl border border-surface-border\">",
     "p-4 bg-surface-raised rounded-xl border border-surface-border\">"),
    # Tags
    ("bg-surface-100 text-text-muted text-xs rounded-full\"",
     "bg-surface-raised text-text-muted text-xs rounded-full\""),
    # Incident card hover
    ("w-full p-4 bg-surface-100 rounded-xl border border-surface-border text-left hover:bg-surface-100 transition-colors\"",
     "w-full p-4 bg-surface-raised rounded-xl border border-surface-border text-left hover:bg-surface-overlay transition-colors\""),
    # Summary/detail box
    ("bg-surface-100 rounded-xl p-4 mb-6\"", "bg-surface-raised rounded-xl p-4 mb-6\""),
    # Signature status
    ("gap-3 p-3 bg-surface-100 rounded-xl\"", "gap-3 p-3 bg-surface-raised rounded-xl\""),
    ("sig.signed ? 'bg-success/10' : 'bg-surface-100'",
     "sig.signed ? 'bg-success/10' : 'bg-surface-raised'"),
    ("sig.signed ? 'bg-success/10 text-success' : 'bg-surface-100 text-text-muted'",
     "sig.signed ? 'bg-success/10 text-success' : 'bg-surface-raised text-text-muted'"),
    # Save/cancel buttons
    ("flex-1 py-4 bg-surface-100 text-text-primary rounded-2xl font-bold hover:bg-surface-100 transition-all flex items-center justify-center gap-2\"",
     "flex-1 py-4 bg-surface-raised text-text-primary rounded-2xl font-bold hover:bg-surface-overlay transition-all flex items-center justify-center gap-2\""),
    ("w-full py-3 bg-surface-100 text-text-primary rounded-xl font-medium hover:bg-surface-100 transition-colors\"",
     "w-full py-3 bg-surface-raised text-text-primary rounded-xl font-medium hover:bg-surface-overlay transition-colors\""),
    # Add row button
    ("w-full py-3 border-2 border-dashed border-surface-border rounded-xl text-text-muted font-medium hover:bg-surface-100 transition-colors\"",
     "w-full py-3 border-2 border-dashed border-surface-border rounded-xl text-text-muted font-medium hover:bg-surface-overlay transition-colors\""),
    # Close button hover
    ("p-2 hover:bg-surface-100 rounded-full\"", "p-2 hover:bg-surface-overlay rounded-full\""),
    ("p-1 hover:bg-surface-100 rounded-lg\"", "p-1 hover:bg-surface-overlay rounded-lg\""),
    # Glass effect (bg-white/20 → keep as overlay)
    ("bg-white/20 rounded-xl\"", "bg-surface-overlay/20 rounded-xl\""),
    ("bg-white/20 rounded-xl\">", "bg-surface-overlay/20 rounded-xl\">"),
])

# ── PermitToWork.tsx ──────────────────────────────────────────────────────────
fix(f'{base}/PermitToWork.tsx', [
    ("bg-surface-50 pb-20", "bg-surface-base pb-20"),
    ("border-surface-200/70 bg-white/85 px-6 py-4 backdrop-blur-xl",
     "border-surface-border bg-surface-overlay/85 px-6 py-4 backdrop-blur-xl"),
    ("text-surface-900\"", "text-text-primary\""),
    ("text-surface-500\"", "text-text-muted\""),
    ("text-surface-500}", "text-text-muted}"),
    ("text-surface-400\"", "text-text-muted\""),
    ("border-surface-200 bg-white p-6 shadow-soft",
     "border-surface-border bg-surface-raised p-6 shadow-soft"),
    ("border-surface-200 bg-white p-5 shadow-soft",
     "border-surface-border bg-surface-raised p-5 shadow-soft"),
    ("border-surface-200 bg-white hover:border-brand-200 hover:bg-surface-50",
     "border-surface-border bg-surface-raised hover:border-accent/30 hover:bg-surface-overlay"),
])

print("\nAll 5 files processed.")
