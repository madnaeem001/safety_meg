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

const normalizeStandardKey = (value: string | undefined | null) =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const InternationalStandards: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<StandardCategory | 'All'>('All');
  const [selectedBody, setSelectedBody] = useState<IssuingBody | 'All'>('All');
  const [showCertifiableOnly, setShowCertifiableOnly] = useState(false);
  const [expandedStandard, setExpandedStandard] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'clauses' | 'checklist'>('overview');
  const [showMap, setShowMap] = useState(false);
  const [checkedChecklistItems, setCheckedChecklistItems] = useState<Record<string, number[]>>({});

  // ── Real API Data ──────────────────────────────────────────────────────
  const { data: backendStandards } = useStandards();

  const normalizeStringList = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
      return value
        .split(/\n|,|;|\|/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  };

  const allStandardsData = useMemo<InternationalStandard[]>(() => {
    if (backendStandards && backendStandards.length > 0) {
      const staticByCode = new Map(
        allInternationalStandards.map((standard) => [normalizeStandardKey(standard.code), standard])
      );
      const staticByTitle = new Map(
        allInternationalStandards.map((standard) => [normalizeStandardKey(standard.title), standard])
      );

      const converted = backendStandards.map((s: any) => {
        const matchingStatic =
          staticByCode.get(normalizeStandardKey(s.standardCode)) ||
          staticByTitle.get(normalizeStandardKey(s.title));

        const normalizedScope = normalizeStringList(s.scope);
        const normalizedPrinciples = normalizeStringList(s.keyPrinciples || s.keyRequirements);
        const normalizedClauses = Array.isArray(s.clauses) ? s.clauses : [];
        const normalizedChecklist = normalizeStringList(s.complianceChecklist || s.implementationChecklist);

        return {
          ...(matchingStatic || {}),
        id: String(s.id),
        code: s.standardCode,
        title: s.title || matchingStatic?.title || '',
        fullTitle: s.fullTitle || matchingStatic?.fullTitle || s.title,
        issuingBody: (s.issuingBody || matchingStatic?.issuingBody || 'ISO') as IssuingBody,
        category: (s.category || matchingStatic?.category || 'Occupational Health & Safety') as StandardCategory,
        description: s.description || matchingStatic?.description || '',
        version: s.edition || s.version || matchingStatic?.version || '',
        yearPublished: Number(s.yearPublished || s.publicationDate || matchingStatic?.yearPublished || new Date().getFullYear()),
        yearRevised: matchingStatic?.yearRevised,
        isCertifiable: Boolean(s.certificationAvailable || s.isCertifiable || matchingStatic?.certificationAvailable),
        status: s.status || 'active',
        scope: normalizedScope.length > 0 ? normalizedScope : matchingStatic?.scope || [],
        keyPrinciples: normalizedPrinciples.length > 0 ? normalizedPrinciples : matchingStatic?.keyPrinciples || [],
        applicableIndustries: normalizeStringList(s.applicableIndustries).length > 0
          ? normalizeStringList(s.applicableIndustries)
          : matchingStatic?.applicableIndustries || [],
        relatedStandards: normalizeStringList(s.relatedStandards).length > 0
          ? normalizeStringList(s.relatedStandards)
          : matchingStatic?.relatedStandards || [],
        clauses: normalizedClauses.length > 0 ? normalizedClauses : matchingStatic?.clauses || [],
        implementationGuidance: normalizeStringList(s.implementationGuidance).length > 0
          ? normalizeStringList(s.implementationGuidance)
          : matchingStatic?.implementationGuidance || [],
        complianceChecklist: normalizedChecklist.length > 0
          ? normalizedChecklist
          : matchingStatic?.complianceChecklist || [],
        certificationAvailable: Boolean(s.certificationAvailable || s.isCertifiable || matchingStatic?.certificationAvailable),
        riskFactors: normalizeStringList(s.riskFactors).length > 0
          ? normalizeStringList(s.riskFactors)
          : matchingStatic?.riskFactors,
      };
      });

      const merged = new Map<string, InternationalStandard>();

      allInternationalStandards.forEach((standard) => {
        merged.set(normalizeStandardKey(standard.code), standard);
      });

      converted.forEach((standard) => {
        const key = normalizeStandardKey(standard.code || standard.title || standard.id);
        merged.set(key, standard);
      });

      return Array.from(merged.values());
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

  const toggleChecklistItem = (standardId: string, itemIndex: number) => {
    setCheckedChecklistItems((current) => {
      const standardItems = current[standardId] || [];
      const isChecked = standardItems.includes(itemIndex);

      return {
        ...current,
        [standardId]: isChecked
          ? standardItems.filter((index) => index !== itemIndex)
          : [...standardItems, itemIndex],
      };
    });
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-primary pb-24 selection:bg-accent/20">
      {/* HD Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-accent/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-primary/10 blur-[150px]" />
      </div>

      {/* Header */}
      <header className="sticky top-[var(--nav-height)] z-40 shrink-0 border-b border-surface-border bg-surface-raised/90 backdrop-blur-2xl">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="group rounded-2xl p-2.5 text-text-muted transition-all hover:bg-surface-overlay"
              >
                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-text-onAccent shadow-soft">
                  <Globe className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-text-primary">Global Standards</h1>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">International Compliance Library</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowMap(!showMap)}
                className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                  showMap ? 'border-accent bg-accent text-text-onAccent' : 'border-surface-border bg-surface-sunken text-text-secondary hover:bg-surface-overlay'
                }`}
              >
                <MapIcon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Compliance Map</span>
              </button>
              <div className="hidden items-center gap-2 rounded-xl border border-surface-border bg-surface-sunken px-4 py-2 lg:flex">
                <BookOpen className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">{filteredStandards.length} Standards</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1440px] px-4 pt-8 sm:px-6 lg:px-8">
        {/* Global Compliance Map (Simulated HD Feature) */}
        <AnimatePresence>
          {showMap && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="mb-12 overflow-hidden"
            >
              <div className="relative overflow-hidden rounded-[2.5rem] border border-surface-border bg-surface-raised p-8 shadow-card backdrop-blur-xl">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-10" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="mb-1 text-2xl font-black text-text-primary">Global Compliance Map</h3>
                      <p className="text-sm text-text-muted">Visualizing safety standard adoption and compliance levels worldwide</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">High Adoption</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Moderate</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative flex aspect-[21/9] items-center justify-center overflow-hidden rounded-3xl border border-surface-border bg-surface-sunken">
                    <Globe className="h-32 w-32 animate-pulse text-surface-border" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-xs font-black uppercase tracking-[0.5em] text-text-muted">Interactive Map Loading...</p>
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
                        <div className="absolute inset-0 h-4 w-4 animate-ping rounded-full bg-accent" />
                        <div className="relative z-10 h-4 w-4 cursor-pointer rounded-full border-2 border-white bg-accent shadow-lg" />
                        <div className="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-surface-border bg-surface-raised px-3 py-1.5 opacity-0 shadow-card transition-opacity group-hover/marker:opacity-100">
                          <p className="text-[10px] font-black uppercase tracking-widest text-text-primary">{m.label}</p>
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
        <div className="mb-12 grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="lg:col-span-2 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 group-focus-within:text-brand-400 transition-colors" />
            <input 
              type="text"
              placeholder="Search standards, codes, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-surface-border bg-surface-raised py-4 pl-12 pr-4 text-sm text-text-primary transition-all placeholder:text-text-muted focus:border-accent/40 focus:outline-none focus:ring-4 focus:ring-accent/10"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full cursor-pointer appearance-none rounded-2xl border border-surface-border bg-surface-raised py-4 pl-10 pr-4 text-sm text-text-primary transition-all focus:border-accent/40 focus:outline-none"
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
              className="w-full cursor-pointer appearance-none rounded-2xl border border-surface-border bg-surface-raised py-4 pl-10 pr-4 text-sm text-text-primary transition-all focus:border-accent/40 focus:outline-none"
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
          className="grid grid-cols-1 items-start gap-6 md:grid-cols-2"
        >
          {filteredStandards.map((std) => {
            const config = categoryConfig[std.category];
            const isExpanded = expandedStandard === std.id;
            
            return (
              <motion.div
                key={std.id}
                variants={itemVariants}
                className={`group self-start overflow-hidden rounded-[2rem] border bg-surface-raised backdrop-blur-md transition-all duration-500 ${
                  isExpanded ? 'border-accent/40 shadow-card' : 'border-surface-border hover:border-accent/30 hover:shadow-soft'
                }`}
              >
                <div className="p-6 sm:p-8">
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className={`p-3 rounded-2xl ${config.bgColor} ${config.color}`}>
                      <config.icon className="w-6 h-6" />
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <span className="rounded-lg border border-surface-border bg-surface-sunken px-2 py-1 text-[8px] font-black uppercase tracking-widest text-text-muted">
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
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-accent">{std.code}</p>
                    <h3 className="text-xl font-bold leading-tight text-text-primary transition-colors group-hover:text-accent">{std.title}</h3>
                  </div>

                  <p className="mb-8 line-clamp-3 text-sm leading-relaxed text-text-muted">
                    {std.description}
                  </p>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <button 
                      onClick={() => setExpandedStandard(isExpanded ? null : std.id)}
                      className="flex w-full items-center justify-between gap-2 whitespace-nowrap rounded-xl border border-surface-border bg-surface-sunken px-4 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-text-muted transition-colors hover:bg-surface-overlay hover:text-text-primary sm:w-auto sm:justify-start sm:border-0 sm:bg-transparent sm:px-0 sm:py-0"
                    >
                      {isExpanded ? 'Show Less' : 'View Details'}
                      <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    
                    <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto">
                      <button 
                        onClick={() => navigate(`/ai-analysis?standard=${std.id}`)}
                        className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-3 py-3 text-[9px] font-bold uppercase tracking-[0.16em] text-text-onAccent transition-all hover:brightness-110 sm:w-auto sm:py-2"
                      >
                        <Sparkles className="h-3.5 w-3.5 shrink-0" />
                        AI Analysis
                      </button>
                      <button 
                        onClick={() => applyToAudit(std)}
                        className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-accent px-3 py-3 text-[9px] font-bold uppercase tracking-[0.14em] text-text-onAccent transition-all hover:brightness-110 sm:w-auto sm:py-2"
                      >
                        <Eye className="h-3.5 w-3.5 shrink-0" />
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
                      className="border-t border-surface-border bg-surface-sunken/70"
                    >
                      <div className="p-8 space-y-8">
                        {/* Tabs */}
                        <div className="flex gap-6 border-b border-surface-border">
                          {['overview', 'clauses', 'checklist'].map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setActiveTab(tab as any)}
                              className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                                activeTab === tab ? 'text-accent' : 'text-text-muted hover:text-text-primary'
                              }`}
                            >
                              {tab}
                              {activeTab === tab && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
                            </button>
                          ))}
                        </div>

                        {activeTab === 'overview' && (
                          <div className="space-y-6">
                            <div>
                              <h4 className="mb-3 text-[10px] font-black uppercase tracking-widest text-text-muted">Scope</h4>
                              <div className="flex flex-wrap gap-2">
                                {std.scope.map((s, i) => (
                                  <span key={i} className="rounded-lg border border-surface-border bg-surface-raised px-3 py-1.5 text-[11px] text-text-secondary">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="mb-3 text-[10px] font-black uppercase tracking-widest text-text-muted">Key Principles</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {std.keyPrinciples.map((p, i) => (
                                  <div key={i} className="flex items-start gap-3 rounded-xl border border-surface-border bg-surface-raised p-3">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span className="text-xs text-text-secondary">{p}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'clauses' && (
                          <div className="space-y-4">
                            {std.clauses?.map((clause, i) => (
                              <div key={i} className="rounded-2xl border border-surface-border bg-surface-raised p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-accent">{clause.clause}</p>
                                  <p className="text-xs font-bold text-text-primary">{clause.title}</p>
                                </div>
                                <p className="mb-3 text-[11px] text-text-muted">{clause.description}</p>
                                <div className="space-y-1">
                                  {clause.keyRequirements.map((req, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-[10px] text-text-secondary">
                                      <div className="h-1 w-1 rounded-full bg-surface-border" />
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
                            {std.complianceChecklist?.map((item, i) => {
                              const isChecked = checkedChecklistItems[std.id]?.includes(i) ?? false;

                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => toggleChecklistItem(std.id, i)}
                                  className={`group/item flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                                    isChecked
                                      ? 'border-accent/30 bg-accent/5'
                                      : 'border-surface-border bg-surface-raised hover:border-accent/30 hover:bg-surface-overlay'
                                  }`}
                                  aria-pressed={isChecked}
                                >
                                  <div
                                    className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all ${
                                      isChecked
                                        ? 'border-accent bg-accent text-text-onAccent'
                                        : 'border-surface-border group-hover/item:border-accent'
                                    }`}
                                  >
                                    <CheckCircle2
                                      className={`h-3 w-3 shrink-0 transition-opacity ${
                                        isChecked ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'
                                      }`}
                                    />
                                  </div>
                                  <span className={`text-xs ${isChecked ? 'text-text-primary' : 'text-text-secondary'}`}>
                                    {item}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <div className="flex gap-4 border-t border-surface-border pt-4">
                          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-surface-border bg-surface-overlay py-3 text-[10px] font-bold uppercase tracking-widest text-text-primary transition-all hover:bg-surface-sunken">
                            <Download className="w-4 h-4" />
                            Download PDF
                          </button>
                          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-surface-border bg-surface-overlay py-3 text-[10px] font-bold uppercase tracking-widest text-text-primary transition-all hover:bg-surface-sunken">
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
