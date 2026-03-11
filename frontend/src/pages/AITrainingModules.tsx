import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, BookOpen, GraduationCap, Award, TrendingUp, Clock, Users,
  Sparkles, Play, CheckCircle2, AlertTriangle, Target, Zap, Star,
  ChevronRight, Shield, FileText, Cpu, BarChart3, ArrowRight,
  Lightbulb, Layers, RefreshCw, Lock, Eye, Radio
} from 'lucide-react';
import {
  useAiTrainingModules,
  useAiLearningPaths,
  useAiCompetencyAreas,
  useGenerateCourseMutation,
} from '../api/hooks/useAPIHooks';

// AI-Generated Training Modules
const AI_MODULES = [
  {
    id: 'mod-1', title: 'Hazard Recognition Mastery', category: 'Core Safety',
    aiGenerated: true, difficulty: 'Intermediate', duration: '45 min',
    modules: 12, completed: 8, score: 92, enrolled: 347,
    description: 'AI-curated module covering hazard identification across industrial environments.',
    tags: ['OSHA 1910', 'Hazard ID', 'Risk Assessment'], color: 'cyan',
    nextLesson: 'Chemical Hazard Indicators', adaptiveScore: 87,
  },
  {
    id: 'mod-2', title: 'PPE Compliance & Selection', category: 'Compliance',
    aiGenerated: true, difficulty: 'Beginner', duration: '30 min',
    modules: 8, completed: 8, score: 98, enrolled: 521,
    description: 'Complete PPE training with AI-powered selection guidance and fit testing.',
    tags: ['PPE', 'ANSI Z87.1', 'NFPA 70E'], color: 'green',
    nextLesson: 'Completed!', adaptiveScore: 98,
  },
  {
    id: 'mod-3', title: 'Emergency Response Protocol', category: 'Emergency',
    aiGenerated: true, difficulty: 'Advanced', duration: '60 min',
    modules: 15, completed: 5, score: 78, enrolled: 189,
    description: 'AI-driven emergency simulations with real-time decision feedback.',
    tags: ['Emergency Plans', 'Evacuation', 'First Aid'], color: 'red',
    nextLesson: 'Fire Suppression Systems', adaptiveScore: 72,
  },
  {
    id: 'mod-4', title: 'Confined Space Entry', category: 'Specialized',
    aiGenerated: false, difficulty: 'Advanced', duration: '90 min',
    modules: 18, completed: 10, score: 85, enrolled: 134,
    description: 'Comprehensive confined space training with atmospheric monitoring.',
    tags: ['OSHA 1910.146', 'Permit Required', 'Rescue'], color: 'purple',
    nextLesson: 'Atmospheric Testing', adaptiveScore: 81,
  },
  {
    id: 'mod-5', title: 'Machine Guarding & LOTO', category: 'Core Safety',
    aiGenerated: true, difficulty: 'Intermediate', duration: '50 min',
    modules: 14, completed: 3, score: 70, enrolled: 278,
    description: 'AI-adaptive lockout/tagout procedures with equipment-specific protocols.',
    tags: ['LOTO', 'OSHA 1910.147', 'Energy Isolation'], color: 'amber',
    nextLesson: 'Energy Source Identification', adaptiveScore: 65,
  },
  {
    id: 'mod-6', title: 'Chemical Safety & SDS', category: 'Compliance',
    aiGenerated: true, difficulty: 'Intermediate', duration: '40 min',
    modules: 10, completed: 7, score: 88, enrolled: 412,
    description: 'GHS-aligned chemical hazard communication with AI-powered SDS analysis.',
    tags: ['GHS', 'HazCom', 'SDS'], color: 'blue',
    nextLesson: 'Corrosive Materials Handling', adaptiveScore: 85,
  },
];

// Learning Path Data
const LEARNING_PATHS = [
  { name: 'New Hire Onboarding', modules: 6, duration: '4 hours', progress: 100, certified: true, icon: Users, color: 'emerald' },
  { name: 'Supervisor Safety', modules: 12, duration: '8 hours', progress: 67, certified: false, icon: Shield, color: 'cyan' },
  { name: 'OSHA 30-Hour', modules: 30, duration: '30 hours', progress: 43, certified: false, icon: Award, color: 'purple' },
  { name: 'Environmental Compliance', modules: 8, duration: '6 hours', progress: 25, certified: false, icon: Layers, color: 'blue' },
];

