import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useExecutiveKPIs,
  useLeadingIndicatorsArray,
  useLaggingIndicators,
  useSiteScorecard,
  useMonthlyTrend,
  useScheduledReports,
} from '../api/hooks/useAPIHooks';

/* ─── mock data ───────────────────────────────────────────────────── */
const SCHEDULED_REPORTS = [
  { id: 1, name: 'Open Corrective Actions', frequency: 'Weekly – Monday 7 AM', recipients: ['Site Managers', 'Safety Directors'], format: 'PDF', lastSent: '2026-02-17', status: 'active', openItems: 14 },
  { id: 2, name: 'Overdue Training Summary', frequency: 'Weekly – Monday 7 AM', recipients: ['HR Managers', 'Training Coordinators'], format: 'PDF', lastSent: '2026-02-17', status: 'active', openItems: 8 },
  { id: 3, name: 'Incident Trend Report', frequency: 'Monthly – 1st', recipients: ['Executive Team', 'VP of Operations'], format: 'PDF + Excel', lastSent: '2026-02-01', status: 'active', openItems: 0 },
  { id: 4, name: 'Compliance Status Overview', frequency: 'Bi-weekly – Friday', recipients: ['Legal', 'Compliance Officers'], format: 'PDF', lastSent: '2026-02-14', status: 'active', openItems: 3 },
  { id: 5, name: 'Near-Miss Analysis', frequency: 'Monthly – 15th', recipients: ['Safety Committee'], format: 'PDF', lastSent: '2026-02-15', status: 'paused', openItems: 0 },
  { id: 6, name: 'Environmental Metrics', frequency: 'Quarterly', recipients: ['ESG Team', 'Board'], format: 'PDF + Dashboard Link', lastSent: '2026-01-01', status: 'active', openItems: 2 },
];

const LEADING_INDICATORS = [
  { label: 'Inspections Completed', value: 342, target: 400, unit: '/mo', trend: 'up', delta: '+12%' },
  { label: 'Safety Observations Filed', value: 189, target: 200, unit: '/mo', trend: 'up', delta: '+8%' },
  { label: 'Training Hours Delivered', value: 1240, target: 1500, unit: 'hrs', trend: 'up', delta: '+15%' },
  { label: 'Near-Miss Reports', value: 67, target: 80, unit: '/mo', trend: 'up', delta: '+22%' },
  { label: 'Hazard IDs Submitted', value: 94, target: 100, unit: '/mo', trend: 'up', delta: '+5%' },
  { label: 'Toolbox Talks Held', value: 48, target: 52, unit: '/mo', trend: 'down', delta: '-8%' },
  { label: 'Behavioral Audits', value: 156, target: 180, unit: '/mo', trend: 'up', delta: '+10%' },
  { label: 'Pre-Task Plans Completed', value: 278, target: 300, unit: '/mo', trend: 'up', delta: '+3%' },
];

const LAGGING_INDICATORS = [
  { label: 'Total Recordable Incident Rate (TRIR)', value: 1.2, prev: 1.8, unit: '', trend: 'down', good: true },
  { label: 'Lost Time Injury Rate (LTIR)', value: 0.4, prev: 0.7, unit: '', trend: 'down', good: true },
  { label: 'Days Away / Restricted (DART)', value: 0.8, prev: 1.1, unit: '', trend: 'down', good: true },
  { label: 'Workers\' Comp Claims', value: 6, prev: 11, unit: 'claims', trend: 'down', good: true },
  { label: 'Severity Rate', value: 12.4, prev: 18.2, unit: '', trend: 'down', good: true },
  { label: 'Property Damage Incidents', value: 3, prev: 5, unit: '', trend: 'down', good: true },
];

const SITE_SCORES = [
  { site: 'Houston Plant', leading: 92, lagging: 88, overall: 90, risk: 'low' },
  { site: 'Denver Office', leading: 87, lagging: 95, overall: 91, risk: 'low' },
  { site: 'Chicago Warehouse', leading: 74, lagging: 72, overall: 73, risk: 'medium' },
  { site: 'Atlanta Distribution', leading: 68, lagging: 65, overall: 66, risk: 'high' },
  { site: 'Phoenix Manufacturing', leading: 81, lagging: 78, overall: 80, risk: 'medium' },
  { site: 'Seattle Lab', leading: 95, lagging: 97, overall: 96, risk: 'low' },
];

