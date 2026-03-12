/**
 * Weekly Safety Report Export Utility
 * Generates comprehensive weekly safety reports in PDF and Excel formats
 */

import jsPDF from 'jspdf';
import { exportToCSV, exportToExcel } from './excelExport';

export interface WeeklySafetyReportData {
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
  companyInfo: {
    name: string;
    location: string;
    department?: string;
  };
  summary: {
    safetyScore: number;
    previousScore: number;
    trir: number;
    dart: number;
    daysWithoutLTI: number;
    nearMisses: number;
    totalIncidents: number;
    openCAPAs: number;
    trainingCompliance: number;
  };
  incidents: {
    id: string;
    date: string;
    type: string;
    severity: string;
    location: string;
    status: string;
    description: string;
  }[];
  nearMisses: {
    id: string;
    date: string;
    location: string;
    hazardType: string;
    potentialSeverity: string;
    correctiveAction: string;
  }[];
  trainingRecords: {
    employee: string;
    course: string;
    completionDate: string;
    status: string;
  }[];
  inspections: {
    date: string;
    area: string;
    inspector: string;
    score: number;
    findings: number;
  }[];
  kpis: {
    leadingIndicators: {
      name: string;
      current: number;
      target: number;
      status: 'on-track' | 'at-risk' | 'behind';
    }[];
    laggingIndicators: {
      name: string;
      current: number;
      target: number;
      benchmark: number;
    }[];
  };
  toolboxTalks: {
    date: string;
    topic: string;
    attendees: number;
    signOffRate: number;
  }[];
}

interface WeeklyReportIndicatorSnapshot {
  name: string;
  current: number;
  target: number;
  benchmark?: number;
}

interface WeeklyReportSummarySnapshot {
  leadingScore: number;
  trir: number;
  daysWithoutLTI: number;
  training: number;
}

interface WeeklyReportIncidentBreakdownItem {
  name: string;
  value: number;
}

interface BuildWeeklySafetyReportParams {
  overview: WeeklyReportSummarySnapshot;
  previousLeadingScore: number;
  leadingIndicators: WeeklyReportIndicatorSnapshot[];
  laggingIndicators: WeeklyReportIndicatorSnapshot[];
  incidentBreakdown: WeeklyReportIncidentBreakdownItem[];
  reportDate?: Date;
}

