/**
 * Excel Export Utility for Safety Reports
 * Uses SheetJS (xlsx) for Excel file generation
 */

export interface ExcelExportData {
  sheetName: string;
  headers: string[];
  rows: (string | number | boolean | Date | null)[][];
  columnWidths?: number[];
}

export interface MultiSheetExportData {
  fileName: string;
  sheets: ExcelExportData[];
}

// Lightweight CSV/Excel export without external dependencies
export const exportToCSV = (data: ExcelExportData, fileName: string): void => {
  const escapeCSV = (value: string | number | boolean | Date | null): string => {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString();
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    data.headers.map(h => escapeCSV(h)).join(','),
    ...data.rows.map(row => row.map(cell => escapeCSV(cell)).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// Excel export using HTML table (opens in Excel)
export const exportToExcel = (data: ExcelExportData, fileName: string): void => {
  const escapeHtml = (value: string | number | boolean | Date | null): string => {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  const tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${data.sheetName}</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; }
        th { background-color: #5a8069; color: white; font-weight: bold; padding: 8px; border: 1px solid #ccc; }
        td { padding: 6px; border: 1px solid #ccc; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .severity-critical { background-color: #fecaca; color: #991b1b; }
        .severity-high { background-color: #fed7aa; color: #9a3412; }
        .severity-medium { background-color: #fef08a; color: #854d0e; }
        .severity-low { background-color: #bbf7d0; color: #166534; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>${data.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${data.rows.map(row => 
            `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`
          ).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.xls`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// Multi-sheet Excel export
export const exportMultiSheetExcel = (data: MultiSheetExportData): void => {
  // For multi-sheet, we create a zip-like structure with multiple HTML files
  // This is a simplified version - for full xlsx support, use SheetJS library
  
  const sheets = data.sheets.map((sheet, index) => {
    const escapeHtml = (value: string | number | boolean | Date | null): string => {
      if (value === null || value === undefined) return '';
      if (value instanceof Date) return value.toLocaleDateString();
      return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    return `
      <Worksheet ss:Name="${sheet.sheetName}">
        <Table>
          <Row>${sheet.headers.map(h => `<Cell><Data ss:Type="String">${escapeHtml(h)}</Data></Cell>`).join('')}</Row>
          ${sheet.rows.map(row => 
            `<Row>${row.map(cell => {
              const type = typeof cell === 'number' ? 'Number' : 'String';
              return `<Cell><Data ss:Type="${type}">${escapeHtml(cell)}</Data></Cell>`;
            }).join('')}</Row>`
          ).join('')}
        </Table>
      </Worksheet>
    `;
  }).join('');

  const xmlContent = `<?xml version="1.0"?>
    <?mso-application progid="Excel.Sheet"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
      xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
      <Styles>
        <Style ss:ID="Header">
          <Font ss:Bold="1" ss:Color="#FFFFFF"/>
          <Interior ss:Color="#5a8069" ss:Pattern="Solid"/>
        </Style>
      </Styles>
      ${sheets}
    </Workbook>
  `;

  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${data.fileName}.xls`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// Incident Report Excel Export
export interface IncidentReportExcelData {
  reportId: string;
  date: string;
  time: string;
  location: string;
  department: string;
  incidentType: string;
  severity: string;
  description: string;
  injuredPerson?: string;
  injuryType?: string;
  bodyParts?: string[];
  witnesses?: string;
  immediateActions?: string;
  rootCauses?: string;
  correctiveActions?: string;
  oshaRecordable?: boolean;
  dob?: string;
  medicalProvider?: string;
  clinicInfo?: string;
  containmentActions?: string;
  lessonsLearned?: string;
}

export const exportIncidentToExcel = (incident: IncidentReportExcelData): void => {
  const data: ExcelExportData = {
    sheetName: 'Incident Report',
    headers: ['Field', 'Value'],
    rows: [
      ['Report ID', incident.reportId],
      ['Date', incident.date],
      ['Time', incident.time],
      ['Location', incident.location],
      ['Department', incident.department],
      ['Incident Type', incident.incidentType],
      ['Severity', incident.severity],
      ['Description', incident.description],
      ['Injured Person', incident.injuredPerson || 'N/A'],
      ['Date of Birth', incident.dob || 'N/A'],
      ['Injury Type', incident.injuryType || 'N/A'],
      ['Body Parts Affected', incident.bodyParts?.join(', ') || 'N/A'],
      ['Witnesses', incident.witnesses || 'None'],
      ['OSHA Recordable', incident.oshaRecordable ? 'Yes' : 'No'],
      ['Medical Provider', incident.medicalProvider || 'N/A'],
      ['Clinic Information', incident.clinicInfo || 'N/A'],
      ['Immediate Actions', incident.immediateActions || 'N/A'],
      ['Containment Actions', incident.containmentActions || 'N/A'],
      ['Root Causes', incident.rootCauses || 'N/A'],
      ['Corrective Actions', incident.correctiveActions || 'N/A'],
      ['Lessons Learned', incident.lessonsLearned || 'N/A']
    ]
  };

  exportToExcel(data, `incident-report-${incident.reportId}`);
};

// Bulk incidents export
export const exportIncidentsListToExcel = (incidents: IncidentReportExcelData[]): void => {
  const data: ExcelExportData = {
    sheetName: 'Incident Reports',
    headers: [
      'Report ID', 'Date', 'Time', 'Location', 'Department', 
      'Type', 'Severity', 'Injured Person', 'DOB', 'Injury Type',
      'Body Parts', 'OSHA Recordable', 'Medical Provider', 'Status'
    ],
    rows: incidents.map(inc => [
      inc.reportId,
      inc.date,
      inc.time,
      inc.location,
      inc.department,
      inc.incidentType,
      inc.severity,
      inc.injuredPerson || '',
      inc.dob || '',
      inc.injuryType || '',
      inc.bodyParts?.join(', ') || '',
      inc.oshaRecordable ? 'Yes' : 'No',
      inc.medicalProvider || '',
      'Reported'
    ])
  };

  exportToExcel(data, `incident-reports-${new Date().toISOString().split('T')[0]}`);
};

// Root Cause Analysis Export
export interface RCAExportData {
  problemStatement: string;
  fishboneCauses: { category: string; causes: string[] }[];
  fiveWhys: { level: number; answer: string; isRootCause: boolean }[];
  rootCause: string;
  correctiveActions: string[];
  lessonsLearned: string;
}

export const exportRCAToExcel = (rca: RCAExportData, fileName: string): void => {
  const sheets: ExcelExportData[] = [
    {
      sheetName: 'Summary',
      headers: ['Item', 'Details'],
      rows: [
        ['Problem Statement', rca.problemStatement],
        ['Identified Root Cause', rca.rootCause],
        ['Lessons Learned', rca.lessonsLearned]
      ]
    },
    {
      sheetName: 'Fishbone Analysis',
      headers: ['Category', 'Causes'],
      rows: rca.fishboneCauses.map(cat => [
        cat.category,
        cat.causes.join('; ')
      ])
    },
    {
      sheetName: '5 Whys Analysis',
      headers: ['Why Level', 'Answer', 'Root Cause'],
      rows: rca.fiveWhys.map(why => [
        `Why #${why.level}`,
        why.answer,
        why.isRootCause ? 'Yes' : 'No'
      ])
    },
    {
      sheetName: 'Corrective Actions',
      headers: ['#', 'Action'],
      rows: rca.correctiveActions.map((action, i) => [i + 1, action])
    }
  ];

  exportMultiSheetExcel({ fileName, sheets });
};

// Investigation Report Excel Export
export interface InvestigationExcelData {
  id: string;
  incident: string;
  incidentId: string;
  date: string;
  status: string;
  industry: string;
  investigator: string;
  severity: string;
  findings: string;
  rootCauses: string[];
  contributingFactors: string[];
  correctiveActions: { 
    id: string; 
    action: string; 
    assignedTo: string; 
    dueDate: string; 
    status: string;
  }[];
  isoClause: string;
  regulatoryReportable: boolean;
}

export const exportInvestigationToExcel = (investigation: InvestigationExcelData): void => {
  const sheets: ExcelExportData[] = [
    {
      sheetName: 'Investigation Summary',
      headers: ['Field', 'Value'],
      rows: [
        ['Investigation ID', investigation.id],
        ['Incident Reference', investigation.incidentId],
        ['Incident Description', investigation.incident],
        ['Date', investigation.date],
        ['Status', investigation.status],
        ['Industry', investigation.industry],
        ['Lead Investigator', investigation.investigator],
        ['Severity', investigation.severity],
        ['ISO Clause', investigation.isoClause],
        ['Regulatory Reportable', investigation.regulatoryReportable ? 'Yes' : 'No'],
        ['Findings', investigation.findings]
      ]
    },
    {
      sheetName: 'Root Cause Analysis',
      headers: ['#', 'Root Cause'],
      rows: investigation.rootCauses.map((cause, i) => [i + 1, cause])
    },
    {
      sheetName: 'Contributing Factors',
      headers: ['#', 'Factor'],
      rows: investigation.contributingFactors.map((factor, i) => [i + 1, factor])
    },
    {
      sheetName: 'Corrective Actions',
      headers: ['Action ID', 'Action', 'Assigned To', 'Due Date', 'Status'],
      rows: investigation.correctiveActions.map(action => [
        action.id,
        action.action,
        action.assignedTo,
        action.dueDate,
        action.status
      ])
    }
  ];

  exportMultiSheetExcel({ 
    fileName: `investigation-${investigation.id}-${new Date().toISOString().split('T')[0]}`, 
    sheets 
  });
};

// Bulk investigations export
export const exportInvestigationsListToExcel = (investigations: InvestigationExcelData[]): void => {
  const data: ExcelExportData = {
    sheetName: 'Investigation Reports',
    headers: [
      'Investigation ID', 'Incident ID', 'Incident', 'Date', 'Status', 
      'Industry', 'Investigator', 'Severity', 'ISO Clause', 'OSHA Reportable',
      'Root Causes Count', 'Corrective Actions Count'
    ],
    rows: investigations.map(inv => [
      inv.id,
      inv.incidentId,
      inv.incident,
      inv.date,
      inv.status,
      inv.industry,
      inv.investigator,
      inv.severity,
      inv.isoClause,
      inv.regulatoryReportable ? 'Yes' : 'No',
      inv.rootCauses.length,
      inv.correctiveActions.length
    ])
  };

  exportToExcel(data, `investigation-reports-${new Date().toISOString().split('T')[0]}`);
};

export default {
  exportToCSV,
  exportToExcel,
  exportMultiSheetExcel,
  exportIncidentToExcel,
  exportIncidentsListToExcel,
  exportRCAToExcel,
  exportInvestigationToExcel,
  exportInvestigationsListToExcel
};
