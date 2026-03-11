import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  type CertificationRecord,
  type CertificationStatus,
} from '../data/complianceManagement';
import FadeContent from '../components/animations/FadeContent';
import { useStandardCertifications, useStandardCertStats } from '../api/hooks/useAPIHooks';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
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

const statusConfig: Record<CertificationStatus, { color: string; bgColor: string; borderColor: string; icon: string; label: string }> = {
  certified: { color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-400', icon: '✅', label: 'Certified' },
  in_audit: { color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-400', icon: '🔍', label: 'In Audit' },
  not_certified: { color: 'text-surface-600', bgColor: 'bg-surface-50', borderColor: 'border-surface-300', icon: '📋', label: 'Not Certified' },
  expired: { color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-400', icon: '⏰', label: 'Expired' },
  suspended: { color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-400', icon: '⚠️', label: 'Suspended' }
};

export const CertificationTracker: React.FC = () => {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<CertificationStatus | 'all'>('all');
  const [expandedCert, setExpandedCert] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'clauses' | 'audit'>('overview');

  // ── Real API Data ───────────────────────────────────────────────────────
  const { data: certsData } = useStandardCertifications(
    selectedStatus !== 'all' ? { status: selectedStatus } : undefined
  );
  const { data: statsData } = useStandardCertStats();

  const certifications: CertificationRecord[] = useMemo(() => {
    if (!certsData) return [];
    return certsData.map((c: any) => ({
      id: String(c.id),
      standardId: c.standardId ?? '',
      standardCode: c.standardCode ?? '',
      standardTitle: c.standardTitle ?? '',
      status: (c.status ?? 'not_certified') as CertificationStatus,
      certificationBody: c.certificationBody,
      certificateNumber: c.certificateNumber,
      initialCertDate: c.initialCertDate,
      expiryDate: c.expiryDate,
      lastSurveillanceDate: c.lastSurveillanceDate,
      nextSurveillanceDate: c.nextSurveillanceDate,
      scope: Array.isArray(c.scope) ? c.scope : [],
      locations: Array.isArray(c.locations) ? c.locations : [],
      overallScore: c.overallScore,
      clauseScores: Array.isArray(c.clauseScores) ? c.clauseScores : [],
      nonConformities: Array.isArray(c.nonConformities) ? c.nonConformities : [],
      auditHistory: Array.isArray(c.auditHistory) ? c.auditHistory : [],
    }));
  }, [certsData]);

  // When status filter changes, expandedCert may no longer be visible — reset it
  useEffect(() => {
    setExpandedCert(null);
  }, [selectedStatus]);

  // filteredCerts: status filter is passed to the API, so certifications already filtered
  const filteredCerts = certifications;

  // Calculate metrics — use statsData when available for accurate total counts
  const metrics = useMemo(() => {
    const total = statsData?.total ?? certifications.length;
    const certified = statsData?.certified ?? certifications.filter(c => c.status === 'certified').length;
    const inAudit = statsData?.inAudit ?? certifications.filter(c => c.status === 'in_audit').length;
    const expiringSoon = statsData?.expiringSoon ?? certifications.filter(c => {
      if (!c.expiryDate || c.status !== 'certified') return false;
      const expiry = new Date(c.expiryDate);
      const threeMonths = new Date();
      threeMonths.setMonth(threeMonths.getMonth() + 3);
      return expiry <= threeMonths;
    }).length;
    const avgScore = statsData?.avgScore ?? (
      certifications
        .filter(c => c.overallScore !== undefined)
        .reduce((sum, c) => sum + (c.overallScore || 0), 0) /
      (certifications.filter(c => c.overallScore !== undefined).length || 1)
    );
    return { total, certified, inAudit, expiringSoon, avgScore };
  }, [certifications, statsData]);

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getExpiryColor = (days: number) => {
    if (days < 0) return 'text-red-600 bg-red-50';
    if (days < 30) return 'text-red-600 bg-red-50';
    if (days < 90) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-500 pt-12 pb-8 px-4 safe-top">
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
            <h1 className="text-2xl font-bold text-white">Certification Tracker</h1>
            <p className="text-indigo-100 text-sm">Standards certification management</p>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-center">
            <p className="text-xl font-bold text-white">{metrics.total}</p>
            <p className="text-xs text-indigo-100">Standards</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-center">
            <p className="text-xl font-bold text-green-200">{metrics.certified}</p>
            <p className="text-xs text-indigo-100">Certified</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-center">
            <p className="text-xl font-bold text-amber-200">{metrics.expiringSoon}</p>
            <p className="text-xs text-indigo-100">Expiring</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-center">
            <p className="text-xl font-bold text-white">{Math.round(metrics.avgScore)}%</p>
            <p className="text-xs text-indigo-100">Avg Score</p>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="px-4 -mt-4">
        <div className="bg-white dark:bg-surface-800 rounded-xl p-1.5 shadow-sm border border-surface-200 dark:border-surface-700 flex gap-1 overflow-x-auto">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`flex-1 min-w-[60px] py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
              selectedStatus === 'all' 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-surface-600 hover:bg-surface-50'
            }`}
          >
            All
          </button>
          {(Object.entries(statusConfig) as [CertificationStatus, typeof statusConfig.certified][]).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedStatus(key)}
              className={`flex-1 min-w-[60px] py-2 px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                selectedStatus === key 
                  ? `${config.bgColor} ${config.color}` 
                  : 'text-surface-600 hover:bg-surface-50'
              }`}
            >
              {config.icon} {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Certification Cards */}
      <FadeContent>
        <motion.div 
          className="px-4 mt-4 space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {filteredCerts.map((cert) => {
              const status = statusConfig[cert.status];
              const isExpanded = expandedCert === cert.id;
              const daysUntilExpiry = cert.expiryDate ? getDaysUntilExpiry(cert.expiryDate) : null;

              return (
                <motion.div
                  key={cert.id}
                  variants={itemVariants}
                  layout
                  className={`bg-white dark:bg-surface-800 rounded-xl border-l-4 ${status.borderColor} shadow-sm overflow-hidden`}
                >
                  <button
                    onClick={() => setExpandedCert(isExpanded ? null : cert.id)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                            {status.icon} {status.label}
                          </span>
                          {daysUntilExpiry !== null && cert.status === 'certified' && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getExpiryColor(daysUntilExpiry)}`}>
                              {daysUntilExpiry < 0 ? 'Expired' : daysUntilExpiry === 0 ? 'Today' : `${daysUntilExpiry}d left`}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-lg text-surface-900 dark:text-surface-100">
                          {cert.standardCode}
                        </h3>
                        <p className="text-sm text-surface-500 mt-0.5 line-clamp-1">
                          {cert.standardTitle}
                        </p>
                      </div>
                      {cert.overallScore !== undefined && (
                        <div className="relative w-14 h-14">
                          <svg className="w-14 h-14 -rotate-90">
                            <circle
                              cx="28"
                              cy="28"
                              r="24"
                              strokeWidth="5"
                              className="fill-none stroke-surface-100 dark:stroke-surface-700"
                            />
                            <circle
                              cx="28"
                              cy="28"
                              r="24"
                              strokeWidth="5"
                              strokeDasharray={`${(cert.overallScore / 100) * 150.8} 150.8`}
                              className={`fill-none ${cert.overallScore >= 90 ? 'stroke-green-500' : cert.overallScore >= 70 ? 'stroke-amber-500' : 'stroke-red-500'}`}
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-surface-700 dark:text-surface-300">
                            {cert.overallScore}
                          </span>
                        </div>
                      )}
                    </div>

                    {cert.certificationBody && (
                      <p className="text-xs text-surface-400 mt-2">
                        Certified by {cert.certificationBody} • #{cert.certificateNumber}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {cert.scope.slice(0, 3).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-surface-100 dark:bg-surface-700 rounded text-xs text-surface-600 dark:text-surface-400">
                          {s}
                        </span>
                      ))}
                      {cert.scope.length > 3 && (
                        <span className="px-2 py-0.5 bg-surface-100 dark:bg-surface-700 rounded text-xs text-surface-500">
                          +{cert.scope.length - 3} more
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
                        className="border-t border-surface-100 dark:border-surface-700"
                      >
                        {/* Tab Navigation */}
                        <div className="flex border-b border-surface-100 dark:border-surface-700">
                          {['overview', 'clauses', 'audit'].map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setActiveTab(tab as typeof activeTab)}
                              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                                activeTab === tab
                                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                                  : 'text-surface-500 hover:text-surface-700'
                              }`}
                            >
                              {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                          ))}
                        </div>

                        <div className="p-4">
                          {activeTab === 'overview' && (
                            <div className="space-y-4">
                              {/* Key Dates */}
                              <div className="grid grid-cols-2 gap-3">
                                {cert.initialCertDate && (
                                  <div className="p-3 bg-surface-50 dark:bg-surface-900 rounded-lg">
                                    <p className="text-xs text-surface-500">Initial Certification</p>
                                    <p className="font-medium text-surface-700 dark:text-surface-300">
                                      {new Date(cert.initialCertDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                                {cert.expiryDate && (
                                  <div className="p-3 bg-surface-50 dark:bg-surface-900 rounded-lg">
                                    <p className="text-xs text-surface-500">Expiry Date</p>
                                    <p className="font-medium text-surface-700 dark:text-surface-300">
                                      {new Date(cert.expiryDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                                {cert.nextSurveillanceDate && (
                                  <div className="p-3 bg-surface-50 dark:bg-surface-900 rounded-lg">
                                    <p className="text-xs text-surface-500">Next Surveillance</p>
                                    <p className="font-medium text-surface-700 dark:text-surface-300">
                                      {new Date(cert.nextSurveillanceDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Locations */}
                              <div>
                                <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Locations</h4>
                                <div className="space-y-1">
                                  {cert.locations.map((loc, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                                      <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      </svg>
                                      {loc}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Non-Conformities */}
                              {cert.nonConformities.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Non-Conformities</h4>
                                  <div className="space-y-2">
                                    {cert.nonConformities.map((nc) => (
                                      <div key={nc.id} className={`p-2 rounded-lg flex items-start gap-2 ${nc.status === 'open' ? 'bg-red-50' : 'bg-green-50'}`}>
                                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${nc.type === 'major' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>
                                          {nc.type}
                                        </span>
                                        <p className="text-sm text-surface-700 flex-1">{nc.description}</p>
                                        <span className={`text-xs ${nc.status === 'open' ? 'text-red-600' : 'text-green-600'}`}>
                                          {nc.status}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {activeTab === 'clauses' && (
                            <div className="space-y-2">
                              {cert.clauseScores.length > 0 ? (
                                cert.clauseScores.map((clause) => (
                                  <div key={clause.clauseId} className="flex items-center gap-3 p-2 bg-surface-50 dark:bg-surface-900 rounded-lg">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                                        Clause {clause.clauseId.split('-').pop()}
                                      </p>
                                      <p className="text-xs text-surface-500">{clause.notes}</p>
                                    </div>
                                    <div className="w-12 h-12 relative">
                                      <svg className="w-12 h-12 -rotate-90">
                                        <circle cx="24" cy="24" r="20" strokeWidth="4" className="fill-none stroke-surface-200 dark:stroke-surface-600" />
                                        <circle
                                          cx="24" cy="24" r="20" strokeWidth="4"
                                          strokeDasharray={`${(clause.score / 100) * 125.6} 125.6`}
                                          className={`fill-none ${clause.score >= 90 ? 'stroke-green-500' : clause.score >= 70 ? 'stroke-amber-500' : 'stroke-red-500'}`}
                                        />
                                      </svg>
                                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-surface-600 dark:text-surface-400">
                                        {clause.score}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-surface-500 text-center py-4">No clause assessments yet</p>
                              )}
                            </div>
                          )}

                          {activeTab === 'audit' && (
                            <div className="space-y-3">
                              {cert.auditHistory.length > 0 ? (
                                <div className="relative pl-4 border-l-2 border-surface-200 dark:border-surface-600 space-y-4">
                                  {cert.auditHistory.map((audit, i) => (
                                    <div key={i} className="relative">
                                      <div className="absolute -left-[21px] w-4 h-4 rounded-full bg-indigo-500 border-2 border-white dark:border-surface-800" />
                                      <p className="text-xs text-surface-400">{new Date(audit.date).toLocaleDateString()}</p>
                                      <p className="font-medium text-surface-700 dark:text-surface-300">{audit.type}</p>
                                      <p className="text-sm text-surface-500">Result: {audit.result}</p>
                                      <p className="text-xs text-surface-400">Auditor: {audit.auditor}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-surface-500 text-center py-4">No audit history</p>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredCerts.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <p className="text-surface-500 dark:text-surface-400">No certifications found</p>
            </div>
          )}
        </motion.div>
      </FadeContent>
    </div>
  );
};

export default CertificationTracker;