const MONTHLY_TREND = [
  { month: 'Sep', inspections: 280, observations: 145, incidents: 8 },
  { month: 'Oct', inspections: 305, observations: 160, incidents: 6 },
  { month: 'Nov', inspections: 318, observations: 170, incidents: 5 },
  { month: 'Dec', inspections: 290, observations: 155, incidents: 7 },
  { month: 'Jan', inspections: 330, observations: 182, incidents: 4 },
  { month: 'Feb', inspections: 342, observations: 189, incidents: 3 },
];

const tabs = [
  { id: 'dashboard', label: 'Executive Dashboard', icon: '📊' },
  { id: 'scheduled', label: 'Scheduled Reports', icon: '📧' },
  { id: 'leading', label: 'Leading Indicators', icon: '📈' },
  { id: 'sites', label: 'Site Scorecard', icon: '🏢' },
];

/* ─── helpers ─────────────────────────────────────────────────────── */
function pct(v: number, t: number) { return Math.min(100, Math.round((v / t) * 100)); }
function riskColor(r: string) { return r === 'low' ? 'text-emerald-400' : r === 'medium' ? 'text-amber-400' : 'text-red-400'; }
function riskBg(r: string) { return r === 'low' ? 'bg-emerald-500/20 border-emerald-500/30' : r === 'medium' ? 'bg-amber-500/20 border-amber-500/30' : 'bg-red-500/20 border-red-500/30'; }

