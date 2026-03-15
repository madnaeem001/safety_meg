import React, { useState, useMemo } from 'react';
import {
  type ISORequirement,
  Industry,
  RiskLevel
} from '../data/mockComplianceProcedures';

const ISO_9001_REQUIREMENTS: ISORequirement[] = [];
import type { ComplianceProcedureRecord } from '../api/services/apiService';
import { motion, AnimatePresence } from 'framer-motion';
import { useComplianceProcedures } from '../api/hooks/useAPIHooks';
import { 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronRight,
  ChevronDown,
  Building2,
  Activity,
  History,
  Brain,
  Sparkles,
  Filter,
  BookOpen,
  ClipboardList
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  }
};

const getRiskColor = (level: RiskLevel) => {
  switch (level) {
    case 'Low': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    case 'Medium': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
    case 'High': return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' };
    case 'Critical': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' };
  }
};

const getTrendIcon = (trend: 'improving' | 'stable' | 'worsening') => {
  switch (trend) {
    case 'improving': return <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />;
    case 'stable': return <Minus className="w-3.5 h-3.5 text-surface-400" />;
    case 'worsening': return <TrendingUp className="w-3.5 h-3.5 text-red-500" />;
  }
};

const ProcedureCard: React.FC<{ procedure: ComplianceProcedureRecord; onSelect: () => void; isExpanded: boolean }> = ({ procedure, onSelect, isExpanded }) => {
  const riskColors = getRiskColor(procedure.aiRisk.level as RiskLevel);
  
  return (
    <motion.div
      layout
      variants={itemVariants}
      className="bg-white rounded-3xl shadow-soft border border-surface-100/80 overflow-hidden"
    >
      <motion.button
        onClick={onSelect}
        className="w-full p-5 text-left flex items-start gap-4 hover:bg-surface-50/50 transition-colors"
      >
        {/* Risk Indicator */}
        <div className={`flex-shrink-0 w-14 h-14 rounded-2xl ${riskColors.bg} border ${riskColors.border} flex flex-col items-center justify-center`}>
          <span className={`text-lg font-bold ${riskColors.text}`}>{procedure.aiRisk.score}</span>
          <div className="flex items-center gap-0.5">
            {getTrendIcon(procedure.aiRisk.trending)}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-bold text-brand-900 text-base leading-tight">{procedure.title}</h3>
              <p className="text-xs text-surface-400 mt-0.5">{procedure.id} • v{procedure.version}</p>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-surface-300" />
            </motion.div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {procedure.industries.slice(0, 3).map((ind) => (
              <span key={ind} className="px-2 py-0.5 bg-brand-50 text-brand-600 text-[10px] font-semibold rounded-full">
                {ind}
              </span>
            ))}
            {procedure.industries.length > 3 && (
              <span className="px-2 py-0.5 bg-surface-100 text-surface-500 text-[10px] font-semibold rounded-full">
                +{procedure.industries.length - 3}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-surface-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Updated {procedure.lastUpdated}
            </span>
            {procedure.isoClause && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                ISO {procedure.isoClause}
              </span>
            )}
          </div>
        </div>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-surface-100">
              {/* AI Risk Analysis */}
              <div className={`mt-4 p-4 rounded-2xl ${riskColors.bg} border ${riskColors.border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-brand-600" />
                  <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">AI Risk Analysis</span>
                  <Sparkles className="w-3 h-3 text-brand-400 animate-pulse" />
                </div>
                <p className="text-sm text-brand-800 leading-relaxed">{procedure.aiRisk.rationale}</p>
                <p className="text-[10px] text-surface-400 mt-2">Last analyzed: {new Date(procedure.aiRisk.lastAnalyzed).toLocaleString()}</p>
              </div>

              {/* Scope */}
              <div>
                <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Scope</h4>
                <p className="text-sm text-brand-800">{procedure.scope}</p>
              </div>

              {/* Procedure Steps */}
              <div>
                <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3">Procedure Steps</h4>
                <div className="space-y-2">
                  {procedure.steps.map((step) => (
                    <div key={step.stepNumber} className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${step.criticalControl ? 'bg-accent-100 text-accent-600' : 'bg-brand-100 text-brand-600'}`}>
                        <span className="text-xs font-bold">{step.stepNumber}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-semibold text-sm text-brand-900">{step.title}</h5>
                          {step.criticalControl && (
                            <span className="px-1.5 py-0.5 bg-accent-100 text-accent-600 text-[9px] font-bold rounded uppercase">Critical</span>
                          )}
                        </div>
                        <p className="text-xs text-surface-500 mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Trail */}
              <div>
                <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <History className="w-3.5 h-3.5" />
                  Audit Trail
                </h4>
                <div className="space-y-2">
                  {procedure.auditTrail.map((event, idx) => (
                    <div key={event.id} className="flex items-start gap-3 relative">
                      {idx < procedure.auditTrail.length - 1 && (
                        <div className="absolute left-3 top-6 w-px h-full bg-surface-200" />
                      )}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                        event.action === 'Approved' ? 'bg-emerald-100' :
                        event.action === 'Updated' ? 'bg-blue-100' :
                        event.action === 'Reviewed' ? 'bg-violet-100' :
                        'bg-surface-100'
                      }`}>
                        <CheckCircle2 className={`w-3.5 h-3.5 ${
                          event.action === 'Approved' ? 'text-emerald-600' :
                          event.action === 'Updated' ? 'text-blue-600' :
                          event.action === 'Reviewed' ? 'text-violet-600' :
                          'text-surface-500'
                        }`} />
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-brand-900">{event.action}</span>
                          <span className="text-[10px] text-surface-400">by {event.user}</span>
                        </div>
                        <p className="text-xs text-surface-500 mt-0.5">{event.details}</p>
                        <p className="text-[10px] text-surface-300 mt-1">{new Date(event.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const ComplianceAndProcedures: React.FC = () => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterIndustry, setFilterIndustry] = useState<Industry | 'All'>('All');

  // ── Backend Data (sole source of truth) ────────────────────────────────────
  const { data: procedures } = useComplianceProcedures();

  const filteredProcedures: ComplianceProcedureRecord[] = useMemo(() => {
    const all = procedures ?? [];
    if (filterIndustry === 'All') return all;
    return all.filter(p => (p.industries ?? []).includes(filterIndustry));
  }, [procedures, filterIndustry]);

  const aggregateRisk = useMemo(() => {
    const all = procedures ?? [];
    if (all.length === 0) return { overall: 0, byLevel: { Low: 0, Medium: 0, High: 0, Critical: 0 } };
    const scores = all.map(p => p.aiRisk?.score ?? 50);
    const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return {
      overall,
      byLevel: {
        Low: all.filter(p => p.aiRisk?.level === 'Low').length,
        Medium: all.filter(p => p.aiRisk?.level === 'Medium').length,
        High: all.filter(p => p.aiRisk?.level === 'High').length,
        Critical: all.filter(p => p.aiRisk?.level === 'Critical').length,
      },
    };
  }, [procedures]);

  const industries: Industry[] = ['Oil & Gas', 'Construction', 'Machine Shops', 'Manufacturing', 'Healthcare', 'Transportation', 'Warehouse'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100 pb-32">

      
      <main className="max-w-4xl mx-auto px-5 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 text-brand-500 font-bold text-[10px] uppercase tracking-[0.3em]">
            <ClipboardList className="w-4 h-4" />
            Compliance Module
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-brand-900 tracking-tight">
            Compliance & Procedures
          </h1>
          <p className="text-surface-500 max-w-2xl">
            AI-driven risk monitoring with industry-specific safety procedures aligned to ISO 9001, OSHA, and regulatory standards.
          </p>
        </motion.div>

        {/* AI Risk Overview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-brand-800 via-brand-850 to-brand-900 p-6 rounded-3xl shadow-glow text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              <h2 className="font-bold text-lg">AI Risk Indicator</h2>
              <Sparkles className="w-4 h-4 text-brand-200 animate-pulse" />
            </div>
            <span className="text-[10px] font-semibold text-brand-200 uppercase tracking-wider">Real-time Analysis</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="col-span-2 md:col-span-1 bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-4xl font-bold tracking-tighter">{aggregateRisk.overall}</div>
              <div className="text-[10px] font-bold text-brand-200 uppercase tracking-widest mt-1">Overall Score</div>
            </div>
            
            {Object.entries(aggregateRisk.byLevel).map(([level, count]) => {
              const colors = getRiskColor(level as RiskLevel);
              return (
                <div key={level} className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    <span className="text-xs font-semibold text-brand-100">{level}</span>
                  </div>
                  <div className="text-2xl font-bold">{count}</div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Industry Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide"
        >
          <div className="flex items-center gap-1.5 text-surface-400 flex-shrink-0">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-semibold">Filter:</span>
          </div>
          <button
            onClick={() => setFilterIndustry('All')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${
              filterIndustry === 'All' 
                ? 'bg-brand-900 text-white shadow-soft' 
                : 'bg-white text-brand-700 border border-surface-200 hover:bg-surface-50'
            }`}
          >
            All Industries
          </button>
          {industries.map((ind) => (
            <button
              key={ind}
              onClick={() => setFilterIndustry(ind)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${
                filterIndustry === ind 
                  ? 'bg-brand-900 text-white shadow-soft' 
                  : 'bg-white text-brand-700 border border-surface-200 hover:bg-surface-50'
              }`}
            >
              {ind}
            </button>
          ))}
        </motion.div>

        {/* Procedures List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {filteredProcedures.map((procedure) => (
            <ProcedureCard
              key={procedure.id}
              procedure={procedure}
              isExpanded={expandedId === procedure.id}
              onSelect={() => setExpandedId(expandedId === procedure.id ? null : procedure.id)}
            />
          ))}
        </motion.div>

        {/* ISO 9001 Quick Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl shadow-soft border border-surface-100/80 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-brand-600" />
            <h2 className="font-bold text-lg text-brand-900">ISO 9001:2015 Quick Reference</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ISO_9001_REQUIREMENTS.slice(0, 4).map((req) => (
              <div key={req.clause} className="p-4 bg-surface-50 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-xs font-bold rounded">
                    {req.clause}
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-brand-900 mb-1">{req.title}</h3>
                <p className="text-xs text-surface-500 line-clamp-2">{req.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ComplianceAndProcedures;