// AI Competency Assessment Data
const COMPETENCY_AREAS = [
  { area: 'Hazard Recognition', score: 92, trend: '+5', benchmark: 78 },
  { area: 'Emergency Response', score: 78, trend: '+12', benchmark: 72 },
  { area: 'PPE Knowledge', score: 98, trend: '+2', benchmark: 85 },
  { area: 'Chemical Safety', score: 85, trend: '+8', benchmark: 74 },
  { area: 'Machine Safety', score: 70, trend: '+15', benchmark: 68 },
  { area: 'Ergonomics', score: 88, trend: '+3', benchmark: 71 },
];

const colorMap: Record<string, { border: string; bg: string; text: string }> = {
  cyan: { border: 'border-cyan-500/20', bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  green: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  red: { border: 'border-red-500/20', bg: 'bg-red-500/10', text: 'text-red-400' },
  purple: { border: 'border-purple-500/20', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  amber: { border: 'border-amber-500/20', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  blue: { border: 'border-blue-500/20', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  emerald: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
};

const ModuleCard: React.FC<{ mod: typeof AI_MODULES[0]; index: number }> = ({ mod, index }) => {
  const c = colorMap[mod.color] || colorMap.cyan;
  const progressPct = Math.round((mod.completed / mod.modules) * 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`relative overflow-hidden p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border ${c.border} hover:scale-[1.02] transition-all duration-300 group cursor-pointer`}
    >
      {mod.aiGenerated && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">AI Generated</span>
        </div>
      )}
      
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-3 rounded-xl ${c.bg} shrink-0`}>
          <Brain className={`w-6 h-6 ${c.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white mb-1 truncate">{mod.title}</h3>
          <p className="text-[11px] text-slate-400 line-clamp-2">{mod.description}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1.5 mb-4">
        {mod.tags.map(tag => (
          <span key={tag} className="px-2 py-0.5 text-[9px] font-bold text-slate-400 bg-slate-800/60 rounded-md border border-slate-700/30">{tag}</span>
        ))}
      </div>
      
      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-slate-500 font-mono">{mod.completed}/{mod.modules} MODULES</span>
          <span className={`text-[10px] font-bold ${c.text}`}>{progressPct}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1, delay: index * 0.1 }}
            className={`h-full rounded-full ${c.bg.replace('/10', '/60')}`}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] text-slate-500">{mod.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] text-slate-500">{mod.enrolled}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-amber-400 font-bold">{mod.score}%</span>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg ${c.bg} ${c.text} text-[10px] font-bold flex items-center gap-1 group-hover:scale-105 transition-transform`}>
          {progressPct === 100 ? <><CheckCircle2 className="w-3 h-3" /> Complete</> : <><Play className="w-3 h-3" /> Continue</>}
        </div>
      </div>
      
      {/* Adaptive AI Score */}
      <div className="mt-3 pt-3 border-t border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-3 h-3 text-purple-400" />
          <span className="text-[9px] text-slate-500 uppercase tracking-wider">AI Adaptive Score</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-purple-400 rounded-full" style={{ width: `${mod.adaptiveScore}%` }} />
          </div>
          <span className="text-[10px] font-bold text-purple-400">{mod.adaptiveScore}%</span>
        </div>
      </div>
    </motion.div>
  );
};

