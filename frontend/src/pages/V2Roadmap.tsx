import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── mock data ───────────────────────────────────────────────────── */
const API_INTEGRATIONS = [
  { id: 1, name: 'HR System (Workday)', status: 'connected', type: 'Employee Roster Sync', lastSync: '2026-02-19 23:45', records: 1284, frequency: 'Every 6 hours', health: 'healthy' },
  { id: 2, name: 'Payroll (ADP)', status: 'connected', type: 'Training Hours Export', lastSync: '2026-02-19 18:00', records: 340, frequency: 'Daily', health: 'healthy' },
  { id: 3, name: 'Asset Management (SAP)', status: 'pending', type: 'Equipment Registry', lastSync: 'Never', records: 0, frequency: 'Real-time webhook', health: 'pending' },
  { id: 4, name: 'Facilities (Archibus)', status: 'error', type: 'Location Hierarchy', lastSync: '2026-02-15 08:00', records: 52, frequency: 'Weekly', health: 'error' },
  { id: 5, name: 'Learning Mgmt (Cornerstone)', status: 'connected', type: 'Certification Import', lastSync: '2026-02-19 22:00', records: 892, frequency: 'Every 12 hours', health: 'warning' },
  { id: 6, name: 'Visitor Management (Envoy)', status: 'planned', type: 'Contractor Pre-qual', lastSync: 'N/A', records: 0, frequency: 'TBD', health: 'pending' },
];

const SYNC_CONFLICTS = [
  { id: 1, form: 'Monthly Fire Extinguisher Inspection', user1: 'Mike Torres', user2: 'Sarah Chen', field: 'Pressure Reading – Unit #47', value1: '185 PSI', value2: '190 PSI', timestamp1: '2026-02-19 14:22', timestamp2: '2026-02-19 14:25', status: 'unresolved' },
  { id: 2, form: 'Weekly Crane Inspection', user1: 'James Wright', user2: 'Ana Petrov', field: 'Wire Rope Condition', value1: 'Acceptable', value2: 'Needs Replacement', timestamp1: '2026-02-18 09:15', timestamp2: '2026-02-18 09:18', status: 'resolved', resolution: 'Kept Ana Petrov\'s entry (more recent inspection)' },
  { id: 3, form: 'Hazard Assessment – Dock Area', user1: 'Carlos Diaz', user2: 'Carlos Diaz', field: 'Risk Score Override', value1: '3 (Medium)', value2: '4 (High)', timestamp1: '2026-02-17 16:00 (offline)', timestamp2: '2026-02-17 16:45 (online)', status: 'unresolved' },
  { id: 4, form: 'PPE Inventory Count', user1: 'Lisa Park', user2: 'Tom Baker', field: 'Hard Hats – Remaining', value1: '24', value2: '22', timestamp1: '2026-02-16 11:00', timestamp2: '2026-02-16 11:30', status: 'resolved', resolution: 'Merged: Used Tom Baker\'s count (physical recount)' },
];

const ROADMAP_ITEMS = [
  { id: 1, version: '2.0', title: 'HR System Auto-Roster Sync', description: 'Pull employee data from Workday/BambooHR to automatically populate and maintain the worker roster. No more manual CSV uploads.', status: 'in-progress', priority: 'critical', effort: 'Large', eta: 'Q2 2026', category: 'api', progress: 65 },
  { id: 2, version: '2.0', title: 'Offline Sync Conflict Resolution', description: 'Intelligent merge engine for when two workers edit the same form offline. Auto-resolve trivial conflicts, flag significant ones for supervisor review.', status: 'in-progress', priority: 'critical', effort: 'Large', eta: 'Q2 2026', category: 'offline', progress: 40 },
  { id: 3, version: '2.0', title: 'Real-Time Push Notifications', description: 'Instant alerts for overdue corrective actions, permit expirations, and high-risk hazard reports.', status: 'planned', priority: 'high', effort: 'Medium', eta: 'Q2 2026', category: 'notifications', progress: 10 },
  { id: 4, version: '2.1', title: 'Predictive Analytics Engine', description: 'ML model to predict incident likelihood based on leading indicators, weather data, and historical patterns.', status: 'research', priority: 'high', effort: 'Extra Large', eta: 'Q3 2026', category: 'ai', progress: 5 },
  { id: 5, version: '2.1', title: 'Multi-Language Dynamic Forms', description: 'Forms auto-translate based on worker\'s preferred language setting, including right-to-left support.', status: 'planned', priority: 'medium', effort: 'Medium', eta: 'Q3 2026', category: 'i18n', progress: 0 },
  { id: 6, version: '2.0', title: 'SSO Production Rollout', description: 'Complete Okta & Azure AD integration with MFA enforcement and session management.', status: 'in-progress', priority: 'critical', effort: 'Medium', eta: 'Q1 2026', category: 'security', progress: 85 },
  { id: 7, version: '2.1', title: 'Wearable Device Integration', description: 'Connect to smart hard hats and gas monitors for automatic environmental readings and lone-worker alerts.', status: 'research', priority: 'medium', effort: 'Extra Large', eta: 'Q4 2026', category: 'iot', progress: 0 },
  { id: 8, version: '2.0', title: 'Automated OSHA 300 Log Generation', description: 'Auto-compile injury data into OSHA 300/300A/301 forms with electronic filing capability.', status: 'planned', priority: 'high', effort: 'Medium', eta: 'Q2 2026', category: 'compliance', progress: 15 },
];

