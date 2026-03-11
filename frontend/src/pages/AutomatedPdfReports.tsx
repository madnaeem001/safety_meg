import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import {
  FileText, Download, Calendar, Clock, Send, Eye,
  BarChart3, Shield, AlertTriangle, CheckCircle, TrendingUp,
  Users, Settings, Play, Pause, Trash2, Plus, ChevronRight,
  Filter, RefreshCw, Zap, Mail, Bell, FileCheck, Printer,
  Search, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  useReportTemplates,
  useScheduledReports,
  useKPIMetricsAnalytics,
  useIncidentTrends,
  useGenerateReport,
  useToggleScheduleStatus,
} from '../api/hooks/useAPIHooks';

/* ═══════════════════════════════════════════════════════════════════
   MOCK DATA — EHS metrics, schedules, templates
   ═══════════════════════════════════════════════════════════════════ */

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'executive' | 'incident' | 'compliance' | 'environmental' | 'training' | 'audit';
  sections: string[];
  frequency: string;
  recipients: string[];
  format: 'pdf' | 'pdf+excel';
  lastGenerated?: string;
  status: 'active' | 'paused' | 'draft';
  nextRun?: string;
}

interface ScheduledReport {
  id: string;
  templateId: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  dayOfWeek?: string;
  dayOfMonth?: number;
  time: string;
  recipients: string[];
  lastSent: string;
  nextRun: string;
  status: 'active' | 'paused';
  deliveryMethod: 'email' | 'dashboard' | 'both';
}

interface GeneratedReport {
  id: string;
  name: string;
  generatedAt: string;
  size: string;
  pages: number;
  status: 'complete' | 'generating' | 'failed';
  downloadUrl?: string;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'exec-summary', name: 'Executive Safety Summary', description: 'C-suite overview with KPIs, incident trends, compliance status, and risk forecast',
    category: 'executive', sections: ['KPI Dashboard', 'Incident Summary', 'Compliance Status', 'Risk Forecast', 'Action Items'],
    frequency: 'Weekly', recipients: ['CEO', 'COO', 'VP Safety'], format: 'pdf', lastGenerated: '2026-02-20', status: 'active', nextRun: '2026-02-24'
  },
  {
    id: 'incident-detail', name: 'Monthly Incident Report', description: 'Detailed incident analysis with root causes, corrective actions, and trend charts',
    category: 'incident', sections: ['Incident Log', 'Root Cause Analysis', 'CAPA Status', 'Trend Charts', 'Lessons Learned'],
    frequency: 'Monthly', recipients: ['Safety Director', 'Site Managers'], format: 'pdf+excel', lastGenerated: '2026-02-01', status: 'active', nextRun: '2026-03-01'
  },
  {
    id: 'compliance-audit', name: 'Compliance Audit Report', description: 'Regulatory compliance status across OSHA, EPA, ISO 45001 frameworks',
    category: 'compliance', sections: ['Regulatory Status', 'Audit Findings', 'Gap Analysis', 'Corrective Actions', 'Certification Status'],
    frequency: 'Bi-weekly', recipients: ['Legal', 'Compliance Officers'], format: 'pdf', lastGenerated: '2026-02-14', status: 'active', nextRun: '2026-02-28'
  },
  {
    id: 'env-metrics', name: 'Environmental Metrics Dashboard', description: 'Emissions tracking, waste management, water quality, and ESG indicators',
    category: 'environmental', sections: ['Emission Data', 'Waste Metrics', 'Water Quality', 'Energy Consumption', 'ESG Score'],
    frequency: 'Monthly', recipients: ['ESG Team', 'Board of Directors'], format: 'pdf', lastGenerated: '2026-02-01', status: 'active', nextRun: '2026-03-01'
  },
  {
    id: 'training-status', name: 'Training Compliance Report', description: 'Employee training status, certifications expiring, and completion rates',
    category: 'training', sections: ['Completion Rates', 'Overdue Training', 'Certification Status', 'Training Hours', 'Gap Analysis'],
    frequency: 'Weekly', recipients: ['HR Director', 'Training Coordinators'], format: 'pdf', lastGenerated: '2026-02-17', status: 'active', nextRun: '2026-02-24'
  },
  {
    id: 'audit-findings', name: 'Safety Audit Summary', description: 'Comprehensive audit findings with severity ratings and action tracking',
    category: 'audit', sections: ['Audit Schedule', 'Findings Summary', 'Severity Matrix', 'Action Tracking', 'Trends'],
    frequency: 'Quarterly', recipients: ['Safety Committee', 'Executive Team'], format: 'pdf+excel', lastGenerated: '2026-01-15', status: 'active', nextRun: '2026-04-15'
  },
];

