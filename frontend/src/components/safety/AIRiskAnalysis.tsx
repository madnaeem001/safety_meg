import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Shield, BarChart3, ArrowRight, Eye, RefreshCw, Sparkles, Target, Clock, CheckCircle2, XCircle, Zap, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, Area, AreaChart } from 'recharts';

interface RiskPrediction {
  id: string;
  category: string;
  prediction: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  timeline: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  factors: string[];
  recommendations: string[];
}

interface TrendData {
  month: string;
  incidents: number;
  nearMisses: number;
  hazards: number;
  predicted: number;
}

const PREDICTIONS: RiskPrediction[] = [
  {
    id: 'P-001',
    category: 'Safety Inspections',
    prediction: 'High probability of missed inspections in Warehouse B next week',
    confidence: 87,
    impact: 'high',
    timeline: 'Next 7 days',
    trend: 'increasing',
    factors: [
      'Staff shortage on night shift',
      '3 consecutive missed weekly audits',
      'Upcoming production deadline',
    ],
    recommendations: [
      'Assign backup inspector for Warehouse B',
      'Enable automated inspection reminders',
      'Schedule critical inspections for day shift',
    ],
  },
  {
    id: 'P-002',
    category: 'Slip & Fall Hazards',
    prediction: 'Elevated risk of slip incidents in production areas',
    confidence: 92,
    impact: 'medium',
    timeline: 'Next 14 days',
    trend: 'increasing',
    factors: [
      'Seasonal weather patterns (rain)',
      'Recent maintenance work creating wet surfaces',
      'Historical data shows 40% increase in wet conditions',
    ],
    recommendations: [
      'Increase floor mat coverage at entrances',
      'Deploy additional "Wet Floor" signage',
      'Schedule extra cleaning shifts',
    ],
  },
  {
    id: 'P-003',
    category: 'Equipment Failure',
    prediction: 'Forklift FL-103 showing early signs of hydraulic issues',
    confidence: 78,
    impact: 'critical',
    timeline: 'Next 30 days',
    trend: 'increasing',
    factors: [
      'Sensor data showing pressure fluctuations',
      'Operating 15% over recommended hours',
      'Minor leaks reported in last 2 inspections',
    ],
    recommendations: [
      'Schedule immediate hydraulic system inspection',
      'Reduce operating hours until inspection',
      'Prepare backup equipment assignment',
    ],
  },
  {
    id: 'P-004',
    category: 'Training Compliance',
    prediction: '12 employees at risk of expired certifications',
    confidence: 95,
    impact: 'medium',
    timeline: 'Next 60 days',
    trend: 'stable',
    factors: [
      'Certifications expiring in Q1 2026',
      'Limited training slots available',
      'New regulatory requirements effective April',
    ],
    recommendations: [
      'Schedule refresher training sessions',
      'Prioritize high-risk role certifications',
      'Book external training resources',
    ],
  },
];

const TREND_DATA: TrendData[] = [
  { month: 'Sep', incidents: 12, nearMisses: 28, hazards: 45, predicted: 14 },
  { month: 'Oct', incidents: 10, nearMisses: 32, hazards: 52, predicted: 11 },
  { month: 'Nov', incidents: 8, nearMisses: 25, hazards: 38, predicted: 9 },
  { month: 'Dec', incidents: 11, nearMisses: 30, hazards: 48, predicted: 10 },
  { month: 'Jan', incidents: 9, nearMisses: 27, hazards: 42, predicted: 8 },
  { month: 'Feb', incidents: 0, nearMisses: 0, hazards: 0, predicted: 7 },
  { month: 'Mar', incidents: 0, nearMisses: 0, hazards: 0, predicted: 6 },
];

const CATEGORY_DATA = [
  { name: 'Slips & Falls', value: 28, color: '#3B82F6' },
  { name: 'Equipment', value: 22, color: '#10B981' },
  { name: 'Ergonomic', value: 18, color: '#F59E0B' },
  { name: 'Chemical', value: 15, color: '#EF4444' },
  { name: 'Other', value: 17, color: '#8B5CF6' },
];

const IMPACT_CONFIG = {
  low: { color: 'bg-green-100 text-green-700 border-green-200', badge: 'bg-green-500' },
  medium: { color: 'bg-amber-100 text-amber-700 border-amber-200', badge: 'bg-amber-500' },
  high: { color: 'bg-orange-100 text-orange-700 border-orange-200', badge: 'bg-orange-500' },
  critical: { color: 'bg-red-100 text-red-700 border-red-200', badge: 'bg-red-500' },
};

