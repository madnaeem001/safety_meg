import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Sparkles, TrendingUp, TrendingDown, AlertTriangle, Shield,
  Target, Activity, Zap, BarChart3, PieChart, LineChart, ArrowRight,
  ChevronDown, ChevronUp, RefreshCw, Lightbulb, Clock, CheckCircle2,
  XCircle, HelpCircle, ThumbsUp, ThumbsDown, MessageSquare, Send
} from 'lucide-react';
import { SMButton, SMInput, SMCard, SMBadge } from '../ui';

const MotionSMCard = motion.create(SMCard);

// Types
export interface AIInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'prediction' | 'recommendation' | 'risk';
  title: string;
  description: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'injury' | 'incident' | 'compliance' | 'training' | 'equipment';
  metrics?: { label: string; value: string | number; change?: number }[];
  actionable?: boolean;
  suggestedAction?: string;
  timestamp: Date;
}

export interface AIAnalysisResult {
  summary: string;
  insights: AIInsight[];
  riskScore: number;
  trendDirection: 'improving' | 'stable' | 'declining';
  keyFindings: string[];
  recommendations: string[];
}

// Mock AI Analysis Engine
const generateMockInsights = (): AIInsight[] => [
  {
    id: 'insight-1',
    type: 'trend',
    title: 'Injury Rate Decreasing',
    description: 'TRIR has decreased 23% over the last quarter, indicating effective safety interventions.',
    confidence: 0.92,
    severity: 'low',
    category: 'injury',
    metrics: [
      { label: 'Current TRIR', value: 1.8, change: -23 },
      { label: 'Industry Avg', value: 2.9 },
      { label: 'Target', value: 1.5 }
    ],
    actionable: false,
    timestamp: new Date()
  },
  {
    id: 'insight-2',
    type: 'anomaly',
    title: 'Increased Near Misses in Warehouse B',
    description: 'Near miss reports in Warehouse B are 47% above normal baseline for this period.',
    confidence: 0.88,
    severity: 'high',
    category: 'incident',
    metrics: [
      { label: 'Near Misses', value: 12, change: 47 },
      { label: 'Expected', value: 8 },
      { label: 'Previous Period', value: 7 }
    ],
    actionable: true,
    suggestedAction: 'Conduct focused safety audit of Warehouse B operations',
    timestamp: new Date()
  },
  {
    id: 'insight-3',
    type: 'prediction',
    title: 'Equipment Failure Risk Elevated',
    description: 'Predictive model indicates 78% probability of conveyor system failure within 14 days based on vibration and temperature patterns.',
    confidence: 0.78,
    severity: 'critical',
    category: 'equipment',
    metrics: [
      { label: 'Failure Probability', value: '78%' },
      { label: 'Time Window', value: '14 days' },
      { label: 'Impact Score', value: 'High' }
    ],
    actionable: true,
    suggestedAction: 'Schedule preventive maintenance for Conveyor System C-7',
    timestamp: new Date()
  },
  {
    id: 'insight-4',
    type: 'recommendation',
    title: 'Training Gap Identified',
    description: 'Analysis shows 34% of forklift operators have expired certifications. This correlates with 60% of recent forklift-related incidents.',
    confidence: 0.94,
    severity: 'medium',
    category: 'training',
    metrics: [
      { label: 'Expired Certs', value: '34%' },
      { label: 'Related Incidents', value: '60%' },
      { label: 'At-Risk Staff', value: 17 }
    ],
    actionable: true,
    suggestedAction: 'Schedule immediate refresher training for 17 operators',
    timestamp: new Date()
  },
  {
    id: 'insight-5',
    type: 'risk',
    title: 'Compliance Deadline Approaching',
    description: 'OSHA 300 log deadline is in 15 days. Current completion rate is 67%.',
    confidence: 1.0,
    severity: 'high',
    category: 'compliance',
    metrics: [
      { label: 'Days Remaining', value: 15 },
      { label: 'Completion', value: '67%' },
      { label: 'Missing Items', value: 8 }
    ],
    actionable: true,
    suggestedAction: 'Prioritize completion of 8 pending injury log entries',
    timestamp: new Date()
  }
];

