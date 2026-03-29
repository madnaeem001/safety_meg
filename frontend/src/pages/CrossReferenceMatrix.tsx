import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStandardRelationships, useStandardRelationshipStats } from '../api/hooks/useAPIHooks';
import type { StandardRelationshipRecord } from '../api/services/apiService';
import { allInternationalStandards } from '../data/internationalStandards';
import FadeContent from '../components/animations/FadeContent';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
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

const relationshipConfig: Record<string, { color: string; bgColor: string; icon: string; description: string }> = {
  compatible: { 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-50', 
    icon: '🔄',
    description: 'Can be implemented together without conflicts'
  },
  integrated: { 
    color: 'text-green-700', 
    bgColor: 'bg-green-50', 
    icon: '🔗',
    description: 'Designed to work as one unified system'
  },
  prerequisite: { 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-50', 
    icon: '📌',
    description: 'Source standard is required before target'
  },
  complementary: { 
    color: 'text-amber-700', 
    bgColor: 'bg-amber-50', 
    icon: '🤝',
    description: 'Standards enhance each other when combined'
  },
  overlapping: { 
    color: 'text-orange-700', 
    bgColor: 'bg-orange-50', 
    icon: '⭕',
    description: 'Shared requirements can be consolidated'
  }
};

export const CrossReferenceMatrix: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRelationship, setSelectedRelationship] = useState<string>('all');
  const [selectedStandard, setSelectedStandard] = useState<string>('all');
  const [expandedRelation, setExpandedRelation] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');

  const { data: backendRelationships } = useStandardRelationships();
  const { data: backendStats } = useStandardRelationshipStats();
  const stdRelationships: StandardRelationshipRecord[] = backendRelationships ?? [];

  // Get unique standards from relationships
  const standardsInMatrix = useMemo(() => {
    const ids = new Set<string>();
    stdRelationships.forEach(r => {
      ids.add(r.sourceStandardId);
      ids.add(r.targetStandardId);
    });
    return allInternationalStandards.filter(std => ids.has(std.id));
  }, [stdRelationships]);

  // Filter relationships
  const filteredRelationships = useMemo(() => {
    return stdRelationships.filter(rel => {
      const sourceStd = allInternationalStandards.find(s => s.id === rel.sourceStandardId);
      const targetStd = allInternationalStandards.find(s => s.id === rel.targetStandardId);
      
      const matchesSearch = searchQuery === '' || 
        sourceStd?.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        targetStd?.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rel.integrationNotes.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRelationship = selectedRelationship === 'all' || rel.relationshipType === selectedRelationship;
      const matchesStandard = selectedStandard === 'all' || 
        rel.sourceStandardId === selectedStandard || 
        rel.targetStandardId === selectedStandard;
      
      return matchesSearch && matchesRelationship && matchesStandard;
    });
  }, [stdRelationships, searchQuery, selectedRelationship, selectedStandard]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = backendStats?.total ?? stdRelationships.length;
    const byType: Record<string, number> = backendStats?.byType ?? {};
    if (!backendStats) {
      stdRelationships.forEach(r => {
        byType[r.relationshipType] = (byType[r.relationshipType] || 0) + 1;
      });
    }
    return { total, byType };
  }, [stdRelationships, backendStats]);

  const getStandardInfo = (standardId: string) => {
    return allInternationalStandards.find(s => s.id === standardId);
  };

  // Build matrix data for matrix view
  const matrixData = useMemo(() => {
    const matrix: Record<string, Record<string, StandardRelationshipRecord | null>> = {};
    standardsInMatrix.forEach(std => {
      matrix[std.id] = {};
      standardsInMatrix.forEach(other => {
        if (std.id === other.id) {
          matrix[std.id][other.id] = null;
        } else {
          const rel = stdRelationships.find(
            r => (r.sourceStandardId === std.id && r.targetStandardId === other.id) ||
                 (r.sourceStandardId === other.id && r.targetStandardId === std.id)
          );
          matrix[std.id][other.id] = rel || null;
        }
      });
    });
    return matrix;
  }, [standardsInMatrix, stdRelationships]);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="bg-gradient-to-br from-cyan-600 via-cyan-500 to-teal-500 pt-12 pb-8 px-4 safe-top">
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
            <h1 className="page-title">Cross-Reference Matrix</h1>
            <p className="page-subtitle">Standards integration mapping</p>
          </div>
          <div className="flex gap-1 bg-white/20 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-cyan-600' : 'text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'matrix' ? 'bg-white text-cyan-600' : 'text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Relationship Type Cards */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {Object.entries(relationshipConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedRelationship(selectedRelationship === key ? 'all' : key)}
              className={`flex-none px-3 py-2 rounded-xl transition-all ${
                selectedRelationship === key 
                  ? 'bg-white text-cyan-700 shadow-lg' 
                  : 'bg-white/15 text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{config.icon}</span>
                <div className="text-left">
                  <p className="text-xs font-medium capitalize">{key}</p>
                  <p className="text-[10px] opacity-75">{metrics.byType[key] || 0} pairs</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 -mt-4">
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm border border-surface-200 dark:border-surface-700">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search standards..."
                className="w-full pl-9 pr-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value)}
              className="px-3 py-2 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm"
            >
              <option value="all">All Standards</option>
              {standardsInMatrix.map(std => (
                <option key={std.id} value={std.id}>{std.code}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        /* List View */
        <FadeContent>
          <motion.div 
            className="px-4 mt-4 space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {filteredRelationships.map((rel, index) => {
                const config = relationshipConfig[rel.relationshipType];
                const sourceStd = getStandardInfo(rel.sourceStandardId);
                const targetStd = getStandardInfo(rel.targetStandardId);
                const isExpanded = expandedRelation === `${rel.sourceStandardId}-${rel.targetStandardId}`;
                const key = `${rel.sourceStandardId}-${rel.targetStandardId}`;

                return (
                  <motion.div
                    key={key}
                    variants={itemVariants}
                    layout
                    className="bg-white dark:bg-surface-800 rounded-xl shadow-sm overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedRelation(isExpanded ? null : key)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        {/* Source Standard */}
                        <div className="flex-1 min-w-0 text-center">
                          <div className="w-12 h-12 mx-auto mb-1 rounded-xl bg-cyan-50 flex items-center justify-center">
                            <span className="text-xl">📋</span>
                          </div>
                          <p className="font-bold text-text-primary text-sm">
                            {sourceStd?.code || rel.sourceStandardId}
                          </p>
                          <p className="text-xs text-surface-500 line-clamp-1">
                            {sourceStd?.title}
                          </p>
                        </div>

                        {/* Relationship Type */}
                        <div className="flex flex-col items-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                            {config.icon}
                          </span>
                          <svg className="w-16 h-4 text-surface-300 my-1" viewBox="0 0 64 16">
                            <path d="M0 8h54l-6-6M54 8l-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="text-xs text-surface-500 capitalize">{rel.relationshipType}</span>
                        </div>

                        {/* Target Standard */}
                        <div className="flex-1 min-w-0 text-center">
                          <div className="w-12 h-12 mx-auto mb-1 rounded-xl bg-teal-50 flex items-center justify-center">
                            <span className="text-xl">📋</span>
                          </div>
                          <p className="font-bold text-text-primary text-sm">
                            {targetStd?.code || rel.targetStandardId}
                          </p>
                          <p className="text-xs text-surface-500 line-clamp-1">
                            {targetStd?.title}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-surface-600 dark:text-surface-400 mt-3 text-center">
                        {rel.integrationNotes}
                      </p>
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
                            {/* Synergies */}
                            <div>
                              <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                                <span className="text-green-500">✨</span> Synergies
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {rel.synergies.map((synergy, i) => (
                                  <span key={i} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
                                    {synergy}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Mapped Clauses */}
                            <div>
                              <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                                <span className="text-cyan-500">🔗</span> Clause Mappings
                              </h4>
                              <div className="space-y-2">
                                {rel.mappedClauses.map((mapping, i) => (
                                  <div key={i} className="p-3 bg-surface-50 dark:bg-surface-900 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded text-xs font-medium">
                                        {mapping.sourceClauses.join(', ')}
                                      </span>
                                      <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                      </svg>
                                      <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-xs font-medium">
                                        {mapping.targetClauses.join(', ')}
                                      </span>
                                    </div>
                                    <p className="text-sm text-surface-600 dark:text-surface-400">
                                      {mapping.description}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredRelationships.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <p className="text-surface-500 dark:text-surface-400">No relationships match your filters</p>
              </div>
            )}
          </motion.div>
        </FadeContent>
      ) : (
        /* Matrix View */
        <div className="px-4 mt-4">
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-surface-50 dark:bg-surface-900 p-2 border-b border-r border-surface-200 dark:border-surface-700 z-10">
                      Standards
                    </th>
                    {standardsInMatrix.slice(0, 6).map(std => (
                      <th key={std.id} className="p-2 border-b border-surface-200 dark:border-surface-700 min-w-[60px]">
                        <div className="font-medium text-surface-700 dark:text-surface-300 truncate" title={std.code}>
                          {std.code.split(' ')[0]}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {standardsInMatrix.slice(0, 6).map(rowStd => (
                    <tr key={rowStd.id}>
                      <td className="sticky left-0 bg-surface-50 dark:bg-surface-900 p-2 border-r border-surface-200 dark:border-surface-700 font-medium text-surface-700 dark:text-surface-300 z-10">
                        {rowStd.code.split(' ')[0]}
                      </td>
                      {standardsInMatrix.slice(0, 6).map(colStd => {
                        if (rowStd.id === colStd.id) {
                          return (
                            <td key={colStd.id} className="p-2 text-center bg-surface-100 dark:bg-surface-800">
                              -
                            </td>
                          );
                        }
                        const rel = matrixData[rowStd.id]?.[colStd.id];
                        if (!rel) {
                          return (
                            <td key={colStd.id} className="p-2 text-center text-surface-300">
                              ○
                            </td>
                          );
                        }
                        const config = relationshipConfig[rel.relationshipType];
                        return (
                          <td key={colStd.id} className="p-2 text-center">
                            <button
                              onClick={() => setExpandedRelation(expandedRelation === `${rel.sourceStandardId}-${rel.targetStandardId}` ? null : `${rel.sourceStandardId}-${rel.targetStandardId}`)}
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${config.bgColor} ${config.color} transition-transform active:scale-95`}
                              title={`${rel.relationshipType}: ${rel.integrationNotes}`}
                            >
                              {config.icon}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="p-3 border-t border-surface-100 dark:border-surface-700">
              <p className="text-xs text-surface-500 mb-2">Relationship Types:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(relationshipConfig).map(([key, config]) => (
                  <div key={key} className={`inline-flex items-center gap-1 px-2 py-1 rounded ${config.bgColor}`}>
                    <span>{config.icon}</span>
                    <span className={`text-xs ${config.color} capitalize`}>{key}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Relationship Detail */}
          <AnimatePresence>
            {expandedRelation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mt-4 bg-white dark:bg-surface-800 rounded-xl shadow-sm p-4"
              >
                {(() => {
                  const rel = stdRelationships.find(
                    r => `${r.sourceStandardId}-${r.targetStandardId}` === expandedRelation ||
                         `${r.targetStandardId}-${r.sourceStandardId}` === expandedRelation
                  ) || filteredRelationships.find(r => 
                    `${r.sourceStandardId}-${r.targetStandardId}` === expandedRelation
                  );
                  
                  if (!rel) return null;
                  const config = relationshipConfig[rel.relationshipType];
                  const sourceStd = getStandardInfo(rel.sourceStandardId);
                  const targetStd = getStandardInfo(rel.targetStandardId);

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                            {config.icon} {rel.relationshipType}
                          </span>
                        </div>
                        <button
                          onClick={() => setExpandedRelation(null)}
                          className="p-1 rounded-full hover:bg-surface-100 dark:hover:bg-surface-700"
                        >
                          <svg className="w-5 h-5 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                        {sourceStd?.code} ↔ {targetStd?.code}
                      </p>
                      <p className="text-sm text-surface-600 dark:text-surface-400">
                        {rel.integrationNotes}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {rel.synergies.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CrossReferenceMatrix;
