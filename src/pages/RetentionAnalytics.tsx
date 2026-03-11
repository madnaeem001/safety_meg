import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Users, UserMinus, UserPlus, Activity,
  BarChart3, Calendar, ArrowRight, AlertCircle, CheckCircle2,
  Clock, Target, Zap, Heart, Star, ChevronRight, RefreshCw
} from 'lucide-react';

// Cohort data
const COHORT_DATA = [
  { month: 'Aug 2025', users: 420, w1: 85, w2: 72, w3: 64, w4: 58, w8: 45, w12: 38 },
  { month: 'Sep 2025', users: 580, w1: 88, w2: 75, w3: 68, w4: 62, w8: 51, w12: 42 },
  { month: 'Oct 2025', users: 720, w1: 90, w2: 78, w3: 71, w4: 65, w8: 54, w12: 46 },
  { month: 'Nov 2025', users: 890, w1: 91, w2: 80, w3: 73, w4: 67, w8: 56, w12: null },
  { month: 'Dec 2025', users: 1050, w1: 93, w2: 82, w3: 75, w4: 69, w8: null, w12: null },
  { month: 'Jan 2026', users: 1280, w1: 94, w2: 84, w3: 77, w4: null, w8: null, w12: null },
  { month: 'Feb 2026', users: 1420, w1: 95, w2: null, w3: null, w4: null, w8: null, w12: null },
];

const CHURN_REASONS = [
  { reason: 'Missing features they need', pct: 28, color: 'bg-red-400' },
  { reason: 'Switched to competitor', pct: 22, color: 'bg-orange-400' },
  { reason: 'Price too high', pct: 18, color: 'bg-amber-400' },
  { reason: 'Difficult to use', pct: 15, color: 'bg-yellow-400' },
  { reason: 'Company downsized', pct: 10, color: 'bg-purple-400' },
  { reason: 'No longer needed', pct: 7, color: 'bg-blue-400' },
];

const ENGAGEMENT_SEGMENTS = [
  { segment: 'Power Users', count: 340, pct: 24, color: 'emerald', icon: Star, description: 'Daily active, 5+ features used' },
  { segment: 'Regular Users', count: 520, pct: 37, color: 'cyan', icon: Users, description: 'Weekly active, 2-4 features used' },
  { segment: 'Casual Users', count: 380, pct: 27, color: 'amber', icon: Clock, description: 'Monthly active, 1-2 features used' },
  { segment: 'At-Risk Users', count: 180, pct: 12, color: 'red', icon: AlertCircle, description: 'Inactive 14+ days' },
];

const RETENTION_ACTIONS = [
  { action: 'Personalized re-engagement emails', impact: '+12% retention', status: 'active', icon: Heart },
  { action: 'In-app feature discovery tooltips', impact: '+8% activation', status: 'active', icon: Zap },
  { action: 'Milestone celebration notifications', impact: '+5% engagement', status: 'active', icon: Star },
  { action: 'Churn prediction AI alerts', impact: '+15% save rate', status: 'testing', icon: Activity },
  { action: 'Custom onboarding flows by role', impact: '+20% week-1 retention', status: 'planned', icon: Target },
];

const KPI_CARDS = [
  { label: 'Monthly Active Users', value: '1,420', change: '+12.4%', trend: 'up', icon: Users, color: 'cyan' },
  { label: 'Retention Rate (30d)', value: '78.3%', change: '+3.2%', trend: 'up', icon: Heart, color: 'emerald' },
  { label: 'Churn Rate', value: '2.1%', change: '-0.4%', trend: 'down', icon: UserMinus, color: 'red' },
  { label: 'NPS Score', value: '72', change: '+5', trend: 'up', icon: Star, color: 'purple' },
  { label: 'Avg Session Duration', value: '18.4m', change: '+2.1m', trend: 'up', icon: Clock, color: 'blue' },
  { label: 'Feature Adoption', value: '64.8%', change: '+8.3%', trend: 'up', icon: Zap, color: 'amber' },
];

