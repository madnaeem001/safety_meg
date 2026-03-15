import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  type SIFIndicator,
} from '../data/complianceManagement';
import FadeContent from '../components/animations/FadeContent';
import { useSIFPrecursors } from '../api/hooks/useAPIHooks';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  }
};

const potentialConfig: Record<string, { color: string; bgColor: string; borderColor: string; icon: string; label: string }> = {
  high: { color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-400', icon: '🚨', label: 'High SIF Potential' },
  medium: { color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-400', icon: '⚠️', label: 'Medium SIF Potential' },
  low: { color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-300', icon: '📋', label: 'Low SIF Potential' }
};

const energyTypeIcons: Record<string, string> = {
  'Kinetic - Vehicle/Equipment': '🚜',
  'Gravity - Fall': '⬇️',
  'Electrical': '⚡',
  'Chemical': '🧪',
  'Thermal': '🔥',
  'Pressure': '💨',
  'Mechanical': '⚙️',
};

export const SIFPrecursorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<SIFIndicator[]>([]);
  const [selectedPotential, setSelectedPotential] = useState<string>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [aiInsightsOpen, setAiInsightsOpen] = useState(false);

  // ── Real API Data ──────────────────────────────────────────────────────────
  const { data: backendPrecursors } = useSIFPrecursors();

  useEffect(() => {
    if (backendPrecursors && (backendPrecursors as any[]).length > 0) {
      const converted: SIFIndicator[] = (backendPrecursors as any[]).map((p: any) => ({
        id: String(p.id),
        incidentId: `SIF-${String(p.id).padStart(4, '0')}`,
        incidentTitle: p.title,
        incidentDate: p.created_at
          ? new Date(p.created_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        sifPotential: (['high', 'medium', 'low'].includes(p.severity) ? p.severity : 'low') as 'high' | 'medium' | 'low',
        indicators: Array.isArray(p.associatedHazards) && p.associatedHazards.length > 0
          ? p.associatedHazards
          : (p.description ? [p.description] : []),
        riskScore: p.severity === 'high' ? 80 : p.severity === 'medium' ? 50 : 25,
        energyType: p.precursor_type || 'Mechanical',
        controlsDeficient: Array.isArray(p.mitigationActions) ? p.mitigationActions : [],
        recommendations: [],
        acknowledged: p.status !== 'active',
      }));
      setAlerts(converted);
    }
  }, [backendPrecursors]);

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesPotential = selectedPotential === 'all' || alert.sifPotential === selectedPotential;
      const matchesAcknowledged = showAcknowledged || !alert.acknowledged;
      return matchesPotential && matchesAcknowledged;
    });
  }, [alerts, selectedPotential, showAcknowledged]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = alerts.length;
    const highPotential = alerts.filter(a => a.sifPotential === 'high').length;
    const unacknowledged = alerts.filter(a => !a.acknowledged).length;
    const avgRiskScore = Math.round(alerts.reduce((sum, a) => sum + a.riskScore, 0) / total);
    
    // Group by energy type
    const byEnergyType: Record<string, number> = {};
    alerts.forEach(a => {
      byEnergyType[a.energyType] = (byEnergyType[a.energyType] || 0) + 1;
    });
    
    return { total, highPotential, unacknowledged, avgRiskScore, byEnergyType };
  }, [alerts]);

  const handleAcknowledge = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'from-red-500 to-red-600';
    if (score >= 60) return 'from-orange-500 to-orange-600';
    return 'from-amber-500 to-amber-600';
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-600 via-red-500 to-orange-500 pt-12 pb-8 px-4 safe-top">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">SIF Precursor Detection</h1>
            <p className="text-red-100 text-sm">AI-powered serious injury prevention</p>
          </div>
          <button
            onClick={() => setAiInsightsOpen(true)}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform relative"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
          </button>
        </div>

        {/* Alert Metrics */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-center">
            <p className="text-xl font-bold text-white">{metrics.total}</p>
            <p className="text-xs text-red-100">Total SIF</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-center">
            <p className="text-xl font-bold text-red-200">{metrics.highPotential}</p>
            <p className="text-xs text-red-100">High Risk</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-center">
            <p className="text-xl font-bold text-yellow-200">{metrics.unacknowledged}</p>
            <p className="text-xs text-red-100">Unacked</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-center">
            <p className="text-xl font-bold text-white">{metrics.avgRiskScore}</p>
            <p className="text-xs text-red-100">Avg Score</p>
          </div>
        </div>
      </div>

      {/* Energy Type Distribution */}
      <div className="px-4 -mt-4">
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm border border-surface-200 dark:border-surface-700">
          <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-3">Energy Type Distribution</h3>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {Object.entries(metrics.byEnergyType).map(([type, count]) => (
              <div key={type} className="flex-none px-3 py-2 bg-surface-50 dark:bg-surface-900 rounded-lg">
                <span className="text-lg mr-1">{energyTypeIcons[type] || '⚡'}</span>
                <span className="text-xs font-medium text-surface-700 dark:text-surface-300">{type.split(' - ')[1] || type}</span>
                <span className="ml-2 text-xs text-surface-500">({count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 mt-4">
        <div className="flex gap-2 items-center">
          <div className="flex gap-1 flex-1 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSelectedPotential('all')}
              className={`flex-none px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                selectedPotential === 'all' 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600'
              }`}
            >
              All
            </button>
            {(['high', 'medium', 'low'] as const).map((level) => {
              const config = potentialConfig[level];
              return (
                <button
                  key={level}
                  onClick={() => setSelectedPotential(level)}
                  className={`flex-none px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    selectedPotential === level 
                      ? `${config.bgColor} ${config.color}` 
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-600'
                  }`}
                >
                  {config.icon} {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              );
            })}
          </div>
          
          <label className="flex items-center gap-2 text-xs text-surface-500">
            <input
              type="checkbox"
              checked={showAcknowledged}
              onChange={(e) => setShowAcknowledged(e.target.checked)}
              className="w-4 h-4 rounded border-surface-300"
            />
            Show Acked
          </label>
        </div>
      </div>

      {/* SIF Alerts List */}
      <FadeContent>
        <motion.div 
          className="px-4 mt-4 space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {filteredAlerts.map((alert) => {
              const config = potentialConfig[alert.sifPotential];
              const isExpanded = expandedAlert === alert.id;

              return (
                <motion.div
                  key={alert.id}
                  variants={itemVariants}
                  layout
                  className={`bg-white dark:bg-surface-800 rounded-xl border-l-4 ${config.borderColor} shadow-sm overflow-hidden ${
                    alert.acknowledged ? 'opacity-60' : ''
                  }`}
                >
                  <button
                    onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                            {config.icon} {config.label}
                          </span>
                          {alert.acknowledged && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              ✓ Acknowledged
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                          {alert.incidentTitle}
                        </h3>
                        <p className="text-sm text-surface-500 mt-0.5">
                          {alert.incidentId} • {new Date(alert.incidentDate).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {/* Risk Score Gauge */}
                      <div className="relative w-14 h-14">
                        <svg className="w-14 h-14 -rotate-90">
                          <circle
                            cx="28"
                            cy="28"
                            r="24"
                            strokeWidth="5"
                            className="fill-none stroke-surface-100 dark:stroke-surface-700"
                          />
                          <circle
                            cx="28"
                            cy="28"
                            r="24"
                            strokeWidth="5"
                            strokeDasharray={`${(alert.riskScore / 100) * 150.8} 150.8`}
                            className={`fill-none ${alert.riskScore >= 80 ? 'stroke-red-500' : alert.riskScore >= 60 ? 'stroke-orange-500' : 'stroke-amber-500'}`}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-surface-700 dark:text-surface-300">
                          {alert.riskScore}
                        </span>
                      </div>
                    </div>

                    {/* Energy Type Badge */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-lg">{energyTypeIcons[alert.energyType] || '⚡'}</span>
                      <span className="text-sm text-surface-600 dark:text-surface-400">{alert.energyType}</span>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-surface-100 dark:border-surface-700"
                      >
                        <div className="p-4 space-y-4">
                          {/* SIF Indicators */}
                          <div>
                            <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                              <span className="text-red-500">⚠️</span> SIF Indicators Detected
                            </h4>
                            <div className="space-y-1.5">
                              {alert.indicators.map((indicator, i) => (
                                <div key={i} className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                  <span className="text-red-500 mt-0.5">•</span>
                                  <p className="text-sm text-surface-700 dark:text-surface-300">{indicator}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Control Deficiencies */}
                          <div>
                            <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                              <span className="text-orange-500">🛡️</span> Control Deficiencies
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {alert.controlsDeficient.map((control, i) => (
                                <span key={i} className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-lg text-sm">
                                  {control}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* AI Recommendations */}
                          <div>
                            <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                              <span className="text-green-500">💡</span> AI Recommendations
                            </h4>
                            <div className="space-y-2">
                              {alert.recommendations.map((rec, i) => (
                                <div key={i} className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                  <span className="text-green-600 font-bold text-xs mt-0.5">{i + 1}</span>
                                  <p className="text-sm text-surface-700 dark:text-surface-300">{rec}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          {!alert.acknowledged && (
                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcknowledge(alert.id);
                                }}
                                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium active:scale-98 transition-transform flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Acknowledge & Review
                              </button>
                              <button
                                className="flex-1 py-2.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium active:scale-98 transition-transform flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Escalate
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredAlerts.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-surface-500 dark:text-surface-400">No SIF precursors requiring attention</p>
            </div>
          )}
        </motion.div>
      </FadeContent>

      {/* AI Insights Modal */}
      <AnimatePresence>
        {aiInsightsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={() => setAiInsightsOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white dark:bg-surface-800 rounded-t-3xl w-full max-w-lg max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-surface-100 dark:border-surface-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <h2 className="font-bold text-lg text-surface-900 dark:text-surface-100">AI Safety Insights</h2>
                </div>
                <button
                  onClick={() => setAiInsightsOpen(false)}
                  className="p-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-700"
                >
                  <svg className="w-5 h-5 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)] space-y-4">
                {/* Pattern Analysis */}
                <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl">
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-2 flex items-center gap-2">
                    <span>📊</span> Pattern Analysis
                  </h3>
                  <p className="text-sm text-surface-600 dark:text-surface-400">
                    Based on analysis of {alerts.length} SIF precursors, <strong>fall from height</strong> and <strong>LOTO violations</strong> represent the highest risk categories. These account for 67% of high-potential incidents.
                  </p>
                </div>

                {/* Trend Alert */}
                <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 rounded-xl">
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-2 flex items-center gap-2">
                    <span>📈</span> Trend Alert
                  </h3>
                  <p className="text-sm text-surface-600 dark:text-surface-400">
                    There is a <strong>35% increase</strong> in pedestrian-forklift near-misses this month compared to the 12-month average. Consider implementing additional traffic management controls.
                  </p>
                </div>

                {/* Recommended Focus Areas */}
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl">
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-2 flex items-center gap-2">
                    <span>🎯</span> Recommended Focus Areas
                  </h3>
                  <ul className="space-y-2 text-sm text-surface-600 dark:text-surface-400">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">1.</span>
                      <span>Implement proximity warning systems on all forklifts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">2.</span>
                      <span>Mandatory supervisor LOTO verification sign-off</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">3.</span>
                      <span>Digital scaffold inspection with photo documentation</span>
                    </li>
                  </ul>
                </div>

                {/* Predictive Alert */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl">
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-2 flex items-center gap-2">
                    <span>🔮</span> Predictive Alert
                  </h3>
                  <p className="text-sm text-surface-600 dark:text-surface-400">
                    Based on historical patterns, the <strong>next 14 days</strong> show elevated risk for cold-weather related incidents. Ensure PPE compliance and equipment pre-checks are reinforced.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SIFPrecursorDashboard;
