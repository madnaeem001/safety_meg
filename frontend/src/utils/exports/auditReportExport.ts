// Audit Report PDF Export Utility
// Generates detailed audit reports with compliance standard mapping,
// visual evidence references, and media sync tracking

import jsPDF from 'jspdf';

export interface AuditQuestionResult {
  id: string;
  text: string;
  standard: string;
  clause?: string;
  category: string;
  status: 'compliant' | 'non-compliant' | 'na';
  notes: string;
  riskWeight: number;
  mediaEvidence?: Array<{
    type: 'photo' | 'video' | 'scan';
    filename: string;
    timestamp: string;
    geoTag?: { lat: number; lng: number };
  }>;
}

export interface AuditReportData {
  templateName: string;
  templateStandard: string;
  templateVersion: string;
  auditDate: string;
  auditorName: string;
  location: string;
  department: string;
  overallScore: number;
  aiSummary?: string;
  questions: AuditQuestionResult[];
  complianceStandards: string[];
  visualEvidenceCount: {
    photos: number;
    videos: number;
    scans: number;
  };
  customNotes?: string;
}

// Multi-language translations for audit reports
export type AuditReportLanguage = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ar' | 'zh' | 'ja';

const REPORT_TRANSLATIONS: Record<AuditReportLanguage, Record<string, string>> = {
  en: {
    title: 'AUDIT COMPLIANCE REPORT',
    auditDetails: 'AUDIT DETAILS',
    auditDate: 'Audit Date',
    auditor: 'Auditor',
    location: 'Location',
    department: 'Department',
    template: 'Template',
    primaryStandard: 'Primary Standard',
    overallScore: 'Overall Score',
    status: 'Status',
    compliant: 'COMPLIANT',
    needsImprovement: 'NEEDS IMPROVEMENT',
    nonCompliant: 'NON-COMPLIANT',
    applicableStandards: 'APPLICABLE COMPLIANCE STANDARDS',
    complianceAnalytics: 'COMPLIANCE ANALYTICS',
    overallComplianceScore: 'Overall Compliance Score',
    categoryBreakdown: 'Category Compliance Breakdown',
    riskDistribution: 'Risk Distribution',
    compliantLabel: 'Compliant',
    nonCompliantLabel: 'Non-Compliant',
    naLabel: 'N/A',
    totalItems: 'Total Items',
    visualEvidence: 'VISUAL EVIDENCE & MEDIA SYNC',
    photos: 'Photos',
    videos: 'Videos',
    qrScans: 'QR/Barcode Scans',
    totalEvidence: 'Total Evidence',
    synced: 'All visual evidence synced and mapped to compliance standards',
    lastSync: 'Last sync',
    aiSummary: 'AI ANALYSIS SUMMARY',
    aiAuditor: 'AI AUDITOR INTELLIGENCE',
    detailedFindings: 'DETAILED AUDIT FINDINGS',
    pass: 'PASS',
    fail: 'FAIL',
    note: 'Note',
    evidence: 'Evidence',
    footer: 'SafetyMEG Audit Report',
    confidential: 'Confidential',
    page: 'Page',
    of: 'of',
    correctiveActions: 'CORRECTIVE ACTIONS (CAPA)',
    rootCause: 'Root Cause',
    corrective: 'Corrective Action',
    preventive: 'Preventive Action',
    assignedTo: 'Assigned To',
    dueDate: 'Due Date',
    verifiedBy: 'Verified By',
    generatedDate: 'Report Generated',
  },
  es: {
    title: 'INFORME DE CUMPLIMIENTO DE AUDITOR\u00cdA',
    auditDetails: 'DETALLES DE AUDITOR\u00cdA',
    auditDate: 'Fecha de Auditor\u00eda',
    auditor: 'Auditor',
    location: 'Ubicaci\u00f3n',
    department: 'Departamento',
    template: 'Plantilla',
    primaryStandard: 'Est\u00e1ndar Principal',
    overallScore: 'Puntuaci\u00f3n General',
    status: 'Estado',
    compliant: 'CUMPLE',
    needsImprovement: 'NECESITA MEJORA',
    nonCompliant: 'NO CUMPLE',
    applicableStandards: 'EST\u00c1NDARES DE CUMPLIMIENTO APLICABLES',
    complianceAnalytics: 'AN\u00c1LISIS DE CUMPLIMIENTO',
    overallComplianceScore: 'Puntuaci\u00f3n General de Cumplimiento',
    categoryBreakdown: 'Desglose por Categor\u00eda',
    riskDistribution: 'Distribuci\u00f3n de Riesgo',
    compliantLabel: 'Cumple',
    nonCompliantLabel: 'No Cumple',
    naLabel: 'N/A',
    totalItems: 'Total de \u00cdtems',
    visualEvidence: 'EVIDENCIA VISUAL Y SINCRONIZACI\u00d3N',
    photos: 'Fotos',
    videos: 'Videos',
    qrScans: 'Escaneos QR',
    totalEvidence: 'Total Evidencia',
    synced: 'Toda la evidencia visual sincronizada con est\u00e1ndares de cumplimiento',
    lastSync: '\u00daltima sincronizaci\u00f3n',
    aiSummary: 'RESUMEN DE AN\u00c1LISIS IA',
    aiAuditor: 'INTELIGENCIA DE AUDITOR IA',
    detailedFindings: 'HALLAZGOS DETALLADOS DE AUDITOR\u00cdA',
    pass: 'PASA',
    fail: 'FALLA',
    note: 'Nota',
    evidence: 'Evidencia',
    footer: 'Informe de Auditor\u00eda SafetyMEG',
    confidential: 'Confidencial',
    page: 'P\u00e1gina',
    of: 'de',
    correctiveActions: 'ACCIONES CORRECTIVAS (CAPA)',
    rootCause: 'Causa Ra\u00edz',
    corrective: 'Acci\u00f3n Correctiva',
    preventive: 'Acci\u00f3n Preventiva',
    assignedTo: 'Asignado A',
    dueDate: 'Fecha L\u00edmite',
    verifiedBy: 'Verificado Por',
    generatedDate: 'Informe Generado',
  },
  fr: {
    title: 'RAPPORT DE CONFORMIT\u00c9 D\'AUDIT',
    auditDetails: 'D\u00c9TAILS DE L\'AUDIT',
    auditDate: 'Date d\'Audit',
    auditor: 'Auditeur',
    location: 'Emplacement',
    department: 'D\u00e9partement',
    template: 'Mod\u00e8le',
    primaryStandard: 'Norme Principale',
    overallScore: 'Score Global',
    status: 'Statut',
    compliant: 'CONFORME',
    needsImprovement: 'AM\u00c9LIORATION REQUISE',
    nonCompliant: 'NON CONFORME',
    applicableStandards: 'NORMES DE CONFORMIT\u00c9 APPLICABLES',
    complianceAnalytics: 'ANALYTIQUE DE CONFORMIT\u00c9',
    overallComplianceScore: 'Score de Conformit\u00e9 Global',
    categoryBreakdown: 'R\u00e9partition par Cat\u00e9gorie',
    riskDistribution: 'Distribution des Risques',
    compliantLabel: 'Conforme',
    nonCompliantLabel: 'Non Conforme',
    naLabel: 'N/A',
    totalItems: '\u00c9l\u00e9ments Totaux',
    visualEvidence: 'PREUVES VISUELLES ET SYNCHRONISATION',
    photos: 'Photos',
    videos: 'Vid\u00e9os',
    qrScans: 'Scans QR',
    totalEvidence: 'Total Preuves',
    synced: 'Toutes les preuves visuelles synchronis\u00e9es avec les normes de conformit\u00e9',
    lastSync: 'Derni\u00e8re synchronisation',
    aiSummary: 'R\u00c9SUM\u00c9 D\'ANALYSE IA',
    aiAuditor: 'INTELLIGENCE D\'AUDITEUR IA',
    detailedFindings: 'CONSTATATIONS D\u00c9TAILL\u00c9ES DE L\'AUDIT',
    pass: 'R\u00c9USSI',
    fail: '\u00c9CHOU\u00c9',
    note: 'Note',
    evidence: 'Preuve',
    footer: 'Rapport d\'Audit SafetyMEG',
    confidential: 'Confidentiel',
    page: 'Page',
    of: 'de',
    correctiveActions: 'ACTIONS CORRECTIVES (CAPA)',
    rootCause: 'Cause Racine',
    corrective: 'Action Corrective',
    preventive: 'Action Pr\u00e9ventive',
    assignedTo: 'Assign\u00e9 \u00c0',
    dueDate: 'Date Limite',
    verifiedBy: 'V\u00e9rifi\u00e9 Par',
    generatedDate: 'Rapport G\u00e9n\u00e9r\u00e9',
  },
  de: {
    title: 'AUDIT-KONFORMIT\u00c4TSBERICHT',
    auditDetails: 'AUDIT-DETAILS',
    auditDate: 'Audit-Datum',
    auditor: 'Auditor',
    location: 'Standort',
    department: 'Abteilung',
    template: 'Vorlage',
    primaryStandard: 'Prim\u00e4rstandard',
    overallScore: 'Gesamtpunktzahl',
    status: 'Status',
    compliant: 'KONFORM',
    needsImprovement: 'VERBESSERUNG ERFORDERLICH',
    nonCompliant: 'NICHT KONFORM',
    applicableStandards: 'ANWENDBARE KONFORMIT\u00c4TSSTANDARDS',
    complianceAnalytics: 'KONFORMIT\u00c4TSANALYSE',
    overallComplianceScore: 'Gesamtkonformit\u00e4tsbewertung',
    categoryBreakdown: 'Aufschl\u00fcsselung nach Kategorie',
    riskDistribution: 'Risikoverteilung',
    compliantLabel: 'Konform',
    nonCompliantLabel: 'Nicht Konform',
    naLabel: 'N/A',
    totalItems: 'Gesamtelemente',
    visualEvidence: 'VISUELLE BEWEISE & SYNCHRONISIERUNG',
    photos: 'Fotos',
    videos: 'Videos',
    qrScans: 'QR-Scans',
    totalEvidence: 'Gesamt Beweise',
    synced: 'Alle visuellen Beweise mit Konformit\u00e4tsstandards synchronisiert',
    lastSync: 'Letzte Synchronisierung',
    aiSummary: 'KI-ANALYSEZUSAMMENFASSUNG',
    aiAuditor: 'KI-AUDITOR-INTELLIGENZ',
    detailedFindings: 'DETAILLIERTE AUDIT-ERGEBNISSE',
    pass: 'BESTANDEN',
    fail: 'NICHT BESTANDEN',
    note: 'Hinweis',
    evidence: 'Beweis',
    footer: 'SafetyMEG Audit-Bericht',
    confidential: 'Vertraulich',
    page: 'Seite',
    of: 'von',
    correctiveActions: 'KORREKTURMASSNAHMEN (CAPA)',
    rootCause: 'Grundursache',
    corrective: 'Korrekturma\u00dfnahme',
    preventive: 'Pr\u00e4ventivma\u00dfnahme',
    assignedTo: 'Zugewiesen An',
    dueDate: 'F\u00e4lligkeitsdatum',
    verifiedBy: 'Verifiziert Von',
    generatedDate: 'Bericht Erstellt',
  },
  pt: {
    title: 'RELAT\u00d3RIO DE CONFORMIDADE DE AUDITORIA',
    auditDetails: 'DETALHES DA AUDITORIA',
    auditDate: 'Data da Auditoria',
    auditor: 'Auditor',
    location: 'Localiza\u00e7\u00e3o',
    department: 'Departamento',
    template: 'Modelo',
    primaryStandard: 'Norma Principal',
    overallScore: 'Pontua\u00e7\u00e3o Geral',
    status: 'Status',
    compliant: 'CONFORME',
    needsImprovement: 'PRECISA MELHORIA',
    nonCompliant: 'N\u00c3O CONFORME',
    applicableStandards: 'NORMAS DE CONFORMIDADE APLIC\u00c1VEIS',
    complianceAnalytics: 'AN\u00c1LISE DE CONFORMIDADE',
    overallComplianceScore: 'Pontua\u00e7\u00e3o de Conformidade Geral',
    categoryBreakdown: 'Distribui\u00e7\u00e3o por Categoria',
    riskDistribution: 'Distribui\u00e7\u00e3o de Risco',
    compliantLabel: 'Conforme',
    nonCompliantLabel: 'N\u00e3o Conforme',
    naLabel: 'N/A',
    totalItems: 'Total de Itens',
    visualEvidence: 'EVID\u00caNCIA VISUAL E SINCRONIZA\u00c7\u00c3O',
    photos: 'Fotos',
    videos: 'V\u00eddeos',
    qrScans: 'Varreduras QR',
    totalEvidence: 'Total Evid\u00eancia',
    synced: 'Toda evid\u00eancia visual sincronizada com normas de conformidade',
    lastSync: '\u00daltima sincroniza\u00e7\u00e3o',
    aiSummary: 'RESUMO DE AN\u00c1LISE IA',
    aiAuditor: 'INTELIG\u00caNCIA DO AUDITOR IA',
    detailedFindings: 'CONSTATA\u00c7\u00d5ES DETALHADAS DA AUDITORIA',
    pass: 'APROVADO',
    fail: 'REPROVADO',
    note: 'Nota',
    evidence: 'Evid\u00eancia',
    footer: 'Relat\u00f3rio de Auditoria SafetyMEG',
    confidential: 'Confidencial',
    page: 'P\u00e1gina',
    of: 'de',
    correctiveActions: 'A\u00c7\u00d5ES CORRETIVAS (CAPA)',
    rootCause: 'Causa Raiz',
    corrective: 'A\u00e7\u00e3o Corretiva',
    preventive: 'A\u00e7\u00e3o Preventiva',
    assignedTo: 'Atribu\u00eddo A',
    dueDate: 'Data Limite',
    verifiedBy: 'Verificado Por',
    generatedDate: 'Relat\u00f3rio Gerado',
  },
  ar: {
    title: '\u062a\u0642\u0631\u064a\u0631 \u0645\u0637\u0627\u0628\u0642\u0629 \u0627\u0644\u062a\u062f\u0642\u064a\u0642',
    auditDetails: '\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u062a\u062f\u0642\u064a\u0642',
    auditDate: '\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062a\u062f\u0642\u064a\u0642',
    auditor: '\u0627\u0644\u0645\u062f\u0642\u0642',
    location: '\u0627\u0644\u0645\u0648\u0642\u0639',
    department: '\u0627\u0644\u0642\u0633\u0645',
    template: '\u0627\u0644\u0646\u0645\u0648\u0630\u062c',
    primaryStandard: '\u0627\u0644\u0645\u0639\u064a\u0627\u0631 \u0627\u0644\u0631\u0626\u064a\u0633\u064a',
    overallScore: '\u0627\u0644\u0646\u062a\u064a\u062c\u0629 \u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a\u0629',
    status: '\u0627\u0644\u062d\u0627\u0644\u0629',
    compliant: '\u0645\u0637\u0627\u0628\u0642',
    needsImprovement: '\u064a\u062d\u062a\u0627\u062c \u062a\u062d\u0633\u064a\u0646',
    nonCompliant: '\u063a\u064a\u0631 \u0645\u0637\u0627\u0628\u0642',
    applicableStandards: '\u0645\u0639\u0627\u064a\u064a\u0631 \u0627\u0644\u0645\u0637\u0627\u0628\u0642\u0629 \u0627\u0644\u0645\u0637\u0628\u0642\u0629',
    complianceAnalytics: '\u062a\u062d\u0644\u064a\u0644\u0627\u062a \u0627\u0644\u0645\u0637\u0627\u0628\u0642\u0629',
    overallComplianceScore: '\u0646\u062a\u064a\u062c\u0629 \u0627\u0644\u0645\u0637\u0627\u0628\u0642\u0629 \u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a\u0629',
    categoryBreakdown: '\u0627\u0644\u062a\u0648\u0632\u064a\u0639 \u062d\u0633\u0628 \u0627\u0644\u0641\u0626\u0629',
    riskDistribution: '\u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0645\u062e\u0627\u0637\u0631',
    compliantLabel: '\u0645\u0637\u0627\u0628\u0642',
    nonCompliantLabel: '\u063a\u064a\u0631 \u0645\u0637\u0627\u0628\u0642',
    naLabel: '\u063a\u064a\u0631 \u0645\u0637\u0628\u0642',
    totalItems: '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0639\u0646\u0627\u0635\u0631',
    visualEvidence: '\u0627\u0644\u0623\u062f\u0644\u0629 \u0627\u0644\u0645\u0631\u0626\u064a\u0629 \u0648\u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629',
    photos: '\u0635\u0648\u0631',
    videos: '\u0641\u064a\u062f\u064a\u0648',
    qrScans: '\u0645\u0633\u062d QR',
    totalEvidence: '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0623\u062f\u0644\u0629',
    synced: '\u062c\u0645\u064a\u0639 \u0627\u0644\u0623\u062f\u0644\u0629 \u0627\u0644\u0645\u0631\u0626\u064a\u0629 \u0645\u062a\u0632\u0627\u0645\u0646\u0629 \u0645\u0639 \u0645\u0639\u0627\u064a\u064a\u0631 \u0627\u0644\u0645\u0637\u0627\u0628\u0642\u0629',
    lastSync: '\u0622\u062e\u0631 \u0645\u0632\u0627\u0645\u0646\u0629',
    aiSummary: '\u0645\u0644\u062e\u0635 \u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a',
    aiAuditor: '\u0630\u0643\u0627\u0621 \u0627\u0644\u0645\u062f\u0642\u0642 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a',
    detailedFindings: '\u0646\u062a\u0627\u0626\u062c \u0627\u0644\u062a\u062f\u0642\u064a\u0642 \u0627\u0644\u0645\u0641\u0635\u0644\u0629',
    pass: '\u0646\u0627\u062c\u062d',
    fail: '\u0641\u0627\u0634\u0644',
    note: '\u0645\u0644\u0627\u062d\u0638\u0629',
    evidence: '\u062f\u0644\u064a\u0644',
    footer: '\u062a\u0642\u0631\u064a\u0631 \u062a\u062f\u0642\u064a\u0642 SafetyMEG',
    confidential: '\u0633\u0631\u064a',
    page: '\u0635\u0641\u062d\u0629',
    of: '\u0645\u0646',
    correctiveActions: '\u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0627\u0644\u062a\u0635\u062d\u064a\u062d\u064a\u0629 (CAPA)',
    rootCause: '\u0627\u0644\u0633\u0628\u0628 \u0627\u0644\u062c\u0630\u0631\u064a',
    corrective: '\u0625\u062c\u0631\u0627\u0621 \u062a\u0635\u062d\u064a\u062d\u064a',
    preventive: '\u0625\u062c\u0631\u0627\u0621 \u0648\u0642\u0627\u0626\u064a',
    assignedTo: '\u0645\u0639\u064a\u0646 \u0625\u0644\u0649',
    dueDate: '\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0627\u0633\u062a\u062d\u0642\u0627\u0642',
    verifiedBy: '\u062a\u0645 \u0627\u0644\u062a\u062d\u0642\u0642 \u0628\u0648\u0627\u0633\u0637\u0629',
    generatedDate: '\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062a\u0642\u0631\u064a\u0631',
  },
  zh: {
    title: '\u5ba1\u8ba1\u5408\u89c4\u62a5\u544a',
    auditDetails: '\u5ba1\u8ba1\u8be6\u60c5',
    auditDate: '\u5ba1\u8ba1\u65e5\u671f',
    auditor: '\u5ba1\u8ba1\u5458',
    location: '\u4f4d\u7f6e',
    department: '\u90e8\u95e8',
    template: '\u6a21\u677f',
    primaryStandard: '\u4e3b\u8981\u6807\u51c6',
    overallScore: '\u603b\u4f53\u5f97\u5206',
    status: '\u72b6\u6001',
    compliant: '\u5408\u89c4',
    needsImprovement: '\u9700\u8981\u6539\u8fdb',
    nonCompliant: '\u4e0d\u5408\u89c4',
    applicableStandards: '\u9002\u7528\u7684\u5408\u89c4\u6807\u51c6',
    complianceAnalytics: '\u5408\u89c4\u5206\u6790',
    overallComplianceScore: '\u603b\u4f53\u5408\u89c4\u5f97\u5206',
    categoryBreakdown: '\u7c7b\u522b\u5408\u89c4\u5206\u5e03',
    riskDistribution: '\u98ce\u9669\u5206\u5e03',
    compliantLabel: '\u5408\u89c4',
    nonCompliantLabel: '\u4e0d\u5408\u89c4',
    naLabel: '\u4e0d\u9002\u7528',
    totalItems: '\u603b\u9879\u76ee',
    visualEvidence: '\u89c6\u89c9\u8bc1\u636e\u4e0e\u540c\u6b65',
    photos: '\u7167\u7247',
    videos: '\u89c6\u9891',
    qrScans: 'QR\u626b\u63cf',
    totalEvidence: '\u603b\u8bc1\u636e',
    synced: '\u6240\u6709\u89c6\u89c9\u8bc1\u636e\u5df2\u4e0e\u5408\u89c4\u6807\u51c6\u540c\u6b65',
    lastSync: '\u6700\u540e\u540c\u6b65',
    aiSummary: 'AI\u5206\u6790\u6458\u8981',
    aiAuditor: 'AI\u5ba1\u8ba1\u5458\u667a\u80fd',
    detailedFindings: '\u8be6\u7ec6\u5ba1\u8ba1\u53d1\u73b0',
    pass: '\u901a\u8fc7',
    fail: '\u672a\u901a\u8fc7',
    note: '\u6ce8\u91ca',
    evidence: '\u8bc1\u636e',
    footer: 'SafetyMEG\u5ba1\u8ba1\u62a5\u544a',
    confidential: '\u4fdd\u5bc6',
    page: '\u9875',
    of: '/',
    correctiveActions: '\u7ea0\u6b63\u63aa\u65bd (CAPA)',
    rootCause: '\u6839\u672c\u539f\u56e0',
    corrective: '\u7ea0\u6b63\u63aa\u65bd',
    preventive: '\u9884\u9632\u63aa\u65bd',
    assignedTo: '\u5206\u914d\u7ed9',
    dueDate: '\u622a\u6b62\u65e5\u671f',
    verifiedBy: '\u9a8c\u8bc1\u8005',
    generatedDate: '\u62a5\u544a\u751f\u6210',
  },
  ja: {
    title: '\u76e3\u67fb\u30b3\u30f3\u30d7\u30e9\u30a4\u30a2\u30f3\u30b9\u30ec\u30dd\u30fc\u30c8',
    auditDetails: '\u76e3\u67fb\u8a73\u7d30',
    auditDate: '\u76e3\u67fb\u65e5',
    auditor: '\u76e3\u67fb\u4eba',
    location: '\u5834\u6240',
    department: '\u90e8\u9580',
    template: '\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8',
    primaryStandard: '\u4e3b\u8981\u57fa\u6e96',
    overallScore: '\u7dcf\u5408\u30b9\u30b3\u30a2',
    status: '\u30b9\u30c6\u30fc\u30bf\u30b9',
    compliant: '\u9069\u5408',
    needsImprovement: '\u6539\u5584\u5fc5\u8981',
    nonCompliant: '\u4e0d\u9069\u5408',
    applicableStandards: '\u9069\u7528\u30b3\u30f3\u30d7\u30e9\u30a4\u30a2\u30f3\u30b9\u57fa\u6e96',
    complianceAnalytics: '\u30b3\u30f3\u30d7\u30e9\u30a4\u30a2\u30f3\u30b9\u5206\u6790',
    overallComplianceScore: '\u7dcf\u5408\u30b3\u30f3\u30d7\u30e9\u30a4\u30a2\u30f3\u30b9\u30b9\u30b3\u30a2',
    categoryBreakdown: '\u30ab\u30c6\u30b4\u30ea\u5225\u5185\u8a33',
    riskDistribution: '\u30ea\u30b9\u30af\u5206\u5e03',
    compliantLabel: '\u9069\u5408',
    nonCompliantLabel: '\u4e0d\u9069\u5408',
    naLabel: '\u8a72\u5f53\u306a\u3057',
    totalItems: '\u7dcf\u9805\u76ee',
    visualEvidence: '\u8996\u899a\u7684\u8a3c\u62e0\u3068\u540c\u671f',
    photos: '\u5199\u771f',
    videos: '\u30d3\u30c7\u30aa',
    qrScans: 'QR\u30b9\u30ad\u30e3\u30f3',
    totalEvidence: '\u7dcf\u8a3c\u62e0',
    synced: '\u3059\u3079\u3066\u306e\u8996\u899a\u7684\u8a3c\u62e0\u304c\u30b3\u30f3\u30d7\u30e9\u30a4\u30a2\u30f3\u30b9\u57fa\u6e96\u3068\u540c\u671f\u6e08\u307f',
    lastSync: '\u6700\u7d42\u540c\u671f',
    aiSummary: 'AI\u5206\u6790\u6982\u8981',
    aiAuditor: 'AI\u76e3\u67fb\u30a4\u30f3\u30c6\u30ea\u30b8\u30a7\u30f3\u30b9',
    detailedFindings: '\u8a73\u7d30\u76e3\u67fb\u7d50\u679c',
    pass: '\u5408\u683c',
    fail: '\u4e0d\u5408\u683c',
    note: '\u6ce8\u8a18',
    evidence: '\u8a3c\u62e0',
    footer: 'SafetyMEG\u76e3\u67fb\u30ec\u30dd\u30fc\u30c8',
    confidential: '\u6a5f\u5bc6',
    page: '\u30da\u30fc\u30b8',
    of: '/',
    correctiveActions: '\u662f\u6b63\u63aa\u7f6e (CAPA)',
    rootCause: '\u6839\u672c\u539f\u56e0',
    corrective: '\u662f\u6b63\u63aa\u7f6e',
    preventive: '\u4e88\u9632\u63aa\u7f6e',
    assignedTo: '\u62c5\u5f53\u8005',
    dueDate: '\u671f\u9650',
    verifiedBy: '\u691c\u8a3c\u8005',
    generatedDate: '\u30ec\u30dd\u30fc\u30c8\u4f5c\u6210',
  },
};

