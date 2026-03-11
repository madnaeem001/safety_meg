import jsPDF from 'jspdf';

// Types for JSA export
interface JSAStep {
  id: string;
  stepNumber: number;
  taskDescription: string;
  hazards: string[];
  riskLevel: string;
  controls: string;
  ppeRequired: string[];
}

interface SignatureEntry {
  id: string;
  role: string;
  name: string;
  signature: string;
  date: string;
}

interface JSAFormData {
  title: string;
  department: string;
  location: string;
  createdBy: string;
  supervisor: string;
  date: string;
  description: string;
  requiredTraining: string;
  permitRequired: boolean;
}

interface JSAExportData {
  formData: JSAFormData;
  steps: JSAStep[];
  signatures: SignatureEntry[];
  jsaId?: string;
  status?: 'draft' | 'pending-review' | 'approved' | 'expired';
}

// PPE label mapping
const PPE_LABELS: Record<string, string> = {
  'hardhat': 'Hard Hat',
  'safety-glasses': 'Safety Glasses',
  'gloves': 'Gloves',
  'steel-toe': 'Steel Toe Boots',
  'hearing': 'Hearing Protection',
  'respirator': 'Respirator',
  'hi-vis': 'High Visibility Vest',
  'face-shield': 'Face Shield',
  'fall-protection': 'Fall Protection',
};

// Role label mapping
const ROLE_LABELS: Record<string, string> = {
  'worker': 'Worker / Employee',
  'supervisor': 'Supervisor',
  'safety-officer': 'Safety Officer',
};

// Colors
const BRAND_COLOR: [number, number, number] = [20, 102, 102]; // Deep teal
const ACCENT_COLOR: [number, number, number] = [255, 107, 61]; // Coral orange
const DARK_TEXT: [number, number, number] = [30, 41, 59];
const LIGHT_TEXT: [number, number, number] = [100, 116, 139];
const SUCCESS_COLOR: [number, number, number] = [34, 197, 94];
const WARNING_COLOR: [number, number, number] = [245, 158, 11];
const DANGER_COLOR: [number, number, number] = [239, 68, 68];

// Risk level colors
const RISK_COLORS: Record<string, [number, number, number]> = {
  'low': [34, 197, 94],
  'medium': [245, 158, 11],
  'high': [249, 115, 22],
  'critical': [239, 68, 68],
};

