import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Calendar, AlertTriangle, Building2, Users,
  CheckCircle, XCircle, ChevronDown, Printer, FileSpreadsheet,
  ClipboardList, Info, Shield, TrendingUp, Eye
} from 'lucide-react';

// OSHA 300 Log Entry Interface
interface OSHA300Entry {
  caseNumber: string;
  employeeName: string;
  jobTitle: string;
  dateOfInjury: string;
  whereOccurred: string;
  descriptionOfInjury: string;
  // Classification columns
  death: boolean;
  daysAwayFromWork: boolean;
  jobTransferOrRestriction: boolean;
  otherRecordableCase: boolean;
  // Days count
  daysAway: number;
  daysRestricted: number;
  // Injury/Illness type
  injuryType: 'injury' | 'skin' | 'respiratory' | 'poisoning' | 'hearing' | 'other';
}

// Mock OSHA 300 data
const mockOSHA300Data: OSHA300Entry[] = [
  {
    caseNumber: 'OSHA-2026-001',
    employeeName: 'Jennifer Martinez',
    jobTitle: 'Machine Operator',
    dateOfInjury: '2026-01-02',
    whereOccurred: 'Production Line 4',
    descriptionOfInjury: 'Hand laceration from equipment - 3cm cut on palm requiring 8 stitches',
    death: false,
    daysAwayFromWork: true,
    jobTransferOrRestriction: true,
    otherRecordableCase: false,
    daysAway: 2,
    daysRestricted: 5,
    injuryType: 'injury'
  },
  {
    caseNumber: 'OSHA-2026-002',
    employeeName: 'David Thompson',
    jobTitle: 'Water Treatment Technician',
    dateOfInjury: '2026-01-10',
    whereOccurred: 'Water Treatment Facility',
    descriptionOfInjury: 'Chlorine gas inhalation - respiratory irritation requiring hospitalization',
    death: false,
    daysAwayFromWork: true,
    jobTransferOrRestriction: false,
    otherRecordableCase: false,
    daysAway: 7,
    daysRestricted: 0,
    injuryType: 'respiratory'
  },
  {
    caseNumber: 'OSHA-2026-003',
    employeeName: 'Lisa Chen',
    jobTitle: 'Assembly Technician',
    dateOfInjury: '2026-01-15',
    whereOccurred: 'Assembly Line 2',
    descriptionOfInjury: 'Repetitive strain injury - carpal tunnel syndrome diagnosis',
    death: false,
    daysAwayFromWork: false,
    jobTransferOrRestriction: true,
    otherRecordableCase: false,
    daysAway: 0,
    daysRestricted: 14,
    injuryType: 'other'
  },
];

// Establishment info for 300A
interface EstablishmentInfo {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  industry: string;
  naicsCode: string;
  annualAvgEmployees: number;
  totalHoursWorked: number;
  companyExecutive: string;
  executiveTitle: string;
  executivePhone: string;
  certificationDate: string;
}

const defaultEstablishment: EstablishmentInfo = {
  name: 'SafetyFirst Industries, Inc.',
  street: '1234 Industrial Boulevard',
  city: 'Metro City',
  state: 'ST',
  zip: '12345',
  industry: 'Manufacturing',
  naicsCode: '332710',
  annualAvgEmployees: 250,
  totalHoursWorked: 500000,
  companyExecutive: 'Robert Henderson',
  executiveTitle: 'Chief Executive Officer',
  executivePhone: '(555) 100-0000',
  certificationDate: new Date().toISOString().split('T')[0]
};

interface OSHALogGeneratorProps {
  incidents?: OSHA300Entry[];
  establishment?: EstablishmentInfo;
  year?: number;
}