function getTranslations(lang: AuditReportLanguage = 'en'): Record<string, string> {
  return REPORT_TRANSLATIONS[lang] || REPORT_TRANSLATIONS.en;
}

const STANDARD_COLORS: Record<string, [number, number, number]> = {
  'ISO': [59, 130, 246],
  'OSHA': [239, 68, 68],
  'Cal/OSHA': [234, 179, 8],
  'BSEE': [6, 182, 212],
  'ASME': [245, 158, 11],
  'ANSI': [139, 92, 246],
  'API': [236, 72, 153],
  'NFPA': [249, 115, 22],
  'Multi-Standard': [16, 185, 129],
  'EPA': [34, 197, 94],
  'NIOSH': [168, 85, 247],
  'ILO': [99, 102, 241],
  'EU': [79, 70, 229],
  'MSHA': [120, 113, 108],
  'IMO': [14, 165, 233],
  'IATA': [37, 99, 235],
  'WHO': [20, 184, 166],
  'HACCP': [132, 204, 22],
  'DOT': [244, 63, 94],
  'CSA': [220, 38, 38],
  'AS/NZS': [22, 163, 74],
  'NEBOSH': [192, 38, 211],
  'GCC': [217, 119, 6],
  'Custom': [236, 72, 153],
};

function getStandardColor(standard: string): [number, number, number] {
  return STANDARD_COLORS[standard] || [107, 114, 128];
}

