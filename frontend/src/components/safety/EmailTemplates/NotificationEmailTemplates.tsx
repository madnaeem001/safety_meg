import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Send, Eye, Copy, CheckCircle2, AlertTriangle, Clock, 
  Bell, Shield, FileText, Users, Calendar, ChevronRight, X,
  Palette, Code, Smartphone, Monitor, Download
} from 'lucide-react';

// Email template types
type TemplateType = 'incident' | 'compliance' | 'training' | 'inspection' | 'general';

interface EmailTemplate {
  id: string;
  name: string;
  type: TemplateType;
  subject: string;
  description: string;
  variables: string[];
}

// Extended template types
type TemplateCategory = 'safety' | 'compliance' | 'operations' | 'communications';

interface ExtendedEmailTemplate extends EmailTemplate {
  category: TemplateCategory;
  isNew?: boolean;
}

// Predefined email templates - EXPANDED
const emailTemplates: ExtendedEmailTemplate[] = [
  // Original templates
  {
    id: 'incident-alert',
    name: 'Incident Alert Notification',
    type: 'incident',
    category: 'safety',
    subject: 'Safety Alert: New Incident Reported - {{incidentId}}',
    description: 'Notification sent when a new incident is reported',
    variables: ['incidentId', 'incidentType', 'location', 'severity', 'description', 'reportedBy', 'dateTime'],
  },
  {
    id: 'compliance-deadline',
    name: 'Compliance Deadline Reminder',
    type: 'compliance',
    category: 'compliance',
    subject: 'Compliance Reminder: {{itemName}} Due in {{daysRemaining}} Days',
    description: 'Reminder sent for upcoming compliance deadlines',
    variables: ['itemName', 'dueDate', 'daysRemaining', 'category', 'assignee', 'priority'],
  },
  {
    id: 'training-expiry',
    name: 'Training Certification Expiry',
    type: 'training',
    category: 'operations',
    subject: 'Training Alert: {{trainingName}} Certification Expiring',
    description: 'Alert sent when training certification is about to expire',
    variables: ['employeeName', 'trainingName', 'expiryDate', 'daysRemaining', 'renewalLink'],
  },
  {
    id: 'inspection-scheduled',
    name: 'Inspection Scheduled',
    type: 'inspection',
    category: 'operations',
    subject: 'Inspection Notice: {{inspectionType}} Scheduled for {{date}}',
    description: 'Notification for scheduled inspections',
    variables: ['inspectionType', 'date', 'time', 'location', 'inspector', 'checklist'],
  },
  {
    id: 'general-notification',
    name: 'General Safety Notification',
    type: 'general',
    category: 'communications',
    subject: '{{subject}}',
    description: 'General purpose safety notification template',
    variables: ['subject', 'message', 'actionRequired', 'link'],
  },
  // NEW TEMPLATES
  {
    id: 'audit-alert',
    name: 'Audit Alert',
    type: 'inspection',
    category: 'compliance',
    isNew: true,
    subject: 'Audit Alert: {{auditType}} Findings Require Attention',
    description: 'Notification for audit findings requiring corrective action',
    variables: ['auditType', 'auditDate', 'findings', 'criticalCount', 'majorCount', 'minorCount', 'dueDate', 'auditor'],
  },
  {
    id: 'emergency-broadcast',
    name: 'Emergency Broadcast',
    type: 'incident',
    category: 'safety',
    isNew: true,
    subject: '🚨 EMERGENCY ALERT: {{emergencyType}} at {{location}}',
    description: 'Critical emergency broadcast for immediate action',
    variables: ['emergencyType', 'location', 'instructions', 'evacuationPoint', 'emergencyContact', 'timeIssued'],
  },
  {
    id: 'weekly-digest',
    name: 'Weekly Safety Digest',
    type: 'general',
    category: 'communications',
    isNew: true,
    subject: 'Weekly Safety Digest - {{weekStart}} to {{weekEnd}}',
    description: 'Weekly summary of safety metrics, incidents, and upcoming items',
    variables: ['weekStart', 'weekEnd', 'incidentCount', 'nearMissCount', 'safetyScore', 'topHazards', 'upcomingTrainings', 'recognition'],
  },
  {
    id: 'training-reminder',
    name: 'Training Reminder',
    type: 'training',
    category: 'operations',
    isNew: true,
    subject: 'Training Reminder: {{trainingName}} on {{trainingDate}}',
    description: 'Reminder for upcoming training sessions',
    variables: ['trainingName', 'trainingDate', 'trainingTime', 'trainingLocation', 'trainer', 'duration', 'prerequisites', 'materialsLink'],
  },
  {
    id: 'permit-expiry',
    name: 'Permit Expiry Warning',
    type: 'compliance',
    category: 'compliance',
    isNew: true,
    subject: 'Permit Expiring: {{permitType}} - {{permitNumber}}',
    description: 'Warning notification for permits about to expire',
    variables: ['permitType', 'permitNumber', 'expiryDate', 'daysRemaining', 'renewalSteps', 'contactPerson', 'renewalCost'],
  },
  {
    id: 'capa-assignment',
    name: 'CAPA Assignment',
    type: 'compliance',
    category: 'compliance',
    isNew: true,
    subject: 'CAPA Assigned: {{capaId}} - {{capaTitle}}',
    description: 'Notification when a corrective/preventive action is assigned',
    variables: ['capaId', 'capaTitle', 'incidentRef', 'priority', 'dueDate', 'assignee', 'rootCause', 'requiredActions'],
  },
  {
    id: 'safety-observation',
    name: 'Safety Observation Report',
    type: 'incident',
    category: 'safety',
    isNew: true,
    subject: 'Safety Observation: {{observationType}} Reported',
    description: 'Notification for safety observations and near misses',
    variables: ['observationType', 'location', 'description', 'riskLevel', 'suggestedAction', 'observer', 'dateObserved'],
  },
  {
    id: 'equipment-maintenance',
    name: 'Equipment Maintenance Due',
    type: 'inspection',
    category: 'operations',
    isNew: true,
    subject: 'Maintenance Due: {{equipmentName}} - {{maintenanceType}}',
    description: 'Reminder for scheduled equipment maintenance',
    variables: ['equipmentName', 'equipmentId', 'maintenanceType', 'dueDate', 'lastMaintenance', 'technician', 'checklist'],
  },
  {
    id: 'environmental-alert',
    name: 'Environmental Alert',
    type: 'compliance',
    category: 'compliance',
    isNew: true,
    subject: 'Environmental Alert: {{alertType}} Detected',
    description: 'Notification for environmental monitoring alerts',
    variables: ['alertType', 'location', 'measurement', 'threshold', 'exceedancePercent', 'requiredAction', 'reportingDeadline'],
  },
  {
    id: 'shift-handover',
    name: 'Shift Handover Summary',
    type: 'general',
    category: 'operations',
    isNew: true,
    subject: 'Shift Handover: {{shiftType}} Shift - {{date}}',
    description: 'End of shift summary for incoming team',
    variables: ['shiftType', 'date', 'outgoingSupervisor', 'openIssues', 'completedTasks', 'safetyNotes', 'equipmentStatus', 'handoverNotes'],
  },
];