export const OSHALogGenerator: React.FC<OSHALogGeneratorProps> = ({
  incidents = mockOSHA300Data,
  establishment = defaultEstablishment,
  year = 2026
}) => {
  const [activeTab, setActiveTab] = useState<'300' | '300A' | '301'>('300');
  const [selectedEntry, setSelectedEntry] = useState<OSHA300Entry | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Calculate 300A summary statistics
  const summaryStats = useMemo(() => {
    const totalCases = incidents.length;
    const deaths = incidents.filter(i => i.death).length;
    const daysAwayFromWork = incidents.filter(i => i.daysAwayFromWork).length;
    const jobTransfer = incidents.filter(i => i.jobTransferOrRestriction).length;
    const otherRecordable = incidents.filter(i => i.otherRecordableCase).length;
    const totalDaysAway = incidents.reduce((sum, i) => sum + i.daysAway, 0);
    const totalDaysRestricted = incidents.reduce((sum, i) => sum + i.daysRestricted, 0);
    
    // Injury types
    const injuries = incidents.filter(i => i.injuryType === 'injury').length;
    const skinDisorders = incidents.filter(i => i.injuryType === 'skin').length;
    const respiratoryConditions = incidents.filter(i => i.injuryType === 'respiratory').length;
    const poisonings = incidents.filter(i => i.injuryType === 'poisoning').length;
    const hearingLoss = incidents.filter(i => i.injuryType === 'hearing').length;
    const otherIllnesses = incidents.filter(i => i.injuryType === 'other').length;

    // Incidence rates
    const trir = ((totalCases * 200000) / establishment.totalHoursWorked).toFixed(2);
    const dart = (((daysAwayFromWork + jobTransfer) * 200000) / establishment.totalHoursWorked).toFixed(2);

    return {
      totalCases,
      deaths,
      daysAwayFromWork,
      jobTransfer,
      otherRecordable,
      totalDaysAway,
      totalDaysRestricted,
      injuries,
      skinDisorders,
      respiratoryConditions,
      poisonings,
      hearingLoss,
      otherIllnesses,
      trir,
      dart
    };
  }, [incidents, establishment]);

  // Export OSHA 300 to CSV
  const exportOSHA300ToCSV = () => {
    const headers = [
      'Case No.', 'Employee Name', 'Job Title', 'Date of Injury',
      'Where Event Occurred', 'Description', 'Death', 'Days Away',
      'Job Transfer/Restriction', 'Other Recordable', 'Days Away Count',
      'Days Restricted Count', 'Injury Type'
    ];
    
    const csvRows = incidents.map(i => [
      i.caseNumber,
      `"${i.employeeName}"`,
      `"${i.jobTitle}"`,
      i.dateOfInjury,
      `"${i.whereOccurred}"`,
      `"${i.descriptionOfInjury.replace(/"/g, '""')}"`,
      i.death ? 'X' : '',
      i.daysAwayFromWork ? 'X' : '',
      i.jobTransferOrRestriction ? 'X' : '',
      i.otherRecordableCase ? 'X' : '',
      i.daysAway,
      i.daysRestricted,
      i.injuryType
    ]);
    
    const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OSHA-300-Log-${year}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Export OSHA 300A Summary to PDF
  const exportOSHA300APrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to export PDF');
      return;
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>OSHA Form 300A - Summary of Work-Related Injuries and Illnesses - ${year}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 10px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid black; padding-bottom: 10px; }
          .header h1 { font-size: 14px; margin-bottom: 5px; }
          .header p { font-size: 10px; color: #666; }
          .form-title { background: #1e40af; color: white; padding: 8px; text-align: center; font-size: 12px; font-weight: bold; margin: 10px 0; }
          .section { border: 1px solid #333; margin: 10px 0; }
          .section-header { background: #f0f0f0; padding: 5px 10px; font-weight: bold; font-size: 11px; border-bottom: 1px solid #333; }
          .section-content { padding: 10px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
          .grid-6 { display: grid; grid-template-columns: repeat(6, 1fr); gap: 5px; }
          .field { margin: 5px 0; }
          .field-label { font-size: 8px; color: #666; text-transform: uppercase; }
          .field-value { font-size: 11px; font-weight: bold; border-bottom: 1px solid #999; padding: 3px 0; min-height: 18px; }
          .stat-box { text-align: center; padding: 10px; border: 1px solid #ddd; }
          .stat-value { font-size: 24px; font-weight: bold; color: #1e40af; }
          .stat-label { font-size: 8px; color: #666; text-transform: uppercase; }
          .injury-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .injury-table th, .injury-table td { border: 1px solid #333; padding: 5px; text-align: center; }
          .injury-table th { background: #f0f0f0; font-size: 9px; }
          .certification { margin-top: 20px; padding: 15px; border: 2px solid #333; }
          .signature-line { border-top: 1px solid #333; margin-top: 30px; padding-top: 5px; font-size: 9px; }
          .footer { margin-top: 20px; text-align: center; font-size: 8px; color: #666; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>OSHA's Form 300A (Rev. 01/2004)</h1>
          <p>Summary of Work-Related Injuries and Illnesses</p>
        </div>
        
        <div class="form-title">Year ${year}</div>
        
        <div class="section">
          <div class="section-header">Establishment Information</div>
          <div class="section-content grid-2">
            <div>
              <div class="field">
                <div class="field-label">Establishment Name</div>
                <div class="field-value">${establishment.name}</div>
              </div>
              <div class="field">
                <div class="field-label">Street Address</div>
                <div class="field-value">${establishment.street}</div>
              </div>
              <div class="field">
                <div class="field-label">City, State, ZIP</div>
                <div class="field-value">${establishment.city}, ${establishment.state} ${establishment.zip}</div>
              </div>
            </div>
            <div>
              <div class="field">
                <div class="field-label">Industry Description</div>
                <div class="field-value">${establishment.industry}</div>
              </div>
              <div class="field">
                <div class="field-label">Standard Industrial Classification (NAICS)</div>
                <div class="field-value">${establishment.naicsCode}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-header">Employment Information</div>
          <div class="section-content grid-2">
            <div class="stat-box">
              <div class="stat-value">${establishment.annualAvgEmployees}</div>
              <div class="stat-label">Annual Average Number of Employees</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${establishment.totalHoursWorked.toLocaleString()}</div>
              <div class="stat-label">Total Hours Worked by All Employees Last Year</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-header">Number of Cases</div>
          <div class="section-content">
            <div class="grid-3" style="margin-bottom: 15px;">
              <div class="stat-box">
                <div class="stat-value">${summaryStats.totalCases}</div>
                <div class="stat-label">Total Number of Cases</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${summaryStats.trir}</div>
                <div class="stat-label">TRIR (Total Recordable Incident Rate)</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${summaryStats.dart}</div>
                <div class="stat-label">DART Rate</div>
              </div>
            </div>
            <table class="injury-table">
              <thead>
                <tr>
                  <th>(G) Deaths</th>
                  <th>(H) Days Away From Work</th>
                  <th>(I) Job Transfer or Restriction</th>
                  <th>(J) Other Recordable Cases</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-size: 16px; font-weight: bold;">${summaryStats.deaths}</td>
                  <td style="font-size: 16px; font-weight: bold;">${summaryStats.daysAwayFromWork}</td>
                  <td style="font-size: 16px; font-weight: bold;">${summaryStats.jobTransfer}</td>
                  <td style="font-size: 16px; font-weight: bold;">${summaryStats.otherRecordable}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="section">
          <div class="section-header">Number of Days</div>
          <div class="section-content grid-2">
            <div class="stat-box">
              <div class="stat-value">${summaryStats.totalDaysAway}</div>
              <div class="stat-label">(K) Total Days Away From Work</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${summaryStats.totalDaysRestricted}</div>
              <div class="stat-label">(L) Total Days of Job Transfer or Restriction</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-header">Injury and Illness Types</div>
          <div class="section-content">
            <table class="injury-table">
              <thead>
                <tr>
                  <th>(M1) Injuries</th>
                  <th>(M2) Skin Disorders</th>
                  <th>(M3) Respiratory Conditions</th>
                  <th>(M4) Poisonings</th>
                  <th>(M5) Hearing Loss</th>
                  <th>(M6) All Other Illnesses</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-size: 16px; font-weight: bold;">${summaryStats.injuries}</td>
                  <td style="font-size: 16px; font-weight: bold;">${summaryStats.skinDisorders}</td>
                  <td style="font-size: 16px; font-weight: bold;">${summaryStats.respiratoryConditions}</td>
                  <td style="font-size: 16px; font-weight: bold;">${summaryStats.poisonings}</td>
                  <td style="font-size: 16px; font-weight: bold;">${summaryStats.hearingLoss}</td>
                  <td style="font-size: 16px; font-weight: bold;">${summaryStats.otherIllnesses}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="certification">
          <div style="font-weight: bold; margin-bottom: 10px;">Certification</div>
          <p style="font-size: 9px; margin-bottom: 15px;">
            I certify that I have examined this document and that to the best of my knowledge the entries are true, accurate, and complete.
          </p>
          <div class="grid-2">
            <div>
              <div class="signature-line">Company Executive: ${establishment.companyExecutive}</div>
              <div class="signature-line">Title: ${establishment.executiveTitle}</div>
            </div>
            <div>
              <div class="signature-line">Phone: ${establishment.executivePhone}</div>
              <div class="signature-line">Date: ${establishment.certificationDate}</div>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>U.S. Department of Labor - Occupational Safety and Health Administration</p>
          <p>Post this Summary page from February 1 to April 30 of the year following the year covered by the form.</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
    setShowExportMenu(false);
  };

  // Export OSHA 301 for a specific incident
  const exportOSHA301 = (entry: OSHA300Entry) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to export PDF');
      return;
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>OSHA Form 301 - Injury and Illness Incident Report - ${entry.caseNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 10px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid black; padding-bottom: 10px; }
          .header h1 { font-size: 14px; margin-bottom: 5px; }
          .case-number { background: #1e40af; color: white; padding: 5px 15px; display: inline-block; font-weight: bold; margin: 10px 0; }
          .section { border: 1px solid #333; margin: 15px 0; }
          .section-header { background: #f0f0f0; padding: 8px 10px; font-weight: bold; font-size: 11px; border-bottom: 1px solid #333; }
          .section-content { padding: 15px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .field { margin: 10px 0; }
          .field-label { font-size: 9px; color: #666; text-transform: uppercase; margin-bottom: 3px; }
          .field-value { font-size: 11px; border: 1px solid #ccc; padding: 8px; min-height: 25px; background: #fafafa; }
          .checkbox-group { display: flex; gap: 20px; flex-wrap: wrap; }
          .checkbox-item { display: flex; align-items: center; gap: 5px; }
          .checkbox { width: 15px; height: 15px; border: 1px solid #333; display: flex; align-items: center; justify-content: center; }
          .checked { background: #1e40af; color: white; }
          .description-box { min-height: 80px; }
          .footer { margin-top: 20px; text-align: center; font-size: 8px; color: #666; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>OSHA's Form 301</h1>
          <p>Injury and Illness Incident Report</p>
        </div>
        
        <div style="text-align: center;">
          <div class="case-number">Case Number: ${entry.caseNumber}</div>
        </div>
        
        <div class="section">
          <div class="section-header">Information About the Employee</div>
          <div class="section-content grid-2">
            <div class="field">
              <div class="field-label">Full Name</div>
              <div class="field-value">${entry.employeeName}</div>
            </div>
            <div class="field">
              <div class="field-label">Job Title</div>
              <div class="field-value">${entry.jobTitle}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-header">Information About the Case</div>
          <div class="section-content">
            <div class="grid-2">
              <div class="field">
                <div class="field-label">Date of Injury or Illness</div>
                <div class="field-value">${entry.dateOfInjury}</div>
              </div>
              <div class="field">
                <div class="field-label">Where the Event Occurred</div>
                <div class="field-value">${entry.whereOccurred}</div>
              </div>
            </div>
            <div class="field">
              <div class="field-label">Describe the Injury or Illness, Parts of Body Affected, and Object/Substance That Directly Injured or Made Person Ill</div>
              <div class="field-value description-box">${entry.descriptionOfInjury}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-header">Classification</div>
          <div class="section-content">
            <div class="checkbox-group">
              <div class="checkbox-item">
                <div class="checkbox ${entry.death ? 'checked' : ''}">${entry.death ? '✓' : ''}</div>
                <span>Death</span>
              </div>
              <div class="checkbox-item">
                <div class="checkbox ${entry.daysAwayFromWork ? 'checked' : ''}">${entry.daysAwayFromWork ? '✓' : ''}</div>
                <span>Days Away From Work</span>
              </div>
              <div class="checkbox-item">
                <div class="checkbox ${entry.jobTransferOrRestriction ? 'checked' : ''}">${entry.jobTransferOrRestriction ? '✓' : ''}</div>
                <span>Job Transfer or Restriction</span>
              </div>
              <div class="checkbox-item">
                <div class="checkbox ${entry.otherRecordableCase ? 'checked' : ''}">${entry.otherRecordableCase ? '✓' : ''}</div>
                <span>Other Recordable Case</span>
              </div>
            </div>
            <div class="grid-2" style="margin-top: 15px;">
              <div class="field">
                <div class="field-label">Number of Days Away From Work</div>
                <div class="field-value">${entry.daysAway}</div>
              </div>
              <div class="field">
                <div class="field-label">Number of Days of Job Transfer or Restriction</div>
                <div class="field-value">${entry.daysRestricted}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-header">Establishment Information</div>
          <div class="section-content grid-2">
            <div class="field">
              <div class="field-label">Establishment Name</div>
              <div class="field-value">${establishment.name}</div>
            </div>
            <div class="field">
              <div class="field-label">Address</div>
              <div class="field-value">${establishment.street}, ${establishment.city}, ${establishment.state} ${establishment.zip}</div>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>U.S. Department of Labor - Occupational Safety and Health Administration</p>
          <p>Form 301 must be completed within 7 calendar days of receiving information that a recordable work-related injury or illness has occurred.</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-500" />
            OSHA Log Generator
          </h2>
          <p className="text-sm text-surface-500">Generate OSHA Forms 300, 300A, and 301</p>
        </div>
        
        {/* Export Button */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
            <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-surface-100 overflow-hidden z-50"
              >
                <button
                  onClick={exportOSHA300ToCSV}
                  className="w-full px-4 py-3 text-left hover:bg-surface-50 flex items-center gap-3 transition-colors"
                >
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-surface-800">Form 300 (CSV)</p>
                    <p className="text-xs text-surface-500">Log of Injuries/Illnesses</p>
                  </div>
                </button>
                <button
                  onClick={exportOSHA300APrint}
                  className="w-full px-4 py-3 text-left hover:bg-surface-50 flex items-center gap-3 transition-colors border-t border-surface-100"
                >
                  <Printer className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-surface-800">Form 300A (PDF)</p>
                    <p className="text-xs text-surface-500">Annual Summary</p>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-white rounded-2xl p-2 border border-surface-100 shadow-soft">
        {[
          { id: '300', label: 'Form 300', desc: 'Log of Injuries', icon: ClipboardList },
          { id: '300A', label: 'Form 300A', desc: 'Annual Summary', icon: TrendingUp },
          { id: '301', label: 'Form 301', desc: 'Incident Reports', icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as '300' | '300A' | '301')}
            className={`flex-1 px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 ${
              activeTab === tab.id
                ? 'bg-brand-500 text-white'
                : 'bg-surface-50 text-surface-600 hover:bg-surface-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <div className="text-left">
              <p className="font-bold text-sm">{tab.label}</p>
              <p className={`text-xs ${activeTab === tab.id ? 'text-brand-100' : 'text-surface-400'}`}>{tab.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Form 300 - Log View */}
      {activeTab === '300' && (
        <div className="bg-white rounded-2xl border border-surface-100 shadow-soft overflow-hidden">
          <div className="p-4 border-b border-surface-100 bg-surface-50">
            <h3 className="font-bold text-brand-900">OSHA Form 300 - Log of Work-Related Injuries and Illnesses</h3>
            <p className="text-sm text-surface-500">Year: {year} | Establishment: {establishment.name}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-50">
                <tr>
                  <th className="text-left p-3 font-bold text-brand-800 border-b border-brand-100">Case No.</th>
                  <th className="text-left p-3 font-bold text-brand-800 border-b border-brand-100">Employee</th>
                  <th className="text-left p-3 font-bold text-brand-800 border-b border-brand-100">Job Title</th>
                  <th className="text-left p-3 font-bold text-brand-800 border-b border-brand-100">Date</th>
                  <th className="text-left p-3 font-bold text-brand-800 border-b border-brand-100">Location</th>
                  <th className="text-center p-3 font-bold text-brand-800 border-b border-brand-100" title="Death">G</th>
                  <th className="text-center p-3 font-bold text-brand-800 border-b border-brand-100" title="Days Away">H</th>
                  <th className="text-center p-3 font-bold text-brand-800 border-b border-brand-100" title="Job Transfer">I</th>
                  <th className="text-center p-3 font-bold text-brand-800 border-b border-brand-100" title="Other">J</th>
                  <th className="text-center p-3 font-bold text-brand-800 border-b border-brand-100">Days Away</th>
                  <th className="text-center p-3 font-bold text-brand-800 border-b border-brand-100">Days Restricted</th>
                  <th className="text-center p-3 font-bold text-brand-800 border-b border-brand-100">Actions</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((entry, index) => (
                  <tr key={entry.caseNumber} className={index % 2 === 0 ? 'bg-white' : 'bg-surface-50'}>
                    <td className="p-3 font-mono text-xs">{entry.caseNumber}</td>
                    <td className="p-3 font-medium">{entry.employeeName}</td>
                    <td className="p-3 text-surface-600">{entry.jobTitle}</td>
                    <td className="p-3 text-surface-600">{entry.dateOfInjury}</td>
                    <td className="p-3 text-surface-600 max-w-[150px] truncate">{entry.whereOccurred}</td>
                    <td className="p-3 text-center">
                      {entry.death && <XCircle className="w-4 h-4 text-red-600 mx-auto" />}
                    </td>
                    <td className="p-3 text-center">
                      {entry.daysAwayFromWork && <CheckCircle className="w-4 h-4 text-orange-600 mx-auto" />}
                    </td>
                    <td className="p-3 text-center">
                      {entry.jobTransferOrRestriction && <CheckCircle className="w-4 h-4 text-amber-600 mx-auto" />}
                    </td>
                    <td className="p-3 text-center">
                      {entry.otherRecordableCase && <CheckCircle className="w-4 h-4 text-blue-600 mx-auto" />}
                    </td>
                    <td className="p-3 text-center font-bold">{entry.daysAway}</td>
                    <td className="p-3 text-center font-bold">{entry.daysRestricted}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => exportOSHA301(entry)}
                        className="p-2 hover:bg-brand-100 rounded-lg transition-colors"
                        title="Export Form 301"
                      >
                        <FileText className="w-4 h-4 text-brand-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form 300A - Summary View */}
      {activeTab === '300A' && (
        <div className="space-y-6">
          {/* Establishment Info */}
          <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft">
            <h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-500" />
              Establishment Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-bold text-surface-400 uppercase mb-1">Name</p>
                <p className="font-medium">{establishment.name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-surface-400 uppercase mb-1">Industry</p>
                <p className="font-medium">{establishment.industry}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-surface-400 uppercase mb-1">NAICS Code</p>
                <p className="font-medium">{establishment.naicsCode}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-surface-400 uppercase mb-1">Year</p>
                <p className="font-medium">{year}</p>
              </div>
            </div>
          </div>

          {/* Employment & Rates */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
              <p className="text-xs font-bold text-surface-400 uppercase mb-1">Avg. Employees</p>
              <p className="text-2xl font-bold text-surface-800">{establishment.annualAvgEmployees}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
              <p className="text-xs font-bold text-surface-400 uppercase mb-1">Hours Worked</p>
              <p className="text-2xl font-bold text-surface-800">{(establishment.totalHoursWorked / 1000).toFixed(0)}K</p>
            </div>
            <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
              <p className="text-xs font-bold text-brand-400 uppercase mb-1">TRIR</p>
              <p className="text-2xl font-bold text-brand-700">{summaryStats.trir}</p>
            </div>
            <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
              <p className="text-xs font-bold text-brand-400 uppercase mb-1">DART Rate</p>
              <p className="text-2xl font-bold text-brand-700">{summaryStats.dart}</p>
            </div>
          </div>

          {/* Case Classification */}
          <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft">
            <h3 className="font-bold text-brand-900 mb-4">Number of Cases</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-surface-50 rounded-xl">
                <p className="text-3xl font-bold text-surface-800">{summaryStats.totalCases}</p>
                <p className="text-xs text-surface-500 uppercase font-bold">Total Cases</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <p className="text-3xl font-bold text-red-600">{summaryStats.deaths}</p>
                <p className="text-xs text-red-500 uppercase font-bold">(G) Deaths</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <p className="text-3xl font-bold text-orange-600">{summaryStats.daysAwayFromWork}</p>
                <p className="text-xs text-orange-500 uppercase font-bold">(H) Days Away</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-xl">
                <p className="text-3xl font-bold text-amber-600">{summaryStats.jobTransfer}</p>
                <p className="text-xs text-amber-500 uppercase font-bold">(I) Job Transfer</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-3xl font-bold text-blue-600">{summaryStats.otherRecordable}</p>
                <p className="text-xs text-blue-500 uppercase font-bold">(J) Other</p>
              </div>
            </div>
          </div>

          {/* Days Count & Injury Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft">
              <h3 className="font-bold text-brand-900 mb-4">Number of Days</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-6 bg-purple-50 rounded-xl">
                  <p className="text-4xl font-bold text-purple-600">{summaryStats.totalDaysAway}</p>
                  <p className="text-sm text-purple-500 font-medium">Days Away (K)</p>
                </div>
                <div className="text-center p-6 bg-indigo-50 rounded-xl">
                  <p className="text-4xl font-bold text-indigo-600">{summaryStats.totalDaysRestricted}</p>
                  <p className="text-sm text-indigo-500 font-medium">Days Restricted (L)</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft">
              <h3 className="font-bold text-brand-900 mb-4">Injury & Illness Types</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-surface-50 rounded-lg">
                  <p className="text-xl font-bold">{summaryStats.injuries}</p>
                  <p className="text-xs text-surface-500">Injuries (M1)</p>
                </div>
                <div className="text-center p-3 bg-surface-50 rounded-lg">
                  <p className="text-xl font-bold">{summaryStats.skinDisorders}</p>
                  <p className="text-xs text-surface-500">Skin (M2)</p>
                </div>
                <div className="text-center p-3 bg-surface-50 rounded-lg">
                  <p className="text-xl font-bold">{summaryStats.respiratoryConditions}</p>
                  <p className="text-xs text-surface-500">Respiratory (M3)</p>
                </div>
                <div className="text-center p-3 bg-surface-50 rounded-lg">
                  <p className="text-xl font-bold">{summaryStats.poisonings}</p>
                  <p className="text-xs text-surface-500">Poisoning (M4)</p>
                </div>
                <div className="text-center p-3 bg-surface-50 rounded-lg">
                  <p className="text-xl font-bold">{summaryStats.hearingLoss}</p>
                  <p className="text-xs text-surface-500">Hearing (M5)</p>
                </div>
                <div className="text-center p-3 bg-surface-50 rounded-lg">
                  <p className="text-xl font-bold">{summaryStats.otherIllnesses}</p>
                  <p className="text-xs text-surface-500">Other (M6)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Print Button */}
          <div className="flex justify-center">
            <button
              onClick={exportOSHA300APrint}
              className="px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Print Form 300A Summary
            </button>
          </div>
        </div>
      )}

      {/* Form 301 - Individual Reports */}
      {activeTab === '301' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">OSHA Form 301 - Injury and Illness Incident Report</p>
              <p className="text-sm text-amber-700">Select an incident below to generate the detailed Form 301 report.</p>
            </div>
          </div>

          <div className="grid gap-4">
            {incidents.map(entry => (
              <motion.div
                key={entry.caseNumber}
                className="bg-white rounded-2xl border border-surface-100 shadow-soft p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-sm font-bold">
                        {entry.caseNumber}
                      </span>
                      <span className="text-surface-500 text-sm">{entry.dateOfInjury}</span>
                    </div>
                    <h4 className="font-bold text-surface-800 mb-1">{entry.employeeName}</h4>
                    <p className="text-sm text-surface-500 mb-2">{entry.jobTitle} • {entry.whereOccurred}</p>
                    <p className="text-sm text-surface-600">{entry.descriptionOfInjury}</p>
                    <div className="flex gap-4 mt-3 text-xs">
                      {entry.daysAway > 0 && (
                        <span className="text-orange-600">{entry.daysAway} days away</span>
                      )}
                      {entry.daysRestricted > 0 && (
                        <span className="text-amber-600">{entry.daysRestricted} days restricted</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => exportOSHA301(entry)}
                    className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print 301
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OSHALogGenerator;
