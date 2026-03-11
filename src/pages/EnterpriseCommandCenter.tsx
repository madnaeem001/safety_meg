import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import FadeContent from '../components/animations/FadeContent';
import { useGeolocation } from '../hooks/useGeolocation';
import { useEnterpriseStats } from '../api/hooks/useAPIHooks';
import {
  Globe,
  Building2,
  Users,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  Map,
  Layers,
  Settings,
  Bell,
  Search,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  FileCheck,
  Mic,
  Wrench,
  Bot,
  Sparkles,
  Brain,
  LayoutGrid,
  Kanban,
  FileText,
  ShieldAlert,
  MoreHorizontal,
  ArrowLeft,
  X,
  Filter,
  RefreshCw,
  Eye,
  Download,
  Share2,
  WifiOff
} from 'lucide-react';

/* ================================================================
   ENTERPRISE COMMAND CENTER
   The ultimate executive dashboard for global site monitoring,
   project portfolio health, and AI-driven safety intelligence.
   ================================================================ */

// Types
interface RegionData {
  id: string;
  name: string;
  country: string;
  facilities: number;
  employees: number;
  riskScore: number;
  incidents: number;
  compliance: number;
  trend: 'up' | 'down' | 'stable';
}

interface ProjectHealth {
  id: string;
  name: string;
  status: 'on-track' | 'at-risk' | 'delayed';
  safetyScore: number;
  progress: number;
  incidents: number;
  lastAudit: string;
}

// Mock data for global operations
const globalRegions: RegionData[] = [
  { id: 'na', name: 'North America', country: 'US/CA/MX', facilities: 45, employees: 12500, riskScore: 23, incidents: 12, compliance: 96, trend: 'up' },
  { id: 'eu', name: 'Europe', country: 'EU/UK', facilities: 38, employees: 9800, riskScore: 18, incidents: 8, compliance: 98, trend: 'up' },
  { id: 'apac', name: 'Asia Pacific', country: 'CN/JP/AU', facilities: 52, employees: 18200, riskScore: 31, incidents: 24, compliance: 89, trend: 'down' },
  { id: 'latam', name: 'Latin America', country: 'BR/AR/CL', facilities: 22, employees: 5400, riskScore: 28, incidents: 15, compliance: 91, trend: 'stable' },
  { id: 'africa', name: 'Africa', country: 'ZA/NG/EG', facilities: 18, employees: 4200, riskScore: 35, incidents: 19, compliance: 87, trend: 'up' },
];

const projectPortfolio: ProjectHealth[] = [
  { id: 'p1', name: 'Solar Farm Expansion', status: 'on-track', safetyScore: 98, progress: 65, incidents: 0, lastAudit: '2 days ago' },
  { id: 'p2', name: 'Refinery Maintenance', status: 'at-risk', safetyScore: 82, progress: 40, incidents: 3, lastAudit: 'Today' },
  { id: 'p3', name: 'Offshore Rig Alpha', status: 'on-track', safetyScore: 95, progress: 88, incidents: 1, lastAudit: 'Yesterday' },
  { id: 'p4', name: 'Chemical Plant Build', status: 'delayed', safetyScore: 89, progress: 25, incidents: 2, lastAudit: '4 days ago' },
];