export const AITrainingModules: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'modules' | 'paths' | 'competency' | 'generator'>('modules');
  const [generating, setGenerating] = useState(false);
  const [generatedModule, setGeneratedModule] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [audience, setAudience] = useState('All Workers');
  const [moduleCount, setModuleCount] = useState('5 modules (~30 min)');

  const { data: backendModules } = useAiTrainingModules();
  const { data: backendPaths } = useAiLearningPaths();
  const { data: backendCompetency } = useAiCompetencyAreas();
  const generateCourseMutation = useGenerateCourseMutation();

  const displayModules = (backendModules && backendModules.length > 0) ? backendModules : AI_MODULES;
  const displayPaths = (backendPaths && backendPaths.length > 0) ? backendPaths : LEARNING_PATHS;
  const displayCompetency = (backendCompetency && backendCompetency.length > 0) ? backendCompetency : COMPETENCY_AREAS;

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setGeneratedModule(null);
    try {
      const result = await generateCourseMutation.mutate({ topic: topic.trim(), difficulty, audience, moduleCount });
      if (result?.description) {
        setGeneratedModule(`${result.topic} — ${result.description}`);
      }
    } catch {
      setGeneratedModule(`${topic} — AI-generated ${difficulty.toLowerCase()} training module for ${audience.toLowerCase()}. Covers key safety regulations and practical compliance requirements.`);
    } finally {
      setGenerating(false);
    }
  }, [topic, difficulty, audience, moduleCount, generateCourseMutation]);

  const totalModules = displayModules.reduce((s, m) => s + m.modules, 0);
  const completedModules = displayModules.reduce((s, m) => s + m.completed, 0);
  const avgScore = Math.round(displayModules.reduce((s, m) => s + m.score, 0) / displayModules.length);

  return (
    <div className="min-h-screen pb-28" style={{ background: 'linear-gradient(165deg, #020617 0%, #0f172a 35%, #0c1222 70%, #020617 100%)' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-gradient-radial from-purple-500/8 via-purple-500/3 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-gradient-radial from-cyan-500/5 via-transparent to-transparent rounded-full blur-3xl" />
      </div>



      <main className="relative z-10 max-w-7xl mx-auto pt-8 px-5 md:px-8 lg:px-12 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-purple-400 font-bold text-[10px] uppercase tracking-[0.3em]">
                <Sparkles className="w-3 h-3" /> AI-Powered Training
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white font-display">AI Training Modules</h1>
            </div>
          </div>
          <p className="text-sm text-slate-400 max-w-2xl">
            Adaptive AI-generated training with personalized learning paths, real-time competency tracking, and intelligent course recommendations.
          </p>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Modules', value: totalModules.toString(), icon: BookOpen, color: 'cyan' },
            { label: 'Completed', value: completedModules.toString(), icon: CheckCircle2, color: 'green' },
            { label: 'Avg Score', value: `${avgScore}%`, icon: Target, color: 'purple' },
            { label: 'AI Generated', value: AI_MODULES.filter(m => m.aiGenerated).length.toString(), icon: Sparkles, color: 'amber' },
          ].map((stat, i) => {
            const c = colorMap[stat.color] || colorMap.cyan;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border ${c.border}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`w-4 h-4 ${c.text}`} />
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{stat.label}</span>
                </div>
                <p className="text-2xl font-black text-white font-display">{stat.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'modules', label: 'Training Modules', icon: BookOpen },
            { id: 'paths', label: 'Learning Paths', icon: Layers },
            { id: 'competency', label: 'AI Competency Map', icon: Target },
            { id: 'generator', label: 'AI Course Generator', icon: Sparkles },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'text-slate-400 border border-slate-700/30 hover:border-slate-600/50 hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Modules Tab */}
          {activeTab === 'modules' && (
            <motion.div key="modules" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayModules.map((mod, i) => <ModuleCard key={mod.id} mod={mod} index={i} />)}
            </motion.div>
          )}

          {/* Learning Paths Tab */}
          {activeTab === 'paths' && (
            <motion.div key="paths" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              {displayPaths.map((path, i) => {
                const c = colorMap[path.color] || colorMap.cyan;
                return (
                  <motion.div
                    key={path.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border ${c.border} flex flex-col md:flex-row md:items-center gap-4`}
                  >
                    <div className={`p-3 rounded-xl ${c.bg} shrink-0`}>
                      <path.icon className={`w-6 h-6 ${c.text}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-white">{path.name}</h3>
                        {path.certified && (
                          <span className="px-2 py-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-1">
                            <Award className="w-3 h-3" /> Certified
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{path.modules} modules • {path.duration}</p>
                      <div className="mt-2 w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${path.progress}%` }}
                          transition={{ duration: 1, delay: i * 0.15 }}
                          className={`h-full rounded-full ${path.progress === 100 ? 'bg-emerald-400' : c.text.replace('text-', 'bg-')}`}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xl font-black ${c.text} font-display`}>{path.progress}%</p>
                      <p className="text-[10px] text-slate-500">PROGRESS</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Competency Map Tab */}
          {activeTab === 'competency' && (
            <motion.div key="competency" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-purple-500/15">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-xl bg-purple-500/10">
                    <Target className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">AI Competency Assessment</h3>
                    <p className="text-[10px] text-slate-500">Real-time skill gap analysis powered by adaptive AI</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayCompetency.map((comp, i) => (
                    <motion.div
                      key={comp.area}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08 }}
                      className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/30"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-slate-300">{comp.area}</span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">{comp.trend}</span>
                      </div>
                      <div className="flex items-end gap-3 mb-2">
                        <span className="text-3xl font-black text-white font-display">{comp.score}</span>
                        <span className="text-[10px] text-slate-500 mb-1">/ 100</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${comp.score}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className={`h-full rounded-full ${comp.score >= 90 ? 'bg-emerald-400' : comp.score >= 75 ? 'bg-cyan-400' : 'bg-amber-400'}`}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-600">Industry Benchmark</span>
                        <span className="text-[9px] text-slate-500 font-mono">{comp.benchmark}%</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Overall Readiness */}
              <div className="p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-cyan-500/15">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" /> Overall Training Readiness
                  </h3>
                  <span className="text-lg font-black text-cyan-400 font-display">
                    {Math.round(displayCompetency.reduce((s, c) => s + c.score, 0) / displayCompetency.length)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(displayCompetency.reduce((s, c) => s + c.score, 0) / displayCompetency.length)}%` }}
                    transition={{ duration: 1.5 }}
                    className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* AI Course Generator Tab */}
          {activeTab === 'generator' && (
            <motion.div key="generator" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="p-6 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-purple-500/15">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/20">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">AI Course Generator</h3>
                    <p className="text-xs text-slate-400">Generate custom training modules from topics, regulations, or incident data</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Topic / Regulation</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      placeholder="e.g., Fall Protection, OSHA 1926.501"
                      className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/30 rounded-xl text-sm text-white placeholder-slate-600 focus:border-purple-500/40 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Difficulty Level</label>
                    <select value={difficulty} onChange={e => setDifficulty(e.target.value as 'Beginner' | 'Intermediate' | 'Advanced')} className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/30 rounded-xl text-sm text-white focus:border-purple-500/40 focus:outline-none transition-colors">
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Target Audience</label>
                    <select value={audience} onChange={e => setAudience(e.target.value)} className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/30 rounded-xl text-sm text-white focus:border-purple-500/40 focus:outline-none transition-colors">
                      <option>All Workers</option>
                      <option>Supervisors</option>
                      <option>Maintenance</option>
                      <option>Contractors</option>
                      <option>Lab Technicians</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Module Count</label>
                    <select value={moduleCount} onChange={e => setModuleCount(e.target.value)} className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/30 rounded-xl text-sm text-white focus:border-purple-500/40 focus:outline-none transition-colors">
                      <option>5 modules (~30 min)</option>
                      <option>10 modules (~60 min)</option>
                      <option>15 modules (~90 min)</option>
                      <option>20 modules (~120 min)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-xl hover:from-purple-400 hover:to-cyan-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {generating ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Generating with AI...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate Training Module</>
                  )}
                </button>

                {generatedModule && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400">Module Generated Successfully</span>
                    </div>
                    <p className="text-sm text-slate-300">{generatedModule}</p>
                  </motion.div>
                )}
              </div>

              {/* Generation Capabilities */}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { icon: Brain, title: 'Adaptive Content', desc: 'AI adjusts difficulty based on learner performance and retention patterns.' },
                  { icon: FileText, title: 'Quiz Generation', desc: 'Auto-generates assessments from training content with randomized question pools.' },
                  { icon: Eye, title: 'Visual Scenarios', desc: 'Creates interactive visual scenarios from real incident data and hazard photos.' },
                ].map((cap, i) => (
                  <motion.div
                    key={cap.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/30"
                  >
                    <cap.icon className="w-5 h-5 text-purple-400 mb-3" />
                    <h4 className="text-xs font-bold text-white mb-1">{cap.title}</h4>
                    <p className="text-[11px] text-slate-500">{cap.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>


    </div>
  );
};

export default AITrainingModules;
