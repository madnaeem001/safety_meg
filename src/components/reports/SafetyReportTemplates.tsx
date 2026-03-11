import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Printer,
  Eye,
  Copy,
  Calendar,
  AlertTriangle,
  ClipboardCheck,
  Search,
  Shield,
  BarChart3,
  Users,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Filter,
  Plus,
  Settings,
  FileCheck,
  Activity,
  Target,
  Award,
  Flame,
  Heart,
  FileSpreadsheet,
  Sparkles,
  X
} from 'lucide-react';
import { CustomReportBuilder } from './CustomReportBuilder';

// Report template types
export type ReportType = 
  | 'incident-summary' 
  | 'safety-audit' 
  | 'inspection' 
  | 'monthly-safety' 
  | 'near-miss' 
  | 'training-summary'
  | 'compliance-status'
  | 'esg-report'
  | 'contractor-safety'
  | 'hazard-assessment'
  | 'emergency-drill'
  | 'vehicle-safety'
  | 'chemical-inventory';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  sections: string[];
  lastGenerated?: string;
  frequency: string;
}

interface ReportData {
  title: string;
  generatedDate: string;
  reportPeriod: string;
  preparedBy: string;
  department: string;
  // Dynamic sections based on report type
  sections: ReportSection[];
}

interface ReportSection {
  title: string;
  type: 'kpi' | 'table' | 'chart' | 'text' | 'checklist' | 'summary';
  data: any;
}

// Report templates configuration
const reportTemplates: ReportTemplate[] = [
  {
    id: 'incident-summary',
    name: 'Incident Summary Report',
    description: 'Comprehensive overview of all incidents during the reporting period',
    icon: AlertTriangle,
    color: 'bg-red-500',
    sections: ['Executive Summary', 'Incident Statistics', 'Root Cause Analysis', 'Corrective Actions', 'Trend Analysis'],
    lastGenerated: '2026-01-20',
    frequency: 'Weekly/Monthly'
  },
  {
    id: 'safety-audit',
    name: 'Safety Audit Report',
    description: 'Detailed audit findings with compliance scores and recommendations',
    icon: ClipboardCheck,
    color: 'bg-blue-500',
    sections: ['Audit Scope', 'Compliance Checklist', 'Findings', 'Non-Conformances', 'Recommendations', 'Action Plan'],
    lastGenerated: '2026-01-15',
    frequency: 'Monthly/Quarterly'
  },
  {
    id: 'inspection',
    name: 'Inspection Report',
    description: 'Workplace inspection findings and corrective action tracking',
    icon: Search,
    color: 'bg-emerald-500',
    sections: ['Inspection Details', 'Area Checklist', 'Hazards Identified', 'Photos/Evidence', 'Corrective Actions', 'Follow-up Schedule'],
    lastGenerated: '2026-01-22',
    frequency: 'Weekly'
  },
  {
    id: 'monthly-safety',
    name: 'Monthly Safety Report',
    description: 'Complete monthly safety performance metrics and trends',
    icon: BarChart3,
    color: 'bg-purple-500',
    sections: ['KPI Dashboard', 'Incident Summary', 'Training Progress', 'Compliance Status', 'Leading Indicators', 'Goals & Targets'],
    lastGenerated: '2026-01-01',
    frequency: 'Monthly'
  },
  {
    id: 'near-miss',
    name: 'Near-Miss Analysis',
    description: 'Analysis of near-miss events and preventive measures',
    icon: Shield,
    color: 'bg-amber-500',
    sections: ['Near-Miss Log', 'Risk Assessment', 'Contributing Factors', 'Prevention Strategies', 'Lessons Learned'],
    frequency: 'Weekly'
  },
  {
    id: 'training-summary',
    name: 'Training Summary Report',
    description: 'Training completion rates, certifications, and compliance',
    icon: Users,
    color: 'bg-cyan-500',
    sections: ['Training Matrix', 'Completion Rates', 'Expiring Certifications', 'Training Effectiveness', 'Budget Summary'],
    lastGenerated: '2026-01-18',
    frequency: 'Monthly'
  },
  {
    id: 'compliance-status',
    name: 'Compliance Status Report',
    description: 'Regulatory compliance tracking across all frameworks',
    icon: FileCheck,
    color: 'bg-indigo-500',
    sections: ['Compliance Score', 'Framework Status', 'Audit Findings', 'Deadlines', 'Gap Analysis', 'Action Items'],
    lastGenerated: '2026-01-10',
    frequency: 'Monthly/Quarterly'
  },
  {
    id: 'esg-report',
    name: 'ESG Performance Report',
    description: 'Environmental, Social, and Governance metrics for sustainability reporting',
    icon: Target,
    color: 'bg-green-500',
    sections: ['ESG Scorecard', 'Environmental Metrics', 'Social Indicators', 'Governance Items', 'SDG Alignment', 'Stakeholder Summary'],
    frequency: 'Quarterly/Annual'
  },
  {
    id: 'contractor-safety',
    name: 'Contractor Safety Report',
    description: 'Contractor safety performance, permits, and compliance tracking',
    icon: Users,
    color: 'bg-orange-500',
    sections: ['Contractor List', 'Permit Status', 'Safety Metrics', 'Incident History', 'Training Records', 'Compliance Score'],
    frequency: 'Monthly'
  },
  {
    id: 'hazard-assessment',
    name: 'Hazard Assessment Report',
    description: 'Job safety analysis and hazard identification summary',
    icon: AlertTriangle,
    color: 'bg-yellow-500',
    sections: ['JSA Summary', 'Hazard Matrix', 'Risk Rankings', 'Control Measures', 'PPE Requirements', 'Review Schedule'],
    frequency: 'As Needed'
  },
  {
    id: 'emergency-drill',
    name: 'Emergency Drill Report',
    description: 'Emergency response drill results and improvement tracking',
    icon: Flame,
    color: 'bg-red-600',
    sections: ['Drill Details', 'Response Times', 'Evacuation Metrics', 'Equipment Check', 'Observations', 'Improvement Actions'],
    lastGenerated: '2026-01-12',
    frequency: 'Quarterly'
  },
  {
    id: 'vehicle-safety',
    name: 'Vehicle Safety Report',
    description: 'Fleet safety metrics, incidents, and driver compliance',
    icon: Activity,
    color: 'bg-blue-600',
    sections: ['Fleet Overview', 'Incident Summary', 'Driver Performance', 'Maintenance Status', 'Compliance Metrics', 'Cost Analysis'],
    frequency: 'Monthly'
  },
  {
    id: 'chemical-inventory',
    name: 'Chemical Inventory Report',
    description: 'Hazardous materials inventory and SDS compliance status',
    icon: Activity,
    color: 'bg-purple-600',
    sections: ['Chemical List', 'SDS Status', 'Storage Compliance', 'Exposure Monitoring', 'Training Status', 'Regulatory Updates'],
    frequency: 'Quarterly'
  }
];

