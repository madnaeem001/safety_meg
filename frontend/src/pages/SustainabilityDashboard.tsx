import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Leaf,
  Factory,
  Droplets,
  Recycle,
  Wind,
  Sun,
  TrendingDown,
  TrendingUp,
  Target,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Globe,
  Zap,
  Fuel,
  Truck,
  Building2,
  Award,
  FileText,
  Share2,
  Settings,
  Info
} from 'lucide-react';

// Types
interface EmissionData {
  scope: 'scope1' | 'scope2' | 'scope3';
  category: string;
  value: number;
  unit: string;
  trend: number;
  target: number;
  source: string;
}

interface SustainabilityGoal {
  id: string;
  title: string;
  description: string;
  category: 'emissions' | 'energy' | 'water' | 'waste' | 'social';
  currentValue: number;
  targetValue: number;
  baselineValue: number;
  unit: string;
  deadline: string;
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved';
  initiatives: string[];
}

interface ESGMetric {
  id: string;
  name: string;
  category: 'environmental' | 'social' | 'governance';
  score: number;
  maxScore: number;
  trend: 'up' | 'down' | 'stable';
  details: string;
}

interface CarbonProject {
  id: string;
  name: string;
  type: 'reduction' | 'offset' | 'renewable';
  status: 'planned' | 'in_progress' | 'completed';
  co2Impact: number;
  investmentCost: number;
  annualSavings: number;
  startDate: string;
  completionDate: string;
}

// Mock Data
const emissionsData: EmissionData[] = [
  { scope: 'scope1', category: 'Stationary Combustion', value: 1250, unit: 'tCO2e', trend: -8.5, target: 1100, source: 'Natural Gas Boilers' },
  { scope: 'scope1', category: 'Mobile Combustion', value: 890, unit: 'tCO2e', trend: -12.3, target: 800, source: 'Fleet Vehicles' },
  { scope: 'scope1', category: 'Fugitive Emissions', value: 145, unit: 'tCO2e', trend: -5.2, target: 130, source: 'Refrigerants' },
  { scope: 'scope2', category: 'Purchased Electricity', value: 2340, unit: 'tCO2e', trend: -15.8, target: 2000, source: 'Grid Electricity' },
  { scope: 'scope2', category: 'Purchased Steam', value: 180, unit: 'tCO2e', trend: -3.1, target: 160, source: 'District Heating' },
  { scope: 'scope3', category: 'Business Travel', value: 420, unit: 'tCO2e', trend: -22.5, target: 350, source: 'Air & Ground Travel' },
  { scope: 'scope3', category: 'Employee Commuting', value: 680, unit: 'tCO2e', trend: -10.2, target: 600, source: 'Daily Commutes' },
  { scope: 'scope3', category: 'Purchased Goods', value: 1850, unit: 'tCO2e', trend: -4.8, target: 1700, source: 'Supply Chain' },
  { scope: 'scope3', category: 'Waste Generated', value: 95, unit: 'tCO2e', trend: -18.5, target: 80, source: 'Landfill & Recycling' }
];

const sustainabilityGoals: SustainabilityGoal[] = [
  {
    id: 'GOAL-001',
    title: 'Carbon Neutrality',
    description: 'Achieve net-zero carbon emissions across all operations',
    category: 'emissions',
    currentValue: 7850,
    targetValue: 0,
    baselineValue: 12500,
    unit: 'tCO2e',
    deadline: '2030-12-31',
    status: 'on_track',
    initiatives: ['Solar installation', 'EV fleet transition', 'Energy efficiency upgrades']
  },
  {
    id: 'GOAL-002',
    title: '100% Renewable Energy',
    description: 'Power all facilities with renewable energy sources',
    category: 'energy',
    currentValue: 68,
    targetValue: 100,
    baselineValue: 25,
    unit: '%',
    deadline: '2028-12-31',
    status: 'on_track',
    initiatives: ['PPA agreements', 'On-site solar', 'Green energy certificates']
  },
  {
    id: 'GOAL-003',
    title: 'Water Reduction',
    description: 'Reduce water consumption by 40% from 2020 baseline',
    category: 'water',
    currentValue: 28,
    targetValue: 40,
    baselineValue: 0,
    unit: '% reduction',
    deadline: '2027-12-31',
    status: 'at_risk',
    initiatives: ['Rainwater harvesting', 'Process optimization', 'Leak detection']
  },
  {
    id: 'GOAL-004',
    title: 'Zero Waste to Landfill',
    description: 'Divert 100% of waste from landfill through recycling and composting',
    category: 'waste',
    currentValue: 92,
    targetValue: 100,
    baselineValue: 65,
    unit: '% diversion',
    deadline: '2026-12-31',
    status: 'on_track',
    initiatives: ['Waste sorting program', 'Composting facility', 'Supplier take-back']
  }
];

