import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  type GapSeverity,
} from '../data/complianceManagement';
import { allInternationalStandards } from '../data/internationalStandards';
import FadeContent from '../components/animations/FadeContent';
import { useComplianceGapAnalysis, useUpdateGapItem } from '../api/hooks/useAPIHooks';
import type { GapAnalysisItemRecord } from '../api/services/apiService';

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

const severityConfig: Record<GapSeverity, { color: string; bgColor: string; borderColor: string; icon: string }> = {
  critical: { color: 'text-danger', bgColor: 'bg-danger/10', borderColor: 'border-danger/40', icon: '🚨' },
  major: { color: 'text-warning', bgColor: 'bg-warning/10', borderColor: 'border-warning/40', icon: '⚠️' },
  minor: { color: 'text-warning', bgColor: 'bg-warning/5', borderColor: 'border-warning/20', icon: '📋' },
  observation: { color: 'text-accent', bgColor: 'bg-accent/10', borderColor: 'border-accent/30', icon: '💡' }
};

const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  open: { color: 'text-danger', bgColor: 'bg-danger/10', label: 'Open' },
  in_progress: { color: 'text-warning', bgColor: 'bg-warning/10', label: 'In Progress' },
  resolved: { color: 'text-success', bgColor: 'bg-success/10', label: 'Resolved' },
  accepted_risk: { color: 'text-accent', bgColor: 'bg-accent/10', label: 'Risk Accepted' }
};

const effortConfig: Record<string, { color: string; dots: number }> = {
  low: { color: 'text-success', dots: 1 },
  medium: { color: 'text-warning', dots: 2 },
  high: { color: 'text-danger', dots: 3 }
};

const fallbackSeverity = severityConfig.minor;
const fallbackStatus = { color: 'text-surface-600', bgColor: 'bg-surface-100', label: 'Unknown' };
const fallbackEffort = { color: 'text-surface-500', dots: 1 };