// Severity color mapping
const getSeverityColors = (severity: AIInsight['severity']) => {
  const colors = {
    low:      { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  icon: 'text-green-500',  badgeVariant: 'success' as const },
    medium:   { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: 'text-yellow-500', badgeVariant: 'warning' as const },
    high:     { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: 'text-orange-500', badgeVariant: 'warning' as const },
    critical: { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    icon: 'text-red-500',    badgeVariant: 'danger'  as const }
  };
  return colors[severity];
};

// Type icon mapping
const getTypeIcon = (type: AIInsight['type']) => {
  const icons = {
    trend: TrendingUp,
    anomaly: AlertTriangle,
    prediction: Brain,
    recommendation: Lightbulb,
    risk: Shield
  };
  return icons[type];
};

// AI Chat Component
interface AIChatProps {
  onAnalyze?: (query: string) => void;
}

export const AIChat: React.FC<AIChatProps> = ({ onAnalyze }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    { role: 'ai', content: "Hello! I'm your Safety AI Assistant. Ask me about safety trends, risk analysis, or compliance status." }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit = () => {
    if (!query.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
      const responses: Record<string, string> = {
        default: "Based on my analysis of your safety data, I've identified several key areas for improvement. The most significant finding is a 23% reduction in TRIR over the last quarter, primarily driven by enhanced PPE compliance. However, I'm detecting elevated risk signals in Warehouse B that warrant immediate attention.",
        injury: "Looking at injury data, the most common injury types are lacerations (32%), strains (28%), and contusions (18%). The primary contributing factors include inadequate guarding (45%), rushed work pace (30%), and insufficient training (25%). I recommend prioritizing machine guarding audits and ergonomic assessments.",
        trend: "Safety performance is trending positively overall. Key improvements include: 23% reduction in recordable injuries, 15% increase in near-miss reporting (indicating better safety culture), and 40% faster CAPA closure times. Areas of concern include equipment-related incidents which have increased 12%.",
        compliance: "Current compliance status: OSHA 300 Log is 67% complete with 15 days until deadline. 4 corrective actions are overdue. 17 employees have expired forklift certifications. 2 safety inspections are scheduled but not yet conducted."
      };

      let response = responses.default;
      const lowerQuery = query.toLowerCase();
      if (lowerQuery.includes('injury') || lowerQuery.includes('hurt')) response = responses.injury;
      if (lowerQuery.includes('trend') || lowerQuery.includes('performance')) response = responses.trend;
      if (lowerQuery.includes('compliance') || lowerQuery.includes('osha')) response = responses.compliance;

      setMessages(prev => [...prev, { role: 'ai', content: response }]);
      setIsTyping(false);
    }, 1500);

    setQuery('');
    onAnalyze?.(query);
  };

  return (
    <SMCard className="rounded-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Safety AI Assistant</h3>
            <p className="text-xs text-white/80">Powered by predictive analytics</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-4 space-y-4 bg-surface-50">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`
              max-w-[80%] p-3 rounded-2xl text-sm
              ${msg.role === 'user' 
                ? 'bg-primary-600 text-white rounded-br-md' 
                : 'bg-white border border-surface-200 text-surface-700 rounded-bl-md'}
            `}>
              {msg.content}
            </div>
          </motion.div>
        ))}
        
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-surface-200 p-3 rounded-2xl rounded-bl-md">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-surface-200">
        <div className="flex items-center gap-2">
          <SMInput
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Ask about safety trends, risks, or compliance..."
            className="flex-1"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={!query.trim()}
            className="p-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl 
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
        
        {/* Quick prompts */}
        <div className="flex flex-wrap gap-2 mt-3">
          {['Show injury trends', 'Risk analysis', 'Compliance status'].map(prompt => (
            <SMButton
              key={prompt}
              variant="secondary"
              size="sm"
              onClick={() => setQuery(prompt)}
            >
              {prompt}
            </SMButton>
          ))}
        </div>
      </div>
    </SMCard>
  );
};

// Insight Card Component
interface InsightCardProps {
  insight: AIInsight;
  onAction?: (insight: AIInsight) => void;
  onFeedback?: (insight: AIInsight, helpful: boolean) => void;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight, onAction, onFeedback }) => {
  const [expanded, setExpanded] = useState(false);
  const colors = getSeverityColors(insight.severity);
  const Icon = getTypeIcon(insight.type);

  return (
    <MotionSMCard
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${colors.border} overflow-hidden`}
    >
      <div 
        className={`p-4 cursor-pointer hover:bg-surface-50 transition-colors`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <Icon className={`w-5 h-5 ${colors.icon}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <SMBadge size="sm" variant={colors.badgeVariant}>{insight.severity}</SMBadge>
              <span className="text-xs text-surface-400 capitalize">{insight.type}</span>
              <span className="text-xs text-surface-400">
                • {Math.round(insight.confidence * 100)}% confidence
              </span>
            </div>
            <h4 className="font-semibold text-surface-900">{insight.title}</h4>
            <p className="text-sm text-surface-600 mt-1 line-clamp-2">{insight.description}</p>
          </div>
          
          <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
            <ChevronDown className="w-5 h-5 text-surface-400" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-surface-100 pt-4">
              {/* Metrics */}
              {insight.metrics && insight.metrics.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {insight.metrics.map((metric, i) => (
                    <div key={i} className="bg-surface-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-surface-900">
                        {metric.value}
                        {metric.change !== undefined && (
                          <span className={`text-xs ml-1 ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {metric.change >= 0 ? '+' : ''}{metric.change}%
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-surface-500">{metric.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggested Action */}
              {insight.actionable && insight.suggestedAction && (
                <div className="bg-primary-50 rounded-lg p-3 border border-primary-200">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-primary-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary-900">Suggested Action</p>
                      <p className="text-sm text-primary-700 mt-1">{insight.suggestedAction}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onAction?.(insight)}
                      className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white 
                                 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      Take Action
                      <ArrowRight className="w-3 h-3" />
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Feedback */}
              <div className="flex items-center justify-between pt-2 border-t border-surface-100">
                <span className="text-xs text-surface-400">Was this insight helpful?</span>
                <div className="flex items-center gap-2">
                  <SMButton variant="icon" size="sm" onClick={() => onFeedback?.(insight, true)}>
                    <ThumbsUp className="w-4 h-4" />
                  </SMButton>
                  <SMButton variant="icon" size="sm" onClick={() => onFeedback?.(insight, false)}>
                    <ThumbsDown className="w-4 h-4" />
                  </SMButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionSMCard>
  );
};