const OFFLINE_STATS = {
  totalSyncs: 4820,
  conflictsDetected: 23,
  autoResolved: 17,
  manualReview: 6,
  avgSyncTime: '2.3s',
  offlineFormsSaved: 312,
  lastConflict: '2026-02-19 14:25',
};

const tabs = [
  { id: 'roadmap', label: 'Version Roadmap', icon: '🗺️' },
  { id: 'api', label: 'API Integrations', icon: '🔌' },
  { id: 'offline', label: 'Offline & Sync', icon: '📡' },
  { id: 'conflicts', label: 'Sync Conflicts', icon: '⚠️' },
];

/* ─── helpers ─────────────────────────────────────────────────────── */
function statusBadge(s: string) {
  const map: Record<string, string> = {
    'in-progress': 'bg-accent/20 text-accent border-accent/30',
    planned: 'bg-warning/20 text-warning border-warning/30',
    research: 'bg-ai/20 text-ai border-ai/30',
    completed: 'bg-success/20 text-success border-success/30',
  };
  return map[s] ?? 'bg-surface-sunken text-text-muted border-surface-border';
}

function healthDot(h: string) {
  return h === 'healthy' ? 'bg-success' : h === 'warning' ? 'bg-warning' : h === 'error' ? 'bg-danger' : 'bg-surface-border';
}

function priorityColor(p: string) {
  return p === 'critical' ? 'text-danger' : p === 'high' ? 'text-warning' : 'text-text-muted';
}