// Mock data generator for weekly reports
export const generateMockWeeklyData = (): WeeklySafetyReportData => {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  return {
    reportPeriod: {
      startDate: weekAgo,
      endDate: today,
    },
    companyInfo: {
      name: 'ACME Corporation',
      location: 'Houston, TX',
      department: 'Operations',
    },
    summary: {
      safetyScore: 94,
      previousScore: 92,
      trir: 1.2,
      dart: 0.8,
      daysWithoutLTI: 127,
      nearMisses: 8,
      totalIncidents: 3,
      openCAPAs: 5,
      trainingCompliance: 96,
    },
    incidents: [
      { id: 'INC-2026-045', date: '2026-01-27', type: 'Slip/Trip/Fall', severity: 'Medium', location: 'Warehouse A', status: 'Investigating', description: 'Employee slipped on wet floor near dock entrance' },
      { id: 'INC-2026-046', date: '2026-01-25', type: 'Struck By', severity: 'Low', location: 'Production Line 2', status: 'Resolved', description: 'Minor impact from falling small parts' },
      { id: 'INC-2026-047', date: '2026-01-24', type: 'Near Miss', severity: 'High', location: 'Loading Dock', status: 'CAPA Pending', description: 'Forklift nearly struck pedestrian' },
    ],
    nearMisses: [
      { id: 'NM-2026-089', date: '2026-01-28', location: 'Main Hallway', hazardType: 'Housekeeping', potentialSeverity: 'Medium', correctiveAction: 'Area cleared and signs posted' },
      { id: 'NM-2026-090', date: '2026-01-27', location: 'Electrical Room', hazardType: 'Electrical', potentialSeverity: 'High', correctiveAction: 'Panel covers secured' },
      { id: 'NM-2026-091', date: '2026-01-26', location: 'Parking Lot', hazardType: 'Vehicle', potentialSeverity: 'High', correctiveAction: 'Speed bumps being installed' },
    ],
    trainingRecords: [
      { employee: 'John Smith', course: 'HAZWOPER Refresher', completionDate: '2026-01-28', status: 'Completed' },
      { employee: 'Emily Chen', course: 'Forklift Certification', completionDate: '2026-01-27', status: 'Completed' },
      { employee: 'Mike Davis', course: 'First Aid/CPR', completionDate: '2026-01-25', status: 'Completed' },
      { employee: 'Sarah Johnson', course: 'Confined Space Entry', completionDate: '', status: 'Due in 5 days' },
    ],
    inspections: [
      { date: '2026-01-28', area: 'Production Floor', inspector: 'Safety Manager', score: 92, findings: 3 },
      { date: '2026-01-26', area: 'Warehouse', inspector: 'EHS Specialist', score: 88, findings: 5 },
      { date: '2026-01-24', area: 'Office Areas', inspector: 'Safety Coordinator', score: 95, findings: 1 },
    ],
    kpis: {
      leadingIndicators: [
        { name: 'Safety Observations', current: 87, target: 100, status: 'on-track' },
        { name: 'Near Miss Reports', current: 43, target: 50, status: 'on-track' },
        { name: 'Training Completion', current: 94, target: 100, status: 'at-risk' },
        { name: 'Inspection Completion', current: 96, target: 100, status: 'on-track' },
        { name: 'Hazards Identified', current: 28, target: 30, status: 'on-track' },
        { name: 'Toolbox Talk Participation', current: 91, target: 95, status: 'at-risk' },
      ],
      laggingIndicators: [
        { name: 'TRIR', current: 1.2, target: 1.0, benchmark: 2.8 },
        { name: 'DART Rate', current: 0.8, target: 0.5, benchmark: 1.4 },
        { name: 'LTIR', current: 0.4, target: 0.3, benchmark: 0.9 },
        { name: 'Severity Rate', current: 7.2, target: 5.0, benchmark: 12.0 },
        { name: 'First Aid Cases', current: 12, target: 10, benchmark: 20 },
        { name: 'Days Without LTI', current: 127, target: 365, benchmark: 90 },
      ],
    },
    toolboxTalks: [
      { date: '2026-01-28', topic: 'Winter Slip Prevention', attendees: 45, signOffRate: 100 },
      { date: '2026-01-27', topic: 'PPE Inspection', attendees: 42, signOffRate: 98 },
      { date: '2026-01-26', topic: 'Forklift Safety', attendees: 38, signOffRate: 95 },
      { date: '2026-01-25', topic: 'Chemical Handling', attendees: 40, signOffRate: 100 },
      { date: '2026-01-24', topic: 'Emergency Evacuation', attendees: 44, signOffRate: 97 },
    ],
  };
};

