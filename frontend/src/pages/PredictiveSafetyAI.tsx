import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '../services/aiService';
import {
  usePredictiveStats,
  usePredictivePredictions,
  usePredictiveInsights,
  usePredictiveModelMetrics,
  useUpdatePredictivePrediction,
  useUpdatePredictiveRecommendation,
} from '../api/hooks/useAPIHooks';
import {
  ArrowLeft,
  Brain,
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Zap,
  Eye,
  Clock,
  MapPin,
  Users,
  Calendar,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  BarChart3,
  RefreshCw,
  Settings,
  Bell,
  Lightbulb,
  Gauge,
  ThermometerSun,
  Wind,
  HardHat,
  Wrench,
  FileText,
  ArrowUpRight,
  Sparkles,
  Cpu,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { SMButton } from '../components/ui';

// Types
interface SafetyPrediction {
  id: string;
  type: 'incident' | 'near_miss' | 'hazard' | 'equipment_failure' | 'ergonomic' | 'environmental';
  title: string;
  description: string;
  location: string;
  department: string;
  probability: number; // 0-100
  severity: 'low' | 'medium' | 'high' | 'critical';
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  predictedDate: string;
  confidenceLevel: number;
  riskFactors: RiskFactor[];
  recommendations: Recommendation[];
  status: 'active' | 'mitigated' | 'occurred' | 'dismissed';
  trend: 'increasing' | 'stable' | 'decreasing';
  historicalIncidents: number;
  lastUpdated: string;
}

interface RiskFactor {
  id: string;
  factor: string;
  weight: number;
  category: 'behavioral' | 'environmental' | 'equipment' | 'procedural' | 'human_factors';
  dataSource: string;
  currentValue: number;
  threshold: number;
}

interface Recommendation {
  id: string;
  action: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  expectedImpact: number; // % reduction
  cost: 'low' | 'medium' | 'high';
  implementationTime: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string;
}

interface AIInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'correlation' | 'forecast' | 'benchmark';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  relatedPredictions: string[];
  generatedAt: string;
}

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrainedDate: string;
  dataPoints: number;
  predictionsMade: number;
  successfulPredictions: number;
}

// Mock Data removed — data now served from backend via usePredictivePredictions()

