import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ESG_METRICS, type ESGMetric } from '../data/mockESG';
import {
  Globe,
  Users,
  ShieldCheck,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  ArrowLeft,
  Sparkles,
  Zap,
  Target,
  Activity,
  Info,
  Download,
  Share2,
  ChevronRight,
  Brain,
  Leaf,
  Scale,
  Shield
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useESGMetrics } from '../api/hooks/useAPIHooks';

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

const mockChartData = [
  { month: 'Jan', score: 82 },
  { month: 'Feb', score: 85 },
  { month: 'Mar', score: 84 },
  { month: 'Apr', score: 88 },
  { month: 'May', score: 91 },
  { month: 'Jun', score: 94 },
];

export const ESGReporting: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // ── Real API Data ──────────────────────────────────────────────────────
  const { data: liveESGData } = useESGMetrics('quarter');

  // Convert live backend ESGMetrics to display ESGMetric[] format
  const mergedESGMetrics: ESGMetric[] = React.useMemo(() => {
    if (!liveESGData) return ESG_METRICS;
    const env = liveESGData.environmental;
    const soc = liveESGData.social;
    const gov = liveESGData.governance;
    return [
      // Environmental
      { category: 'Environmental', metric: 'Carbon Footprint Reduction', value: `${env.scope1Emissions + env.scope2Emissions} tCO₂e`, target: '500 tCO₂e', status: (env.scope1Emissions + env.scope2Emissions) <= 500 ? 'On Track' : 'At Risk', description: 'Scope 1 + 2 carbon emissions.', trend: 'up' },
      { category: 'Environmental', metric: 'Energy Consumption', value: `${env.energyConsumption} MWh`, target: '800 MWh', status: env.energyConsumption <= 800 ? 'On Track' : 'At Risk', description: 'Total energy usage.', trend: env.energyConsumption <= 800 ? 'up' : 'down' },
      { category: 'Environmental', metric: 'Water Usage Efficiency', value: `${env.waterUsage} m³`, target: '5000 m³', status: env.waterUsage <= 5000 ? 'On Track' : 'At Risk', description: 'Water consumption efficiency.', trend: 'stable' },
      { category: 'Environmental', metric: 'Waste Management', value: `${env.wasteDiverted}%`, target: '95%', status: env.wasteDiverted >= 95 ? 'On Track' : 'At Risk', description: 'Waste diverted from landfills.', trend: env.wasteDiverted >= 90 ? 'up' : 'down' },
      // Social
      { category: 'Social', metric: 'Employee Diversity', value: `${soc.diversityIndex}%`, target: '40%', status: soc.diversityIndex >= 35 ? 'On Track' : 'At Risk', description: 'Diverse representation across all levels.', trend: 'up' },
      { category: 'Social', metric: 'Safety Training Completion', value: `${soc.trainingHoursPerEmployee}h/emp`, target: '40h', status: soc.trainingHoursPerEmployee >= 30 ? 'On Track' : 'At Risk', description: 'Training hours per employee.', trend: 'stable' },
      { category: 'Social', metric: 'Community Impact', value: `${soc.volunteerHours} hrs`, target: '1000 hrs', status: soc.volunteerHours >= 800 ? 'On Track' : 'At Risk', description: 'Volunteer hours contributed.', trend: 'up' },
      { category: 'Social', metric: 'TRIR Safety Rate', value: `${soc.trir}`, target: '< 1.0', status: soc.trir < 1.0 ? 'On Track' : 'At Risk', description: 'Total recordable incident rate.', trend: soc.trir < 1.0 ? 'up' : 'down' },
      // Governance
      { category: 'Governance', metric: 'Compliance Score', value: `${gov.complianceScore}%`, target: '98%', status: gov.complianceScore >= 95 ? 'On Track' : 'At Risk', description: 'Overall regulatory compliance.', trend: gov.complianceScore >= 95 ? 'up' : 'down' },
      { category: 'Governance', metric: 'Audit Findings Closed', value: `${gov.auditFindingsClosed}`, target: '100%', status: gov.auditFindingsClosed > 10 ? 'On Track' : 'At Risk', description: 'Closed audit findings count.', trend: 'up' },
      { category: 'Governance', metric: 'Policy Reviews Completed', value: `${gov.policyReviewsCompleted}`, target: '12', status: gov.policyReviewsCompleted >= 10 ? 'On Track' : 'At Risk', description: 'Policy reviews conducted this period.', trend: 'stable' },
      { category: 'Governance', metric: 'Ethics Violations', value: `${gov.ethicsViolations}`, target: '0', status: gov.ethicsViolations === 0 ? 'On Track' : 'At Risk', description: 'Reported ethics violations.', trend: gov.ethicsViolations === 0 ? 'up' : 'down' },
    ];
  }, [liveESGData]);

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
                <p className="text-sm text-surface-500">Consolidated performance trend across all categories</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-surface-500 uppercase tracking-widest font-bold mb-1">Current Score</p>
              <h4 className="text-4xl font-black text-brand-400">{liveESGData?.overallScore?.toFixed(1) ?? '94.2'}</h4>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="score" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

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
                  {mergedESGMetrics.filter((m: ESGMetric) => m.category === cat).map((metric: ESGMetric, index: number) => (
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
                          animate={{ width: metric.value.includes('%') ? metric.value : '85%' }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
                        />
                      </div>
                      <p className="text-[10px] text-surface-500 leading-relaxed">{metric.description}</p>
                    </div>
                  ))}
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
                <div className="p-6 bg-surface-800/30 rounded-3xl border border-surface-700/50">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3">Carbon Neutrality Path</h4>
                  <div className="flex items-end gap-4 mb-4">
                    <div className="flex-1 h-2 bg-surface-700 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '75%' }}
                        className="h-full bg-emerald-500"
                      />
                    </div>
                    <span className="text-sm font-bold text-emerald-400">75%</span>
                  </div>
                  <p className="text-xs text-surface-400 leading-relaxed">
                    Based on current renewable energy adoption rates, you are projected to reach Net Zero by Q3 2029, 15 months ahead of the 2030 target.
                  </p>
                </div>
                <div className="p-6 bg-surface-800/30 rounded-3xl border border-surface-700/50">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3">Social Impact Projection</h4>
                  <p className="text-xs text-surface-400 leading-relaxed">
                    Employee retention is forecasted to increase by 8% following the implementation of the new AI-driven safety mentorship program.
                  </p>
                </div>
              </div>
              
              <div className="bg-surface-800/20 rounded-3xl border border-surface-700/50 p-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4">Compliance Risk Outlook</h4>
                  <div className="space-y-4">
                    {[
                      { label: 'GRI Standards', risk: 'Low', color: 'text-emerald-400' },
                      { label: 'SASB Disclosure', risk: 'Low', color: 'text-emerald-400' },
                      { label: 'EU Taxonomy', risk: 'Medium', color: 'text-amber-400' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-surface-300">{item.label}</span>
                        <span className={`text-xs font-bold ${item.color}`}>{item.risk} Risk</span>
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
                <div className="p-6 bg-surface-800/30 rounded-3xl border border-surface-700/50">
                  <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-widest">Carbon Neutrality Path</h4>
                  <p className="text-xs text-surface-400 leading-relaxed">
                    Based on current trends, you are projected to reach your 2030 carbon neutrality goal 14 months ahead of schedule.
                  </p>
                </div>
                <div className="p-6 bg-surface-800/30 rounded-3xl border border-surface-700/50">
                  <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-widest">Social Impact Alert</h4>
                  <p className="text-xs text-surface-400 leading-relaxed">
                    Employee diversity in leadership roles has increased by 12% following the new mentorship program.
                  </p>
                </div>
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
                  Your ESG data is fully validated and ready for export to CDP, GRI, and SASB reporting platforms.
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
