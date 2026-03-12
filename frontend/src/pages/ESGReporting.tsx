import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Users,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Zap,
  Download,
  Share2,
  ChevronRight,
  Brain,
  Leaf,
  Scale,
  Database,
  Shield
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import { useESGMetrics } from '../api/hooks/useAPIHooks';
import type { ESGMetrics } from '../api/services/apiService';

/* ================================================================
   ESG REPORTING (HD & DARK THEME)
   A premium dashboard for Environmental, Social, and Governance
   performance tracking and disclosure.
   ================================================================ */

const categoryConfig = {
  'Environmental': { icon: Leaf, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', gradient: 'from-emerald-500 to-teal-500' },
  'Social': { icon: Users, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', gradient: 'from-blue-500 to-cyan-500' },
  'Governance': { icon: Scale, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', gradient: 'from-purple-500 to-indigo-500' }
};

type CategoryName = 'Environmental' | 'Social' | 'Governance';

type ESGMetricCard = {
  category: CategoryName;
  metric: string;
  value: string;
  target: string;
  status: 'On Track' | 'At Risk';
  description: string;
  progress: number;
};

const SectionEmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-[2.5rem] border border-dashed border-surface-800 bg-surface-900/40 p-8 text-center backdrop-blur-md">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-800 text-surface-500">
      <Database className="h-5 w-5" />
    </div>
    <h3 className="text-lg font-black text-white">{title}</h3>
    <p className="mx-auto mt-2 max-w-lg text-sm text-surface-400">{description}</p>
  </div>
);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function buildESGMetrics(data: ESGMetrics | null): ESGMetricCard[] {
  if (!data) {
    return [];
  }

  const env = data.environmental;
  const social = data.social;
  const governance = data.governance;

  return [
    {
      category: 'Environmental',
      metric: 'Carbon Footprint',
      value: `${env.carbonEmissions} tCO2e`,
      target: '<= 500 tCO2e',
      status: env.carbonEmissions <= 500 ? 'On Track' : 'At Risk',
      description: 'Combined carbon emissions from the current ESG dashboard period.',
      progress: clamp(Math.round((500 / Math.max(env.carbonEmissions, 1)) * 100), 0, 100),
    },
    {
      category: 'Environmental',
      metric: 'Renewable Energy Share',
      value: `${env.renewableEnergy}%`,
      target: '>= 50%',
      status: env.renewableEnergy >= 50 ? 'On Track' : 'At Risk',
      description: 'Renewable energy contribution to current operational demand.',
      progress: clamp(Math.round(env.renewableEnergy), 0, 100),
    },
    {
      category: 'Environmental',
      metric: 'Waste Diversion',
      value: `${env.wasteDiverted}%`,
      target: '>= 95%',
      status: env.wasteDiverted >= 95 ? 'On Track' : 'At Risk',
      description: 'Waste diverted from landfill across monitored facilities.',
      progress: clamp(Math.round(env.wasteDiverted), 0, 100),
    },
    {
      category: 'Environmental',
      metric: 'Water Usage',
      value: `${env.waterUsage} m3`,
      target: '<= 5000 m3',
      status: env.waterUsage <= 5000 ? 'On Track' : 'At Risk',
      description: 'Backend-recorded water use for the current ESG period.',
      progress: clamp(Math.round((5000 / Math.max(env.waterUsage, 1)) * 100), 0, 100),
    },
    {
      category: 'Social',
      metric: 'TRIR Safety Rate',
      value: `${social.trir}`,
      target: '< 1.0',
      status: social.trir < 1 ? 'On Track' : 'At Risk',
      description: 'Recordable incident rate derived from current worker and incident counts.',
      progress: clamp(Math.round((1 / Math.max(social.trir, 0.25)) * 100), 0, 100),
    },
    {
      category: 'Social',
      metric: 'Training Hours Per Employee',
      value: `${social.trainingHoursPerEmployee} h`,
      target: '>= 40 h',
      status: social.trainingHoursPerEmployee >= 40 ? 'On Track' : 'At Risk',
      description: 'Average training load derived from current employee training completions.',
      progress: clamp(Math.round((social.trainingHoursPerEmployee / 40) * 100), 0, 100),
    },
    {
      category: 'Social',
      metric: 'Diversity Index',
      value: `${social.diversityIndex}%`,
      target: '>= 40%',
      status: social.diversityIndex >= 40 ? 'On Track' : 'At Risk',
      description: 'Leadership and workforce diversity representation index.',
      progress: clamp(Math.round(social.diversityIndex), 0, 100),
    },
    {
      category: 'Social',
      metric: 'Volunteer Hours',
      value: `${social.volunteerHours} hrs`,
      target: '>= 1000 hrs',
      status: social.volunteerHours >= 1000 ? 'On Track' : 'At Risk',
      description: 'Current community engagement hours logged for the reporting period.',
      progress: clamp(Math.round((social.volunteerHours / 1000) * 100), 0, 100),
    },
    {
      category: 'Governance',
      metric: 'Compliance Score',
      value: `${governance.complianceScore}%`,
      target: '>= 95%',
      status: governance.complianceScore >= 95 ? 'On Track' : 'At Risk',
      description: 'Inspection-derived governance compliance score.',
      progress: clamp(Math.round(governance.complianceScore), 0, 100),
    },
    {
      category: 'Governance',
      metric: 'Audit Findings Closed',
      value: `${governance.auditFindingsClosed}`,
      target: 'Growing closure count',
      status: governance.auditFindingsClosed > 0 ? 'On Track' : 'At Risk',
      description: 'Closed CAPA and audit findings counted from backend governance records.',
      progress: clamp(Math.round(governance.auditFindingsClosed * 10), 0, 100),
    },
    {
      category: 'Governance',
      metric: 'Policy Reviews Completed',
      value: `${governance.policyReviewsCompleted}`,
      target: '>= 12',
      status: governance.policyReviewsCompleted >= 12 ? 'On Track' : 'At Risk',
      description: 'Policy review completions captured in governance metrics.',
      progress: clamp(Math.round((governance.policyReviewsCompleted / 12) * 100), 0, 100),
    },
    {
      category: 'Governance',
      metric: 'Ethics Violations',
      value: `${governance.ethicsViolations}`,
      target: '0',
      status: governance.ethicsViolations === 0 ? 'On Track' : 'At Risk',
      description: 'Reported governance ethics violations for the current period.',
      progress: governance.ethicsViolations === 0 ? 100 : clamp(100 - governance.ethicsViolations * 20, 0, 100),
    },
  ];
}

export const ESGReporting: React.FC = () => {
  const { data: liveESGData } = useESGMetrics('quarter');
  const metrics = useMemo(() => buildESGMetrics(liveESGData ?? null), [liveESGData]);

  const scoreData = useMemo(() => {
    if (!liveESGData) {
      return [];
    }

    return [
      { name: 'Environmental', score: Math.round(70 + liveESGData.environmental.renewableEnergy * 0.15 + liveESGData.environmental.wasteDiverted * 0.15), color: '#10b981' },
      { name: 'Social', score: Math.round(Math.max(0, 100 - liveESGData.social.trir * 5 + liveESGData.social.trainingHoursPerEmployee * 0.2)), color: '#38bdf8' },
      { name: 'Governance', score: Math.round(liveESGData.governance.complianceScore), color: '#a855f7' },
    ].map((item) => ({ ...item, score: clamp(item.score, 0, 100) }));
  }, [liveESGData]);

  const forecastCards = useMemo(() => {
    if (!liveESGData) {
      return [];
    }

    const env = liveESGData.environmental;
    const social = liveESGData.social;
    const governance = liveESGData.governance;
    const carbonGap = Math.max(env.carbonEmissions - 500, 0);
    const disclosureRisk = governance.complianceScore >= 95 && governance.ethicsViolations === 0 ? 'Low' : governance.complianceScore >= 85 ? 'Medium' : 'High';

    return [
      {
        label: 'Carbon Reduction Gap',
        value: carbonGap === 0 ? 'On Target' : `${carbonGap.toFixed(1)} tCO2e`,
        detail: carbonGap === 0 ? 'Current dashboard period is within the carbon target band.' : 'Current emissions remain above the target band for this reporting period.',
      },
      {
        label: 'Renewable Momentum',
        value: `${env.renewableEnergy}%`,
        detail: env.renewableEnergy >= 50 ? 'Renewable share is already at or above the target threshold.' : 'Increasing renewable input remains the clearest environmental lift.',
      },
      {
        label: 'Safety Culture Pressure',
        value: `${social.trir}`,
        detail: social.trir < 1 ? 'Incident rate supports a healthy social performance outlook.' : 'TRIR remains the main drag on the social score.',
      },
      {
        label: 'Disclosure Risk',
        value: disclosureRisk,
        detail: `${governance.complianceScore}% compliance score with ${governance.ethicsViolations} ethics violations recorded.`,
      },
    ];
  }, [liveESGData]);

  const insights = useMemo(() => {
    if (!liveESGData) {
      return [];
    }

    return [
      {
        title: 'Environmental priority',
        text: liveESGData.environmental.renewableEnergy >= 50
          ? 'Renewable energy adoption is supporting the environmental score, so the next gain is likely through carbon and water reduction.'
          : 'Renewable energy remains below target, making it the highest-leverage environmental improvement area.',
      },
      {
        title: 'Social outlook',
        text: liveESGData.social.trainingHoursPerEmployee >= 40
          ? 'Training coverage is strong; TRIR reduction is now the key driver for improving social performance.'
          : 'Training hours per employee remain below target and are constraining the social score improvement path.',
      },
    ];
  }, [liveESGData]);

  const disclosureReadiness = useMemo(() => {
    if (!liveESGData) {
      return 0;
    }

    const score = Math.round((liveESGData.overallScore + liveESGData.governance.complianceScore + liveESGData.social.employeeSatisfaction) / 3);
    return clamp(score, 0, 100);
  }, [liveESGData]);

  const hasESGData = Boolean(
    liveESGData && (
      liveESGData.overallScore > 0 ||
      liveESGData.environmental.carbonEmissions > 0 ||
      liveESGData.social.trainingHoursPerEmployee > 0 ||
      liveESGData.governance.complianceScore > 0
    ),
  );

  return (
    <div className="min-h-screen bg-surface-950 text-white pb-20 selection:bg-brand-500/30">
      {/* HD Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/5 blur-[150px] rounded-full" />
      </div>


      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 relative z-10">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/40">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <span className="px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-400 text-[10px] font-bold uppercase tracking-widest">
                Sustainability & Governance
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
              ESG <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-violet-400">Performance</span>
            </h1>
            <p className="text-lg text-surface-400 leading-relaxed">
              Consolidated performance metrics for Environmental, Social, and Governance disclosure, aligned with global GRI and SASB standards.
            </p>
          </motion.div>

          <div className="flex items-center gap-4">
            <button className="p-4 bg-surface-900/60 backdrop-blur-xl border border-surface-800 rounded-2xl text-surface-400 hover:text-white transition-all">
              <Download className="w-6 h-6" />
            </button>
            <button className="p-4 bg-surface-900/60 backdrop-blur-xl border border-surface-800 rounded-2xl text-surface-400 hover:text-white transition-all">
              <Share2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Global ESG Score Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-900/40 border border-surface-800 rounded-[2.5rem] p-8 backdrop-blur-md mb-12"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Global ESG Index</h3>
                <p className="text-sm text-surface-500">Current backend category score mix across environmental, social, and governance performance</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-surface-500 uppercase tracking-widest font-bold mb-1">Current Score</p>
              <h4 className="text-4xl font-black text-brand-400">{liveESGData?.overallScore?.toFixed(1) ?? '0.0'}</h4>
            </div>
          </div>

          {scoreData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                  <Bar dataKey="score" radius={[12, 12, 0, 0]}>
                    {scoreData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <SectionEmptyState
              title="No backend ESG score data is available"
              description="This index now reads from the backend ESG dashboard endpoint and shows category scores only when ESG metrics have been recorded."
            />
          )}
        </motion.div>

        {!hasESGData && (
          <SectionEmptyState
            title="No backend ESG metrics are currently available"
            description="ESG Reporting now depends on backend environmental, social, and governance dashboard metrics. Record ESG values to populate this page."
          />
        )}

        {/* ESG Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {(['Environmental', 'Social', 'Governance'] as const).map((cat, catIndex) => {
            const config = categoryConfig[cat];
            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIndex * 0.1 }}
                className="bg-surface-900/40 backdrop-blur-md border border-surface-800 rounded-[2.5rem] p-8 hover:border-brand-500/30 transition-all group"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <config.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight">{cat}</h3>
                  </div>
                  <ChevronRight className="w-6 h-6 text-surface-600 group-hover:text-brand-400 transition-colors" />
                </div>
                
                <div className="space-y-8">
                  {metrics.filter((metric) => metric.category === cat).length > 0 ? metrics.filter((metric) => metric.category === cat).map((metric, index) => (
                    <div key={metric.metric} className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors">{metric.metric}</div>
                        <div className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${
                          metric.status === 'On Track' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {metric.status}
                        </div>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <div className="text-2xl font-black text-white">{metric.value}</div>
                        <div className="text-[10px] text-surface-500 font-bold uppercase tracking-widest">Target: {metric.target}</div>
                      </div>
                      <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.progress}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
                        />
                      </div>
                      <p className="text-[10px] text-surface-500 leading-relaxed">{metric.description}</p>
                    </div>
                  )) : (
                    <div className="rounded-3xl border border-dashed border-surface-700 bg-surface-800/20 p-6 text-sm text-surface-400">
                      No backend {cat.toLowerCase()} metrics are available for the selected ESG period.
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* AI ESG Forecast (New) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-900/40 border border-surface-800 rounded-[2.5rem] p-8 backdrop-blur-md mb-12 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
            <Zap className="w-64 h-64 text-white" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400 shadow-lg shadow-brand-500/5">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">AI ESG Forecast</h3>
                <p className="text-sm text-surface-500">Predictive sustainability modeling and compliance outlook</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                {forecastCards.slice(0, 2).map((card) => (
                  <div key={card.label} className="p-6 bg-surface-800/30 rounded-3xl border border-surface-700/50">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3">{card.label}</h4>
                    <p className="text-2xl font-black text-brand-300 mb-3">{card.value}</p>
                    <p className="text-xs text-surface-400 leading-relaxed">{card.detail}</p>
                  </div>
                ))}
              </div>
              
              <div className="bg-surface-800/20 rounded-3xl border border-surface-700/50 p-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4">Compliance Risk Outlook</h4>
                  <div className="space-y-4">
                    {forecastCards.slice(2).map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-surface-300">{item.label}</span>
                        <span className={`text-xs font-bold ${item.value === 'Low' || item.value === 'On Target' ? 'text-emerald-400' : item.value === 'Medium' ? 'text-amber-400' : 'text-brand-300'}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="w-full py-3 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-500/20 transition-all mt-6">
                  Generate AI ESG Report
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI ESG Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-surface-900/40 border border-surface-800 rounded-[2.5rem] p-8 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
              <Brain className="w-40 h-40 text-white" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">AI ESG Insights</h3>
                  <p className="text-sm text-surface-500">Predictive analysis for sustainability goals</p>
                </div>
              </div>

              <div className="space-y-4">
                {insights.length > 0 ? insights.map((insight) => (
                  <div key={insight.title} className="p-6 bg-surface-800/30 rounded-3xl border border-surface-700/50">
                    <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-widest">{insight.title}</h4>
                    <p className="text-xs text-surface-400 leading-relaxed">{insight.text}</p>
                  </div>
                )) : (
                  <SectionEmptyState
                    title="No AI ESG insights are available"
                    description="Insight cards now summarize backend ESG dashboard metrics instead of using static copy."
                  />
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-brand-600 to-violet-700 rounded-[2.5rem] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-40 h-40 text-white" />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-3xl font-black text-white mb-4 leading-tight">
                  Ready for <br />Disclosure
                </h3>
                <p className="text-brand-100 text-sm leading-relaxed mb-8 max-w-xs">
                  Backend ESG metrics currently indicate {disclosureReadiness}% disclosure readiness across sustainability, social, and governance reporting signals.
                </p>
              </div>
              <div className="space-y-3">
                <button className="w-full py-4 bg-white text-brand-600 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-50 transition-colors shadow-xl shadow-black/20">
                  Generate GRI Report
                </button>
                <button className="w-full py-4 bg-brand-500/20 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-500/30 transition-colors border border-brand-500/30">
                  Sync with CDP
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ESGReporting;