const esgMetrics: ESGMetric[] = [
  { id: 'ESG-E1', name: 'GHG Emissions Reduction', category: 'environmental', score: 85, maxScore: 100, trend: 'up', details: '37% reduction since 2020' },
  { id: 'ESG-E2', name: 'Renewable Energy Usage', category: 'environmental', score: 68, maxScore: 100, trend: 'up', details: '68% renewable electricity' },
  { id: 'ESG-E3', name: 'Water Stewardship', category: 'environmental', score: 72, maxScore: 100, trend: 'stable', details: '28% water reduction' },
  { id: 'ESG-E4', name: 'Waste Management', category: 'environmental', score: 92, maxScore: 100, trend: 'up', details: '92% waste diversion rate' },
  { id: 'ESG-S1', name: 'Employee Safety (TRIR)', category: 'social', score: 94, maxScore: 100, trend: 'up', details: 'TRIR: 0.8 (industry avg: 3.2)' },
  { id: 'ESG-S2', name: 'Diversity & Inclusion', category: 'social', score: 78, maxScore: 100, trend: 'up', details: '45% diverse leadership' },
  { id: 'ESG-S3', name: 'Community Investment', category: 'social', score: 82, maxScore: 100, trend: 'stable', details: '$2.5M annual contribution' },
  { id: 'ESG-G1', name: 'Board Independence', category: 'governance', score: 88, maxScore: 100, trend: 'stable', details: '80% independent directors' },
  { id: 'ESG-G2', name: 'Ethics & Compliance', category: 'governance', score: 95, maxScore: 100, trend: 'up', details: '100% ethics training' },
  { id: 'ESG-G3', name: 'Risk Management', category: 'governance', score: 90, maxScore: 100, trend: 'up', details: 'Climate risk integrated' }
];

const carbonProjects: CarbonProject[] = [
  {
    id: 'CP-001',
    name: 'Rooftop Solar Array - Phase 2',
    type: 'renewable',
    status: 'in_progress',
    co2Impact: 850,
    investmentCost: 1200000,
    annualSavings: 180000,
    startDate: '2025-06-01',
    completionDate: '2026-03-31'
  },
  {
    id: 'CP-002',
    name: 'EV Fleet Transition',
    type: 'reduction',
    status: 'in_progress',
    co2Impact: 420,
    investmentCost: 850000,
    annualSavings: 95000,
    startDate: '2025-01-01',
    completionDate: '2027-12-31'
  },
  {
    id: 'CP-003',
    name: 'LED Lighting Retrofit',
    type: 'reduction',
    status: 'completed',
    co2Impact: 180,
    investmentCost: 120000,
    annualSavings: 45000,
    startDate: '2024-06-01',
    completionDate: '2025-02-28'
  },
  {
    id: 'CP-004',
    name: 'Forest Conservation Credits',
    type: 'offset',
    status: 'completed',
    co2Impact: 1500,
    investmentCost: 75000,
    annualSavings: 0,
    startDate: '2025-01-01',
    completionDate: '2025-12-31'
  },
  {
    id: 'CP-005',
    name: 'Heat Recovery System',
    type: 'reduction',
    status: 'planned',
    co2Impact: 320,
    investmentCost: 280000,
    annualSavings: 62000,
    startDate: '2026-04-01',
    completionDate: '2026-10-31'
  }
];