// Mock report data generator
const generateReportData = (templateId: ReportType): ReportData => {
  const template = reportTemplates.find(t => t.id === templateId);
  
  const baseData: ReportData = {
    title: template?.name || 'Safety Report',
    generatedDate: new Date().toISOString().split('T')[0],
    reportPeriod: 'January 2026',
    preparedBy: 'Safety Team',
    department: 'All Departments',
    sections: []
  };

  switch (templateId) {
    case 'incident-summary':
      baseData.sections = [
        {
          title: 'Executive Summary',
          type: 'summary',
          data: {
            totalIncidents: 12,
            recordable: 3,
            firstAid: 5,
            nearMiss: 4,
            trir: 2.8,
            previousTrir: 3.1,
            highlights: [
              'TRIR decreased by 9.7% compared to previous period',
              '3 recordable incidents requiring OSHA documentation',
              'Slip/trip/fall incidents remain leading category',
              'All corrective actions on track for completion'
            ]
          }
        },
        {
          title: 'Incident Statistics',
          type: 'kpi',
          data: [
            { label: 'Total Incidents', value: 12, change: -15, trend: 'down' },
            { label: 'Recordable Incidents', value: 3, change: -25, trend: 'down' },
            { label: 'Lost Time Incidents', value: 1, change: 0, trend: 'stable' },
            { label: 'Days Away', value: 5, change: -40, trend: 'down' },
            { label: 'Near Misses Reported', value: 28, change: 40, trend: 'up' },
            { label: 'TRIR', value: 2.8, change: -9.7, trend: 'down' }
          ]
        },
        {
          title: 'Incidents by Type',
          type: 'table',
          data: [
            { type: 'Slip/Trip/Fall', count: 4, severity: 'Medium', status: 'Closed' },
            { type: 'Struck By', count: 2, severity: 'High', status: 'Open' },
            { type: 'Ergonomic', count: 3, severity: 'Low', status: 'Closed' },
            { type: 'Chemical Exposure', count: 1, severity: 'Medium', status: 'Investigating' },
            { type: 'Vehicle', count: 2, severity: 'High', status: 'Closed' }
          ]
        },
        {
          title: 'Corrective Actions',
          type: 'checklist',
          data: [
            { action: 'Install anti-slip flooring in warehouse', dueDate: '2026-02-15', status: 'in-progress', owner: 'Facilities' },
            { action: 'Update forklift traffic routes', dueDate: '2026-01-30', status: 'completed', owner: 'Operations' },
            { action: 'Conduct ergonomics training', dueDate: '2026-02-01', status: 'in-progress', owner: 'HR' },
            { action: 'Review chemical handling procedures', dueDate: '2026-02-10', status: 'pending', owner: 'Safety' }
          ]
        }
      ];
      break;

    case 'safety-audit':
      baseData.sections = [
        {
          title: 'Audit Overview',
          type: 'summary',
          data: {
            auditType: 'Comprehensive Safety Audit',
            auditDate: '2026-01-15',
            auditor: 'Internal Safety Team',
            scope: 'All facilities and departments',
            overallScore: 87,
            previousScore: 82,
            findings: { critical: 0, major: 2, minor: 8, observations: 12 }
          }
        },
        {
          title: 'Compliance Scores by Area',
          type: 'kpi',
          data: [
            { label: 'Emergency Preparedness', value: 92, maxValue: 100 },
            { label: 'PPE Compliance', value: 88, maxValue: 100 },
            { label: 'Machine Guarding', value: 85, maxValue: 100 },
            { label: 'Housekeeping', value: 90, maxValue: 100 },
            { label: 'Documentation', value: 78, maxValue: 100 },
            { label: 'Training Records', value: 95, maxValue: 100 }
          ]
        },
        {
          title: 'Non-Conformances',
          type: 'table',
          data: [
            { finding: 'Fire extinguisher inspection overdue', severity: 'Major', area: 'Warehouse B', status: 'Open' },
            { finding: 'Missing lockout/tagout procedure signage', severity: 'Major', area: 'Maintenance', status: 'In Progress' },
            { finding: 'Incomplete training records', severity: 'Minor', area: 'HR', status: 'Closed' },
            { finding: 'Eye wash station obstructed', severity: 'Minor', area: 'Lab', status: 'Open' }
          ]
        }
      ];
      break;

    case 'monthly-safety':
      baseData.sections = [
        {
          title: 'Key Performance Indicators',
          type: 'kpi',
          data: [
            { label: 'TRIR', value: 2.8, target: 3.0, status: 'green' },
            { label: 'DART Rate', value: 1.2, target: 1.5, status: 'green' },
            { label: 'Days Since LTI', value: 45, target: 30, status: 'green' },
            { label: 'Training Completion', value: 94, target: 95, status: 'yellow' },
            { label: 'Near-Miss Reports', value: 28, target: 25, status: 'green' },
            { label: 'Safety Observations', value: 156, target: 150, status: 'green' }
          ]
        },
        {
          title: 'Leading Indicators',
          type: 'kpi',
          data: [
            { label: 'Safety Meetings Held', value: 24, target: 24, status: 'green' },
            { label: 'Hazards Identified', value: 42, target: 35, status: 'green' },
            { label: 'Audit Closure Rate', value: 89, target: 90, status: 'yellow' },
            { label: 'Training Hours/Employee', value: 4.2, target: 4.0, status: 'green' }
          ]
        },
        {
          title: 'Department Performance',
          type: 'table',
          data: [
            { department: 'Operations', incidents: 3, nearMiss: 12, observations: 45, score: 88 },
            { department: 'Maintenance', incidents: 2, nearMiss: 8, observations: 32, score: 85 },
            { department: 'Warehouse', incidents: 4, nearMiss: 6, observations: 28, score: 78 },
            { department: 'Admin', incidents: 0, nearMiss: 2, observations: 15, score: 95 },
            { department: 'R&D', incidents: 1, nearMiss: 4, observations: 22, score: 90 }
          ]
        },
        {
          title: 'Goals & Targets',
          type: 'checklist',
          data: [
            { goal: 'Achieve TRIR below 3.0', status: 'achieved', progress: 100 },
            { goal: '100% training compliance', status: 'in-progress', progress: 94 },
            { goal: '200 safety observations per month', status: 'in-progress', progress: 78 },
            { goal: 'Zero lost-time incidents', status: 'achieved', progress: 100 },
            { goal: 'Complete all overdue inspections', status: 'in-progress', progress: 85 }
          ]
        }
      ];
      break;

    case 'esg-report':
      baseData.sections = [
        {
          title: 'ESG Scorecard',
          type: 'kpi',
          data: [
            { label: 'Overall ESG Score', value: 78, maxValue: 100, category: 'overall' },
            { label: 'Environmental', value: 82, maxValue: 100, category: 'environmental' },
            { label: 'Social', value: 75, maxValue: 100, category: 'social' },
            { label: 'Governance', value: 76, maxValue: 100, category: 'governance' }
          ]
        },
        {
          title: 'Environmental Metrics',
          type: 'kpi',
          data: [
            { label: 'Carbon Emissions (tCO2e)', value: 1250, target: 1400, trend: 'down' },
            { label: 'Water Usage (m³)', value: 45000, target: 50000, trend: 'down' },
            { label: 'Waste Diverted (%)', value: 72, target: 70, trend: 'up' },
            { label: 'Energy Intensity', value: 0.85, target: 0.90, trend: 'down' }
          ]
        },
        {
          title: 'Social Indicators',
          type: 'kpi',
          data: [
            { label: 'TRIR', value: 2.8, benchmark: 3.5, status: 'good' },
            { label: 'Training Hours/Employee', value: 42, benchmark: 40, status: 'good' },
            { label: 'Diversity Index', value: 0.68, benchmark: 0.65, status: 'good' },
            { label: 'Employee Engagement', value: 78, benchmark: 75, status: 'good' }
          ]
        },
        {
          title: 'SDG Alignment',
          type: 'table',
          data: [
            { sdg: 'SDG 3: Good Health', contribution: 'Worker safety programs', score: 85 },
            { sdg: 'SDG 8: Decent Work', contribution: 'Fair labor practices', score: 82 },
            { sdg: 'SDG 12: Responsible Consumption', contribution: 'Waste reduction', score: 78 },
            { sdg: 'SDG 13: Climate Action', contribution: 'Emissions reduction', score: 80 }
          ]
        }
      ];
      break;

    default:
      baseData.sections = [
        {
          title: 'Report Summary',
          type: 'summary',
          data: { message: 'Report template data will be populated here.' }
        }
      ];
  }

  return baseData;
};