const SCHEDULED_REPORTS: ScheduledReport[] = [
  { id: 'sched-1', templateId: 'exec-summary', name: 'Weekly Executive Brief', frequency: 'weekly', dayOfWeek: 'Monday', time: '07:00', recipients: ['ceo@safetymeg.com', 'coo@safetymeg.com'], lastSent: '2026-02-17', nextRun: '2026-02-24', status: 'active', deliveryMethod: 'both' },
  { id: 'sched-2', templateId: 'incident-detail', name: 'Monthly Incident Analysis', frequency: 'monthly', dayOfMonth: 1, time: '08:00', recipients: ['safety-director@safetymeg.com'], lastSent: '2026-02-01', nextRun: '2026-03-01', status: 'active', deliveryMethod: 'email' },
  { id: 'sched-3', templateId: 'compliance-audit', name: 'Bi-weekly Compliance', frequency: 'biweekly', dayOfWeek: 'Friday', time: '16:00', recipients: ['legal@safetymeg.com'], lastSent: '2026-02-14', nextRun: '2026-02-28', status: 'active', deliveryMethod: 'email' },
  { id: 'sched-4', templateId: 'training-status', name: 'Training Status Update', frequency: 'weekly', dayOfWeek: 'Monday', time: '07:00', recipients: ['hr@safetymeg.com'], lastSent: '2026-02-17', nextRun: '2026-02-24', status: 'paused', deliveryMethod: 'dashboard' },
];

const GENERATED_REPORTS: GeneratedReport[] = [
  { id: 'gen-1', name: 'Executive Safety Summary — Feb 17', generatedAt: '2026-02-17 07:00', size: '2.4 MB', pages: 12, status: 'complete' },
  { id: 'gen-2', name: 'Monthly Incident Report — Feb 01', generatedAt: '2026-02-01 08:00', size: '4.1 MB', pages: 24, status: 'complete' },
  { id: 'gen-3', name: 'Compliance Audit — Feb 14', generatedAt: '2026-02-14 16:00', size: '1.8 MB', pages: 8, status: 'complete' },
  { id: 'gen-4', name: 'Environmental Metrics — Feb 01', generatedAt: '2026-02-01 09:00', size: '3.2 MB', pages: 16, status: 'complete' },
  { id: 'gen-5', name: 'Training Compliance — Feb 17', generatedAt: '2026-02-17 07:30', size: '1.5 MB', pages: 6, status: 'complete' },
];

// Real EHS KPI data for PDF generation
const EHS_KPI_DATA = {
  trir: { value: 1.2, prev: 1.8, target: 1.0, label: 'TRIR' },
  ltir: { value: 0.4, prev: 0.7, target: 0.3, label: 'LTIR' },
  dart: { value: 0.8, prev: 1.1, target: 0.5, label: 'DART Rate' },
  safetyScore: { value: 87, prev: 82, target: 90, label: 'Safety Score' },
  compliance: { value: 96, prev: 91, target: 100, label: 'Compliance %' },
  trainingCompletion: { value: 89, prev: 85, target: 95, label: 'Training %' },
};

const INCIDENT_TREND = [
  { month: 'Sep 2025', total: 12, recordable: 4, nearMiss: 8, lostTime: 1 },
  { month: 'Oct 2025', total: 9, recordable: 3, nearMiss: 6, lostTime: 0 },
  { month: 'Nov 2025', total: 11, recordable: 2, nearMiss: 7, lostTime: 1 },
  { month: 'Dec 2025', total: 8, recordable: 2, nearMiss: 5, lostTime: 0 },
  { month: 'Jan 2026', total: 6, recordable: 1, nearMiss: 4, lostTime: 0 },
  { month: 'Feb 2026', total: 5, recordable: 1, nearMiss: 3, lostTime: 0 },
];

const SITE_DATA = [
  { name: 'Houston Plant', score: 90, incidents: 2, compliance: 98 },
  { name: 'Denver Office', score: 91, incidents: 0, compliance: 100 },
  { name: 'Chicago Warehouse', score: 73, incidents: 4, compliance: 88 },
  { name: 'Atlanta Distribution', score: 66, incidents: 6, compliance: 82 },
  { name: 'Phoenix Manufacturing', score: 80, incidents: 3, compliance: 94 },
  { name: 'Seattle Lab', score: 96, incidents: 0, compliance: 100 },
];

