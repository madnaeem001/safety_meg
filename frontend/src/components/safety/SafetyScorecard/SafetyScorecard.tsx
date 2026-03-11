import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  Users, Award, Target, Activity, Printer, Download, Calendar,
  Building2, Globe, FileText, BarChart3
} from 'lucide-react';

interface SafetyScorecardProps {
  companyInfo: {
    name: string;
    location: string;
    department?: string;
    reportingPeriod: string;
  };
  metrics: {
    safetyScore: number;
    previousScore: number;
    trir: number;
    trirTarget: number;
    dart: number;
    ltir: number;
    daysWithoutLTI: number;
    daysTarget: number;
    nearMisses: number;
    nearMissTarget: number;
    openIncidents: number;
    closedIncidents: number;
    openCAPAs: number;
    completedCAPAs: number;
    trainingCompliance: number;
    inspectionCompletion: number;
    hazardsIdentified: number;
    hazardsCorrected: number;
  };
  compliance: {
    osha: number;
    iso45001: number;
    iso14001: number;
    iso9001: number;
    epa: number;
    bsee?: number;
    niosh?: number;
  };
  trends: {
    month: string;
    score: number;
    incidents: number;
  }[];
}

export const SafetyScorecard: React.FC<SafetyScorecardProps> = ({
  companyInfo,
  metrics,
  compliance,
  trends
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const getScoreColor = (score: number, target: number) => {
    const ratio = score / target;
    if (ratio >= 1) return 'text-emerald-600';
    if (ratio >= 0.8) return 'text-amber-600';
    return 'text-red-600';
  };

  const getTrendIcon = (current: number, previous: number, inverse = false) => {
    const isUp = current > previous;
    const isGood = inverse ? !isUp : isUp;
    
    if (isUp) {
      return <TrendingUp className={`w-4 h-4 ${isGood ? 'text-emerald-500' : 'text-red-500'}`} />;
    }
    return <TrendingDown className={`w-4 h-4 ${isGood ? 'text-emerald-500' : 'text-red-500'}`} />;
  };

  return (
    <div className="bg-white dark:bg-surface-800 min-h-screen">
      {/* Print Controls - Hidden in Print */}
      <div className="print:hidden sticky top-0 z-10 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 p-4">
        <div className="max-w-[1000px] mx-auto flex items-center justify-between">
          <h2 className="text-xl font-bold text-surface-900 dark:text-white">Safety Scorecard</h2>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 transition-colors"
            >
              <Printer className="w-5 h-5" />
              Print Scorecard
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200 rounded-xl font-semibold hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Printable Content */}
      <div 
        ref={printRef}
        className="max-w-[1000px] mx-auto p-6 print:p-0 print:max-w-none"
        style={{ 
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-8 print:mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center print:bg-emerald-600">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-surface-900 dark:text-white print:text-black">
                  Safety Scorecard
                </h1>
                <p className="text-surface-500 dark:text-surface-400 print:text-gray-600">
                  {companyInfo.reportingPeriod}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-surface-900 dark:text-white print:text-black">
              {companyInfo.name}
            </h2>
            <p className="text-surface-500 dark:text-surface-400 print:text-gray-600 flex items-center justify-end gap-1">
              <Building2 className="w-4 h-4" />
              {companyInfo.location}
            </p>
            {companyInfo.department && (
              <p className="text-surface-400 dark:text-surface-500 print:text-gray-500 text-sm">
                {companyInfo.department}
              </p>
            )}
          </div>
        </div>

        {/* Main Safety Score */}
        <div className="grid grid-cols-4 gap-4 mb-8 print:mb-6">
          <div className="col-span-1 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white print:bg-emerald-600 print:rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-6 h-6 opacity-80" />
              <span className="text-sm font-medium opacity-90">Safety Score</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold">{metrics.safetyScore}</span>
              <span className="text-xl opacity-80 mb-1">%</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon(metrics.safetyScore, metrics.previousScore)}
              <span className="text-sm">
                {metrics.safetyScore > metrics.previousScore ? '+' : ''}
                {metrics.safetyScore - metrics.previousScore}% from previous
              </span>
            </div>
          </div>

          <div className="col-span-3 grid grid-cols-3 gap-4">
            {/* TRIR */}
            <div className="bg-surface-50 dark:bg-surface-700 rounded-xl p-4 border border-surface-200 dark:border-surface-600 print:bg-gray-50 print:border-gray-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide print:text-gray-600">TRIR</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${metrics.trir <= metrics.trirTarget ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  Target: {metrics.trirTarget}
                </span>
              </div>
              <span className={`text-3xl font-bold ${getScoreColor(metrics.trirTarget, metrics.trir)}`}>
                {metrics.trir.toFixed(2)}
              </span>
            </div>

            {/* DART */}
            <div className="bg-surface-50 dark:bg-surface-700 rounded-xl p-4 border border-surface-200 dark:border-surface-600 print:bg-gray-50 print:border-gray-300">
              <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide block mb-2 print:text-gray-600">DART Rate</span>
              <span className="text-3xl font-bold text-surface-900 dark:text-white print:text-black">{metrics.dart.toFixed(2)}</span>
            </div>

            {/* LTIR */}
            <div className="bg-surface-50 dark:bg-surface-700 rounded-xl p-4 border border-surface-200 dark:border-surface-600 print:bg-gray-50 print:border-gray-300">
              <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide block mb-2 print:text-gray-600">LTIR</span>
              <span className="text-3xl font-bold text-surface-900 dark:text-white print:text-black">{metrics.ltir.toFixed(2)}</span>
            </div>

            {/* Days Without LTI */}
            <div className="bg-surface-50 dark:bg-surface-700 rounded-xl p-4 border border-surface-200 dark:border-surface-600 print:bg-gray-50 print:border-gray-300">
              <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide block mb-2 print:text-gray-600">Days Without LTI</span>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-emerald-600">{metrics.daysWithoutLTI}</span>
                <span className="text-sm text-surface-400 mb-1">/ {metrics.daysTarget} goal</span>
              </div>
              <div className="w-full bg-surface-200 dark:bg-surface-600 rounded-full h-2 mt-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all" 
                  style={{ width: `${Math.min((metrics.daysWithoutLTI / metrics.daysTarget) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Near Misses */}
            <div className="bg-surface-50 dark:bg-surface-700 rounded-xl p-4 border border-surface-200 dark:border-surface-600 print:bg-gray-50 print:border-gray-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide print:text-gray-600">Near Misses</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${metrics.nearMisses >= metrics.nearMissTarget ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  Target: {metrics.nearMissTarget}
                </span>
              </div>
              <span className="text-3xl font-bold text-amber-600">{metrics.nearMisses}</span>
            </div>

            {/* Training Compliance */}
            <div className="bg-surface-50 dark:bg-surface-700 rounded-xl p-4 border border-surface-200 dark:border-surface-600 print:bg-gray-50 print:border-gray-300">
              <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide block mb-2 print:text-gray-600">Training Compliance</span>
              <span className={`text-3xl font-bold ${metrics.trainingCompliance >= 95 ? 'text-emerald-600' : metrics.trainingCompliance >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                {metrics.trainingCompliance}%
              </span>
            </div>
          </div>
        </div>

        {/* Incident & CAPA Summary */}
        <div className="grid grid-cols-2 gap-6 mb-8 print:mb-6">
          <div className="bg-surface-50 dark:bg-surface-700 rounded-2xl p-6 border border-surface-200 dark:border-surface-600 print:bg-gray-50 print:border-gray-300 print:rounded-lg">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2 print:text-black">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Incident Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl print:bg-red-50">
                <span className="text-3xl font-bold text-red-600">{metrics.openIncidents}</span>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Open</p>
              </div>
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl print:bg-emerald-50">
                <span className="text-3xl font-bold text-emerald-600">{metrics.closedIncidents}</span>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Closed</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-50 dark:bg-surface-700 rounded-2xl p-6 border border-surface-200 dark:border-surface-600 print:bg-gray-50 print:border-gray-300 print:rounded-lg">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2 print:text-black">
              <Target className="w-5 h-5 text-blue-500" />
              CAPA Status
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl print:bg-blue-50">
                <span className="text-3xl font-bold text-blue-600">{metrics.openCAPAs}</span>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Open</p>
              </div>
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl print:bg-emerald-50">
                <span className="text-3xl font-bold text-emerald-600">{metrics.completedCAPAs}</span>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Regulatory Compliance */}
        <div className="bg-surface-50 dark:bg-surface-700 rounded-2xl p-6 border border-surface-200 dark:border-surface-600 mb-8 print:mb-6 print:bg-gray-50 print:border-gray-300 print:rounded-lg">
          <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2 print:text-black">
            <Globe className="w-5 h-5 text-indigo-500" />
            Regulatory Compliance
          </h3>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
            {[
              { name: 'OSHA', score: compliance.osha, color: 'bg-red-500' },
              { name: 'ISO 45001', score: compliance.iso45001, color: 'bg-emerald-500' },
              { name: 'ISO 14001', score: compliance.iso14001, color: 'bg-green-500' },
              { name: 'ISO 9001', score: compliance.iso9001, color: 'bg-blue-500' },
              { name: 'EPA', score: compliance.epa, color: 'bg-teal-500' },
              { name: 'NIOSH', score: compliance.niosh ?? 0, color: 'bg-purple-500' },
              { name: 'BSEE', score: compliance.bsee ?? 0, color: 'bg-amber-500' },
            ].filter(c => c.score > 0).map((item) => (
              <div key={item.name} className="text-center p-3 bg-white dark:bg-surface-600 rounded-xl shadow-sm print:bg-white">
                <div className={`w-10 h-10 ${item.color} rounded-full flex items-center justify-center mx-auto mb-2 text-white text-xs font-bold`}>
                  {item.score}%
                </div>
                <p className="text-xs font-semibold text-surface-700 dark:text-surface-300 print:text-gray-700">{item.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hazard Management */}
        <div className="grid grid-cols-2 gap-6 mb-8 print:mb-6">
          <div className="bg-surface-50 dark:bg-surface-700 rounded-2xl p-6 border border-surface-200 dark:border-surface-600 print:bg-gray-50 print:border-gray-300 print:rounded-lg">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2 print:text-black">
              <Activity className="w-5 h-5 text-orange-500" />
              Hazard Management
            </h3>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-surface-500 dark:text-surface-400 print:text-gray-600">Hazards Identified</span>
              <span className="text-xl font-bold text-surface-900 dark:text-white print:text-black">{metrics.hazardsIdentified}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-surface-500 dark:text-surface-400 print:text-gray-600">Hazards Corrected</span>
              <span className="text-xl font-bold text-emerald-600">{metrics.hazardsCorrected}</span>
            </div>
            <div className="w-full bg-surface-200 dark:bg-surface-600 rounded-full h-3 mt-4">
              <div 
                className="bg-emerald-500 h-3 rounded-full" 
                style={{ width: `${(metrics.hazardsCorrected / metrics.hazardsIdentified) * 100}%` }}
              />
            </div>
            <p className="text-xs text-surface-400 mt-2 text-center">
              {((metrics.hazardsCorrected / metrics.hazardsIdentified) * 100).toFixed(0)}% correction rate
            </p>
          </div>

          <div className="bg-surface-50 dark:bg-surface-700 rounded-2xl p-6 border border-surface-200 dark:border-surface-600 print:bg-gray-50 print:border-gray-300 print:rounded-lg">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2 print:text-black">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Inspection Completion
            </h3>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    className="text-surface-200 dark:text-surface-600"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="50"
                    cx="60"
                    cy="60"
                  />
                  <circle
                    className="text-emerald-500"
                    strokeWidth="10"
                    strokeDasharray={`${metrics.inspectionCompletion * 3.14} 314`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="50"
                    cx="60"
                    cy="60"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-surface-900 dark:text-white print:text-black">{metrics.inspectionCompletion}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-surface-400 dark:text-surface-500 pt-4 border-t border-surface-200 dark:border-surface-700 print:border-gray-300 print:text-gray-500">
          <p>Generated on {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p className="mt-1">EHS Safety Management System • ISO 45001 | ISO 14001 | ISO 9001 | OSHA | EPA | NIOSH | BSEE Compliant</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1cm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SafetyScorecard;