const RiskDigester: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [riskData, setRiskData] = useState<any>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const forecast = await aiService.generateRiskForecast({});
      setRiskData(forecast);
    } catch (error) {
      console.error('Forecast Error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-surface-raised border border-surface-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-text-primary font-bold">AI Risk Digester</h3>
            <p className="text-xs text-text-muted">Analyze cross-platform data for hidden risk patterns</p>
          </div>
        </div>
        <button 
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="px-4 py-2 bg-accent hover:bg-accent/80 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
        >
          {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isAnalyzing ? 'Analyzing...' : 'Run Deep Analysis'}
        </button>
      </div>

      {riskData ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-surface-sunken rounded-xl p-4 border border-surface-border">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Overall Risk Level</span>
              <div className="text-2xl font-black text-red-500 mt-1">{riskData.overallRisk}</div>
              <div className="mt-4 h-24 flex items-end gap-1">
                {riskData.trendData?.map((d: any, i: number) => (
                  <div key={i} className="flex-1 bg-accent/20 rounded-t-sm relative group">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-accent rounded-t-sm transition-all" 
                      style={{ height: `${d.riskLevel}%` }} 
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-raised text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {d.riskLevel}%
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1 text-[8px] text-text-muted uppercase font-bold">
                <span>7d ago</span>
                <span>Today</span>
              </div>
            </div>
            <div className="sm:col-span-2 bg-surface-sunken rounded-xl p-4 border border-surface-border">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Top Predicted Threats</span>
              <div className="mt-2 space-y-2">
                {riskData.topThreats?.map((t: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{t.threat}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted">{t.probability}% prob.</span>
                      <span className={`font-bold ${t.impact === 'Critical' ? 'text-red-500' : 'text-orange-500'}`}>{t.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
            <h4 className="text-xs font-bold text-accent mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Smart Recommendations
            </h4>
            <ul className="space-y-2">
              {riskData.recommendations?.map((r: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      ) : (
        <div className="h-48 flex flex-col items-center justify-center text-center border-2 border-dashed border-surface-border rounded-xl">
          <Activity className="w-8 h-8 text-text-muted mb-2" />
          <p className="text-sm text-text-muted">Click the button above to start AI risk analysis</p>
        </div>
      )}
    </div>
  );
};

export const PredictiveSafetyAI: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPrediction, setSelectedPrediction] = useState<SafetyPrediction | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [memoryUsage, setMemoryUsage] = useState(42);

  // Backend data
  const { data: statsData, refetch: refetchStats }           = usePredictiveStats();
  const { data: predictionsData, refetch: refetchPredictions } = usePredictivePredictions();
  const { data: insightsData }                                = usePredictiveInsights();
  const { data: metricsData }                                 = usePredictiveModelMetrics();
  const { mutate: updatePrediction }                         = useUpdatePredictivePrediction();
  const { mutate: updateRecommendation }                     = useUpdatePredictiveRecommendation();

  const stats       = statsData   ?? null;
  const predictions = predictionsData ?? [];
  const insights    = insightsData    ?? [];
  const metrics     = metricsData     ?? null;

  // Client-side type filter ('all' | 'incident' | 'equipment')
  const filteredPredictions = useMemo(() => {
    if (filter === 'all') return predictions;
    if (filter === 'equipment') return predictions.filter((p) => p.type === 'equipment_failure');
    return predictions.filter((p) => p.type === filter);
  }, [predictions, filter]) as SafetyPrediction[];

  const handleDismiss = useCallback(async () => {
    if (!selectedPrediction) return;
    await updatePrediction({ id: selectedPrediction.id, data: { status: 'dismissed' } });
    setSelectedPrediction(null);
    refetchPredictions();
    refetchStats();
  }, [selectedPrediction, updatePrediction, refetchPredictions, refetchStats]);

  const handleAssign = useCallback(async (recId: string) => {
    if (!selectedPrediction) return;
    const updated = await updateRecommendation(
      { predId: selectedPrediction.id, recId, data: { status: 'in_progress', assignedTo: 'Safety Team' } }
    );
    if (updated) setSelectedPrediction(updated as unknown as SafetyPrediction);
    refetchPredictions();
  }, [selectedPrediction, updateRecommendation, refetchPredictions]);

  // Simulate AI Memory Management
  useEffect(() => {
    const interval = setInterval(() => {
      setMemoryUsage(prev => {
        const change = Math.random() * 4 - 2;
        return Math.max(30, Math.min(95, prev + change));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ai-purple-theme page-wrapper">
      {/* Header */}
      <header className="sticky top-[72px] z-30 bg-surface-overlay/80 backdrop-blur-xl border-b border-surface-border">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-xl hover:bg-surface-raised text-text-muted hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="SafetyMEG" className="w-8 h-8 object-contain" />
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h1 className="page-title">Predictive Safety AI</h1>
                  <p className="text-xs text-text-muted">Advanced Risk Forecasting & Prevention</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-surface-sunken rounded-xl border border-surface-border">
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">AI RAM</span>
                </div>
                <div className="w-24 h-1.5 bg-surface-raised rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: `${memoryUsage}%` }}
                    className={`h-full ${memoryUsage > 85 ? 'bg-danger' : memoryUsage > 70 ? 'bg-warning' : 'bg-accent'}`}
                  />
                </div>
                <span className="text-[10px] font-bold text-text-muted w-8">{Math.round(memoryUsage)}%</span>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/20 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-bold text-success">Model Active</span>
              </div>
              <button className="p-2 rounded-xl hover:bg-surface-raised text-text-muted">
                <RefreshCw className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-xl hover:bg-surface-raised text-text-muted">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* AI Risk Digester Section */}
        <RiskDigester />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Model Accuracy',   value: stats ? `${stats.modelAccuracy}%`                     : '—', icon: Target,        color: 'text-accent' },
            { label: 'Predictions Made', value: stats ? stats.predictionsMade.toLocaleString()         : '—', icon: Activity,       color: 'text-blue-400' },
            { label: 'Risks Mitigated',  value: stats ? stats.risksMitigated.toLocaleString()          : '—', icon: Shield,         color: 'text-success' },
            { label: 'Active Alerts',    value: stats ? String(stats.activeAlerts)                     : '—', icon: AlertTriangle,  color: 'text-warning' },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface-raised border border-surface-border rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs font-medium text-text-muted">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Predictions List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                Active Predictions
              </h2>
              <div className="flex gap-2">
                {['all', 'incident', 'equipment'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      filter === f ? 'bg-accent text-white' : 'bg-surface-raised text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {filteredPredictions.map((pred) => (
                <motion.div
                  key={pred.id}
                  layoutId={pred.id}
                  onClick={() => setSelectedPrediction(pred)}
                  className={`bg-surface-raised border border-surface-border rounded-2xl p-5 cursor-pointer hover:border-accent/30 transition-all ${
                    selectedPrediction?.id === pred.id ? 'ring-2 ring-accent/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        pred.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {pred.type === 'incident' ? <AlertTriangle className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{pred.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          <MapPin className="w-3 h-3" /> {pred.location}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-black ${
                        pred.probability > 70 ? 'text-red-500' : 'text-amber-500'
                      }`}>
                        {pred.probability}%
                      </div>
                      <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Probability</div>
                    </div>
                  </div>

                  <p className="text-sm text-text-secondary mb-4 line-clamp-2">{pred.description}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-surface-border">
                    <div className="flex gap-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-text-muted" />
                        <span className="text-xs text-text-muted">{pred.timeframe}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-text-muted" />
                        <span className="text-xs text-text-muted">{pred.confidenceLevel}% confidence</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-accent text-xs font-bold">
                      View Details <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Insights & Metrics */}
          <div className="space-y-6">
            <div className="bg-surface-raised border border-surface-border rounded-2xl p-6">
              <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                AI Insights
              </h2>
              <div className="space-y-4">
                {insights.map((insight, i) => (
                  <div key={insight.id ?? i} className="p-3 rounded-xl bg-surface-sunken border border-surface-border">
                    <h4 className="text-sm font-bold text-text-primary mb-1">{insight.title}</h4>
                    <p className="text-xs text-text-muted leading-relaxed">{insight.description}</p>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 bg-surface-sunken hover:bg-surface-overlay text-text-primary text-xs font-bold rounded-lg transition-colors">
                View All Insights
              </button>
            </div>

            <div className="bg-surface-raised border border-surface-border rounded-2xl p-6">
              <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-accent" />
                Model Performance
              </h2>
              <div className="space-y-4">
                {[
                  { label: 'Precision', value: metrics?.precision ?? 0 },
                  { label: 'Recall',    value: metrics?.recall    ?? 0 },
                  { label: 'F1 Score',  value: metrics?.f1Score   ?? 0 },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-text-muted">{m.label}</span>
                      <span className="text-text-primary font-bold">{m.value}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${m.value}%` }}
                        className="h-full bg-accent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Prediction Detail Modal */}
      <AnimatePresence>
        {selectedPrediction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPrediction(null)}
              className="absolute inset-0 bg-surface-base/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-surface-overlay border border-surface-border rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-surface-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedPrediction.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">{selectedPrediction.title}</h2>
                    <p className="text-xs text-text-muted">Prediction ID: {selectedPrediction.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPrediction(null)}
                  className="p-2 hover:bg-surface-raised rounded-xl text-text-muted transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-surface-raised rounded-2xl p-4 border border-surface-border">
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Probability</div>
                    <div className="text-3xl font-black text-text-primary">{selectedPrediction.probability}%</div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-red-400">
                      <TrendingUp className="w-3 h-3" /> +5% from yesterday
                    </div>
                  </div>
                  <div className="bg-surface-raised rounded-2xl p-4 border border-surface-border">
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Severity</div>
                    <div className={`text-3xl font-black uppercase ${
                      selectedPrediction.severity === 'critical' ? 'text-red-500' : 'text-amber-500'
                    }`}>{selectedPrediction.severity}</div>
                  </div>
                  <div className="bg-surface-raised rounded-2xl p-4 border border-surface-border">
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Confidence</div>
                    <div className="text-3xl font-black text-accent">{selectedPrediction.confidenceLevel}%</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-text-primary">Risk Factors</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {selectedPrediction.riskFactors.map((factor) => (
                      <div key={factor.id} className="p-4 rounded-xl bg-surface-raised border border-surface-border">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-bold text-text-primary">{factor.factor}</span>
                          <span className="text-[10px] font-bold text-text-muted uppercase bg-surface-sunken px-2 py-0.5 rounded-full">
                            {factor.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex-1">
                            <div className="h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-accent" 
                                style={{ width: `${(factor.currentValue / factor.threshold) * 100}%` }} 
                              />
                            </div>
                          </div>
                          <span className="text-xs font-mono text-text-muted">
                            {factor.currentValue}/{factor.threshold}
                          </span>
                        </div>
                        <div className="text-[10px] text-text-muted mt-2">Source: {factor.dataSource}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-text-primary">AI Recommendations</h3>
                  <div className="space-y-3">
                    {selectedPrediction.recommendations.map((rec) => (
                      <div key={rec.id} className="flex items-center gap-4 p-4 rounded-xl bg-accent/5 border border-accent/20">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          rec.priority === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-accent/20 text-accent'
                        }`}>
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-text-primary">{rec.action}</span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              rec.priority === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-surface-raised text-text-muted'
                            }`}>
                              {rec.priority}
                            </span>
                          </div>
                          <div className="flex gap-4 text-[10px] text-text-muted">
                            <span>Impact: +{rec.expectedImpact}% safety</span>
                            <span>Cost: {rec.cost}</span>
                            <span>Time: {rec.implementationTime}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAssign(rec.id)}
                          className="px-4 py-2 bg-accent hover:bg-accent/80 text-white text-xs font-bold rounded-lg transition-colors">
                          Assign
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-surface-border bg-surface-overlay/50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 text-text-muted hover:text-text-primary text-sm font-medium">
                    <ThumbsUp className="w-4 h-4" /> Helpful
                  </button>
                  <button className="flex items-center gap-2 text-text-muted hover:text-text-primary text-sm font-medium">
                    <ThumbsDown className="w-4 h-4" /> Not Accurate
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleDismiss}
                    className="px-6 py-2 bg-surface-raised hover:bg-surface-overlay text-text-primary text-sm font-bold rounded-xl transition-colors">
                    Dismiss
                  </button>
                   <SMButton variant="primary" size="sm">Create Action Plan</SMButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PredictiveSafetyAI;