export const buildWeeklySafetyReportData = ({
  overview,
  previousLeadingScore,
  leadingIndicators,
  laggingIndicators,
  incidentBreakdown,
  reportDate = new Date(),
}: BuildWeeklySafetyReportParams): WeeklySafetyReportData => {
  const endDate = reportDate;
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const totalIncidents = incidentBreakdown.reduce((sum, item) => sum + item.value, 0);
  const nearMissEntry = incidentBreakdown.find((item) => item.name.toLowerCase().includes('near'));
  const trainingIndicator = leadingIndicators.find((item) => item.name.toLowerCase().includes('training'));
  const inspectionIndicator = leadingIndicators.find((item) => item.name.toLowerCase().includes('inspection'));
  const toolboxIndicator = leadingIndicators.find((item) => item.name.toLowerCase().includes('toolbox'));
  const dartIndicator = laggingIndicators.find((item) => item.name.toLowerCase().includes('dart'));

  return {
    reportPeriod: {
      startDate,
      endDate,
    },
    companyInfo: {
      name: 'SafetyMEG',
      location: 'Enterprise-wide',
      department: 'EHS Operations',
    },
    summary: {
      safetyScore: overview.leadingScore,
      previousScore: previousLeadingScore,
      trir: overview.trir,
      dart: dartIndicator?.current ?? 0,
      daysWithoutLTI: overview.daysWithoutLTI,
      totalIncidents,
      nearMisses: nearMissEntry?.value ?? 0,
      openCAPAs: 0,
      trainingCompliance: overview.training,
    },
    incidents: incidentBreakdown.map((item, index) => ({
      id: `KPI-${index + 1}`,
      date: endDate.toISOString().slice(0, 10),
      type: item.name,
      severity: item.value >= 5 ? 'High' : item.value >= 3 ? 'Medium' : 'Low',
      location: 'Multi-site',
      status: 'Tracked',
      description: `${item.value} ${item.name.toLowerCase()} logged during the current reporting window.`,
    })),
    nearMisses: nearMissEntry
      ? [{
          id: 'NM-SUMMARY',
          date: endDate.toISOString().slice(0, 10),
          location: 'Enterprise-wide',
          hazardType: nearMissEntry.name,
          potentialSeverity: nearMissEntry.value >= 5 ? 'High' : nearMissEntry.value >= 3 ? 'Medium' : 'Low',
          correctiveAction: `${nearMissEntry.value} near-miss items require follow-up review in the detailed incident workflow.`,
        }]
      : [],
    trainingRecords: trainingIndicator
      ? [{
          employee: 'All Personnel',
          course: 'Required training portfolio',
          completionDate: endDate.toISOString().slice(0, 10),
          status: `${trainingIndicator.current}% complete against ${trainingIndicator.target}% target`,
        }]
      : [],
    inspections: inspectionIndicator
      ? [{
          date: endDate.toISOString().slice(0, 10),
          area: 'All active sites',
          inspector: 'Live KPI feed',
          score: inspectionIndicator.current,
          findings: Math.max(totalIncidents - (nearMissEntry?.value ?? 0), 0),
        }]
      : [],
    kpis: {
      leadingIndicators: leadingIndicators.map((item) => ({
        name: item.name,
        current: item.current,
        target: item.target,
        status: item.current >= item.target ? 'on-track' : item.current >= item.target * 0.85 ? 'at-risk' : 'behind',
      })),
      laggingIndicators: laggingIndicators.map((item) => ({
        name: item.name,
        current: item.current,
        target: item.target,
        benchmark: item.benchmark ?? item.target,
      })),
    },
    toolboxTalks: toolboxIndicator
      ? [{
          date: endDate.toISOString().slice(0, 10),
          topic: 'Participation snapshot',
          attendees: Math.round(toolboxIndicator.current),
          signOffRate: Math.round(toolboxIndicator.current),
        }]
      : [],
  };
};