export const ComplianceGapAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStandard, setSelectedStandard] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<GapSeverity | 'all'>('all');

  // ── Real API Data ──────────────────────────────────────────────────────
  const { data: backendGapAnalysis, refetch } = useComplianceGapAnalysis();
  const updateGap = useUpdateGapItem();

  const gaps: GapAnalysisItemRecord[] = useMemo(
    () => (Array.isArray(backendGapAnalysis) ? backendGapAnalysis : []),
    [backendGapAnalysis],
  );
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedGap, setExpandedGap] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Get unique standards from gaps
  const standardsInGaps = useMemo(() => {
    const ids = [...new Set(gaps.map(g => g.standardId))];
    return allInternationalStandards.filter(std => ids.includes(std.id));
  }, [gaps]);

  // Filter gaps
  const filteredGaps = useMemo(() => {
    return gaps.filter(gap => {
      const matchesSearch = searchQuery === '' ||
        gap.clauseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gap.requirement.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gap.gap.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStandard = selectedStandard === 'all' || gap.standardId === selectedStandard;
      const matchesSeverity = selectedSeverity === 'all' || gap.severity === selectedSeverity;
      const matchesStatus = selectedStatus === 'all' || gap.status === selectedStatus;

      return matchesSearch && matchesStandard && matchesSeverity && matchesStatus;
    });
  }, [gaps, searchQuery, selectedStandard, selectedSeverity, selectedStatus]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = gaps.length;
    const critical = gaps.filter(g => g.severity === 'critical').length;
    const open = gaps.filter(g => g.status === 'open').length;
    const inProgress = gaps.filter(g => g.status === 'in_progress').length;
    const resolved = gaps.filter(g => g.status === 'resolved').length;
    const overdue = gaps.filter(g => {
      if (!g.targetDate) return false;
      return new Date(g.targetDate) < new Date() && g.status !== 'resolved';
    }).length;

    return { total, critical, open, inProgress, resolved, overdue };
  }, [gaps]);

  const handleStatusChange = (gapId: number, newStatus: GapAnalysisItemRecord['status']) => {
    updateGap.mutate({ id: gapId, data: { status: newStatus } }).then(() => refetch());
  };

  const getStandardName = (standardId: string) => {
    const std = allInternationalStandards.find(s => s.id === standardId);
    return std?.code || standardId;
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="bg-gradient-to-br from-sage-600 via-sage-500 to-emerald-500 pt-12 pb-8 px-4 safe-top">
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
            <h1 className="page-title">Gap Analysis</h1>
            <p className="text-sage-100 text-sm">Compliance gap assessment & tracking</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-text-primary">{metrics.total}</p>
            <p className="text-xs text-sage-100">Total Gaps</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-200">{metrics.critical}</p>
            <p className="text-xs text-sage-100">Critical</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-200">{metrics.overdue}</p>
            <p className="text-xs text-sage-100">Overdue</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 -mt-4">
        <div className="bg-surface-raised rounded-xl p-4 shadow-sm border border-surface-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-primary">Remediation Progress</span>
            <span className="text-sm font-bold text-sage-600">{metrics.total > 0 ? Math.round((metrics.resolved / metrics.total) * 100) : 0}%</span>
          </div>
          <div className="h-3 bg-surface-border rounded-full overflow-hidden flex">
            <div 
              className="bg-green-500 transition-all duration-500" 
              style={{ width: `${metrics.total > 0 ? (metrics.resolved / metrics.total) * 100 : 0}%` }}
            />
            <div 
              className="bg-amber-500 transition-all duration-500" 
              style={{ width: `${metrics.total > 0 ? (metrics.inProgress / metrics.total) * 100 : 0}%` }}
            />
            <div 
              className="bg-red-400 transition-all duration-500" 
              style={{ width: `${metrics.total > 0 ? (metrics.open / metrics.total) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Resolved ({metrics.resolved})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> In Progress ({metrics.inProgress})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400" /> Open ({metrics.open})
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 mt-4">
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search gaps..."
              className="w-full pl-9 pr-4 py-2.5 bg-surface-raised border border-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent text-text-primary"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <select
            value={selectedStandard}
            onChange={(e) => setSelectedStandard(e.target.value)}
            className="px-3 py-2 bg-surface-raised border border-surface-border rounded-lg text-sm min-w-[120px] text-text-primary"
          >
            <option value="all">All Standards</option>
            {standardsInGaps.map(std => (
              <option key={std.id} value={std.id}>{std.code}</option>
            ))}
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value as GapSeverity | 'all')}
            className="px-3 py-2 bg-surface-raised border border-surface-border rounded-lg text-sm min-w-[100px] text-text-primary"
          >
            <option value="all">All Severity</option>
            <option value="critical">🚨 Critical</option>
            <option value="major">⚠️ Major</option>
            <option value="minor">📋 Minor</option>
            <option value="observation">💡 Observation</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-surface-raised border border-surface-border rounded-lg text-sm min-w-[100px] text-text-primary"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="accepted_risk">Risk Accepted</option>
          </select>
        </div>
      </div>

      {/* Gap Items */}
      <FadeContent>
        <motion.div 
          className="px-4 mt-4 space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {filteredGaps.map((gap, index) => {
              const severity = severityConfig[gap.severity] ?? fallbackSeverity;
              const status = statusConfig[gap.status] ?? fallbackStatus;
              const effort = effortConfig[gap.effort] ?? fallbackEffort;
              const isExpanded = expandedGap === gap.id;
              const gapKey = String(gap.id ?? `${gap.standardId}-${gap.clauseId ?? 'unknown'}-${index}`);

              return (
                <motion.div
                  key={gapKey}
                  variants={itemVariants}
                  layout
                  className={`bg-surface-raised rounded-xl border-l-4 ${severity.borderColor} shadow-sm overflow-hidden`}
                >
                  <button
                    onClick={() => setExpandedGap(isExpanded ? null : gap.id)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${severity.bgColor} ${severity.color}`}>
                            {severity.icon} {gap.severity}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-text-primary line-clamp-1">
                          {gap.clauseTitle}
                        </h3>
                        <p className="text-sm text-text-muted mt-0.5">
                          {getStandardName(gap.standardId)} • Clause {(gap.clauseId ?? 'N/A').split('-').pop()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-text-muted">Priority</span>
                        <span className="text-lg font-bold text-text-primary">#{gap.priority}</span>
                      </div>
                    </div>

                    <p className="text-sm text-text-muted mt-2 line-clamp-2">
                      {gap.gap}
                    </p>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-text-muted">Effort:</span>
                        <span className={`flex gap-0.5 ${effort.color}`}>
                          {[...Array(3)].map((_, i) => (
                            <span key={i} className={`w-2 h-2 rounded-full ${i < effort.dots ? 'bg-current' : 'bg-surface-border'}`} />
                          ))}
                        </span>
                      </div>
                      {gap.targetDate && (
                        <span className={`text-xs ${new Date(gap.targetDate) < new Date() && gap.status !== 'resolved' ? 'text-danger' : 'text-text-muted'}`}>
                          Target: {new Date(gap.targetDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-surface-border"
                      >
                        <div className="p-4 space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Requirement</h4>
                            <p className="text-sm text-text-primary">{gap.requirement}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Current State</h4>
                              <p className="text-sm text-text-muted">{gap.currentState}</p>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Desired State</h4>
                              <p className="text-sm text-text-muted">{gap.desiredState}</p>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Impact</h4>
                            <p className="text-sm text-text-muted">{gap.impact}</p>
                          </div>

                          <div>
                            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Remediation Plan</h4>
                            <p className="text-sm text-text-primary">{gap.remediation}</p>
                          </div>

                          {gap.owner && (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-sage-700">{gap.owner.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-text-primary">{gap.owner}</p>
                                <p className="text-xs text-text-muted">Assigned Owner</p>
                              </div>
                            </div>
                          )}

                          {/* Status Actions */}
                          <div className="flex gap-2 pt-2">
                            {gap.status === 'open' && (
                              <button
                                onClick={() => handleStatusChange(gap.id, 'in_progress')}
                                className="flex-1 py-2 bg-warning/10 text-warning rounded-lg text-sm font-medium active:scale-98 transition-transform"
                              >
                                Start Work
                              </button>
                            )}
                            {gap.status === 'in_progress' && (
                              <button
                                onClick={() => handleStatusChange(gap.id, 'resolved')}
                                className="flex-1 py-2 bg-success/10 text-success rounded-lg text-sm font-medium active:scale-98 transition-transform"
                              >
                                Mark Resolved
                              </button>
                            )}
                            {gap.status !== 'accepted_risk' && gap.status !== 'resolved' && (
                              <button
                                onClick={() => handleStatusChange(gap.id, 'accepted_risk')}
                                className="flex-1 py-2 bg-accent/10 text-accent rounded-lg text-sm font-medium active:scale-98 transition-transform"
                              >
                                Accept Risk
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredGaps.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-text-muted">No gaps match your filters</p>
            </div>
          )}
        </motion.div>
      </FadeContent>
    </div>
  );
};

export default ComplianceGapAnalysis;
