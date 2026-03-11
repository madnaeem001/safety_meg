// PDF Export Utility for Compliance Reports
// Generates professional PDF reports using jspdf

import jsPDF from 'jspdf';

// Types
export interface ReportSection {
  title: string;
  content: string | string[];
  type?: 'text' | 'list' | 'table' | 'chart' | 'metrics';
  data?: Record<string, unknown>[] | Record<string, unknown>;
}

export interface ReportConfig {
  title: string;
  subtitle?: string;
  reportId: string;
  type: 'compliance' | 'safety' | 'incident' | 'audit' | 'training' | 'environmental' | 'injury';
  dateRange?: { start: string; end: string };
  generatedBy: string;
  organization: string;
  logo?: string;
  sections: ReportSection[];
  footer?: string;
  includeTimestamp?: boolean;
  confidential?: boolean;
}

export interface TableColumn {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export interface MetricItem {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'critical';
}

// Color palette
const colors = {
  primary: [59, 130, 246] as [number, number, number], // Blue
  secondary: [107, 114, 128] as [number, number, number], // Gray
  success: [34, 197, 94] as [number, number, number], // Green
  warning: [245, 158, 11] as [number, number, number], // Amber
  danger: [239, 68, 68] as [number, number, number], // Red
  dark: [31, 41, 55] as [number, number, number], // Dark gray
  light: [249, 250, 251] as [number, number, number], // Light gray
  white: [255, 255, 255] as [number, number, number],
};

// Report type configurations
const reportTypeConfig: Record<string, { color: [number, number, number]; label: string }> = {
  compliance: { color: [59, 130, 246], label: 'COMPLIANCE REPORT' },
  safety: { color: [34, 197, 94], label: 'SAFETY REPORT' },
  incident: { color: [239, 68, 68], label: 'INCIDENT REPORT' },
  audit: { color: [139, 92, 246], label: 'AUDIT REPORT' },
  training: { color: [20, 184, 166], label: 'TRAINING REPORT' },
  environmental: { color: [34, 197, 94], label: 'ENVIRONMENTAL REPORT' },
  injury: { color: [245, 158, 11], label: 'INJURY REPORT' },
};

// Main PDF generator
export const generatePDFReport = async (config: ReportConfig): Promise<Blob> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let currentY = margin;

  // Add header
  currentY = addHeader(doc, config, margin, contentWidth);

  // Add report metadata
  currentY = addMetadata(doc, config, currentY + 10, margin, contentWidth);

  // Add sections
  for (const section of config.sections) {
    // Check if we need a new page
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = margin;
      addPageHeader(doc, config, margin, contentWidth);
      currentY += 15;
    }

    currentY = addSection(doc, section, currentY + 10, margin, contentWidth, pageHeight);
  }

  // Add footer to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, config, i, pageCount, margin, pageWidth, pageHeight);
  }

  return doc.output('blob');
};

// Add header with logo and title
const addHeader = (doc: jsPDF, config: ReportConfig, margin: number, contentWidth: number): number => {
  const typeConfig = reportTypeConfig[config.type] || reportTypeConfig.compliance;
  let y = margin;

  // Header background
  doc.setFillColor(...typeConfig.color);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 45, 'F');

  // Organization name
  doc.setTextColor(...colors.white);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(config.organization, margin, y + 8);

  // Report type badge
  doc.setFontSize(10);
  doc.text(typeConfig.label, doc.internal.pageSize.getWidth() - margin, y + 8, { align: 'right' });

  // Main title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(config.title, margin, y + 22);

  // Subtitle
  if (config.subtitle) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(config.subtitle, margin, y + 30);
  }

  // Confidential badge
  if (config.confidential) {
    doc.setFillColor(...colors.danger);
    doc.roundedRect(doc.internal.pageSize.getWidth() - margin - 30, y + 18, 30, 8, 2, 2, 'F');
    doc.setFontSize(8);
    doc.text('CONFIDENTIAL', doc.internal.pageSize.getWidth() - margin - 15, y + 23.5, { align: 'center' });
  }

  return 50;
};