export function ExecutiveReportDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Live backend data with mock fallbacks
  const { data: liveKPIs } = useExecutiveKPIs();
  const { data: liveLeading } = useLeadingIndicatorsArray(selectedPeriod);
  const { data: liveLagging } = useLaggingIndicators(selectedPeriod);
  const { data: liveSites } = useSiteScorecard();
  const { data: liveTrend } = useMonthlyTrend(6);
  const { data: liveScheduled } = useScheduledReports();

  const leadingData = (liveLeading && liveLeading.length > 0) ? liveLeading : LEADING_INDICATORS;
  const laggingData = (liveLagging && liveLagging.length > 0) ? liveLagging : LAGGING_INDICATORS;
  const siteData = (liveSites && liveSites.length > 0) ? liveSites : SITE_SCORES;
  const trendData = (liveTrend && liveTrend.length > 0) ? liveTrend : MONTHLY_TREND;
  const scheduledData = (liveScheduled && liveScheduled.length > 0)
    ? liveScheduled.map((r: any) => ({
        id: r.id,
        name: r.name,
        frequency: r.frequency ?? '',
        recipients: Array.isArray(r.recipients)
          ? r.recipients
          : (r.recipients ? [r.recipients] : []),
        format: r.format ?? 'PDF',
        lastSent: r.last_sent ?? r.lastSent ?? '',
        status: r.status ?? 'active',
        openItems: r.open_items ?? r.openItems ?? 0,
      }))
    : SCHEDULED_REPORTS;

  /* ── Executive Dashboard ───────────────────────────────────────── */
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Safety Score', value: liveKPIs ? String(liveKPIs.safetyScore) : '87', sub: liveKPIs ? liveKPIs.safetyScoreDelta : '+4 pts vs last quarter', color: 'from-indigo-500 to-purple-500' },
          { label: 'Open Actions', value: liveKPIs ? String(liveKPIs.openActions) : '14', sub: liveKPIs ? `${liveKPIs.overdueActions} overdue` : '3 overdue', color: 'from-amber-500 to-orange-500' },
          { label: 'TRIR', value: liveKPIs ? String(liveKPIs.trir) : '1.2', sub: liveKPIs ? liveKPIs.trirChange : '↓ 33% YoY', color: 'from-emerald-500 to-teal-500' },
          { label: 'Compliance', value: liveKPIs ? `${liveKPIs.compliancePct}%` : '96%', sub: liveKPIs ? liveKPIs.standardName : 'ISO 45001 aligned', color: 'from-cyan-500 to-blue-500' },
        ].map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="relative overflow-hidden rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-5">
            <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${k.color}`} />
            <p className="text-xs text-gray-400 uppercase tracking-wider">{k.label}</p>
            <p className="text-3xl font-bold text-white mt-1">{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Trend chart (simple bar visualisation) */}
      <div className="rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">6-Month Performance Trend</h3>
          <div className="flex gap-2">
            {['month', 'quarter', 'year'].map(p => (
              <button key={p} onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${selectedPeriod === p ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40' : 'text-gray-400 hover:text-white'}`}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-3 h-48">
          {trendData.map((m, i) => {
            const maxVal = 400;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end" style={{ height: '160px' }}>
                  <div className="flex-1 bg-indigo-500/60 rounded-t" style={{ height: `${(m.inspections / maxVal) * 100}%` }} title={`Inspections: ${m.inspections}`} />
                  <div className="flex-1 bg-cyan-500/60 rounded-t" style={{ height: `${(m.observations / maxVal) * 100}%` }} title={`Observations: ${m.observations}`} />
                  <div className="flex-1 bg-red-500/60 rounded-t" style={{ height: `${(m.incidents / maxVal) * 100}%` }} title={`Incidents: ${m.incidents}`} />
                </div>
                <span className="text-xs text-gray-500">{m.month}</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3 justify-center">
          {[{ l: 'Inspections', c: 'bg-indigo-500/60' }, { l: 'Observations', c: 'bg-cyan-500/60' }, { l: 'Incidents', c: 'bg-red-500/60' }].map(x => (
            <div key={x.l} className="flex items-center gap-2 text-xs text-gray-400"><span className={`w-3 h-3 rounded ${x.c}`} />{x.l}</div>
          ))}
        </div>
      </div>

      {/* Leading vs Lagging summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-6">
          <h3 className="text-lg font-semibold text-emerald-400 mb-4">Leading Indicators Summary</h3>
          <div className="space-y-3">
            {leadingData.slice(0, 4).map((ind, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm"><span className="text-gray-300">{ind.label}</span><span className="text-white font-medium">{ind.value}{ind.unit ? ` ${ind.unit}` : ''}</span></div>
                <div className="w-full bg-gray-800 rounded-full h-2 mt-1">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all" style={{ width: `${pct(ind.value, ind.target)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-6">
          <h3 className="text-lg font-semibold text-indigo-400 mb-4">Lagging Indicators Summary</h3>
          <div className="space-y-3">
            {laggingData.slice(0, 4).map((ind, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{ind.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 line-through">{ind.prev}</span>
                  <span className="text-white font-semibold">{ind.value}</span>
                  <span className="text-xs text-emerald-400">▼</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Scheduled Reports ─────────────────────────────────────────── */
  const renderScheduled = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Automated Report Distribution</h3>
        <button className="px-4 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-sm hover:bg-indigo-500/30 transition">+ New Schedule</button>
      </div>
      <div className="space-y-3">
        {scheduledData.map((rpt, i) => (
          <motion.div key={rpt.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-white font-medium">{rpt.name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${rpt.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'}`}>
                    {rpt.status}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">🕐 {rpt.frequency}</p>
                <p className="text-sm text-gray-500 mt-0.5">📩 {rpt.recipients.join(', ')}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500">Format</span>
                <p className="text-sm text-indigo-300">{rpt.format}</p>
                <p className="text-xs text-gray-500 mt-1">Last sent: {rpt.lastSent}</p>
              </div>
            </div>
            {rpt.openItems > 0 && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-400">⚠ {rpt.openItems} open items to be included in next report</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Monday Morning Preview */}
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold text-indigo-400 mb-3">📋 Monday Morning Preview</h3>
        <p className="text-sm text-gray-400 mb-4">Preview of the automated report package that will be distributed next Monday at 7:00 AM.</p>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: 'Open Corrective Actions', count: 14, urgent: 3, color: 'border-amber-500/30' },
            { title: 'Overdue Training', count: 8, urgent: 2, color: 'border-red-500/30' },
            { title: 'Compliance Gaps', count: 3, urgent: 1, color: 'border-orange-500/30' },
          ].map((item, i) => (
            <div key={i} className={`rounded-lg border ${item.color} bg-gray-900/40 p-4`}>
              <p className="text-sm text-gray-300 font-medium">{item.title}</p>
              <p className="text-2xl font-bold text-white mt-1">{item.count}</p>
              <p className="text-xs text-red-400 mt-1">{item.urgent} urgent</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-4">
          <button className="px-4 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-sm hover:bg-indigo-500/30 transition">Preview PDF</button>
          <button className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-sm hover:bg-gray-700 transition">Send Test Email</button>
        </div>
      </div>
    </div>
  );

  /* ── Leading Indicators ────────────────────────────────────────── */
  const renderLeading = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Leading vs Lagging Indicators</h3>

      {/* Leading */}
      <div className="rounded-xl border border-emerald-500/20 bg-gray-900/60 backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🟢</span>
          <h4 className="text-lg font-semibold text-emerald-400">Leading Indicators</h4>
          <span className="text-xs text-gray-500 ml-auto">Proactive safety measures</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {leadingData.map((ind, i) => {
            const p = pct(ind.value, ind.target);
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-lg border border-white/5 bg-gray-800/50 p-4">
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-300">{ind.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ind.trend === 'up' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {ind.delta}
                  </span>
                </div>
                <div className="flex items-end gap-1 mt-2">
                  <span className="text-2xl font-bold text-white">{ind.value}</span>
                  <span className="text-sm text-gray-500">/ {ind.target} {ind.unit}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div className={`h-2 rounded-full transition-all ${p >= 90 ? 'bg-emerald-500' : p >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${p}%` }} />
                </div>
                <span className="text-xs text-gray-500 mt-1">{p}% of target</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Lagging */}
      <div className="rounded-xl border border-indigo-500/20 bg-gray-900/60 backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🔴</span>
          <h4 className="text-lg font-semibold text-indigo-400">Lagging Indicators</h4>
          <span className="text-xs text-gray-500 ml-auto">Reactive safety metrics</span>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {laggingData.map((ind, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-lg border border-white/5 bg-gray-800/50 p-4">
              <p className="text-sm text-gray-300">{ind.label}</p>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-2xl font-bold text-white">{ind.value}</span>
                {ind.unit && <span className="text-sm text-gray-500">{ind.unit}</span>}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">Previous: {ind.prev}</span>
                <span className={`text-xs ${ind.good ? 'text-emerald-400' : 'text-red-400'}`}>{ind.good ? '▼ Improved' : '▲ Worsened'}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── Site Scorecard ────────────────────────────────────────────── */
  const renderSites = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Site Safety Scorecard</h3>
      <div className="space-y-3">
        {siteData.sort((a, b) => b.overall - a.overall).map((s, i) => (
          <motion.div key={s.site} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
            className={`rounded-xl border ${riskBg(s.risk)} backdrop-blur-sm p-5`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.risk === 'low' ? '🟢' : s.risk === 'medium' ? '🟡' : '🔴'}</span>
                <div>
                  <h4 className="text-white font-medium">{s.site}</h4>
                  <span className={`text-xs ${riskColor(s.risk)} uppercase font-medium`}>{s.risk} risk</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{s.overall}</p>
                <p className="text-xs text-gray-400">Overall Score</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs text-gray-400">Leading Score</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${s.leading}%` }} />
                  </div>
                  <span className="text-sm text-white font-medium">{s.leading}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400">Lagging Score</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${s.lagging}%` }} />
                  </div>
                  <span className="text-sm text-white font-medium">{s.lagging}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  /* ── page shell ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#0a0a1a]">

      <main className="pt-20 pb-24 px-4 md:px-8 max-w-7xl mx-auto">
        {/* header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl">📊</div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Executive Report Dashboard</h1>
              <p className="text-gray-400 text-sm">Automated reporting &amp; KPI visibility for leadership</p>
            </div>
          </div>
        </motion.div>

        {/* tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${activeTab === t.id ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'scheduled' && renderScheduled()}
            {activeTab === 'leading' && renderLeading()}
            {activeTab === 'sites' && renderSites()}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}

export default ExecutiveReportDashboard;