// Sample variable values for preview - EXPANDED
const sampleVariables: Record<string, string> = {
  // Original variables
  incidentId: 'INC-2026-028',
  incidentType: 'Near Miss',
  location: 'Warehouse B - Loading Dock',
  severity: 'Medium',
  description: 'Forklift operator narrowly avoided collision with pedestrian',
  reportedBy: 'John Smith',
  dateTime: 'January 25, 2026 at 2:30 PM',
  itemName: 'Fire Extinguisher Inspection',
  dueDate: 'January 31, 2026',
  daysRemaining: '6',
  category: 'Safety',
  assignee: 'Safety Team',
  priority: 'High',
  employeeName: 'Sarah Johnson',
  trainingName: 'HAZWOPER',
  expiryDate: 'February 10, 2026',
  renewalLink: 'https://training.safetymeg.com/renew',
  inspectionType: 'Monthly SWPPP',
  date: 'January 28, 2026',
  time: '9:00 AM',
  inspector: 'Mike Davis',
  checklist: 'Storm Water Inspection Checklist',
  subject: 'Safety Update',
  message: 'Important safety announcement',
  actionRequired: 'Please review and acknowledge',
  link: 'https://safetymeg.com/safety-update',
  // NEW variables for expanded templates
  auditType: 'ISO 45001 Compliance',
  auditDate: 'January 23, 2026',
  findings: '3 critical, 5 major, 12 minor findings',
  criticalCount: '3',
  majorCount: '5',
  minorCount: '12',
  auditor: 'External Audit Team',
  emergencyType: 'Chemical Spill',
  instructions: 'Evacuate immediately via nearest exit. Do not use elevators.',
  evacuationPoint: 'Assembly Point B - North Parking Lot',
  emergencyContact: '555-0199',
  timeIssued: '2:45 PM',
  weekStart: 'January 19, 2026',
  weekEnd: 'January 25, 2026',
  incidentCount: '2',
  nearMissCount: '5',
  safetyScore: '94.5%',
  topHazards: 'Slip hazards (3), Electrical (2), Fall risks (1)',
  upcomingTrainings: 'Forklift Certification (Jan 28), Fire Safety (Jan 30)',
  recognition: 'John Smith - 1000 days without incident',
  trainingDate: 'January 30, 2026',
  trainingTime: '9:00 AM - 12:00 PM',
  trainingLocation: 'Training Room A, Building 2',
  trainer: 'Safety Training Institute',
  duration: '3 hours',
  prerequisites: 'Complete online module, bring safety glasses',
  materialsLink: 'https://training.safetymeg.com/materials',
  permitType: 'Hot Work Permit',
  permitNumber: 'HWP-2026-089',
  renewalSteps: '1. Submit application 2. Complete inspection 3. Pay renewal fee',
  contactPerson: 'Permits Office - ext. 2345',
  renewalCost: '$150',
  capaId: 'CAPA-2026-015',
  capaTitle: 'Install additional guard rails in loading area',
  incidentRef: 'INC-2026-025',
  rootCause: 'Missing fall protection at elevated platform',
  requiredActions: '1. Install guard rails 2. Update procedures 3. Train staff',
  observationType: 'Positive Safety Behavior',
  riskLevel: 'Low',
  suggestedAction: 'Recognize team for proper PPE usage',
  observer: 'Shift Supervisor',
  dateObserved: 'January 25, 2026',
  equipmentName: 'Forklift #FL-007',
  equipmentId: 'FL-007',
  maintenanceType: 'Quarterly Inspection',
  lastMaintenance: 'October 28, 2025',
  technician: 'Maintenance Team A',
  alertType: 'Air Quality Exceedance',
  measurement: '85 ppm VOC',
  threshold: '50 ppm',
  exceedancePercent: '70%',
  reportingDeadline: '48 hours',
  shiftType: 'Day',
  outgoingSupervisor: 'Mike Johnson',
  openIssues: '2 open work orders, 1 pending inspection',
  completedTasks: '15 of 18 scheduled tasks completed',
  safetyNotes: 'Wet floor in aisle 3 - caution signs placed',
  equipmentStatus: 'All equipment operational',
  handoverNotes: 'Night shift to complete painting in Zone B',
};

