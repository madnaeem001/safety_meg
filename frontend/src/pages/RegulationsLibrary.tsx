import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  allRegulations,
  regulatoryBodies,
  categories,
  managementTabs,
  searchRegulations,
  getRegulationsByBody,
  getRegulationsByTab,
  type Regulation,
  type RegulatoryBody,
  type RegulationCategory,
  type ManagementTab
} from '../data/regulationsLibrary';
import FadeContent from '../components/animations/FadeContent';
import { useRegulations } from '../api/hooks/useAPIHooks';

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

// Regulatory body colors
const bodyColors: Record<RegulatoryBody, { bg: string; text: string; border: string }> = {
  'OSHA': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'EPA': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'NFPA': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'NIOSH': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'ASTM': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'ISO': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'ANSI': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'ACGIH': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'IEC': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'EN': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'CSA': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'AS/NZS': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'OHSAS': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'ILO': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' }
};

// Category icons (using emoji for simplicity)
const categoryIcons: Partial<Record<RegulationCategory, string>> = {
  'General Duty': '⚖️',
  'Walking-Working Surfaces': '🚶',
  'Means of Egress': '🚪',
  'Occupational Health': '🏥',
  'Hazardous Materials': '☢️',
  'Personal Protective Equipment': '🦺',
  'Fire Protection': '🔥',
  'Electrical': '⚡',
  'Machine Guarding': '⚙️',
  'Welding': '🔧',
  'Scaffolding': '🏗️',
  'Fall Protection': '🪂',
  'Excavations': '🕳️',
  'Cranes & Rigging': '🏗️',
  'Air Quality': '💨',
  'Water Quality': '💧',
  'Waste Management': '🗑️',
  'Quality Management': '✅',
  'Environmental Management': '🌍',
  'Industrial Hygiene': '🧪',
  'Exposure Limits': '📊',
  'Testing Methods': '🔬',
  'Fire Safety': '🧯',
  'Life Safety': '🚨',
  'AI & Robotics': '🤖',
  'Machinery Safety': '⚙️',
  'International Standards': '🌐',
  'Risk Management': '🎯',
  'Pre-Task Assessment': '📋'
};

// Tab icons for visual enhancement
const tabIcons: Record<ManagementTab, string> = {
  'All Regulations': '📚',
  'Quality Management': '✅',
  'Industrial Hygiene': '🧪',
  'International Standards': '🌐',
  'AI & Robotics': '🤖',
  'Pre-Task Assessment': '📋'
};

interface RegulationCardProps {
  regulation: Regulation;
  onSelect: (reg: Regulation) => void;
}