// Main AI Analytics Dashboard
interface AIAnalyticsDashboardProps {
  onInsightAction?: (insight: AIInsight) => void;
  compact?: boolean;
}

export const AIAnalyticsDashboard: React.FC<AIAnalyticsDashboardProps> = ({ 
  onInsightAction,
  compact = false
}) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'actionable'>('all');
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);

  useEffect(() => {
    // Simulate loading AI insights
    const timer = setTimeout(() => {
      setInsights(generateMockInsights());
      setAnalysisResult({
        summary: 'Overall safety performance is improving with 23% reduction in TRIR. However, attention needed in Warehouse B and equipment maintenance.',
        insights: generateMockInsights(),
        riskScore: 72,
        trendDirection: 'improving',
        keyFindings: [
          'TRIR decreased 23% this quarter',
          'Near-miss reporting up 15% (positive culture indicator)',
          'Equipment-related incidents increased 12%',
          '34% of forklift operators have expired certifications'
        ],
        recommendations: [
          'Prioritize Warehouse B safety audit',
          'Schedule preventive maintenance for Conveyor C-7',
          'Conduct forklift certification training for 17 operators',
          'Complete OSHA 300 log entries before deadline'
        ]
      });
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const filteredInsights = useMemo(() => {
    if (filter === 'all') return insights;
    if (filter === 'critical') return insights.filter(i => i.severity === 'critical' || i.severity === 'high');
    if (filter === 'actionable') return insights.filter(i => i.actionable);
    return insights;
  }, [insights, filter]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setInsights(generateMockInsights());
      setLoading(false);
    }, 1200);
  };

  if (compact) {
    return (
      <SMCard className="rounded-2xl overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              <span className="font-semibold">AI Insights</span>
            </div>
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {insights.filter(i => i.severity === 'critical' || i.severity === 'high').length} alerts
            </span>
          </div>
        </div>
        
        <div className="divide-y divide-surface-100 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 text-primary-400 mx-auto animate-spin" />
              <p className="text-sm text-surface-500 mt-2">Analyzing data...</p>
            </div>
          ) : (
            insights.slice(0, 3).map(insight => (
              <div 
                key={insight.id}
                className="p-3 hover:bg-surface-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full mt-1.5 ${
                    insight.severity === 'critical' ? 'bg-red-500 animate-pulse' :
                    insight.severity === 'high' ? 'bg-orange-500' :
                    insight.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-surface-900">{insight.title}</p>
                    <p className="text-xs text-surface-500 line-clamp-1">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SMCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Safety Analytics</h2>
              <p className="text-sm text-white/80">Powered by predictive analysis & pattern recognition</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={loading}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>

        {/* Risk Score & Summary */}
        {analysisResult && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4" />
                <span className="text-xs font-medium text-white/80">Risk Score</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{analysisResult.riskScore}</span>
                <span className="text-sm text-white/60 mb-1">/100</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all"
                  style={{ width: `${analysisResult.riskScore}%` }}
                />
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                {analysisResult.trendDirection === 'improving' ? (
                  <TrendingDown className="w-4 h-4 text-green-300" />
                ) : analysisResult.trendDirection === 'declining' ? (
                  <TrendingUp className="w-4 h-4 text-red-300" />
                ) : (
                  <Activity className="w-4 h-4 text-yellow-300" />
                )}
                <span className="text-xs font-medium text-white/80">Trend</span>
              </div>
              <span className="text-xl font-bold capitalize">{analysisResult.trendDirection}</span>
            </div>

            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-medium text-white/80">Active Alerts</span>
              </div>
              <span className="text-3xl font-bold">
                {insights.filter(i => i.severity === 'critical' || i.severity === 'high').length}
              </span>
            </div>

            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-medium text-white/80">Actionable</span>
              </div>
              <span className="text-3xl font-bold">
                {insights.filter(i => i.actionable).length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {[
          { key: 'all', label: 'All Insights' },
          { key: 'critical', label: 'Critical/High' },
          { key: 'actionable', label: 'Actionable' }
        ].map(f => (
          <SMButton
            key={f.key}
            variant={filter === f.key ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter(f.key as any)}
          >
            {f.label}
          </SMButton>
        ))}
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center">
            <RefreshCw className="w-12 h-12 text-primary-400 mx-auto animate-spin" />
            <p className="text-surface-600 font-medium mt-4">Analyzing safety data...</p>
            <p className="text-surface-400 text-sm mt-1">Running predictive models and pattern detection</p>
          </div>
        ) : filteredInsights.length === 0 ? (
          <div className="col-span-full p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto" />
            <p className="text-surface-600 font-medium mt-4">No insights match your filter</p>
          </div>
        ) : (
          filteredInsights.map(insight => (
            <InsightCard 
              key={insight.id} 
              insight={insight}
              onAction={onInsightAction}
            />
          ))
        )}
      </div>

      {/* AI Chat Section */}
      <AIChat />
    </div>
  );
};

export default AIAnalyticsDashboard;
