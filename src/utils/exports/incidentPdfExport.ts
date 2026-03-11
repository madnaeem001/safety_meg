import jsPDF from 'jspdf';

// Types for Incident/Injury Report export
export interface IncidentReportData {
  reportType: 'incident' | 'injury';
  reportId: string;
  date: string;
  time: string;
  location: string;
  department: string;
  industrySector?: string;
  incidentType: string;
  severity: string;
  description: string;
  immediateActions?: string;
  witnesses?: string;
  regulatoryReportable?: boolean;
  rootCauses?: string;
  correctiveActions?: string;
  assignedTo?: string;
  dueDate?: string;
  isoClause?: string;
  // Injury-specific fields
  injuredPerson?: string;
  employeeId?: string;
  supervisor?: string;
  injuryType?: string;
  oshaRecordable?: boolean;
  bodyPartsAffected?: string[];
  generatedBy: string;
  generatedDate: string;
  // Signature fields (base64 data URLs)
  reporterSignature?: string;
  witnessSignature?: string;
  supervisorSignature?: string;
  safetyOfficerSignature?: string;
  // Additional enhanced fields
  preventiveMeasures?: string;
  lessonsLearned?: string;
  equipmentInvolved?: string;
  environmentalConditions?: string;
  ppeUsed?: string[];
  fiveWhysAnalysis?: string[];
  fishboneCategories?: { category: string; causes: string[] }[];
  treatmentProvided?: string;
  medicalFacility?: string;
  daysAwayFromWork?: number;
  daysRestricted?: number;
}

// Colors
const BRAND_COLOR: [number, number, number] = [90, 128, 105]; // Brand green
const ACCENT_COLOR: [number, number, number] = [239, 68, 68]; // Red for injury/danger
const DARK_TEXT: [number, number, number] = [30, 41, 59];
const LIGHT_TEXT: [number, number, number] = [100, 116, 139];
const SUCCESS_COLOR: [number, number, number] = [34, 197, 94];
const WARNING_COLOR: [number, number, number] = [245, 158, 11];
const DANGER_COLOR: [number, number, number] = [239, 68, 68];

// Severity level colors
const SEVERITY_COLORS: Record<string, [number, number, number]> = {
  'Low': [34, 197, 94],
  'Medium': [245, 158, 11],
  'High': [249, 115, 22],
  'Critical': [239, 68, 68],
};