// KPI Card Component
const KPICard: React.FC<{
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  target?: number;
  status?: 'green' | 'yellow' | 'red';
  maxValue?: number;
}> = ({ label, value, change, trend, target, status, maxValue }) => {
  const getStatusColor = () => {
    if (status === 'green') return 'text-emerald-600 bg-emerald-50';
    if (status === 'yellow') return 'text-amber-600 bg-amber-50';
    if (status === 'red') return 'text-red-600 bg-red-50';
    return 'text-slate-600 bg-slate-50';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold text-slate-900 dark:text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {maxValue && <span className="text-sm font-normal text-slate-400">/{maxValue}</span>}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${
            trend === 'down' ? 'text-emerald-600' : trend === 'up' && change > 0 ? 'text-red-600' : 'text-slate-500'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
            {Math.abs(change)}%
          </div>
        )}
        {target !== undefined && (
          <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor()}`}>
            Target: {target}
          </div>
        )}
      </div>
    </div>
  );
};

// Report Preview Component
const ReportPreview: React.FC<{
  template: ReportTemplate;
  data: ReportData;
  onClose: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
}> = ({ template, data, onClose, onExportPDF, onExportExcel }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${template.color} text-white`}>
              <template.icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{data.title}</h2>
              <p className="text-sm text-slate-400">
                Generated: {data.generatedDate} | Period: {data.reportPeriod}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onExportPDF}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
              title="Export PDF"
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm">PDF</span>
            </button>
            <button
              onClick={onExportExcel}
              className="flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors"
              title="Export Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="text-sm">Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Printer className="w-5 h-5 text-slate-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div ref={printRef} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {data.sections.map((section, idx) => (
            <div key={idx} className="mb-8">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-brand-500 rounded-full" />
                {section.title}
              </h3>

              {/* Summary Section */}
              {section.type === 'summary' && (
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5">
                  {section.data.highlights ? (
                    <ul className="space-y-2">
                      {section.data.highlights.map((highlight: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400">{section.data.message || JSON.stringify(section.data)}</p>
                  )}
                </div>
              )}

              {/* KPI Section */}
              {section.type === 'kpi' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {section.data.map((kpi: any, i: number) => (
                    <KPICard key={i} {...kpi} />
                  ))}
                </div>
              )}

              {/* Table Section */}
              {section.type === 'table' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100 dark:bg-slate-700">
                      <tr>
                        {Object.keys(section.data[0] || {}).map((key) => (
                          <th key={key} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {section.data.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          {Object.values(row).map((val: any, j: number) => (
                            <td key={j} className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                              {typeof val === 'number' ? val.toLocaleString() : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Checklist Section */}
              {section.type === 'checklist' && (
                <div className="space-y-3">
                  {section.data.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          item.status === 'completed' || item.status === 'achieved' ? 'bg-emerald-100 text-emerald-600' :
                          item.status === 'in-progress' ? 'bg-amber-100 text-amber-600' :
                          'bg-slate-200 text-slate-500'
                        }`}>
                          {item.status === 'completed' || item.status === 'achieved' ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Clock className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{item.action || item.goal}</p>
                          {item.owner && <p className="text-xs text-slate-500">Owner: {item.owner}</p>}
                          {item.dueDate && <p className="text-xs text-slate-500">Due: {item.dueDate}</p>}
                        </div>
                      </div>
                      {item.progress !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                item.progress >= 100 ? 'bg-emerald-500' : 'bg-brand-500'
                              }`}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{item.progress}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Export utilities
const exportToPDF = (template: ReportTemplate, data: ReportData) => {
  // Generate PDF content
  const content = `
===================================
${data.title.toUpperCase()}
===================================

Generated: ${data.generatedDate}
Report Period: ${data.reportPeriod}
Prepared By: ${data.preparedBy}
Department: ${data.department}

${data.sections.map(section => `
--- ${section.title} ---
${section.type === 'summary' && section.data.highlights ? 
  section.data.highlights.map((h: string) => `• ${h}`).join('\n') :
  section.type === 'kpi' ?
    section.data.map((kpi: any) => `${kpi.label}: ${kpi.value}${kpi.change !== undefined ? ` (${kpi.change > 0 ? '+' : ''}${kpi.change}%)` : ''}`).join('\n') :
  section.type === 'table' ?
    section.data.map((row: any) => Object.values(row).join(' | ')).join('\n') :
  section.type === 'checklist' ?
    section.data.map((item: any) => `[${item.status === 'completed' || item.status === 'achieved' ? 'X' : ' '}] ${item.action || item.goal}`).join('\n') :
  'Content available in detailed view'
}
`).join('\n')}

===================================
End of Report
===================================
  `;
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${template.id}_${data.generatedDate}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

const exportToExcel = (template: ReportTemplate, data: ReportData) => {
  // Generate CSV content
  const lines: string[] = [];
  
  // Header
  lines.push(`"${data.title}"`);
  lines.push(`"Generated:","${data.generatedDate}"`);
  lines.push(`"Period:","${data.reportPeriod}"`);
  lines.push(`"Prepared By:","${data.preparedBy}"`);
  lines.push('');
  
  // Sections
  data.sections.forEach(section => {
    lines.push(`"${section.title}"`);
    
    if (section.type === 'kpi') {
      lines.push('"Metric","Value","Change"');
      section.data.forEach((kpi: any) => {
        lines.push(`"${kpi.label}","${kpi.value}","${kpi.change !== undefined ? kpi.change : ''}"`);
      });
    } else if (section.type === 'table') {
      if (section.data.length > 0) {
        const headers = Object.keys(section.data[0]);
        lines.push(headers.map(h => `"${h}"`).join(','));
        section.data.forEach((row: any) => {
          lines.push(Object.values(row).map(v => `"${v}"`).join(','));
        });
      }
    } else if (section.type === 'checklist') {
      lines.push('"Item","Status","Progress"');
      section.data.forEach((item: any) => {
        lines.push(`"${item.action || item.goal}","${item.status}","${item.progress || ''}"`);
      });
    } else if (section.type === 'summary' && section.data.highlights) {
      section.data.highlights.forEach((h: string) => {
        lines.push(`"${h}"`);
      });
    }
    
    lines.push('');
  });
  
  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${template.id}_${data.generatedDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// Main Component
export const SafetyReportTemplates: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = reportTemplates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleGenerateReport = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleExportPDF = useCallback(() => {
    if (selectedTemplate) {
      const data = generateReportData(selectedTemplate.id);
      exportToPDF(selectedTemplate, data);
    }
  }, [selectedTemplate]);

  const handleExportExcel = useCallback(() => {
    if (selectedTemplate) {
      const data = generateReportData(selectedTemplate.id);
      exportToExcel(selectedTemplate, data);
    }
  }, [selectedTemplate]);

  // If showing custom builder, render it instead
  if (showCustomBuilder) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowCustomBuilder(false)}
          className="absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
          Back to Templates
        </button>
        <CustomReportBuilder />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen bg-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-brand-900/30 rounded-xl">
              <FileText className="w-6 h-6 text-brand-400" />
            </div>
            Safety Report Templates
          </h1>
          <p className="text-slate-400 mt-1">
            Generate professional safety reports with pre-built templates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCustomBuilder(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Custom Builder
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 
                       rounded-xl text-sm w-64 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>
          <button className="p-2.5 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-700 transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTemplates.map((template) => (
          <motion.div
            key={template.id}
            whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}
            className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden"
          >
            {/* Card Header */}
            <div className={`p-4 ${template.color} text-white`}>
              <div className="flex items-center justify-between">
                <template.icon className="w-8 h-8" />
                <span className="text-xs font-medium px-2 py-1 bg-white/20 rounded-full">
                  {template.frequency}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5">
              <h3 className="font-semibold text-white mb-2">{template.name}</h3>
              <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                {template.description}
              </p>

              {/* Sections Preview */}
              <div className="mb-4">
                <p className="text-xs font-medium text-slate-500 mb-2">Includes:</p>
                <div className="flex flex-wrap gap-1">
                  {template.sections.slice(0, 3).map((section, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-slate-700/50 rounded-md text-slate-300">
                      {section}
                    </span>
                  ))}
                  {template.sections.length > 3 && (
                    <span className="text-xs px-2 py-1 bg-slate-700/50 rounded-md text-slate-500">
                      +{template.sections.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Last Generated */}
              {template.lastGenerated && (
                <p className="text-xs text-slate-500 mb-4">
                  Last generated: {template.lastGenerated}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleGenerateReport(template)}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium 
                           rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Generate
                </button>
                <button
                  onClick={() => {
                    setSelectedTemplate(template);
                    const data = generateReportData(template.id);
                    exportToPDF(template, data);
                  }}
                  className="p-2.5 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-400 transition-colors"
                  title="Export PDF"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedTemplate(template);
                    const data = generateReportData(template.id);
                    exportToExcel(template, data);
                  }}
                  className="p-2.5 bg-green-500/20 hover:bg-green-500/30 rounded-xl text-green-400 transition-colors"
                  title="Export Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900/30 rounded-lg">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">48</p>
              <p className="text-sm text-slate-400">Reports Generated</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">12</p>
              <p className="text-sm text-slate-400">This Month</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-900/30 rounded-lg">
              <Download className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">156</p>
              <p className="text-sm text-slate-400">Downloads</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">3</p>
              <p className="text-sm text-slate-400">Scheduled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Preview Modal */}
      <AnimatePresence>
        {showPreview && selectedTemplate && (
          <ReportPreview
            template={selectedTemplate}
            data={generateReportData(selectedTemplate.id)}
            onClose={() => {
              setShowPreview(false);
              setSelectedTemplate(null);
            }}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SafetyReportTemplates;
