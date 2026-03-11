import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  allInternationalStandards,
  standardCategories,
  issuingBodies,
  searchStandards,
  getStandardsByCategory,
  getCertifiableStandards,
  type InternationalStandard,
  type StandardCategory,
  type IssuingBody
} from '../data/internationalStandards';
import { useStandards } from '../api/hooks/useAPIHooks';
import {
  ArrowLeft,
  Search,
  Filter,
  Globe,
  Shield,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Scale,
  FileCheck,
  Zap,
  ExternalLink,
  Download,
  Share2,
  Info,
  Target,
  Activity,
  Sparkles,
  Eye,
  Map as MapIcon,
  Layers,
  BarChart3
} from 'lucide-react';

/* ================================================================
   INTERNATIONAL STANDARDS (HD & DARK THEME)
   A premium library for exploring and applying global safety
   regulations to AI-powered audits.
   ================================================================ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
};

// Category icons and colors (Dark Theme)
const categoryConfig: Record<StandardCategory, { icon: any; color: string; bgColor: string; borderColor: string }> = {
  'Occupational Health & Safety': { icon: Shield, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
  'Sector-Specific Safety': { icon: Activity, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
  'Technical & Engineering Safety': { icon: Zap, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
  'Digital & Information Safety': { icon: FileCheck, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
  'Specialized & Risk Standards': { icon: Target, color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' }
};

const InternationalStandards: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<StandardCategory | 'All'>('All');
  const [selectedBody, setSelectedBody] = useState<IssuingBody | 'All'>('All');
  const [showCertifiableOnly, setShowCertifiableOnly] = useState(false);
  const [expandedStandard, setExpandedStandard] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'clauses' | 'checklist'>('overview');
  const [showMap, setShowMap] = useState(false);

  // ── Real API Data ──────────────────────────────────────────────────────
  const { data: backendStandards } = useStandards();

  const allStandardsData = useMemo<InternationalStandard[]>(() => {
    if (backendStandards && backendStandards.length > 0) {
      const converted = backendStandards.map((s: any) => ({
        id: String(s.id),
        code: s.standardCode,
        title: s.title,
        issuingBody: s.issuingBody as IssuingBody,
        category: (s.category || 'Environmental') as StandardCategory,
        description: s.description || '',
        scope: s.scope || '',
        edition: s.edition || '',
        publicationDate: s.publicationDate || '',
        isCertifiable: false,
        status: s.status || 'active',
        keyRequirements: s.keyRequirements || [],
        applicableIndustries: s.applicableIndustries || [],
        relatedStandards: [],
        clauses: [],
        implementationChecklist: [],
      }));
      return [...allInternationalStandards, ...converted];
    }
    return allInternationalStandards;
  }, [backendStandards]);

  const filteredStandards = useMemo(() => {
    let results = allStandardsData;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter((std: InternationalStandard) =>
        std.code.toLowerCase().includes(query) ||
        std.title.toLowerCase().includes(query) ||
        std.description.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'All') {
      results = results.filter((std: InternationalStandard) => std.category === selectedCategory);
    }

    if (selectedBody !== 'All') {
      results = results.filter((std: InternationalStandard) => std.issuingBody === selectedBody);
    }

    if (showCertifiableOnly) {
      results = results.filter((std: InternationalStandard) => std.certificationAvailable || std.isCertifiable);
    }

    return results;
  }, [searchQuery, selectedCategory, selectedBody, showCertifiableOnly, allStandardsData]);

  const applyToAudit = (std: InternationalStandard) => {
    const type = std.id.includes('45001') ? 'iso' : std.id.includes('osha') ? 'osha' : 'ilo';
    navigate(`/visual-audit/tool?standard=${type}`);
  };

  return (
    <div className="min-h-screen bg-surface-950 text-white pb-20 selection:bg-brand-500/30">
      {/* HD Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/5 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-[72px] z-40 bg-surface-900/60 backdrop-blur-2xl border-b border-surface-800 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2.5 hover:bg-surface-800 rounded-2xl text-surface-400 transition-all group"
              >
                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white tracking-tight">Global Standards</h1>
                  <p className="text-[11px] text-surface-400 uppercase tracking-widest font-bold">International Compliance Library</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowMap(!showMap)}
                className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                  showMap ? 'bg-brand-500 border-brand-400 text-white' : 'bg-surface-800/50 border-surface-700/50 text-surface-300 hover:bg-surface-800'
                }`}
              >
                <MapIcon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Compliance Map</span>
              </button>
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-surface-800/50 rounded-xl border border-surface-700/50">
                <BookOpen className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-bold text-surface-300 uppercase tracking-wider">{filteredStandards.length} Standards</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 relative z-10">
        {/* Global Compliance Map (Simulated HD Feature) */}
        <AnimatePresence>
          {showMap && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="mb-12 overflow-hidden"
            >
              <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800 rounded-[2.5rem] p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-10" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-white mb-1">Global Compliance Map</h3>
                      <p className="text-sm text-surface-500">Visualizing safety standard adoption and compliance levels worldwide</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">High Adoption</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Moderate</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="aspect-[21/9] bg-surface-800/50 rounded-3xl border border-surface-700/50 flex items-center justify-center relative overflow-hidden">
                    <Globe className="w-32 h-32 text-surface-700 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-xs font-black text-surface-500 uppercase tracking-[0.5em]">Interactive Map Loading...</p>
                    </div>
                    
                    {/* Simulated Map Markers */}
                    {[
                      { x: '20%', y: '30%', label: 'OSHA (North America)' },
                      { x: '50%', y: '25%', label: 'EU-OSHA (Europe)' },
                      { x: '75%', y: '40%', label: 'ISO (Asia-Pacific)' },
                      { x: '45%', y: '60%', label: 'ILO (Africa)' },
                    ].map((m, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        style={{ left: m.x, top: m.y }}
                        className="absolute group/marker"
                      >
                        <div className="w-4 h-4 bg-brand-500 rounded-full animate-ping absolute inset-0" />
                        <div className="w-4 h-4 bg-brand-500 rounded-full relative z-10 border-2 border-white shadow-lg cursor-pointer" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/marker:opacity-100 transition-opacity whitespace-nowrap bg-surface-900 border border-surface-700 px-3 py-1.5 rounded-lg shadow-2xl z-20">
                          <p className="text-[10px] font-black text-white uppercase tracking-widest">{m.label}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-12">
          <div className="lg:col-span-2 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 group-focus-within:text-brand-400 transition-colors" />
            <input 
              type="text"
              placeholder="Search standards, codes, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-surface-900/50 border border-surface-800 rounded-2xl text-sm focus:outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/5 transition-all"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full pl-10 pr-4 py-4 bg-surface-900/50 border border-surface-800 rounded-2xl text-sm appearance-none focus:outline-none focus:border-brand-500/50 transition-all cursor-pointer"
            >
              <option value="All">All Categories</option>
              {standardCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <select 
              value={selectedBody}
              onChange={(e) => setSelectedBody(e.target.value as any)}
              className="w-full pl-10 pr-4 py-4 bg-surface-900/50 border border-surface-800 rounded-2xl text-sm appearance-none focus:outline-none focus:border-brand-500/50 transition-all cursor-pointer"
            >
              <option value="All">All Bodies</option>
              {issuingBodies.map(body => <option key={body} value={body}>{body}</option>)}
            </select>
          </div>
        </div>

        {/* Standards Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {filteredStandards.map((std) => {
            const config = categoryConfig[std.category];
            const isExpanded = expandedStandard === std.id;
            
            return (
              <motion.div
                key={std.id}
                variants={itemVariants}
                className={`group bg-surface-900/40 backdrop-blur-md border rounded-[2rem] overflow-hidden transition-all duration-500 ${
                  isExpanded ? 'border-brand-500/50 shadow-2xl shadow-brand-500/10' : 'border-surface-800 hover:border-surface-700'
                }`}
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-2xl ${config.bgColor} ${config.color}`}>
                      <config.icon className="w-6 h-6" />
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 rounded-lg bg-surface-800 text-[8px] font-black text-surface-400 uppercase tracking-widest border border-surface-700">
                        {std.issuingBody}
                      </span>
                      {std.certificationAvailable && (
                        <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-[8px] font-black text-emerald-400 uppercase tracking-widest border border-emerald-500/20">
                          Certifiable
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-xs font-black text-brand-400 uppercase tracking-[0.2em] mb-2">{std.code}</p>
                    <h3 className="text-xl font-bold text-white group-hover:text-brand-300 transition-colors leading-tight">{std.title}</h3>
                  </div>

                  <p className="text-sm text-surface-400 leading-relaxed mb-8 line-clamp-2">
                    {std.description}
                  </p>

                  <div className="flex items-center justify-between gap-4">
                    <button 
                      onClick={() => setExpandedStandard(isExpanded ? null : std.id)}
                      className="flex items-center gap-2 text-[10px] font-black text-surface-500 uppercase tracking-widest hover:text-white transition-colors"
                    >
                      {isExpanded ? 'Show Less' : 'View Details'}
                      <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigate(`/ai-analysis?standard=${std.id}`)}
                        className="flex items-center gap-2 px-3 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-violet-500/20"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Analysis
                      </button>
                      <button 
                        onClick={() => applyToAudit(std)}
                        className="flex items-center gap-2 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-brand-500/20"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Apply to AI Audit
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-surface-800 bg-surface-900/60"
                    >
                      <div className="p-8 space-y-8">
                        {/* Tabs */}
                        <div className="flex gap-6 border-b border-surface-800">
                          {['overview', 'clauses', 'checklist'].map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setActiveTab(tab as any)}
                              className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                                activeTab === tab ? 'text-brand-400' : 'text-surface-500 hover:text-surface-300'
                              }`}
                            >
                              {tab}
                              {activeTab === tab && (
                                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-400" />
                              )}
                            </button>
                          ))}
                        </div>

                        {activeTab === 'overview' && (
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-3">Scope</h4>
                              <div className="flex flex-wrap gap-2">
                                {std.scope.map((s, i) => (
                                  <span key={i} className="px-3 py-1.5 rounded-lg bg-surface-800 text-[11px] text-surface-300 border border-surface-700/50">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-3">Key Principles</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {std.keyPrinciples.map((p, i) => (
                                  <div key={i} className="flex items-start gap-3 p-3 bg-surface-800/30 rounded-xl border border-surface-700/30">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span className="text-xs text-surface-400">{p}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'clauses' && (
                          <div className="space-y-4">
                            {std.clauses?.map((clause, i) => (
                              <div key={i} className="p-4 bg-surface-800/30 rounded-2xl border border-surface-700/30">
                                <div className="flex justify-between items-start mb-2">
                                  <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest">{clause.clause}</p>
                                  <p className="text-xs font-bold text-white">{clause.title}</p>
                                </div>
                                <p className="text-[11px] text-surface-500 mb-3">{clause.description}</p>
                                <div className="space-y-1">
                                  {clause.keyRequirements.map((req, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-[10px] text-surface-400">
                                      <div className="w-1 h-1 rounded-full bg-surface-600" />
                                      {req}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {activeTab === 'checklist' && (
                          <div className="space-y-3">
                            {std.complianceChecklist?.map((item, i) => (
                              <div key={i} className="flex items-center gap-4 p-4 bg-surface-800/30 rounded-2xl border border-surface-700/30 group/item">
                                <div className="w-5 h-5 rounded-md border-2 border-surface-700 flex items-center justify-center group-hover/item:border-brand-500 transition-colors">
                                  <CheckCircle2 className="w-3 h-3 text-brand-500 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                </div>
                                <span className="text-xs text-surface-400">{item}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-4 pt-4 border-t border-surface-800">
                          <button className="flex-1 py-3 bg-surface-800 hover:bg-surface-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-surface-700 flex items-center justify-center gap-2">
                            <Download className="w-4 h-4" />
                            Download PDF
                          </button>
                          <button className="flex-1 py-3 bg-surface-800 hover:bg-surface-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-surface-700 flex items-center justify-center gap-2">
                            <Share2 className="w-4 h-4" />
                            Share Standard
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </main>
    </div>
  );
};

export default InternationalStandards;