/* ═══════════════════════════════════════════════════════════════════
   PDF GENERATION ENGINE
   ═══════════════════════════════════════════════════════════════════ */

function generateExecutivePDF(templateId: string, liveKPIs?: any[], liveIncidents?: any[]): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 15;

  const addPageIfNeeded = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - 20) {
      doc.addPage();
      y = 15;
      // Footer line on each page
      doc.setDrawColor(6, 182, 212);
      doc.setLineWidth(0.3);
      doc.line(15, pageHeight - 12, pageWidth - 15, pageHeight - 12);
      doc.setFontSize(7);
      doc.setTextColor(120);
      doc.text('SafetyMEG — Confidential', 15, pageHeight - 8);
      doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - 30, pageHeight - 8);
    }
  };

  // ── COVER / HEADER ──
  // Header bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 42, 'F');
  doc.setFillColor(6, 182, 212); // cyan accent line
  doc.rect(0, 42, pageWidth, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255);
  doc.text('SafetyMEG', 15, 18);

  doc.setFontSize(10);
  doc.setTextColor(6, 182, 212);
  doc.text('AUTOMATED EHS REPORT', 15, 26);

  const template = REPORT_TEMPLATES.find(t => t.id === templateId) || REPORT_TEMPLATES[0];
  doc.setFontSize(14);
  doc.setTextColor(255);
  doc.text(template.name, 15, 36);

  // Date info on right
  doc.setFontSize(8);
  doc.setTextColor(200);
  const now = new Date();
  doc.text(`Generated: ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - 15, 18, { align: 'right' });
  doc.text(`Report ID: RPT-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`, pageWidth - 15, 24, { align: 'right' });
  doc.text('CONFIDENTIAL', pageWidth - 15, 36, { align: 'right' });

  y = 52;

  // ── SECTION 1: KPI DASHBOARD ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(6, 182, 212);
  doc.text('1. Key Performance Indicators', 15, y);
  y += 3;
  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 8;

  // Build KPI cards: merge live values from backend with hardcoded prev/target for display
  interface KpiCard { label: string; value: number; prev: number; target: number; }
  let kpiCards: KpiCard[];
  if (liveKPIs && liveKPIs.length > 0) {
    const liveMap: Record<string, number> = {};
    liveKPIs.forEach((k: any) => { liveMap[k.id] = k.value ?? 0; });
    kpiCards = [
      { label: 'TRIR',        value: liveMap['trir']        ?? EHS_KPI_DATA.trir.value,             prev: EHS_KPI_DATA.trir.prev,             target: EHS_KPI_DATA.trir.target },
      { label: 'LTIR',        value: liveMap['ltir']        ?? EHS_KPI_DATA.ltir.value,             prev: EHS_KPI_DATA.ltir.prev,             target: EHS_KPI_DATA.ltir.target },
      { label: 'DART Rate',   value: liveMap['dart']        ?? EHS_KPI_DATA.dart.value,             prev: EHS_KPI_DATA.dart.prev,             target: EHS_KPI_DATA.dart.target },
      { label: 'Safety Score',value: liveMap['audit-score'] ?? EHS_KPI_DATA.safetyScore.value,      prev: EHS_KPI_DATA.safetyScore.prev,      target: EHS_KPI_DATA.safetyScore.target },
      { label: 'Compliance %',value: liveMap['compliance']  ?? EHS_KPI_DATA.compliance.value,       prev: EHS_KPI_DATA.compliance.prev,       target: EHS_KPI_DATA.compliance.target },
      { label: 'Training %',  value: liveMap['training']    ?? EHS_KPI_DATA.trainingCompletion.value,prev: EHS_KPI_DATA.trainingCompletion.prev,target: EHS_KPI_DATA.trainingCompletion.target },
    ];
  } else {
    kpiCards = Object.values(EHS_KPI_DATA).map(k => ({ label: k.label, value: k.value, prev: k.prev, target: k.target }));
  }
  const cardW = (pageWidth - 45) / 3;
  kpis.forEach((kpi, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const cx = 15 + col * (cardW + 7.5);
    const cy = y + row * 26;

    // Card background
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(cx, cy, cardW, 22, 2, 2, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.label, cx + 4, cy + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255);
    doc.text(String(kpi.value), cx + 4, cy + 15);

    // Trend indicator
    const improved = kpi.value <= kpi.prev;
    doc.setFontSize(8);
    doc.setTextColor(improved ? 34 : 239, improved ? 197 : 68, improved ? 94 : 68);
    const delta = ((kpi.value - kpi.prev) / kpi.prev * 100).toFixed(1);
    doc.text(`${improved ? '▼' : '▲'} ${Math.abs(Number(delta))}%`, cx + cardW - 4, cy + 15, { align: 'right' });

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Target: ${kpi.target}`, cx + 4, cy + 19);
  });

  y += 56;

  // ── SECTION 2: INCIDENT TREND ──
  addPageIfNeeded(80);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(6, 182, 212);
  doc.text('2. Incident Trend (6-Month)', 15, y);
  y += 3;
  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 6;

  // Use live incident data when available
  const incidentRows = (liveIncidents && liveIncidents.length > 0)
    ? liveIncidents.slice(-6).map((r: any) => ({
        month: r.month,
        total: r.total,
        recordable: (r.critical ?? 0) + (r.high ?? 0),
        nearMiss: r.nearMisses ?? 0,
        lostTime: 0,
      }))
    : INCIDENT_TREND;

  // Table header
  const colWidths = [35, 30, 30, 30, 30];
  const headers = ['Month', 'Total', 'Recordable', 'Near Miss', 'Lost Time'];
  let tx = 15;
  doc.setFillColor(30, 41, 59);
  doc.rect(15, y, pageWidth - 30, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 182, 212);
  headers.forEach((h, i) => {
    doc.text(h, tx + 2, y + 5.5);
    tx += colWidths[i];
  });
  y += 10;

  // Table rows
  incidentRows.forEach((row, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(15, 23, 42);
      doc.rect(15, y - 1.5, pageWidth - 30, 7, 'F');
    }
    tx = 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(226, 232, 240);
    [row.month, String(row.total), String(row.recordable), String(row.nearMiss), String(row.lostTime)].forEach((v, i) => {
      doc.text(v, tx + 2, y + 3);
      tx += colWidths[i];
    });
    y += 7;
  });

  y += 8;

  // ── SECTION 3: SITE SCORECARD ──
  addPageIfNeeded(80);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(6, 182, 212);
  doc.text('3. Site Safety Scorecard', 15, y);
  y += 3;
  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 6;

  const siteHeaders = ['Site', 'Score', 'Incidents', 'Compliance %', 'Status'];
  const siteWidths = [45, 25, 25, 30, 30];
  tx = 15;
  doc.setFillColor(30, 41, 59);
  doc.rect(15, y, pageWidth - 30, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 182, 212);
  siteHeaders.forEach((h, i) => {
    doc.text(h, tx + 2, y + 5.5);
    tx += siteWidths[i];
  });
  y += 10;

  SITE_DATA.forEach((site, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(15, 23, 42);
      doc.rect(15, y - 1.5, pageWidth - 30, 7, 'F');
    }
    tx = 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(226, 232, 240);

    const status = site.score >= 85 ? 'Excellent' : site.score >= 70 ? 'Needs Improvement' : 'Critical';
    [site.name, String(site.score), String(site.incidents), `${site.compliance}%`, status].forEach((v, i) => {
      if (i === 4) {
        doc.setTextColor(
          status === 'Excellent' ? 34 : status === 'Needs Improvement' ? 245 : 239,
          status === 'Excellent' ? 197 : status === 'Needs Improvement' ? 158 : 68,
          status === 'Excellent' ? 94 : status === 'Needs Improvement' ? 11 : 68,
        );
      }
      doc.text(v, tx + 2, y + 3);
      tx += siteWidths[i];
      doc.setTextColor(226, 232, 240);
    });
    y += 7;
  });

  y += 8;

  // ── SECTION 4: COMPLIANCE STATUS ──
  addPageIfNeeded(60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(6, 182, 212);
  doc.text('4. Regulatory Compliance Status', 15, y);
  y += 3;
  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 8;

  const complianceItems = [
    { framework: 'OSHA 29 CFR 1910', status: 'Compliant', score: 98, lastAudit: '2026-01-15', nextAudit: '2026-07-15' },
    { framework: 'ISO 45001:2018', status: 'Compliant', score: 96, lastAudit: '2025-11-20', nextAudit: '2026-05-20' },
    { framework: 'EPA RCRA', status: 'Minor Gaps', score: 91, lastAudit: '2026-02-01', nextAudit: '2026-08-01' },
    { framework: 'NFPA 70E', status: 'Compliant', score: 99, lastAudit: '2025-12-10', nextAudit: '2026-06-10' },
    { framework: 'ISO 14001:2015', status: 'In Progress', score: 88, lastAudit: '2026-01-05', nextAudit: '2026-04-05' },
  ];

  complianceItems.forEach(item => {
    addPageIfNeeded(16);
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(15, y, pageWidth - 30, 13, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255);
    doc.text(item.framework, 19, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(
      item.status === 'Compliant' ? 34 : item.status === 'Minor Gaps' ? 245 : 59,
      item.status === 'Compliant' ? 197 : item.status === 'Minor Gaps' ? 158 : 130,
      item.status === 'Compliant' ? 94 : item.status === 'Minor Gaps' ? 11 : 246,
    );
    doc.text(item.status, 19, y + 10);

    doc.setTextColor(148, 163, 184);
    doc.text(`Score: ${item.score}%`, pageWidth / 2, y + 5);
    doc.text(`Last: ${item.lastAudit}  |  Next: ${item.nextAudit}`, pageWidth / 2, y + 10);

    y += 16;
  });

  y += 4;

  // ── SECTION 5: ACTION ITEMS ──
  addPageIfNeeded(60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(6, 182, 212);
  doc.text('5. Open Action Items & Recommendations', 15, y);
  y += 3;
  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 8;

  const actionItems = [
    { priority: 'HIGH', item: 'Complete Chicago Warehouse fall protection upgrade', owner: 'J. Martinez', due: '2026-03-01', status: 'In Progress' },
    { priority: 'HIGH', item: 'Atlanta forklift operator re-certification', owner: 'S. Williams', due: '2026-02-28', status: 'Overdue' },
    { priority: 'MED', item: 'Update confined space entry procedures per OSHA update', owner: 'R. Chen', due: '2026-03-15', status: 'Not Started' },
    { priority: 'MED', item: 'Install additional emergency eye wash stations — Bldg C', owner: 'T. Johnson', due: '2026-03-10', status: 'In Progress' },
    { priority: 'LOW', item: 'Review and update chemical inventory for Q1 SDS audit', owner: 'K. Patel', due: '2026-04-01', status: 'Not Started' },
  ];

  actionItems.forEach(ai => {
    addPageIfNeeded(12);
    doc.setFillColor(ai.priority === 'HIGH' ? 239 : ai.priority === 'MED' ? 245 : 34, ai.priority === 'HIGH' ? 68 : ai.priority === 'MED' ? 158 : 197, ai.priority === 'HIGH' ? 68 : ai.priority === 'MED' ? 11 : 94);
    doc.roundedRect(15, y, 3, 8, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255);
    doc.text(`[${ai.priority}]`, 21, y + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text(ai.item, 36, y + 3.5);

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.text(`Owner: ${ai.owner}  |  Due: ${ai.due}  |  ${ai.status}`, 36, y + 7.5);
    y += 11;
  });

  // ── FOOTER ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(6, 182, 212);
    doc.setLineWidth(0.3);
    doc.line(15, pageHeight - 12, pageWidth - 15, pageHeight - 12);
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text('SafetyMEG — Confidential — Automated EHS Report', 15, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
  }

  // Save
  const filename = `SafetyMEG_${template.name.replace(/\s+/g, '_')}_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/* ═══════════════════════════════════════════════════════════════════
   UI COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

const tabs = [
  { id: 'templates', label: 'Report Templates', icon: FileText },
  { id: 'scheduled', label: 'Scheduled Reports', icon: Clock },
  { id: 'history', label: 'Generated Reports', icon: CheckCircle },
  { id: 'preview', label: 'Live Preview', icon: Eye },
];

const categoryColors: Record<string, string> = {
  executive: 'from-cyan-500 to-blue-500',
  incident: 'from-red-500 to-orange-500',
  compliance: 'from-emerald-500 to-teal-500',
  environmental: 'from-green-500 to-lime-500',
  training: 'from-purple-500 to-violet-500',
  audit: 'from-amber-500 to-yellow-500',
};

const categoryIcons: Record<string, React.ElementType> = {
  executive: BarChart3,
  incident: AlertTriangle,
  compliance: Shield,
  environmental: TrendingUp,
  training: Users,
  audit: FileCheck,
};

function AutomatedPdfReports() {
  const [activeTab, setActiveTab] = useState('templates');
  const [generating, setGenerating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<string>('exec-summary');
  const [generatedList, setGeneratedList] = useState<GeneratedReport[]>(GENERATED_REPORTS);

  // ── Backend data ──────────────────────────────────────────────────────────
  const { data: backendTemplates } = useReportTemplates();
  const { data: backendScheduled } = useScheduledReports();
  const { data: liveKPIs } = useKPIMetricsAnalytics();
  const { data: liveIncidents } = useIncidentTrends({ months: 6 });
  const generateReportMutation = useGenerateReport();
  const toggleScheduleMutation = useToggleScheduleStatus();

  // ── Merged templates: backend system templates enriched with frontend UI metadata ──
  const typeToCategory: Record<string, ReportTemplate['category']> = {
    kpi: 'executive', incident: 'incident', compliance: 'compliance',
    custom: 'environmental', training: 'training', audit: 'audit', safety: 'compliance',
  };
  const mergedTemplates = useMemo<ReportTemplate[]>(() => {
    if (!backendTemplates || backendTemplates.length === 0) return REPORT_TEMPLATES;
    const mapped: ReportTemplate[] = backendTemplates.map((bt: any) => {
      const mock = REPORT_TEMPLATES.find(t => t.name === bt.name);
      if (mock) return { ...mock, sections: bt.sections?.length ? bt.sections : mock.sections };
      return {
        id: String(bt.id),
        name: bt.name,
        description: bt.description || '',
        category: typeToCategory[bt.type] ?? 'audit',
        sections: bt.sections || [],
        frequency: 'On Demand',
        recipients: [],
        format: (bt.format as 'pdf' | 'pdf+excel') || 'pdf',
        status: bt.isDefault ? 'active' : ('draft' as const),
      };
    });
    const backendNames = new Set(mapped.map((t: ReportTemplate) => t.name));
    const mockOnly = REPORT_TEMPLATES.filter(t => !backendNames.has(t.name));
    return [...mapped, ...mockOnly];
  }, [backendTemplates]);

  // ── Merged scheduled: backend records normalised to UI ScheduledReport shape ──
  const scheduledList = useMemo<ScheduledReport[]>(() => {
    if (!backendScheduled || backendScheduled.length === 0) return SCHEDULED_REPORTS;
    const normalised: ScheduledReport[] = backendScheduled.map((s: any) => ({
      id: String(s.id),
      templateId: String(s.templateId ?? ''),
      name: s.name,
      frequency: (['daily', 'weekly', 'biweekly', 'monthly', 'quarterly'].includes(s.frequency)
        ? s.frequency : 'monthly') as ScheduledReport['frequency'],
      time: '07:00',
      recipients: Array.isArray(s.recipients) ? s.recipients : [],
      lastSent: s.lastGeneratedAt ? new Date(s.lastGeneratedAt).toISOString().slice(0, 10) : 'Never',
      nextRun: s.nextGenerationDate || '',
      status: s.status as 'active' | 'paused',
      deliveryMethod: 'email' as const,
    }));
    const backendNames = new Set(normalised.map((s: ScheduledReport) => s.name));
    const mockOnly = SCHEDULED_REPORTS.filter(s => !backendNames.has(s.name));
    return [...normalised, ...mockOnly];
  }, [backendScheduled]);

  const filteredTemplates = useMemo(() =>
    mergedTemplates.filter(t =>
      (selectedCategory === 'all' || t.category === selectedCategory) &&
      (t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [selectedCategory, searchTerm, mergedTemplates]);

  const handleGenerate = useCallback((templateId: string) => {
    setGenerating(templateId);
    // Map template ID to backend report type
    const typeMap: Record<string, string> = {
      'exec-summary': 'kpi', 'incident-detail': 'incident',
      'compliance-audit': 'compliance', 'env-metrics': 'custom',
      'training-status': 'training', 'audit-findings': 'audit',
    };
    const reportType = typeMap[templateId] || 'kpi';
    generateReportMutation.mutate(
      { type: reportType, format: 'json' },
      {
        onSettled: () => {
          generateExecutivePDF(templateId, liveKPIs ?? undefined, liveIncidents ?? undefined);
          const template = mergedTemplates.find(t => t.id === templateId);
          const newReport: GeneratedReport = {
            id: `gen-${Date.now()}`,
            name: `${template?.name || 'Report'} — ${new Date().toLocaleDateString()}`,
            generatedAt: new Date().toLocaleString(),
            size: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
            pages: Math.floor(Math.random() * 12 + 6),
            status: 'complete',
          };
          setGeneratedList(prev => [newReport, ...prev]);
          setGenerating(null);
        },
      }
    );
  }, [generateReportMutation, liveKPIs, liveIncidents, mergedTemplates]);

  /* ── Render Templates Tab ── */
  const renderTemplates = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'executive', 'incident', 'compliance', 'environmental', 'training', 'audit'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800/40 text-slate-400 border border-slate-700/30 hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Template Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => {
          const Icon = categoryIcons[template.category] || FileText;
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:border-cyan-500/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${categoryColors[template.category]} bg-opacity-20`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  template.status === 'active' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    : template.status === 'paused' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                    : 'text-slate-400 bg-slate-500/10 border-slate-500/30'
                }`}>
                  {template.status}
                </span>
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">{template.name}</h3>
              <p className="text-slate-400 text-xs mb-3 line-clamp-2">{template.description}</p>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {template.sections.map(s => (
                  <span key={s} className="text-[10px] px-2 py-0.5 bg-slate-700/40 text-slate-300 rounded-full">{s}</span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {template.frequency}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {template.recipients.length} recipients</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleGenerate(template.id)}
                  disabled={generating === template.id}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-xs font-medium hover:from-cyan-500/30 hover:to-blue-500/30 transition-all disabled:opacity-50"
                >
                  {generating === template.id ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                  ) : (
                    <><Download className="w-3.5 h-3.5" /> Generate PDF</>
                  )}
                </button>
                <button
                  onClick={() => { setPreviewTemplate(template.id); setActiveTab('preview'); }}
                  className="px-3 py-2 bg-slate-700/40 border border-slate-600/30 text-slate-300 rounded-lg text-xs hover:text-white transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  /* ── Render Scheduled Tab ── */
  const renderScheduled = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">{scheduledList.length} scheduled reports configured</p>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-xs font-medium hover:bg-cyan-500/30 transition-all">
          <Plus className="w-3.5 h-3.5" /> New Schedule
        </button>
      </div>

      {scheduledList.map(sched => (
        <motion.div
          key={sched.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-semibold text-sm">{sched.name}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                sched.status === 'active' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
              }`}>
                {sched.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {sched.frequency}{sched.dayOfWeek ? ` — ${sched.dayOfWeek}` : ''}{sched.dayOfMonth ? ` — Day ${sched.dayOfMonth}` : ''}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {sched.time}</span>
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {sched.deliveryMethod}</span>
              <span className="flex items-center gap-1"><Send className="w-3 h-3" /> {sched.recipients.length} recipients</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <p className="text-slate-500">Last Sent</p>
              <p className="text-white">{sched.lastSent}</p>
            </div>
            <div>
              <p className="text-slate-500">Next Run</p>
              <p className="text-cyan-300">{sched.nextRun}</p>
            </div>
          <div className="flex gap-1.5">
              <button
                onClick={() => {
                  const numId = parseInt(sched.id, 10);
                  if (!isNaN(numId)) {
                    const newStatus = sched.status === 'active' ? 'paused' : 'active';
                    toggleScheduleMutation.mutate({ id: numId, status: newStatus });
                  }
                }}
                className="p-2 bg-slate-700/40 rounded-lg text-slate-300 hover:text-white transition">
                {sched.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button className="p-2 bg-slate-700/40 rounded-lg text-slate-300 hover:text-white transition">
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleGenerate(sched.templateId)}
                className="p-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-300 hover:bg-cyan-500/30 transition"
              >
                <Zap className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  /* ── Render History Tab ── */
  const renderHistory = () => (
    <div className="space-y-3">
      <p className="text-slate-400 text-sm">{generatedList.length} reports generated</p>
      {generatedList.map((report, idx) => (
        <motion.div
          key={report.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 flex items-center gap-4"
        >
          <div className={`p-2.5 rounded-lg ${report.status === 'complete' ? 'bg-emerald-500/20' : report.status === 'generating' ? 'bg-cyan-500/20' : 'bg-red-500/20'}`}>
            {report.status === 'complete' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : report.status === 'generating' ? <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
          </div>
          <div className="flex-1">
            <h4 className="text-white text-sm font-medium">{report.name}</h4>
            <p className="text-slate-400 text-xs">{report.generatedAt} • {report.pages} pages • {report.size}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleGenerate('exec-summary')}
              className="p-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-300 hover:bg-cyan-500/30 transition"
              title="Re-generate"
            >
              <Download className="w-4 h-4" />
            </button>
            <button className="p-2 bg-slate-700/40 rounded-lg text-slate-300 hover:text-white transition" title="Print">
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );

  /* ── Render Preview Tab ── */
  const renderPreview = () => {
    const template = REPORT_TEMPLATES.find(t => t.id === previewTemplate) || REPORT_TEMPLATES[0];
    const kpis = Object.values(EHS_KPI_DATA);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <select
            value={previewTemplate}
            onChange={e => setPreviewTemplate(e.target.value)}
            className="bg-slate-800/60 border border-slate-700/50 rounded-lg text-white text-sm px-3 py-2 focus:outline-none focus:border-cyan-500/50"
          >
            {REPORT_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button
            onClick={() => handleGenerate(previewTemplate)}
            disabled={generating === previewTemplate}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50"
          >
            {generating === previewTemplate ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF
          </button>
        </div>

        {/* PDF Preview — dark themed mockup */}
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-6 space-y-6">
          {/* Header mockup */}
          <div className="bg-slate-950 rounded-lg p-5 border border-cyan-500/20">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-white">SafetyMEG</h2>
                <p className="text-cyan-400 text-xs tracking-widest mt-1">AUTOMATED EHS REPORT</p>
                <p className="text-white text-lg font-semibold mt-2">{template.name}</p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>Generated: {new Date().toLocaleDateString()}</p>
                <p>Report ID: RPT-2026-02-0042</p>
                <p className="text-amber-400 mt-1">CONFIDENTIAL</p>
              </div>
            </div>
          </div>

          {/* KPI Preview */}
          <div>
            <h3 className="text-cyan-400 font-bold text-sm mb-3">1. Key Performance Indicators</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {kpis.map(kpi => {
                const improved = kpi.value <= kpi.prev;
                const delta = ((kpi.value - kpi.prev) / kpi.prev * 100).toFixed(1);
                return (
                  <div key={kpi.label} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/30">
                    <p className="text-slate-400 text-[10px]">{kpi.label}</p>
                    <div className="flex items-end gap-2 mt-1">
                      <span className="text-white text-lg font-bold">{kpi.value}</span>
                      <span className={`text-xs flex items-center gap-0.5 ${improved ? 'text-emerald-400' : 'text-red-400'}`}>
                        {improved ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {Math.abs(Number(delta))}%
                      </span>
                    </div>
                    <p className="text-slate-500 text-[10px] mt-1">Target: {kpi.target}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Incident Trend Preview */}
          <div>
            <h3 className="text-cyan-400 font-bold text-sm mb-3">2. Incident Trend (6-Month)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    {['Month', 'Total', 'Recordable', 'Near Miss', 'Lost Time'].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-cyan-400 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INCIDENT_TREND.map((row, idx) => (
                    <tr key={row.month} className={idx % 2 === 0 ? 'bg-slate-800/30' : ''}>
                      <td className="py-1.5 px-3 text-white">{row.month}</td>
                      <td className="py-1.5 px-3 text-slate-300">{row.total}</td>
                      <td className="py-1.5 px-3 text-slate-300">{row.recordable}</td>
                      <td className="py-1.5 px-3 text-slate-300">{row.nearMiss}</td>
                      <td className="py-1.5 px-3 text-slate-300">{row.lostTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sections preview chips */}
          <div>
            <h3 className="text-cyan-400 font-bold text-sm mb-3">Report Sections</h3>
            <div className="flex flex-wrap gap-2">
              {template.sections.map(s => (
                <span key={s} className="px-3 py-1.5 bg-slate-800/60 border border-slate-700/30 rounded-lg text-xs text-slate-300 flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-cyan-400" /> {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white pb-24">


      <div className="max-w-7xl mx-auto px-4 pt-6 pb-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Automated PDF Reports
            </h1>
            <p className="text-slate-400 text-sm mt-1">Generate, schedule, and distribute professional EHS reports with real-time data</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleGenerate('exec-summary')}
              disabled={!!generating}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50"
            >
              {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Quick Generate
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Templates', value: REPORT_TEMPLATES.length, icon: FileText, color: 'cyan' },
            { label: 'Scheduled', value: scheduledList.filter(s => s.status === 'active').length, icon: Clock, color: 'emerald' },
            { label: 'Generated (MTD)', value: generatedList.length, icon: CheckCircle, color: 'purple' },
            { label: 'Recipients', value: 12, icon: Users, color: 'amber' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                <span className="text-2xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-slate-400 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'templates' && renderTemplates()}
            {activeTab === 'scheduled' && renderScheduled()}
            {activeTab === 'history' && renderHistory()}
            {activeTab === 'preview' && renderPreview()}
          </motion.div>
        </AnimatePresence>
      </div>


    </div>
  );
}

export default AutomatedPdfReports;