export function V2Roadmap() {
  const [activeTab, setActiveTab] = useState('roadmap');
  const [roadmapFilter, setRoadmapFilter] = useState('all');

  /* ── Roadmap ────────────────────────────────────────────────────── */
  const filtered = roadmapFilter === 'all' ? ROADMAP_ITEMS : ROADMAP_ITEMS.filter(r => r.status === roadmapFilter);

  const renderRoadmap = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {['all', 'in-progress', 'planned', 'research'].map(f => (
          <button key={f} onClick={() => setRoadmapFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${roadmapFilter === f ? 'bg-accent/20 text-accent border border-accent/40' : 'text-text-muted hover:text-text-primary border border-transparent'}`}>
            {f === 'all' ? 'All Items' : f.replace('-', ' ').replace(/^\w/, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* version groups */}
      {['2.0', '2.1'].map(ver => {
        const items = filtered.filter(r => r.version === ver);
        if (!items.length) return null;
        return (
          <div key={ver}>
            <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-accent/20 text-accent text-sm font-bold">v{ver}</span>
              {ver === '2.0' ? 'Current Development' : 'Next Major Release'}
            </h3>
            <div className="space-y-3">
              {items.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="rounded-xl border border-surface-border bg-surface-sunken backdrop-blur-sm p-5">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-text-primary font-medium">{item.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBadge(item.status)}`}>{item.status.replace('-', ' ')}</span>
                        <span className={`text-xs font-medium ${priorityColor(item.priority)}`}>● {item.priority}</span>
                      </div>
                      <p className="text-sm text-text-muted mt-2">{item.description}</p>
                    </div>
                    <div className="flex gap-4 text-right shrink-0">
                      <div><p className="text-xs text-text-muted">Effort</p><p className="text-sm text-text-secondary">{item.effort}</p></div>
                      <div><p className="text-xs text-text-muted">ETA</p><p className="text-sm text-accent">{item.eta}</p></div>
                    </div>
                  </div>
                  {item.progress > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-text-muted mb-1"><span>Progress</span><span>{item.progress}%</span></div>
                      <div className="w-full bg-surface-sunken rounded-full h-2">
                        <div className="bg-gradient-to-r from-accent to-ai h-2 rounded-full transition-all" style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  /* ── API Integrations ──────────────────────────────────────────── */
  const renderAPI = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">API Integration Hub</h3>
        <button className="px-4 py-2 rounded-lg bg-accent/20 border border-accent/40 text-accent text-sm hover:bg-accent/30 transition">+ Add Integration</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {API_INTEGRATIONS.map((api, i) => (
          <motion.div key={api.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
            className="rounded-xl border border-surface-border bg-surface-sunken backdrop-blur-sm p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${healthDot(api.health)}`} />
                <h4 className="text-text-primary font-medium text-sm">{api.name}</h4>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${api.status === 'connected' ? 'bg-success/20 text-success' : api.status === 'error' ? 'bg-danger/20 text-danger' : api.status === 'pending' ? 'bg-warning/20 text-warning' : 'bg-surface-sunken text-text-muted'}`}>
                {api.status}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-2">Type: {api.type}</p>
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-surface-border/30">
              <div><p className="text-xs text-text-muted">Last Sync</p><p className="text-xs text-text-secondary">{api.lastSync}</p></div>
              <div><p className="text-xs text-text-muted">Records</p><p className="text-xs text-text-secondary">{api.records.toLocaleString()}</p></div>
              <div className="col-span-2"><p className="text-xs text-text-muted">Frequency: <span className="text-text-secondary">{api.frequency}</span></p></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* HR Roster Highlight */}
      <div className="rounded-xl border border-accent/30 bg-accent/5 backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold text-accent mb-2">🔗 HR Auto-Roster: Feature Spotlight</h3>
        <p className="text-sm text-text-muted mb-4">Automatically sync your employee roster from HR systems instead of manual CSV imports. Supports Workday, BambooHR, ADP, and UKG.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: 'Employees Synced', v: '1,284' },
            { l: 'New Hires (30d)', v: '18' },
            { l: 'Terminations (30d)', v: '7' },
            { l: 'Dept Changes', v: '12' },
          ].map((s, i) => (
            <div key={i} className="rounded-lg bg-surface-sunken p-3 text-center">
              <p className="text-xs text-text-muted">{s.l}</p>
              <p className="text-xl font-bold text-text-primary mt-1">{s.v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── Offline & Sync ────────────────────────────────────────────── */
  const renderOffline = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-text-primary">Offline Sync Health Monitor</h3>

      {/* stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: 'Total Syncs', v: OFFLINE_STATS.totalSyncs.toLocaleString(), c: 'from-cyan-500 to-blue-500' },
          { l: 'Offline Forms Saved', v: OFFLINE_STATS.offlineFormsSaved.toString(), c: 'from-violet-500 to-purple-500' },
          { l: 'Avg Sync Time', v: OFFLINE_STATS.avgSyncTime, c: 'from-emerald-500 to-teal-500' },
          { l: 'Conflicts Detected', v: OFFLINE_STATS.conflictsDetected.toString(), c: 'from-amber-500 to-orange-500' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="relative overflow-hidden rounded-xl border border-surface-border bg-surface-sunken backdrop-blur-sm p-4">
            <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${s.c}`} />
            <p className="text-xs text-text-muted">{s.l}</p>
            <p className="text-2xl font-bold text-text-primary mt-1">{s.v}</p>
          </motion.div>
        ))}
      </div>

      {/* conflict resolution breakdown */}
      <div className="rounded-xl border border-surface-border bg-surface-sunken backdrop-blur-sm p-6">
        <h4 className="text-text-primary font-medium mb-4">Conflict Resolution Breakdown</h4>
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${(OFFLINE_STATS.autoResolved / OFFLINE_STATS.conflictsDetected) * 100} ${100 - (OFFLINE_STATS.autoResolved / OFFLINE_STATS.conflictsDetected) * 100}`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-text-primary">{Math.round((OFFLINE_STATS.autoResolved / OFFLINE_STATS.conflictsDetected) * 100)}%</span>
              <span className="text-xs text-text-muted">Auto</span>
            </div>
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-success" /><span className="text-sm text-text-secondary">Auto-Resolved</span></div>
              <span className="text-text-primary font-medium">{OFFLINE_STATS.autoResolved}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-warning" /><span className="text-sm text-text-secondary">Manual Review Needed</span></div>
              <span className="text-text-primary font-medium">{OFFLINE_STATS.manualReview}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-surface-border" /><span className="text-sm text-text-secondary">Total Conflicts</span></div>
              <span className="text-text-primary font-medium">{OFFLINE_STATS.conflictsDetected}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sync strategies */}
      <div className="rounded-xl border border-accent/20 bg-surface-sunken backdrop-blur-sm p-6">
        <h4 className="text-accent font-medium mb-3">Sync Conflict Resolution Strategies</h4>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: 'Last Write Wins', desc: 'Most recent timestamp overwrites. Best for non-critical fields like notes.', usage: 'Used in 72% of auto-resolutions' },
            { title: 'Supervisor Merge', desc: 'Both values are flagged for supervisor to pick the correct one.', usage: 'Used for safety-critical fields' },
            { title: 'Field-Level Merge', desc: 'Non-conflicting fields merge automatically; only true conflicts are flagged.', usage: 'Default for multi-section forms' },
          ].map((s, i) => (
            <div key={i} className="rounded-lg border border-surface-border/30 bg-surface-sunken p-4">
              <h5 className="text-text-primary text-sm font-medium">{s.title}</h5>
              <p className="text-xs text-text-muted mt-1">{s.desc}</p>
              <p className="text-xs text-accent mt-2">{s.usage}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── Sync Conflicts ────────────────────────────────────────────── */
  const renderConflicts = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-text-primary">Active Sync Conflicts</h3>
      <div className="space-y-4">
        {SYNC_CONFLICTS.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`rounded-xl border backdrop-blur-sm p-5 ${c.status === 'unresolved' ? 'border-warning/30 bg-warning/5' : 'border-success/20 bg-surface-sunken'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-text-primary font-medium">{c.form}</h4>
                <p className="text-sm text-text-muted mt-0.5">Field: <span className="text-text-secondary">{c.field}</span></p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'unresolved' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>
                {c.status}
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                <p className="text-xs text-accent font-medium">{c.user1}</p>
                <p className="text-sm text-text-primary mt-1 font-mono">{c.value1}</p>
                <p className="text-xs text-text-muted mt-1">{c.timestamp1}</p>
              </div>
              <div className="rounded-lg border border-ai/20 bg-ai/5 p-3">
                <p className="text-xs text-ai font-medium">{c.user2}</p>
                <p className="text-sm text-text-primary mt-1 font-mono">{c.value2}</p>
                <p className="text-xs text-text-muted mt-1">{c.timestamp2}</p>
              </div>
            </div>
            {c.status === 'resolved' && c.resolution && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm text-success">✓ {c.resolution}</p>
              </div>
            )}
            {c.status === 'unresolved' && (
              <div className="flex gap-2 mt-3">
                <button className="px-3 py-1.5 rounded-lg bg-accent/20 border border-accent/40 text-accent text-xs hover:bg-accent/30 transition">Keep {c.user1}'s</button>
                <button className="px-3 py-1.5 rounded-lg bg-ai/20 border border-ai/40 text-ai text-xs hover:bg-ai/30 transition">Keep {c.user2}'s</button>
                <button className="px-3 py-1.5 rounded-lg bg-surface-sunken border border-surface-border text-text-secondary text-xs hover:bg-surface-overlay transition">Escalate to Supervisor</button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );

  /* ── page shell ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-surface-base">

      <main className="pt-20 pb-24 px-4 md:px-8 max-w-7xl mx-auto">
        {/* header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-xl">🗺️</div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Version 2.0 Roadmap</h1>
              <p className="text-text-muted text-sm">API integrations, offline sync &amp; feature planning</p>
            </div>
          </div>
        </motion.div>

        {/* tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${activeTab === t.id ? 'bg-accent/20 text-accent border border-accent/40' : 'text-text-muted hover:text-text-primary hover:bg-surface-overlay border border-transparent'}`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {activeTab === 'roadmap' && renderRoadmap()}
            {activeTab === 'api' && renderAPI()}
            {activeTab === 'offline' && renderOffline()}
            {activeTab === 'conflicts' && renderConflicts()}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}

export default V2Roadmap;