// Add page header for subsequent pages
const addPageHeader = (doc: jsPDF, config: ReportConfig, margin: number, contentWidth: number): void => {
  const typeConfig = reportTypeConfig[config.type] || reportTypeConfig.compliance;
  
  doc.setFillColor(...colors.light);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 15, 'F');
  
  doc.setTextColor(...colors.secondary);
  doc.setFontSize(9);
  doc.text(config.title, margin, 10);
  doc.text(config.reportId, doc.internal.pageSize.getWidth() - margin, 10, { align: 'right' });
};

// Add metadata section
const addMetadata = (doc: jsPDF, config: ReportConfig, y: number, margin: number, contentWidth: number): number => {
  doc.setTextColor(...colors.dark);
  doc.setFillColor(...colors.light);
  doc.roundedRect(margin, y, contentWidth, 25, 3, 3, 'F');

  const colWidth = contentWidth / 4;
  const labelY = y + 8;
  const valueY = y + 16;

  doc.setFontSize(8);
  doc.setTextColor(...colors.secondary);
  
  // Report ID
  doc.text('REPORT ID', margin + 5, labelY);
  doc.setTextColor(...colors.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(config.reportId, margin + 5, valueY);

  // Date Range
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.secondary);
  doc.text('PERIOD', margin + colWidth + 5, labelY);
  doc.setTextColor(...colors.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const dateText = config.dateRange 
    ? `${config.dateRange.start} to ${config.dateRange.end}`
    : new Date().toLocaleDateString();
  doc.text(dateText, margin + colWidth + 5, valueY);

  // Generated By
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.secondary);
  doc.text('GENERATED BY', margin + colWidth * 2 + 5, labelY);
  doc.setTextColor(...colors.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(config.generatedBy, margin + colWidth * 2 + 5, valueY);

  // Generated Date
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.secondary);
  doc.text('GENERATED', margin + colWidth * 3 + 5, labelY);
  doc.setTextColor(...colors.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(new Date().toLocaleDateString(), margin + colWidth * 3 + 5, valueY);

  return y + 25;
};

// Add section
const addSection = (doc: jsPDF, section: ReportSection, y: number, margin: number, contentWidth: number, pageHeight: number): number => {
  let currentY = y;

  // Section title
  doc.setTextColor(...colors.primary);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(section.title, margin, currentY);
  
  // Underline
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY + 2, margin + contentWidth, currentY + 2);
  
  currentY += 10;

  // Section content based on type
  switch (section.type) {
    case 'list':
      currentY = addListContent(doc, section.content as string[], currentY, margin, contentWidth, pageHeight);
      break;
    case 'table':
      currentY = addTableContent(doc, section.data as Record<string, unknown>[], currentY, margin, contentWidth, pageHeight);
      break;
    case 'metrics':
      currentY = addMetricsContent(doc, section.data as MetricItem[], currentY, margin, contentWidth);
      break;
    default:
      currentY = addTextContent(doc, section.content as string, currentY, margin, contentWidth, pageHeight);
  }

  return currentY;
};

// Add text content
const addTextContent = (doc: jsPDF, content: string, y: number, margin: number, contentWidth: number, pageHeight: number): number => {
  doc.setTextColor(...colors.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const lines = doc.splitTextToSize(content, contentWidth);
  let currentY = y;

  for (const line of lines) {
    if (currentY > pageHeight - 30) {
      doc.addPage();
      currentY = margin + 15;
    }
    doc.text(line, margin, currentY);
    currentY += 5;
  }

  return currentY;
};

// Add list content
const addListContent = (doc: jsPDF, items: string[], y: number, margin: number, contentWidth: number, pageHeight: number): number => {
  doc.setTextColor(...colors.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  let currentY = y;

  for (const item of items) {
    if (currentY > pageHeight - 30) {
      doc.addPage();
      currentY = margin + 15;
    }

    // Bullet point
    doc.setFillColor(...colors.primary);
    doc.circle(margin + 2, currentY - 1.5, 1.5, 'F');

    // Text
    const lines = doc.splitTextToSize(item, contentWidth - 10);
    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], margin + 8, currentY);
      currentY += 5;
    }
    currentY += 2;
  }

  return currentY;
};