// Scope Colors
const scopeColors = {
  scope1: { bg: 'bg-orange-100', text: 'text-orange-700', fill: '#f97316', label: 'Scope 1 (Direct)' },
  scope2: { bg: 'bg-blue-100', text: 'text-blue-700', fill: '#3b82f6', label: 'Scope 2 (Indirect - Energy)' },
  scope3: { bg: 'bg-purple-100', text: 'text-purple-700', fill: '#a855f7', label: 'Scope 3 (Value Chain)' }
};

const statusColors = {
  on_track: { bg: 'bg-green-100', text: 'text-green-700', label: 'On Track' },
  at_risk: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'At Risk' },
  behind: { bg: 'bg-red-100', text: 'text-red-700', label: 'Behind' },
  achieved: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Achieved' }
};

type ViewMode = 'overview' | 'emissions' | 'goals' | 'esg' | 'projects';

export const SustainabilityDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedScope, setSelectedScope] = useState<'all' | 'scope1' | 'scope2' | 'scope3'>('all');
  const [timeRange, setTimeRange] = useState<'ytd' | '1y' | '3y' | '5y'>('ytd');

  // Calculations
  const totalEmissions = useMemo(() => {
    const filtered = selectedScope === 'all' ? emissionsData : emissionsData.filter(e => e.scope === selectedScope);
    return filtered.reduce((sum, e) => sum + e.value, 0);
  }, [selectedScope]);

  const scopeTotals = useMemo(() => ({
    scope1: emissionsData.filter(e => e.scope === 'scope1').reduce((sum, e) => sum + e.value, 0),
    scope2: emissionsData.filter(e => e.scope === 'scope2').reduce((sum, e) => sum + e.value, 0),
    scope3: emissionsData.filter(e => e.scope === 'scope3').reduce((sum, e) => sum + e.value, 0)
  }), []);

  const overallESGScore = useMemo(() => {
    const total = esgMetrics.reduce((sum, m) => sum + m.score, 0);
    return Math.round(total / esgMetrics.length);
  }, []);

  const esgByCategory = useMemo(() => {
    const categories = ['environmental', 'social', 'governance'] as const;
    return categories.map(cat => {
      const metrics = esgMetrics.filter(m => m.category === cat);
      const avg = Math.round(metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length);
      return { category: cat, score: avg, metrics };
    });
  }, []);

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-5 text-white"
        >
          <div className="flex items-center justify-between mb-3">
            <Leaf className="w-8 h-8 opacity-80" />
            <span className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
              <TrendingDown className="w-3 h-3" />
              -12.4%
            </span>
          </div>
          <p className="text-3xl font-bold">{(totalEmissions / 1000).toFixed(1)}k</p>
          <p className="text-sm opacity-80">Total tCO2e</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-surface-800 rounded-xl p-5 shadow-sm border border-surface-200 dark:border-surface-700"
        >
          <div className="flex items-center justify-between mb-3">
            <Sun className="w-8 h-8 text-amber-500" />
            <span className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              +18%
            </span>
          </div>
          <p className="text-3xl font-bold text-surface-900 dark:text-white">68%</p>
          <p className="text-sm text-surface-500">Renewable Energy</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-surface-800 rounded-xl p-5 shadow-sm border border-surface-200 dark:border-surface-700"
        >
          <div className="flex items-center justify-between mb-3">
            <Recycle className="w-8 h-8 text-teal-500" />
            <span className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              +5%
            </span>
          </div>
          <p className="text-3xl font-bold text-surface-900 dark:text-white">92%</p>
          <p className="text-sm text-surface-500">Waste Diversion</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-surface-800 rounded-xl p-5 shadow-sm border border-surface-200 dark:border-surface-700"
        >
          <div className="flex items-center justify-between mb-3">
            <Award className="w-8 h-8 text-indigo-500" />
            <span className="text-sm text-surface-500">ESG</span>
          </div>
          <p className="text-3xl font-bold text-surface-900 dark:text-white">{overallESGScore}</p>
          <p className="text-sm text-surface-500">ESG Score</p>
        </motion.div>
      </div>

      {/* Emissions Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-surface-900 dark:text-white">Emissions by Scope</h3>
            <button 
              onClick={() => setViewMode('emissions')}
              className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View Details <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            {(['scope1', 'scope2', 'scope3'] as const).map((scope) => {
              const total = scopeTotals[scope];
              const percentage = Math.round((total / totalEmissions) * 100);
              const conf = scopeColors[scope];
              
              return (
                <div key={scope}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${conf.bg}`} style={{ backgroundColor: conf.fill }} />
                      <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{conf.label}</span>
                    </div>
                    <span className="text-sm font-medium text-surface-900 dark:text-white">
                      {total.toLocaleString()} tCO2e ({percentage}%)
                    </span>
                  </div>
                  <div className="h-3 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: conf.fill }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pie Chart Visualization */}
          <div className="mt-6 flex justify-center">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  let cumulative = 0;
                  const scopes = ['scope1', 'scope2', 'scope3'] as const;
                  return scopes.map((scope) => {
                    const percentage = (scopeTotals[scope] / totalEmissions) * 100;
                    const dashArray = `${percentage} ${100 - percentage}`;
                    const dashOffset = -cumulative;
                    cumulative += percentage;
                    
                    return (
                      <circle
                        key={scope}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={scopeColors[scope].fill}
                        strokeWidth="20"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        className="transition-all duration-500"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-surface-900 dark:text-white">{(totalEmissions / 1000).toFixed(1)}k</p>
                <p className="text-xs text-surface-500">tCO2e</p>
              </div>
            </div>
          </div>
        </div>

        {/* Goals Progress */}
        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-surface-900 dark:text-white">Sustainability Goals</h3>
            <button 
              onClick={() => setViewMode('goals')}
              className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            {sustainabilityGoals.slice(0, 4).map((goal) => {
              const progress = goal.category === 'emissions' 
                ? Math.round(((goal.baselineValue - goal.currentValue) / (goal.baselineValue - goal.targetValue)) * 100)
                : Math.round((goal.currentValue / goal.targetValue) * 100);
              const statConf = statusColors[goal.status];
              
              return (
                <div key={goal.id} className="p-4 bg-surface-50 dark:bg-surface-700 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-surface-900 dark:text-white text-sm">{goal.title}</h4>
                      <p className="text-xs text-surface-500">{goal.deadline}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${statConf.bg} ${statConf.text}`}>
                      {statConf.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        className={`h-full rounded-full ${
                          goal.status === 'on_track' || goal.status === 'achieved' ? 'bg-green-500' :
                          goal.status === 'at_risk' ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                      />
                    </div>
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300 w-12 text-right">
                      {progress}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ESG Summary */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-surface-900 dark:text-white">ESG Performance</h3>
          <button 
            onClick={() => setViewMode('esg')}
            className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            View Details <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {esgByCategory.map(({ category, score }) => {
            const icon = category === 'environmental' ? Leaf : category === 'social' ? Globe : Building2;
            const Icon = icon;
            const color = category === 'environmental' ? 'emerald' : category === 'social' ? 'blue' : 'purple';
            
            return (
              <div key={category} className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-3">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={`var(--${color}-500, #10b981)`}
                      strokeWidth="8"
                      strokeDasharray={`${score * 2.51} 251`}
                      strokeLinecap="round"
                      className={`text-${color}-500`}
                      style={{ stroke: color === 'emerald' ? '#10b981' : color === 'blue' ? '#3b82f6' : '#a855f7' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className={`w-8 h-8 ${
                      color === 'emerald' ? 'text-emerald-500' : 
                      color === 'blue' ? 'text-blue-500' : 'text-purple-500'
                    }`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-surface-900 dark:text-white">{score}</p>
                <p className="text-sm text-surface-500 capitalize">{category}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Carbon Projects */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-surface-900 dark:text-white">Carbon Reduction Projects</h3>
          <button 
            onClick={() => setViewMode('projects')}
            className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {carbonProjects.slice(0, 3).map((project) => {
            const typeIcon = project.type === 'renewable' ? Sun : project.type === 'offset' ? Leaf : Zap;
            const TypeIcon = typeIcon;
            
            return (
              <div key={project.id} className="p-4 bg-surface-50 dark:bg-surface-700 rounded-xl">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    project.type === 'renewable' ? 'bg-amber-100 dark:bg-amber-900/30' :
                    project.type === 'offset' ? 'bg-green-100 dark:bg-green-900/30' :
                    'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <TypeIcon className={`w-5 h-5 ${
                      project.type === 'renewable' ? 'text-amber-600' :
                      project.type === 'offset' ? 'text-green-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-surface-900 dark:text-white text-sm">{project.name}</h4>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1 ${
                      project.status === 'completed' ? 'bg-green-100 text-green-700' :
                      project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {project.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                      {project.status === 'in_progress' && <Clock className="w-3 h-3" />}
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-surface-500">CO2 Impact</span>
                  <span className="font-medium text-green-600">-{project.co2Impact} tCO2e/yr</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderEmissions = () => (
    <div className="space-y-6">
      {/* Scope Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'scope1', 'scope2', 'scope3'] as const).map((scope) => (
          <button
            key={scope}
            onClick={() => setSelectedScope(scope)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              selectedScope === scope
                ? 'bg-brand-500 text-white'
                : 'bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-700 hover:bg-surface-50'
            }`}
          >
            {scope === 'all' ? 'All Scopes' : scopeColors[scope].label}
          </button>
        ))}
      </div>

      {/* Emissions Table */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <h3 className="font-semibold text-surface-900 dark:text-white">Emissions Inventory</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50 dark:bg-surface-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase">Scope</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase">Source</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-surface-500 uppercase">Emissions</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-surface-500 uppercase">Target</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-surface-500 uppercase">Trend</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-surface-500 uppercase">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
              {(selectedScope === 'all' ? emissionsData : emissionsData.filter(e => e.scope === selectedScope))
                .map((emission, idx) => {
                  const conf = scopeColors[emission.scope];
                  const progress = Math.round((emission.value / emission.target) * 100);
                  
                  return (
                    <tr key={idx} className="hover:bg-surface-50 dark:hover:bg-surface-700/50">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${conf.bg} ${conf.text}`}>
                          {emission.scope.replace('scope', 'Scope ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-900 dark:text-white font-medium">
                        {emission.category}
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-500">{emission.source}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-surface-900 dark:text-white">
                        {emission.value.toLocaleString()} {emission.unit}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-surface-500">
                        {emission.target.toLocaleString()} {emission.unit}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center gap-1 text-sm ${
                          emission.trend < 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {emission.trend < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                          {Math.abs(emission.trend)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-full h-2 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${progress <= 100 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-6">
      {sustainabilityGoals.map((goal) => {
        const progress = goal.category === 'emissions'
          ? Math.round(((goal.baselineValue - goal.currentValue) / (goal.baselineValue - goal.targetValue)) * 100)
          : Math.round((goal.currentValue / goal.targetValue) * 100);
        const statConf = statusColors[goal.status];
        const catIcon = goal.category === 'emissions' ? Factory : goal.category === 'energy' ? Zap : goal.category === 'water' ? Droplets : Recycle;
        const CatIcon = catIcon;
        
        return (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6"
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${
                goal.category === 'emissions' ? 'bg-orange-100 dark:bg-orange-900/30' :
                goal.category === 'energy' ? 'bg-amber-100 dark:bg-amber-900/30' :
                goal.category === 'water' ? 'bg-blue-100 dark:bg-blue-900/30' :
                'bg-teal-100 dark:bg-teal-900/30'
              }`}>
                <CatIcon className={`w-6 h-6 ${
                  goal.category === 'emissions' ? 'text-orange-600' :
                  goal.category === 'energy' ? 'text-amber-600' :
                  goal.category === 'water' ? 'text-blue-600' :
                  'text-teal-600'
                }`} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-lg font-semibold text-surface-900 dark:text-white">{goal.title}</h4>
                    <p className="text-sm text-surface-500">{goal.description}</p>
                  </div>
                  <span className={`px-3 py-1 text-sm rounded-full ${statConf.bg} ${statConf.text}`}>
                    {statConf.label}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
                  <div>
                    <p className="text-xs text-surface-500 mb-1">Current</p>
                    <p className="text-lg font-semibold text-surface-900 dark:text-white">
                      {goal.currentValue.toLocaleString()} {goal.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 mb-1">Target</p>
                    <p className="text-lg font-semibold text-surface-900 dark:text-white">
                      {goal.targetValue.toLocaleString()} {goal.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 mb-1">Baseline</p>
                    <p className="text-lg font-semibold text-surface-900 dark:text-white">
                      {goal.baselineValue.toLocaleString()} {goal.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 mb-1">Deadline</p>
                    <p className="text-lg font-semibold text-surface-900 dark:text-white">{goal.deadline}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-surface-600 dark:text-surface-400">Progress</span>
                    <span className="text-sm font-medium text-surface-900 dark:text-white">{progress}%</span>
                  </div>
                  <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ duration: 0.5 }}
                      className={`h-full rounded-full ${
                        goal.status === 'on_track' || goal.status === 'achieved' ? 'bg-green-500' :
                        goal.status === 'at_risk' ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-surface-500 mb-2">Key Initiatives</p>
                  <div className="flex flex-wrap gap-2">
                    {goal.initiatives.map((initiative, idx) => (
                      <span key={idx} className="px-3 py-1 bg-surface-100 dark:bg-surface-700 text-xs rounded-lg text-surface-600 dark:text-surface-400">
                        {initiative}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  const renderESG = () => (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80 mb-1">Overall ESG Score</p>
            <p className="text-5xl font-bold">{overallESGScore}</p>
            <p className="text-sm opacity-80 mt-2">Industry Average: 72</p>
          </div>
          <div className="flex gap-6">
            {esgByCategory.map(({ category, score }) => (
              <div key={category} className="text-center">
                <p className="text-3xl font-bold">{score}</p>
                <p className="text-xs opacity-80 capitalize">{category.slice(0, 1).toUpperCase()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      {(['environmental', 'social', 'governance'] as const).map((category) => {
        const metrics = esgMetrics.filter(m => m.category === category);
        const categoryScore = esgByCategory.find(c => c.category === category)?.score || 0;
        
        return (
          <div key={category} className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-surface-900 dark:text-white capitalize flex items-center gap-2">
                {category === 'environmental' && <Leaf className="w-5 h-5 text-emerald-500" />}
                {category === 'social' && <Globe className="w-5 h-5 text-blue-500" />}
                {category === 'governance' && <Building2 className="w-5 h-5 text-purple-500" />}
                {category}
              </h3>
              <span className={`text-lg font-bold ${
                category === 'environmental' ? 'text-emerald-500' :
                category === 'social' ? 'text-blue-500' : 'text-purple-500'
              }`}>
                {categoryScore}/100
              </span>
            </div>
            
            <div className="space-y-4">
              {metrics.map((metric) => (
                <div key={metric.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{metric.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${
                          metric.trend === 'up' ? 'text-green-600' :
                          metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {metric.trend === 'up' && <TrendingUp className="w-3 h-3 inline" />}
                          {metric.trend === 'down' && <TrendingDown className="w-3 h-3 inline" />}
                        </span>
                        <span className="text-sm font-medium text-surface-900 dark:text-white">{metric.score}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          category === 'environmental' ? 'bg-emerald-500' :
                          category === 'social' ? 'bg-blue-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${metric.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-surface-500 mt-1">{metric.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm border border-surface-200 dark:border-surface-700">
          <p className="text-2xl font-bold text-surface-900 dark:text-white">
            {carbonProjects.reduce((sum, p) => sum + p.co2Impact, 0).toLocaleString()}
          </p>
          <p className="text-sm text-surface-500">Total tCO2e Impact</p>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm border border-surface-200 dark:border-surface-700">
          <p className="text-2xl font-bold text-surface-900 dark:text-white">
            ${(carbonProjects.reduce((sum, p) => sum + p.investmentCost, 0) / 1000000).toFixed(1)}M
          </p>
          <p className="text-sm text-surface-500">Total Investment</p>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm border border-surface-200 dark:border-surface-700">
          <p className="text-2xl font-bold text-surface-900 dark:text-white">
            ${(carbonProjects.reduce((sum, p) => sum + p.annualSavings, 0) / 1000).toFixed(0)}K
          </p>
          <p className="text-sm text-surface-500">Annual Savings</p>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm border border-surface-200 dark:border-surface-700">
          <p className="text-2xl font-bold text-surface-900 dark:text-white">
            {carbonProjects.filter(p => p.status === 'in_progress').length}
          </p>
          <p className="text-sm text-surface-500">Active Projects</p>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {carbonProjects.map((project) => {
          const TypeIcon = project.type === 'renewable' ? Sun : project.type === 'offset' ? Leaf : Zap;
          
          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${
                  project.type === 'renewable' ? 'bg-amber-100 dark:bg-amber-900/30' :
                  project.type === 'offset' ? 'bg-green-100 dark:bg-green-900/30' :
                  'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  <TypeIcon className={`w-6 h-6 ${
                    project.type === 'renewable' ? 'text-amber-600' :
                    project.type === 'offset' ? 'text-green-600' : 'text-blue-600'
                  }`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-surface-900 dark:text-white">{project.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                          project.type === 'renewable' ? 'bg-amber-100 text-amber-700' :
                          project.type === 'offset' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {project.type}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${
                          project.status === 'completed' ? 'bg-green-100 text-green-700' :
                          project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {project.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                          {project.status === 'in_progress' && <Clock className="w-3 h-3" />}
                          {project.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">-{project.co2Impact}</p>
                      <p className="text-xs text-surface-500">tCO2e/year</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-surface-100 dark:border-surface-700">
                    <div>
                      <p className="text-xs text-surface-500 mb-1">Investment</p>
                      <p className="font-medium text-surface-900 dark:text-white">
                        ${(project.investmentCost / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-surface-500 mb-1">Annual Savings</p>
                      <p className="font-medium text-surface-900 dark:text-white">
                        ${(project.annualSavings / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-surface-500 mb-1">Start Date</p>
                      <p className="font-medium text-surface-900 dark:text-white">{project.startDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-surface-500 mb-1">Completion</p>
                      <p className="font-medium text-surface-900 dark:text-white">{project.completionDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const getViewTitle = () => {
    switch (viewMode) {
      case 'emissions': return 'GHG Emissions Inventory';
      case 'goals': return 'Sustainability Goals';
      case 'esg': return 'ESG Performance';
      case 'projects': return 'Carbon Projects';
      default: return 'Sustainability Dashboard';
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="sticky top-[72px] z-50 bg-white/80 dark:bg-surface-800/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (viewMode === 'overview') {
                    navigate(-1);
                  } else {
                    setViewMode('overview');
                  }
                }}
                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-surface-600 dark:text-surface-400" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                  <Leaf className="w-6 h-6 text-green-500" />
                  {getViewTitle()}
                </h1>
                {viewMode === 'overview' && (
                  <p className="text-sm text-surface-500">ESG & Carbon Management</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
                className="px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm focus:outline-none"
              >
                <option value="ytd">YTD</option>
                <option value="1y">1 Year</option>
                <option value="3y">3 Years</option>
                <option value="5y">5 Years</option>
              </select>
              <button className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors">
                <Download className="w-5 h-5 text-surface-600 dark:text-surface-400" />
              </button>
              <button className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors">
                <Share2 className="w-5 h-5 text-surface-600 dark:text-surface-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      {viewMode !== 'overview' && (
        <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1 overflow-x-auto py-2">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'emissions', label: 'Emissions', icon: Factory },
                { id: 'goals', label: 'Goals', icon: Target },
                { id: 'esg', label: 'ESG', icon: Award },
                { id: 'projects', label: 'Projects', icon: Zap }
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setViewMode(tab.id as ViewMode)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
                      viewMode === tab.id
                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600'
                        : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {viewMode === 'overview' && renderOverview()}
            {viewMode === 'emissions' && renderEmissions()}
            {viewMode === 'goals' && renderGoals()}
            {viewMode === 'esg' && renderESG()}
            {viewMode === 'projects' && renderProjects()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SustainabilityDashboard;