// Format date for display
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Export weekly safety report to PDF
export const exportWeeklyReportPDF = (data: WeeklySafetyReportData): void => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Weekly Safety Report', margin, yPos);

  yPos += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`${formatDate(data.reportPeriod.startDate)} - ${formatDate(data.reportPeriod.endDate)}`, margin, yPos);

  yPos += 8;
  doc.text(`${data.companyInfo.name} | ${data.companyInfo.location}`, margin, yPos);

  // Summary Section
  yPos += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Executive Summary', margin, yPos);

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Summary grid
  const summaryItems = [
    { label: 'Safety Score', value: `${data.summary.safetyScore}%`, change: `${data.summary.safetyScore > data.summary.previousScore ? '+' : ''}${data.summary.safetyScore - data.summary.previousScore}%` },
    { label: 'TRIR', value: data.summary.trir.toFixed(2), change: '' },
    { label: 'DART Rate', value: data.summary.dart.toFixed(2), change: '' },
    { label: 'Days Without LTI', value: data.summary.daysWithoutLTI.toString(), change: '' },
    { label: 'Near Misses', value: data.summary.nearMisses.toString(), change: '' },
    { label: 'Total Incidents', value: data.summary.totalIncidents.toString(), change: '' },
    { label: 'Open CAPAs', value: data.summary.openCAPAs.toString(), change: '' },
    { label: 'Training Compliance', value: `${data.summary.trainingCompliance}%`, change: '' },
  ];

  const colWidth = (pageWidth - 2 * margin) / 4;
  summaryItems.forEach((item, index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = margin + col * colWidth;
    const y = yPos + row * 12;

    doc.setTextColor(107, 114, 128);
    doc.text(item.label, x, y);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, x, y + 5);
    doc.setFont('helvetica', 'normal');
  });

  yPos += 30;

  // Incidents Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Incidents This Week', margin, yPos);

  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // Table header
  doc.setFillColor(243, 244, 246);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
  doc.setTextColor(75, 85, 99);
  doc.text('ID', margin + 2, yPos + 5);
  doc.text('Date', margin + 30, yPos + 5);
  doc.text('Type', margin + 55, yPos + 5);
  doc.text('Severity', margin + 85, yPos + 5);
  doc.text('Status', margin + 110, yPos + 5);
  doc.text('Location', margin + 140, yPos + 5);

  yPos += 7;
  doc.setTextColor(31, 41, 55);
  data.incidents.forEach((incident) => {
    yPos += 6;
    doc.text(incident.id, margin + 2, yPos);
    doc.text(incident.date, margin + 30, yPos);
    doc.text(incident.type, margin + 55, yPos);
    doc.text(incident.severity, margin + 85, yPos);
    doc.text(incident.status, margin + 110, yPos);
    doc.text(incident.location, margin + 140, yPos);
  });

  yPos += 15;

  // KPIs Section
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Performance Indicators', margin, yPos);

  yPos += 10;
  doc.setFontSize(11);
  doc.text('Leading Indicators', margin, yPos);

  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  data.kpis.leadingIndicators.forEach((kpi) => {
    const progress = (kpi.current / kpi.target) * 100;
    const statusColor = kpi.status === 'on-track' ? [34, 197, 94] : kpi.status === 'at-risk' ? [234, 179, 8] : [239, 68, 68];

    doc.setTextColor(75, 85, 99);
    doc.text(kpi.name, margin, yPos);
    doc.text(`${kpi.current} / ${kpi.target}`, margin + 80, yPos);

    // Progress bar
    doc.setFillColor(229, 231, 235);
    doc.rect(margin + 110, yPos - 3, 50, 4, 'F');
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.rect(margin + 110, yPos - 3, Math.min(progress, 100) * 0.5, 4, 'F');

    yPos += 6;
  });

  yPos += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Lagging Indicators', margin, yPos);

  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  data.kpis.laggingIndicators.forEach((kpi) => {
    doc.setTextColor(75, 85, 99);
    doc.text(kpi.name, margin, yPos);
    doc.text(`Current: ${kpi.current}`, margin + 70, yPos);
    doc.text(`Target: ${kpi.target}`, margin + 110, yPos);
    doc.text(`Benchmark: ${kpi.benchmark}`, margin + 145, yPos);
    yPos += 6;
  });

  // Toolbox Talks Section
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  yPos += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Toolbox Talks', margin, yPos);

  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  doc.setFillColor(243, 244, 246);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
  doc.setTextColor(75, 85, 99);
  doc.text('Date', margin + 2, yPos + 5);
  doc.text('Topic', margin + 30, yPos + 5);
  doc.text('Attendees', margin + 110, yPos + 5);
  doc.text('Sign-off Rate', margin + 140, yPos + 5);

  yPos += 7;
  doc.setTextColor(31, 41, 55);
  data.toolboxTalks.forEach((talk) => {
    yPos += 6;
    doc.text(talk.date, margin + 2, yPos);
    doc.text(talk.topic, margin + 30, yPos);
    doc.text(talk.attendees.toString(), margin + 110, yPos);
    doc.text(`${talk.signOffRate}%`, margin + 140, yPos);
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(`Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`, margin, doc.internal.pageSize.getHeight() - 10);
    doc.text('Confidential - For Internal Use Only', pageWidth - margin - 50, doc.internal.pageSize.getHeight() - 10);
  }

  // Save the PDF
  const fileName = `Weekly_Safety_Report_${formatDate(data.reportPeriod.startDate).replace(/[,\s]/g, '_')}_${formatDate(data.reportPeriod.endDate).replace(/[,\s]/g, '_')}.pdf`;
  doc.save(fileName);
};

