import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  FileText, 
  BarChart3, 
  Zap, 
  RefreshCw, 
  Download, 
  Mail, 
  CheckCircle2, 
  AlertTriangle,
  Brain,
  TrendingUp,
  Target,
  ChevronRight,
  Clock,
  Shield,
  Search
} from 'lucide-react';

/* ================================================================
   AI AUTOMATED REPORTING
   Generates executive summaries, compliance reports, and KPI
   insights using AI analysis of platform data.
   ================================================================ */

export const AIAutomatedReporting: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setRiskData] = useState<any>(null);
  const [reportType, setReportType] = useState('executive-summary');

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulate AI data processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setRiskData({
      title: reportType === 'executive-summary' ? 'Executive Safety Summary - Q1 2026' : 'Compliance Audit Analysis',
      summary: 'Overall safety performance has improved by 14% compared to the previous quarter. However, a cluster of near-misses in the Logistics department suggests a potential training gap in forklift operations.',
      kpis: [
        { label: 'Incident Rate', value: '0.42', change: -12, trend: 'down' },
        { label: 'Compliance Score', value: '96.8%', change: +2.4, trend: 'up' },
        { label: 'Training Completion', value: '98.2%', change: +1.5, trend: 'up' }
      ],
      insights: [
        'AI detected a correlation between high humidity days and slip/trip incidents in Zone 4.',
        'Predictive model suggests a 65% risk of equipment failure in Line 3 within 10 days.',
        'ISO 45001 compliance is at an all-time high following the new digital JSA rollout.'
      ],
      recommendations: [
        'Schedule refresher forklift training for Logistics Team B.',
        'Install additional anti-slip matting in Zone 4 high-traffic areas.',
        'Conduct preventive maintenance on Line 3 hydraulic systems.'
      ]
    });
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Config Header */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-surface-200 dark:border-surface-800 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-surface-900 dark:text-white">AI Report Engine</h3>
              <p className="text-sm text-surface-500">Generate intelligent insights from your safety data</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-4 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="executive-summary">Executive Summary</option>
              <option value="compliance-audit">Compliance Audit</option>
              <option value="risk-forecast">Risk Forecast</option>
              <option value="incident-trends">Incident Trends</option>
            </select>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-600/20"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGenerating ? 'Analyzing Data...' : 'Generate AI Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <AnimatePresence mode="wait">
        {reportData ? (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden"
          >
            <div className="p-8 space-y-8">
              {/* Report Header */}
              <div className="flex justify-between items-start border-b border-surface-100 dark:border-surface-800 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-1">{reportData.title}</h2>
                  <p className="text-sm text-surface-500 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Generated on Feb 07, 2026 · AI Model: SafetyMEG-v4
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-surface-500 transition-colors">
                    <Download className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-surface-500 transition-colors">
                    <Mail className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-brand-600 uppercase tracking-widest">AI Executive Summary</h4>
                <p className="text-lg text-surface-700 dark:text-surface-300 leading-relaxed font-medium italic">
                  "{reportData.summary}"
                </p>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {reportData.kpis.map((kpi: any, i: number) => (
                  <div key={i} className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700/50">
                    <span className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">{kpi.label}</span>
                    <div className="flex items-end gap-2 mt-1">
                      <span className="text-2xl font-black text-surface-900 dark:text-white">{kpi.value}</span>
                      <span className={`text-xs font-bold flex items-center gap-0.5 mb-1 ${kpi.trend === 'down' && kpi.label.includes('Rate') ? 'text-emerald-500' : 'text-emerald-500'}`}>
                        {kpi.change > 0 ? '+' : ''}{kpi.change}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Insights & Recommendations */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-surface-500 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Key AI Insights
                  </h4>
                  <div className="space-y-3">
                    {reportData.insights.map((insight: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <p className="text-sm text-surface-700 dark:text-surface-300">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-surface-500 uppercase tracking-widest flex items-center gap-2">
                    <Target className="w-4 h-4 text-brand-500" />
                    Recommended Actions
                  </h4>
                  <div className="space-y-3">
                    {reportData.recommendations.map((rec: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-brand-500/5 border border-brand-500/10">
                        <CheckCircle2 className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-surface-700 dark:text-surface-300 font-medium">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-surface-50 dark:bg-surface-800/50 px-8 py-4 border-t border-surface-100 dark:border-surface-800 flex justify-between items-center">
              <span className="text-[10px] font-bold text-surface-400 uppercase tracking-tighter">Verified by SafetyMEG Compliance Engine</span>
              <button className="text-xs font-bold text-brand-600 hover:text-brand-500 flex items-center gap-1">
                View Full Data Source <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-96 flex flex-col items-center justify-center text-center bg-white dark:bg-surface-900 rounded-2xl border-2 border-dashed border-surface-200 dark:border-surface-800 p-12"
          >
            <div className="w-20 h-20 rounded-3xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-surface-300" />
            </div>
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Ready to Analyze</h3>
            <p className="text-surface-500 max-w-md mb-8">
              Select a report type and click "Generate" to let AI analyze your safety data and create a comprehensive summary.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {['OSHA 300 Logs', 'ISO 45001 Audit', 'Near-Miss Trends'].map(tag => (
                <span key={tag} className="px-3 py-1 bg-surface-100 dark:bg-surface-800 rounded-full text-[10px] font-bold text-surface-500 uppercase tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