// Add table content
const addTableContent = (doc: jsPDF, data: Record<string, unknown>[], y: number, margin: number, contentWidth: number, pageHeight: number): number => {
  if (!data || data.length === 0) return y;

  const headers = Object.keys(data[0]);
  const colWidth = contentWidth / headers.length;
  let currentY = y;

  // Table header
  doc.setFillColor(...colors.dark);
  doc.rect(margin, currentY, contentWidth, 8, 'F');
  
  doc.setTextColor(...colors.white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  headers.forEach((header, i) => {
    doc.text(header.charAt(0).toUpperCase() + header.slice(1), margin + i * colWidth + 3, currentY + 5.5);
  });

  currentY += 10;

  // Table rows
  doc.setTextColor(...colors.dark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  data.forEach((row, rowIndex) => {
    if (currentY > pageHeight - 30) {
      doc.addPage();
      currentY = margin + 15;
    }

    // Alternating row background
    if (rowIndex % 2 === 1) {
      doc.setFillColor(...colors.light);
      doc.rect(margin, currentY - 4, contentWidth, 7, 'F');
    }

    headers.forEach((header, i) => {
      const value = String(row[header] || '');
      const truncated = value.length > 25 ? value.substring(0, 22) + '...' : value;
      doc.text(truncated, margin + i * colWidth + 3, currentY);
    });

    currentY += 7;
  });

  // Table border
  doc.setDrawColor(...colors.secondary);
  doc.setLineWidth(0.2);
  doc.rect(margin, y, contentWidth, currentY - y);

  return currentY + 5;
};

// Add metrics content
const addMetricsContent = (doc: jsPDF, metrics: MetricItem[], y: number, margin: number, contentWidth: number): number => {
  if (!metrics || metrics.length === 0) return y;

  const metricsPerRow = 3;
  const metricWidth = (contentWidth - 10) / metricsPerRow;
  const metricHeight = 25;
  let currentY = y;

  metrics.forEach((metric, i) => {
    const col = i % metricsPerRow;
    const row = Math.floor(i / metricsPerRow);
    const x = margin + col * (metricWidth + 5);
    const yPos = currentY + row * (metricHeight + 5);

    // Background
    const statusColor = metric.status === 'good' ? colors.success :
                       metric.status === 'warning' ? colors.warning :
                       metric.status === 'critical' ? colors.danger : colors.light;
    
    doc.setFillColor(...colors.light);
    doc.roundedRect(x, yPos, metricWidth, metricHeight, 2, 2, 'F');

    // Status indicator
    doc.setFillColor(...statusColor);
    doc.roundedRect(x, yPos, 4, metricHeight, 2, 0, 'F');

    // Label
    doc.setTextColor(...colors.secondary);
    doc.setFontSize(8);
    doc.text(metric.label, x + 8, yPos + 7);

    // Value
    doc.setTextColor(...colors.dark);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${metric.value}${metric.unit || ''}`, x + 8, yPos + 18);

    // Trend indicator
    if (metric.trend) {
      doc.setFontSize(10);
      doc.setTextColor(metric.trend === 'up' ? colors.success[0] : metric.trend === 'down' ? colors.danger[0] : colors.secondary[0],
                       metric.trend === 'up' ? colors.success[1] : metric.trend === 'down' ? colors.danger[1] : colors.secondary[1],
                       metric.trend === 'up' ? colors.success[2] : metric.trend === 'down' ? colors.danger[2] : colors.secondary[2]);
      doc.text(metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→', x + metricWidth - 10, yPos + 15);
    }
  });

  const rows = Math.ceil(metrics.length / metricsPerRow);
  return currentY + rows * (metricHeight + 5);
};

// Add footer
const addFooter = (doc: jsPDF, config: ReportConfig, pageNum: number, totalPages: number, margin: number, pageWidth: number, pageHeight: number): void => {
  const footerY = pageHeight - 10;

  doc.setDrawColor(...colors.light);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setTextColor(...colors.secondary);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  // Left: Custom footer or organization
  doc.text(config.footer || config.organization, margin, footerY);

  // Center: Page number
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, footerY, { align: 'center' });

  // Right: Timestamp
  if (config.includeTimestamp !== false) {
    doc.text(new Date().toLocaleString(), pageWidth - margin, footerY, { align: 'right' });
  }
};

// Convenience function for quick exports
export const exportToPDF = async (config: ReportConfig, filename?: string): Promise<void> => {
  const blob = await generatePDFReport(config);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${config.reportId}_${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Pre-built report templates
export const ReportTemplates = {
  monthlyComplianceReport: (data: {
    organization: string;
    metrics: MetricItem[];
    requirements: Record<string, unknown>[];
    findings: string[];
    recommendations: string[];
  }): ReportConfig => ({
    title: 'Monthly Compliance Report',
    subtitle: 'Regulatory Compliance Status and Findings',
    reportId: `COMP-${new Date().toISOString().slice(0, 7).replace('-', '')}`,
    type: 'compliance',
    organization: data.organization,
    generatedBy: 'Compliance Management System',
    dateRange: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString(),
      end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString(),
    },
    includeTimestamp: true,
    confidential: true,
    sections: [
      {
        title: 'Key Compliance Metrics',
        type: 'metrics',
        content: '',
        data: data.metrics,
      },
      {
        title: 'Regulatory Requirements Status',
        type: 'table',
        content: '',
        data: data.requirements,
      },
      {
        title: 'Findings',
        type: 'list',
        content: data.findings,
      },
      {
        title: 'Recommendations',
        type: 'list',
        content: data.recommendations,
      },
    ],
  }),

  incidentReport: (data: {
    organization: string;
    incidentId: string;
    summary: string;
    details: string;
    rootCause: string;
    correctiveActions: string[];
    preventiveMeasures: string[];
  }): ReportConfig => ({
    title: 'Incident Investigation Report',
    subtitle: data.summary,
    reportId: data.incidentId,
    type: 'incident',
    organization: data.organization,
    generatedBy: 'Safety Management System',
    includeTimestamp: true,
    confidential: true,
    sections: [
      {
        title: 'Incident Details',
        type: 'text',
        content: data.details,
      },
      {
        title: 'Root Cause Analysis',
        type: 'text',
        content: data.rootCause,
      },
      {
        title: 'Corrective Actions',
        type: 'list',
        content: data.correctiveActions,
      },
      {
        title: 'Preventive Measures',
        type: 'list',
        content: data.preventiveMeasures,
      },
    ],
  }),

  injuryReport: (data: {
    organization: string;
    injuryId: string;
    employeeName: string;
    injuryDate: string;
    injuryType: string;
    bodyParts: string[];
    description: string;
    treatment: string;
    witnesses: string[];
    rootCause: string;
    correctiveActions: string[];
  }): ReportConfig => ({
    title: 'Employee Injury Report',
    subtitle: `${data.employeeName} - ${data.injuryType}`,
    reportId: data.injuryId,
    type: 'injury',
    organization: data.organization,
    generatedBy: 'Safety Management System',
    dateRange: { start: data.injuryDate, end: data.injuryDate },
    includeTimestamp: true,
    confidential: true,
    sections: [
      {
        title: 'Injury Details',
        type: 'text',
        content: data.description,
      },
      {
        title: 'Affected Body Parts',
        type: 'list',
        content: data.bodyParts,
      },
      {
        title: 'Treatment Provided',
        type: 'text',
        content: data.treatment,
      },
      {
        title: 'Witnesses',
        type: 'list',
        content: data.witnesses.length > 0 ? data.witnesses : ['No witnesses recorded'],
      },
      {
        title: 'Root Cause Analysis',
        type: 'text',
        content: data.rootCause,
      },
      {
        title: 'Corrective Actions',
        type: 'list',
        content: data.correctiveActions,
      },
    ],
  }),
};