// Export weekly safety report to Excel
export const exportWeeklyReportExcel = (data: WeeklySafetyReportData): void => {
  // Summary sheet
  const summaryHeaders = ['Metric', 'Value', 'Target/Previous', 'Status'];
  const summaryRows = [
    ['Safety Score', `${data.summary.safetyScore}%`, `${data.summary.previousScore}%`, data.summary.safetyScore >= data.summary.previousScore ? 'Improved' : 'Declined'],
    ['TRIR', data.summary.trir.toString(), '1.0', data.summary.trir <= 1.0 ? 'On Target' : 'Above Target'],
    ['DART Rate', data.summary.dart.toString(), '0.5', data.summary.dart <= 0.5 ? 'On Target' : 'Above Target'],
    ['Days Without LTI', data.summary.daysWithoutLTI.toString(), '365', 'In Progress'],
    ['Near Misses', data.summary.nearMisses.toString(), '-', 'Reported'],
    ['Total Incidents', data.summary.totalIncidents.toString(), '0', data.summary.totalIncidents === 0 ? 'Excellent' : 'Needs Attention'],
    ['Open CAPAs', data.summary.openCAPAs.toString(), '0', data.summary.openCAPAs === 0 ? 'Complete' : 'In Progress'],
    ['Training Compliance', `${data.summary.trainingCompliance}%`, '100%', data.summary.trainingCompliance >= 95 ? 'Compliant' : 'Needs Attention'],
  ];

  // Incidents sheet
  const incidentHeaders = ['ID', 'Date', 'Type', 'Severity', 'Location', 'Status', 'Description'];
  const incidentRows = data.incidents.map(i => [i.id, i.date, i.type, i.severity, i.location, i.status, i.description]);

  // Near misses sheet
  const nearMissHeaders = ['ID', 'Date', 'Location', 'Hazard Type', 'Potential Severity', 'Corrective Action'];
  const nearMissRows = data.nearMisses.map(nm => [nm.id, nm.date, nm.location, nm.hazardType, nm.potentialSeverity, nm.correctiveAction]);

  // KPIs sheet
  const kpiHeaders = ['Category', 'Indicator', 'Current', 'Target', 'Status/Benchmark'];
  const kpiRows = [
    ...data.kpis.leadingIndicators.map(k => ['Leading', k.name, k.current.toString(), k.target.toString(), k.status]),
    ...data.kpis.laggingIndicators.map(k => ['Lagging', k.name, k.current.toString(), k.target.toString(), k.benchmark.toString()]),
  ];

  // Toolbox talks sheet
  const toolboxHeaders = ['Date', 'Topic', 'Attendees', 'Sign-off Rate (%)'];
  const toolboxRows = data.toolboxTalks.map(t => [t.date, t.topic, t.attendees.toString(), t.signOffRate.toString()]);

  // Export each sheet as separate CSV (since we don't have full XLSX library)
  exportToCSV({ sheetName: 'Summary', headers: summaryHeaders, rows: summaryRows }, `Weekly_Safety_Summary_${formatDate(data.reportPeriod.startDate).replace(/[,\s]/g, '_')}`);

  // Also export incidents
  setTimeout(() => {
    exportToCSV({ sheetName: 'Incidents', headers: incidentHeaders, rows: incidentRows }, `Weekly_Safety_Incidents_${formatDate(data.reportPeriod.startDate).replace(/[,\s]/g, '_')}`);
  }, 500);

  // Export KPIs
  setTimeout(() => {
    exportToCSV({ sheetName: 'KPIs', headers: kpiHeaders, rows: kpiRows }, `Weekly_Safety_KPIs_${formatDate(data.reportPeriod.startDate).replace(/[,\s]/g, '_')}`);
  }, 1000);
};

// Export complete weekly report bundle
export const exportWeeklyReportBundle = (data: WeeklySafetyReportData, format: 'pdf' | 'excel' | 'both' = 'both'): void => {
  if (format === 'pdf' || format === 'both') {
    exportWeeklyReportPDF(data);
  }
  if (format === 'excel' || format === 'both') {
    setTimeout(() => {
      exportWeeklyReportExcel(data);
    }, 1000);
  }
};
