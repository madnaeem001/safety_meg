import React, { useState, useMemo } from 'react';
import { EmissionTypeCard } from '../components/safety/risk-digester/emissions/EmissionTypeCard';
import { EmissionHistoryTable } from '../components/safety/risk-digester/emissions/EmissionHistoryTable';
import { FacilityBreakdownChart } from '../components/safety/risk-digester/emissions/FacilityBreakdownChart';
import { DETAILED_EMISSIONS, DetailedEmission } from '../data/mockRiskDigester';
import { PhotoUpload } from '../components/safety/PhotoUpload';
import { motion } from 'framer-motion';
import { Wind, ArrowLeft, Calendar, Filter, Brain, Activity, Leaf, TrendingDown, AlertTriangle, CheckCircle2, BarChart3, Globe, Target, Zap, Factory } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmissionsData, EmissionsResponse } from '../api/hooks/useAPIHooks';

export const EmissionReports: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'compliance' | 'ai-forecast'>('overview');

  // ── Real API Data ────────────────────────────────────────────────────────
  const { data: backendEmissions } = useEmissionsData();

  const detailedEmissions = useMemo<DetailedEmission[]>(() => {
    if (!backendEmissions) return DETAILED_EMISSIONS;
    // Backend returns { detailedEmissions, logs, facilityBreakdown, ... }
    if (Array.isArray(backendEmissions.detailedEmissions) && backendEmissions.detailedEmissions.length > 0) {
      const converted: DetailedEmission[] = backendEmissions.detailedEmissions.map((e) => ({
        id: String(e.id),
        type: e.type,
        unit: e.unit,
        actual: e.actual,
        limit: e.limit,
        status: e.status,
        trend: e.trend,
      }));
      const backendIds = new Set(converted.map(c => c.id));
      return [...converted, ...DETAILED_EMISSIONS.filter(d => !backendIds.has(d.id))];
    }
    return DETAILED_EMISSIONS;
  }, [backendEmissions]);

  return (
    <div className="min-h-screen bg-surface-50 pb-32 text-left">

      
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-brand-600 font-bold text-[10px] uppercase tracking-[0.3em] mb-4 hover:text-brand-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Risk Digester
            </button>
            <div className="flex items-center gap-3 text-brand-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-2">
              <Wind className="w-4 h-4" />
              Environmental Compliance
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-brand-900 tracking-tighter leading-none text-left">Emission Reports</h1>
            <p className="text-surface-500 mt-4 max-w-xl text-lg text-left">
              Detailed analysis of atmospheric pollutants and greenhouse gas emissions across all facilities.
            </p>
          </motion.div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-4 bg-white border border-surface-100 rounded-2xl shadow-soft hover:bg-surface-50 transition-all text-xs font-bold uppercase tracking-widest text-surface-600">
              <Calendar className="w-4 h-4" />
              Last 30 Days
            </button>
            <button className="flex items-center gap-2 px-6 py-4 bg-white border border-surface-100 rounded-2xl shadow-soft hover:bg-surface-50 transition-all text-xs font-bold uppercase tracking-widest text-surface-600">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 bg-surface-100/50 p-1 rounded-2xl w-fit">
          {[
            { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
            { id: 'compliance' as const, label: 'Compliance Status', icon: CheckCircle2 },
            { id: 'ai-forecast' as const, label: 'AI Forecast', icon: Brain },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-white shadow-soft text-brand-700' : 'text-surface-500 hover:text-brand-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Emission Type Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {detailedEmissions.map((emission, index) => (
                <EmissionTypeCard key={emission.id} emission={emission} delay={index * 0.1} />
              ))}
            </div>

            {/* Detailed Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <EmissionHistoryTable logs={backendEmissions?.logs} />
              </div>
              <div className="lg:col-span-1">
                <FacilityBreakdownChart facilityData={backendEmissions?.facilityBreakdown} />
              </div>
            </div>
          </>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            {/* Regulatory Compliance Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { regulation: 'EPA Clean Air Act (CAA)', status: 'Compliant', lastAudit: '2026-01-15', nextDue: '2026-07-15', permits: 4, violations: 0, color: 'green' },
                { regulation: 'EU ETS - Emissions Trading', status: 'Compliant', lastAudit: '2026-01-20', nextDue: '2026-06-20', permits: 2, violations: 0, color: 'green' },
                { regulation: 'EPA NESHAP (40 CFR 63)', status: 'Minor Finding', lastAudit: '2026-02-01', nextDue: '2026-08-01', permits: 3, violations: 1, color: 'yellow' },
                { regulation: 'State Title V Permits', status: 'Compliant', lastAudit: '2026-01-10', nextDue: '2026-07-10', permits: 5, violations: 0, color: 'green' },
                { regulation: 'GHG Reporting Rule (40 CFR 98)', status: 'Report Due', lastAudit: '2025-12-15', nextDue: '2026-03-31', permits: 1, violations: 0, color: 'blue' },
                { regulation: 'CARB AB 32 (California)', status: 'Compliant', lastAudit: '2026-01-25', nextDue: '2026-07-25', permits: 2, violations: 0, color: 'green' },
              ].map((reg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-brand-900 text-sm">{reg.regulation}</h4>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${reg.color === 'green' ? 'bg-emerald-50 text-emerald-700' : reg.color === 'yellow' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{reg.status}</span>
                  </div>
                  <div className="space-y-2 text-xs text-surface-500">
                    <div className="flex justify-between"><span>Last Audit:</span><span className="font-bold text-surface-700">{reg.lastAudit}</span></div>
                    <div className="flex justify-between"><span>Next Due:</span><span className="font-bold text-surface-700">{reg.nextDue}</span></div>
                    <div className="flex justify-between"><span>Active Permits:</span><span className="font-bold text-surface-700">{reg.permits}</span></div>
                    <div className="flex justify-between"><span>Open Violations:</span><span className={`font-bold ${reg.violations > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{reg.violations}</span></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai-forecast' && (
          <div className="space-y-6">
            {/* AI Forecast Dashboard */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white border border-cyan-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">AI Emission Forecasting Engine</h3>
                  <p className="text-cyan-300 text-xs font-mono">LSTM NEURAL NETWORK • 94.2% ACCURACY • 12-MONTH PROJECTION</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Predicted CO₂ (2026)', value: '12,450 t', trend: '-8.3% vs 2025', color: 'green' },
                  { label: 'Carbon Tax Liability', value: '$186K', trend: '-$24K savings', color: 'green' },
                  { label: 'Permit Exceedance Risk', value: '4.2%', trend: 'Within limits', color: 'green' },
                  { label: 'Net Zero Target', value: '2041', trend: '3 yrs ahead', color: 'cyan' },
                ].map((m, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-xs text-cyan-300 mb-1">{m.label}</p>
                    <p className="text-xl font-black">{m.value}</p>
                    <p className={`text-[10px] font-mono mt-1 ${m.color === 'green' ? 'text-green-400' : 'text-cyan-400'}`}>{m.trend}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'Boiler Efficiency Optimization', desc: 'AI recommends adjusting combustion parameters on Boiler #3 to reduce NOx emissions by 15% while maintaining thermal efficiency.', impact: '-340 kg/yr NOx', confidence: 92 },
                  { title: 'Fugitive Emission Reduction', desc: 'LDAR analysis identifies 3 valve stems in Section C with leak rates exceeding 500 ppm. Predicted to escalate to reportable levels within 30 days.', impact: '-1,200 kg/yr VOCs', confidence: 88 },
                  { title: 'Renewable Energy Transition', desc: 'Solar panel installation on Building D roof can offset 18% of facility electricity emissions. ROI estimated at 4.2 years.', impact: '-2,100 t/yr CO₂', confidence: 95 },
                ].map((rec, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} className="bg-white/10 rounded-2xl p-4 border border-white/10">
                    <h4 className="font-bold text-sm mb-2">{rec.title}</h4>
                    <p className="text-cyan-200 text-xs mb-3">{rec.desc}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-green-400 font-bold">{rec.impact}</span>
                      <span className="text-[10px] text-cyan-300 font-mono">Confidence: {rec.confidence}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Environmental Analysis */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">AI Emission Predictor</h3>
              <p className="text-emerald-200 text-xs">Machine learning models analyzing emission trends and forecasting compliance</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Emission Reduction', value: '-12.4%', icon: TrendingDown },
              { label: 'Carbon Offset', value: '847t', icon: Leaf },
              { label: 'AI Predictions', value: '94.2%', icon: Brain },
              { label: 'Compliance Score', value: '97%', icon: Activity },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 rounded-xl p-3 border border-white/10">
                <p className="text-xl font-black">{s.value}</p>
                <p className="text-[9px] text-emerald-200 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Emission Photo Documentation */}
        <PhotoUpload
          title="Environmental Monitoring Photos"
          description="Upload emission monitoring photos, stack test images, and environmental compliance evidence."
          maxFiles={15}
          acceptVideo={true}
          showAIAnalysis={true}
          darkMode={false}
        />
      </main>
    </div>
  );
};

export default EmissionReports;
