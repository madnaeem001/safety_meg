import React from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Download,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  WorkflowStage,
  Observation,
  Incident,
  CAPA,
  Audit,
  BBSObservation,
  ComplianceObligation,
  WorkflowMetrics
} from '../../../data/mockEHSWorkflow';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stage: WorkflowStage;
  data: {
    observations: Observation[];
    incidents: Incident[];
    capas: CAPA[];
    audits: Audit[];
    bbsObservations: BBSObservation[];
    complianceObligations: ComplianceObligation[];
    metrics: WorkflowMetrics;
  };
}

// Helper to escape CSV values
const escapeCSV = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Generate CSV content
const generateCSV = (stage: WorkflowStage, data: ExportModalProps['data']): string => {
  let headers: string[] = [];
  let rows: unknown[][] = [];

  switch (stage) {
    case 'observation':
      headers = ['ID', 'Type', 'Title', 'Description', 'Location', 'Reported By', 'Date', 'Status', 'Risk Category'];
      rows = data.observations.map(o => [o.id, o.type, o.title, o.description, o.location, o.reportedBy, o.reportedDate, o.status, o.riskCategory || '']);
      break;
    case 'incident':
      headers = ['ID', 'Type', 'Title', 'Description', 'Location', 'Reported By', 'Date', 'Severity', 'Status', 'OSHA Recordable'];
      rows = data.incidents.map(i => [i.id, i.type, i.title, i.description, i.location, i.reportedBy, i.reportedDate, i.severity, i.status, i.oshaRecordable ? 'Yes' : 'No']);
      break;
    case 'capa':
      headers = ['ID', 'Title', 'Description', 'Source Type', 'Source ID', 'Assigned To', 'Due Date', 'Priority', 'Severity', 'Status'];
      rows = data.capas.map(c => [c.id, c.title, c.description, c.sourceType, c.sourceId, c.assignedTo, c.dueDate, c.priority, c.severity, c.status]);
      break;
    case 'audit':
      headers = ['ID', 'Type', 'Title', 'Template', 'Location', 'Auditor', 'Scheduled Date', 'Status', 'Compliance Score', 'Findings Count'];
      rows = data.audits.map(a => [a.id, a.type, a.title, a.templateName, a.location, a.auditor, a.scheduledDate, a.status, a.complianceScore || '', a.findings.length]);
      break;
    case 'bbs':
      headers = ['ID', 'Observer', 'Date', 'Location', 'Department', 'Safe Count', 'At-Risk Count', 'Follow-up Required'];
      rows = data.bbsObservations.map(b => [b.id, b.observer, b.observedDate, b.location, b.department, b.safeObservations.length, b.atRiskObservations.length, b.followUpRequired ? 'Yes' : 'No']);
      break;
    case 'compliance':
      headers = ['ID', 'Regulatory Body', 'Regulation', 'Title', 'Description', 'Assigned To', 'Due Date', 'Frequency', 'Status', 'Evidence Uploaded'];
      rows = data.complianceObligations.map(c => [c.id, c.regulatoryBody, c.regulation, c.title, c.description, c.assignedTo, c.dueDate, c.frequency, c.status, c.evidenceUploaded ? 'Yes' : 'No']);
      break;
    case 'reporting':
      headers = ['Metric', 'Value'];
      rows = [
        ['TRIR', data.metrics.trir],
        ['LTIR', data.metrics.ltir],
        ['Observations This Month', data.metrics.observationsThisMonth],
        ['Inspections This Month', data.metrics.inspectionsThisMonth],
        ['CAPA Closure Rate', `${data.metrics.capaClosureRate}%`],
        ['Compliance Rate', `${data.metrics.complianceRate}%`],
        ['Leading - Observations', data.metrics.leadingIndicators.observations],
        ['Leading - Inspections', data.metrics.leadingIndicators.inspections],
        ['Leading - Trainings', data.metrics.leadingIndicators.trainings],
        ['Leading - Audits', data.metrics.leadingIndicators.audits],
      ];
      break;
    default:
      headers = ['Info'];
      rows = [['No data available for this stage']];
  }

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  return csvContent;
};

