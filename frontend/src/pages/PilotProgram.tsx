import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FlaskConical, Users, MapPin, Calendar, Clock, CheckCircle2,
  AlertTriangle, TrendingUp, Eye, MessageSquare, Star, Target,
  BarChart3, ArrowRight, Play, Pause, ChevronRight, Shield,
  Smartphone, ClipboardCheck, Bug, Lightbulb, ThumbsUp, Activity
} from 'lucide-react';
import {
  usePilotStats,
  usePilotSites,
  usePilotShadowingSessions,
  usePilotFeedback,
  useVotePilotFeedback,
} from '../api/hooks/useAPIHooks';

const tabs = ['Pilot Dashboard', 'Beta Sites', 'Field Shadowing', 'User Feedback', 'Pilot Report'];

export const PilotProgram: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Pilot Dashboard');
  const [feedbackFilter, setFeedbackFilter] = useState<'All' | 'Bugs' | 'Ideas' | 'Praise'>('All');

  const { data: stats } = usePilotStats();
  const { data: sitesData, refetch: refetchSites } = usePilotSites();
  const { data: sessionsData } = usePilotShadowingSessions();
  const { data: feedbackData, refetch: refetchFeedback } = usePilotFeedback();
  const { mutate: voteFeedback } = useVotePilotFeedback();

  const betaSites = sitesData ?? [];
  const shadowingSessions = sessionsData ?? [];
  const feedbackItems = feedbackData ?? [];

  const pilotKPIs = stats ? [
    { label: 'Active Pilots', value: String(stats.activePilots), change: stats.changes.activePilots, trend: 'up' as const, icon: FlaskConical },
    { label: 'Total Enrolled', value: String(stats.totalEnrolled), change: stats.changes.totalEnrolled, trend: 'up' as const, icon: Users },
    { label: 'Feedback Items', value: String(stats.feedbackItems), change: stats.changes.feedbackItems, trend: 'up' as const, icon: MessageSquare },
    { label: 'Avg. Adoption', value: `${stats.avgAdoption}%`, change: stats.changes.avgAdoption, trend: 'up' as const, icon: TrendingUp },
    { label: 'UX Issues Found', value: String(stats.uxIssuesFound), change: stats.changes.uxIssuesFound, trend: 'down' as const, icon: Bug },
    { label: 'NPS Score', value: String(stats.npsScore), change: stats.changes.npsScore, trend: 'up' as const, icon: Star },
  ] : [
    { label: 'Active Pilots', value: '—', change: '', trend: 'up' as const, icon: FlaskConical },
    { label: 'Total Enrolled', value: '—', change: '', trend: 'up' as const, icon: Users },
    { label: 'Feedback Items', value: '—', change: '', trend: 'up' as const, icon: MessageSquare },
    { label: 'Avg. Adoption', value: '—', change: '', trend: 'up' as const, icon: TrendingUp },
    { label: 'UX Issues Found', value: '—', change: '', trend: 'down' as const, icon: Bug },
    { label: 'NPS Score', value: '—', change: '', trend: 'up' as const, icon: Star },
  ];

  const filterTypeMap: Record<string, string | undefined> = {
    All: undefined, Bugs: 'bug', Ideas: 'idea', Praise: 'praise',
  };
  const filteredFeedback = feedbackFilter === 'All'
    ? feedbackItems
    : feedbackItems.filter(f => f.type === filterTypeMap[feedbackFilter]);

  const handleVote = useCallback(async (id: number) => {
    await voteFeedback(id);
    refetchFeedback();
  }, [voteFeedback, refetchFeedback]);

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

      <div className="px-4 pt-20 pb-24 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
              <FlaskConical className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Pilot & Feedback Loop</h1>
              <p className="text-sm text-gray-400">30-Day Beta Program Manager</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Pilot Dashboard */}
        {activeTab === 'Pilot Dashboard' && (
          <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {pilotKPIs.map((kpi, i) => (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                  <kpi.icon className="w-5 h-5 text-amber-400 mb-2" />
                  <div className="text-2xl font-bold text-white">{kpi.value}</div>
                  <div className="text-xs text-gray-400 mb-1">{kpi.label}</div>
                  <span className={`text-xs font-medium ${kpi.trend === 'up' ? 'text-emerald-400' : 'text-amber-400'}`}>{kpi.change}</span>
                </motion.div>
              ))}
            </div>

            {/* 30-Day Progress */}
            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">30-Day Pilot Progress</h3>
              <div className="space-y-4">
                {betaSites.filter(s => s.status === 'active').map(site => (
                  <div key={site.id} className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-400" />
                        <span className="text-white font-medium">{site.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${site.riskLevel === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>{site.riskLevel} Risk</span>
                      </div>
                      <span className="text-sm text-gray-400">{site.daysLeft} days left</span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-2 mb-2">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all" style={{ width: `${site.progress}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{site.enrolled} enrolled • {site.feedbackCount} feedback items</span>
                      <span className="text-amber-400 font-medium">{site.progress}% complete</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Top UX Issues</h3>
                <div className="space-y-3">
                  {shadowingSessions.filter(s => s.severity === 'high').map(s => (
                    <div key={s.id} className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-white">{s.findings}</p>
                        <p className="text-xs text-gray-400 mt-1">{s.site} • {s.observer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Top Feature Requests</h3>
                <div className="space-y-3">
                  {feedbackItems.filter(f => f.type === 'idea').sort((a, b) => b.votes - a.votes).slice(0, 3).map(f => (
                    <div key={f.id} className="flex items-start gap-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
                      <div className="flex items-center gap-1 shrink-0 bg-cyan-500/20 rounded-lg px-2 py-1">
                        <ThumbsUp className="w-3 h-3 text-cyan-400" />
                        <span className="text-xs text-cyan-400 font-bold">{f.votes}</span>
                      </div>
                      <div>
                        <p className="text-sm text-white">{f.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{f.user} • {f.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Beta Sites */}
        {activeTab === 'Beta Sites' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Beta Deployment Sites</h3>
              <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-amber-500/20 transition-all">+ Add Site</button>
            </div>
            {betaSites.map((site, i) => (
              <motion.div key={site.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-semibold text-lg">{site.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${site.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {site.status === 'active' ? '● Active' : '✓ Completed'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{site.department} • Started {site.startDate}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${site.riskLevel === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : site.riskLevel === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                    {site.riskLevel} Risk
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center"><div className="text-xl font-bold text-white">{site.enrolled}</div><div className="text-xs text-gray-400">Enrolled</div></div>
                  <div className="text-center"><div className="text-xl font-bold text-white">{site.feedbackCount}</div><div className="text-xs text-gray-400">Feedback</div></div>
                  <div className="text-center"><div className="text-xl font-bold text-amber-400">{site.progress}%</div><div className="text-xs text-gray-400">Progress</div></div>
                  <div className="text-center"><div className="text-xl font-bold text-white">{site.daysLeft}</div><div className="text-xs text-gray-400">Days Left</div></div>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-3">
                  <div className={`h-3 rounded-full transition-all ${site.status === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`} style={{ width: `${site.progress}%` }} />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Field Shadowing */}
        {activeTab === 'Field Shadowing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Field Shadowing Sessions</h3>
              <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all">+ Log Session</button>
            </div>
            <p className="text-sm text-gray-400 mb-4 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
              <Eye className="w-4 h-4 inline mr-2 text-purple-400" />
              Physically watch workers use the app in the field. If they have to take off their gloves to hit a small button, the UI needs a tweak.
            </p>
            <div className="space-y-3">
              {shadowingSessions.map((session, i) => (
                <motion.div key={session.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-purple-400" />
                      <span className="text-white font-medium">{session.observer}</span>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-300">observed</span>
                      <span className="text-white font-medium">{session.worker}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${session.status === 'open' ? 'bg-red-500/20 text-red-400' : session.status === 'in-progress' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {session.status}
                    </span>
                  </div>
                  <div className="bg-gray-900/50 rounded-xl p-3 mb-2">
                    <p className="text-sm text-white">{session.findings}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{session.site}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full ${session.severity === 'high' ? 'bg-red-500/20 text-red-400' : session.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {session.severity}
                      </span>
                      <span>{session.date}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* User Feedback */}
        {activeTab === 'User Feedback' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">In-App Feedback Stream</h3>
              <div className="flex gap-2">
                {(['All', 'Bugs', 'Ideas', 'Praise'] as const).map(f => (
                  <button key={f} onClick={() => setFeedbackFilter(f)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all">{f}</button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {filteredFeedback.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-xl shrink-0 ${item.type === 'bug' ? 'bg-red-500/20' : item.type === 'idea' ? 'bg-cyan-500/20' : 'bg-emerald-500/20'}`}>
                      {item.type === 'bug' ? <Bug className="w-5 h-5 text-red-400" /> : item.type === 'idea' ? <Lightbulb className="w-5 h-5 text-cyan-400" /> : <Star className="w-5 h-5 text-emerald-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-white mb-1">{item.message}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className={`px-2 py-0.5 rounded-full ${item.type === 'bug' ? 'bg-red-500/20 text-red-400' : item.type === 'idea' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {item.type}
                        </span>
                        <span>{item.user}</span>
                        <span>{item.date}</span>
                      </div>
                    </div>
                    <button onClick={() => handleVote(item.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-all">
                      <ThumbsUp className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-white font-medium">{item.votes}</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Pilot Report */}
        {activeTab === 'Pilot Report' && (
          <div className="space-y-6">
            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">30-Day Pilot Summary Report</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-emerald-400">{stats ? `${stats.avgAdoption}%` : '—'}</div><div className="text-xs text-gray-400 mt-1">Adoption Rate</div>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-cyan-400">{stats ? stats.npsScore : '—'}</div><div className="text-xs text-gray-400 mt-1">NPS Score</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-amber-400">{stats ? stats.uxIssuesFound : '—'}</div><div className="text-xs text-gray-400 mt-1">UX Issues</div>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-purple-400">4.2</div><div className="text-xs text-gray-400 mt-1">Avg Rating</div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-white font-medium">Go/No-Go Recommendation</h4>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold text-lg">GO — Ready for Phase 2 Rollout</span>
                  </div>
                  <p className="text-sm text-gray-300">High adoption rate (84%) with strong NPS (72). Critical UX issues (glove-friendly buttons, offline sync) are documented and scheduled for v1.1 fix. Recommend expanding to 3 additional sites with the identified improvements.</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-3">Action Items for v1.1</h3>
              <div className="space-y-2">
                {['Increase all touch targets to 48px minimum for gloved operation', 'Add photo upload retry with offline queue', 'Implement voice-to-text for incident descriptions', 'Fix PDF export truncation for long descriptions', 'Add QR code linking for equipment-specific forms'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-900/50 rounded-xl p-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-bold">{i + 1}</div>
                    <span className="text-sm text-white">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default PilotProgram;