export const exportJSAtoPDF = (data: JSAExportData): void => {
  const { formData, steps, signatures, jsaId, status = 'draft' } = data;
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;
  const isDraft = status === 'draft' || status === 'pending-review';

  // Helper functions
  const setTextColor = (color: [number, number, number]) => {
    doc.setTextColor(color[0], color[1], color[2]);
  };

  const setFillColor = (color: [number, number, number]) => {
    doc.setFillColor(color[0], color[1], color[2]);
  };

  // Add watermark for draft JSAs
  const addDraftWatermark = () => {
    if (!isDraft) return;
    
    // Save current state
    const currentPage = doc.getCurrentPageInfo().pageNumber;
    
    // Add watermark to each page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Large diagonal "DRAFT" watermark
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.08 }));
      doc.setFontSize(100);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(239, 68, 68); // Red color
      
      // Rotate and position the watermark
      const watermarkText = status === 'pending-review' ? 'PENDING' : 'DRAFT';
      const textWidth = doc.getTextWidth(watermarkText);
      const centerX = pageWidth / 2;
      const centerY = pageHeight / 2;
      
      // Translate to center, rotate, then draw
      doc.text(watermarkText, centerX, centerY, {
        align: 'center',
        angle: 45
      });
      
      doc.restoreGraphicsState();
      
      // Add smaller "NOT FOR OFFICIAL USE" text at bottom
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.15 }));
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(239, 68, 68);
      doc.text('NOT FOR OFFICIAL USE - REQUIRES APPROVAL', pageWidth / 2, pageHeight - 15, { align: 'center' });
      doc.restoreGraphicsState();
    }
    
    // Restore to original page
    doc.setPage(currentPage);
  };

  const checkPageBreak = (requiredSpace: number): void => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      // Add header on new page
      addPageHeader();
    }
  };

  const addPageHeader = () => {
    // Brand header strip
    setFillColor(BRAND_COLOR);
    doc.rect(0, 0, pageWidth, 8, 'F');
    
    // Page number
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    setTextColor(LIGHT_TEXT);
    doc.text(`Page ${pageCount}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
    
    // Draft indicator on header
    if (isDraft) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(239, 68, 68);
      doc.text('DRAFT DOCUMENT', pageWidth / 2, 5, { align: 'center' });
    }
    
    yPos = margin + 5;
  };

  // ========== HEADER ==========
  // Brand header strip
  setFillColor(BRAND_COLOR);
  doc.rect(0, 0, pageWidth, 12, 'F');
  
  // Logo/Brand text
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('safetyMEG', margin, 8);
  
  // Document type badge
  setFillColor(ACCENT_COLOR);
  doc.roundedRect(pageWidth - margin - 50, 3, 50, 6, 1, 1, 'F');
  doc.setFontSize(8);
  doc.text('JOB SAFETY ANALYSIS', pageWidth - margin - 25, 7, { align: 'center' });
  
  yPos = 20;

  // ========== TITLE SECTION ==========
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  setTextColor(DARK_TEXT);
  doc.text(formData.title || 'Job Safety Analysis', margin, yPos);
  
  yPos += 6;
  
  // JSA ID and Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  setTextColor(LIGHT_TEXT);
  const jsaIdText = jsaId || `JSA-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  doc.text(`Document ID: ${jsaIdText}`, margin, yPos);
  doc.text(`Date: ${formData.date || new Date().toLocaleDateString()}`, pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 10;

  // ========== JOB INFORMATION BOX ==========
  setFillColor([248, 250, 252]);
  doc.roundedRect(margin, yPos, contentWidth, 40, 2, 2, 'F');
  
  // Border
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, contentWidth, 40, 2, 2, 'S');
  
  yPos += 6;
  
  // Section title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setTextColor(BRAND_COLOR);
  doc.text('JOB INFORMATION', margin + 5, yPos);
  
  yPos += 6;
  
  // Info grid
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const infoItems = [
    ['Department', formData.department || '-'],
    ['Location', formData.location || '-'],
    ['Created By', formData.createdBy || '-'],
    ['Supervisor', formData.supervisor || '-'],
  ];
  
  const colWidth = contentWidth / 4;
  infoItems.forEach((item, index) => {
    const xPos = margin + 5 + (index * colWidth);
    setTextColor(LIGHT_TEXT);
    doc.text(item[0], xPos, yPos);
    doc.setFont('helvetica', 'bold');
    setTextColor(DARK_TEXT);
    doc.text(item[1], xPos, yPos + 5);
    doc.setFont('helvetica', 'normal');
  });
  
  yPos += 14;
  
  // Description
  if (formData.description) {
    setTextColor(LIGHT_TEXT);
    doc.text('Description:', margin + 5, yPos);
    doc.setFont('helvetica', 'normal');
    setTextColor(DARK_TEXT);
    const descLines = doc.splitTextToSize(formData.description, contentWidth - 10);
    doc.text(descLines.slice(0, 2), margin + 5, yPos + 4);
  }
  
  yPos += 22;
  
  // Training & Permit row
  if (formData.requiredTraining || formData.permitRequired) {
    setTextColor(LIGHT_TEXT);
    doc.text('Required Training:', margin + 5, yPos);
    setTextColor(DARK_TEXT);
    doc.text(formData.requiredTraining || 'None specified', margin + 40, yPos);
    
    if (formData.permitRequired) {
      setFillColor(WARNING_COLOR);
      doc.roundedRect(pageWidth - margin - 45, yPos - 4, 40, 6, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text('PERMIT REQUIRED', pageWidth - margin - 25, yPos, { align: 'center' });
    }
    yPos += 10;
  }

  // ========== JOB STEPS & HAZARD ANALYSIS ==========
  yPos += 5;
  checkPageBreak(30);
  
  // Section header
  setFillColor(BRAND_COLOR);
  doc.roundedRect(margin, yPos, contentWidth, 8, 1, 1, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('JOB STEPS & HAZARD ANALYSIS', margin + 5, yPos + 5.5);
  
  yPos += 14;

  // Steps
  steps.forEach((step, index) => {
    const stepHeight = 45 + (step.hazards.length > 4 ? 8 : 0) + (step.ppeRequired.length > 5 ? 8 : 0);
    checkPageBreak(stepHeight);
    
    // Step container
    setFillColor([255, 255, 255]);
    doc.roundedRect(margin, yPos, contentWidth, stepHeight - 5, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, yPos, contentWidth, stepHeight - 5, 2, 2, 'S');
    
    // Step number circle
    setFillColor(BRAND_COLOR);
    doc.circle(margin + 8, yPos + 8, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(String(step.stepNumber), margin + 8, yPos + 10, { align: 'center' });
    
    // Step title and risk badge
    setTextColor(DARK_TEXT);
    doc.setFontSize(10);
    const taskTitle = step.taskDescription || `Step ${step.stepNumber}`;
    doc.text(taskTitle.slice(0, 50), margin + 18, yPos + 9);
    
    // Risk level badge
    const riskColor = RISK_COLORS[step.riskLevel] || RISK_COLORS['low'];
    setFillColor(riskColor);
    doc.roundedRect(pageWidth - margin - 25, yPos + 4, 20, 6, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text(step.riskLevel.toUpperCase(), pageWidth - margin - 15, yPos + 8, { align: 'center' });
    
    let innerY = yPos + 16;
    
    // Hazards
    if (step.hazards.length > 0) {
      setTextColor(LIGHT_TEXT);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Hazards:', margin + 5, innerY);
      
      setFillColor([254, 226, 226]);
      doc.setFont('helvetica', 'normal');
      setTextColor(DANGER_COLOR);
      
      let hazardX = margin + 25;
      step.hazards.forEach(hazard => {
        const hazardWidth = doc.getTextWidth(hazard) + 4;
        if (hazardX + hazardWidth > pageWidth - margin - 5) {
          hazardX = margin + 25;
          innerY += 6;
        }
        doc.roundedRect(hazardX, innerY - 3, hazardWidth, 5, 1, 1, 'F');
        doc.text(hazard, hazardX + 2, innerY);
        hazardX += hazardWidth + 2;
      });
      
      innerY += 8;
    }
    
    // Controls
    if (step.controls) {
      setTextColor(LIGHT_TEXT);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Controls:', margin + 5, innerY);
      doc.setFont('helvetica', 'normal');
      setTextColor(DARK_TEXT);
      const controlLines = doc.splitTextToSize(step.controls, contentWidth - 35);
      doc.text(controlLines.slice(0, 2), margin + 25, innerY);
      innerY += Math.min(controlLines.length, 2) * 4 + 4;
    }
    
    // PPE Required
    if (step.ppeRequired.length > 0) {
      setTextColor(LIGHT_TEXT);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('PPE Required:', margin + 5, innerY);
      
      setFillColor([219, 234, 254]);
      doc.setFont('helvetica', 'normal');
      setTextColor(BRAND_COLOR);
      
      let ppeX = margin + 35;
      step.ppeRequired.forEach(ppeId => {
        const ppeLabel = PPE_LABELS[ppeId] || ppeId;
        const ppeWidth = doc.getTextWidth(ppeLabel) + 4;
        if (ppeX + ppeWidth > pageWidth - margin - 5) {
          ppeX = margin + 35;
          innerY += 6;
        }
        doc.roundedRect(ppeX, innerY - 3, ppeWidth, 5, 1, 1, 'F');
        doc.text(ppeLabel, ppeX + 2, innerY);
        ppeX += ppeWidth + 2;
      });
    }
    
    yPos += stepHeight;
  });

  // ========== SIGNATURES SECTION ==========
  yPos += 10;
  checkPageBreak(60);
  
  // Section header
  setFillColor(BRAND_COLOR);
  doc.roundedRect(margin, yPos, contentWidth, 8, 1, 1, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('SIGNATURES & APPROVAL', margin + 5, yPos + 5.5);
  
  yPos += 14;

  // Signature boxes
  const signatureBoxWidth = contentWidth / 3 - 3;
  const roles = ['worker', 'supervisor', 'safety-officer'];
  
  roles.forEach((roleId, index) => {
    const xPos = margin + (index * (signatureBoxWidth + 4));
    const sig = signatures.find(s => s.role === roleId);
    const roleLabel = ROLE_LABELS[roleId] || roleId;
    
    // Signature box
    setFillColor(sig?.signature ? [240, 253, 244] : [248, 250, 252]);
    doc.roundedRect(xPos, yPos, signatureBoxWidth, 50, 2, 2, 'F');
    doc.setDrawColor(sig?.signature ? SUCCESS_COLOR[0] : 226, sig?.signature ? SUCCESS_COLOR[1] : 232, sig?.signature ? SUCCESS_COLOR[2] : 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(xPos, yPos, signatureBoxWidth, 50, 2, 2, 'S');
    
    // Role label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setTextColor(BRAND_COLOR);
    doc.text(roleLabel, xPos + signatureBoxWidth / 2, yPos + 6, { align: 'center' });
    
    if (sig?.signature) {
      // Draw signature image
      try {
        doc.addImage(sig.signature, 'PNG', xPos + 5, yPos + 10, signatureBoxWidth - 10, 20);
      } catch (e) {
        // Fallback if image fails
        doc.setFontSize(8);
        setTextColor(LIGHT_TEXT);
        doc.text('[Signature on file]', xPos + signatureBoxWidth / 2, yPos + 22, { align: 'center' });
      }
      
      // Signed indicator
      setFillColor(SUCCESS_COLOR);
      doc.roundedRect(xPos + signatureBoxWidth - 20, yPos + 2, 18, 5, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.text('SIGNED', xPos + signatureBoxWidth - 11, yPos + 5.5, { align: 'center' });
      
      // Name
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      setTextColor(DARK_TEXT);
      doc.text(sig.name || 'Name not provided', xPos + signatureBoxWidth / 2, yPos + 36, { align: 'center' });
      
      // Timestamp
      if (sig.date) {
        const signedDate = new Date(sig.date);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        setTextColor(LIGHT_TEXT);
        doc.text(
          `${signedDate.toLocaleDateString()} ${signedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          xPos + signatureBoxWidth / 2,
          yPos + 42,
          { align: 'center' }
        );
        
        // ISO timestamp for audit
        doc.setFontSize(5);
        doc.text(signedDate.toISOString(), xPos + signatureBoxWidth / 2, yPos + 47, { align: 'center' });
      }
    } else {
      // Empty signature placeholder
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(xPos + 8, yPos + 32, xPos + signatureBoxWidth - 8, yPos + 32);
      doc.setLineDashPattern([], 0);
      
      doc.setFontSize(7);
      setTextColor(LIGHT_TEXT);
      doc.text('Pending signature', xPos + signatureBoxWidth / 2, yPos + 40, { align: 'center' });
    }
  });
  
  yPos += 58;

  // ========== FOOTER ==========
  checkPageBreak(20);
  
  // Footer line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 5;
  
  // Footer text
  doc.setFontSize(7);
  setTextColor(LIGHT_TEXT);
  doc.text(
    `Generated by safetyMEG | ${new Date().toLocaleString()} | This document is electronically generated and does not require a physical signature.`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );
  
  // Add page numbers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    setTextColor(LIGHT_TEXT);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  }

  // Add watermark for draft documents (after all content is added)
  addDraftWatermark();

  // Save the PDF
  const statusSuffix = isDraft ? '_DRAFT' : '';
  const fileName = `JSA_${jsaIdText}_${formData.title?.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30) || 'Report'}${statusSuffix}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

export default exportJSAtoPDF;