// Generate simple PDF-ready HTML content
const generatePDFContent = (stage: WorkflowStage, data: ExportModalProps['data']): string => {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const stageNames: Record<WorkflowStage, string> = {
    observation: 'Observations',
    incident: 'Incidents',
    investigation: 'Investigations',
    capa: 'Corrective Actions',
    audit: 'Audits',
    bbs: 'BBS Observations',
    compliance: 'Compliance Obligations',
    reporting: 'Metrics Report',
    improvement: 'Improvement'
  };

  let tableContent = '';

  switch (stage) {
    case 'observation':
      tableContent = `
        <table>
          <thead>
            <tr><th>ID</th><th>Type</th><th>Title</th><th>Location</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${data.observations.map(o => `
              <tr>
                <td>${o.id}</td>
                <td>${o.type.replace('_', ' ')}</td>
                <td>${o.title}</td>
                <td>${o.location}</td>
                <td>${o.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      break;
    case 'incident':
      tableContent = `
        <table>
          <thead>
            <tr><th>ID</th><th>Title</th><th>Severity</th><th>Location</th><th>Status</th><th>OSHA</th></tr>
          </thead>
          <tbody>
            ${data.incidents.map(i => `
              <tr>
                <td>${i.id}</td>
                <td>${i.title}</td>
                <td class="severity-${i.severity}">${i.severity}</td>
                <td>${i.location}</td>
                <td>${i.status}</td>
                <td>${i.oshaRecordable ? 'Yes' : 'No'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      break;
    case 'capa':
      tableContent = `
        <table>
          <thead>
            <tr><th>ID</th><th>Title</th><th>Assigned To</th><th>Due Date</th><th>Priority</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${data.capas.map(c => `
              <tr>
                <td>${c.id}</td>
                <td>${c.title}</td>
                <td>${c.assignedTo}</td>
                <td>${new Date(c.dueDate).toLocaleDateString()}</td>
                <td class="priority-${c.priority}">${c.priority}</td>
                <td>${c.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      break;
    case 'reporting':
      tableContent = `
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${data.metrics.trir}</div>
            <div class="metric-label">TRIR</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${data.metrics.ltir}</div>
            <div class="metric-label">LTIR</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${data.metrics.capaClosureRate}%</div>
            <div class="metric-label">CAPA Closure Rate</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${data.metrics.complianceRate}%</div>
            <div class="metric-label">Compliance Rate</div>
          </div>
        </div>
        <h3>Leading Indicators</h3>
        <table>
          <thead>
            <tr><th>Indicator</th><th>Count</th></tr>
          </thead>
          <tbody>
            <tr><td>Observations</td><td>${data.metrics.leadingIndicators.observations}</td></tr>
            <tr><td>Inspections</td><td>${data.metrics.leadingIndicators.inspections}</td></tr>
            <tr><td>Trainings</td><td>${data.metrics.leadingIndicators.trainings}</td></tr>
            <tr><td>Audits</td><td>${data.metrics.leadingIndicators.audits}</td></tr>
          </tbody>
        </table>
      `;
      break;
    default:
      tableContent = '<p>No data available for this stage</p>';
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>EHS ${stageNames[stage]} Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        h1 { color: #4a7861; border-bottom: 2px solid #4a7861; padding-bottom: 10px; }
        h2 { color: #666; font-size: 14px; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
        th { background-color: #f5f5f5; font-weight: bold; }
        tr:nth-child(even) { background-color: #fafafa; }
        .severity-critical, .priority-urgent { color: #dc2626; font-weight: bold; }
        .severity-high, .priority-high { color: #ea580c; font-weight: bold; }
        .severity-medium, .priority-medium { color: #d97706; }
        .severity-low, .priority-low { color: #16a34a; }
        .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 32px; font-weight: bold; color: #4a7861; }
        .metric-label { font-size: 12px; color: #666; margin-top: 5px; }
        h3 { margin-top: 30px; color: #4a7861; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <h1>EHS ${stageNames[stage]} Report</h1>
      <h2>Generated: ${date}</h2>
      ${tableContent}
    </body>
    </html>
  `;
};

// Download helper
const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  stage,
  data
}) => {
  const handleExportCSV = () => {
    const csv = generateCSV(stage, data);
    const date = new Date().toISOString().split('T')[0];
    downloadFile(csv, `ehs-${stage}-export-${date}.csv`, 'text/csv');
    onClose();
  };

  const handleExportPDF = () => {
    const html = generatePDFContent(stage, data);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
    onClose();
  };

  const stageLabels: Record<WorkflowStage, string> = {
    observation: 'Observations',
    incident: 'Incidents',
    investigation: 'Investigations',
    capa: 'Corrective Actions',
    audit: 'Audits',
    bbs: 'BBS Observations',
    compliance: 'Compliance',
    reporting: 'Metrics Report',
    improvement: 'Improvement'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                  <Download className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-surface-800">Export Data</h2>
                  <p className="text-xs text-surface-500">{stageLabels[stage]}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors"
              >
                <X className="w-5 h-5 text-surface-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <p className="text-sm text-surface-600 mb-4">
                Choose your preferred export format for the {stageLabels[stage].toLowerCase()} data.
              </p>

              {/* Excel/CSV Export */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleExportCSV}
                className="w-full flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-colors"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-green-800">Export to Excel (CSV)</h3>
                  <p className="text-xs text-green-600">Download spreadsheet for analysis</p>
                </div>
              </motion.button>

              {/* PDF Export */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleExportPDF}
                className="w-full flex items-center gap-4 p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors"
              >
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-red-800">Export to PDF</h3>
                  <p className="text-xs text-red-600">Print-ready formatted report</p>
                </div>
              </motion.button>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-surface-100">
              <button
                onClick={onClose}
                className="w-full py-2 text-sm font-medium text-surface-600 bg-surface-100 rounded-lg hover:bg-surface-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExportModal;