const RegulationCard: React.FC<RegulationCardProps> = ({ regulation, onSelect }) => {
  const colors = bodyColors[regulation.regulatoryBody] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(regulation)}
      className="bg-white rounded-2xl border border-surface-200/60 shadow-soft p-5 cursor-pointer transition-all duration-300 hover:border-brand-300"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} ${colors.border} border`}>
              {regulation.regulatoryBody}
            </span>
            {regulation.subpart && (
              <span className="text-xs text-surface-500">{regulation.subpart}</span>
            )}
            {regulation.sourceUrl && (
              <span className="text-xs text-brand-500">🔗</span>
            )}
          </div>
          <h3 className="font-semibold text-surface-900 text-sm leading-tight line-clamp-2">
            {regulation.code}
          </h3>
        </div>
        <span className="text-lg flex-shrink-0" role="img" aria-label={regulation.category}>
          {categoryIcons[regulation.category] || '📋'}
        </span>
      </div>
      
      <h4 className="text-surface-800 font-medium text-sm mb-2 line-clamp-2">
        {regulation.title}
      </h4>
      
      <p className="text-surface-600 text-xs leading-relaxed line-clamp-3 mb-3">
        {regulation.description}
      </p>
      
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-surface-100 text-xs text-surface-600">
          {regulation.category}
        </span>
        {regulation.cfr && (
          <span className="text-xs text-surface-400">{regulation.cfr}</span>
        )}
      </div>
    </motion.div>
  );
};

interface RegulationDetailProps {
  regulation: Regulation;
  onClose: () => void;
}

const RegulationDetail: React.FC<RegulationDetailProps> = ({ regulation, onClose }) => {
  const colors = bodyColors[regulation.regulatoryBody] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-700 text-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur">
                  {regulation.regulatoryBody}
                </span>
                {regulation.year && (
                  <span className="text-white/70 text-xs">{regulation.year}</span>
                )}
              </div>
              <h2 className="text-xl font-bold mb-1">{regulation.code}</h2>
              <h3 className="text-white/90 font-medium">{regulation.title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-160px)]">
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h4 className="text-sm font-semibold text-surface-900 mb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-brand-500 rounded-full"></span>
                Description
              </h4>
              <p className="text-surface-700 text-sm leading-relaxed">{regulation.description}</p>
            </div>
            
            {/* Key Requirements */}
            {regulation.keyRequirements && regulation.keyRequirements.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-surface-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-brand-500 rounded-full"></span>
                  Key Requirements
                </h4>
                <ul className="space-y-2">
                  {regulation.keyRequirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-surface-700">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-medium mt-0.5">
                        {index + 1}
                      </span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-50 rounded-xl p-4">
                <span className="text-xs text-surface-500 uppercase tracking-wide">Category</span>
                <p className="text-sm font-medium text-surface-900 mt-1">{regulation.category}</p>
              </div>
              <div className="bg-surface-50 rounded-xl p-4">
                <span className="text-xs text-surface-500 uppercase tracking-wide">Jurisdiction</span>
                <p className="text-sm font-medium text-surface-900 mt-1">{regulation.jurisdiction || 'Federal'}</p>
              </div>
              {regulation.cfr && (
                <div className="bg-surface-50 rounded-xl p-4">
                  <span className="text-xs text-surface-500 uppercase tracking-wide">CFR Reference</span>
                  <p className="text-sm font-medium text-surface-900 mt-1">{regulation.cfr}</p>
                </div>
              )}
              {regulation.subpart && (
                <div className="bg-surface-50 rounded-xl p-4">
                  <span className="text-xs text-surface-500 uppercase tracking-wide">Subpart</span>
                  <p className="text-sm font-medium text-surface-900 mt-1">{regulation.subpart}</p>
                </div>
              )}
            </div>
            
            {/* Applicable Industries */}
            {regulation.applicableIndustries && regulation.applicableIndustries.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-surface-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-brand-500 rounded-full"></span>
                  Applicable Industries
                </h4>
                <div className="flex flex-wrap gap-2">
                  {regulation.applicableIndustries.map((industry, index) => (
                    <span key={index} className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-medium ${colors.bg} ${colors.text}`}>
                      {industry}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Management Tabs */}
            <div>
              <h4 className="text-sm font-semibold text-surface-900 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-brand-500 rounded-full"></span>
                Applicable Management Areas
              </h4>
              <div className="flex flex-wrap gap-2">
                {regulation.managementTabs.map((tab, index) => (
                  <span key={index} className="inline-flex px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-100 text-surface-700">
                    {tabIcons[tab]} {tab}
                  </span>
                ))}
              </div>
            </div>
            
            {/* View Document Button */}
            {regulation.sourceUrl && (
              <div className="pt-4 border-t border-surface-200">
                <a
                  href={regulation.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/25"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Document
                </a>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const RegulationsLibrary: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBody, setSelectedBody] = useState<RegulatoryBody | 'All'>('All');
  const [selectedTab, setSelectedTab] = useState<ManagementTab>('All Regulations');
  const [selectedRegulation, setSelectedRegulation] = useState<Regulation | null>(null);
  const enableBackendRegulations = import.meta.env.VITE_ENABLE_REGULATIONS_API === 'true';

  // ── Real API Data ───────────────────────────────────────────────────────
  const { data: backendRegs } = useRegulations(undefined, { immediate: enableBackendRegulations });

  // Merge backend regulations with mock data
  const mergedRegulations = useMemo<Regulation[]>(() => {
    if (backendRegs && backendRegs.length > 0) {
      const converted: Regulation[] = backendRegs.map((r: any) => ({
        id: String(r.id),
        title: r.title,
        code: r.regulationCode,
        jurisdiction: r.jurisdiction,
        authority: r.authority,
        category: r.category || 'General',
        body: r.authority,
        description: r.description || '',
        effectiveDate: r.effectiveDate,
        status: r.status || 'active',
        industries: Array.isArray(r.industry) ? r.industry : [],
        summary: r.description || '',
        requirements: [],
        penalties: r.penaltyRange || '',
        documentation: r.documentationRequired || '',
      }));
      return [...allRegulations, ...converted];
    }
    return allRegulations;
  }, [backendRegs]);
  
  const filteredRegulations = useMemo(() => {
    let results = [...mergedRegulations];

    // Filter by management tab
    if (selectedTab !== 'All Regulations') {
      results = results.filter((reg: any) => reg.managementTabs?.includes(selectedTab));
    }

    // Filter by regulatory body
    if (selectedBody !== 'All') {
      results = results.filter((reg: any) => reg.regulatoryBody === selectedBody || reg.body === selectedBody || reg.authority === selectedBody);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter((reg: any) =>
        (reg.code || reg.regulationCode || '').toLowerCase().includes(query) ||
        (reg.title || '').toLowerCase().includes(query) ||
        (reg.description || '').toLowerCase().includes(query) ||
        (reg.category || '').toLowerCase().includes(query) ||
        (reg.keyRequirements && reg.keyRequirements.some((req: string) => req.toLowerCase().includes(query)))
      );
    }

    return results;
  }, [searchQuery, selectedBody, selectedTab, mergedRegulations]);
  
  // Group by regulatory body for summary
  const bodyCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All': allRegulations.length };
    regulatoryBodies.forEach(body => {
      counts[body] = allRegulations.filter(r => r.regulatoryBody === body).length;
    });
    return counts;
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-surface-100/50">
      {/* Header */}
      <header className="sticky top-[72px] z-40 bg-white/80 backdrop-blur-xl border-b border-surface-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-surface-600 hover:text-surface-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>
            <h1 className="text-lg font-bold text-surface-900">Regulations Library</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* Hero Section */}
        <FadeContent>
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-surface-900 mb-2">
              Regulatory Compliance Library
            </h2>
            <p className="text-surface-600">
              Comprehensive database of OSHA, EPA, NFPA, NIOSH, ASTM, ISO, ANSI, IEC, EN, CSA, and AS/NZS regulations
            </p>
          </div>
        </FadeContent>
        
        {/* Management Tabs */}
        <FadeContent delay={0.1}>
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {managementTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedTab === tab
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
                      : 'bg-white text-surface-700 border border-surface-200 hover:border-brand-300 hover:bg-brand-50'
                  }`}
                >
                  {tabIcons[tab]} {tab}
                </button>
              ))}
            </div>
          </div>
        </FadeContent>
        
        {/* Search Bar */}
        <FadeContent delay={0.15}>
          <div className="mb-6">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search regulations by code, title, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-surface-200 rounded-2xl text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-surface-100"
                >
                  <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </FadeContent>
        
        {/* Regulatory Body Filter */}
        <FadeContent delay={0.2}>
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedBody('All')}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedBody === 'All'
                    ? 'bg-surface-900 text-white'
                    : 'bg-white text-surface-600 border border-surface-200 hover:border-surface-300'
                }`}
              >
                All ({bodyCounts['All']})
              </button>
              {regulatoryBodies.map((body) => {
                const colors = bodyColors[body] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
                return (
                  <button
                    key={body}
                    onClick={() => setSelectedBody(body)}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                      selectedBody === body
                        ? `${colors.bg} ${colors.text} ${colors.border}`
                        : 'bg-white text-surface-600 border-surface-200 hover:border-surface-300'
                    }`}
                  >
                    {body} ({bodyCounts[body] || 0})
                  </button>
                );
              })}
            </div>
          </div>
        </FadeContent>
        
        {/* Results Count */}
        <FadeContent delay={0.25}>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-surface-600">
              Showing <span className="font-semibold text-surface-900">{filteredRegulations.length}</span> regulations
            </p>
            {(searchQuery || selectedBody !== 'All' || selectedTab !== 'All Regulations') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedBody('All');
                  setSelectedTab('All Regulations');
                }}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        </FadeContent>
        
        {/* Regulations Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredRegulations.map((regulation) => (
            <RegulationCard
              key={regulation.id}
              regulation={regulation}
              onSelect={setSelectedRegulation}
            />
          ))}
        </motion.div>
        
        {/* Empty State */}
        {filteredRegulations.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-surface-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-surface-900 mb-2">No regulations found</h3>
            <p className="text-surface-600 mb-4">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedBody('All');
                setSelectedTab('All Regulations');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
            >
              Reset filters
            </button>
          </motion.div>
        )}
      </main>
      
      {/* Regulation Detail Modal */}
      <AnimatePresence>
        {selectedRegulation && (
          <RegulationDetail
            regulation={selectedRegulation}
            onClose={() => setSelectedRegulation(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegulationsLibrary;