interface NotificationEmailTemplatesProps {
  onBack?: () => void;
}

export const NotificationEmailTemplates: React.FC<NotificationEmailTemplatesProps> = ({ onBack }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ExtendedEmailTemplate | null>(emailTemplates[0]);
  const [filterCategory, setFilterCategory] = useState<TemplateCategory | 'all'>('all');
  const [showNewOnly, setShowNewOnly] = useState(false);

  const filteredTemplates = emailTemplates.filter(template => {
    if (filterCategory !== 'all' && template.category !== filterCategory) return false;
    if (showNewOnly && !template.isNew) return false;
    return true;
  });
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const getTypeColor = (type: TemplateType) => {
    switch (type) {
      case 'incident': return 'bg-red-100 text-red-700 border-red-200';
      case 'compliance': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'training': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'inspection': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'general': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: TemplateType) => {
    switch (type) {
      case 'incident': return <AlertTriangle className="w-4 h-4" />;
      case 'compliance': return <Shield className="w-4 h-4" />;
      case 'training': return <Users className="w-4 h-4" />;
      case 'inspection': return <FileText className="w-4 h-4" />;
      case 'general': return <Bell className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  // Replace variables in template
  const replaceVariables = (text: string): string => {
    let result = text;
    Object.entries(sampleVariables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  };

  // Generate email HTML
  const generateEmailHTML = (template: EmailTemplate): string => {
    const typeColors: Record<TemplateType, { primary: string; bg: string; border: string }> = {
      incident: { primary: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
      compliance: { primary: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
      training: { primary: '#9333ea', bg: '#faf5ff', border: '#e9d5ff' },
      inspection: { primary: '#d97706', bg: '#fffbeb', border: '#fde68a' },
      general: { primary: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
    };
    const colors = typeColors[template.type];

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${replaceVariables(template.subject)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${colors.primary}, ${colors.primary}dd); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">safetyMEG</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Intelligent Safety Management</p>
            </td>
          </tr>
          
          <!-- Alert Banner -->
          <tr>
            <td style="background: ${colors.bg}; padding: 16px 32px; border-bottom: 2px solid ${colors.border};">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="color: ${colors.primary}; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${template.type.toUpperCase()} NOTIFICATION
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 20px; font-weight: 600;">
                ${replaceVariables(template.subject)}
              </h2>
              
              <p style="margin: 0 0 24px; color: #64748b; font-size: 15px; line-height: 1.6;">
                ${template.description}
              </p>
              
              <!-- Details Box -->
              <table role="presentation" style="width: 100%; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    ${template.variables.slice(0, 4).map(v => `
                      <table role="presentation" style="width: 100%; margin-bottom: 12px;">
                        <tr>
                          <td style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">
                            ${v.replace(/([A-Z])/g, ' $1').toUpperCase()}
                          </td>
                        </tr>
                        <tr>
                          <td style="color: #1e293b; font-size: 15px; font-weight: 500;">
                            ${sampleVariables[v] || `{{${v}}}`}
                          </td>
                        </tr>
                      </table>
                    `).join('')}
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="#" style="display: inline-block; padding: 14px 32px; background: ${colors.primary}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                      View Details
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px; color: #64748b; font-size: 13px;">
                      This is an automated notification from safetyMEG EHS Platform
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      © ${new Date().getFullYear()} safetyMEG - Intelligent Safety Management
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const copyToClipboard = () => {
    if (selectedTemplate) {
      navigator.clipboard.writeText(generateEmailHTML(selectedTemplate));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadTemplate = () => {
    if (selectedTemplate) {
      const html = generateEmailHTML(selectedTemplate);
      const blob = new Blob([html], { type: 'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${selectedTemplate.id}-template.html`;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/80 rounded-xl transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
            )}
            <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Email Templates</h1>
              <p className="text-sm text-slate-500">Notification email templates for alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as TemplateCategory | 'all')}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Categories</option>
              <option value="safety">Safety</option>
              <option value="compliance">Compliance</option>
              <option value="operations">Operations</option>
              <option value="communications">Communications</option>
            </select>
            <button
              onClick={() => setShowNewOnly(!showNewOnly)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                showNewOnly ? 'bg-orange-100 text-orange-700' : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              New Only
            </button>
            <button
              onClick={copyToClipboard}
              disabled={!selectedTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm disabled:opacity-50"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy HTML'}
            </button>
            <button
              onClick={downloadTemplate}
              disabled={!selectedTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Available Templates</h3>
              <span className="text-xs text-slate-500">{filteredTemplates.length} templates</span>
            </div>
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelectedTemplate(template)}
                className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border-2 ${
                  selectedTemplate?.id === template.id ? 'border-orange-500' : 'border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(template.type)}`}>
                    {getTypeIcon(template.type)}
                    {template.type}
                  </span>
                  {template.isNew && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      NEW
                    </span>
                  )}
                </div>
                </div>
                <h4 className="font-semibold text-slate-800 mb-1">{template.name}</h4>
                <p className="text-sm text-slate-500 line-clamp-2">{template.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            {selectedTemplate ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Preview Controls */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCode(false)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        !showCode ? 'bg-orange-100 text-orange-700' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <button
                      onClick={() => setShowCode(true)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        showCode ? 'bg-orange-100 text-orange-700' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Code className="w-4 h-4" />
                      HTML Code
                    </button>
                  </div>
                  {!showCode && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewMode('desktop')}
                        className={`p-2 rounded-lg transition-all ${
                          previewMode === 'desktop' ? 'bg-slate-200' : 'hover:bg-slate-100'
                        }`}
                      >
                        <Monitor className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPreviewMode('mobile')}
                        className={`p-2 rounded-lg transition-all ${
                          previewMode === 'mobile' ? 'bg-slate-200' : 'hover:bg-slate-100'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Preview Content */}
                <div className={`bg-slate-100 p-6 ${showCode ? '' : 'flex justify-center'}`}>
                  {showCode ? (
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs overflow-x-auto max-h-[500px]">
                      <code>{generateEmailHTML(selectedTemplate)}</code>
                    </pre>
                  ) : (
                    <div
                      className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all ${
                        previewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-[600px]'
                      }`}
                    >
                      <iframe
                        srcDoc={generateEmailHTML(selectedTemplate)}
                        className="w-full h-[500px] border-0"
                        title="Email Preview"
                      />
                    </div>
                  )}
                </div>

                {/* Template Variables */}
                <div className="p-4 border-t border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3">Template Variables</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((variable) => (
                      <span
                        key={variable}
                        className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-mono"
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
                <Mail className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Select a Template</h3>
                <p className="text-slate-500">Choose a template from the list to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationEmailTemplates;