export const EnterpriseCommandCenter: React.FC = () => {
  const navigate = useNavigate();
  const { latitude, longitude, loading: geoLoading } = useGeolocation();
  const { data: backendStats } = useEnterpriseStats();
  const formatWorkforce = (n: number): string => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  return (
    <div className="min-h-screen bg-surface-950 text-white pb-20 selection:bg-brand-500/30">
      {/* HD Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-500/5 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-[72px] z-40 bg-surface-900/60 backdrop-blur-2xl border-b border-surface-800 shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/')}
                className="p-2.5 hover:bg-surface-800 rounded-2xl text-surface-400 transition-all group"
              >
                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white tracking-tight">Enterprise Command Center</h1>
                  <p className="text-[11px] text-surface-400 uppercase tracking-widest font-bold">Global Safety Operations</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-surface-500 uppercase tracking-widest font-bold mb-1">GPS Coordinates</p>
                <div className="flex items-center gap-2 justify-end">
                  <Map className="w-4 h-4 text-brand-400" />
                  <span className="text-sm font-bold text-white uppercase tracking-wider">
                    {geoLoading ? 'Locating...' : latitude ? `${latitude.toFixed(4)}, ${longitude?.toFixed(4)}` : 'GPS Disabled'}
                  </span>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-surface-500 uppercase tracking-widest font-bold mb-1">System Status</p>
                <div className="flex items-center gap-2 justify-end">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">AI Engines Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-8 relative z-10">
        {/* Global Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Global Safety Score', value: `${backendStats?.globalStats.safetyScore ?? 94.2}%`, icon: Shield, color: 'text-emerald-400', trend: '+1.2%' },
            { label: 'Active Facilities', value: String(backendStats?.globalStats.activeFacilities ?? 175), icon: Building2, color: 'text-blue-400', trend: 'Stable' },
            { label: 'Total Workforce', value: backendStats ? formatWorkforce(backendStats.globalStats.totalWorkforce) : '48.5k', icon: Users, color: 'text-purple-400', trend: '+0.5%' },
            { label: 'Critical Risks', value: String(backendStats?.globalStats.criticalRisks ?? 12), icon: AlertTriangle, color: 'text-red-400', trend: '-3' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface-900/40 backdrop-blur-md border border-surface-800 rounded-3xl p-6 hover:border-brand-500/30 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-surface-800 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-lg">
                  {stat.trend}
                </span>
              </div>
              <p className="text-[10px] text-surface-500 uppercase tracking-widest font-bold mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-white">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* AI Strategic Intelligence (New) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-900/40 border border-surface-800 rounded-[2.5rem] p-8 backdrop-blur-md mb-12 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
            <Brain className="w-64 h-64 text-white" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400 shadow-lg shadow-brand-500/5">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">AI Strategic Intelligence</h3>
                <p className="text-sm text-surface-500">Global risk patterns and operational optimization</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-6 bg-surface-800/30 rounded-3xl border border-surface-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-brand-400" />
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Risk Hotspot</h4>
                </div>
                <p className="text-sm text-surface-300 leading-relaxed">
                  AI has identified a 15% increase in near-misses in the Southeast Asia region related to heavy lifting. Recommended intervention: Regional safety workshop.
                </p>
              </div>
              <div className="p-6 bg-surface-800/30 rounded-3xl border border-surface-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Efficiency Gain</h4>
                </div>
                <p className="text-sm text-surface-300 leading-relaxed">
                  Automated PPE audits have reduced manual inspection time by 420 hours this month across all facilities.
                </p>
              </div>
              <div className="p-6 bg-surface-800/30 rounded-3xl border border-surface-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Predictive Success</h4>
                </div>
                <p className="text-sm text-surface-300 leading-relaxed">
                  92% of predicted equipment failures were addressed before downtime occurred, saving an estimated $1.2M in operational costs.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Global Map & Region Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 bg-surface-900/40 border border-surface-800 rounded-[2.5rem] p-8 backdrop-blur-md relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-10" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white">Global Operations Map</h3>
                <div className="flex gap-2 bg-surface-800/50 p-1 rounded-xl border border-surface-700/50">
                  <button 
                    onClick={() => setViewMode('map')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-brand-500 text-white' : 'text-surface-400 hover:text-white'}`}
                  >
                    Map View
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-brand-500 text-white' : 'text-surface-400 hover:text-white'}`}
                  >
                    List View
                  </button>
                </div>
              </div>

              <div className="aspect-[21/9] bg-surface-800/50 rounded-3xl border border-surface-700/50 flex items-center justify-center relative overflow-hidden">
                <Globe className="w-32 h-32 text-surface-700 animate-pulse" />
                {globalRegions.map((region, i) => (
                  <motion.button
                    key={region.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    onClick={() => setSelectedRegion(region)}
                    className={`absolute w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all ${
                      selectedRegion?.id === region.id ? 'bg-brand-500 scale-150 ring-4 ring-brand-500/20' : 'bg-brand-400 hover:scale-125'
                    }`}
                    style={{ 
                      left: region.id === 'na' ? '20%' : region.id === 'eu' ? '48%' : region.id === 'apac' ? '75%' : region.id === 'latam' ? '30%' : '52%',
                      top: region.id === 'na' ? '35%' : region.id === 'eu' ? '30%' : region.id === 'apac' ? '45%' : region.id === 'latam' ? '65%' : '55%'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-surface-900/40 border border-surface-800 rounded-[2.5rem] p-8 backdrop-blur-md">
            <h3 className="text-xl font-bold text-white mb-6">Regional Intelligence</h3>
            <AnimatePresence mode="wait">
              {selectedRegion ? (
                <motion.div
                  key={selectedRegion.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-2xl font-black text-white">{selectedRegion.name}</h4>
                      <p className="text-xs text-surface-500 uppercase tracking-widest font-bold">{selectedRegion.country}</p>
                    </div>
                    <div className={`p-3 rounded-2xl bg-surface-800 ${selectedRegion.riskScore > 30 ? 'text-red-400' : 'text-emerald-400'}`}>
                      <Activity className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-surface-800/30 rounded-2xl border border-surface-700/50">
                      <p className="text-[10px] text-surface-500 uppercase tracking-widest font-bold mb-1">Facilities</p>
                      <p className="text-lg font-bold text-white">{selectedRegion.facilities}</p>
                    </div>
                    <div className="p-4 bg-surface-800/30 rounded-2xl border border-surface-700/50">
                      <p className="text-[10px] text-surface-500 uppercase tracking-widest font-bold mb-1">Compliance</p>
                      <p className="text-lg font-bold text-white">{selectedRegion.compliance}%</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Active Risks</h5>
                    <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <p className="text-xs font-bold text-white">High Risk Detected</p>
                      </div>
                      <p className="text-[10px] text-surface-400 leading-relaxed">
                        Unusual incident spike in {selectedRegion.name} manufacturing zones. AI suggests immediate audit.
                      </p>
                    </div>
                  </div>

                  <button className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg shadow-brand-500/20">
                    View Regional Dashboard
                  </button>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <Globe className="w-16 h-16 text-surface-800 mb-4" />
                  <p className="text-surface-500 text-sm">Select a region on the map to view detailed safety intelligence</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* AI Safety Intelligence Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-surface-900/40 border border-surface-800 rounded-[2.5rem] p-8 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
              <Brain className="w-40 h-40 text-white" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">AI Safety Intelligence</h3>
                  <p className="text-sm text-surface-500">Real-time predictive risk analysis and global insights</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-surface-800/30 rounded-3xl border border-surface-700/50">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Predictive Alert</h4>
                  </div>
                  <p className="text-xs text-surface-400 leading-relaxed mb-4">
                    AI models predict a 15% increase in heat-related risks in the North America region over the next 48 hours.
                  </p>
                  <button className="text-[10px] font-black text-brand-400 uppercase tracking-widest hover:text-brand-300 transition-colors">
                    View Mitigation Plan
                  </button>
                </div>

                <div className="p-6 bg-surface-800/30 rounded-3xl border border-surface-700/50">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-5 h-5 text-blue-400" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Global Trend</h4>
                  </div>
                  <p className="text-xs text-surface-400 leading-relaxed mb-4">
                    Compliance levels in Africa have improved by 4.2% following the implementation of AI Visual Audits.
                  </p>
                  <button className="text-[10px] font-black text-brand-400 uppercase tracking-widest hover:text-brand-300 transition-colors">
                    Analyze Region
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-brand-600 to-violet-700 rounded-[2.5rem] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Sparkles className="w-40 h-40 text-white" />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-3xl font-black text-white mb-4 leading-tight">
                  Enterprise <br />Safety Auto-Pilot
                </h3>
                <p className="text-brand-100 text-sm leading-relaxed mb-8">
                  AI is currently managing {backendStats?.aiInsights.automatedWorkflows ?? 12} automated safety workflows across {globalRegions.length} regions.
                </p>
              </div>
              <button className="w-full py-4 bg-white text-brand-600 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-50 transition-colors shadow-xl shadow-black/20">
                Configure Auto-Pilot
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EnterpriseCommandCenter;