const tabs = ['Overview', 'Cohort Analysis', 'Churn Intelligence', 'Engagement Segments', 'Retention Actions'];

export const RetentionAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Overview');

  const getCellColor = (val: number | null) => {
    if (val === null) return 'bg-slate-800/30 text-slate-600';
    if (val >= 90) return 'bg-emerald-500/20 text-emerald-400';
    if (val >= 70) return 'bg-cyan-500/20 text-cyan-400';
    if (val >= 50) return 'bg-amber-500/20 text-amber-400';
    return 'bg-red-500/20 text-red-400';
  };

  return (
    <div className="min-h-screen pb-28 transition-colors duration-500" style={{ background: 'linear-gradient(165deg, #020617 0%, #0f172a 35%, #0c1222 70%, #020617 100%)' }}>

      <main className="relative z-10 max-w-7xl mx-auto pt-8 md:pt-12 px-5 md:px-8 lg:px-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-cyan-500" />
            <span className="text-[13px] font-bold text-cyan-400 uppercase tracking-[0.3em] font-display">User Intelligence</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white font-display">Retention Analytics</h1>
          <p className="text-slate-400 text-sm mt-2">Understand user behavior, reduce churn, and grow lifetime value</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-800/40 text-slate-400 border border-slate-700/30 hover:border-cyan-500/20 hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* KPI Row */}
        {activeTab === 'Overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {KPI_CARDS.map((kpi, i) => {
                const colorStyles: Record<string, string> = {
                  cyan: 'border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]',
                  emerald: 'border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
                  red: 'border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
                  purple: 'border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]',
                  blue: 'border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
                  amber: 'border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
                };
                const iconBg: Record<string, string> = {
                  cyan: 'bg-cyan-500/10 text-cyan-400',
                  emerald: 'bg-emerald-500/10 text-emerald-400',
                  red: 'bg-red-500/10 text-red-400',
                  purple: 'bg-purple-500/10 text-purple-400',
                  blue: 'bg-blue-500/10 text-blue-400',
                  amber: 'bg-amber-500/10 text-amber-400',
                };
                return (
                  <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={`p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border ${colorStyles[kpi.color]} hover:scale-[1.02] transition-all`}>
                    <div className={`p-2 rounded-lg w-fit mb-3 ${iconBg[kpi.color]}`}>
                      <kpi.icon className="w-4 h-4" />
                    </div>
                    <p className="text-xl font-black text-white">{kpi.value}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">{kpi.label}</p>
                    <span className={`text-[10px] font-bold mt-1 inline-flex items-center gap-1 ${
                      kpi.trend === 'up' && kpi.label !== 'Churn Rate' ? 'text-emerald-400' : kpi.trend === 'down' && kpi.label === 'Churn Rate' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {kpi.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {kpi.change}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Retention Curve */}
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/15 p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" /> 30-Day Retention Curve
              </h3>
              <div className="flex items-end gap-1 h-48">
                {[100, 95, 91, 87, 84, 82, 80, 79, 78, 78, 77, 77, 76, 76, 76, 75, 75, 75, 74, 74, 74, 74, 73, 73, 73, 73, 73, 73, 73, 73].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${val * 1.8}px` }}
                      transition={{ duration: 0.6, delay: i * 0.02 }}
                      className={`w-full rounded-t-sm ${val >= 80 ? 'bg-gradient-to-t from-cyan-600 to-cyan-400' : val >= 75 ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-gradient-to-t from-amber-600 to-amber-400'}`}
                    />
                    {i % 7 === 0 && <span className="text-[8px] text-slate-600 font-mono">D{i}</span>}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Cohort Analysis */}
        {activeTab === 'Cohort Analysis' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/15 overflow-hidden">
            <div className="p-5 border-b border-cyan-500/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" /> Cohort Retention Analysis
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Retention % by signup cohort over time</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="px-4 py-3 text-left text-slate-400 font-bold">Cohort</th>
                    <th className="px-3 py-3 text-center text-slate-400 font-bold">Users</th>
                    <th className="px-3 py-3 text-center text-slate-400 font-bold">Week 1</th>
                    <th className="px-3 py-3 text-center text-slate-400 font-bold">Week 2</th>
                    <th className="px-3 py-3 text-center text-slate-400 font-bold">Week 3</th>
                    <th className="px-3 py-3 text-center text-slate-400 font-bold">Week 4</th>
                    <th className="px-3 py-3 text-center text-slate-400 font-bold">Week 8</th>
                    <th className="px-3 py-3 text-center text-slate-400 font-bold">Week 12</th>
                  </tr>
                </thead>
                <tbody>
                  {COHORT_DATA.map((row, i) => (
                    <tr key={row.month} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-white font-medium">{row.month}</td>
                      <td className="px-3 py-3 text-center text-slate-300">{row.users.toLocaleString()}</td>
                      {[row.w1, row.w2, row.w3, row.w4, row.w8, row.w12].map((val, j) => (
                        <td key={j} className="px-3 py-2 text-center">
                          <span className={`inline-block px-2 py-1 rounded-lg text-[11px] font-bold ${getCellColor(val)}`}>
                            {val !== null ? `${val}%` : '—'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Churn Intelligence */}
        {activeTab === 'Churn Intelligence' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-red-500/15 p-6">
              <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                <UserMinus className="w-4 h-4 text-red-400" /> Why Users Churn
              </h3>
              <div className="space-y-4">
                {CHURN_REASONS.map((item, i) => (
                  <motion.div key={item.reason} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-300 font-medium">{item.reason}</span>
                      <span className="text-xs font-bold text-white">{item.pct}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-800/60 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                        className={`h-full rounded-full ${item.color}`} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Churn Prediction Alert */}
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-amber-500/15 p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" /> AI Churn Prediction
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'High Risk', count: 23, color: 'red', desc: 'No login in 14+ days' },
                  { label: 'Medium Risk', count: 47, color: 'amber', desc: 'Declining engagement' },
                  { label: 'Watching', count: 89, color: 'yellow', desc: 'Below avg feature usage' },
                ].map((item, i) => (
                  <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className={`p-4 rounded-xl bg-${item.color}-500/5 border border-${item.color}-500/20`}>
                    <p className={`text-2xl font-black text-${item.color}-400`}>{item.count}</p>
                    <p className="text-xs font-bold text-white mt-1">{item.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Engagement Segments */}
        {activeTab === 'Engagement Segments' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ENGAGEMENT_SEGMENTS.map((seg, i) => {
                const segColors: Record<string, { bg: string; text: string; border: string }> = {
                  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
                  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
                  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
                  red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
                };
                const c = segColors[seg.color];
                return (
                  <motion.div key={seg.segment} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className={`p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border ${c.border} hover:scale-[1.01] transition-all`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2.5 rounded-xl ${c.bg}`}>
                        <seg.icon className={`w-5 h-5 ${c.text}`} />
                      </div>
                      <span className={`text-xs font-bold ${c.text} ${c.bg} px-2 py-1 rounded-lg`}>{seg.pct}%</span>
                    </div>
                    <p className="text-lg font-bold text-white">{seg.segment}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{seg.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`text-xl font-black ${c.text}`}>{seg.count.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">users</span>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-slate-800/60 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${seg.pct}%` }} transition={{ duration: 1, delay: 0.3 }}
                        className={`h-full rounded-full ${c.bg.replace('/10', '')}`} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Retention Actions */}
        {activeTab === 'Retention Actions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-emerald-500/15 overflow-hidden">
            <div className="p-5 border-b border-emerald-500/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" /> Active Retention Strategies
              </h3>
            </div>
            <div className="divide-y divide-slate-800/50">
              {RETENTION_ACTIONS.map((item, i) => (
                <motion.div key={item.action} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  className="flex items-center justify-between p-5 hover:bg-slate-800/30 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10">
                      <item.icon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.action}</p>
                      <p className="text-xs text-emerald-400 font-bold mt-0.5">{item.impact}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg ${
                    item.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    item.status === 'testing' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>{item.status}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

    </div>
  );
};

export default RetentionAnalytics;