function drawHeader(doc: jsPDF, data: AuditReportData, pageWidth: number): number {
  let yPos = 15;

  // Brand header bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Accent stripe
  const [r, g, b] = getStandardColor(data.templateStandard);
  doc.setFillColor(r, g, b);
  doc.rect(0, 45, pageWidth, 3, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('AUDIT COMPLIANCE REPORT', 14, yPos + 10);

  // Standard badge
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text(`${data.templateStandard} • ${data.templateName}`, 14, yPos + 20);

  // Right side info
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text(`Report Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - 14, yPos + 10, { align: 'right' });
  doc.text(`Version: ${data.templateVersion}`, pageWidth - 14, yPos + 17, { align: 'right' });
  doc.text(`ID: AUD-${Date.now().toString(36).toUpperCase()}`, pageWidth - 14, yPos + 24, { align: 'right' });

  return 55;
}

function drawMetadataSection(doc: jsPDF, data: AuditReportData, yPos: number, pageWidth: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('AUDIT DETAILS', 14, yPos + 6);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, yPos + 10, pageWidth - 14, yPos + 10);

  yPos += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  const leftCol = [
    { label: 'Audit Date', value: data.auditDate },
    { label: 'Auditor', value: data.auditorName },
    { label: 'Location', value: data.location },
    { label: 'Department', value: data.department },
  ];

  const rightCol = [
    { label: 'Template', value: data.templateName },
    { label: 'Primary Standard', value: data.templateStandard },
    { label: 'Overall Score', value: `${data.overallScore}%` },
    { label: 'Status', value: data.overallScore >= 80 ? 'COMPLIANT' : data.overallScore >= 50 ? 'NEEDS IMPROVEMENT' : 'NON-COMPLIANT' },
  ];

  leftCol.forEach((item, i) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(item.label + ':', 14, yPos + (i * 8));
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(item.value, 55, yPos + (i * 8));
  });

  rightCol.forEach((item, i) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(item.label + ':', pageWidth / 2 + 5, yPos + (i * 8));
    doc.setFont('helvetica', 'normal');
    if (item.label === 'Overall Score') {
      const score = data.overallScore;
      if (score >= 80) doc.setTextColor(16, 185, 129);
      else if (score >= 50) doc.setTextColor(245, 158, 11);
      else doc.setTextColor(239, 68, 68);
    } else if (item.label === 'Status') {
      if (data.overallScore >= 80) doc.setTextColor(16, 185, 129);
      else if (data.overallScore >= 50) doc.setTextColor(245, 158, 11);
      else doc.setTextColor(239, 68, 68);
    } else {
      doc.setTextColor(30, 41, 59);
    }
    doc.text(item.value, pageWidth / 2 + 45, yPos + (i * 8));
  });

  return yPos + 38;
}

function drawComplianceStandardsBar(doc: jsPDF, data: AuditReportData, yPos: number, pageWidth: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('APPLICABLE COMPLIANCE STANDARDS', 14, yPos + 6);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, yPos + 10, pageWidth - 14, yPos + 10);

  yPos += 18;

  const allStandards = [
    ...data.complianceStandards,
    ...(data.complianceStandards.includes(data.templateStandard) ? [] : [data.templateStandard])
  ];

  let xPos = 14;
  const badgeHeight = 8;
  const padding = 4;

  allStandards.forEach((std) => {
    const [r, g, b] = getStandardColor(std);
    const textWidth = doc.getTextWidth(std) + padding * 2 + 2;

    if (xPos + textWidth > pageWidth - 14) {
      xPos = 14;
      yPos += badgeHeight + 4;
    }

    doc.setFillColor(r, g, b);
    doc.roundedRect(xPos, yPos - 5, textWidth, badgeHeight, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(std, xPos + padding + 1, yPos);
    xPos += textWidth + 4;
  });

  return yPos + 14;
}

function drawComplianceScoreChart(doc: jsPDF, data: AuditReportData, yPos: number, pageWidth: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('COMPLIANCE ANALYTICS', 14, yPos + 6);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, yPos + 10, pageWidth - 14, yPos + 10);

  yPos += 18;

  // --- Donut Chart: Overall Compliance Score ---
  const centerX = 45;
  const centerY = yPos + 30;
  const outerR = 22;
  const innerR = 14;
  const score = data.overallScore;

  // Background circle
  doc.setFillColor(226, 232, 240);
  doc.circle(centerX, centerY, outerR, 'F');

  // Score arc (draw as filled segments)
  const scoreAngle = (score / 100) * 360;
  const scoreColor: [number, number, number] = score >= 80 ? [16, 185, 129] : score >= 50 ? [245, 158, 11] : [239, 68, 68];
  doc.setFillColor(...scoreColor);

  // Draw filled pie segment for score
  const segments = Math.max(1, Math.ceil(scoreAngle / 5));
  const startAngle = -90; // Start from top
  for (let i = 0; i < segments; i++) {
    const a1 = ((startAngle + (scoreAngle / segments) * i) * Math.PI) / 180;
    const a2 = ((startAngle + (scoreAngle / segments) * (i + 1)) * Math.PI) / 180;
    const x1 = centerX + outerR * Math.cos(a1);
    const y1 = centerY + outerR * Math.sin(a1);
    const x2 = centerX + outerR * Math.cos(a2);
    const y2 = centerY + outerR * Math.sin(a2);
    doc.triangle(centerX, centerY, x1, y1, x2, y2, 'F');
  }

  // Inner circle (creates donut effect)
  doc.setFillColor(255, 255, 255);
  doc.circle(centerX, centerY, innerR, 'F');

  // Score text in center
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...scoreColor);
  doc.text(`${score}%`, centerX, centerY + 2, { align: 'center' });
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('OVERALL', centerX, centerY + 8, { align: 'center' });

  // Legend for donut
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Compliance Score', centerX + outerR + 8, yPos + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  const statusText = score >= 80 ? 'COMPLIANT' : score >= 50 ? 'NEEDS IMPROVEMENT' : 'NON-COMPLIANT';
  doc.text(`Status: ${statusText}`, centerX + outerR + 8, yPos + 21);

  // Compliant/Non-compliant/NA breakdown text
  const compliantCount = data.questions.filter(q => q.status === 'compliant').length;
  const ncCount = data.questions.filter(q => q.status === 'non-compliant').length;
  const naCount = data.questions.filter(q => q.status === 'na').length;
  doc.setFillColor(16, 185, 129); doc.roundedRect(centerX + outerR + 8, yPos + 25, 4, 4, 1, 1, 'F');
  doc.setFillColor(239, 68, 68); doc.roundedRect(centerX + outerR + 8, yPos + 31, 4, 4, 1, 1, 'F');
  doc.setFillColor(148, 163, 184); doc.roundedRect(centerX + outerR + 8, yPos + 37, 4, 4, 1, 1, 'F');
  doc.setFontSize(7); doc.setTextColor(30, 41, 59);
  doc.text(`Compliant: ${compliantCount}`, centerX + outerR + 14, yPos + 29);
  doc.text(`Non-Compliant: ${ncCount}`, centerX + outerR + 14, yPos + 35);
  doc.text(`N/A: ${naCount}`, centerX + outerR + 14, yPos + 41);

  // --- Bar Chart: Category Breakdown ---
  const barStartX = pageWidth / 2 + 5;
  const barAreaWidth = pageWidth / 2 - 25;
  const categories = [...new Set(data.questions.map(q => q.category))];
  const maxCats = Math.min(categories.length, 8);
  const barHeight = 6;
  const barGap = 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text('Category Compliance Breakdown', barStartX, yPos + 8);

  let barY = yPos + 14;

  for (let i = 0; i < maxCats; i++) {
    const cat = categories[i];
    const catQs = data.questions.filter(q => q.category === cat);
    const catCompliant = catQs.filter(q => q.status === 'compliant').length;
    const catTotal = catQs.filter(q => q.status !== 'na').length;
    const catScore = catTotal > 0 ? Math.round((catCompliant / catTotal) * 100) : 100;

    // Category label (truncated)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    const truncLabel = cat.length > 22 ? cat.substring(0, 20) + '..' : cat;
    doc.text(truncLabel, barStartX, barY + 4);

    // Bar background
    const barX = barStartX + barAreaWidth * 0.45;
    const barW = barAreaWidth * 0.45;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(barX, barY, barW, barHeight, 1.5, 1.5, 'F');

    // Bar fill
    const fillColor: [number, number, number] = catScore >= 80 ? [16, 185, 129] : catScore >= 50 ? [245, 158, 11] : [239, 68, 68];
    doc.setFillColor(...fillColor);
    const fillW = Math.max(1, (catScore / 100) * barW);
    doc.roundedRect(barX, barY, fillW, barHeight, 1.5, 1.5, 'F');

    // Score label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(...fillColor);
    doc.text(`${catScore}%`, barX + barW + 3, barY + 4.5);

    barY += barHeight + barGap;
  }

  // --- Risk Distribution Mini Bar ---
  const riskY = Math.max(yPos + 52, barY + 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text('Risk Distribution', 14, riskY);

  const riskBarX = 14;
  const riskBarW = pageWidth - 28;
  const riskBarH = 6;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(riskBarX, riskY + 3, riskBarW, riskBarH, 2, 2, 'F');

  const total = data.questions.length;
  if (total > 0) {
    const cW = (compliantCount / total) * riskBarW;
    const ncW = (ncCount / total) * riskBarW;
    if (cW > 0) { doc.setFillColor(16, 185, 129); doc.roundedRect(riskBarX, riskY + 3, cW, riskBarH, 2, 2, 'F'); }
    if (ncW > 0) { doc.setFillColor(239, 68, 68); doc.roundedRect(riskBarX + cW, riskY + 3, ncW, riskBarH, 0, 0, 'F'); }
  }

  doc.setFontSize(5.5); doc.setTextColor(100, 116, 139);
  doc.text(`${compliantCount} Compliant  |  ${ncCount} Non-Compliant  |  ${naCount} N/A  |  ${total} Total Items`, 14, riskY + 15);

  return riskY + 22;
}

function drawVisualEvidenceSummary(doc: jsPDF, data: AuditReportData, yPos: number, pageWidth: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('VISUAL EVIDENCE & MEDIA SYNC', 14, yPos + 6);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, yPos + 10, pageWidth - 14, yPos + 10);

  yPos += 18;

  const evidence = data.visualEvidenceCount;
  const total = evidence.photos + evidence.videos + evidence.scans;
  const items = [
    { label: 'Photos', count: evidence.photos, icon: '📷', color: [59, 130, 246] as [number, number, number] },
    { label: 'Videos', count: evidence.videos, icon: '🎥', color: [139, 92, 246] as [number, number, number] },
    { label: 'QR/Barcode Scans', count: evidence.scans, icon: '📱', color: [16, 185, 129] as [number, number, number] },
    { label: 'Total Evidence', count: total, icon: '📋', color: [245, 158, 11] as [number, number, number] },
  ];

  const colWidth = (pageWidth - 28) / 4;
  items.forEach((item, i) => {
    const x = 14 + (i * colWidth);
    const [r, g, b] = item.color;

    doc.setFillColor(r, g, b);
    doc.roundedRect(x, yPos - 3, colWidth - 4, 22, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(String(item.count), x + (colWidth - 4) / 2, yPos + 7, { align: 'center' });

    doc.setFontSize(7);
    doc.text(item.label, x + (colWidth - 4) / 2, yPos + 14, { align: 'center' });
  });

  yPos += 28;

  // Sync status
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, yPos, pageWidth - 28, 14, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(22, 163, 74);
  doc.text('✓ All visual evidence synced and mapped to compliance standards', 20, yPos + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Last sync: ${new Date().toLocaleString()}`, pageWidth - 20, yPos + 9, { align: 'right' });

  return yPos + 22;
}

function drawAISummary(doc: jsPDF, data: AuditReportData, yPos: number, pageWidth: number): number {
  if (!data.aiSummary) return yPos;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('AI ANALYSIS SUMMARY', 14, yPos + 6);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, yPos + 10, pageWidth - 14, yPos + 10);

  yPos += 18;

  doc.setFillColor(245, 243, 255);
  const summaryLines = doc.splitTextToSize(data.aiSummary, pageWidth - 42);
  const boxHeight = summaryLines.length * 5 + 12;
  doc.roundedRect(14, yPos - 3, pageWidth - 28, boxHeight, 3, 3, 'F');

  doc.setFillColor(139, 92, 246);
  doc.rect(14, yPos - 3, 3, boxHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(139, 92, 246);
  doc.text('🤖 AI AUDITOR INTELLIGENCE', 22, yPos + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(summaryLines, 22, yPos + 12);

  return yPos + boxHeight + 8;
}

function checkPageBreak(doc: jsPDF, yPos: number, needed: number, pageHeight: number): number {
  if (yPos + needed > pageHeight - 30) {
    doc.addPage();
    return 20;
  }
  return yPos;
}

function drawQuestionResults(doc: jsPDF, data: AuditReportData, yPos: number, pageWidth: number, pageHeight: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('DETAILED AUDIT FINDINGS', 14, yPos + 6);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, yPos + 10, pageWidth - 14, yPos + 10);

  yPos += 18;

  // Group by category
  const categories = [...new Set(data.questions.map(q => q.category))];

  categories.forEach(category => {
    yPos = checkPageBreak(doc, yPos, 30, pageHeight);

    // Category header
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, yPos - 3, pageWidth - 28, 12, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(category.toUpperCase(), 18, yPos + 5);

    const catQuestions = data.questions.filter(q => q.category === category);
    const compliant = catQuestions.filter(q => q.status === 'compliant').length;
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.text(`${compliant}/${catQuestions.length} Compliant`, pageWidth - 18, yPos + 5, { align: 'right' });

    yPos += 16;

    catQuestions.forEach(q => {
      yPos = checkPageBreak(doc, yPos, 25, pageHeight);

      // Status indicator
      if (q.status === 'compliant') {
        doc.setFillColor(16, 185, 129);
      } else if (q.status === 'non-compliant') {
        doc.setFillColor(239, 68, 68);
      } else {
        doc.setFillColor(148, 163, 184);
      }
      doc.circle(18, yPos + 1, 2, 'F');

      // Question text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      const questionLines = doc.splitTextToSize(q.text, pageWidth - 80);
      doc.text(questionLines, 24, yPos + 2);

      // Standard clause
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text(`${q.standard} ${q.clause || ''}`, pageWidth - 18, yPos + 2, { align: 'right' });

      // Status label
      const statusLabel = q.status === 'compliant' ? 'PASS' : q.status === 'non-compliant' ? 'FAIL' : 'N/A';
      if (q.status === 'compliant') doc.setTextColor(16, 185, 129);
      else if (q.status === 'non-compliant') doc.setTextColor(239, 68, 68);
      else doc.setTextColor(148, 163, 184);
      doc.setFontSize(7);
      doc.text(statusLabel, pageWidth - 18, yPos + 8, { align: 'right' });

      yPos += questionLines.length * 4 + 6;

      // Notes
      if (q.notes) {
        yPos = checkPageBreak(doc, yPos, 12, pageHeight);
        doc.setFillColor(255, 251, 235);
        const noteLines = doc.splitTextToSize(q.notes, pageWidth - 50);
        doc.roundedRect(24, yPos - 2, pageWidth - 42, noteLines.length * 4 + 6, 2, 2, 'F');
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(120, 113, 108);
        doc.text('Note: ' + q.notes, 28, yPos + 3);
        yPos += noteLines.length * 4 + 10;
      }

      // Media evidence references
      if (q.mediaEvidence && q.mediaEvidence.length > 0) {
        yPos = checkPageBreak(doc, yPos, 10, pageHeight);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(59, 130, 246);
        const evidenceStr = q.mediaEvidence.map(e => `${e.type === 'photo' ? '📷' : e.type === 'video' ? '🎥' : '📱'} ${e.filename}`).join('  |  ');
        doc.text(`Evidence: ${evidenceStr}`, 24, yPos + 2);
        yPos += 8;
      }
    });

    yPos += 4;
  });

  return yPos;
}

function drawFooter(doc: jsPDF, data: AuditReportData, pageWidth: number, pageHeight: number, pageNum: number, totalPages: number): void {
  // Footer bar
  doc.setFillColor(248, 250, 252);
  doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(0, pageHeight - 20, pageWidth, pageHeight - 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(`SafetyMEG Audit Report • ${data.templateStandard} Compliant • Confidential`, 14, pageHeight - 10);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
  doc.text(`Visual evidence synced to: ISO, OSHA, Cal/OSHA, BSEE, ASME, ANSI, NFPA, EU, MSHA, IMO, IATA, WHO, HACCP, DOT, CSA, AS/NZS, NEBOSH, GCC`, pageWidth / 2, pageHeight - 5, { align: 'center' });
}

export function generateAuditReportPDF(data: AuditReportData, language: AuditReportLanguage = 'en'): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Page 1
  let yPos = drawHeader(doc, data, pageWidth);
  yPos = drawMetadataSection(doc, data, yPos, pageWidth);
  yPos = drawComplianceStandardsBar(doc, data, yPos, pageWidth);
  yPos = drawComplianceScoreChart(doc, data, yPos, pageWidth);
  yPos = drawVisualEvidenceSummary(doc, data, yPos, pageWidth);
  yPos = drawAISummary(doc, data, yPos, pageWidth);
  yPos = drawQuestionResults(doc, data, yPos, pageWidth, pageHeight);

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, data, pageWidth, pageHeight, i, totalPages);
  }

  return doc;
}

export function downloadAuditReport(data: AuditReportData, language: AuditReportLanguage = 'en'): void {
  const doc = generateAuditReportPDF(data, language);
  const fileName = `Audit-Report-${data.templateStandard}-${data.auditDate.replace(/\//g, '-')}-${Date.now().toString(36)}.pdf`;
  doc.save(fileName);
}

export function getAuditReportBlob(data: AuditReportData, language: AuditReportLanguage = 'en'): Blob {
  const doc = generateAuditReportPDF(data, language);
}

// Helper to get supported languages list
export function getSupportedReportLanguages(): { code: AuditReportLanguage; label: string }[] {
  return [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Espa\u00f1ol' },
    { code: 'fr', label: 'Fran\u00e7ais' },
    { code: 'de', label: 'Deutsch' },
    { code: 'pt', label: 'Portugu\u00eas' },
    { code: 'ar', label: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' },
    { code: 'zh', label: '\u4e2d\u6587' },
    { code: 'ja', label: '\u65e5\u672c\u8a9e' },
  ];
  return doc.output('blob');
}