export const exportIncidentReportToPDF = (data: IncidentReportData, mode: 'save' | 'print' = 'save'): void => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Helper functions
  const setTextColor = (color: [number, number, number]) => {
    doc.setTextColor(color[0], color[1], color[2]);
  };

  const setFillColor = (color: [number, number, number]) => {
    doc.setFillColor(color[0], color[1], color[2]);
  };

  const checkPageBreak = (requiredSpace: number): void => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      addPageHeader();
    }
  };

  const addPageHeader = () => {
    doc.setFontSize(8);
    setTextColor(LIGHT_TEXT);
    doc.text(`${data.reportType === 'injury' ? 'Injury' : 'Incident'} Report - ${data.reportId}`, margin, margin - 5);
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin - 20, margin - 5);
  };

  // Header section
  const addHeader = () => {
    // Background header
    const headerColor: [number, number, number] = data.reportType === 'injury' ? ACCENT_COLOR : BRAND_COLOR;
    setFillColor(headerColor);
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    const title = data.reportType === 'injury' ? 'INJURY REPORT' : 'INCIDENT REPORT';
    doc.text(title, margin, 22);

    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report ID: ${data.reportId}`, margin, 32);

    // Date info on right side
    doc.setFontSize(10);
    doc.text(`Generated: ${data.generatedDate}`, pageWidth - margin - 50, 22);
    doc.text(`By: ${data.generatedBy}`, pageWidth - margin - 50, 28);

    yPos = 55;
  };

  // Section header
  const addSectionHeader = (title: string) => {
    checkPageBreak(15);
    setFillColor([241, 245, 249]); // Light gray background
    doc.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    setTextColor(BRAND_COLOR);
    doc.text(title, margin + 4, yPos + 7);
    yPos += 15;
  };

  // Key-value row
  const addKeyValue = (key: string, value: string, highlight?: boolean) => {
    checkPageBreak(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setTextColor(LIGHT_TEXT);
    doc.text(key, margin, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    setTextColor(highlight ? ACCENT_COLOR : DARK_TEXT);
    
    // Handle long text with wrapping
    const maxWidth = contentWidth - 50;
    const textLines = doc.splitTextToSize(value || 'N/A', maxWidth);
    doc.text(textLines, margin + 45, yPos);
    
    yPos += Math.max(8, textLines.length * 5);
  };

  // Multiline text block
  const addTextBlock = (label: string, text: string) => {
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setTextColor(LIGHT_TEXT);
    doc.text(label, margin, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    setTextColor(DARK_TEXT);
    
    const textLines = doc.splitTextToSize(text || 'N/A', contentWidth - 10);
    
    // Background for text block
    setFillColor([248, 250, 252]);
    const blockHeight = Math.max(15, textLines.length * 5 + 6);
    doc.roundedRect(margin, yPos, contentWidth, blockHeight, 2, 2, 'F');
    
    doc.text(textLines, margin + 4, yPos + 5);
    yPos += blockHeight + 5;
  };

  // Severity badge
  const addSeverityBadge = () => {
    checkPageBreak(15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setTextColor(LIGHT_TEXT);
    doc.text('Severity Level', margin, yPos);
    
    // Normalize severity display (Minor/Moderate/Serious -> Low/Medium/High)
    const severityDisplayMap: Record<string, string> = {
      'Minor': 'Low', 'Moderate': 'Medium', 'Serious': 'High',
      'Low': 'Low', 'Medium': 'Medium', 'High': 'High', 'Critical': 'Critical'
    };
    const severityColorMap: Record<string, [number, number, number]> = {
      'Minor': [34, 197, 94], 'Low': [34, 197, 94],
      'Moderate': [245, 158, 11], 'Medium': [245, 158, 11],
      'Serious': [249, 115, 22], 'High': [249, 115, 22],
      'Critical': [239, 68, 68]
    };
    const displaySeverity = severityDisplayMap[data.severity] ?? (data.severity || 'Not specified');
    const severityColor = severityColorMap[data.severity] || WARNING_COLOR;
    setFillColor(severityColor);
    doc.roundedRect(margin + 45, yPos - 5, 35, 8, 2, 2, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(displaySeverity, margin + 48, yPos);
    
    yPos += 10;
  };

  // Body parts section (for injury reports)
  const addBodyPartsSection = () => {
    if (!data.bodyPartsAffected || data.bodyPartsAffected.length === 0) return;
    
    checkPageBreak(25);
    addSectionHeader('Body Parts Affected');
    
    const partsPerRow = 3;
    const partWidth = (contentWidth - 10) / partsPerRow;
    
    data.bodyPartsAffected.forEach((part, index) => {
      const col = index % partsPerRow;
      const row = Math.floor(index / partsPerRow);
      
      if (col === 0 && row > 0) {
        yPos += 8;
        checkPageBreak(10);
      }
      
      const x = margin + (col * partWidth);
      
      setFillColor([254, 226, 226]); // Light red background
      doc.roundedRect(x, yPos, partWidth - 3, 7, 2, 2, 'F');
      
      doc.setFontSize(8);
      setTextColor(DANGER_COLOR);
      doc.setFont('helvetica', 'bold');
      doc.text(part, x + 3, yPos + 5);
    });
    
    yPos += 15;
  };

  // Footer
  const addFooter = () => {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      
      // Footer text
      doc.setFontSize(8);
      setTextColor(LIGHT_TEXT);
      doc.text('EHS Safety Management System', margin, pageHeight - 10);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
      
      // Confidential notice
      doc.setFont('helvetica', 'italic');
      doc.text('CONFIDENTIAL - For internal use only', pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
  };

  // Build the PDF
  addHeader();
  
  // Basic Information Section
  addSectionHeader('Basic Information');
  addKeyValue('Date', data.date);
  addKeyValue('Time', data.time);
  addKeyValue('Location', data.location || 'N/A');
  addKeyValue('Department', data.department || 'N/A');
  if (data.industrySector) {
    addKeyValue('Industry Sector', data.industrySector);
  }
  addKeyValue('Incident Type', data.incidentType || 'N/A', true);
  addSeverityBadge();
  
  // For injury reports, add injured person info
  if (data.reportType === 'injury') {
    yPos += 5;
    addSectionHeader('Injured Person Details');
    if (data.injuredPerson) addKeyValue('Name', data.injuredPerson);
    if (data.employeeId) addKeyValue('Employee ID', data.employeeId);
    if (data.supervisor) addKeyValue('Supervisor', data.supervisor);
    if (data.injuryType) addKeyValue('Injury Type', data.injuryType, true);
    if (data.oshaRecordable !== undefined) {
      addKeyValue('OSHA Recordable', data.oshaRecordable ? 'Yes' : 'No', data.oshaRecordable);
    }
    
    addBodyPartsSection();
  }
  
  // Description Section
  yPos += 5;
  addSectionHeader('Incident Description');
  addTextBlock('What Happened', data.description || 'N/A');
  
  if (data.immediateActions) {
    addTextBlock('Immediate Actions Taken', data.immediateActions);
  }
  
  if (data.witnesses) {
    addKeyValue('Witnesses', data.witnesses);
  }
  
  if (data.regulatoryReportable !== undefined) {
    addKeyValue('Regulatory Reportable', data.regulatoryReportable ? 'Yes - OSHA Reportable' : 'No', data.regulatoryReportable);
  }
  
  // Root Cause & Corrective Actions
  if (data.rootCauses || data.correctiveActions) {
    yPos += 5;
    addSectionHeader('Root Cause Analysis & Actions');
    
    if (data.rootCauses) {
      addTextBlock('Root Causes', data.rootCauses);
    }
    
    if (data.correctiveActions) {
      addTextBlock('Corrective Actions', data.correctiveActions);
    }
    
    if (data.assignedTo) {
      addKeyValue('Assigned To', data.assignedTo);
    }
    
    if (data.dueDate) {
      addKeyValue('Due Date', data.dueDate);
    }
    
    if (data.isoClause) {
      addKeyValue('ISO Clause', data.isoClause);
    }
  }
  
  // Additional Enhanced Fields
  if (data.equipmentInvolved || data.environmentalConditions || (data.ppeUsed && data.ppeUsed.length > 0)) {
    yPos += 5;
    addSectionHeader('Contributing Factors');
    
    if (data.equipmentInvolved) {
      addTextBlock('Equipment Involved', data.equipmentInvolved);
    }
    if (data.environmentalConditions) {
      addTextBlock('Environmental Conditions', data.environmentalConditions);
    }
    if (data.ppeUsed && data.ppeUsed.length > 0) {
      addKeyValue('PPE Used', data.ppeUsed.join(', '));
    }
  }
  
  // Medical Treatment Details
  if (data.treatmentProvided || data.medicalFacility) {
    yPos += 5;
    addSectionHeader('Medical Treatment');
    
    if (data.treatmentProvided) {
      addTextBlock('Treatment Provided', data.treatmentProvided);
    }
    if (data.medicalFacility) {
      addKeyValue('Medical Facility', data.medicalFacility);
    }
    if (data.daysAwayFromWork !== undefined && data.daysAwayFromWork > 0) {
      addKeyValue('Days Away from Work', String(data.daysAwayFromWork));
    }
    if (data.daysRestricted !== undefined && data.daysRestricted > 0) {
      addKeyValue('Restricted Work Days', String(data.daysRestricted));
    }
  }
  
  // Root Cause Analysis (5 Whys)
  if (data.fiveWhysAnalysis && data.fiveWhysAnalysis.length > 0) {
    yPos += 5;
    addSectionHeader('5 Whys Analysis');
    
    data.fiveWhysAnalysis.forEach((why, index) => {
      if (why) {
        addKeyValue(`Why ${index + 1}`, why);
      }
    });
  }
  
  // Fishbone Diagram Categories
  if (data.fishboneCategories && data.fishboneCategories.length > 0) {
    yPos += 5;
    addSectionHeader('Fishbone (Cause & Effect) Analysis');
    
    data.fishboneCategories.forEach(({ category, causes }) => {
      if (causes.length > 0) {
        addTextBlock(category, causes.join('; '));
      }
    });
  }
  
  // Preventive Measures & Lessons Learned
  if (data.preventiveMeasures || data.lessonsLearned) {
    yPos += 5;
    addSectionHeader('Prevention & Lessons Learned');
    
    if (data.preventiveMeasures) {
      addTextBlock('Preventive Measures', data.preventiveMeasures);
    }
    if (data.lessonsLearned) {
      addTextBlock('Lessons Learned', data.lessonsLearned);
    }
  }
  
  // Signature Section with Images
  yPos += 10;
  checkPageBreak(60);
  addSectionHeader('Signatures');
  
  const signatures = [
    { label: 'Reporter', data: data.reporterSignature },
    { label: 'Witness', data: data.witnessSignature },
    { label: 'Supervisor', data: data.supervisorSignature },
    { label: 'Safety Officer', data: data.safetyOfficerSignature }
  ].filter(s => s.data);
  
  const sigWidth = (contentWidth - 20) / Math.min(signatures.length || 3, 3);
  const sigHeight = 20;
  
  if (signatures.length > 0) {
    // Add actual signature images
    signatures.forEach((sig, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = margin + (col * (sigWidth + 10));
      const yOffset = row * 40;
      
      if (row > 0 && col === 0) {
        yPos += 40;
        checkPageBreak(40);
      }
      
      // Signature box background
      setFillColor([248, 250, 252]);
      doc.roundedRect(x, yPos + yOffset, sigWidth, sigHeight + 15, 2, 2, 'F');
      
      // Add signature image if available
      if (sig.data) {
        try {
          doc.addImage(sig.data, 'PNG', x + 2, yPos + yOffset + 2, sigWidth - 4, sigHeight - 4);
        } catch (e) {
          // If image fails, draw placeholder
          doc.setDrawColor(150, 150, 150);
          doc.line(x + 5, yPos + yOffset + sigHeight - 5, x + sigWidth - 5, yPos + yOffset + sigHeight - 5);
        }
      }
      
      // Role label
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      setTextColor(DARK_TEXT);
      doc.text(sig.label, x + sigWidth / 2, yPos + yOffset + sigHeight + 5, { align: 'center' });
      
      // Date
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      setTextColor(LIGHT_TEXT);
      doc.text(`Date: ${data.generatedDate.split(',')[0]}`, x + sigWidth / 2, yPos + yOffset + sigHeight + 10, { align: 'center' });
    });
    
    yPos += Math.ceil(signatures.length / 3) * 40;
  } else {
    // Empty signature lines if no signatures provided
    ['Reporter', 'Supervisor', 'Safety Officer'].forEach((role, index) => {
      const x = margin + (index * (sigWidth + 10));
      
      // Signature line
      doc.setDrawColor(150, 150, 150);
      doc.line(x, yPos + 15, x + sigWidth, yPos + 15);
      
      // Role label
      doc.setFontSize(8);
      setTextColor(LIGHT_TEXT);
      doc.text(role, x + sigWidth / 2, yPos + 20, { align: 'center' });
      
      // Date label
      doc.text('Date: ___/___/___', x + sigWidth / 2, yPos + 25, { align: 'center' });
    });
  }
  
  // Add footer to all pages
  addFooter();
  
  if (mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl as unknown as string, '_blank');
  } else {
    const filename = `${data.reportType}-report-${data.reportId}-${data.date}.pdf`;
    doc.save(filename);
  }
};

// Helper to generate report ID
export const generateReportId = (type: 'incident' | 'injury'): string => {
  const prefix = type === 'injury' ? 'INJ' : 'INC';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export default exportIncidentReportToPDF;