export const AIRiskAnalysis: React.FC = () => {
  const [selectedPrediction, setSelectedPrediction] = useState<RiskPrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<'predictions' | 'trends' | 'insights'>('predictions');

  const handleRefreshAnalysis = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setIsAnalyzing(false);
  };

  const stats = {
    totalPredictions: PREDICTIONS.length,
    criticalAlerts: PREDICTIONS.filter(p => p.impact === 'critical').length,
    avgConfidence: Math.round(PREDICTIONS.reduce((acc, p) => acc + p.confidence, 0) / PREDICTIONS.length),
    trendsAnalyzed: 6,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary">AI Risk Analysis</h2>
            <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded-full uppercase">
              Beta
            </span>
          </div>
          <p className="text-text-muted">AI-powered insights to identify trends and predict potential risks before incidents occur</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleRefreshAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-70"
        >
          <RefreshCw className={`w-5 h-5 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Predictions', value: stats.totalPredictions, icon: Target, color: 'purple' },
          { label: 'Critical Alerts', value: stats.criticalAlerts, icon: AlertTriangle, color: 'red' },
          { label: 'Avg Confidence', value: `${stats.avgConfidence}%`, icon: Sparkles, color: 'indigo' },
          { label: 'Trends Analyzed', value: stats.trendsAnalyzed, icon: BarChart3, color: 'blue' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-raised p-4 rounded-2xl shadow-soft border-surface-border"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-${stat.color}-50`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
                <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 bg-surface-sunken p-1 rounded-2xl w-fit">
        {[
          { id: 'predictions', label: 'Risk Predictions', icon: Target },
          { id: 'trends', label: 'Trend Analysis', icon: TrendingUp },
          { id: 'insights', label: 'AI Insights', icon: Sparkles },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === tab.id
                ? 'bg-surface-raised text-accent'
                : 'text-text-muted hover:text-accent'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Predictions View */}
      {viewMode === 'predictions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {PREDICTIONS.map((prediction) => (
            <motion.div
              key={prediction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedPrediction(prediction)}
              className="bg-surface-raised p-5 rounded-2xl shadow-soft border-surface-border cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${IMPACT_CONFIG[prediction.impact].color}`}>
                    {prediction.impact.toUpperCase()} IMPACT
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-lg flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {prediction.confidence}% Confidence
                  </span>
                </div>
                {prediction.trend === 'increasing' ? (
                  <TrendingUp className="w-5 h-5 text-red-500" />
                ) : prediction.trend === 'decreasing' ? (
                  <TrendingDown className="w-5 h-5 text-green-500" />
                ) : (
                  <ArrowRight className="w-5 h-5 text-text-muted" />
                )}
              </div>
              
              <h3 className="font-semibold text-text-primary mb-1">{prediction.category}</h3>
              <p className="text-sm text-text-secondary mb-3">{prediction.prediction}</p>
              
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {prediction.timeline}
                </span>
                <button className="text-accent font-medium flex items-center gap-1 hover:text-accent">
                  View Details <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Trends View */}
      {viewMode === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface-raised p-6 rounded-2xl shadow-soft border-surface-border">
            <h3 className="font-semibold text-text-primary mb-4">Incident Trends with AI Predictions</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TREND_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="incidents" stackId="1" stroke="#EF4444" fill="#FEE2E2" name="Incidents" />
                  <Area type="monotone" dataKey="nearMisses" stackId="2" stroke="#F59E0B" fill="#FEF3C7" name="Near Misses" />
                  <Line type="monotone" dataKey="predicted" stroke="#8B5CF6" strokeDasharray="5 5" strokeWidth={2} name="AI Prediction" dot={{ fill: '#8B5CF6' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-surface-raised p-6 rounded-2xl shadow-soft border-surface-border">
            <h3 className="font-semibold text-text-primary mb-4">Risk Categories Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CATEGORY_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {CATEGORY_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Insights View */}
      {viewMode === 'insights' && (
        <div className="space-y-4">
          <div className="bg-surface-raised p-6 rounded-2xl border-surface-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-purple-500">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">AI Analysis Summary</h3>
                <p className="text-sm text-text-secondary">Based on 6 months of data across 1,247 records</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Key Finding',
                  content: 'Slip & fall incidents increase 40% during wet weather periods. Consider enhanced preventive measures in Q1.',
                  icon: Zap,
                  color: 'amber',
                },
                {
                  title: 'Positive Trend',
                  content: 'Equipment-related incidents decreased 23% following the new inspection protocol implementation.',
                  icon: CheckCircle2,
                  color: 'emerald',
                },
                {
                  title: 'Area of Concern',
                  content: 'Training compliance dropping in night shift. 15% of certifications expiring within 60 days.',
                  icon: AlertTriangle,
                  color: 'red',
                },
              ].map((insight, idx) => (
                <div key={idx} className="bg-surface-sunken p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg bg-${insight.color}-100`}>
                      <insight.icon className={`w-4 h-4 text-${insight.color}-600`} />
                    </div>
                    <span className="font-medium text-text-primary">{insight.title}</span>
                  </div>
                  <p className="text-sm text-text-secondary">{insight.content}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-surface-raised p-6 rounded-2xl shadow-soft border-surface-border">
            <h3 className="font-semibold text-text-primary mb-4">Recommended Actions</h3>
            <div className="space-y-3">
              {[
                { action: 'Schedule hydraulic inspection for Forklift FL-103', priority: 'critical', deadline: 'Within 7 days' },
                { action: 'Increase floor mat coverage at all building entrances', priority: 'high', deadline: 'Within 14 days' },
                { action: 'Book refresher training for 12 employees with expiring certifications', priority: 'medium', deadline: 'Within 30 days' },
                { action: 'Review and update night shift inspection schedule', priority: 'medium', deadline: 'Within 14 days' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-surface-sunken rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${IMPACT_CONFIG[item.priority as keyof typeof IMPACT_CONFIG].badge}`} />
                    <span className="text-text-primary">{item.action}</span>
                  </div>
                  <span className="text-xs text-text-muted bg-surface-raised px-3 py-1 rounded-lg">{item.deadline}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Prediction Detail Modal */}
      <AnimatePresence>
        {selectedPrediction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPrediction(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-overlay rounded-3xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${IMPACT_CONFIG[selectedPrediction.impact].color}`}>
                    {selectedPrediction.impact.toUpperCase()} IMPACT
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-lg">
                    {selectedPrediction.confidence}% Confidence
                  </span>
                </div>
                <button
                  onClick={() => setSelectedPrediction(null)}
                  className="p-2 rounded-xl hover:bg-surface-sunken transition-colors"
                >
                  <XCircle className="w-5 h-5 text-text-muted" />
                </button>
              </div>
              
              <h2 className="text-xl font-bold text-text-primary mb-2">{selectedPrediction.category}</h2>
              <p className="text-text-secondary mb-4">{selectedPrediction.prediction}</p>
              
              <div className="flex items-center gap-4 mb-6 text-sm">
                <span className="flex items-center gap-1 text-text-muted">
                  <Clock className="w-4 h-4" />
                  {selectedPrediction.timeline}
                </span>
                <span className="flex items-center gap-1 text-text-muted">
                  {selectedPrediction.trend === 'increasing' ? (
                    <><TrendingUp className="w-4 h-4 text-red-500" /> Risk Increasing</>
                  ) : selectedPrediction.trend === 'decreasing' ? (
                    <><TrendingDown className="w-4 h-4 text-green-500" /> Risk Decreasing</>
                  ) : (
                    <><ArrowRight className="w-4 h-4" /> Stable</>
                  )}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text-primary mb-2">Contributing Factors</h3>
                  <div className="space-y-2">
                    {selectedPrediction.factors.map((factor, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-red-50 rounded-xl text-sm">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                        <span className="text-red-800">{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-text-primary mb-2">AI Recommendations</h3>
                  <div className="space-y-2">
                    {selectedPrediction.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-emerald-50 rounded-xl text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                        <span className="text-emerald-800">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setSelectedPrediction(null)}
                  className="flex-1 py-3 border-surface-border text-text-secondary font-medium rounded-xl hover:bg-surface-sunken transition-all"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => setSelectedPrediction(null)}
                  className="flex-1 py-3 bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all"
                >
                  Create Action Item
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIRiskAnalysis;
